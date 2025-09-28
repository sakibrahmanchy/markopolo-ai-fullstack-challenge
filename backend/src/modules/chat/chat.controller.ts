import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  async createConversation(
    @Request() req: any,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    console.log('=== createConversation called ===');
    console.log('createConversation - req.user:', req.user);
    console.log('createConversation - auth header:', req.headers.authorization);
    
    // Extract user ID from JWT token manually
    let userId = 'anonymous';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
        userId = payload.sub || 'anonymous';
        console.log('createConversation - extracted userId from token:', userId);
      } catch (error) {
        console.log('createConversation - error verifying token:', error.message);
        userId = 'anonymous';
      }
    }
    
    console.log('createConversation - final userId:', userId);
    const result = await this.chatService.createConversation(userId, createConversationDto);
    console.log('createConversation - result:', result);
    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all conversations for the user' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(@Request() req: any) {
    const userId = req.user?.id || 'anonymous';
    return await this.chatService.getConversations(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific conversation with messages' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  async getConversation(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id || 'anonymous';
    return await this.chatService.getConversation(userId, id);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message to a conversation' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(@CurrentUser() userId: string, @Body() sendMessageDto: SendMessageDto) {
    return await this.chatService.sendMessage(userId, sendMessageDto);
  }

  @Get(':id/stream')
  @ApiOperation({ summary: 'Stream AI response for a conversation' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events stream' })
  async streamResponse(
    @CurrentUser() userId: string,
    @Param('id') conversationId: string,
    @Res() res: Response,
  ) {
    // Get the last user message from the conversation
    const conversation = await this.chatService.getConversation(userId, conversationId);
    const lastUserMessage = conversation.messages
      .filter(m => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'No user message found in conversation',
      });
    }

    await this.chatService.streamAIResponse(
      userId,
      conversationId,
      lastUserMessage.content,
      res,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  async deleteConversation(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id || 'anonymous';
    await this.chatService.deleteConversation(userId, id);
    return { message: 'Conversation deleted successfully' };
  }

}
