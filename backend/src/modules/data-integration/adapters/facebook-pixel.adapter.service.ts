import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FacebookPixelAdapterService {
  constructor(private configService: ConfigService) {}

  async testConnection(config: any): Promise<{ success: boolean; message: string }> {
    try {
      const { pixelId, accessToken } = config;

      if (!pixelId || !accessToken) {
        return {
          success: false,
          message: 'Missing required configuration: pixelId and accessToken',
        };
      }

      // Test Facebook Pixel API connection
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${pixelId}`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,creation_time',
          },
          timeout: 10000,
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          message: 'Facebook Pixel connection successful',
        };
      }

      return {
        success: false,
        message: 'Facebook Pixel connection failed',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error?.message || 'Facebook Pixel connection test failed',
      };
    }
  }

  async fetchEvents(config: any): Promise<any[]> {
    try {
      const { pixelId, accessToken } = config;

      // Fetch pixel events
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${pixelId}/events`,
        {
          params: {
            access_token: accessToken,
            limit: 100,
          },
        }
      );

      const events = [];

      if (response.data?.data) {
        for (const event of response.data.data) {
          events.push({
            eventType: 'facebook_pixel_event',
            eventData: {
              eventId: event.id,
              eventName: event.event_name,
              eventTime: event.event_time,
              eventSourceUrl: event.event_source_url,
              userData: event.user_data,
              customData: event.custom_data,
              actionSource: event.action_source,
            },
            timestamp: new Date(parseInt(event.event_time) * 1000),
          });
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching Facebook Pixel events:', error);
      throw new Error('Failed to fetch Facebook Pixel events');
    }
  }

  async getPixelInfo(config: any): Promise<any> {
    try {
      const { pixelId, accessToken } = config;

      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${pixelId}`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,creation_time,last_fired_time,is_created_by_business',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Facebook Pixel info:', error);
      throw new Error('Failed to fetch Facebook Pixel info');
    }
  }

  async getConversions(config: any): Promise<any[]> {
    try {
      const { pixelId, accessToken } = config;

      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${pixelId}/conversions`,
        {
          params: {
            access_token: accessToken,
            limit: 100,
          },
        }
      );

      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching Facebook Pixel conversions:', error);
      throw new Error('Failed to fetch Facebook Pixel conversions');
    }
  }

  async getAudiences(config: any): Promise<any[]> {
    try {
      const { pixelId, accessToken } = config;

      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${pixelId}/audiences`,
        {
          params: {
            access_token: accessToken,
            limit: 100,
          },
        }
      );

      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching Facebook Pixel audiences:', error);
      throw new Error('Failed to fetch Facebook Pixel audiences');
    }
  }
}
