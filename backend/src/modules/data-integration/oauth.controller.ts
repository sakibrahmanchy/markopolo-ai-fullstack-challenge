import { Controller, Get, Post, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OAuthService } from './services/oauth.service';
import { DataIntegrationService } from './data-integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthSession } from '../../entities/oauth-session.entity';
import { DataSource } from '../../entities/data-source.entity';
import axios from 'axios';

@ApiTags('OAuth Integration')
@Controller('oauth')
@ApiBearerAuth()
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly dataIntegrationService: DataIntegrationService,
    @InjectRepository(OAuthSession)
    private oauthSessionRepository: Repository<OAuthSession>,
    @InjectRepository(DataSource)
    private dataSourceRepository: Repository<DataSource>,
  ) {}

  @Get('gtm/connect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate GTM OAuth connection' })
  @ApiResponse({ status: 200, description: 'OAuth URL generated successfully' })
  async connectGTM(@Request() req: any) {
    const authUrl = this.oauthService.getGTMAuthUrl(req.user.id);
    return { authUrl };
  }

  @Get('gtm/callback')
  @ApiOperation({ summary: 'Handle GTM OAuth callback' })
  @ApiResponse({ status: 200, description: 'GTM account connected successfully' })
  async gtmCallback(@Query('code') code: string, @Query('state') state: string) {
    try {
        console.log({
            code,state
        })
      const tokens = await this.oauthService.exchangeGoogleCodeForTokens(code, state);
      
      // Store OAuth session
      const oauthSession = this.oauthSessionRepository.create({
        userId: tokens.userId,
        source: 'gtm',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        status: 'active',
      });

      const savedSession = await this.oauthSessionRepository.save(oauthSession);

      // Get account info to set account name
      try {
        const accountInfo = await this.getGTMAccountInfo(tokens.accessToken);
        await this.oauthSessionRepository.update(savedSession.id, {
          accountId: accountInfo.accountId,
          accountName: accountInfo.accountName,
        });
      } catch (error) {
        console.warn('Could not fetch GTM account info:', error);
      }

      // Create data source
      const dataSource = this.dataSourceRepository.create({
        userId: tokens.userId,
        sourceType: 'gtm',
        name: 'GTM Account',
        oauthSessionId: savedSession.id,
        status: 'active',
      });

      await this.dataSourceRepository.save(dataSource);

      return { 
        success: true, 
        message: 'GTM account connected successfully',
        dataSourceId: dataSource.id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to connect GTM account',
      };
    }
  }

  @Get('facebook/connect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate Facebook Pixel OAuth connection' })
  @ApiResponse({ status: 200, description: 'OAuth URL generated successfully' })
  async connectFacebook(@Request() req: any) {
    const authUrl = this.oauthService.getFacebookAuthUrl(req.user.id);
    return { authUrl };
  }

  @Get('facebook/callback')
  @ApiOperation({ summary: 'Handle Facebook Pixel OAuth callback' })
  @ApiResponse({ status: 200, description: 'Facebook Pixel account connected successfully' })
  async facebookCallback(@Query('code') code: string, @Query('state') state: string) {
    try {
      const tokens = await this.oauthService.exchangeFacebookCodeForTokens(code, state);
      
      // Store OAuth session
      const oauthSession = this.oauthSessionRepository.create({
        userId: tokens.userId,
        source: 'facebook_pixel',
        accessToken: tokens.accessToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        status: 'active',
      });

      const savedSession = await this.oauthSessionRepository.save(oauthSession);

      // Create data source
      const dataSource = this.dataSourceRepository.create({
        userId: tokens.userId,
        sourceType: 'facebook_pixel',
        name: 'Facebook Pixel Account',
        oauthSessionId: savedSession.id,
        status: 'active',
      });

      await this.dataSourceRepository.save(dataSource);

      return { 
        success: true, 
        message: 'Facebook Pixel account connected successfully',
        dataSourceId: dataSource.id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to connect Facebook Pixel account',
      };
    }
  }

  @Get('shopify/connect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate Shopify OAuth connection' })
  @ApiResponse({ status: 200, description: 'OAuth URL generated successfully' })
  async connectShopify(@Request() req: any) {
    const authUrl = this.oauthService.getShopifyAuthUrl(req.user.id);
    return { authUrl };
  }

  @Get('shopify/callback')
  @ApiOperation({ summary: 'Handle Shopify OAuth callback' })
  @ApiResponse({ status: 200, description: 'Shopify account connected successfully' })
  async shopifyCallback(@Query('code') code: string, @Query('state') state: string) {
    try {
      const tokens = await this.oauthService.exchangeShopifyCodeForTokens(code, state);
      
      // Store OAuth session
      const oauthSession = this.oauthSessionRepository.create({
        userId: tokens.userId,
        source: 'shopify',
        accessToken: tokens.accessToken,
        status: 'active',
        metadata: { scope: tokens.scope },
      });

      const savedSession = await this.oauthSessionRepository.save(oauthSession);

      // Create data source
      const dataSource = this.dataSourceRepository.create({
        userId: tokens.userId,
        sourceType: 'shopify',
        name: 'Shopify Store',
        oauthSessionId: savedSession.id,
        status: 'active',
      });

      await this.dataSourceRepository.save(dataSource);

      return { 
        success: true, 
        message: 'Shopify account connected successfully',
        dataSourceId: dataSource.id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to connect Shopify account',
      };
    }
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user OAuth sessions' })
  @ApiResponse({ status: 200, description: 'OAuth sessions retrieved successfully' })
  async getOAuthSessions(@Request() req: any) {
    const sessions = await this.oauthSessionRepository.find({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' },
    });

    return sessions.map(session => ({
      id: session.id,
      source: session.source,
      accountName: session.accountName,
      status: session.status,
      createdAt: session.createdAt,
      tokenExpiresAt: session.tokenExpiresAt,
    }));
  }

  @Post('sessions/:id/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke OAuth session' })
  @ApiResponse({ status: 200, description: 'OAuth session revoked successfully' })
  async revokeOAuthSession(@Request() req: any, @Query('id') id: string) {
    const session = await this.oauthSessionRepository.findOne({
      where: { id, userId: req.user.id },
    });

    if (!session) {
      return {
        success: false,
        message: 'OAuth session not found',
      };
    }

    await this.oauthSessionRepository.update(id, { status: 'revoked' });

    // Update related data sources
    await this.dataSourceRepository.update(
      { oauthSessionId: id },
      { status: 'needs_reauth' }
    );

    return {
      success: true,
      message: 'OAuth session revoked successfully',
    };
  }

  private async getGTMAccountInfo(accessToken: string): Promise<{ accountId: string; accountName: string }> {
    const response = await axios.get(
      'https://www.googleapis.com/tagmanager/v2/accounts',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data?.account && response.data.account.length > 0) {
      const account = response.data.account[0];
      return {
        accountId: account.accountId,
        accountName: account.name,
      };
    }

    return {
      accountId: 'unknown',
      accountName: 'GTM Account',
    };
  }
}
