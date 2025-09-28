import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { LearningService } from './learning.service';
import { GPTProvider } from './providers/gpt.provider';
import { RecommendationHistoryService } from './recommendation-history.service';
import { RecommendationHistory } from '../../entities/recommendation-history.entity';
import { AIProviderConfig } from '../../entities/ai-provider-config.entity';
import { DataEvent } from '../../entities/data-event.entity';
import { DataSource } from '../../entities/data-source.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecommendationHistory, AIProviderConfig, DataEvent, DataSource]),
    ConfigModule,
  ],
  controllers: [AIController],
  providers: [
    AIService,
    LearningService,
    RecommendationHistoryService,
    {
      provide: 'AI_PROVIDER',
      useClass: GPTProvider, // Default to GPT provider
    },
  ],
  exports: [AIService, LearningService],
})
export class AIModule {}
