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
    const databaseUrl = this.configService.get('DATABASE_URL');
    console.log('Database URL:', databaseUrl);
    
    // Use DATABASE_URL if available, otherwise fall back to individual parameters
    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
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
        synchronize: this.configService.get('NODE_ENV') !== 'production',
        logging: this.configService.get('NODE_ENV') === 'development',
        ssl: false, // Disable SSL for Docker environment
        retryAttempts: 10,
        retryDelay: 3000,
      };
    }
    
    console.log({
      host: this.configService.get('DATABASE_HOST', 'localhost'),
      port: this.configService.get('DATABASE_PORT', 5432),
      username: this.configService.get('DATABASE_USERNAME', 'postgres'),
      password: this.configService.get('DATABASE_PASSWORD', 'postgres'),
      database: this.configService.get('DATABASE_NAME', 'pulsehub'),
    })

    // Fallback to individual parameters
    return {
      type: 'postgres',
      host: this.configService.get('DATABASE_HOST', 'localhost'),
      port: this.configService.get('DATABASE_PORT', 5432),
      username: this.configService.get('DATABASE_USERNAME', 'postgres'),
      password: this.configService.get('DATABASE_PASSWORD', 'postgres'),
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
      synchronize: this.configService.get('NODE_ENV') !== 'production',
      logging: this.configService.get('NODE_ENV') === 'development',
      ssl: false, // Disable SSL for Docker environment
      retryAttempts: 10,
      retryDelay: 3000,
    };
  }
}
