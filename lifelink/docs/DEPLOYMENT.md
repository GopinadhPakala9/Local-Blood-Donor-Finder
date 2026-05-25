# LifeLink – Production Deployment Guide

## Architecture Overview

```
Internet → CloudFront (CDN) → ALB → ECS Fargate (Backend)
                                         ↓
                                   RDS PostgreSQL
                                   ElastiCache Redis
                                   S3 (certificates)
                                   SES (emails)
```

---

## AWS Infrastructure Setup

### 1. VPC & Networking
```bash
# Create VPC with public/private subnets
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=lifelink-vpc}]'

# Create subnets in 2 AZs (ap-south-1a and ap-south-1b)
# Private subnets for RDS, ElastiCache, ECS tasks
# Public subnets for ALB
```

### 2. RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier lifelink-postgres \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username lifelink_user \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --multi-az \
  --db-name lifelink \
  --vpc-security-group-ids sg-xxxxxx \
  --db-subnet-group-name lifelink-db-subnet-group \
  --backup-retention-period 7 \
  --deletion-protection \
  --region ap-south-1
```

### 3. ElastiCache Redis
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id lifelink-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name lifelink-cache-subnet \
  --security-group-ids sg-xxxxxx \
  --region ap-south-1
```

### 4. ECR Repository
```bash
aws ecr create-repository --repository-name lifelink-backend --region ap-south-1
```

### 5. ECS Fargate

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name lifelink-cluster --region ap-south-1

# Register task definition (see task-definition.json below)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster lifelink-cluster \
  --service-name lifelink-backend \
  --task-definition lifelink-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:...,containerName=lifelink-backend,containerPort=3000"
```

### 6. S3 Bucket (Donation Certificates)
```bash
aws s3api create-bucket \
  --bucket lifelink-certificates \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

# Enable versioning and server-side encryption
aws s3api put-bucket-versioning --bucket lifelink-certificates --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket lifelink-certificates --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

---

## SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.lifelink.health

# Auto-renewal (added to cron automatically by certbot)
sudo certbot renew --dry-run
```

---

## Environment Variables (AWS Secrets Manager)

Store sensitive values in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name lifelink/production \
  --secret-string '{
    "JWT_SECRET": "your-secure-jwt-secret",
    "JWT_REFRESH_SECRET": "your-secure-refresh-secret",
    "DATABASE_PASSWORD": "your-db-password",
    "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...",
    "OTP_API_KEY": "your-msg91-key"
  }'
```

---

## Flutter App Release

### Android (Play Store)

```bash
cd mobile

# Create keystore (do once)
keytool -genkey -v -keystore android/app/keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias lifelink

# Build release AAB
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
# Upload to Play Console → Production
```

**Play Console Checklist:**
- [ ] Privacy Policy URL
- [ ] App icon (512×512 PNG)
- [ ] Feature graphic (1024×500)
- [ ] Screenshots (phone + tablet)
- [ ] Content rating questionnaire
- [ ] Data safety form (location, contacts)

### iOS (App Store)

```bash
# Build iOS release
flutter build ios --release

# Open Xcode
open ios/Runner.xcworkspace

# Product → Archive → Distribute App → App Store Connect
```

**App Store Checklist:**
- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect app record
- [ ] Privacy Policy URL
- [ ] Screenshots (6.7" and 5.5" iPhones)
- [ ] App Privacy details
- [ ] Apple Sign-In integration

---

## Monitoring & Alerts

### CloudWatch Alarms
```bash
# API error rate > 5%
aws cloudwatch put-metric-alarm \
  --alarm-name lifelink-api-errors \
  --metric-name HTTPCode_ELB_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:ap-south-1:xxx:lifelink-alerts

# Database CPU > 80%
aws cloudwatch put-metric-alarm \
  --alarm-name lifelink-db-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Database Backup
```bash
# RDS automated backups: 7-day retention (configured above)
# Manual snapshot before major deployments:
aws rds create-db-snapshot \
  --db-instance-identifier lifelink-postgres \
  --db-snapshot-identifier lifelink-snapshot-$(date +%Y%m%d)
```

---

## Rollback Procedure

```bash
# Rollback ECS to previous task definition
aws ecs update-service \
  --cluster lifelink-cluster \
  --service lifelink-backend \
  --task-definition lifelink-backend:PREVIOUS_VERSION

# Rollback database migration
cd backend
npm run migration:revert
```
