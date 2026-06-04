# CI/CD Pipeline Implementation Guide

## Project Overview

This guide provides a comprehensive roadmap for implementing a CI/CD pipeline for the v2-attendance project, which consists of:

- **Backend**: Node.js/Express/TypeScript with Prisma ORM, MySQL database, Socket.IO
- **Frontend**: Next.js 16 + React 19 + TailwindCSS 4
- **Mobile**: Expo/React Native with EAS builds

**Current Deployment**: Manual SSH to Hostinger VPS (72.62.254.60), PM2 process manager, Nginx reverse proxy

---

## Table of Contents

1. [CI/CD Strategy Options](#cicd-strategy-options)
2. [Prerequisites](#prerequisites)
3. [GitHub Actions Implementation](#github-actions-implementation)
4. [Environment Variables Management](#environment-variables-management)
5. [Database Migration Strategy](#database-migration-strategy)
6. [Mobile App CI/CD](#mobile-app-cicd)
7. [Monitoring and Health Checks](#monitoring-and-health-checks)
8. [Rollback Strategy](#rollback-strategy)
9. [Security Considerations](#security-considerations)
10. [Implementation Roadmap](#implementation-roadmap)

---

## CI/CD Strategy Options

### Option A: GitHub Actions (Recommended)
**Pros:**
- Native GitHub integration
- Free for public repositories, generous free tier for private
- Easy to set up and maintain
- Large community and marketplace actions
- Built-in secret management

**Cons:**
- Limited compute resources on free tier
- May require self-hosted runners for specific requirements

### Option B: GitLab CI/CD
**Pros:**
- More generous free tier with more CI minutes
- Built-in container registry
- Advanced features in free tier

**Cons:**
- Requires migration from GitHub
- Steeper learning curve

### Option C: Jenkins with Self-Hosted Runner
**Pros:**
- Complete control over infrastructure
- Unlimited compute resources
- Highly customizable

**Cons:**
- High maintenance overhead
- Requires server management
- More complex setup

**Recommendation**: Start with **GitHub Actions** due to current GitHub hosting and ease of implementation.

---

## Prerequisites

### 1. Repository Organization
Ensure your repository follows this structure:
```
v2-attendance/
├── .github/
│   └── workflows/          # CI/CD workflows
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── jest.config.js
├── frontend/
│   ├── src/
│   ├── package.json
│   └── next.config.ts
├── attendance-mobile/
│   ├── src/
│   ├── package.json
│   └── app.json
└── docs/                   # Documentation
```

### 2. Required Accounts and Services
- GitHub account with repository access
- Hostinger VPS SSH access
- Domain management access (attendacev2.xandree.com)
- Expo account (for mobile builds)
- SMTP service for email notifications (optional)
- Monitoring service (optional: Sentry, LogRocket, etc.)

### 3. Server Preparation
Update your VPS with required tools:
```bash
# Install Docker (for containerized builds if needed)
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# Ensure PM2 is installed
npm install -g pm2

# Update Nginx configuration to support health checks
# Add health check endpoint to backend (already exists: /health)
```

---

## GitHub Actions Implementation

### 1. Backend CI Pipeline

Create `.github/workflows/backend-ci.yml`:

```yaml
name: Backend CI

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: attendance_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: ./backend
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/attendance_test
        run: npx prisma generate

      - name: Run database migrations
        working-directory: ./backend
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/attendance_test
        run: npx prisma migrate deploy

      - name: Run tests
        working-directory: ./backend
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/attendance_test
          NODE_ENV: test
          JWT_SECRET: test-secret-key-for-ci
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          file: ./backend/coverage/lcov.info
          flags: backend
          name: backend-coverage

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: ./backend
        run: npx prisma generate

      - name: Build TypeScript
        working-directory: ./backend
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: backend-dist
          path: backend/dist
          retention-days: 7
```

### 2. Frontend CI Pipeline

Create `.github/workflows/frontend-ci.yml`:

```yaml
name: Frontend CI

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'

jobs:
  lint:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run ESLint
        working-directory: ./frontend
        run: npm run lint

  build:
    runs-on: ubuntu-latest
    needs: lint
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build Next.js
        working-directory: ./frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: frontend/.next
          retention-days: 7
```

### 3. Mobile App CI Pipeline

Create `.github/workflows/mobile-ci.yml`:

```yaml
name: Mobile CI

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'attendance-mobile/**'
      - '.github/workflows/mobile-ci.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'attendance-mobile/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: attendance-mobile/package-lock.json

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        working-directory: ./attendance-mobile
        run: npm ci

      - name: Run TypeScript check
        working-directory: ./attendance-mobile
        run: npx tsc --noEmit

  build-android:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: attendance-mobile/package-lock.json

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          eas-version: latest

      - name: Install dependencies
        working-directory: ./attendance-mobile
        run: npm ci

      - name: Build Android APK
        working-directory: ./attendance-mobile
        run: eas build --platform android --profile preview --non-interactive

      - name: Build Android AAB (Production)
        working-directory: ./attendance-mobile
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: eas build --platform android --profile production --non-interactive
```

### 4. Deployment Pipeline

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || 22 }}
          script: |
            cd /var/www/version2_attendance
            
            # Pull latest changes
            git fetch origin main
            git reset --hard origin/main
            
            # Install root dependencies
            npm install
            
            # Backend deployment
            cd backend
            npm install
            npx prisma generate
            npm run build
            pm2 restart v2_attendance-api --update-env
            
            # Frontend deployment
            cd ../frontend
            npm install
            echo "NEXT_PUBLIC_API_URL=https://attendacev2.xandree.com/api" > .env.local
            npm run build
            pm2 restart v2_attendance-web --update-env
            
            # Verify services
            pm2 status
            
            # Health check
            curl -f http://localhost:5002/health || exit 1
            curl -f http://localhost:3001 || exit 1

      - name: Notify deployment status
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production: ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Environment Variables Management

### GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Backend Secrets
```
DATABASE_URL=mysql://root:password@localhost:3306/attendance-system
JWT_SECRET=your-jwt-secret
NODE_ENV=production
FRONTEND_URL=https://attendacev2.xandree.com
```

#### Frontend Secrets
```
NEXT_PUBLIC_API_URL=https://attendacev2.xandree.com/api
```

#### VPS Deployment Secrets
```
VPS_HOST=72.62.254.60
VPS_USERNAME=root
VPS_SSH_KEY=your-private-ssh-key
VPS_PORT=22
```

#### Mobile App Secrets
```
EXPO_TOKEN=your-expo-token
```

#### Notification Secrets (Optional)
```
SLACK_WEBHOOK=your-slack-webhook-url
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password
```

### Server-Side Environment Files

**Backend `.env`** (already exists on server):
```env
NODE_ENV=production
DATABASE_URL=mysql://root:password@localhost:3306/attendance-system
PORT=5002
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://attendacev2.xandree.com
```

**Frontend `.env.local`** (already exists on server):
```env
NEXT_PUBLIC_API_URL=https://attendacev2.xandree.com/api
```

---

## Database Migration Strategy

### Automated Migrations

Update the deployment workflow to handle migrations:

```yaml
- name: Database migrations
  working-directory: ./backend
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    npx prisma migrate deploy
    npx prisma db seed  # If you have seed data
```

### Migration Best Practices

1. **Version Control**: All migrations should be in `backend/prisma/migrations/`
2. **Backup Before Migration**: Always backup before production migrations
3. **Rollback Plan**: Each migration should have a corresponding rollback script
4. **Test Migrations**: Run migrations on staging environment first

### Backup Script

Add to your deployment workflow:

```yaml
- name: Backup database
  run: |
    ssh ${{ secrets.VPS_USERNAME }}@${{ secrets.VPS_HOST }} \
      "mysqldump -u root -p${{ secrets.MYSQL_PASSWORD }} attendance-system > backup_$(date +%Y%m%d_%H%M%S).sql"
```

---

## Mobile App CI/CD

### EAS Build Configuration

Create `attendance-mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountFilePath": "./google-service-account.json"
      },
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

### Automated App Store Submission

Add to mobile CI workflow:

```yaml
- name: Submit to Play Store
  if: github.event_name == 'release'
  working-directory: ./attendance-mobile
  run: eas submit --platform android --latest

- name: Submit to App Store
  if: github.event_name == 'release'
  working-directory: ./attendance-mobile
  run: eas submit --platform ios --latest
```

---

## Monitoring and Health Checks

### Health Endpoints

**Backend** (already exists):
```typescript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
```

**Frontend** - Add to `frontend/src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
```

### Monitoring Workflow

Create `.github/workflows/monitoring.yml`:

```yaml
name: Health Check Monitoring

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    
    steps:
      - name: Check backend health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://attendacev2.xandree.com/api/health)
          if [ $response -ne 200 ]; then
            echo "Backend health check failed with status: $response"
            exit 1
          fi

      - name: Check frontend health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://attendacev2.xandree.com)
          if [ $response -ne 200 ]; then
            echo "Frontend health check failed with status: $response"
            exit 1
          fi

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: 'failure'
          text: 'Health check failed for production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Rollback Strategy

### Automated Rollback

Create `.github/workflows/rollback.yml`:

```yaml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      commit_sha:
        description: 'Commit SHA to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.commit_sha }}

      - name: Deploy specific commit
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/version2_attendance
            git fetch origin
            git reset --hard ${{ github.event.inputs.commit_sha }}
            
            cd backend && npm run build
            cd ../frontend && npm run build
            
            pm2 restart all
            pm2 status

      - name: Notify rollback
        uses: 8398a7/action-slack@v3
        with:
          status: 'success'
          text: 'Rolled back to commit: ${{ github.event.inputs.commit_sha }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Database Rollback

```yaml
- name: Database rollback
  working-directory: ./backend
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    # List migrations
    npx prisma migrate status
    
    # Rollback to specific migration
    npx prisma migrate resolve --rolled-back [migration-name]
```

---

## Security Considerations

### 1. Secret Management
- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use different secrets for staging and production

### 2. Dependency Scanning

Add to CI pipelines:

```yaml
- name: Run security audit
  working-directory: ./backend
  run: npm audit

- name: Run dependency check
  uses: actions/dependency-review-action@v4
```

### 3. Code Quality

```yaml
- name: Run TypeScript type check
  working-directory: ./backend
  run: npx tsc --noEmit

- name: Run ESLint
  working-directory: ./backend
  run: npm run lint
```

### 4. Container Security (if using Docker)

```yaml
- name: Build Docker image
  run: docker build -t v2-attendance-backend ./backend

- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: v2-attendance-backend
    format: 'sarif'
    output: 'trivy-results.sarif'
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up GitHub repository secrets
- [ ] Create `.github/workflows` directory structure
- [ ] Implement backend CI pipeline (test + build)
- [ ] Implement frontend CI pipeline (lint + build)
- [ ] Set up code quality checks (ESLint, TypeScript)

### Phase 2: Testing & Quality (Week 3)
- [ ] Add backend integration tests
- [ ] Set up frontend testing (Jest + React Testing Library)
- [ ] Configure coverage reporting (Codecov)
- [ ] Add dependency scanning
- [ ] Implement security audit checks

### Phase 3: Deployment Automation (Week 4)
- [ ] Implement deployment workflow
- [ ] Set up database migration automation
- [ ] Add backup scripts to deployment
- [ ] Configure health check endpoints
- [ ] Test deployment on staging environment

### Phase 4: Mobile CI/CD (Week 5)
- [ ] Set up Expo EAS configuration
- [ ] Implement mobile app CI pipeline
- [ ] Configure automated builds
- [ ] Set up app store submission automation
- [ ] Test mobile deployment workflow

### Phase 5: Monitoring & Operations (Week 6)
- [ ] Implement health check monitoring
- [ ] Set up alerting (Slack/email)
- [ ] Configure log aggregation
- [ ] Implement rollback procedures
- [ ] Create runbooks for common issues

### Phase 6: Optimization (Week 7-8)
- [ ] Optimize CI/CD pipeline performance
- [ ] Implement caching strategies
- [ ] Add parallel job execution
- [ ] Configure staging environment
- [ ] Document all processes

---

## Cost Estimation

### GitHub Actions (Free Tier)
- **Free**: 2,000 minutes/month for private repositories
- **Backend CI**: ~5 minutes per run
- **Frontend CI**: ~3 minutes per run
- **Mobile CI**: ~15 minutes per run (EAS build)
- **Deployment**: ~3 minutes per run

**Estimated usage**: ~500-800 minutes/month (within free tier)

### Paid Tier (if needed)
- **Pro**: $4/month for 3,000 additional minutes
- **Enterprise**: Custom pricing

### Expo EAS Builds
- **Free**: 30 builds/month
- **Paid**: $99/month for unlimited builds

### Additional Services (Optional)
- **Codecov**: Free for open source, $10/month for private
- **Sentry**: Free tier available, $26/month for paid
- **Slack**: Free tier sufficient for notifications

---

## Troubleshooting

### Common Issues

#### 1. Pipeline Timeout
**Solution**: Increase timeout in workflow:
```yaml
jobs:
  build:
    timeout-minutes: 30
```

#### 2. SSH Connection Issues
**Solution**: Verify SSH key format and permissions:
```bash
chmod 600 ~/.ssh/id_rsa
ssh-keygen -t rsa -b 4096 -C "github-actions"
```

#### 3. Database Connection Failures
**Solution**: Ensure MySQL service is healthy:
```yaml
services:
  mysql:
    options: --health-cmd="mysqladmin ping" --health-interval=10s
```

#### 4. Memory Issues
**Solution**: Increase available memory or use larger runner:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest-8-cores
```

---

## Best Practices

1. **Branch Strategy**: Use `main` for production, `develop` for staging
2. **Commit Messages**: Follow conventional commits format
3. **Pull Requests**: Require PR reviews before merging to main
4. **Testing**: Maintain minimum 70% coverage for critical paths
5. **Documentation**: Update documentation with every major change
6. **Monitoring**: Monitor pipeline performance and success rates
7. **Security**: Regular security audits and dependency updates
8. **Backup**: Daily automated backups of database and uploads

---

## Next Steps

1. **Review this guide** with your team
2. **Set up GitHub repository secrets**
3. **Create workflow files** starting with backend CI
4. **Test pipelines** on a feature branch
5. **Gradually implement** each phase
6. **Monitor and optimize** based on results

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo EAS Documentation](https://docs.expo.dev/build/introduction/)
- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last Updated**: 2026-06-04  
**Version**: 1.0.0  
**Maintained by**: Development Team
