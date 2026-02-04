# AWS ECS Deployment Guide

## Architecture Overview

```
Route 53 (DNS)
    ↓
Application Load Balancer (ALB)
    ├─→ Backend Service (ECS Fargate)
    │    └─→ RDS PostgreSQL
    │    └─→ ElastiCache Redis
    │
    └─→ CloudFront Distribution
         ├─→ S3 Bucket (Frontend Static)
         └─→ ALB (Backend)
```

## Prerequisites

- AWS Account with appropriate IAM permissions
- AWS CLI configured locally
- Docker and Docker Compose installed
- Access to ECR (Elastic Container Registry)

## Step 1: Create ECR Repositories

```bash
# Backend repository
aws ecr create-repository \
  --repository-name law-firm/backend \
  --region us-east-1

# Frontend repository
aws ecr create-repository \
  --repository-name law-firm/frontend \
  --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

## Step 2: Build and Push Docker Images

```bash
# Backend
docker build -t law-firm/backend:latest ./backend
docker tag law-firm/backend:latest \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/law-firm/backend:latest
docker push \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/law-firm/backend:latest

# Frontend
docker build -t law-firm/frontend:latest ./frontend
docker tag law-firm/frontend:latest \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/law-firm/frontend:latest
docker push \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/law-firm/frontend:latest
```

## Step 3: Create RDS PostgreSQL Database

```bash
aws rds create-db-instance \
  --db-instance-identifier law-firm-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password '<STRONG_PASSWORD>' \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --no-publicly-accessible \
  --backup-retention-period 7 \
  --region us-east-1

# Wait for database to be available (5-10 minutes)
aws rds describe-db-instances \
  --db-instance-identifier law-firm-db \
  --region us-east-1
```

## Step 4: Create ElastiCache Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id law-firm-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxx \
  --region us-east-1

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id law-firm-redis \
  --show-cache-node-info \
  --region us-east-1
```

## Step 5: Create ECS Cluster and Services

```bash
# Create ECS Cluster
aws ecs create-cluster \
  --cluster-name law-firm-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --region us-east-1

# Register Task Definition for Backend
aws ecs register-task-definition \
  --cli-input-json file://ecs/backend-task-def.json \
  --region us-east-1

# Register Task Definition for Frontend
aws ecs register-task-definition \
  --cli-input-json file://ecs/frontend-task-def.json \
  --region us-east-1

# Create Service (Backend)
aws ecs create-service \
  --cluster law-firm-cluster \
  --service-name law-firm-backend \
  --task-definition law-firm-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxxxxxxx,subnet-yyyyyyyy],
    securityGroups=[sg-zzzzzzzz],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:<ACCOUNT>:targetgroup/law-firm-backend/xxxx,containerName=backend,containerPort=5000" \
  --region us-east-1

# Create Service (Frontend)
aws ecs create-service \
  --cluster law-firm-cluster \
  --service-name law-firm-frontend \
  --task-definition law-firm-frontend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxxxxxxx,subnet-yyyyyyyy],
    securityGroups=[sg-zzzzzzzz],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:<ACCOUNT>:targetgroup/law-firm-frontend/yyyy,containerName=frontend,containerPort=3000" \
  --region us-east-1
```

## Step 6: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name law-firm-alb \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-zzzzzzzz \
  --scheme internet-facing \
  --type application \
  --region us-east-1

# Create Target Groups
aws elbv2 create-target-group \
  --name law-firm-backend-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxxxxx \
  --target-type ip \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region us-east-1

aws elbv2 create-target-group \
  --name law-firm-frontend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxxxxx \
  --target-type ip \
  --health-check-protocol HTTP \
  --health-check-path / \
  --region us-east-1

# Create Listener and Rules
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:<ACCOUNT>:loadbalancer/app/law-firm-alb/xxxxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" \
  --region us-east-1

aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:<ACCOUNT>:loadbalancer/app/law-firm-alb/xxxxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:<ACCOUNT>:certificate/xxxxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:<ACCOUNT>:targetgroup/law-firm-frontend-tg/xxxxx \
  --region us-east-1

# Add rule for /api prefix to backend
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:<ACCOUNT>:listener/app/law-firm-alb/xxxxx/yyyyy \
  --priority 1 \
  --conditions Field=path-pattern,Values="/api*" \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:<ACCOUNT>:targetgroup/law-firm-backend-tg/xxxxx \
  --region us-east-1
```

## Step 7: Configure CloudFront for Frontend

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cf-dist-config.json \
  --region us-east-1
```

**cf-dist-config.json:**
```json
{
  "CallerReference": "law-firm-2026",
  "Comment": "Law Firm Task Management Frontend",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "law-firm-frontend.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true,
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https"
  }
}
```

## Step 8: Set Up Auto Scaling

```bash
# Create Auto Scaling Target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/law-firm-cluster/law-firm-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10 \
  --region us-east-1

# Create CPU Scaling Policy
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling \
  --service-namespace ecs \
  --resource-id service/law-firm-cluster/law-firm-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration \
    "TargetValue=70.0,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization},ScaleOutCooldown=60,ScaleInCooldown=300" \
  --region us-east-1

# Create Memory Scaling Policy
aws application-autoscaling put-scaling-policy \
  --policy-name memory-scaling \
  --service-namespace ecs \
  --resource-id service/law-firm-cluster/law-firm-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration \
    "TargetValue=80.0,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageMemoryUtilization},ScaleOutCooldown=60,ScaleInCooldown=300" \
  --region us-east-1
```

## Step 9: Configure CloudWatch Monitoring

