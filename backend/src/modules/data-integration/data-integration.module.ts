import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { DataIntegrationController } from './data-integration.controller';
import { OAuthController } from './oauth.controller';
import { DataIntegrationService } from './data-integration.service';
import { GTMAdapterService } from './adapters/gtm.adapter.service';
import { FacebookPixelAdapterService } from './adapters/facebook-pixel.adapter.service';
import { ShopifyAdapterService } from './adapters/shopify.adapter.service';
import { DataValidatorService } from './services/data-validator.service';
import { SchemaMapperService } from './services/schema-mapper.service';
import { DataTransformerService } from './services/data-transformer.service';
import { EventProcessorService } from './services/event-processor.service';
import { OAuthService } from './services/oauth.service';
import { DataSource } from '../../entities/data-source.entity';
import { DataEvent } from '../../entities/data-event.entity';
import { OAuthSession } from '../../entities/oauth-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataSource, DataEvent, OAuthSession]),
    ConfigModule,
    AuthModule,
  ],
  controllers: [DataIntegrationController, OAuthController],
  providers: [
    DataIntegrationService,
    GTMAdapterService,
    FacebookPixelAdapterService,
    ShopifyAdapterService,
    DataValidatorService,
    SchemaMapperService,
    DataTransformerService,
    EventProcessorService,
    OAuthService,
  ],
  exports: [DataIntegrationService],
})
export class DataIntegrationModule {}
