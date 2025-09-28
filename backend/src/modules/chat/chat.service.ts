import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../entities/conversation.entity';
import { Message } from '../../entities/message.entity';
import { User } from '../../entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AIService } from '../ai/ai.service';
import { Response } from 'express';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private aiService: AIService,
  ) {}

  async createConversation(userId: string, createConversationDto: CreateConversationDto): Promise<Conversation> {
    // For anonymous users, we don't need to check if user exists
    if (userId !== 'anonymous') {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const conversation = this.conversationRepository.create({
      title: createConversationDto.title,
      userId: userId === 'anonymous' ? null : userId,
    });

    return await this.conversationRepository.save(conversation);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { userId: userId === 'anonymous' ? null : userId },
      order: { updatedAt: 'DESC' },
      relations: ['messages'],
    });
  }

  async getConversation(userId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId: userId === 'anonymous' ? null : userId },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<Message> {
    let conversation: Conversation;

    if (sendMessageDto.conversationId) {
      conversation = await this.conversationRepository.findOne({
        where: { id: sendMessageDto.conversationId, userId: userId === 'anonymous' ? null : userId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
    } else {
      // Create new conversation if none provided
      conversation = await this.createConversation(userId, {
        title: sendMessageDto.content.substring(0, 50) + '...',
      });
    }

    // Save user message
    const userMessage = this.messageRepository.create({
      content: sendMessageDto.content,
      role: 'user',
      conversationId: conversation.id,
    });

    const savedUserMessage = await this.messageRepository.save(userMessage);

    // Update conversation timestamp
    await this.conversationRepository.update(conversation.id, {
      updatedAt: new Date(),
    });

    return savedUserMessage;
  }

  async streamAIResponse(
    userId: string,
    conversationId: string,
    userMessage: string,
    res: Response,
  ): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId: userId === 'anonymous' ? null : userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    try {
      // Get conversation history for context
      const messages = await this.messageRepository.find({
        where: { conversationId },
        order: { createdAt: 'ASC' },
        take: 10, // Last 10 messages for context
      });

      // Create AI message placeholder
      const aiMessage = this.messageRepository.create({
        content: '',
        role: 'assistant',
        conversationId,
      });

      const savedAiMessage = await this.messageRepository.save(aiMessage);

      try {
        // Build context for AI
        const context = await this.buildAIContext(userId, conversation);
        
        // Analyze user intent first
        console.log('Analyzing intent for message:', userMessage);
        try {
          const intentAnalysis = await this.getIntentAnalysis(userMessage);
          console.log('Intent analysis result:', intentAnalysis);
          
          // Send intent analysis to frontend
          res.write(`data: ${JSON.stringify({ 
            type: 'intent', 
            data: {
              intent: intentAnalysis.intent,
              confidence: intentAnalysis.confidence,
              requiresAuth: intentAnalysis.requiresAuth,
              module: intentAnalysis.module,
              action: intentAnalysis.action,
              entities: intentAnalysis.entities,
              userContext: {
                isAuthenticated: userId !== 'anonymous',
                userId: userId,
                needsAuth: intentAnalysis.requiresAuth && userId === 'anonymous'
              }
            }
          })}\n\n`);
        } catch (error) {
          console.error('Error in intent analysis:', error);
          // Send fallback intent analysis
          res.write(`data: ${JSON.stringify({ 
            type: 'intent', 
            data: {
              intent: 'general',
              confidence: 0.5,
              requiresAuth: false,
              module: 'general',
              action: 'view',
              entities: {},
              userContext: {
                isAuthenticated: userId !== 'anonymous',
                userId: userId,
                needsAuth: false
              }
            }
          })}\n\n`);
        }
        
        // Check if this is a campaign-related query for authenticated users
        if (userId !== 'anonymous' && this.isCampaignQuery(userMessage)) {
          try {
            // Generate campaign recommendations based on user's data
            const campaignRecommendations = await this.aiService.generateCampaignRecommendations(userMessage, userId);
            console.log({
              campaignRecommendations: campaignRecommendations.data
            })
            // Stream campaign recommendations
            res.write(`data: ${JSON.stringify({ type: 'campaign_recommendation', data: campaignRecommendations })}\n\n`);
            
            // If no data sources, don't generate AI response
            if (campaignRecommendations.type === 'no_data_sources') {
              await this.messageRepository.update(savedAiMessage.id, {
                content: campaignRecommendations.message,
              });
              res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
              res.end();
              return;
            }
          } catch (error) {
            console.error('Error generating campaign recommendations:', error);
          }
        } else {
          // Stream AI response using the AI service
          await this.aiService.streamResponse(
            userMessage,
            context,
            (chunk: string) => {
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
            },
            (recommendation: any) => {
              res.write(`data: ${JSON.stringify({ type: 'recommendation', data: recommendation })}\n\n`);
            },
            (campaign: any) => {
              res.write(`data: ${JSON.stringify({ type: 'campaign', data: campaign })}\n\n`);
            },
            async (fullResponse: string) => {
              // Update the AI message with the complete response
              await this.messageRepository.update(savedAiMessage.id, {
                content: fullResponse,
              });

              // Update conversation timestamp
              await this.conversationRepository.update(conversationId, {
                updatedAt: new Date(),
              });

              res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
              res.end();
            },
          );
        }

        
      } catch (aiError) {
        console.error('AI service error:', aiError);
        // Simple response when AI service is not available
        const fallbackResponse = `I understand you're asking about "${userMessage}". I'm here to help with your marketing campaigns and data analysis.`;
        
        await this.messageRepository.update(savedAiMessage.id, {
          content: fallbackResponse,
        });

        await this.conversationRepository.update(conversationId, {
          updatedAt: new Date(),
        });

        res.write(`data: ${JSON.stringify({ type: 'chunk', content: fallbackResponse })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error('Error streaming AI response:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate response' })}\n\n`);
      res.end();
    }
  }

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId: userId === 'anonymous' ? null : userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Delete all messages first
    await this.messageRepository.delete({ conversationId });
    
    // Delete conversation
    await this.conversationRepository.delete(conversationId);
  }

  private isCampaignQuery(userMessage: string): boolean {
    const campaignKeywords = [
      'campaign', 'marketing', 'email', 'sms', 'push', 'whatsapp',
      'audience', 'segment', 'target', 'recommend', 'suggest',
      'abandoned cart', 'retarget', 're-engage', 'conversion',
      'funnel', 'lead', 'customer', 'visitor', 'analytics',
      'data', 'insights', 'performance', 'roi', 'engagement'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    return campaignKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private async buildAIContext(userId: string, conversation: Conversation): Promise<any> {
    const context: any = {
      userId,
      conversationId: conversation.id,
      conversationHistory: conversation.messages,
      timestamp: new Date(),
      dataSources: [],
      campaigns: [],
      user: null,
    };

    // If user is not anonymous, fetch their data
    if (userId !== 'anonymous') {
      try {
        // Get user data
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user) {
          context.user = {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          };
        }

        // TODO: In a real implementation, you would fetch:
        // - Connected data sources (GTM, Facebook, Shopify)
        // - Active campaigns
        // - Recent analytics data
        // - User preferences
        
        // For now, we'll simulate some data based on the user
        context.dataSources = []; // Would be fetched from DataSourceService
        context.campaigns = []; // Would be fetched from CampaignService
        
      } catch (error) {
        console.error('Error building AI context:', error);
        // Continue with basic context
      }
    }

    return context;
  }

  async getIntentAnalysis(userMessage: string): Promise<any> {
    // Use AI service to analyze intent
    return await this.aiService.analyzeIntent(userMessage);
  }
}
