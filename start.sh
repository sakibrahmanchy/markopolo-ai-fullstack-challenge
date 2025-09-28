#!/bin/bash

# PulseHub Docker Startup Script

echo "🚀 Starting PulseHub with Docker Compose..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << EOF
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
VITE_API_URL=http://localhost:5900/api
EOF
    echo "📝 Please edit .env file and add your OpenAI API key before running again."
    echo "   You can get an API key from: https://platform.openai.com/api-keys"
    exit 1
fi

# Check if OpenAI API key is set
if grep -q "your_openai_api_key_here" .env; then
    echo "❌ Please set your OpenAI API key in the .env file"
    echo "   You can get an API key from: https://platform.openai.com/api-keys"
    exit 1
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
echo "   This may take a moment as tables are being created..."
sleep 15

# Check if database is healthy
echo "🔍 Checking database health..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U pulsehub -d pulsehub > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database failed to start properly"
        echo "📋 Database logs:"
        docker-compose logs postgres
        exit 1
    fi
    echo "   Waiting for database... (attempt $i/30)"
    sleep 2
done

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5900 > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start properly"
        echo "📋 Backend logs:"
        docker-compose logs backend
        exit 1
    fi
    echo "   Waiting for backend... (attempt $i/30)"
    sleep 2
done

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..15}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Frontend failed to start properly"
        echo "📋 Frontend logs:"
        docker-compose logs frontend
        exit 1
    fi
    echo "   Waiting for frontend... (attempt $i/15)"
    sleep 2
done

# Verify database tables were created
echo "🔍 Verifying database tables..."
TABLE_COUNT=$(docker-compose exec -T postgres psql -U pulsehub -d pulsehub -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n' || echo "0")

if [ "$TABLE_COUNT" -gt "5" ]; then
    echo "✅ Database tables created successfully ($TABLE_COUNT tables found)"
else
    echo "⚠️  Warning: Only $TABLE_COUNT tables found. Tables may still be creating..."
    echo "📋 Database tables:"
    docker-compose exec -T postgres psql -U pulsehub -d pulsehub -c "\dt" 2>/dev/null || echo "Could not list tables"
fi

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ PulseHub is ready!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5900"
echo "🗄️  Database: localhost:5432"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo ""
echo "🎉 Happy marketing automation!"
