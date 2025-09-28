import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { AIProvider, Recommendation, ParsedQuery, GeneratedContent, AnalysisResult, FeedbackData, ProviderInfo, IntentAnalysis } from '../interfaces/ai-provider.interface';

@Injectable()
export class GPTProvider implements AIProvider {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateRecommendations(query: string, context: any): Promise<Recommendation[]> {
    const prompt = this.buildRecommendationPrompt(query, context);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: 'You are an AI marketing expert that provides data-driven recommendations for multi-channel campaigns. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsedResponse = JSON.parse(content);
      return this.formatRecommendations(parsedResponse);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  async parseQuery(query: string): Promise<ParsedQuery> {
    const prompt = `Parse this marketing query and extract intent and entities: "${query}"
    
    Return JSON with:
    - intent: the main goal (e.g., "cart_abandonment", "customer_segmentation", "campaign_optimization")
    - entities: key information (e.g., timeframes, audience types, channels)
    - context: additional context for recommendations`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4'),
        messages: [
          {
            role: 'system',
            content: 'You are an expert at parsing marketing queries. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing query:', error);
      return {
        intent: 'general',
        entities: {},
        context: {},
      };
    }
  }

  async generateContent(prompt: string, context: any): Promise<GeneratedContent> {
    const systemPrompt = `You are a marketing content expert. Generate compelling, personalized content for marketing campaigns. Always respond with valid JSON containing the content and metadata.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4'),
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      console.log({
        content
      })
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Extract JSON from markdown if present
      let jsonContent = content;
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      } else if (content.includes('```')) {
        const jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      }

      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

