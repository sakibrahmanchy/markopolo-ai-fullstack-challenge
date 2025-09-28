export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSource {
  id: string;
  userId: string;
  sourceType: 'gtm' | 'facebook_pixel' | 'shopify';
  name: string;
  config?: Record<string, any>;
  oauthSessionId?: string;
  status: 'active' | 'inactive' | 'error' | 'needs_reauth';
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataEvent {
  id: string;
  dataSourceId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: string;
  processed: boolean;
  createdAt: string;
}

export interface OAuthSession {
  id: string;
  userId: string;
  source: 'google' | 'facebook' | 'shopify';
  status: 'active' | 'inactive' | 'revoked' | 'expired';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
}

export interface CreateDataSourceRequest {
  sourceType: 'gtm' | 'facebook_pixel' | 'shopify';
  name: string;
  config?: Record<string, any>;
}
