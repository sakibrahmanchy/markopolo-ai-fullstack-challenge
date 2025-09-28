import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
  }

  getGTMAuthUrl(userId: string): string {
    const state = Buffer.from(JSON.stringify({ userId, source: 'gtm' })).toString('base64');
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'https://www.googleapis.com/auth/tagmanager.readonly',
      response_type: 'code',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  getFacebookAuthUrl(userId: string): string {
    const state = Buffer.from(JSON.stringify({ userId, source: 'facebook_pixel' })).toString('base64');
    
    const params = new URLSearchParams({
      client_id: this.configService.get<string>('FACEBOOK_CLIENT_ID'),
      redirect_uri: this.configService.get<string>('FACEBOOK_REDIRECT_URI'),
      scope: 'ads_read,ads_management',
      response_type: 'code',
      state,
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  getShopifyAuthUrl(userId: string): string {
    const state = Buffer.from(JSON.stringify({ userId, source: 'shopify' })).toString('base64');
    
    const params = new URLSearchParams({
      client_id: this.configService.get<string>('SHOPIFY_CLIENT_ID'),
      redirect_uri: this.configService.get<string>('SHOPIFY_REDIRECT_URI'),
      scope: 'read_products,read_orders,read_customers',
      response_type: 'code',
      state,
    });

    return `https://${this.configService.get<string>('SHOPIFY_SHOP_NAME')}.myshopify.com/admin/oauth/authorize?${params.toString()}`;
  }

  async exchangeGoogleCodeForTokens(code: string, state: string): Promise<any> {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      userId,
      source: 'gtm',
    };
  }

  async exchangeFacebookCodeForTokens(code: string, state: string): Promise<any> {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    const response = await axios.post('https://graph.facebook.com/v18.0/oauth/access_token', {
      client_id: this.configService.get<string>('FACEBOOK_CLIENT_ID'),
      client_secret: this.configService.get<string>('FACEBOOK_CLIENT_SECRET'),
      code,
      redirect_uri: this.configService.get<string>('FACEBOOK_REDIRECT_URI'),
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
      userId,
      source: 'facebook_pixel',
    };
  }

  async exchangeShopifyCodeForTokens(code: string, state: string): Promise<any> {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    const response = await axios.post(
      `https://${this.configService.get<string>('SHOPIFY_SHOP_NAME')}.myshopify.com/admin/oauth/access_token`,
      {
        client_id: this.configService.get<string>('SHOPIFY_CLIENT_ID'),
        client_secret: this.configService.get<string>('SHOPIFY_CLIENT_SECRET'),
        code,
      }
    );

    return {
      accessToken: response.data.access_token,
      scope: response.data.scope,
      userId,
      source: 'shopify',
    };
  }

  async refreshGoogleToken(refreshToken: string): Promise<any> {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }
}
