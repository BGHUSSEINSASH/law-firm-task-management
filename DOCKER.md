# Law Firm Task Management System - Docker Documentation

## Overview
This document provides instructions for building, running, and managing the Law Firm Task Management System using Docker.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     NGINX (Reverse Proxy)               │
│                  Port 80/443 Load Balancer              │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
    ┌────────▼──────────┐      ┌────────▼──────────┐
    │   Frontend        │      │   Backend API     │
    │   React App       │      │   Express.js      │
    │   Port 3000       │      │   Port 5000       │
    └────────┬──────────┘      └────────┬──────────┘
             │                          │
             └───────────┬──────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐    ┌────▼─────┐    ┌────▼──────┐
   │PostgreSQL│    │  Redis   │    │  Volumes  │
   │Database  │    │  Cache   │    │  Storage  │
   └──────────┘    └──────────┘    └───────────┘
```

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/BGHUSSEINSASH/law-firm-task-management.git
cd law-firm-task-management
```

### 2. Configure Environment Variables
```bash
# Copy environment template
cp .env.docker .env.local

# Edit with your actual values
nano .env.local
```

### 3. Build and Run
```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Service Details

### PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Credentials**: See .env.local
- **Volumes**: postgres_data

### Redis Cache
- **Image**: redis:7-alpine
- **Port**: 6379
- **Password**: Set in .env.local
- **Volumes**: redis_data

### Backend API
- **Image**: Node.js 18-alpine
- **Port**: 5000
- **Dependencies**: PostgreSQL, Redis
- **Health Check**: Enabled (30s interval)

### Frontend
- **Image**: Node.js 18-alpine (Builder)
- **Port**: 3000
- **Build**: Multi-stage optimized build
- **Health Check**: Enabled

### Nginx Reverse Proxy
- **Image**: nginx:alpine
- **Port**: 80/443
- **Features**:
  - Load balancing
  - Gzip compression
  - Rate limiting
  - SSL support (optional)
  - Static file caching

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (WARNING: Deletes data)
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail 100 backend
```

### Database Management
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d law_firm

# Backup database
docker-compose exec postgres pg_dump -U postgres law_firm > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres law_firm < backup.sql

# Run migrations
docker-compose exec backend npm run migrate
docker-compose exec backend npm run migrate:reset
```

### Redis Management
```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli -a your_password

# Clear cache
docker-compose exec redis redis-cli -a your_password FLUSHALL

# View statistics
docker-compose exec redis redis-cli -a your_password INFO stats
```

### Scale Services
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale frontend instances
docker-compose up -d --scale frontend=2
```

## Health Checks

All services include health checks:

```bash
# Check service health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health
docker inspect --format='{{.State.Health.Status}}' law-firm-backend
```

## Performance Optimization

### Enable Caching
```bash
# In .env.local
ENABLE_CACHING=true
REDIS_URL=redis://:password@redis:6379
```

### Adjust Worker Processes
```bash
# In docker-compose.yml
environment:
  NODE_ENV: production
  NODE_OPTIONS: --max-old-space-size=2048
```

### Database Connection Pooling
```bash
DATABASE_URL=postgresql://user:pass@postgres:5432/db?max=20&min=5
```

## Security

### SSL/TLS Configuration
1. Generate certificates:
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem
```

2. Uncomment HTTPS section in nginx.conf

3. Update docker-compose.yml ports:
```yaml
ports:
  - "443:443"
```

### Environment Secrets
Never commit .env files to git:
```bash
# Add to .gitignore
echo ".env*" >> .gitignore
```

Use Docker secrets for production:
```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## Backup & Recovery

### Database Backup
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres law_firm \
  > "backups/law_firm_$TIMESTAMP.sql"
```

### Automatic Daily Backups
```bash
# Add to crontab
0 2 * * * /path/to/backup-db.sh
```

### Restore from Backup
```bash
docker-compose exec -T postgres psql -U postgres law_firm < backup.sql
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :5000
lsof -i :3000
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Out of Memory
```bash
# Check Docker resources
docker stats

# Increase Docker memory limit in settings

# Or limit container memory
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Connection Refused
```bash
# Check service health
docker-compose ps

# Rebuild service
docker-compose build --no-cache backend
docker-compose up -d backend

# Check logs
docker-compose logs backend
```

### Database Issues
```bash
# Verify database connectivity
docker-compose exec backend npm run migrate

# Reset database
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npm run migrate
```

## Production Deployment

### Environment Setup
```bash
# Use production environment file
mv .env.docker .env.production
# Edit with production values
nano .env.production
```

### Build for Production
```bash
# Build with production flags
docker-compose -f docker-compose.yml build --build-arg NODE_ENV=production

# Or use a separate production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Monitoring
```bash
# Use monitoring tools
docker-compose exec prometheus curl http://localhost:9090

# Or implement health endpoints
curl http://localhost:5000/api/health
curl http://localhost:3000/
```

### Logging
```bash
# Centralized logging
docker-compose logs > app.log 2>&1

# Or use external logging
# Add to docker-compose.yml:
logging:
  driver: "awslogs"
  options:
    awslogs-group: "/ecs/law-firm"
```

## Maintenance

### Update Dependencies
```bash
# Update npm packages
docker-compose exec backend npm update
docker-compose exec frontend npm update

# Rebuild images
docker-compose build --no-cache
```

### Cleanup
```bash
# Remove unused containers
docker-compose down
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Support & Documentation

- Frontend: [frontend/README.md](frontend/README.md)
- Backend: [backend/README.md](backend/README.md)
- Issues: https://github.com/BGHUSSEINSASH/law-firm-task-management/issues
