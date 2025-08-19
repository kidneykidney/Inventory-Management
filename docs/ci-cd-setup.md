# CI/CD Pipeline Setup Guide

This document describes the continuous integration and deployment pipeline for the Inventory Management System.

## Overview

The CI/CD pipeline is built using GitHub Actions and includes:

- **Continuous Integration**: Automated testing, linting, and quality checks
- **Continuous Deployment**: Automated deployment to staging and production environments
- **Quality Gates**: Automated quality checks and performance testing
- **Database Migrations**: Automated database schema updates
- **Monitoring**: Health checks and performance monitoring

## Pipeline Structure

### 1. Continuous Integration (`.github/workflows/ci.yml`)

Triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

1. **Lint and Format Check**
   - ESLint validation
   - Prettier formatting check
   - Code style enforcement

2. **Frontend Tests**
   - Unit tests with Jest
   - Component tests with React Testing Library
   - Code coverage reporting

3. **Backend Tests**
   - API integration tests
   - Database tests with MySQL
   - Service layer tests

4. **Build**
   - Frontend build validation
   - Artifact generation
   - Build optimization

5. **End-to-End Tests**
   - Cypress E2E tests
   - Full application workflow testing
   - Cross-browser compatibility

6. **Security Scan**
   - npm audit for vulnerabilities
   - Snyk security scanning
   - Dependency vulnerability checks

7. **Quality Gate**
   - Code quality metrics
   - Performance benchmarks
   - Quality threshold validation

### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)

Triggered on:
- Push to `develop` branch
- Manual workflow dispatch

**Process:**
1. Build application with staging configuration
2. Run database migrations
3. Deploy to staging server
4. Health check validation
5. Slack notification

### 3. Production Deployment (`.github/workflows/deploy-production.yml`)

Triggered on:
- Push to `main` branch
- Release publication
- Manual workflow dispatch (with approval)

**Process:**
1. Full test suite execution
2. Database backup creation
3. Database migrations
4. Blue-green deployment
5. Health checks and smoke tests
6. Automatic rollback on failure
7. Notification and monitoring

## Database Migrations

### Migration System

The project uses a custom migration system (`scripts/migrate-database.js`) that:

- Tracks executed migrations in a `migrations` table
- Supports forward migrations and rollbacks
- Validates migration checksums
- Provides migration status reporting

### Migration Commands

```bash
# Run pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status

# Run migrations in test environment
npm run migrate:test
```

### Creating Migrations

1. Create a new SQL file in `server/migrations/`
2. Use naming convention: `001_description.sql`
3. Optionally create rollback file: `001_description.rollback.sql`

Example migration:
```sql
-- 002_add_user_preferences.sql
CREATE TABLE user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Quality Gates

### Automated Quality Checks

The quality gate system (`scripts/quality-gate.js`) validates:

- **Code Quality**: ESLint rules and formatting
- **Test Coverage**: Minimum 70% coverage requirement
- **Security**: High/critical vulnerability detection
- **Performance**: Response time and complexity metrics
- **Dependencies**: Outdated package detection

### Quality Metrics Collection

```bash
# Run quality gate checks
npm run quality:gate

# Generate quality metrics report
npm run quality:metrics

# Generate code review checklist
npm run quality:checklist
```

## Performance Testing

### Load Testing with K6

The performance testing system (`scripts/performance-test.js`) includes:

- **Load Testing**: Concurrent user simulation
- **Response Time Monitoring**: 95th percentile tracking
- **Throughput Measurement**: Requests per second
- **Error Rate Tracking**: Failure percentage monitoring

### Performance Thresholds

- Response Time: < 2000ms (95th percentile)
- Error Rate: < 5%
- Throughput: > 10 requests/second

### Running Performance Tests

```bash
# Run performance test suite
npm run performance:test

# Set custom configuration
BASE_URL=https://staging.example.com CONCURRENCY=20 npm run performance:test
```

## Environment Configuration

### Required Environment Variables

**Database:**
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

**Application:**
- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Server port
- `JWT_SECRET`: JWT signing secret

**CI/CD:**
- `STAGING_HOST`: Staging server host
- `PRODUCTION_HOST`: Production server host
- `AWS_ACCESS_KEY_ID`: AWS credentials for backups
- `SLACK_WEBHOOK`: Slack notification webhook

### GitHub Secrets Setup

1. Go to repository Settings → Secrets and variables → Actions
2. Add the following secrets:

**Staging Environment:**
- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_KEY`
- `STAGING_DB_HOST`
- `STAGING_DB_PASSWORD`
- `STAGING_API_URL`

**Production Environment:**
- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_DB_HOST`
- `PRODUCTION_DB_PASSWORD`
- `PRODUCTION_API_URL`

**External Services:**
- `SNYK_TOKEN`
- `SLACK_WEBHOOK`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Monitoring and Health Checks

### Health Check Endpoints

- `/api/health` - Basic health status
- `/api/health/detailed` - Comprehensive system metrics
- `/api/health/ready` - Readiness probe for load balancers
- `/api/health/live` - Liveness probe for container orchestration

### Health Check Response

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": "OK",
    "memory": "OK",
    "disk": "OK"
  },
  "responseTime": "15ms"
}
```

## Rollback Procedures

### Automatic Rollback

The production deployment includes automatic rollback on:
- Health check failures
- Smoke test failures
- Critical error detection

### Manual Rollback

```bash
# SSH to production server
ssh user@production-server

# Navigate to application directory
cd /var/www/inventory-production

# Rollback to previous commit
git reset --hard HEAD~1

# Reinstall dependencies
npm ci

# Rebuild application
npm run build

# Restart application
pm2 restart inventory-production
```

### Database Rollback

```bash
# Rollback last migration
npm run migrate:rollback

# Restore from backup (if needed)
mysql -u user -p database_name < backup_file.sql
```

## Troubleshooting

### Common Issues

1. **Migration Failures**
   - Check database connectivity
   - Verify migration syntax
   - Check for conflicting schema changes

2. **Test Failures**
   - Review test logs in GitHub Actions
   - Check for environment-specific issues
   - Verify test data setup

3. **Deployment Failures**
   - Check server connectivity
   - Verify environment variables
   - Review application logs

4. **Performance Issues**
   - Monitor response times
   - Check database query performance
   - Review resource utilization

### Debugging Commands

```bash
# Check migration status
npm run migrate:status

# Run quality checks locally
npm run quality:gate

# Test database connection
node -e "require('./server/config/database').initDatabase().then(() => console.log('DB OK'))"

# Check application health
curl http://localhost:5000/api/health
```

## Best Practices

### Development Workflow

1. Create feature branch from `develop`
2. Implement changes with tests
3. Run quality checks locally
4. Create pull request
5. Address CI feedback
6. Merge after approval

### Deployment Strategy

1. **Staging First**: Always deploy to staging before production
2. **Database Migrations**: Run migrations during low-traffic periods
3. **Monitoring**: Monitor application metrics after deployment
4. **Rollback Plan**: Always have a rollback plan ready

### Security Considerations

1. **Secrets Management**: Use GitHub Secrets for sensitive data
2. **Access Control**: Limit production access to essential personnel
3. **Audit Logging**: Log all deployment activities
4. **Vulnerability Scanning**: Regular security scans and updates

This CI/CD pipeline ensures reliable, automated deployment with comprehensive quality checks and monitoring.