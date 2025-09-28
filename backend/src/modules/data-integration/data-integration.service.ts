import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from '../../entities/data-source.entity';
import { DataEvent } from '../../entities/data-event.entity';
import { GTMAdapterService } from './adapters/gtm.adapter.service';
import { FacebookPixelAdapterService } from './adapters/facebook-pixel.adapter.service';
import { ShopifyAdapterService } from './adapters/shopify.adapter.service';
import { DataValidatorService } from './services/data-validator.service';
import { EventProcessorService } from './services/event-processor.service';
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { TestConnectionDto } from './dto/test-connection.dto';
import { StoreDummyDataDto } from './dto/store-dummy-data.dto';

@Injectable()
export class DataIntegrationService {
  constructor(
    @InjectRepository(DataSource)
    private dataSourceRepository: Repository<DataSource>,
    @InjectRepository(DataEvent)
    private dataEventRepository: Repository<DataEvent>,
    private gtmAdapterService: GTMAdapterService,
    private facebookPixelAdapterService: FacebookPixelAdapterService,
    private shopifyAdapterService: ShopifyAdapterService,
    private dataValidatorService: DataValidatorService,
    private eventProcessorService: EventProcessorService,
  ) {}

  async createDataSource(userId: string, createDataSourceDto: CreateDataSourceDto): Promise<DataSource> {
    const { sourceType, name, config } = createDataSourceDto;

    // Validate configuration based on source type
    await this.validateSourceConfig(sourceType, config);

    // Test connection before saving
    await this.testConnection(userId, sourceType, config);

    const dataSource = this.dataSourceRepository.create({
      userId,
      sourceType,
      name,
      config,
      status: 'active',
    });

    return await this.dataSourceRepository.save(dataSource);
  }

