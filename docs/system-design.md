# System Design - High Level Architecture

## Overview

PulseHub is a real-time, AI-powered marketing platform that connects multiple data sources and enables multi-channel campaign execution through an intuitive chat interface.

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend"
        A[React App - TypeScript]
    end
    
    subgraph "Backend - NestJS"
        B[Auth Module]
        C[Chat Module]
        D[AI Module]
        E[Campaign Module]
        F[Data Integration Module]
    end
    
    subgraph "Data Sources"
        G[Google Tag Manager]
        H[Facebook Pixel]
        I[Shopify API]
    end
    
    subgraph "Channel Services"
        J[Email Service - SendGrid]
        K[SMS Service - Twilio]
        L[Push Service - Firebase]
        M[WhatsApp Service - Meta API]
    end
    
    subgraph "Data Layer"
        N[PostgreSQL - Primary DB]
        O[Redis - Caching & Sessions]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    F --> G
    F --> H
    F --> I
    E --> J
    E --> K
    E --> L
    E --> M
    B --> N
    C --> N
    D --> N
    E --> N
    F --> N
    B --> O
    C --> O
    D --> O
    E --> O
    F --> O
```

## Core NestJS Modules

### 1. Auth Module
- **Purpose**: User authentication and authorization
- **Features**: JWT tokens, user registration/login, session management
- **Components**: AuthController, AuthService, JwtStrategy, UserEntity

### 2. Chat Module
- **Purpose**: Real-time chat communication
- **Features**: Message streaming, typing indicators, conversation history
- **Components**: ChatGateway, ChatService, MessageService, ConversationEntity

### 3. AI Module
- **Purpose**: Generate contextual marketing recommendations
- **Features**: Natural language processing, data analysis, campaign suggestions
- **Components**: AIRecommendationService, QueryParserService, MLModelService

### 4. Data Integration Module
- **Purpose**: Connect and sync with external data sources
- **Features**: Real-time data ingestion, data transformation, error handling
- **Components**: DataIntegrationService, GTMAdapterService, FacebookPixelAdapterService, ShopifyAdapterService

### 5. Campaign Module
- **Purpose**: Create, schedule, and execute marketing campaigns
- **Features**: Multi-channel deployment, A/B testing, performance tracking
- **Components**: CampaignService, CampaignBuilderService, ChannelHandlerService

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend (NestJS)
    participant AI as AI Module
    participant DI as Data Integration Module
    participant CM as Campaign Module
    participant CH as Channel Services
    
    U->>F: Ask question about customers
    F->>B: Send message via WebSocket
    B->>AI: Process natural language query
    AI->>DI: Request relevant data
    DI->>DI: Query GTM, Facebook, Shopify
    DI-->>AI: Return aggregated data
    AI->>AI: Analyze data & generate recommendations
    AI-->>B: Stream JSON recommendations
    B-->>F: Stream recommendations via WebSocket
    F-->>U: Display recommendations
    U->>F: Select channels & customize
    F->>B: Create campaign request
    B->>CM: Create campaign
    CM->>CH: Deploy to selected channels
    CH-->>CM: Confirm deployment
    CM-->>B: Campaign launched
    B-->>F: Campaign status update
    F-->>U: Campaign status update
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: NestJS
- **ORM**: TypeORM
- **Real-time**: Socket.io
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Search**: Elasticsearch 8+

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Redux Toolkit
- **Real-time**: Socket.io-client

### Infrastructure
- **Containerization**: Docker
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis
- **Development**: Local development environment

## Detailed Component Architecture

### 1. Chat Service Deep Dive (NestJS)

```mermaid
graph TB
    subgraph "NestJS Chat Module"
        A[ChatGateway - WebSocket]
        B[ChatService]
        C[MessageService]
        D[ConversationService]
        E[ContextService]
    end
    
    subgraph "Message Processing Pipeline"
        F[MessageValidator]
        G[IntentClassifier]
        H[ContextBuilder]
        I[AIQueryFormatter]
    end
    
    subgraph "TypeORM Entities"
        J[Conversation Entity]
        K[Message Entity]
        L[User Entity]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    C --> F
    F --> G
    G --> H
    H --> I
    B --> J
    C --> K
    D --> L
