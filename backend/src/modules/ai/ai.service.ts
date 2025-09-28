import { Injectable, Inject } from '@nestjs/common';
import { AIProvider, Recommendation, ParsedQuery, GeneratedContent, AnalysisResult } from './interfaces/ai-provider.interface';
// import { LearningService } from './learning.service';
// import { RecommendationHistoryService } from './recommendation-history.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DataEvent } from '../../entities/data-event.entity';
import { DataSource } from '../../entities/data-source.entity';

@Injectable()
export class AIService {
  constructor(
    @Inject('AI_PROVIDER') private aiProvider: AIProvider,
    @InjectRepository(DataEvent)
    private dataEventRepository: Repository<DataEvent>,
    @InjectRepository(DataSource)
    private dataSourceRepository: Repository<DataSource>,
  ) {}

  async generateRecommendations(query: string, userId: string, conversationId?: string): Promise<Recommendation[]> {
    // Build context for the AI provider
    const context = await this.buildContext(userId);
    
    // Generate recommendations using the AI provider
    const recommendations = await this.aiProvider.generateRecommendations(query, context);
    
    // TODO: Store recommendation history for learning when services are available
    // await this.recommendationHistoryService.create({
    //   userId,
    //   conversationId,
    //   originalQuery: query,
    //   aiRecommendation: recommendations,
    //   aiProvider: this.aiProvider.getProviderInfo().name,
    //   context,
    // });
    
    return recommendations;
  }

  async parseQuery(query: string): Promise<ParsedQuery> {
    return await this.aiProvider.parseQuery(query);
  }

  async generateContent(prompt: string, context: any): Promise<GeneratedContent> {
    return await this.aiProvider.generateContent(prompt, context);
  }

  async analyzeData(data: any, analysisType: string): Promise<AnalysisResult> {
    return await this.aiProvider.analyzeData(data, analysisType);
  }

  async learnFromFeedback(recommendationId: string, feedback: any): Promise<void> {
    // TODO: Store feedback for learning when services are available
    // await this.learningService.collectFeedback(recommendationId, feedback);
    
    // Update AI provider with feedback
    await this.aiProvider.learnFromFeedback(feedback);
  }

  async analyzeIntent(userMessage: string) {
    return await this.aiProvider.analyzeIntent(userMessage);
  }

  async getProviderInfo() {
    return this.aiProvider.getProviderInfo();
  }

  async isProviderHealthy(): Promise<boolean> {
    return await this.aiProvider.isHealthy();
  }

  async streamResponse(
    userMessage: string,
    conversationHistory: any[],
    onChunk: (chunk: string) => void,
    onRecommendation: (recommendation: any) => void,
    onCampaign: (campaign: any) => void,
    onComplete: (fullResponse: string) => void,
  ): Promise<void> {
    // Build context from conversation history
    const context = {
      conversationHistory,
      timestamp: new Date(),
    };

    // Use the AI provider to stream the response
    await this.aiProvider.streamResponse(
      userMessage,
      context,
      onChunk,
      onRecommendation,
      onCampaign,
      onComplete,
    );
  }

  // New method for generating campaign recommendations based on data analysis
  async generateCampaignRecommendations(userMessage: string, userId: string): Promise<any> {
    // Get user's connected data sources
    const dataSources = await this.dataSourceRepository.find({
      where: { userId }
    });

    if (dataSources.length === 0) {
      return {
        type: 'no_data_sources',
        message: 'Please connect your data sources first to get campaign recommendations.'
      };
    }

    // Analyze recent data from all connected sources
    const dataAnalysis = await this.analyzeUserData(userId, dataSources);
    
    // Generate campaign recommendations based on the analysis
    const recommendations = await this.generateRecommendationsFromData(userMessage, dataAnalysis, dataSources);
    
    return recommendations;
  }

  // Analyze user's data to identify patterns and segments
  private async analyzeUserData(userId: string, dataSources: DataSource[]): Promise<any> {
    const dataSourceIds = dataSources.map(ds => ds.id);
    
    // Get recent events from all data sources
    const recentEvents = await this.dataEventRepository.find({
      where: { dataSourceId: In(dataSourceIds) },
      order: { createdAt: 'DESC' },
      take: 1000 // Last 1000 events
    });

    // Group events by type and source
    const eventsByType = this.groupEventsByType(recentEvents);
    const eventsBySource = this.groupEventsBySource(recentEvents, dataSources);

    // Analyze patterns
    const analysis = {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySource,
      timeRange: this.getTimeRange(recentEvents),
      userSegments: this.identifyUserSegments(recentEvents),
      engagementMetrics: this.calculateEngagementMetrics(recentEvents),
      conversionFunnel: this.analyzeConversionFunnel(recentEvents)
    };

    console.log({
      analysis
    })
    
    return analysis;
  }

