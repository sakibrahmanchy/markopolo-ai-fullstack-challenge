# Backend Modules Documentation

This document provides detailed documentation for each backend module in the PulseHub application, based on the current implementation.

## Table of Contents

1. [Auth Module](#auth-module)
2. [Chat Module](#chat-module)
3. [AI Module](#ai-module)
4. [Data Integration Module](#data-integration-module)
5. [User Module](#user-module)

---

## Auth Module

**Location**: `backend/src/modules/auth/`

### Overview
The Auth Module handles user authentication, authorization, and session management using JWT tokens with refresh token support.

### Module Structure
```
auth/
├── auth.module.ts           # Module configuration
├── auth.service.ts          # Core authentication logic
├── auth.controller.ts       # HTTP endpoints
├── dto/                     # Data Transfer Objects
│   ├── login.dto.ts
│   ├── register.dto.ts
│   ├── refresh-token.dto.ts
│   └── logout.dto.ts
├── guards/
│   └── jwt-auth.guard.ts    # JWT authentication guard
└── strategies/
    └── jwt.strategy.ts      # Passport JWT strategy
```

### Dependencies
- **TypeORM**: For database operations
- **JWT**: For token generation and validation
- **Passport**: For authentication strategies
- **bcrypt**: For password hashing
- **uuid**: For JWT ID generation

### Entities Used
- `User` - User account information
- `UserSession` - Active user sessions
- `TokenBlacklist` - Blacklisted tokens

### Key Features

#### 1. User Registration
```typescript
async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; tokens: any }>
```
- Validates email uniqueness
- Hashes password with bcrypt (12 salt rounds)
- Creates user account
- Generates JWT tokens
- Creates user session

**Required Fields:**
- `email` (string)
- `password` (string)
- `firstName` (string, optional)
- `lastName` (string, optional)
- `companyName` (string, optional)

#### 2. User Login
```typescript
async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ user: Partial<User>; tokens: any }>
```
- Validates credentials
- Updates last login timestamp
- Generates new JWT tokens
- Creates user session with IP and User-Agent tracking

#### 3. Token Refresh
```typescript
async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ tokens: any }>
```
- Validates refresh token
- Generates new access and refresh tokens
- Updates session with new refresh token hash

#### 4. User Logout
```typescript
async logout(logoutDto: LogoutDto, userId: string): Promise<void>
```
- Revokes user session
- Adds access token to blacklist (when JTI is available)

#### 5. Token Management
- **Access Token**: 1 hour expiration
- **Refresh Token**: 7 days expiration
- **JWT ID (JTI)**: Unique identifier for token tracking
- **Session Tracking**: IP address and User-Agent logging

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | User logout | Yes |

### Security Features
- Password hashing with bcrypt (12 salt rounds)
- JWT token validation
- Session management with IP tracking
- Token blacklisting support
- Refresh token rotation

---

## Chat Module

**Location**: `backend/src/modules/chat/`

### Overview
The Chat Module handles conversation management, message processing, and real-time AI response streaming using Server-Sent Events (SSE).

### Module Structure
```
chat/
├── chat.module.ts           # Module configuration
├── chat.service.ts          # Core chat logic
├── chat.controller.ts       # HTTP endpoints
└── dto/                     # Data Transfer Objects
    ├── create-conversation.dto.ts
    └── send-message.dto.ts
```

### Dependencies
- **TypeORM**: For database operations
- **AuthModule**: For user authentication
- **AIModule**: For AI-powered responses
- **Express Response**: For SSE streaming

### Entities Used
- `Conversation` - Chat conversations
- `Message` - Individual messages
- `User` - User information

### Key Features

#### 1. Conversation Management
```typescript
async createConversation(userId: string, createConversationDto: CreateConversationDto): Promise<Conversation>
async getConversations(userId: string): Promise<Conversation[]>
async getConversation(userId: string, conversationId: string): Promise<Conversation>
async deleteConversation(userId: string, conversationId: string): Promise<void>
```
- Supports both authenticated and anonymous users
- Automatic conversation creation if none provided
- Conversation history with message ordering

#### 2. Message Processing
```typescript
async sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<Message>
```
- Saves user messages to database
- Updates conversation timestamps
- Supports both authenticated and anonymous users

#### 3. AI Response Streaming
```typescript
async streamAIResponse(userId: string, conversationId: string, userMessage: string, res: Response): Promise<void>
```
- **Server-Sent Events (SSE)** for real-time streaming
- **Intent Analysis**: Analyzes user message intent
- **Campaign Recommendations**: For authenticated users with data sources
- **Context Building**: Includes conversation history and user data
- **Error Handling**: Graceful fallback responses

#### 4. Intent Analysis
```typescript
private async getIntentAnalysis(userMessage: string): Promise<any>
```
- Uses AI service to analyze user intent
- Determines if authentication is required
- Identifies module and action needed
- Extracts entities from user message

#### 5. Campaign Query Detection
```typescript
private isCampaignQuery(userMessage: string): boolean
```
- Detects marketing-related queries
- Keywords: campaign, marketing, email, sms, push, whatsapp, audience, segment, etc.
- Triggers campaign recommendation generation

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/conversations` | Create conversation | Optional |
| GET | `/conversations` | Get user conversations | Yes |
| GET | `/conversations/:id` | Get specific conversation | Yes |
| POST | `/conversations/messages` | Send message | Optional |
| GET | `/conversations/:id/stream` | Stream AI response | Optional |
| DELETE | `/conversations/:id` | Delete conversation | Yes |

### SSE Event Types
- `intent` - Intent analysis results
- `chunk` - Streaming text content
- `campaign_recommendation` - Campaign suggestions
- `recommendation` - General recommendations
- `campaign` - Campaign data
- `complete` - Stream completion
- `error` - Error messages

### Anonymous User Support
- Anonymous users can create conversations and send messages
- Limited to basic AI responses (no campaign recommendations)
- Conversations are not tied to user accounts

---

## AI Module

**Location**: `backend/src/modules/ai/`

### Overview
The AI Module provides AI-powered services including intent analysis, content generation, data analysis, and campaign recommendations using OpenAI GPT-4o-mini.

### Module Structure
```
ai/
├── ai.module.ts                    # Module configuration
├── ai.service.ts                   # Core AI logic
├── ai.controller.ts                # HTTP endpoints
├── dto/
│   └── provide-feedback.dto.ts     # Feedback DTO
├── interfaces/
│   └── ai-provider.interface.ts    # AI provider interface
├── providers/
│   └── gpt.provider.ts             # OpenAI GPT implementation
├── learning.service.ts             # Learning and feedback (commented out)
└── recommendation-history.service.ts # Recommendation tracking (commented out)
```

### Dependencies
- **TypeORM**: For database operations
- **OpenAI API**: For AI-powered responses
- **ConfigModule**: For environment configuration

### Entities Used
- `RecommendationHistory` - AI recommendation tracking
- `AIProviderConfig` - AI provider configuration
- `DataEvent` - Event data for analysis
- `DataSource` - Data source information

### Key Features

#### 1. Intent Analysis
```typescript
async analyzeIntent(userMessage: string)
```
- Analyzes user message intent using AI
- Determines required authentication level
- Identifies target module and action
- Extracts relevant entities

#### 2. Content Generation
```typescript
async generateContent(prompt: string, context: any): Promise<GeneratedContent>
```
- Generates AI responses based on prompts
- Handles JSON parsing from markdown-wrapped responses
- Supports context-aware content generation

#### 3. Data Analysis
```typescript
async analyzeData(data: any, analysisType: string): Promise<AnalysisResult>
```
- Analyzes user data for insights
- Performs user segmentation
- Calculates engagement metrics
- Analyzes conversion funnels

#### 4. Campaign Recommendations
```typescript
async generateCampaignRecommendations(userMessage: string, userId: string): Promise<any>
```
- **Data Source Validation**: Checks for connected data sources
- **User Data Analysis**: Analyzes recent events and patterns
- **User Segmentation**: Identifies user segments (cart abandoners, high-value customers, etc.)
- **Campaign Generation**: Creates targeted campaigns for each segment

#### 5. User Segmentation
```typescript
private identifyUserSegments(events: DataEvent[]): any
```
Identifies user segments based on behavior:
- **Cart Abandoners**: Added to cart but didn't purchase
- **High Value Customers**: Made high-value purchases (>$100)
- **New Visitors**: Only page views, no other interactions
- **Engaged Users**: Multiple different event types
- **Potential Customers**: Added to cart but haven't purchased
- **Repeat Customers**: Multiple purchase events

#### 6. Engagement Metrics
```typescript
private calculateEngagementMetrics(events: DataEvent[]): any
```
- Total events count
- Unique users count
- Events per user ratio
- Event type diversity
- Engagement score calculation

#### 7. Conversion Funnel Analysis
```typescript
private analyzeConversionFunnel(events: DataEvent[]): any
```
Tracks conversion funnel stages:
- Page views
- Add to cart
- Checkout started
- Purchases
- Customer creation
- Lead generation

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/ai/providers` | Get AI provider status | Yes |
| GET | `/ai/recommendations/history` | Get recommendation history | Yes |
| POST | `/ai/recommendations/:id/feedback` | Provide feedback | Yes |
| GET | `/ai/insights` | Get AI insights | Yes |

### GPT Provider Implementation
- **Model**: GPT-4o-mini
- **Temperature**: 0.7
- **Max Tokens**: 1000
- **JSON Parsing**: Handles markdown-wrapped JSON responses
- **Error Handling**: Graceful fallback responses

### Data Analysis Capabilities
- **Event Grouping**: By type and source
- **Time Range Analysis**: Recent event patterns
- **User Behavior Analysis**: Individual user patterns
- **Conversion Rate Calculation**: Funnel performance metrics
- **Engagement Scoring**: User engagement levels

---

## Data Integration Module

**Location**: `backend/src/modules/data-integration/`

### Overview
The Data Integration Module handles data source connections, data synchronization, and dummy data generation for testing purposes.

### Module Structure
```
data-integration/
├── data-integration.module.ts      # Module configuration
├── data-integration.service.ts     # Core integration logic
├── data-integration.controller.ts  # HTTP endpoints
├── oauth.controller.ts             # OAuth endpoints
├── adapters/                       # Data source adapters
│   ├── gtm.adapter.service.ts
│   ├── facebook-pixel.adapter.service.ts
│   └── shopify.adapter.service.ts
├── services/                       # Supporting services
│   ├── data-validator.service.ts
│   ├── schema-mapper.service.ts
│   ├── data-transformer.service.ts
│   ├── event-processor.service.ts
│   └── oauth.service.ts
└── dto/                           # Data Transfer Objects
    ├── create-data-source.dto.ts
    ├── test-connection.dto.ts
    └── store-dummy-data.dto.ts
```

### Dependencies
- **TypeORM**: For database operations
- **AuthModule**: For user authentication
- **ConfigModule**: For environment configuration

### Entities Used
- `DataSource` - Connected data sources
- `DataEvent` - Event data from sources
- `OAuthSession` - OAuth authentication sessions

### Key Features

#### 1. Data Source Management
```typescript
async createDataSource(userId: string, createDataSourceDto: CreateDataSourceDto): Promise<DataSource>
async getDataSources(userId: string): Promise<DataSource[]>
async getDataSourceById(id: string, userId: string): Promise<DataSource>
async deleteDataSource(id: string, userId: string): Promise<void>
```
- **Supported Sources**: GTM, Facebook Pixel, Shopify
- **Configuration Validation**: Validates source-specific configs
- **Connection Testing**: Tests connections before saving
- **User Isolation**: Each user's sources are isolated

#### 2. Data Synchronization
```typescript
async syncDataSource(id: string, userId: string): Promise<{ success: boolean; eventsCount: number }>
```
- **Source-Specific Fetching**: Uses appropriate adapter for each source
- **Event Processing**: Processes and stores events
- **Error Handling**: Updates source status on failure
- **Last Sync Tracking**: Records sync timestamps

#### 3. Dummy Data Generation
```typescript
async storeDummyData(userId: string, storeDummyDataDto: StoreDummyDataDto): Promise<DataEvent[]>
async generateBulkDummyData(userId: string, sourceType: 'gtm' | 'facebook_pixel' | 'shopify'): Promise<DataEvent[]>
```
- **Individual Events**: Generate single dummy events
- **Bulk Generation**: Generate 50-100 random events
- **Source-Specific Data**: Tailored data for each source type
- **Realistic Data**: Includes realistic timestamps and user IDs

#### 4. Data Source Adapters

##### GTM Adapter
- **Container ID**: GTM container identification
- **Event Types**: page_view, click, form_submit, purchase, add_to_cart, scroll
- **Data Fields**: tagId, triggerId, variableId, pageUrl, userId, sessionId

##### Facebook Pixel Adapter
- **Pixel ID**: Facebook Pixel identification
- **Event Types**: PageView, AddToCart, Purchase, Lead, CompleteRegistration, ViewContent
- **Data Fields**: eventId, eventName, pixelId, userId, sessionId, value, currency

##### Shopify Adapter
- **Shop Domain**: Shopify store identification
- **Event Types**: purchase, add_to_cart, view_product, checkout_started, checkout_completed, customer_created
- **Data Fields**: orderId, customerId, productId, productTitle, productPrice, quantity, shopDomain

#### 5. Event Processing
```typescript
async processEvents(events: any[], dataSourceId: string): Promise<DataEvent[]>
```
- **Data Validation**: Validates event structure
- **Schema Mapping**: Maps source-specific data to common format
- **Data Transformation**: Normalizes data across sources
- **Database Storage**: Stores processed events

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/data-sources` | Create data source | Yes |
| GET | `/data-sources` | Get user data sources | Yes |
| GET | `/data-sources/:id` | Get data source by ID | Yes |
| POST | `/data-sources/:id/test` | Test connection | Yes |
| POST | `/data-sources/:id/sync` | Sync data | Yes |
| GET | `/data-sources/:id/events` | Get data events | Yes |
| DELETE | `/data-sources/:id` | Delete data source | Yes |
| POST | `/data-sources/dummy-data` | Store dummy data | Yes |
| POST | `/data-sources/dummy-data/bulk/:sourceType` | Generate bulk dummy data | Yes |
| POST | `/data-sources/dummy-data/seed-all` | Generate all dummy data | Yes |

### Dummy Data Features
- **Realistic Timestamps**: Random times within last 7 days
- **User ID Generation**: Consistent user IDs across events
- **Session Tracking**: Session IDs for user journey tracking
- **Source-Specific Fields**: Appropriate data fields for each source
- **Bulk Generation**: 50-100 events per bulk generation
- **All Sources**: Support for GTM, Facebook Pixel, and Shopify

---

## User Module

**Location**: `backend/src/modules/user/`

### Overview
The User Module provides basic user profile management and user data retrieval functionality.

### Module Structure
```
user/
├── user.module.ts           # Module configuration
├── user.service.ts          # Core user logic
└── user.controller.ts       # HTTP endpoints
```

### Dependencies
- **TypeORM**: For database operations
- **AuthModule**: For authentication (via JWT guard)

### Entities Used
- `User` - User account information

### Key Features

#### 1. User Profile Management
```typescript
async getProfile(id: string): Promise<Partial<User>>
async updateProfile(id: string, updateData: Partial<User>): Promise<User>
```
- **Profile Retrieval**: Gets user profile information
- **Profile Updates**: Updates user profile data
- **Data Sanitization**: Returns only safe user data

#### 2. User Lookup
```typescript
async findById(id: string): Promise<User>
async findByEmail(email: string): Promise<User | null>
```
- **ID Lookup**: Finds user by ID
- **Email Lookup**: Finds user by email address
- **Error Handling**: Throws NotFoundException for missing users

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/user/profile` | Get user profile | Yes |

### Profile Data Structure
```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  isVerified: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Security Features
- **JWT Authentication**: All endpoints require valid JWT token
- **User Isolation**: Users can only access their own data
- **Data Sanitization**: Sensitive data (password hash) is excluded from responses

---

## Module Dependencies

### Inter-Module Dependencies
```
AuthModule
├── Used by: ChatModule, DataIntegrationModule, UserModule, AIModule
└── Provides: JWT authentication, user validation

AIModule
├── Used by: ChatModule
└── Provides: AI services, intent analysis, campaign recommendations

ChatModule
├── Depends on: AuthModule, AIModule
└── Provides: Conversation management, message streaming

DataIntegrationModule
├── Depends on: AuthModule
└── Provides: Data source management, event processing

UserModule
├── Depends on: AuthModule
└── Provides: User profile management
```

### Database Dependencies
- **User Entity**: Used by Auth, Chat, DataIntegration, User modules
- **Conversation Entity**: Used by Chat module
- **Message Entity**: Used by Chat module
- **DataSource Entity**: Used by DataIntegration, AI modules
- **DataEvent Entity**: Used by DataIntegration, AI modules
- **UserSession Entity**: Used by Auth module
- **TokenBlacklist Entity**: Used by Auth module
- **RecommendationHistory Entity**: Used by AI module
- **AIProviderConfig Entity**: Used by AI module
- **OAuthSession Entity**: Used by DataIntegration module

---

## Configuration Requirements

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/pulsehub

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=3600s

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Redis (if enabled)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=development
PORT=3000
```

### Database Schema
All modules rely on TypeORM entities that are automatically synchronized with the database schema. The database tables are created based on the entity definitions in the `entities/` directory.

---

## Error Handling

### Common Error Types
- **NotFoundException**: Resource not found (404)
- **UnauthorizedException**: Authentication required (401)
- **ConflictException**: Resource already exists (409)
- **BadRequestException**: Invalid request data (400)

### Error Response Format
```typescript
{
  statusCode: number;
  message: string;
  error: string;
}
```

### Module-Specific Errors
- **AuthModule**: Invalid credentials, user already exists, invalid tokens
- **ChatModule**: Conversation not found, invalid message format
- **AIModule**: AI service unavailable, invalid data format
- **DataIntegrationModule**: Invalid source configuration, connection failed
- **UserModule**: User not found, invalid profile data

---

This documentation reflects the current implementation of the PulseHub backend modules as of the latest codebase state.
