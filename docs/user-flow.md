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
    B -->|No| C[Sign Up/Login Modal]
    B -->|Yes| D[Chat Interface]
    C --> E[Auto-login after Signup]
    E --> D
    D --> F[Ask AI Questions]
    F --> G{Has Data Sources?}
    G -->|No| H[Connect Data Sources]
    G -->|Yes| I[Get Campaign Recommendations]
    H --> J[Add Dummy Data]
    J --> I
```

### 2. Data Source Connection Flow

```mermaid
flowchart TD
    A[Chat Interface] --> B[Ask about Campaigns]
    B --> C[AI: No Data Sources Connected]
    C --> D[Show Connect Data Sources Button]
    D --> E[Data Sources Panel]
    E --> F[Add Dummy Data Button]
    F --> G[Generate GTM Dummy Data]
    G --> H[Generate Facebook Pixel Data]
    H --> I[Generate Shopify Data]
    I --> J[Data Sources Connected]
    J --> K[Return to Chat]
    K --> L[Ask AI Questions Again]
    L --> M[Get Campaign Recommendations]
```

### 3. Chat Interface Flow

```mermaid
flowchart TD
    A[User Chat Interface] --> B[User Types Question]
    B --> C[Send Message to Backend]
    C --> D[AI Intent Analysis]
    D --> E{Requires Auth?}
    E -->|Yes| F[Show Login/Signup Modal]
    E -->|No| G[AI Processing]
    F --> H[User Authenticates]
    H --> G
    G --> I[Data Analysis from Sources]
    I --> J[Generate Campaign Recommendations]
    J --> K[Stream JSON Response via SSE]
    K --> L[Display Multiple Campaigns]
    L --> M[User Reviews Recommendations]
    M --> N[User Can Ask Follow-up Questions]
    N --> O[Continue Conversation]
```

### 4. Campaign Recommendation Flow

```mermaid
flowchart TD
    A[User Asks Campaign Question] --> B[AI Analyzes Intent]
    B --> C[Check User Data Sources]
    C --> D[Analyze User Data]
    D --> E[Identify User Segments]
    E --> F[Generate Multiple Campaigns]
    F --> G[Stream Campaign Recommendations]
    G --> H[Display Campaign Cards]
    H --> I[Each Campaign Shows:]
    I --> J[Target Audience Segment]
    I --> K[Recommended Channels]
    I --> L[Channel Messages]
    I --> M[Timing Information]
    H --> N[User Reviews Recommendations]
    N --> O[User Can Ask Follow-up]
    O --> P[Continue Conversation]
```

## Current User Experience

### Anonymous Users
- Can ask general questions in chat
- See authentication prompts for advanced features
- Can sign up or log in via modals

### Authenticated Users
- Full access to chat interface
- Can connect data sources and generate dummy data
- Receive AI-powered campaign recommendations
- Can ask follow-up questions about recommendations

## Current User Interactions

### 1. Chat Interface
- Ask questions about marketing campaigns
- Receive AI-powered recommendations
- View multiple campaign suggestions with audience segments
- See channel-specific recommendations (email, SMS, push, WhatsApp)

### 2. Data Sources
- Connect GTM, Facebook Pixel, and Shopify
- Generate dummy data for testing
- View connected data sources status

### 3. Authentication
- Sign up with email and password
- Login with existing credentials
- Auto-login after signup
- Persistent session management

## Current Error Handling

### Authentication Errors
- Clear error messages for invalid credentials
- Token expiration handling with refresh
- Graceful fallback to anonymous mode

### Data Source Errors
- Validation of data source configurations
- Error messages for failed connections
- Fallback to dummy data generation

### AI Service Errors
- Fallback responses when AI is unavailable
- Clear error messages for API failures
- Graceful degradation of features

## Current Success Metrics

### User Engagement
- Chat message frequency
- Authentication conversion rate
- Data source connection rate

### System Performance
- API response times
- Database query performance
- SSE streaming reliability