  // Generate campaign recommendations from data analysis
  private async generateRecommendationsFromData(userMessage: string, dataAnalysis: any, dataSources: DataSource[]): Promise<any> {
    // Use AI to analyze the data and generate recommendations
    const prompt = `
    Based on the following data analysis and user query, generate multiple campaign recommendations - one for each user segment.
    
    User Query: "${userMessage}"
    
    Data Analysis:
    - Total Events: ${dataAnalysis.totalEvents}
    - Time Range: ${dataAnalysis.timeRange}
    - User Segments: ${JSON.stringify(dataAnalysis.userSegments)}
    - Engagement Metrics: ${JSON.stringify(dataAnalysis.engagementMetrics)}
    - Conversion Funnel: ${JSON.stringify(dataAnalysis.conversionFunnel)}
    
    Available Segments with User Counts:
    - cart_abandoners: Users who added items to cart but didn't purchase (${dataAnalysis.userSegments.cart_abandoners} users)
    - high_value_customers: Users with high-value purchases (${dataAnalysis.userSegments.high_value_customers} users)
    - new_visitors: Users who only viewed pages (${dataAnalysis.userSegments.new_visitors} users)
    - engaged_users: Users with multiple interaction types (${dataAnalysis.userSegments.engaged_users} users)
    - potential_customers: Users who added to cart but haven't purchased (${dataAnalysis.userSegments.potential_customers} users)
    - repeat_customers: Users with multiple purchases (${dataAnalysis.userSegments.repeat_customers} users)
    
    Generate campaign recommendations for ALL segments that have users (size > 0). Each campaign should be tailored to that specific segment's behavior and needs.
    
    Generate campaign recommendations in this JSON format:
    {
      "type": "campaign_recommendation",
      "data": {
        "campaigns": [
          {
            "id": "campaign_1",
            "name": "Campaign Name",
            "audience": {
              "segment": "segment_name",
              "size": number,
              "criteria": "description"
            },
            "channels": [
              {
                "type": "email|sms|push|whatsapp",
                "message": "message content",
                "timing": "optimal_send_time"
              }
            ]
          }
        ]
      }
    }
    `;

    const response = await this.aiProvider.generateContent(prompt, { dataAnalysis });
    return response;
  }

  // Helper methods for data analysis
  private groupEventsByType(events: DataEvent[]): any {
    const grouped = {};
    events.forEach(event => {
      if (!grouped[event.eventType]) {
        grouped[event.eventType] = 0;
      }
      grouped[event.eventType]++;
    });
    return grouped;
  }

  private groupEventsBySource(events: DataEvent[], dataSources: DataSource[]): any {
    const grouped = {};
    dataSources.forEach(source => {
      grouped[source.sourceType] = events.filter(e => e.dataSourceId === source.id).length;
    });
    return grouped;
  }

  private getTimeRange(events: DataEvent[]): string {
    if (events.length === 0) return 'No data';
    const oldest = events[events.length - 1]?.createdAt;
    const newest = events[0]?.createdAt;
    return `${oldest.toISOString()} to ${newest.toISOString()}`;
  }

