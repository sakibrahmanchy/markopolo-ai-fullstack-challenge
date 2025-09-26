# System Design - High Level Architecture

## Overview

PulseHub is a real-time, AI-powered marketing platform that connects multiple data sources and enables multi-channel campaign execution through an intuitive chat interface.

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web App - React/TypeScript]
        B[Mobile App - React Native]
    end
    
    subgraph "API Gateway & Load Balancer"
        C[NGINX/CloudFlare]
        D[API Gateway - Express.js]
    end
    
    subgraph "Core Services"
        E[Chat Service - Socket.io]
        F[AI Recommendation Engine]
        G[Campaign Management Service]
        H[Data Integration Service]
    end
    
    subgraph "Data Sources"
        I[Google Tag Manager]
        J[Facebook Pixel]
        K[Shopify API]
    end
    
    subgraph "Channel Services"
        L[Email Service - SendGrid]
        M[SMS Service - Twilio]
        N[Push Service - Firebase]
        O[WhatsApp Service - Meta API]
    end
    
    subgraph "Data Layer"
        P[PostgreSQL - Primary DB]
        Q[Redis - Caching & Sessions]
        R[Elasticsearch - Search & Analytics]
    end
    
    subgraph "Infrastructure"
        S[Docker Containers]
        T[Kubernetes/AWS ECS]
        U[Monitoring - Prometheus/Grafana]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    H --> I
    H --> J
    H --> K
    G --> L
    G --> M
    G --> N
    G --> O
    E --> P
    F --> P
    G --> P
    H --> P
    E --> Q
    F --> Q
    G --> R
    H --> R
    S --> T
    T --> U
```

## Core Components

### 1. Chat Interface Service
- **Technology**: Socket.io, Node.js
- **Purpose**: Real-time chat communication
- **Features**: Message streaming, typing indicators, conversation history

### 2. AI Recommendation Engine
- **Technology**: OpenAI GPT-4, Custom ML models
- **Purpose**: Generate contextual marketing recommendations
- **Features**: Natural language processing, data analysis, campaign suggestions

### 3. Data Integration Service
- **Technology**: Node.js, REST APIs, Webhooks
- **Purpose**: Connect and sync with external data sources
- **Features**: Real-time data ingestion, data transformation, error handling

### 4. Campaign Management Service
- **Technology**: Node.js, Express
- **Purpose**: Create, schedule, and execute marketing campaigns
- **Features**: Multi-channel deployment, A/B testing, performance tracking

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Chat Interface
    participant AI as AI Engine
    participant D as Data Service
    participant CM as Campaign Manager
    participant CH as Channel Services
    
    U->>C: Ask question about customers
    C->>AI: Process natural language query
    AI->>D: Request relevant data
    D->>D: Query GTM, Facebook, Shopify
    D-->>AI: Return aggregated data
    AI->>AI: Analyze data & generate recommendations
    AI-->>C: Stream JSON recommendations
    C-->>U: Display recommendations
    U->>C: Select channels & customize
    C->>CM: Create campaign
    CM->>CH: Deploy to selected channels
    CH-->>CM: Confirm deployment
    CM-->>C: Campaign launched
    C-->>U: Campaign status update
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
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
- **Orchestration**: Kubernetes
- **Cloud**: AWS/GCP
- **CDN**: CloudFlare
- **Monitoring**: Prometheus + Grafana

## Detailed Component Architecture

### 1. Chat Service Deep Dive

```mermaid
graph TB
    subgraph "Chat Service Components"
        A[WebSocket Handler]
        B[Message Queue - Redis]
        C[Conversation Manager]
        D[Context Processor]
        E[Response Streamer]
    end
    
    subgraph "Message Processing Pipeline"
        F[Message Validator]
        G[Intent Classifier]
        H[Context Builder]
        I[AI Query Formatter]
    end
    
    A --> F
    F --> G
    G --> H
    H --> I
    I --> B
    B --> C
    C --> D
    D --> E
```

**Key Features:**
- Real-time message streaming with WebSocket
- Conversation context management
- Message queuing for reliability
- Intent classification for routing

### 2. AI Recommendation Engine Architecture

```mermaid
graph TB
    subgraph "AI Processing Pipeline"
        A[Query Parser]
        B[Data Context Builder]
        C[ML Model Pipeline]
        D[Recommendation Generator]
        E[Response Formatter]
    end
    
    subgraph "ML Models"
        F[Customer Segmentation Model]
        G[Channel Optimization Model]
        H[Timing Prediction Model]
        I[Content Generation Model]
    end
    
    subgraph "Data Processing"
        J[Real-time Data Aggregator]
        K[Historical Data Processor]
        L[Feature Engineering]
    end
    
    A --> B
    B --> C
    C --> F
    C --> G
    C --> H
    C --> I
    F --> D
    G --> D
    H --> D
    I --> D
    D --> E
    J --> L
    K --> L
    L --> C
```

**Components:**
- **Query Parser**: Extracts intent and entities from natural language
- **Data Context Builder**: Aggregates relevant data from connected sources
- **ML Pipeline**: Processes data through multiple specialized models
- **Recommendation Generator**: Creates actionable campaign suggestions

### 3. Data Integration Service Details

```mermaid
graph TB
    subgraph "Data Source Adapters"
        A[GTM Adapter]
        B[Facebook Pixel Adapter]
        C[Shopify Adapter]
    end
    
    subgraph "Data Processing Layer"
        D[Data Validator]
        E[Schema Mapper]
        F[Data Transformer]
        G[Event Processor]
    end
    
    subgraph "Storage Layer"
        H[Raw Data Store]
        I[Processed Data Store]
        J[Analytics Store]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
```

**Data Flow:**
1. **Ingestion**: Real-time data from APIs and webhooks
2. **Validation**: Schema validation and data quality checks
3. **Transformation**: Normalize data into common format
4. **Storage**: Store in appropriate data stores
5. **Processing**: Real-time analytics and feature generation

### 4. Campaign Management Service Architecture

```mermaid
graph TB
    subgraph "Campaign Core"
        A[Campaign Builder]
        B[Template Engine]
        C[Scheduler]
        D[Execution Engine]
    end
    
    subgraph "Channel Handlers"
        E[Email Handler]
        F[SMS Handler]
        G[Push Handler]
        H[WhatsApp Handler]
    end
    
    subgraph "Monitoring & Analytics"
        I[Performance Tracker]
        J[Real-time Metrics]
        K[Alert System]
        L[Optimization Engine]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J
    J --> K
    J --> L
```

## Microservices Communication

### Service-to-Service Communication

```mermaid
sequenceDiagram
    participant CS as Chat Service
    participant AI as AI Engine
    participant DI as Data Integration
    participant CM as Campaign Manager
    participant DB as Database
    participant Cache as Redis
    
    CS->>AI: Process user query
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
    CS->>CM: Create campaign
    CM->>DB: Store campaign
    CM-->>CS: Campaign created
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

### Horizontal Scaling
- Microservices architecture
- Stateless services
- Load balancing across multiple instances
- Database read replicas

### Performance Optimization
- Redis caching layer
- CDN for static assets
- Database indexing and query optimization
- Connection pooling

### Reliability
- Circuit breakers for external services
- Retry mechanisms with exponential backoff
- Graceful degradation
- Health checks and monitoring
