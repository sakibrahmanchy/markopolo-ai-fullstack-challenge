# System Design - High Level Architecture

## Overview

PulseHub is a real-time, AI-powered marketing platform that connects multiple data sources and enables multi-channel campaign execution through an intuitive chat interface. The system is built with NestJS backend and React frontend, using Docker for containerization.

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend - React/TypeScript"
        A[React App with Vite]
        B[Redux Toolkit Store]
        C[RTK Query API Layer]
        D[Streaming Response Hook]
    end
    
    subgraph "Backend - NestJS"
        E[Auth Module]
        F[Chat Module]
        G[AI Module]
        H[Data Integration Module]
        I[User Module]
    end
    
    subgraph "Data Sources"
        J[Google Tag Manager]
        K[Facebook Pixel]
        L[Shopify API]
    end
    
    subgraph "Infrastructure"
        M[PostgreSQL Database]
        N[Redis Cache]
        O[Docker Compose]
        P[Nginx Reverse Proxy]
    end
    
    A --> B
    B --> C
    C --> E
    C --> F
    C --> G
    C --> H
    C --> I
    D --> F
    H --> J
    H --> K
    H --> L
    E --> M
    F --> M
    G --> M
    H --> M
    I --> M
    E --> N
    F --> N
    G --> N
    O --> M
    O --> N
    P --> A
    P --> E
```

## Core NestJS Modules

### 1. Auth Module
- **Purpose**: User authentication and authorization
- **Features**: JWT tokens, user registration/login, session management, token refresh
- **Components**: AuthController, AuthService, JwtStrategy, UserEntity, UserSession, TokenBlacklist
- **Endpoints**: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`

### 2. Chat Module
- **Purpose**: Real-time chat communication with AI streaming
- **Features**: Message streaming via SSE, conversation management, intent analysis
- **Components**: ChatController, ChatService, ConversationEntity, MessageEntity
- **Endpoints**: `/conversations`, `/conversations/:id/messages`, `/conversations/:id/stream`

### 3. AI Module
- **Purpose**: Generate contextual marketing recommendations using AI
- **Features**: Intent analysis, campaign recommendations, data analysis, streaming responses
- **Components**: AIService, GPTProvider, LearningService, RecommendationHistoryService
- **Endpoints**: `/ai/providers`, `/ai/recommendations/history`, `/ai/recommendations/:id/feedback`

### 4. Data Integration Module
- **Purpose**: Connect and sync with external data sources
- **Features**: Data source management, dummy data generation, OAuth integration
- **Components**: DataIntegrationService, GTMAdapterService, FacebookPixelAdapterService, ShopifyAdapterService, OAuthService
- **Endpoints**: `/data-sources`, `/data-sources/dummy-data`, `/oauth/:provider`

### 5. User Module
- **Purpose**: User profile management
- **Features**: User profile retrieval and updates
- **Components**: UserController, UserService
- **Endpoints**: `/user/profile`

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant B as Backend (NestJS)
    participant AI as AI Service
    participant DI as Data Integration Module
    participant DB as PostgreSQL
    participant R as Redis
    
    U->>F: Ask question about customers
    F->>B: Send message via HTTP POST
    B->>AI: Process natural language query
    AI->>DI: Request relevant data
    DI->>DB: Query user's data sources
    DB-->>DI: Return aggregated data
    AI->>AI: Generate recommendations via GPT
    AI-->>B: Stream JSON recommendations via SSE
    B-->>F: Stream recommendations via SSE
    F-->>U: Display recommendations
    U->>F: Request dummy data
    F->>B: POST /data-sources/dummy-data
    B->>DI: Generate dummy events
    DI->>DB: Store dummy data
    DB-->>DI: Confirm storage
    DI-->>B: Return success
    B-->>F: Return success
    F-->>U: Show data sources connected
```

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **ORM**: TypeORM
- **Real-time**: Server-Sent Events (SSE)
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **AI**: OpenAI GPT-4o-mini
- **Authentication**: JWT with refresh tokens

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Redux Toolkit + RTK Query
- **Real-time**: Fetch API with SSE
- **Routing**: React Router v6

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL with TypeORM synchronize
- **Caching**: Redis
- **Reverse Proxy**: Nginx
- **Development**: Docker-based local environment

## Current Implementation Architecture

### 1. Chat Service (NestJS)

```mermaid
graph TB
    subgraph "NestJS Chat Module"
        A[ChatController]
        B[ChatService]
        C[CurrentUser Decorator]
    end
    
    subgraph "Message Processing"
        D[Intent Analysis]
        E[AI Service Integration]
        F[SSE Streaming]
    end
    
    subgraph "TypeORM Entities"
        G[Conversation Entity]
        H[Message Entity]
        I[User Entity]
    end
    
    A --> B
    B --> D
    D --> E
    E --> F
    B --> G
    B --> H
    B --> I
