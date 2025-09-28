import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DataEvent } from '../../../entities/data-event.entity';
import { DataTransformerService } from './data-transformer.service';
import { SchemaMapperService } from './schema-mapper.service';
import { DataValidatorService } from './data-validator.service';

@Injectable()
export class EventProcessorService {
  constructor(
    @InjectRepository(DataEvent)
    private dataEventRepository: Repository<DataEvent>,
    private dataTransformerService: DataTransformerService,
    private schemaMapperService: SchemaMapperService,
    private dataValidatorService: DataValidatorService,
  ) {}

  async processEvents(events: any[], dataSourceId: string): Promise<DataEvent[]> {
    const processedEvents: DataEvent[] = [];

    for (const event of events) {
      try {
        const processedEvent = await this.processEvent(event, dataSourceId);
        if (processedEvent) {
          processedEvents.push(processedEvent);
        }
      } catch (error) {
        console.error('Error processing event:', error);
        // Continue processing other events
      }
    }

    return processedEvents;
  }

  private async processEvent(event: any, dataSourceId: string): Promise<DataEvent | null> {
    try {
      // Extract source type and event type from the event
      const sourceType = this.extractSourceType(event);
      const eventType = this.extractEventType(event);

      if (!sourceType || !eventType) {
        console.warn('Unable to extract source type or event type from event:', event);
        return null;
      }

      // Validate event data
      const isValid = await this.dataValidatorService.validateEventData(event);
      if (!isValid) {
        console.warn('Invalid event data:', event);
        return null;
      }

      // Transform event data
      const transformedData = this.dataTransformerService.transformEvent(
        sourceType,
        eventType,
        event.eventData || event
      );

      // Validate against schema
      const schemaValid = this.schemaMapperService.validateAgainstSchema(
        transformedData.data,
        sourceType,
        eventType
      );

      if (!schemaValid) {
        console.warn('Event data does not match schema:', event);
        return null;
      }

      // Create data event entity
      const dataEvent = this.dataEventRepository.create({
        dataSourceId,
        eventType,
        eventData: transformedData,
        processedAt: new Date(),
      });

      // Save to database
      const savedEvent = await this.dataEventRepository.save(dataEvent);
      return savedEvent;

    } catch (error) {
      console.error('Error processing individual event:', error);
      return null;
    }
  }

  private extractSourceType(event: any): string | null {
    // Try to extract source type from event structure
    if (event.source) {
      return event.source;
    }

    // Try to extract from event type
    if (event.eventType) {
      if (event.eventType.startsWith('gtm_')) {
        return 'gtm';
      }
      if (event.eventType.startsWith('facebook_pixel_')) {
        return 'facebook_pixel';
      }
      if (event.eventType.startsWith('shopify_')) {
        return 'shopify';
      }
    }

    // Try to extract from event data
    if (event.eventData) {
      if (event.eventData.tagId || event.eventData.triggerId || event.eventData.variableId) {
        return 'gtm';
      }
      if (event.eventData.eventId || event.eventData.eventName) {
        return 'facebook_pixel';
      }
      if (event.eventData.orderId || event.eventData.customerId || event.eventData.productId) {
        return 'shopify';
      }
    }

    return null;
  }

  private extractEventType(event: any): string | null {
    // Try to extract event type from event structure
    if (event.eventType) {
      return event.eventType;
    }

    // Try to extract from event data
    if (event.eventData) {
      if (event.eventData.tagId) {
        return 'gtm_tag';
      }
      if (event.eventData.triggerId) {
        return 'gtm_trigger';
      }
      if (event.eventData.variableId) {
        return 'gtm_variable';
      }
      if (event.eventData.eventId) {
        return 'facebook_pixel_event';
      }
      if (event.eventData.orderId) {
        return 'shopify_order';
      }
      if (event.eventData.customerId) {
        return 'shopify_customer';
      }
      if (event.eventData.productId) {
        return 'shopify_product';
      }
    }

    return null;
  }

  async getProcessedEvents(dataSourceId: string, limit = 50, offset = 0): Promise<DataEvent[]> {
    return await this.dataEventRepository.find({
      where: { dataSourceId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getEventStats(dataSourceId: string): Promise<any> {
    const totalEvents = await this.dataEventRepository.count({
      where: { dataSourceId },
    });

    const eventTypes = await this.dataEventRepository
      .createQueryBuilder('event')
      .select('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('event.dataSourceId = :dataSourceId', { dataSourceId })
      .groupBy('event.eventType')
      .getRawMany();

    const recentEvents = await this.dataEventRepository.find({
      where: { dataSourceId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalEvents,
      eventTypes,
      recentEvents,
      lastProcessed: recentEvents[0]?.processedAt || null,
    };
  }

  async reprocessEvents(dataSourceId: string, eventIds: string[]): Promise<DataEvent[]> {
    const events = await this.dataEventRepository.find({
      where: { 
        id: In(eventIds),
        dataSourceId,
      },
    });

    const reprocessedEvents: DataEvent[] = [];

    for (const event of events) {
      try {
        // Extract original event data
        const originalEvent = event.eventData;
        
        // Reprocess the event
        const reprocessedEvent = await this.processEvent(originalEvent, dataSourceId);
        
        if (reprocessedEvent) {
          // Update the existing event
          await this.dataEventRepository.update(event.id, {
            eventData: reprocessedEvent.eventData,
            processedAt: new Date(),
          });
          
          reprocessedEvents.push(reprocessedEvent);
        }
      } catch (error) {
        console.error('Error reprocessing event:', error);
      }
    }

    return reprocessedEvents;
  }
}
