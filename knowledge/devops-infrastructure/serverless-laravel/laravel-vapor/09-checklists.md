# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 06-serverless-laravel
**Knowledge Unit:** laravel-vapor
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `vapor.yml` created with application configuration
- [ ] Two Lambda functions per project (HTTP and CLI) understood
- [ ] `vapor deploy` command tested from local environment
- [ ] Vapor CLI installed and authenticated with API token
- [ ] Environment variables pushed via `vapor env:push`
- [ ] Database (RDS), cache (ElastiCache), and queue (SQS) configured in Vapor dashboard

---

# Architecture Checklist

- [ ] HTTP Lambda vs CLI Lambda separation designed
- [ ] `vapor.yml` configuration written (build, deploy, storage, queue, database)
- [ ] API Gateway for HTTP function routing
- [ ] SQS queue configured for queue worker Lambda
- [ ] RDS database and ElastiCache Redis provisioned via Vapor
- [ ] CloudFront CDN configured for static assets
- [ ] Vapor vs Laravel Cloud vs Bref comparison documented

---

# Implementation Checklist

- [ ] `vapor.yml` created with build commands and deploy configuration
- [ ] `.env` pushed to Vapor for each environment (`vapor env:push staging`)
- [ ] Queue connection configured as `sqs` in Laravel config
- [ ] Cache driver configured as `elasticache` or `redis`
- [ ] Asset storage configured (S3 bucket for uploaded files)
- [ ] IAM roles managed by Vapor (auto-created)

---

# Performance Checklist

- [ ] Configuration cache built before deploy (`php artisan config:cache`)
- [ ] Route and view cache also built for cold start reduction
- [ ] Lambda memory size tuned (1024MB default, adjust as needed)
- [ ] Provisioned concurrency configured for production environment
- [ ] RDS instance size selected based on expected connections
- [ ] ElastiCache Redis instance size selected

---

# Security Checklist

- [ ] IAM roles reviewed (Vapor auto-created, least privilege check)
- [ ] Environment variables encrypted at rest
- [ ] VPC configured for Lambda -> RDS private networking
- [ ] S3 bucket for uploads configured with public read restriction
- [ ] `vapor.yml` does not contain secrets (use `vapor env:push`)
- [ ] CloudFront signed URLs for private assets if needed

---

# Reliability Checklist

- [ ] DLQ configured for failed SQS queue jobs
- [ ] RDS backup retention configured (>7 days)
- [ ] Multi-AZ RDS for production environments
- [ ] Vapor deploy rollback via `vapor deploy --commit=<previous>`
- [ ] Elasticache Redis replication for production

---

# Testing Checklist

- [ ] `vapor deploy staging` tested and app responds
- [ ] Queue worker processes job via SQS Lambda
- [ ] Configuration cache verified (no env null returns after cache)
- [ ] Vapor dashboard shows correct metrics
- [ ] CDN asset serving verified (CloudFront URL)

---

# Maintainability Checklist

- [ ] `vapor.yml` version-controlled (without secrets)
- [ ] Environment variable changes tracked in Vapor dashboard
- [ ] Deployment commands documented in README
- [ ] Vapor version pinned in composer.json
- [ ] Cost monitoring configured in AWS Console

---

# Anti-Pattern Prevention Checklist

- [ ] No local file storage (always use S3 for uploads)
- [ ] No environment variables in vapor.yml (use env:push)
- [ ] No database operations exceeding Lambda timeout (29s for HTTP)
- [ ] No hardcoded AWS account IDs or resource names
- [ ] No deployment without config:cache for cold start mitigation

---

# Production Readiness Checklist

- [ ] Provisioned concurrency configured for HTTP function
- [ ] RDS backup retention >= 30 days for production
- [ ] Multi-AZ RDS enabled
- [ ] CloudFront distribution configured and verified
- [ ] Vapor dashboard monitoring reviewed
- [ ] Rollback tested via previous commit deploy

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: HTTP/CLI Lambda, vapor.yml, SQS, RDS designed
- [ ] Security requirements satisfied: IAM review, env encryption, VPC, S3 access
- [ ] Performance requirements satisfied: cache, provisioned concurrency, memory tuned
- [ ] Testing requirements satisfied: staging deploy, queue, cache, CDN verified
- [ ] Anti-pattern checks passed: no local storage, no env in yml, Lambda timeout handled
- [ ] Production readiness verified: backups, Multi-AZ, CloudFront, monitoring, rollback

---

# Related References

- Laravel Cloud (KU-016) -- next-gen Vapor alternative built on K8s
- Bref Serverless PHP (KU-017) -- open-source alternative
- CI/CD Pipelines (KU-008/009) -- Vapor deploy in CI
- Database Deployment & Migration (KU-019/020)
- Environment & Secret Management (KU-021)
