export interface AIProvider {
  // Core AI operations
  generateRecommendations(query: string, context: any): Promise<Recommendation[]>;
  parseQuery(query: string): Promise<ParsedQuery>;
  generateContent(prompt: string, context: any): Promise<GeneratedContent>;
  analyzeData(data: any, analysisType: string): Promise<AnalysisResult>;
  
  // Intent analysis
  analyzeIntent(userMessage: string): Promise<IntentAnalysis>;
  
  // Streaming response
  streamResponse(
    userMessage: string,
    context: any,
    onChunk: (chunk: string) => void,
    onRecommendation: (recommendation: any) => void,
    onCampaign: (campaign: any) => void,
    onComplete: (fullResponse: string) => void,
  ): Promise<void>;
  
  // Learning and improvement
  learnFromFeedback(feedback: FeedbackData): Promise<void>;
  updateContext(userId: string, context: any): Promise<void>;
  
  // Provider-specific methods
  getProviderInfo(): ProviderInfo;
  isHealthy(): Promise<boolean>;
}

export interface Recommendation {
  id: string;
  type: 'audience' | 'channel' | 'timing' | 'content';
  data: any;
  confidence: number;
  reasoning: string;
}

export interface ParsedQuery {
  intent: string;
  entities: Record<string, any>;
  context: Record<string, any>;
}

export interface GeneratedContent {
  type: 'email' | 'sms' | 'push' | 'whatsapp';
  subject?: string;
  content: string;
  metadata: Record<string, any>;
}

export interface AnalysisResult {
  type: string;
  insights: string[];
  metrics: Record<string, number>;
  recommendations: string[];
}

export interface FeedbackData {
  recommendationId: string;
  feedback: 'positive' | 'negative' | 'neutral';
  campaignResults?: {
    openRate?: number;
    clickRate?: number;
    conversionRate?: number;
    revenue?: number;
  };
  timestamp: Date;
}

export interface IntentAnalysis {
  intent: 'campaign_management' | 'data_analytics' | 'data_sources' | 'recommendations' | 'general';
  confidence: number;
  requiresAuth: boolean;
  module: 'campaigns' | 'analytics' | 'sources' | 'recommendations' | 'general';
  action: 'view' | 'create' | 'update' | 'delete' | 'analyze' | 'connect' | 'recommend';
  entities: {
    campaignName?: string | null;
    dataSource?: string | null;
    timeframe?: string | null;
  };
}

export interface ProviderInfo {
  name: string;
  version: string;
  capabilities: string[];
  costPerRequest?: number;
}
