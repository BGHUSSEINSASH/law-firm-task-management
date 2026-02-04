# Production Deployment Checklist & Best Practices

## Pre-Deployment Security

### Environment Variables
```bash
# Verify all required variables are set
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 32)
HMAC_SECRET=$(openssl rand -hex 32)

# API Keys (keep in Secrets Manager, not .env)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
WHATSAPP_API_KEY=...
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...
MICROSOFT_CLIENT_ID=...

# Feature Flags
ENABLE_2FA=true
ENABLE_TIME_TRACKING=true
ENABLE_COMMENTS=true
ENABLE_CACHING=true
ENABLE_AUDIT_LOGS=true
CORS_ORIGIN=https://app.example.com
```

### Database Security

```bash
# Create separate database users with limited privileges
# Main application user
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE law_firm_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

# Read-only user for reports/analytics
CREATE USER readonly_user WITH PASSWORD 'strong_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

# Backup user
CREATE USER backup_user WITH PASSWORD 'strong_password';
ALTER ROLE backup_user REPLICATION;
```

### Redis Security

```bash
# Require password for all Redis connections
redis-cli CONFIG SET requirepass 'strong_password'
redis-cli CONFIG REWRITE

# Disable dangerous commands in production
redis-cli CONFIG SET FLUSHDB ""
redis-cli CONFIG SET FLUSHALL ""
redis-cli CONFIG SET DEBUG ""
redis-cli CONFIG SET CONFIG ""
```

## Deployment Architecture

### High Availability Setup

```
                         DNS (Route 53/Cloud DNS)
                                |
                         SSL Certificate (ACM)
                                |
                  Load Balancer (ALB/Cloud LB)
                         /              \
                    WAF Rules      Rate Limiting
                       /                  \
         ┌──────────────────────────────────┐
         │      Auto Scaling Group           │
         ├──────────────────────────────────┤
         │ Backend Instance 1 (ECS/GKE)     │
         │ Backend Instance 2 (ECS/GKE)     │
         │ Backend Instance 3 (ECS/GKE)     │
         └──────────────────────────────────┘
                        |
              ┌─────────┼─────────┐
              |         |         |
         PostgreSQL  Redis    S3/GCS
         (RDS/       (Cache)  (Backup)
         Cloud SQL)
```

### Multi-Region Setup

```
┌─────────────────────────────────────────┐
│          Global Load Balancer            │
│        (Route 53 / Cloud LB)             │
└──────────────┬──────────────────────────┘
               |
      ┌────────┴────────┐
      |                 |
 Primary Region    Secondary Region
 (us-east-1)       (eu-west-1)
  
  ALB              ALB
   |                |
 Backend ────→ Database Replication ←─── Backend
   |                |
 Cache            Cache
```

## SSL/TLS Configuration

### Generate Self-Signed Certificate (Development)

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### AWS Certificate Manager (Production)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name app.example.com \
  --subject-alternative-names www.app.example.com api.app.example.com \
  --validation-method DNS

# Verify in Route 53
# Monitor for completion
aws acm describe-certificate --certificate-arn arn:aws:acm:...
```

### Enable HSTS (HTTP Strict Transport Security)

```nginx
# In nginx.conf
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## API Rate Limiting

### Progressive Rate Limiting

```javascript
// backend/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// Public endpoints: 100 requests per 15 minutes
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

// Auth endpoints: 5 requests per 15 minutes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

// API endpoints: 1000 requests per hour (logged-in users)
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.user?.id || req.ip
});

// Apply to routes
router.post('/login', authLimiter, loginHandler);
router.get('/api/*', apiLimiter, apiHandler);
```

### Distributed Rate Limiting (Redis-based)

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient();

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

## Monitoring & Alerting

### CloudWatch/Stackdriver Metrics

