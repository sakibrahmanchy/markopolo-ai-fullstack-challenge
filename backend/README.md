# PulseHub Backend

AI-Powered Multi-Channel Marketing Platform Backend built with NestJS, TypeORM, and PostgreSQL.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **AI Integration**: GPT-powered recommendations with provider abstraction
- **Real-time Chat**: WebSocket-based chat interface
- **Data Integration**: Connect to GTM, Facebook Pixel, and Shopify
- **Campaign Management**: Multi-channel campaign execution
- **Learning System**: Feedback collection and AI improvement

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **AI**: OpenAI GPT-4
- **Authentication**: JWT with Passport
- **Real-time**: Socket.io
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- OpenAI API Key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. Start the database and Redis:
   ```bash
   docker-compose up postgres redis -d
   ```

5. Run the application:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:5900`
API Documentation: `http://localhost:5900/api/docs`

## Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=pulsehub

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=3600

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# Application
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

### User
- `GET /user/profile` - Get user profile

### AI
- `GET /ai/providers` - Get AI provider status
- `GET /ai/recommendations/history` - Get recommendation history
- `POST /ai/recommendations/:id/feedback` - Provide feedback
- `GET /ai/insights` - Get AI insights

### Chat
- `GET /chat/conversations` - Get conversations
- `POST /chat/conversations` - Create conversation
- `POST /chat/conversations/:id/messages` - Send message
- `GET /chat/conversations/:id/stream` - Stream AI responses

### Data Sources
- `GET /data-sources` - Get data sources
- `POST /data-sources` - Connect data source
- `POST /data-sources/:id/test` - Test connection

### Campaigns
- `GET /campaigns` - Get campaigns
- `POST /campaigns` - Create campaign
- `GET /campaigns/:id/metrics` - Get campaign metrics

## Development

### Running Tests
```bash
npm run test
npm run test:e2e
```

### Database Migrations
```bash
npm run migration:generate -- src/migrations/MigrationName
npm run migration:run
npm run migration:revert
```

### Linting
```bash
npm run lint
npm run format
```

## Docker

### Development
```bash
docker-compose up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up
```

## Architecture

The backend follows a modular architecture with the following modules:

- **Auth Module**: User authentication and JWT management
- **User Module**: User profile management
- **AI Module**: AI provider abstraction and recommendations
- **Chat Module**: Real-time chat with WebSocket
- **Data Integration Module**: External data source connections
- **Campaign Module**: Campaign management and execution

## AI Provider Abstraction

The AI module uses a provider abstraction pattern that allows easy swapping of AI providers:

- **GPT Provider**: OpenAI GPT-4 integration (current)
- **Custom Model Provider**: Future custom model integration
- **Hybrid Provider**: Multiple provider support

## Learning System

The system includes a learning mechanism that:

- Collects user feedback on recommendations
- Tracks campaign performance metrics
- Analyzes recommendation success patterns
- Improves AI prompts and responses over time

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
