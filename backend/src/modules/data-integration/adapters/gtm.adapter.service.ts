import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { OAuthSession } from '../../../entities/oauth-session.entity';

@Injectable()
export class GTMAdapterService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(OAuthSession)
    private oauthSessionRepository: Repository<OAuthSession>,
  ) {}

  async testConnection(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get user's stored GTM OAuth session
      const oauthSession = await this.oauthSessionRepository.findOne({
        where: { userId, source: 'gtm', status: 'active' },
      });

      if (!oauthSession) {
        return {
          success: false,
          message: 'GTM account not connected. Please connect your GTM account first.',
        };
      }

      // Get valid access token
      const accessToken = await this.getValidAccessToken(oauthSession);

      // Test GTM API connection - first get accounts, then containers
      const accountsResponse = await axios.get(
        `https://www.googleapis.com/tagmanager/v2/accounts`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000,
        }
      );

      if (!accountsResponse.data?.account || accountsResponse.data.account.length === 0) {
        return {
          success: false,
          message: 'No GTM accounts found',
        };
      }

      // Use the first account
      const accountId = accountsResponse.data.account[0].accountId;
      const response = await axios.get(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000,
        }
      );


      if (response.status === 200) {
        return {
          success: true,
          message: 'GTM connection successful',
        };
      }

      return {
        success: false,
        message: 'GTM connection failed',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error?.message || 'GTM connection test failed',
      };
    }
  }


  private async fetchContainerInfo (accesstoken: string, containerId: string) {
    try {
      const accountsResponse = await axios.get(
        `https://www.googleapis.com/tagmanager/v2/accounts`,
        {
          headers: {
            Authorization: `Bearer ${accesstoken}`,
          },
        }
      );

      const accounts = accountsResponse.data.account;

      console.log({
        accounts
      })
    
      // here we have to fetch alll containers under account id and merge them

      let allContainers = [];
      for (let account of accounts) {
        const containersResponse = await axios.get(
          `https://www.googleapis.com/tagmanager/v2/accounts/${account.accountId}/containers`,
          {
            headers: {
              Authorization: `Bearer ${accesstoken}`,
            },
          }
        );

        allContainers = [...allContainers, ...containersResponse.data.container];
      }

      console.log({
        allContainers: JSON.stringify(allContainers)
      })

      const matchingContainer = allContainers.find((container: any) => container.publicId === containerId);
      return matchingContainer;
    }
    catch (error) {
      console.error('Error fetching GTM accounts:', error);
      throw new Error('Failed to fetch GTM accounts');
    }
  }

  private async fetchWorkSpace(accessToken: string, containerId: string, accountId: string) {
    try {
      const workspaceResponse = await axios.get(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const workspaces = workspaceResponse.data.workspace;

      for (let workspace of workspaces) {
        if (workspace.containerId === containerId) {
          return workspace;
        }
      }

      return null;
    } catch (err) {
        console.error('Error fetching GTM workspaces:', err);
        throw new Error('Failed to fetch GTM workspaces');
    }
  }

  async fetchEvents(userId: string, containerid: string): Promise<any[]> {
    try {
      // Get user's stored GTM OAuth session
      const oauthSession = await this.oauthSessionRepository.findOne({
        where: { userId, source: 'gtm', status: 'active' },
      });

      if (!oauthSession) {
        throw new Error('GTM account not connected');
      }

      const accessToken = await this.getValidAccessToken(oauthSession);

    //   // First get accounts
    //   const accountsResponse = await axios.get(
    //     `https://www.googleapis.com/tagmanager/v2/accounts`,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${accessToken}`,
    //       },
    //     }
    //   );

    //   console.log({
    //     accountsResponse: accountsResponse.data.account
    //   })

    //   if (!accountsResponse.data?.account || accountsResponse.data.account.length === 0) {
    //     throw new Error('No GTM accounts found');
    //   }

    //   // Use the first account
    //   const accountId = accountsResponse.data.account[0].accountId;
    //   const containersResponse = await axios.get(
    //     `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${accessToken}`,
    //       },
    //     }
    //   );

    //   console.log({
    //     res: JSON.stringify(containersResponse.data)
    //   })

      // Handle container ID resolution
    //   if (!containerId) {
    //     // Use the first container if no specific container requested
    //     if (containersResponse.data?.container && containersResponse.data.container.length > 0) {
    //       containerId = containersResponse.data.container[0].containerId;
    //     } else {
    //       throw new Error('No GTM containers found');
    //     }
    //   } else {
        // If containerId is provided (like "GTM-WFD9M4V7"), find the numeric container ID
    // let containerId = null;
    // if (containersResponse.data?.container) {
    //    containerId = containersResponse?.data?.container[0]?.containerId;
    // } else {
    //     throw new Error('No GTM containers found');
    // }

    // console.log({
    //     containerId
    // })

    const containerInfo = await this.fetchContainerInfo(accessToken, containerid);
    if (!containerInfo) {
        throw new Error("Container not found");
    }

    const containerId = containerInfo.containerId;
    const accountId = containerInfo.accountId;
    
    console.log({
        containerId,
        accountId
    })
      // Fetch GTM container data
    //   const containerResponse = await axios.get(
    //     `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}`,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${accessToken}`,
    //       },
    //     }
    //   );

    // get workspace

    const workspace = await this.fetchWorkSpace(accessToken, containerId, accountId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const workspaceUrl = `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspace.workspaceId}`;
      // Fetch tags, triggers, and variables
      const [tagsResponse, triggersResponse, variablesResponse] = await Promise.all([
        axios.get(
          `${workspaceUrl}/tags`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ),
        axios.get(
          `${workspaceUrl}/triggers`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ),
        axios.get(
          `${workspaceUrl}/variables`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ),
      ]);

      console.log({
        tagsResponse: tagsResponse.data.tag,
        triggersResponse: triggersResponse.data.trigger,
        variablesResponse: variablesResponse.data.variable
      })


      // Transform GTM data into events
      const events = [];

      // Process tags as events
      if (tagsResponse.data?.tag) {
        for (const tag of tagsResponse.data.tag) {
          events.push({
            eventType: 'gtm_tag',
            eventData: {
              tagId: tag.tagId,
              name: tag.name,
              type: tag.type,
              firingTriggerId: tag.firingTriggerId,
              blockingTriggerId: tag.blockingTriggerId,
              liveOnly: tag.liveOnly,
              parameter: tag.parameter,
            },
            timestamp: new Date(),
          });
        }
      }

      // Process triggers as events
      if (triggersResponse.data?.trigger) {
        for (const trigger of triggersResponse.data.trigger) {
          events.push({
            eventType: 'gtm_trigger',
            eventData: {
              triggerId: trigger.triggerId,
              name: trigger.name,
              type: trigger.type,
              customEventFilter: trigger.customEventFilter,
              filter: trigger.filter,
            },
            timestamp: new Date(),
          });
        }
      }

      // Process variables as events
      if (variablesResponse.data?.variable) {
        for (const variable of variablesResponse.data.variable) {
          events.push({
            eventType: 'gtm_variable',
            eventData: {
              variableId: variable.variableId,
              name: variable.name,
              type: variable.type,
              parameter: variable.parameter,
            },
            timestamp: new Date(),
          });
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching GTM events:', (error));
      throw new Error('Failed to fetch GTM events');
    }
  }

  async getContainerInfo(userId: string, containerId?: string): Promise<any> {
    try {
      // Get user's stored GTM OAuth session
      const oauthSession = await this.oauthSessionRepository.findOne({
        where: { userId, source: 'gtm', status: 'active' },
      });

      if (!oauthSession) {
        throw new Error('GTM account not connected');
      }

      const accessToken = await this.getValidAccessToken(oauthSession);

      // First get accounts
      const accountsResponse = await axios.get(
        `https://www.googleapis.com/tagmanager/v2/accounts`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!accountsResponse.data?.account || accountsResponse.data.account.length === 0) {
        throw new Error('No GTM accounts found');
      }

      const accountId = accountsResponse.data.account[0].accountId;

      // If no containerId provided, get all containers
      if (!containerId) {
        const response = await axios.get(
          `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        return response.data;
      }

      // If containerId is provided (like "GTM-WFD9M4V7"), find the numeric container ID
      const containersResponse = await axios.get(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (containersResponse.data?.container) {
        const matchingContainer = containersResponse.data.container.find(
          (container: any) => container.publicId === containerId
        );
        
        if (matchingContainer) {
          containerId = matchingContainer.containerId; // Use the numeric ID
        } else {
          throw new Error(`Container with public ID ${containerId} not found`);
        }
      } else {
        throw new Error('No GTM containers found');
      }

      const response = await axios.get(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching GTM container info:', error);
      throw new Error('Failed to fetch GTM container info');
    }
  }

  private async getValidAccessToken(oauthSession: OAuthSession): Promise<string> {
    // Check if token is expired and refresh if needed
    if (oauthSession.tokenExpiresAt && oauthSession.tokenExpiresAt < new Date()) {
      if (!oauthSession.refreshToken) {
        throw new Error('Access token expired and no refresh token available');
      }
      return await this.refreshAccessToken(oauthSession);
    }
    return oauthSession.accessToken;
  }

  private async refreshAccessToken(oauthSession: OAuthSession): Promise<string> {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      refresh_token: oauthSession.refreshToken,
      grant_type: 'refresh_token',
    });

    // Update stored tokens
    await this.oauthSessionRepository.update(oauthSession.id, {
      accessToken: response.data.access_token,
      tokenExpiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    });

    return response.data.access_token;
  }
}