```javascript
// backend/services/metricsService.js
const metrics = {
  recordLatency: (label, duration) => {
    // Send to CloudWatch/Stackdriver
    cloudwatch.putMetricData({
      MetricName: 'ResponseTime',
      Value: duration,
      Unit: 'Milliseconds',
      Dimensions: [{ Name: 'Endpoint', Value: label }]
    });
  },
  recordError: (errorType) => {
    cloudwatch.putMetricData({
      MetricName: 'Errors',
      Value: 1,
      Unit: 'Count',
      Dimensions: [{ Name: 'Type', Value: errorType }]
    });
  }
};
```

### Log Aggregation

```bash
# Set up CloudWatch Logs (AWS)
# or
# Set up Cloud Logging (GCP)
# or
# Set up ELK Stack (Elasticsearch/Kibana/Logstash)

# View logs in real-time
tail -f logs/production.log | grep ERROR

# Parse JSON logs
jq 'select(.level=="ERROR")' logs/production.json
```

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 5% | Page on-call |
| Response Time P95 | > 500ms | Auto-scale |
| Database CPU | > 80% | Scale up RDS |
| Memory Usage | > 85% | Restart service |
| Disk Usage | > 90% | Alert team |
| Failed Logins | > 10 in 5min | Block IP |

## Backup & Recovery

### Automated Backups

```bash
# AWS RDS (automated)
aws rds modify-db-instance \
  --db-instance-identifier law-firm-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"

# GCP Cloud SQL (automated)
gcloud sql backups create \
  --instance law-firm-db \
  --description "Pre-release"

# Manual backup
pg_dump law_firm_db > backup-$(date +%Y%m%d).sql
gzip backup-$(date +%Y%m%d).sql
aws s3 cp backup-*.sql.gz s3://law-firm-backups-2026/
```

### Point-in-Time Recovery

```bash
# Verify backup
ls -lh /backups/
pg_dump --format=plain law_firm_db | head -50

# Restore from backup
createdb law_firm_db_restored
pg_restore -d law_firm_db_restored backup.sql

# Test restored database
psql law_firm_db_restored -c "SELECT COUNT(*) FROM tasks;"
```

### Disaster Recovery Plan

```yaml
RTO (Recovery Time Objective): 2 hours
RPO (Recovery Point Objective): 15 minutes

Steps:
1. Detect failure (automated alerts)
2. Failover to secondary region
3. Update DNS (Route 53)
4. Restore from latest backup
5. Verify data integrity
6. Notify stakeholders
7. Post-mortem analysis
```

## Performance Tuning

### Database Connection Optimization

```javascript
// Optimal pool size = (core_count * 2) + effective_spindle_count
// For 4 cores: 8-12 connections

const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Caching Strategy

```javascript
// Cache warm-up on startup
async function warmupCache() {
  const users = await getUserStats();
  await redis.set('stats:users', JSON.stringify(users), 'EX', 3600);

  const topTasks = await getTopTasks(100);
  await redis.set('cache:top-tasks', JSON.stringify(topTasks), 'EX', 300);
}