  private identifyUserSegments(events: DataEvent[]): any {
    // Group events by user to analyze individual behavior
    const userEvents = new Map<string, DataEvent[]>();
    
    // Debug: Check what user IDs we're getting
    const userIds = new Set<string>();
    events.forEach(event => {
      const userId = event.eventData?.userId || event.eventData?.user_id || event.eventData?.customer_id || 'anonymous';
      userIds.add(userId);
    });
    console.log('Found user IDs:', Array.from(userIds));
    console.log('Sample event data:', events[0]?.eventData);
    
    events.forEach(event => {
      const userId = event.eventData?.userId || event.eventData?.user_id || event.eventData?.customer_id || 'anonymous';
      if (!userEvents.has(userId)) {
        userEvents.set(userId, []);
      }
      userEvents.get(userId)!.push(event);
    });

    const segments = {
      cart_abandoners: 0,
      high_value_customers: 0,
      new_visitors: 0,
      engaged_users: 0,
      potential_customers: 0,
      repeat_customers: 0,
      total_users: userEvents.size
    };

    // If we have very few users, create segments based on event patterns instead
    if (userEvents.size <= 1) {
      // Create segments based on event patterns across all events
      const totalAddToCart = events.filter(e => 
        e.eventType.includes('add_to_cart') || e.eventType.includes('AddToCart')
      ).length;
      const totalPurchases = events.filter(e => 
        e.eventType.includes('purchase') || e.eventType.includes('Purchase')
      ).length;
      const totalPageViews = events.filter(e => 
        e.eventType.includes('page_view') || e.eventType.includes('PageView')
      ).length;
      
      // Estimate segments based on event ratios
      segments.cart_abandoners = Math.max(1, Math.floor(totalAddToCart * 0.3)); // 30% of add to cart events
      segments.high_value_customers = Math.max(1, Math.floor(totalPurchases * 0.2)); // 20% of purchases
      segments.new_visitors = Math.max(1, Math.floor(totalPageViews * 0.4)); // 40% of page views
      segments.engaged_users = Math.max(1, Math.floor(events.length * 0.1)); // 10% of total events
      segments.potential_customers = Math.max(1, Math.floor(totalAddToCart * 0.5)); // 50% of add to cart
      segments.repeat_customers = Math.max(1, Math.floor(totalPurchases * 0.3)); // 30% of purchases
    } else {
      // Analyze each user's behavior
      userEvents.forEach((userEventList, userId) => {
        const eventTypes = userEventList.map(e => e.eventType);
        const hasAddToCart = eventTypes.some(type => 
          type.includes('add_to_cart') || type.includes('AddToCart')
        );
        const hasPurchase = eventTypes.some(type => 
          type.includes('purchase') || type.includes('Purchase')
        );
        const hasPageView = eventTypes.some(type => 
          type.includes('page_view') || type.includes('PageView')
        );
        
        // Cart abandoners: added to cart but didn't purchase
        if (hasAddToCart && !hasPurchase) {
          segments.cart_abandoners++;
        }
        
        // High value customers: made purchases with high value
        const purchaseEvents = userEventList.filter(e => 
          e.eventType.includes('purchase') || e.eventType.includes('Purchase')
        );
        const totalValue = purchaseEvents.reduce((sum, e) => {
          const value = e.eventData?.value || e.eventData?.total_price || e.eventData?.revenue || 0;
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
        
        if (totalValue > 100) {
          segments.high_value_customers++;
        }
        
        // New visitors: only page views, no other interactions
        if (hasPageView && eventTypes.length === 1) {
          segments.new_visitors++;
        }
        
        // Engaged users: multiple different event types
        const uniqueEventTypes = new Set(eventTypes).size;
        if (uniqueEventTypes >= 3) {
          segments.engaged_users++;
        }
        
        // Potential customers: added to cart but haven't purchased yet
        if (hasAddToCart && !hasPurchase) {
          segments.potential_customers++;
        }
        
        // Repeat customers: multiple purchase events
        const purchaseCount = eventTypes.filter(type => 
          type.includes('purchase') || type.includes('Purchase')
        ).length;
        if (purchaseCount > 1) {
          segments.repeat_customers++;
        }
      });
    }

    return segments;
  }

  private calculateEngagementMetrics(events: DataEvent[]): any {
    const totalEvents = events.length;
    
    // Get unique users from all possible user ID fields
    const uniqueUsers = new Set(
      events
        .map(e => e.eventData?.userId || e.eventData?.user_id || e.eventData?.customer_id)
        .filter(Boolean)
    ).size;
    
    // Calculate engagement based on event diversity and frequency
    const eventTypeCounts = this.groupEventsByType(events);
    const uniqueEventTypes = Object.keys(eventTypeCounts).length;
    
    // Calculate average events per user
    const eventsPerUser = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0;
    
    // Engagement score based on event diversity and frequency
    const diversityScore = Math.min(uniqueEventTypes / 10, 1); // Max 1.0 for 10+ event types
    const frequencyScore = Math.min(eventsPerUser / 5, 1); // Max 1.0 for 5+ events per user
    const engagementScore = (diversityScore + frequencyScore) / 2;
    
    return {
      totalEvents,
      uniqueUsers,
      eventsPerUser,
      uniqueEventTypes,
      engagementScore,
      diversityScore,
      frequencyScore
    };
  }

  private analyzeConversionFunnel(events: DataEvent[]): any {
    const funnel = {
      page_views: 0,
      add_to_cart: 0,
      checkout_started: 0,
      purchases: 0,
      customer_created: 0,
      leads: 0
    };

    events.forEach(event => {
      const eventType = event.eventType.toLowerCase();
      
      // Page views (all sources)
      if (eventType.includes('page_view') || eventType.includes('pageview')) {
        funnel.page_views++;
      }
      
      // Add to cart (all sources)
      if (eventType.includes('add_to_cart') || eventType.includes('addtocart')) {
        funnel.add_to_cart++;
      }
      
      // Checkout started (Shopify specific)
      if (eventType.includes('checkout_started') || eventType.includes('checkoutstarted')) {
        funnel.checkout_started++;
      }
      
      // Purchases (all sources)
      if (eventType.includes('purchase') || eventType.includes('purchased')) {
        funnel.purchases++;
      }
      
      // Customer creation (Shopify specific)
      if (eventType.includes('customer_created') || eventType.includes('customercreated')) {
        funnel.customer_created++;
      }
      
      // Leads (Facebook Pixel specific)
      if (eventType.includes('lead') || eventType.includes('complete_registration')) {
        funnel.leads++;
      }
    });

    // Calculate conversion rates
    const conversionRates = {
      cartToPurchase: funnel.add_to_cart > 0 ? (funnel.purchases / funnel.add_to_cart) * 100 : 0,
      viewToCart: funnel.page_views > 0 ? (funnel.add_to_cart / funnel.page_views) * 100 : 0,
      viewToPurchase: funnel.page_views > 0 ? (funnel.purchases / funnel.page_views) * 100 : 0,
      checkoutToPurchase: funnel.checkout_started > 0 ? (funnel.purchases / funnel.checkout_started) * 100 : 0
    };

    return {
      ...funnel,
      conversionRates
    };
  }

  private async buildContext(userId: string): Promise<any> {
    // Build context from user's data sources, campaigns, and history
    // This would integrate with other services to gather relevant data
    return {
      userId,
      timestamp: new Date(),
      // Add more context as needed
    };
  }
}
