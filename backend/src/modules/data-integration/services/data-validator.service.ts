import { Injectable } from '@nestjs/common';

@Injectable()
export class DataValidatorService {
  async validateConfig(sourceType: string, config: any): Promise<boolean> {
    switch (sourceType) {
      case 'gtm':
        return this.validateGTMConfig(config);
      case 'facebook_pixel':
        return this.validateFacebookPixelConfig(config);
      case 'shopify':
        return this.validateShopifyConfig(config);
      default:
        return false;
    }
  }

  private validateGTMConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const requiredFields = ['containerId'];
    return requiredFields.every(field => 
      config[field] && typeof config[field] === 'string' && config[field].trim().length > 0
    );
  }

  private validateFacebookPixelConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const requiredFields = ['pixelId', 'accessToken'];
    return requiredFields.every(field => 
      config[field] && typeof config[field] === 'string' && config[field].trim().length > 0
    );
  }

  private validateShopifyConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const requiredFields = ['shopDomain', 'accessToken'];
    return requiredFields.every(field => 
      config[field] && typeof config[field] === 'string' && config[field].trim().length > 0
    );
  }

  async validateEventData(eventData: any): Promise<boolean> {
    if (!eventData || typeof eventData !== 'object') {
      return false;
    }

    const requiredFields = ['eventType', 'eventData'];
    return requiredFields.every(field => 
      eventData[field] !== undefined && eventData[field] !== null
    );
  }

  async validateSchema(data: any, schema: any): Promise<boolean> {
    // Basic schema validation
    if (!data || !schema) {
      return false;
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