// Cache invalidation on data change
router.put('/tasks/:id', async (req, res) => {
  await updateTask(req.params.id, req.body);
  await redis.del(`task:${req.params.id}`);
  await redis.del('cache:top-tasks'); // Invalidate dependent cache
});
```

### Frontend Optimization

```nginx
# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# Browser caching
location ~* \.(js|css|jpg|jpeg|png|gif|ico|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Versioned assets
location ~* /static/(.+)\.[\w]{8}\.(js|css)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

## Post-Deployment

### Smoke Tests

```bash
#!/bin/bash
# smoke-tests.sh

echo "Testing API health..."
curl -f https://api.example.com/api/health || exit 1

echo "Testing database connection..."
curl -f https://api.example.com/api/db-health || exit 1

echo "Testing authentication..."
curl -f -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' || exit 1

echo "✓ All smoke tests passed"
```

### Gradual Rollout (Canary Deployment)

```yaml
# Deploy to 10% of traffic first
deployment:
  strategy:
    type: Canary
    canary:
      steps:
      - weight: 10
        duration: 15m
      - weight: 50
        duration: 30m
      - weight: 100
        duration: 0
```

### Zero-Downtime Deployment

```bash
# Blue-Green Deployment
# 1. Deploy to "Green" environment
docker run -d --name law-firm-green \
  -p 5001:5000 \
  ghcr.io/YOUR_GITHUB/law-firm:latest

# 2. Run health checks
curl http://localhost:5001/api/health

# 3. Switch load balancer
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=law-firm-green

# 4. Decommission old "Blue" environment
docker stop law-firm-blue
docker rm law-firm-blue
```

## Production Monitoring Dashboard

### Key Metrics to Track

1. **Application Metrics**
   - Request rate (req/sec)
   - Response time (P50, P95, P99)
   - Error rate (%)
   - Status codes distribution

2. **Database Metrics**
   - Query latency
   - Slow query count
   - Connection pool usage
   - Cache hit ratio

3. **Infrastructure Metrics**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network bandwidth

4. **Business Metrics**
   - Active users
   - Task completion rate
   - SLA compliance
   - User retention

## Cost Optimization

### Reserved Instances

```bash
# AWS: Use Reserved Instances for 30-40% savings
aws ec2 purchase-reserved-instances-offering \
  --offering-id 123abc45-1234-1abc-3abc-12345678
```

### Spot Instances

```bash
# Use spot instances for non-critical workloads
# Save up to 70% on compute costs
docker run -d \
  -e AWS_SPOT_PRICE=0.05 \
  law-firm-backend
```

### Data Transfer Optimization

```bash
# Use CloudFront/Cloud CDN for static assets
# Compress responses with gzip
# Use connection keep-alive
# Batch API requests
```

## Compliance & Security

### GDPR Compliance

```bash
# Data retention policy
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';

# Data export for users
SELECT * FROM users WHERE id = $1;
SELECT * FROM tasks WHERE created_by = $1;

# Right to be forgotten
DELETE FROM users WHERE id = $1 CASCADE;
DELETE FROM audit_logs WHERE user_id = $1;
```

### HIPAA Compliance (if handling health data)

```javascript
// Encryption at rest
const encrypted = encryptWithKMS(data, process.env.KMS_KEY_ID);

// Encryption in transit
https.Server({
  cert: fs.readFileSync('/path/to/cert.pem'),
  key: fs.readFileSync('/path/to/key.pem')
});

// Audit logging
auditLog.record({
  user: userId,
  action: 'view_sensitive_data',
  timestamp: new Date(),
  ipAddress: req.ip
});
```

### PCI DSS Compliance (if handling payments)

```javascript
// Never log credit card numbers
const logData = {
  ...data,
  cardNumber: data.cardNumber.slice(-4).padStart(16, '*')
};

// Use tokenization (Stripe, Square)
const token = await stripe.createPaymentMethod({
  type: 'card',
  card: cardData
});
```

## Rollback Procedure

```bash
# Quick rollback to previous version
docker pull ghcr.io/YOUR_GITHUB/law-firm:v1.2.3
docker tag ghcr.io/YOUR_GITHUB/law-firm:v1.2.3 law-firm:current

# Update ECS service
aws ecs update-service \
  --cluster law-firm \
  --service backend \
  --force-new-deployment

# Verify rollback
curl https://api.example.com/api/version
# Output: {"version": "1.2.3"}
```

## Final Checklist

- ✅ SSL/TLS certificates installed
- ✅ Environment variables configured securely
- ✅ Database backups automated
- ✅ Monitoring and alerting configured
- ✅ Rate limiting enabled
- ✅ CORS configured correctly
- ✅ Security headers added
- ✅ WAF rules configured
- ✅ Audit logging enabled
- ✅ Database indexes optimized
- ✅ Connection pooling configured
- ✅ Cache strategy implemented
- ✅ Smoke tests passing
- ✅ Load testing completed
- ✅ Disaster recovery plan documented
- ✅ Team training completed
- ✅ On-call rotation established
- ✅ Runbooks created
- ✅ Compliance verified
- ✅ Performance baseline established

