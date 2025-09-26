# API Design

## Base URL
```
https://api.pulsehub.com/v1
```

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp"
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout User
```http
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Authentication Header
```http
Authorization: Bearer <access_token>
```

## Core Endpoints

### 1. Chat Interface API

#### Start Conversation
```http
POST /conversations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Customer Engagement Campaign"
}
```

#### Send Message
```http
POST /conversations/{conversation_id}/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Show me customers who abandoned cart in the last 24 hours",
  "role": "user"
}
```

#### Stream AI Response
```http
GET /conversations/{conversation_id}/stream
Authorization: Bearer <access_token>
Accept: text/event-stream

# Response streams JSON chunks:
data: {"type": "recommendation", "data": {...}}
data: {"type": "campaign", "data": {...}}
data: {"type": "complete"}
```

### 2. Data Sources API

#### List User's Data Sources
```http
GET /data-sources
Authorization: Bearer <jwt_token>
```

#### Connect Data Source
```http
POST /data-sources
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "source_type": "gtm",
  "name": "Main Website GTM",
  "config": {
    "container_id": "GTM-XXXXXXX",
    "api_key": "your_api_key"
  }
}
```

#### Test Connection
```http
POST /data-sources/{source_id}/test
Authorization: Bearer <jwt_token>
```

### 3. Campaigns API

#### Create Campaign
```http
POST /campaigns
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Cart Abandonment Campaign",
  "description": "Target users who abandoned cart",
  "channels": ["email", "sms"],
  "audience": {
    "segment": "cart_abandoners",
    "filters": {
      "last_activity": "24h",
      "value_range": [100, 1000]
    }
  },
  "content": {
    "email": {
      "subject": "Complete your purchase!",
      "template": "cart_abandonment"
    },
    "sms": {
      "message": "Don't forget your items! Complete checkout now."
    }
  }
}
```

#### List User's Campaigns
```http
GET /campaigns?status=running&limit=20&offset=0
Authorization: Bearer <jwt_token>
```

#### Get Campaign Performance
```http
GET /campaigns/{campaign_id}/metrics
Authorization: Bearer <jwt_token>
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {...},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data source configuration",
    "details": {...}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Streaming Response Format
```json
{
  "type": "recommendation",
  "data": {
    "audience": {
      "segment": "high_value_customers",
      "size": 1250,
      "criteria": ["purchase_history", "engagement_score"]
    },
    "channels": [
      {
        "type": "email",
        "priority": 1,
        "expected_roi": 3.2
      }
    ],
    "timing": {
      "optimal_send_time": "2024-01-15T14:00:00Z",
      "timezone": "UTC"
    }
  },
  "metadata": {
    "ai_provider": "gpt",
    "confidence_score": 0.85,
    "recommendation_id": "uuid"
  }
}
```

### AI Provider Management

#### Get AI Provider Status
```http
GET /ai/providers
Authorization: Bearer <access_token>
```

#### Update AI Provider Configuration
```http
PUT /ai/providers/{provider_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "isActive": true,
  "config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

#### Get Recommendation History
```http
GET /ai/recommendations/history?limit=20&offset=0
Authorization: Bearer <access_token>
```

#### Provide Feedback on Recommendation
```http
POST /ai/recommendations/{recommendation_id}/feedback
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "feedback": "positive",
  "campaignResults": {
    "openRate": 0.25,
    "clickRate": 0.08,
    "conversionRate": 0.03,
    "revenue": 1500
  }
}
```