  async analyzeData(data: any, analysisType: string): Promise<AnalysisResult> {
    const prompt = `Analyze this marketing data for ${analysisType}: ${JSON.stringify(data)}
    
    Provide insights, metrics, and recommendations in JSON format.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4'),
        messages: [
          {
            role: 'system',
            content: 'You are a data analyst specializing in marketing metrics. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Extract JSON from markdown if present
      let jsonContent = content;
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      } else if (content.includes('```')) {
        const jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      }

      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Error analyzing data:', error);
      throw new Error('Failed to analyze data');
    }
  }

  async analyzeIntent(userMessage: string): Promise<IntentAnalysis> {
    const prompt = `Analyze this user message and determine which module it relates to. 

Available modules:
- campaigns: For campaign management, performance, creation, editing
- analytics: For data analysis, performance metrics, reporting, insights
- sources: For data source connections (GTM, Facebook Pixel, Shopify)
- recommendations: For AI recommendations, suggestions, advice
- general: For general questions, help, greetings

Return ONLY a JSON response with this exact structure:
{
  "intent": "campaign_management" | "data_analytics" | "data_sources" | "recommendations" | "general",
  "confidence": 0.0-1.0,
  "requiresAuth": true | false,
  "module": "campaigns" | "analytics" | "sources" | "recommendations" | "general",
  "action": "view" | "create" | "update" | "delete" | "analyze" | "connect" | "recommend",
  "entities": {
    "campaignName": "string or null",
    "dataSource": "string or null", 
    "timeframe": "string or null"
  }
}

User message: "${userMessage}"`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4'),
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing user intent for a marketing platform. Always respond with valid JSON only. Do not include any other text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      
      // Validate the response has the required fields
      if (!result.module || !result.intent) {
        throw new Error('Invalid response format');
      }
      
      return result as IntentAnalysis;
    } catch (error) {
      console.error('Error analyzing user intent:', error);
      // Fallback to general intent
      return {
        intent: 'general',
        confidence: 0.5,
        requiresAuth: false,
        module: 'general',
        action: 'view',
        entities: {}
      };
    }
  }

  async streamResponse(
    userMessage: string,
    context: any,
    onChunk: (chunk: string) => void,
    onRecommendation: (recommendation: any) => void,
    onCampaign: (campaign: any) => void,
    onComplete: (fullResponse: string) => void,
  ): Promise<void> {
    // First, analyze user intent to determine required module
    const intentAnalysis = await this.analyzeUserIntent(userMessage);
    
    // Check if authentication is required and user is anonymous
    if (intentAnalysis.requiresAuth && context.userId === 'anonymous') {
      // Don't generate AI response for auth-required features when user is anonymous
      // Just complete immediately - the frontend will show the auth prompt based on intent
      onComplete('');
      return;
    }
    
    // Build system prompt based on intent
    const systemPrompt = this.buildIntentBasedSystemPrompt(intentAnalysis);
    
    try {
      const stream = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4'),
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });

      let fullResponse = '';
      let currentChunk = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          currentChunk += content;
          
          // Send chunks when we hit sentence boundaries or every 50 characters
          if (content.includes('.') || content.includes('!') || content.includes('?') || currentChunk.length > 50) {
            onChunk(currentChunk);
            currentChunk = '';
          }
        }
      }

      // Send any remaining chunk
      if (currentChunk) {
        onChunk(currentChunk);
      }

      // Generate suggestions based on intent analysis
      await this.generateIntentBasedSuggestions(intentAnalysis, userMessage, fullResponse, context, onRecommendation, onCampaign);

      onComplete(fullResponse);
    } catch (error) {
      console.error('Error streaming response:', error);
      onChunk('I apologize, but I encountered an error while processing your request. Please try again.');
      onComplete('I apologize, but I encountered an error while processing your request. Please try again.');
    }
  }

  async learnFromFeedback(feedback: FeedbackData): Promise<void> {
    // GPT provider doesn't have built-in learning, but we can store feedback for future prompt improvements
    console.log('Feedback received for GPT provider:', feedback);
  }

  async updateContext(userId: string, context: any): Promise<void> {
    // GPT provider doesn't maintain user-specific context, but we can use this for prompt enhancement
    console.log('Context updated for user:', userId, context);
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: 'GPT Provider',
      version: '1.0.0',
      capabilities: ['recommendations', 'content_generation', 'query_parsing', 'data_analysis'],
      costPerRequest: 0.002, // Approximate cost per request
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private buildRecommendationPrompt(query: string, context: any): string {
    return `Based on this marketing query: "${query}"

    Context: ${JSON.stringify(context)}

    Provide marketing recommendations in JSON format with:
    - audience: target audience segmentation
    - channels: recommended communication channels (email, sms, push, whatsapp)
    - timing: optimal send times
    - content: content suggestions
    - reasoning: why these recommendations make sense

    Focus on data-driven insights and actionable recommendations.`;
  }

  private formatRecommendations(response: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (response.audience) {
      recommendations.push({
        id: uuidv4(),
        type: 'audience',
        data: response.audience,
        confidence: 0.85,
        reasoning: response.reasoning || 'Based on user behavior patterns',
      });
    }

    if (response.channels) {
      recommendations.push({
        id: uuidv4(),
        type: 'channel',
        data: response.channels,
        confidence: 0.80,
        reasoning: response.reasoning || 'Based on channel performance data',
      });
    }

    if (response.timing) {
      recommendations.push({
        id: uuidv4(),
        type: 'timing',
        data: response.timing,
        confidence: 0.75,
        reasoning: response.reasoning || 'Based on engagement patterns',
      });
    }

    if (response.content) {
      recommendations.push({
        id: uuidv4(),
        type: 'content',
        data: response.content,
        confidence: 0.90,
        reasoning: response.reasoning || 'Based on content performance data',
      });
    }

    return recommendations;
  }

  private async analyzeUserIntent(userMessage: string): Promise<any> {
    const prompt = `Analyze this user message and determine the intent and required module. Return a JSON response with:
    {
      "intent": "general" | "campaign_management" | "data_analytics" | "data_sources" | "recommendations" | "help",
      "confidence": 0.0-1.0,
      "requiresAuth": true/false,
      "module": "general" | "campaigns" | "analytics" | "sources" | "recommendations" | "help",
      "action": "view" | "create" | "update" | "delete" | "analyze" | "connect" | "recommend",
      "entities": {
        "campaignName": "string or null",
        "dataSource": "string or null",
        "timeframe": "string or null"
      }
    }
    
    User message: "${userMessage}"`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4'),
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing user intent for a marketing platform. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Extract JSON from markdown if present
      let jsonContent = content;
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      } else if (content.includes('```')) {
        const jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      }

      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Error analyzing user intent:', error);
      return {
        intent: 'general',
        confidence: 0.5,
        requiresAuth: false,
        module: 'general',
        action: 'view',
        entities: {}
      };
    }
  }

  private buildIntentBasedSystemPrompt(intentAnalysis: any): string {
    const { intent, module, action } = intentAnalysis;
    
    let systemPrompt = `You are PulseHub AI, an intelligent marketing assistant. `;
    
    switch (module) {
      case 'campaigns':
        systemPrompt += `The user is asking about campaign management. Provide helpful information about campaigns, campaign performance, and campaign optimization. `;
        break;
      case 'analytics':
        systemPrompt += `The user is asking about data analytics and performance metrics. Provide insights about data analysis, KPIs, and performance tracking. `;
        break;
      case 'sources':
        systemPrompt += `The user is asking about data sources. Provide information about connecting and managing data sources like GTM, Facebook Pixel, and Shopify. `;
        break;
      case 'recommendations':
        systemPrompt += `The user is asking for recommendations. Provide data-driven marketing recommendations and best practices. `;
        break;
      case 'help':
        systemPrompt += `The user needs help or guidance. Provide clear, helpful instructions and support. `;
        break;
      default:
        systemPrompt += `The user has a general question. Provide helpful, friendly assistance. `;
    }
    
    systemPrompt += `Always be helpful, professional, and provide actionable insights.`;
    
    return systemPrompt;
  }

  private async generateIntentBasedSuggestions(
    intentAnalysis: any,
    userMessage: string,
    aiResponse: string,
    context: any,
    onRecommendation: (recommendation: any) => void,
    onCampaign: (campaign: any) => void,
  ): Promise<void> {
    const { module, action, requiresAuth } = intentAnalysis;
    
    // Only generate suggestions if the module requires them and user is authenticated
    if (requiresAuth && context.userId === 'anonymous') {
      // Don't generate suggestions for anonymous users on auth-required modules
      return;
    }
    
    // Generate recommendations for recommendation module
    if (module === 'recommendations' && action === 'recommend') {
      const recommendations = await this.generateRecommendations(userMessage, context);
      recommendations.forEach(rec => onRecommendation(rec));
    }
    
    // Generate campaign suggestions for campaign module
    if (module === 'campaigns') {
      if (action === 'create') {
        onCampaign({
          id: 'create-campaign',
          name: 'Create New Campaign',
          description: 'Start a new marketing campaign',
          action: 'create',
          type: 'guidance'
        });
      } else {
        const campaignSuggestions = this.generateCampaignSuggestions(userMessage, context);
        campaignSuggestions.forEach(campaign => onCampaign(campaign));
      }
    }
  }

  private shouldGenerateRecommendations(userMessage: string, aiResponse: string): boolean {
    const message = userMessage.toLowerCase();
    const response = aiResponse.toLowerCase();
    
    // Keywords that indicate the user wants recommendations
    const recommendationKeywords = [
      'recommend', 'suggestion', 'advice', 'help', 'what should', 'how should',
      'best practice', 'strategy', 'optimize', 'improve', 'better', 'tips',
      'guidance', 'direction', 'next steps', 'action', 'plan'
    ];
    
    // Check if user is asking for recommendations
    const userWantsRecommendations = recommendationKeywords.some(keyword => 
      message.includes(keyword)
    );
    
    // Check if AI response suggests recommendations would be helpful
    const responseSuggestsRecommendations = response.includes('recommend') || 
      response.includes('suggest') || 
      response.includes('consider') ||
      response.includes('strategy') ||
      response.includes('optimization');
    
    // Check if it's a marketing-related question that would benefit from recommendations
    const isMarketingQuestion = message.includes('marketing') || 
      message.includes('campaign') || 
      message.includes('audience') || 
      message.includes('channel') || 
      message.includes('conversion') ||
      message.includes('engagement') ||
      message.includes('retention') ||
      message.includes('growth');
    
    // Only show recommendations if:
    // 1. User explicitly asks for them, OR
    // 2. AI response suggests they would be helpful, OR  
    // 3. It's a marketing question that would benefit from recommendations
    return userWantsRecommendations || responseSuggestsRecommendations || isMarketingQuestion;
  }

  private generateCampaignSuggestions(userMessage: string, context: any): any[] {
    const suggestions = [];
    
    // Simple campaign suggestions based on common marketing scenarios
    if (userMessage.toLowerCase().includes('cart') || userMessage.toLowerCase().includes('abandon')) {
      suggestions.push({
        id: uuidv4(),
        name: 'Cart Abandonment Recovery',
        channels: ['email', 'push'],
        description: 'Re-engage customers who left items in their cart',
        estimatedROI: '15-25%',
      });
    }
    
    if (userMessage.toLowerCase().includes('welcome') || userMessage.toLowerCase().includes('onboard')) {
      suggestions.push({
        id: uuidv4(),
        name: 'Welcome Series Campaign',
        channels: ['email', 'sms'],
        description: 'Guide new users through onboarding process',
        estimatedROI: '20-30%',
      });
    }
    
    if (userMessage.toLowerCase().includes('retention') || userMessage.toLowerCase().includes('churn')) {
      suggestions.push({
        id: uuidv4(),
        name: 'Customer Retention Campaign',
        channels: ['email', 'push', 'whatsapp'],
        description: 'Prevent customer churn with targeted messaging',
        estimatedROI: '25-35%',
      });
    }
    
    // Default campaign suggestion
    if (suggestions.length === 0) {
      suggestions.push({
        id: uuidv4(),
        name: 'Multi-Channel Marketing Campaign',
        channels: ['email', 'sms', 'push'],
        description: 'Comprehensive campaign across multiple channels',
        estimatedROI: '10-20%',
      });
    }
    
    return suggestions;
  }
}
