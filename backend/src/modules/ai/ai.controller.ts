import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { LearningService } from './learning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProvideFeedbackDto } from './dto/provide-feedback.dto';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(
    private aiService: AIService,
    private learningService: LearningService,
  ) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get AI provider status' })
  @ApiResponse({ status: 200, description: 'Provider status retrieved successfully' })
  async getProviders() {
    const providerInfo = await this.aiService.getProviderInfo();
    const isHealthy = await this.aiService.isProviderHealthy();
    
    return [{
      id: 'gpt',
      name: providerInfo.name,
      isActive: isHealthy,
      config: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
      },
      performanceMetrics: {
        successRate: 95,
        averageResponseTime: 1200,
        costPerRequest: 0.002,
      },
    }];
  }

  @Get('recommendations/history')
  @ApiOperation({ summary: 'Get recommendation history' })
  @ApiResponse({ status: 200, description: 'Recommendation history retrieved successfully' })
  async getRecommendationHistory(
    @Request() req: any,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    // This would be implemented in the recommendation history service
    return {
      recommendations: [],
      total: 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
  }

  @Post('recommendations/:recommendationId/feedback')
  @ApiOperation({ summary: 'Provide feedback on recommendation' })
  @ApiResponse({ status: 200, description: 'Feedback submitted successfully' })
  async provideFeedback(
    @Request() req: any,
    @Body() feedbackDto: ProvideFeedbackDto,
  ) {
    await this.aiService.learnFromFeedback(feedbackDto.recommendationId, {
      feedback: feedbackDto.feedback,
      campaignResults: feedbackDto.campaignResults,
      timestamp: new Date(),
    });

    return { message: 'Feedback submitted successfully' };
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI insights and performance metrics' })
  @ApiResponse({ status: 200, description: 'Insights retrieved successfully' })
  async getInsights(@Request() req: any) {
    const patterns = await this.learningService.analyzeFeedbackPatterns();
    
    return {
      patterns,
      insights: [],
      performance: {},
    };
  }
}
