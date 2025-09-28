import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendationHistory } from '../../entities/recommendation-history.entity';

@Injectable()
export class RecommendationHistoryService {
  constructor(
    @InjectRepository(RecommendationHistory)
    private recommendationHistoryRepository: Repository<RecommendationHistory>,
  ) {}

  async create(data: {
    userId: string;
    conversationId?: string;
    originalQuery: string;
    aiRecommendation: any[];
    aiProvider: string;
    context: any;
  }): Promise<RecommendationHistory> {
    const recommendationHistory = this.recommendationHistoryRepository.create({
      userId: data.userId,
      conversationId: data.conversationId,
      originalQuery: data.originalQuery,
      aiRecommendation: data.aiRecommendation,
      aiProvider: data.aiProvider,
      context: data.context,
    });

    return await this.recommendationHistoryRepository.save(recommendationHistory);
  }

  async findByUserId(userId: string): Promise<RecommendationHistory[]> {
    return await this.recommendationHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByConversationId(conversationId: string): Promise<RecommendationHistory[]> {
    return await this.recommendationHistoryRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateFeedback(id: string, feedback: any): Promise<void> {
    await this.recommendationHistoryRepository.update(id, {
      userFeedback: {
        ...feedback,
        timestamp: new Date(),
      },
    });
  }

  async getAnalytics(userId: string): Promise<any> {
    const histories = await this.recommendationHistoryRepository.find({
      where: { userId },
    });

    const analytics = {
      totalRecommendations: histories.length,
      averageConfidence: 0,
      topRecommendationTypes: {},
      feedbackDistribution: {
        positive: 0,
        negative: 0,
        neutral: 0,
      },
    };

    if (histories.length > 0) {
      // Calculate average confidence
      const totalConfidence = histories.reduce((sum, h) => {
        const recommendations = Array.isArray(h.aiRecommendation) ? h.aiRecommendation : [];
        const avgConfidence = recommendations.reduce((s, r) => s + (r.confidence || 0), 0) / recommendations.length;
        return sum + (avgConfidence || 0);
      }, 0);
      analytics.averageConfidence = totalConfidence / histories.length;

      // Count recommendation types
      histories.forEach(h => {
        const recommendations = Array.isArray(h.aiRecommendation) ? h.aiRecommendation : [];
        recommendations.forEach(r => {
          analytics.topRecommendationTypes[r.type] = (analytics.topRecommendationTypes[r.type] || 0) + 1;
        });
      });

      // Count feedback distribution
      histories.forEach(h => {
        if (h.userFeedback && typeof h.userFeedback === 'object' && 'feedback' in h.userFeedback) {
          const feedback = h.userFeedback.feedback || 'neutral';
          analytics.feedbackDistribution[feedback] = (analytics.feedbackDistribution[feedback] || 0) + 1;
        }
      });
    }

    return analytics;
  }
}