  async getDataSources(userId: string): Promise<DataSource[]> {
    return await this.dataSourceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDataSourceById(id: string, userId: string): Promise<DataSource> {
    const dataSource = await this.dataSourceRepository.findOne({
      where: { id, userId },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    return dataSource;
  }

  async testConnection(userId: string, sourceType: string, config?: any): Promise<{ success: boolean; message: string }> {
    try {
      switch (sourceType) {
        case 'gtm':
          return await this.gtmAdapterService.testConnection(userId);
        case 'facebook_pixel':
          return await this.facebookPixelAdapterService.testConnection(config);
        case 'shopify':
          return await this.shopifyAdapterService.testConnection(config);
        default:
          throw new BadRequestException('Unsupported data source type');
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connection test failed',
      };
    }
  }

  async syncDataSource(id: string, userId: string): Promise<{ success: boolean; eventsCount: number }> {
    const dataSource = await this.getDataSourceById(id, userId);
    console.log({
        dataSource
    })
    try {
      let events: any[] = [];

      switch (dataSource.sourceType) {
        case 'gtm':
          events = await this.gtmAdapterService.fetchEvents(userId, dataSource?.config?.containerId);
          break;
        case 'facebook_pixel':
          events = await this.facebookPixelAdapterService.fetchEvents(dataSource.config);
          break;
        case 'shopify':
          events = await this.shopifyAdapterService.fetchEvents(dataSource.config);
          break;
        default:
          throw new BadRequestException('Unsupported data source type');
      }

      // Process and store events
      const processedEvents = await this.eventProcessorService.processEvents(events, dataSource.id);

      // Update last sync time
      await this.dataSourceRepository.update(id, {
        lastSyncAt: new Date(),
      });

      return {
        success: true,
        eventsCount: processedEvents.length,
      };
    } catch (error) {
      // Update status to error
      await this.dataSourceRepository.update(id, {
        status: 'error',
      });

      throw error;
    }
  }

  async deleteDataSource(id: string, userId: string): Promise<void> {
    const dataSource = await this.getDataSourceById(id, userId);
    await this.dataSourceRepository.remove(dataSource);
  }

  async getDataEvents(dataSourceId: string, userId: string, limit = 50, offset = 0): Promise<DataEvent[]> {
    // Verify user owns the data source
    await this.getDataSourceById(dataSourceId, userId);

    return await this.dataEventRepository.find({
      where: { dataSourceId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  private async validateSourceConfig(sourceType: string, config: any): Promise<void> {
    const isValid = await this.dataValidatorService.validateConfig(sourceType, config);
    if (!isValid) {
      throw new BadRequestException('Invalid configuration for data source type');
    }
  }

  // Dummy Data Generation Methods
  async storeDummyData(userId: string, storeDummyDataDto: StoreDummyDataDto): Promise<DataEvent[]> {
    const { sourceType, eventType, eventData, count = 1 } = storeDummyDataDto;

    // Find or create a dummy data source for the user
    let dataSource = await this.dataSourceRepository.findOne({
      where: { 
        userId, 
        sourceType,
        name: `Dummy ${sourceType.toUpperCase()} Data`
      }
    });

    if (!dataSource) {
      dataSource = await this.dataSourceRepository.save({
        userId,
        sourceType,
        name: `Dummy ${sourceType.toUpperCase()} Data`,
        config: this.getDummyConfig(sourceType),
        isActive: true,
      });
    }

    // Generate dummy events
    const events = [];
    for (let i = 0; i < count; i++) {
      const dummyEvent = this.generateDummyEvent(sourceType, eventType, eventData, i);
      events.push(dummyEvent);
    }

    // Process events through the existing event processor
    return await this.eventProcessorService.processEvents(events, dataSource.id);
  }

  async generateBulkDummyData(userId: string, sourceType: 'gtm' | 'facebook_pixel' | 'shopify'): Promise<DataEvent[]> {
    // Find or create a dummy data source
    let dataSource = await this.dataSourceRepository.findOne({
      where: { 
        userId, 
        sourceType,
        name: `Dummy ${sourceType.toUpperCase()} Data`
      }
    });

    if (!dataSource) {
      dataSource = await this.dataSourceRepository.save({
        userId,
        sourceType,
        name: `Dummy ${sourceType.toUpperCase()} Data`,
        config: this.getDummyConfig(sourceType),
        isActive: true,
      });
    }

    // Generate bulk dummy events based on source type
    const events = this.generateBulkDummyEvents(sourceType);
    
    // Process events through the existing event processor
    return await this.eventProcessorService.processEvents(events, dataSource.id);
  }

  private generateDummyEvent(sourceType: string, eventType: string, baseData: any, index: number): any {
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days
    
    switch (sourceType) {
      case 'gtm':
        return {
          source: 'gtm',
          eventType: `gtm_${eventType}`,
          eventData: {
            ...baseData,
            tagId: `tag_${index + 1}`,
            triggerId: `trigger_${index + 1}`,
            variableId: `variable_${index + 1}`,
            pageUrl: `https://example.com/page${index + 1}`,
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            sessionId: `session_${Math.floor(Math.random() * 10000)}`,
            eventTimestamp: timestamp.toISOString(),
            ...this.getRandomGTMData()
          }
        };

      case 'facebook_pixel':
        return {
          source: 'facebook_pixel',
          eventType: `facebook_pixel_${eventType}`,
          eventData: {
            ...baseData,
            eventId: `event_${index + 1}`,
            eventName: eventType,
            pixelId: `pixel_${Math.floor(Math.random() * 1000)}`,
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            sessionId: `session_${Math.floor(Math.random() * 10000)}`,
            eventTimestamp: timestamp.toISOString(),
            value: Math.floor(Math.random() * 1000),
            currency: 'USD',
            ...this.getRandomFacebookData()
          }
        };

      case 'shopify':
        return {
          source: 'shopify',
          eventType: `shopify_${eventType}`,
          eventData: {
            ...baseData,
            orderId: `order_${index + 1}`,
            customerId: `customer_${Math.floor(Math.random() * 1000)}`,
            productId: `product_${Math.floor(Math.random() * 100)}`,
            productTitle: `Product ${index + 1}`,
            productPrice: Math.floor(Math.random() * 500) + 10,
            currency: 'USD',
            quantity: Math.floor(Math.random() * 5) + 1,
            eventTimestamp: timestamp.toISOString(),
            shopDomain: 'dummy-shop.myshopify.com',
            ...this.getRandomShopifyData()
          }
        };

      default:
        throw new BadRequestException('Unsupported source type');
    }
  }

  private generateBulkDummyEvents(sourceType: string): any[] {
    const events = [];
    const eventTypes = this.getEventTypesForSource(sourceType);
    
    // Generate 50-100 random events
    const eventCount = Math.floor(Math.random() * 50) + 50;
    
    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const event = this.generateDummyEvent(sourceType, eventType, {}, i);
      events.push(event);
    }
    
    return events;
  }

  private getEventTypesForSource(sourceType: string): string[] {
    switch (sourceType) {
      case 'gtm':
        return ['page_view', 'click', 'form_submit', 'purchase', 'add_to_cart', 'scroll'];
      case 'facebook_pixel':
        return ['PageView', 'AddToCart', 'Purchase', 'Lead', 'CompleteRegistration', 'ViewContent'];
      case 'shopify':
        return ['purchase', 'add_to_cart', 'view_product', 'checkout_started', 'checkout_completed', 'customer_created'];
      default:
        return ['generic_event'];
    }
  }

  private getDummyConfig(sourceType: string): any {
    switch (sourceType) {
      case 'gtm':
        return { containerId: 'GTM-DUMMY', apiKey: 'dummy_api_key' };
      case 'facebook_pixel':
        return { pixelId: 'dummy_pixel_id', accessToken: 'dummy_access_token' };
      case 'shopify':
        return { shopDomain: 'dummy-shop.myshopify.com', accessToken: 'dummy_access_token' };
      default:
        return {};
    }
  }

  private getRandomGTMData(): any {
    return {
      pageTitle: `Page ${Math.floor(Math.random() * 10) + 1}`,
      referrer: Math.random() > 0.5 ? 'https://google.com' : 'https://facebook.com',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      screenResolution: '1920x1080',
      language: 'en-US',
      timezone: 'America/New_York'
    };
  }

  private getRandomFacebookData(): any {
    return {
      contentName: `Product ${Math.floor(Math.random() * 20) + 1}`,
      contentCategory: ['Electronics', 'Clothing', 'Books', 'Home'][Math.floor(Math.random() * 4)],
      contentIds: [`product_${Math.floor(Math.random() * 100)}`],
      numItems: Math.floor(Math.random() * 5) + 1,
      searchString: Math.random() > 0.7 ? 'search term' : undefined
    };
  }

  private getRandomShopifyData(): any {
    return {
      customerEmail: `customer${Math.floor(Math.random() * 1000)}@example.com`,
      customerPhone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      orderTotal: Math.floor(Math.random() * 1000) + 50,
      paymentMethod: ['credit_card', 'paypal', 'apple_pay'][Math.floor(Math.random() * 3)],
      shippingAddress: {
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston'][Math.floor(Math.random() * 4)],
        state: ['NY', 'CA', 'IL', 'TX'][Math.floor(Math.random() * 4)],
        country: 'US'
      }
    };
  }
}
