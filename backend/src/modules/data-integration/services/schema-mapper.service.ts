import { Injectable } from '@nestjs/common';

@Injectable()
export class SchemaMapperService {
  private readonly schemas = {
    gtm: {
      tag: {
        type: 'object',
        properties: {
          tagId: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          firingTriggerId: { type: 'array' },
          blockingTriggerId: { type: 'array' },
          liveOnly: { type: 'boolean' },
          parameter: { type: 'array' },
        },
        required: ['tagId', 'name', 'type'],
      },
      trigger: {
        type: 'object',
        properties: {
          triggerId: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          customEventFilter: { type: 'array' },
          filter: { type: 'array' },
        },
        required: ['triggerId', 'name', 'type'],
      },
      variable: {
        type: 'object',
        properties: {
          variableId: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          parameter: { type: 'array' },
        },
        required: ['variableId', 'name', 'type'],
      },
    },
    facebook_pixel: {
      event: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
          eventName: { type: 'string' },
          eventTime: { type: 'string' },
          eventSourceUrl: { type: 'string' },
          userData: { type: 'object' },
          customData: { type: 'object' },
          actionSource: { type: 'string' },
        },
        required: ['eventId', 'eventName', 'eventTime'],
      },
    },
    shopify: {
      order: {
        type: 'object',
        properties: {
          orderId: { type: 'number' },
          orderNumber: { type: 'number' },
          totalPrice: { type: 'string' },
          currency: { type: 'string' },
          customer: { type: 'object' },
          lineItems: { type: 'array' },
          financialStatus: { type: 'string' },
          fulfillmentStatus: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
        required: ['orderId', 'orderNumber', 'totalPrice', 'currency'],
      },
      customer: {
        type: 'object',
        properties: {
          customerId: { type: 'number' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          totalSpent: { type: 'string' },
          ordersCount: { type: 'number' },
          state: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
        required: ['customerId', 'email'],
      },
      product: {
        type: 'object',
        properties: {
          productId: { type: 'number' },
          title: { type: 'string' },
          handle: { type: 'string' },
          vendor: { type: 'string' },
          productType: { type: 'string' },
          status: { type: 'string' },
          tags: { type: 'string' },
          variants: { type: 'array' },
          images: { type: 'array' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
        required: ['productId', 'title', 'handle'],
      },
    },
  };

  getSchema(sourceType: string, eventType: string): any {
    return this.schemas[sourceType]?.[eventType] || null;
  }

  mapToCommonSchema(sourceType: string, eventType: string, data: any): any {
    const schema = this.getSchema(sourceType, eventType);
    if (!schema) {
      return data;
    }

    // Map source-specific data to common schema
    const commonSchema = {
      id: this.extractId(data, sourceType, eventType),
      type: eventType,
      source: sourceType,
      timestamp: this.extractTimestamp(data),
      data: this.mapDataFields(data, sourceType, eventType),
      metadata: this.extractMetadata(data, sourceType, eventType),
    };

    return commonSchema;
  }

  private extractId(data: any, sourceType: string, eventType: string): string {
    switch (sourceType) {
      case 'gtm':
        return data.tagId || data.triggerId || data.variableId || '';
      case 'facebook_pixel':
        return data.eventId || '';
      case 'shopify':
        return data.orderId?.toString() || data.customerId?.toString() || data.productId?.toString() || '';
      default:
        return '';
    }
  }

  private extractTimestamp(data: any): Date {
    if (data.timestamp) {
      return new Date(data.timestamp);
    }
    if (data.createdAt) {
      return new Date(data.createdAt);
    }
    if (data.eventTime) {
      return new Date(parseInt(data.eventTime) * 1000);
    }
    return new Date();
  }

  private mapDataFields(data: any, sourceType: string, eventType: string): any {
    // Map source-specific fields to common fields
    const mappedData = { ...data };

    // Common field mappings
    if (sourceType === 'shopify') {
      if (eventType === 'order') {
        mappedData.amount = parseFloat(data.totalPrice) || 0;
        mappedData.currency = data.currency;
        mappedData.customerEmail = data.customer?.email;
        mappedData.status = data.financialStatus;
      } else if (eventType === 'customer') {
        mappedData.email = data.email;
        mappedData.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        mappedData.totalSpent = parseFloat(data.totalSpent) || 0;
        mappedData.ordersCount = data.ordersCount || 0;
      }
    } else if (sourceType === 'facebook_pixel') {
      mappedData.eventName = data.eventName;
      mappedData.userData = data.userData;
      mappedData.customData = data.customData;
    } else if (sourceType === 'gtm') {
      mappedData.name = data.name;
      mappedData.type = data.type;
    }

    return mappedData;
  }

  private extractMetadata(data: any, sourceType: string, eventType: string): any {
    const metadata: any = {
      sourceType,
      eventType,
      processedAt: new Date(),
    };

    // Add source-specific metadata
    switch (sourceType) {
      case 'gtm':
        metadata.containerId = data.containerId;
        break;
      case 'facebook_pixel':
        metadata.pixelId = data.pixelId;
        break;
      case 'shopify':
        metadata.shopDomain = data.shopDomain;
        break;
    }

    return metadata;
  }

  validateAgainstSchema(data: any, sourceType: string, eventType: string): boolean {
    const schema = this.getSchema(sourceType, eventType);
    if (!schema) {
      return true; // No schema defined, assume valid
    }

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          return false;
        }
      }
    }

    // Check field types
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in data) {
          const value = data[field];
          const expectedType = (fieldSchema as any).type;

          if (expectedType === 'string' && typeof value !== 'string') {
            return false;
          }
          if (expectedType === 'number' && typeof value !== 'number') {
            return false;
          }
          if (expectedType === 'boolean' && typeof value !== 'boolean') {
            return false;
          }
          if (expectedType === 'object' && typeof value !== 'object') {
            return false;
          }
          if (expectedType === 'array' && !Array.isArray(value)) {
            return false;
          }
        }
      }
    }

    return true;
  }
}
