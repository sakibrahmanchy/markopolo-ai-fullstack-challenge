import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ShopifyAdapterService {
  constructor(private configService: ConfigService) {}

  async testConnection(config: any): Promise<{ success: boolean; message: string }> {
    try {
      const { shopDomain, accessToken } = config;

      if (!shopDomain || !accessToken) {
        return {
          success: false,
          message: 'Missing required configuration: shopDomain and accessToken',
        };
      }

      // Test Shopify API connection
      const response = await axios.get(
        `https://${shopDomain}.myshopify.com/admin/api/2023-10/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
          timeout: 10000,
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          message: 'Shopify connection successful',
        };
      }

      return {
        success: false,
        message: 'Shopify connection failed',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.errors || 'Shopify connection test failed',
      };
    }
  }

  async fetchEvents(config: any): Promise<any[]> {
    try {
      const { shopDomain, accessToken } = config;
      const events = [];

      // Fetch recent orders
      const ordersResponse = await axios.get(
        `https://${shopDomain}.myshopify.com/admin/api/2023-10/orders.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
          params: {
            limit: 50,
            status: 'any',
            created_at_min: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
          },
        }
      );

      if (ordersResponse.data?.orders) {
        for (const order of ordersResponse.data.orders) {
          events.push({
            eventType: 'shopify_order',
            eventData: {
              orderId: order.id,
              orderNumber: order.order_number,
              totalPrice: order.total_price,
              currency: order.currency,
              customer: order.customer,
              lineItems: order.line_items,
              financialStatus: order.financial_status,
              fulfillmentStatus: order.fulfillment_status,
              createdAt: order.created_at,
              updatedAt: order.updated_at,
            },
            timestamp: new Date(order.created_at),
          });
        }
      }

      // Fetch recent customers
      const customersResponse = await axios.get(
        `https://${shopDomain}.myshopify.com/admin/api/2023-10/customers.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
          params: {
            limit: 50,
            created_at_min: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }
      );

      if (customersResponse.data?.customers) {
        for (const customer of customersResponse.data.customers) {
          events.push({
            eventType: 'shopify_customer',
            eventData: {
              customerId: customer.id,
              email: customer.email,
              firstName: customer.first_name,
              lastName: customer.last_name,
              totalSpent: customer.total_spent,
              ordersCount: customer.orders_count,
              state: customer.state,
              createdAt: customer.created_at,
              updatedAt: customer.updated_at,
            },
            timestamp: new Date(customer.created_at),
          });
        }
      }

      // Fetch recent products
      const productsResponse = await axios.get(
        `https://${shopDomain}.myshopify.com/admin/api/2023-10/products.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
          params: {
            limit: 50,
            created_at_min: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }
      );

      if (productsResponse.data?.products) {
        for (const product of productsResponse.data.products) {
          events.push({
            eventType: 'shopify_product',
            eventData: {
              productId: product.id,
              title: product.title,
              handle: product.handle,
              vendor: product.vendor,
              productType: product.product_type,
              status: product.status,
              tags: product.tags,
              variants: product.variants,
              images: product.images,
              createdAt: product.created_at,
              updatedAt: product.updated_at,
            },
            timestamp: new Date(product.created_at),
          });
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching Shopify events:', error);
      throw new Error('Failed to fetch Shopify events');
    }
  }

  async getShopInfo(config: any): Promise<any> {
    try {
      const { shopDomain, accessToken } = config;

      const response = await axios.get(
        `https://${shopDomain}.myshopify.com/admin/api/2023-10/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        }
      );

      return response.data?.shop;
    } catch (error) {
      console.error('Error fetching Shopify shop info:', error);
      throw new Error('Failed to fetch Shopify shop info');
    }
  }

  async getAnalytics(config: any): Promise<any> {
    try {
      const { shopDomain, accessToken } = config;

      // Fetch basic analytics data
      const [ordersResponse, customersResponse] = await Promise.all([
        axios.get(
          `https://${shopDomain}.myshopify.com/admin/api/2023-10/orders.json`,
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
            },
            params: {
              limit: 1,
              created_at_min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          }
        ),
        axios.get(
          `https://${shopDomain}.myshopify.com/admin/api/2023-10/customers.json`,
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
            },
            params: {
              limit: 1,
              created_at_min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          }
        ),
      ]);

      return {
        totalOrders: ordersResponse.data?.orders?.length || 0,
        totalCustomers: customersResponse.data?.customers?.length || 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching Shopify analytics:', error);
      throw new Error('Failed to fetch Shopify analytics');
    }
  }
}
