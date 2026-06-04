# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 06-serverless-laravel
**Knowledge Unit:** bref-laravel
**Difficulty:** Advanced
**Category:** Serverless
**Last Updated:** 2026-06-03

# Overview

Bref enables running Laravel on AWS Lambda in a serverless architecture. It provides a PHP runtime for Lambda, handles API Gateway integration, event-driven queue/cron processing, and cold start mitigation. Bref is the open-source foundation that Laravel Vapor was originally built on.

Bref exists because running Laravel on Lambda requires bridging the gap between PHP-FPM's persistent-process model and Lambda's stateless-invocation model. The engineering value is serverless auto-scaling with zero idle cost and no server management.

# When To Use

- AWS-native serverless architecture
- Event-driven applications with variable traffic
- Cost optimization for low-traffic applications (zero cost when idle)
- Teams wanting full control over Lambda configuration

# When NOT To Use

- Teams preferring managed platforms (Vapor, Cloud)
- Applications with strict cold start requirements (< 100ms response)
- Long-running request processing (> 15 minutes Lambda timeout)

# Core Concepts

- **Bref PHP Runtime** — Custom Lambda runtime that runs PHP-FPM
- **API Gateway Integration** — HTTP API or REST API for serving web requests
- **SQS Queue Processing** — Event-driven queue worker via Lambda
- **Scheduled Tasks** — EventBridge scheduled Lambda invocations
- **Cold Start** — Lambda initialization delay on first invocation
- **Provisioned Concurrency** — Pre-warmed Lambda instances to eliminate cold starts

# Best Practices

**Use Configuration Cache.** `php artisan config:cache` significantly reduces cold start time.

**Optimize Autoloader.** Use `--optimize-autoloader` with Composer for faster class loading.

**Minimize Package Count.** Each Composer package adds to cold start time. Audit and remove unused packages.

**Use RDS Proxy.** Lambda functions can exhaust database connections. RDS Proxy manages connection pooling.

**Enable Provisioned Concurrency.** For latency-sensitive routes, pre-warm Lambda instances.

# Common Mistakes

**No Configuration Cache.** Skipping config cache doubles or triples cold start time.

**Synchronous Database Connections.** Creating database connections on every invocation without connection reuse.

**Local File System Usage.** Lambda `/tmp` is ephemeral and limited to 512MB. Use S3 for file storage.

# Related Topics

**Prerequisites:** AWS Lambda, PHP-FPM
**Closely Related:** Laravel Vapor (managed Bref), Laravel Cloud (K8s alternative)
**Advanced Follow-Ups:** RDS Proxy, Lambda SnapStart, Provisioned Concurrency
