# User Flow Documentation

## Overview

This document outlines the complete user journey through the PulseHub platform, from initial onboarding to campaign execution and monitoring.

## User Journey Map

```mermaid
journey
    title PulseHub User Journey
    section Onboarding
      Visit Platform: 5: User
      Sign Up/Login: 4: User
      Complete Profile: 3: User
    section Data Connection
      Select Data Sources: 5: User
      Connect GTM: 4: User
      Connect Facebook Pixel: 4: User
      Connect Shopify: 4: User
      Verify Connections: 5: User
    section Campaign Creation
      Start Chat: 5: User
      Ask Questions: 5: User
      Review Recommendations: 4: User
      Customize Campaign: 3: User
      Select Channels: 4: User
    section Execution
      Preview Campaign: 4: User
      Schedule/Launch: 5: User
      Monitor Performance: 4: User
      Optimize: 3: User
```

## Detailed User Flows

### 1. Onboarding Flow

```mermaid
flowchart TD
    A[Landing Page] --> B{User Authenticated?}
    B -->|No| C[Sign Up/Login]
    B -->|Yes| D[Dashboard]
    C --> E[Email Verification]
    E --> F[Profile Setup]
    F --> G[Data Source Selection]
    G --> H[Connection Setup]
    H --> D
```

### 2. Data Source Connection Flow

```mermaid
flowchart TD
    A[User Dashboard] --> B[Data Sources Tab]
    B --> C[Select GTM]
    C --> D[GTM Setup Wizard]
    D --> E[Enter GTM Container ID]
    E --> F[Test Connection]
    F --> G{Connection Success?}
    G -->|Yes| H[Save GTM Config]
    G -->|No| I[Error Handling]
    I --> E
    H --> J[Select Facebook Pixel]
    J --> K[Facebook Auth Flow]
    K --> L[Grant Permissions]
    L --> M[Test Pixel Connection]
    M --> N{Connection Success?}
    N -->|Yes| O[Save Pixel Config]
    N -->|No| P[Error Handling]
    P --> K
    O --> Q[Select Shopify]
    Q --> R[Shopify OAuth]
    R --> S[Select Store]
    S --> T[Test Shopify Connection]
    T --> U{Connection Success?}
    U -->|Yes| V[Save Shopify Config]
    U -->|No| W[Error Handling]
    W --> R
    V --> X[All Sources Connected]
    X --> Y[Ready for Chat]
```

### 3. Chat Interface Flow

```mermaid
flowchart TD
    A[User Chat Interface] --> B[User Types Question]
    B --> C[AI Processing]
    C --> D[Data Analysis]
    D --> E[Generate Recommendations]
    E --> F[Stream JSON Response]
    F --> G[Display Recommendations]
    G --> H{User Satisfied?}
    H -->|Yes| I[Select Channels]
    H -->|No| J[Refine Question]
    J --> C
    I --> K[Customize Campaign]
    K --> L[Preview Campaign]
    L --> M{Approve Campaign?}
    M -->|Yes| N[Schedule/Launch]
    M -->|No| O[Edit Campaign]
    O --> K
    N --> P[Campaign Monitoring]
```

### 4. Campaign Execution Flow

```mermaid
flowchart TD
    A[User Campaign Ready] --> B[Channel Selection]
    B --> C[Email Campaign]
    B --> D[SMS Campaign]
    B --> E[Push Notification]
    B --> F[WhatsApp Campaign]
    
    C --> G[Email Template]
    G --> H[User Audience Segmentation]
    H --> I[Schedule Email]
    
    D --> J[SMS Template]
    J --> K[User Phone Number List]
    K --> L[Schedule SMS]
    
    E --> M[Push Template]
    M --> N[User Device Targeting]
    N --> O[Schedule Push]
    
    F --> P[WhatsApp Template]
    P --> Q[User Contact List]
    Q --> R[Schedule WhatsApp]
    
    I --> S[User Campaign Monitoring]
    L --> S
    O --> S
    R --> S
    S --> T[Performance Analytics]
    T --> U[Optimization Suggestions]
```

## User Personas

### Primary Persona: Marketing Manager
- **Goals**: Increase conversion rates, optimize ad spend, improve customer engagement
- **Pain Points**: Data silos, manual campaign creation, lack of real-time insights
- **Use Cases**: 
  - "Show me customers who abandoned cart in the last 24 hours"
  - "Create a re-engagement campaign for inactive users"
  - "What's the best time to send emails to my segment?"

### Secondary Persona: E-commerce Owner
- **Goals**: Drive sales, reduce churn, increase customer lifetime value
- **Pain Points**: Limited marketing resources, complex analytics
- **Use Cases**:
  - "Target high-value customers with exclusive offers"
  - "Send personalized product recommendations"
  - "Create urgency campaigns for low-stock items"

## Key User Interactions

### 1. Natural Language Queries
- "Who are my most engaged customers this week?"
- "Create a campaign for users who viewed but didn't buy"
- "What's the optimal send time for my email list?"
- "Show me customers likely to churn in the next 30 days"

### 2. Data Exploration
- Real-time dashboard with connected data sources
- Interactive charts and visualizations
- Drill-down capabilities for detailed insights

### 3. Campaign Customization
- Drag-and-drop campaign builder
- A/B testing capabilities
- Real-time preview across all channels

### 4. Performance Monitoring
- Live campaign performance metrics
- Automated alerts and notifications
- ROI tracking and optimization suggestions

## Error Handling & Edge Cases

### Connection Failures
- Graceful degradation when data sources are unavailable
- Clear error messages with resolution steps
- Retry mechanisms for failed connections

### Data Quality Issues
- Validation of incoming data
- Fallback to cached data when real-time data is unavailable
- User notifications for data quality concerns

### Campaign Failures
- Rollback mechanisms for failed campaigns
- Detailed error logging and reporting
- Alternative channel suggestions when primary channels fail

## Success Metrics

### User Engagement
- Daily/Monthly Active Users
- Session duration and frequency
- Feature adoption rates

### Campaign Performance
- Campaign success rate
- Average conversion rate improvement
- Time to campaign creation

### Data Integration
- Data source uptime
- Data freshness and accuracy
- API response times

