# Docker Setup for PulseHub

This guide will help you run PulseHub using Docker Compose, which includes the backend API, frontend, and PostgreSQL database.

## Prerequisites

- Docker and Docker Compose installed on your system
- OpenAI API key

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd pulsehub
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```bash
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Database Configuration
   DATABASE_URL=postgresql://pulsehub:pulsehub123@postgres:5432/pulsehub
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # Application Configuration
   NODE_ENV=production
   PORT=5900
   
   # Frontend Configuration
   VITE_API_URL=http://localhost:5900
   ```

3. **Run the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5900
   - Database: localhost:5432

## Services

### PostgreSQL Database
- **Container**: `pulsehub-postgres`
- **Port**: 5432
- **Database**: `pulsehub`
- **Username**: `pulsehub`
- **Password**: `pulsehub123`

### Backend API
- **Container**: `pulsehub-backend`
- **Port**: 5900
- **Environment**: Production
- **Dependencies**: PostgreSQL

### Frontend
- **Container**: `pulsehub-frontend`
- **Port**: 3000
- **Web Server**: Nginx
- **Dependencies**: Backend API

## Development vs Production

### Development
For development, you can run individual services:
```bash
# Run only the database
docker-compose up postgres

# Run only the backend
docker-compose up backend

# Run only the frontend
docker-compose up frontend
```

### Production
For production deployment:
```bash
# Run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 5900, and 5432 are not in use
2. **OpenAI API key**: Ensure you have a valid OpenAI API key set in the `.env` file
3. **Database connection**: Wait for the database to be ready before starting the backend

### Viewing Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f backend
```

### Database Access
```bash
# Connect to the database
docker-compose exec postgres psql -U pulsehub -d pulsehub

# Backup database
docker-compose exec postgres pg_dump -U pulsehub pulsehub > backup.sql

# Restore database
docker-compose exec -T postgres psql -U pulsehub -d pulsehub < backup.sql
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | Required |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://pulsehub:pulsehub123@postgres:5432/pulsehub` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-change-this-in-production` |
| `NODE_ENV` | Node.js environment | `production` |
| `PORT` | Backend port | `5900` |
| `VITE_API_URL` | Frontend API URL | `http://localhost:5900` |

## Data Persistence

The PostgreSQL data is persisted in a Docker volume named `postgres_data`. This means your data will survive container restarts and rebuilds.

To reset the database:
```bash
docker-compose down -v
docker-compose up --build
```

## Security Notes

- Change the default JWT secret in production
- Use strong database passwords
- Consider using Docker secrets for sensitive data
- Set up proper firewall rules for production deployment