```

**Key Features:**
- Real-time message streaming with WebSocket
- Conversation context management
- Message queuing for reliability
- Intent classification for routing

### 2. AI Recommendation Engine Architecture (NestJS)

```mermaid
graph TB
    subgraph "NestJS AI Module"
        A[AIRecommendationService]
        B[QueryParserService]
        C[DataContextService]
        D[MLModelService]
        E[RecommendationGenerator]
    end
    
    subgraph "ML Models"
        F[CustomerSegmentationModel]
        G[ChannelOptimizationModel]
        H[TimingPredictionModel]
        I[ContentGenerationModel]
    end
    
    subgraph "Data Processing"
        J[DataAggregatorService]
        K[HistoricalDataService]
        L[FeatureEngineeringService]
    end
    
    subgraph "TypeORM Repositories"
        M[DataSourceRepository]
        N[CampaignRepository]
        O[UserRepository]
    end
    
    A --> B
    B --> C
    C --> D
    D --> F
    D --> G
    D --> H
    D --> I
    F --> E
    G --> E
    H --> E
    I --> E
    J --> L
    K --> L
    L --> D
    C --> M
    C --> N
    C --> O
```

**Components:**
- **Query Parser**: Extracts intent and entities from natural language
- **Data Context Builder**: Aggregates relevant data from connected sources
- **ML Pipeline**: Processes data through multiple specialized models
- **Recommendation Generator**: Creates actionable campaign suggestions

### 3. Data Integration Service Details (NestJS)

```mermaid
graph TB
    subgraph "NestJS Data Integration Module"
        A[DataIntegrationService]
        B[GTMAdapterService]
        C[FacebookPixelAdapterService]
        D[ShopifyAdapterService]
    end
    
    subgraph "Data Processing Layer"
        E[DataValidatorService]
        F[SchemaMapperService]
        G[DataTransformerService]
        H[EventProcessorService]
    end
    
    subgraph "TypeORM Entities & Repositories"
        I[DataSourceEntity]
        J[DataEventEntity]
        K[DataSourceRepository]
        L[DataEventRepository]
    end
    
    subgraph "External APIs"
        M[GTM API]
        N[Facebook API]
        O[Shopify API]
    end
    
    A --> B
    A --> C
    A --> D
    B --> M
    C --> N
    D --> O
    B --> E
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    H --> J
    A --> K
    A --> L
```

**Data Flow:**
1. **Ingestion**: Real-time data from APIs and webhooks
2. **Validation**: Schema validation and data quality checks
3. **Transformation**: Normalize data into common format
4. **Storage**: Store in appropriate data stores
5. **Processing**: Real-time analytics and feature generation

### 4. Campaign Management Service Architecture (NestJS)

```mermaid
graph TB
    subgraph "NestJS Campaign Module"
        A[CampaignService]
        B[CampaignBuilderService]
        C[TemplateEngineService]
        D[SchedulerService]
        E[ExecutionEngineService]
    end
    
    subgraph "Channel Handlers"
        F[EmailHandlerService]
        G[SMSHandlerService]
        H[PushHandlerService]
        I[WhatsAppHandlerService]
    end
    
    subgraph "Monitoring & Analytics"
        J[PerformanceTrackerService]
        K[RealTimeMetricsService]
        L[AlertSystemService]
        M[OptimizationEngineService]
    end
    
    subgraph "TypeORM Entities & Repositories"
        N[CampaignEntity]
        O[CampaignChannelEntity]
        P[CampaignRepository]
        Q[CampaignChannelRepository]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    F --> J
    G --> J
    H --> J
    I --> J
    J --> K
    K --> L
    K --> M
    A --> N
    A --> O
    A --> P
    A --> Q
```

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
    CS->>AI: Process natural language
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
    AI->>AI: Generate recommendations
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
