# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 06-serverless-laravel
**Knowledge Unit:** bref-laravel
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Bref PHP runtime configured for AWS Lambda
- [ ] API Gateway (REST or HTTP API) set up for HTTP serving
- [ ] `serverless.yml` or `bref-laravel-config.yml` written
- [ ] SQS queue processing configured for event-driven workloads
- [ ] EventBridge scheduled tasks configured for cron replacement
- [ ] Cold start mitigation applied (config cache, provisioned concurrency)

---

# Architecture Checklist

- [ ] Lambda runtime architecture designed (Bref PHP runtime, FPM wrapper)
- [ ] HTTP serving via API Gateway (REST vs HTTP API) or Lambda Function URL
- [ ] Event-driven architecture for queues (SQS -> Lambda)
- [ ] File handling strategy designed (S3 presigned URLs, Lambda request limits)
- [ ] Database connectivity via RDS Proxy with connection pooling
- [ ] VPC networking designed for Lambda + RDS access

---

# Implementation Checklist

- [ ] `composer require bref/bref bref/laravel-bridge` installed
- [ ] `serverless.yml` or `bref-laravel-config.yml` created
- [ ] Lambda function defined for HTTP (using `bref-php-82` runtime)
- [ ] Lambda function defined for CLI/queue (separate function)
- [ ] `php artisan bref:bridge-config` generated for Laravel bridge
- [ ] SQS queue created and mapped to queue worker Lambda

---

# Performance Checklist

- [ ] Configuration cache built (`php artisan config:cache`) for cold start
- [ ] Route cache built (`php artisan route:cache`)
- [ ] View cache built (`php artisan view:cache`)
- [ ] Provisioned concurrency configured for critical functions
- [ ] Lambda memory size tuned (min 512MB for Laravel, 1024MB recommended)
- [ ] RDS Proxy connection pool size configured (max 1/4 of Lambda concurrency)

---

# Security Checklist

- [ ] Lambda function IAM role scoped with least privilege
- [ ] API Gateway authorization configured (IAM, JWT, or custom authorizer)
- [ ] S3 presigned URLs for file uploads (no direct public write)
- [ ] RDS Proxy IAM authentication enabled
- [ ] VPC security groups restrict Lambda -> RDS traffic
- [ ] Environment variables encrypted at rest (KMS)

---

# Reliability Checklist

- [ ] DLQ configured for SQS queue processing failures
- [ ] Lambda timeout configured (max 15 min for queue/CLI, 30s for HTTP)
- [ ] Retry policy configured for SQS -> Lambda (max retries, dead letter)
- [ ] RDS Proxy connection pooling prevents database connection exhaustion
- [ ] Error handling for Lambda invocation failures (DLQ, retry)

---

# Testing Checklist

- [ ] Lambda function invoked locally via `serverless invoke local` or Bref Docker
- [ ] API Gateway endpoint tested (HTTP 200 response)
- [ ] SQS queue processing tested (message triggers Lambda)
- [ ] EventBridge schedule triggers Lambda on cron
- [ ] Cold start timing measured (target under 1 second with cache)

---

# Maintainability Checklist

- [ ] `serverless.yml` or Bref config version-controlled
- [ ] Deployment script with `serverless deploy` documented
- [ ] IAM policies documented with resource ARNs
- [ ] Environment variables inventory maintained
- [ ] Bref version pinned in composer.json

---

# Anti-Pattern Prevention Checklist

- [ ] No database connection without RDS Proxy (risks connection exhaustion)
- [ ] No file uploads stored on Lambda /tmp (use S3 with presigned URLs)
- [ ] No synchronous long-running operations in HTTP Lambda (use queue)
- [ ] No hardcoded environment names in serverless config
- [ ] No cold-start-sensitive endpoints without provisioned concurrency

---

# Production Readiness Checklist

- [ ] Provisioned concurrency configured for production HTTP function
- [ ] Configuration/routing/view cache built and verified
- [ ] RDS Proxy deployed and configured
- [ ] DLQ configured for failed queue jobs
- [ ] CloudWatch alarms configured for error rate and throttles
- [ ] `serverless deploy` CI/CD integration tested

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Lambda, API Gateway, SQS, RDS Proxy designed
- [ ] Security requirements satisfied: IAM least privilege, API auth, RDS IAM
- [ ] Performance requirements satisfied: cache, provisioned concurrency, memory tuned
- [ ] Testing requirements satisfied: local invoke, HTTP endpoint, SQS, EventBridge tested
- [ ] Anti-pattern checks passed: no direct RDS, no /tmp files, no sync long ops
- [ ] Production readiness verified: CloudWatch alarms, DLQ, CI/CD deploy tested

---

# Related References

- Laravel Vapor (managed alternative)
- Laravel Cloud (next-gen managed)
- K8s Laravel (container orchestration alternative)
