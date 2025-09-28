import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserSession } from '../entities/user-session.entity';
import { TokenBlacklist } from '../entities/token-blacklist.entity';
import { DataSource } from '../entities/data-source.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Campaign } from '../entities/campaign.entity';
import { CampaignChannel } from '../entities/campaign-channel.entity';
import { DataEvent } from '../entities/data-event.entity';
import { RecommendationHistory } from '../entities/recommendation-history.entity';
import { AIProviderConfig } from '../entities/ai-provider-config.entity';
import { OAuthSession } from '@/entities/oauth-session.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DATABASE_HOST', 'localhost'),
      port: this.configService.get('DATABASE_PORT', 5432),
      username: this.configService.get('DATABASE_USERNAME', 'postgres'),
      password: this.configService.get('DATABASE_PASSWORD', 'password'),
      database: this.configService.get('DATABASE_NAME', 'pulsehub'),
      entities: [
        User,
        UserSession,
        TokenBlacklist,
        DataSource,
        Conversation,
        Message,
        Campaign,
        CampaignChannel,
        DataEvent,
        RecommendationHistory,
        AIProviderConfig,
        OAuthSession
      ],
      synchronize: this.configService.get('NODE_ENV') === 'development',
      // logging: this.configService.get('NODE_ENV') === 'development',
      ssl: this.configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
    };
  }
}
