import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { AIModule } from './modules/ai/ai.module';
import { DataIntegrationModule } from './modules/data-integration/data-integration.module';
// import { CampaignModule } from './modules/campaign/campaign.module';
import { UserModule } from './modules/user/user.module';
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    AuthModule,
    UserModule,
    ChatModule,  
    AIModule,
    DataIntegrationModule,
    // CampaignModule,
  ],
})
export class AppModule {}
