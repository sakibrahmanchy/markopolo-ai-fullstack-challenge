import { Injectable } from '@nestjs/common';

@Injectable()
export class DataTransformerService {
  transformEvent(sourceType: string, eventType: string, rawData: any): any {
    switch (sourceType) {
      case 'gtm':
        return this.transformGTMEvent(eventType, rawData);
      case 'facebook_pixel':
        return this.transformFacebookPixelEvent(eventType, rawData);
      case 'shopify':
        return this.transformShopifyEvent(eventType, rawData);
      default:
        return rawData;
    }
  }

  private transformGTMEvent(eventType: string, data: any): any {
    const baseEvent = {
      source: 'gtm',
      eventType,
      timestamp: new Date(),
      processedAt: new Date(),
    };

    switch (eventType) {
      case 'gtm_tag':
        return {
          ...baseEvent,
          data: {
            id: data.tagId,
            name: data.name,
            type: data.type,
            triggers: {
              firing: data.firingTriggerId || [],
              blocking: data.blockingTriggerId || [],
            },
            liveOnly: data.liveOnly || false,
            parameters: data.parameter || [],
          },
        };

      case 'gtm_trigger':
        return {
          ...baseEvent,
          data: {
            id: data.triggerId,
            name: data.name,
            type: data.type,
            filters: data.customEventFilter || [],
            conditions: data.filter || [],
          },
        };

      case 'gtm_variable':
        return {
          ...baseEvent,
          data: {
            id: data.variableId,
            name: data.name,
            type: data.type,
            parameters: data.parameter || [],
          },
        };

      default:
        return { ...baseEvent, data };
    }
  }

  private transformFacebookPixelEvent(eventType: string, data: any): any {
    const baseEvent = {
      source: 'facebook_pixel',
      eventType,
      timestamp: new Date(parseInt(data.eventTime) * 1000),
      processedAt: new Date(),
    };

    switch (eventType) {
      case 'facebook_pixel_event':
        return {
          ...baseEvent,
          data: {
            id: data.eventId,
            name: data.eventName,
            sourceUrl: data.eventSourceUrl,
            userData: this.transformUserData(data.userData),
            customData: data.customData || {},
            actionSource: data.actionSource,
          },
        };

      default:
        return { ...baseEvent, data };
    }
  }

  private transformShopifyEvent(eventType: string, data: any): any {
    const baseEvent = {
      source: 'shopify',
      eventType,
      timestamp: new Date(data.createdAt),
      processedAt: new Date(),
    };

    switch (eventType) {
      case 'shopify_order':
        return {
          ...baseEvent,
          data: {
            id: data.orderId,
            number: data.orderNumber,
            total: parseFloat(data.totalPrice) || 0,
            currency: data.currency,
            customer: this.transformCustomerData(data.customer),
            lineItems: this.transformLineItems(data.lineItems),
            status: {
              financial: data.financialStatus,
              fulfillment: data.fulfillmentStatus,
            },
            dates: {
              created: data.createdAt,
              updated: data.updatedAt,
            },
          },
        };

      case 'shopify_customer':
        return {
          ...baseEvent,
          data: {
            id: data.customerId,
            email: data.email,
            name: {
              first: data.firstName,
              last: data.lastName,
              full: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            },
            stats: {
              totalSpent: parseFloat(data.totalSpent) || 0,
              ordersCount: data.ordersCount || 0,
            },
            state: data.state,
            dates: {
              created: data.createdAt,
              updated: data.updatedAt,
            },
          },
        };

      case 'shopify_product':
        return {
          ...baseEvent,
          data: {
            id: data.productId,
            title: data.title,
            handle: data.handle,
            vendor: data.vendor,
            type: data.productType,
            status: data.status,
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
            variants: this.transformVariants(data.variants),
            images: this.transformImages(data.images),
            dates: {
              created: data.createdAt,
              updated: data.updatedAt,
            },
          },
        };

      default:
        return { ...baseEvent, data };
    }
  }

  private transformUserData(userData: any): any {
    if (!userData) return {};

    return {
      email: userData.em ? this.hashEmail(userData.em) : null,
      phone: userData.ph ? this.hashPhone(userData.ph) : null,
      firstName: userData.fn ? this.hashString(userData.fn) : null,
      lastName: userData.ln ? this.hashString(userData.ln) : null,
      city: userData.ct ? this.hashString(userData.ct) : null,
      state: userData.st ? this.hashString(userData.st) : null,
      zipCode: userData.zp ? this.hashString(userData.zp) : null,
      country: userData.country ? this.hashString(userData.country) : null,
    };
  }

  private transformCustomerData(customer: any): any {
    if (!customer) return null;

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      acceptsMarketing: customer.accepts_marketing,
      totalSpent: parseFloat(customer.total_spent) || 0,
      ordersCount: customer.orders_count || 0,
      state: customer.state,
      note: customer.note,
      tags: customer.tags ? customer.tags.split(',').map(tag => tag.trim()) : [],
    };
  }

  private transformLineItems(lineItems: any[]): any[] {
    if (!Array.isArray(lineItems)) return [];

    return lineItems.map(item => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      title: item.title,
      variantTitle: item.variant_title,
      quantity: item.quantity,
      price: parseFloat(item.price) || 0,
      totalDiscount: parseFloat(item.total_discount) || 0,
      sku: item.sku,
      vendor: item.vendor,
      fulfillmentStatus: item.fulfillment_status,
      requiresShipping: item.requires_shipping,
      taxable: item.taxable,
      giftCard: item.gift_card,
    }));
  }

  private transformVariants(variants: any[]): any[] {
    if (!Array.isArray(variants)) return [];

    return variants.map(variant => ({
      id: variant.id,
      title: variant.title,
      price: parseFloat(variant.price) || 0,
      compareAtPrice: parseFloat(variant.compare_at_price) || 0,
      sku: variant.sku,
      barcode: variant.barcode,
      inventoryQuantity: variant.inventory_quantity || 0,
      weight: parseFloat(variant.weight) || 0,
      weightUnit: variant.weight_unit,
      requiresShipping: variant.requires_shipping,
      taxable: variant.taxable,
      position: variant.position,
      option1: variant.option1,
      option2: variant.option2,
      option3: variant.option3,
    }));
  }

  private transformImages(images: any[]): any[] {
    if (!Array.isArray(images)) return [];

    return images.map(image => ({
      id: image.id,
      src: image.src,
      alt: image.alt,
      width: image.width,
      height: image.height,
      position: image.position,
    }));
  }

  private hashEmail(email: string): string {
    // Simple hash for demonstration - in production, use proper hashing
    return Buffer.from(email).toString('base64');
  }

  private hashPhone(phone: string): string {
    // Simple hash for demonstration - in production, use proper hashing
    return Buffer.from(phone).toString('base64');
  }

  private hashString(str: string): string {
    // Simple hash for demonstration - in production, use proper hashing
    return Buffer.from(str).toString('base64');
  }
}