```

**Key Features:**
- Real-time message streaming with SSE
- Intent analysis for authentication prompts
- AI-powered campaign recommendations
- Anonymous user support

### 2. AI Module Architecture (NestJS)

```mermaid
graph TB
    subgraph "NestJS AI Module"
        A[AIService]
        B[GPTProvider]
        C[LearningService]
        D[RecommendationHistoryService]
    end
    
    subgraph "AI Operations"
        E[Intent Analysis]
        F[Campaign Recommendations]
        G[Data Analysis]
        H[User Segmentation]
    end
    
    subgraph "Data Integration"
        I[DataEvent Repository]
        J[DataSource Repository]
        K[User Data Analysis]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    B --> F
    A --> G
    A --> H
    A --> I
    A --> J
    A --> K
```

**Components:**
- **AIService**: Main service that orchestrates AI operations and data analysis
- **GPTProvider**: OpenAI GPT-4o-mini integration for intent analysis and recommendations
- **LearningService**: Handles feedback collection and model improvement
- **RecommendationHistoryService**: Tracks recommendations and outcomes

### 3. Data Integration Service (NestJS)

```mermaid
graph TB
    subgraph "NestJS Data Integration Module"
        A[DataIntegrationService]
        B[GTMAdapterService]
        C[FacebookPixelAdapterService]
        D[ShopifyAdapterService]
        E[EventProcessorService]
    end
    
    subgraph "Data Processing"
        F[Dummy Data Generation]
        G[Data Validation]
        H[Event Processing]
    end
    
    subgraph "TypeORM Entities"
        I[DataSource Entity]
        J[DataEvent Entity]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    E --> G
    E --> H
    A --> I
    A --> J
```

**Data Flow:**
1. **Dummy Data Generation**: Create synthetic data for testing
2. **Data Validation**: Validate event data structure
3. **Event Processing**: Store events in database
4. **Data Analysis**: Analyze user data for AI recommendations

## Current Implementation Status

### Implemented Features
- ✅ User authentication (JWT with refresh tokens)
- ✅ Chat interface with SSE streaming
- ✅ AI intent analysis and campaign recommendations
- ✅ Data source management and dummy data generation
- ✅ Docker Compose setup with PostgreSQL and Redis
- ✅ Real-time message streaming
- ✅ Anonymous user support

### Not Yet Implemented
- ❌ Campaign execution and deployment
- ❌ Channel-specific handlers (Email, SMS, Push, WhatsApp)
- ❌ Real-time campaign monitoring
- ❌ Performance analytics dashboard
- ❌ A/B testing capabilities
- ❌ Advanced user segmentation

## NestJS Module Communication

### Inter-Module Communication

```mermaid
sequenceDiagram
    participant CG as Chat Gateway
    participant CS as Chat Service
    participant AI as AI Service
    participant DI as Data Integration Service
    participant CM as Campaign Service
    participant DB as Database
    participant Cache as Redis
    
    CG->>CS: Process user query
    CS->>AI: Process natural language query
    AI->>Cache: Check cached data
    alt Cache Miss
        AI->>DI: Request fresh data
        DI->>DB: Query data sources
        DB-->>DI: Return data
        DI-->>AI: Processed data
        AI->>Cache: Store in cache
    else Cache Hit
        Cache-->>AI: Return cached data
    end
    AI->>AI: Generate recommendations via AI Provider
    AI-->>CS: Stream recommendations
    CS-->>CG: Stream to client
    CG->>CM: Create campaign request
    CM->>DB: Store campaign
    CM-->>CG: Campaign created
```

## Data Flow Patterns

### 1. Real-time Data Processing

```mermaid
graph LR
    A[Data Sources] --> B[Message Queue]
    B --> C[Stream Processor]
    C --> D[Data Validator]
    D --> E[Feature Store]
    E --> F[ML Pipeline]
    F --> G[Recommendation Engine]
    G --> H[Chat Interface]
```

### 2. Campaign Execution Flow

```mermaid
graph TB
    A[Campaign Created] --> B[Validation]
    B --> C[Channel Routing]
    C --> D[Template Rendering]
    D --> E[Audience Segmentation]
    E --> F[Delivery Scheduling]
    F --> G[Channel APIs]
    G --> H[Delivery Confirmation]
    H --> I[Performance Tracking]
```

## Scalability Considerations

### Performance Optimization
- Redis caching layer
- Database indexing and query optimization
- Connection pooling with TypeORM
- Efficient NestJS module communication

### Reliability
- Circuit breakers for external services
- Retry mechanisms with exponential backoff
- Graceful degradation
- Error handling and logging

### Development
- Modular NestJS architecture
- TypeORM for database operations
- Local development environment
- Docker for containerization
