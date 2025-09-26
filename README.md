# PulseHub - AI-Powered Multi-Channel Marketing Platform

## Overview

PulseHub is a Perplexity-like chat interface that enables users to connect various data sources and create targeted marketing campaigns across multiple channels. The system analyzes data from connected sources and generates "right time, right channel, right message, for the right audience" recommendations in real-time.

## Selected Data Sources & Channels

### Data Sources (3 selected)
- **Google Tag Manager (GTM)** - Web analytics and tracking data
- **Facebook Pixel** - Social media engagement and conversion data  
- **Shopify** - E-commerce transaction and customer behavior data

### Channels (4 selected)
- **Email** - Direct email marketing campaigns
- **SMS** - Text message marketing
- **Push Notifications** - Mobile and web push notifications
- **WhatsApp** - WhatsApp Business messaging

## Documentation Structure

1. [User Flow Documentation](./docs/user-flow.md)
2. [System Design](./docs/system-design.md)
3. [Database Design](./docs/database-design.md)
4. [API Design](./docs/api-design.md)
5. [Frontend Design](./docs/frontend-design.md)

## Quick Start

```bash
# Backend setup (NestJS)
cd backend
npm install
npm run start:dev

# Frontend setup (React)
cd frontend
npm install
npm run dev
```

## Key Features

- **Real-time Data Integration**: Connect to GTM, Facebook Pixel, and Shopify
- **AI-Powered Insights**: Generate contextual marketing recommendations
- **Multi-Channel Campaigns**: Deploy across Email, SMS, Push, and WhatsApp
- **Streaming JSON Output**: Real-time campaign data streaming
- **Intuitive Chat Interface**: Perplexity-like conversational experience

## Technology Stack

- **Backend**: NestJS, TypeORM, Socket.io, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS
- **AI/ML**: OpenAI GPT-4, Custom recommendation engine
- **Data Sources**: REST APIs, Webhooks, Real-time streaming
- **Infrastructure**: Docker, Redis for caching