```bash
# Create CloudWatch Log Group
aws logs create-log-group \
  --log-group-name /ecs/law-firm-backend \
  --region us-east-1

aws logs create-log-group \
  --log-group-name /ecs/law-firm-frontend \
  --region us-east-1

# Set retention policy (30 days)
aws logs put-retention-policy \
  --log-group-name /ecs/law-firm-backend \
  --retention-in-days 30 \
  --region us-east-1

# Create CloudWatch Dashboard
aws cloudwatch put-dashboard \
  --dashboard-name law-firm-dashboard \
  --dashboard-body file://cloudwatch-dashboard.json \
  --region us-east-1
```

## Step 10: Set Up Route 53 DNS

```bash
# Create Health Check
aws route53 create-health-check \
  --health-check-config \
    IPAddress=<ALB_IP>,\
    Port=443,\
    Type=HTTPS,\
    ResourcePath=/api/health \
  --region us-east-1

# Create DNS Record (assuming hosted zone exists)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "law-firm-alb-123456.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }' \
  --region us-east-1
```

## Step 11: Configure Secrets Manager

```bash
# Store database password
aws secretsmanager create-secret \
  --name law-firm/db-password \
  --secret-string '<DB_PASSWORD>' \
  --region us-east-1

# Store JWT secrets
aws secretsmanager create-secret \
  --name law-firm/jwt-secrets \
  --secret-string '{
    "JWT_SECRET": "<JWT_SECRET>",
    "REFRESH_TOKEN_SECRET": "<REFRESH_TOKEN_SECRET>"
  }' \
  --region us-east-1

# Store SMTP credentials
aws secretsmanager create-secret \
  --name law-firm/smtp \
  --secret-string '{
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "<YOUR_EMAIL>",
    "SMTP_PASS": "<YOUR_PASSWORD>"
  }' \
  --region us-east-1
```

## Step 12: Enable AWS WAF Protection

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name law-firm-waf \
  --scope REGIONAL \
  --default-action Block={} \
  --rules '[
    {
      "Name": "AWSManagedRulesCommonRuleGroup",
      "Priority": 0,
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      },
      "OverrideAction": {"None": {}},
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "AWSManagedRulesCommonRuleSetMetric"
      }
    }
  ]' \
  --visibility-config \
    SampledRequestsEnabled=true,\
    CloudWatchMetricsEnabled=true,\
    MetricName=law-firm-waf \
  --region us-east-1

# Associate WAF with ALB
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:us-east-1:<ACCOUNT>:regional/webacl/law-firm-waf/xxxxx \
  --resource-arn arn:aws:elasticloadbalancing:us-east-1:<ACCOUNT>:loadbalancer/app/law-firm-alb/xxxxx \
  --region us-east-1
```

## Maintenance Tasks

### Scaling

```bash
# Update desired count for backend service
aws ecs update-service \
  --cluster law-firm-cluster \
  --service law-firm-backend \
  --desired-count 5 \
  --region us-east-1
```

### Database Backup

```bash
# Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier law-firm-db \
  --db-snapshot-identifier law-firm-db-backup-$(date +%Y%m%d-%H%M%S) \
  --region us-east-1

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier law-firm-db \
  --region us-east-1
```

### Rolling Deployment

```bash
# Update ECS service with new image
aws ecs update-service \
  --cluster law-firm-cluster \
  --service law-firm-backend \
  --force-new-deployment \
  --region us-east-1

# Monitor deployment progress
aws ecs describe-services \
  --cluster law-firm-cluster \
  --services law-firm-backend \
  --region us-east-1
```

### View Logs

```bash
# Get latest backend logs
aws logs tail /ecs/law-firm-backend --follow \
  --region us-east-1

# Get specific timeframe
aws logs filter-log-events \
  --log-group-name /ecs/law-firm-backend \
  --start-time $(($(date +%s) - 3600))000 \
  --region us-east-1
```

## Cost Optimization

1. **Use Fargate Spot** for non-critical services (70% cost savings)
2. **Set up RDS Reserved Instances** (40% cost savings)
3. **Enable S3 Intelligent-Tiering** for static assets
4. **Use CloudFront** to reduce data transfer costs
5. **Monitor with Cost Explorer** for unused resources

## Troubleshooting

### Service Won't Start
```bash
# Check task definition
aws ecs describe-task-definition \
  --task-definition law-firm-backend:1 \
  --region us-east-1

# Check running tasks
aws ecs list-tasks \
  --cluster law-firm-cluster \
  --service-name law-firm-backend \
  --region us-east-1

# Describe task logs
aws logs get-log-events \
  --log-group-name /ecs/law-firm-backend \
  --log-stream-name <TASK_ID> \
  --region us-east-1
```

### High Latency
- Check CloudFront cache hit ratio
- Review RDS performance insights
- Check ElastiCache eviction rate
- Monitor ALB target health

### Database Connection Issues
```bash
# Check security group
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx \
  --region us-east-1

# Test connection from ECS task
aws ecs execute-command \
  --cluster law-firm-cluster \
  --task <TASK_ID> \
  --container backend \
  --interactive \
  --command "/bin/sh" \
  --region us-east-1
```

## Estimated Monthly Costs (Single Region)

| Service | Tier | Cost |
|---------|------|------|
| ECS Fargate | 2 tasks × 0.5 CPU, 1 GB RAM | $60 |
| RDS PostgreSQL | db.t3.micro | $30 |
| ElastiCache Redis | cache.t3.micro | $20 |
| ALB | 1 ALB + 1 million requests | $25 |
| NAT Gateway | 1 gateway | $35 |
| CloudFront | 100 GB data transfer | $10 |
| **TOTAL** | | **~$180/month** |

This covers high availability setup. Single instance setup would be $60-80/month.

