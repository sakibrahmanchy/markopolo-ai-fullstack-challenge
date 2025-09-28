# API Design

## Base URL
```
http://localhost:5900
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

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Acme Corp",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 50000
  }
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
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Acme Corp"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 50000
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

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "sourceType": "gtm",
    "name": "Main Website GTM",
    "config": {
      "container_id": "GTM-XXXXXXX",
      "api_key": "your_api_key"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Connect Data Source
```http
POST /data-sources
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "sourceType": "gtm",
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

#### Store Dummy Data
```http
POST /data-sources/dummy-data
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "sourceType": "gtm",
  "eventType": "page_view",
  "eventData": {
    "pageUrl": "/home",
    "userId": "user123"
  },
  "count": 10
}
```

#### Generate Bulk Dummy Data
```http
POST /data-sources/dummy-data/bulk/gtm
Authorization: Bearer <jwt_token>
```

#### Seed All Dummy Data
```http
POST /data-sources/dummy-data/seed-all
Authorization: Bearer <jwt_token>
```

### 3. User API

#### Get User Profile
```http
GET /user/profile
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 4. AI API

#### Get AI Providers
```http
GET /ai/providers
Authorization: Bearer <jwt_token>
```

#### Get Recommendation History
```http
GET /ai/recommendations/history?limit=20&offset=0
Authorization: Bearer <jwt_token>
```

#### Provide Feedback
```http
POST /ai/recommendations/{recommendation_id}/feedback
Authorization: Bearer <jwt_token>
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
  "type": "campaign_recommendation",
  "data": {
    "campaigns": [
      {
        "id": "campaign_1",
        "name": "Cart Abandonment Recovery",
        "audience": {
          "segment": "cart_abandoners",
          "size": 1250,
          "criteria": "Users who added items to cart but didn't purchase"
        },
        "channels": [
          {
            "type": "email",
            "message": "Complete your purchase! You have items waiting in your cart.",
            "timing": "optimal_send_time"
          },
          {
            "type": "sms",
            "message": "Don't forget your items! Complete checkout now.",
            "timing": "immediate"
          }
        ]
      }
    ]
  }
}
```

### Intent Analysis Response
```json
{
  "type": "intent",
  "data": {
    "intent": "campaign_management",
    "confidence": 0.85,
    "requiresAuth": true,
    "module": "campaigns",
    "action": "recommend",
    "entities": {
      "campaignName": null,
      "dataSource": null,
      "timeframe": "24h"
    }
  }
}
```

## Current API Implementation

### Available Endpoints
- ✅ Authentication: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- ✅ User Profile: `/user/profile`
- ✅ Chat: `/conversations`, `/conversations/:id/messages`, `/conversations/:id/stream`
- ✅ Data Sources: `/data-sources`, `/data-sources/dummy-data/*`
- ✅ AI: `/ai/providers`, `/ai/recommendations/history`, `/ai/recommendations/:id/feedback`

### Not Yet Implemented
- ❌ Campaign execution endpoints
- ❌ Real-time campaign monitoring
- ❌ Advanced analytics endpoints
- ❌ Channel-specific deployment APIs
