# Bref Laravel

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Serverless Laravel
- **Knowledge Unit:** Bref Laravel
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Bref enables running Laravel on AWS Lambda in a serverless architecture, providing a PHP runtime for Lambda with API Gateway integration, event-driven queue/cron processing, and cold start mitigation. It is the open-source foundation that Laravel Vapor was originally built on, offering full control over Lambda configuration.

---

## Core Concepts

- **Bref PHP Runtime** — Custom Lambda runtime that runs PHP-FPM as a Lambda invocation handler
- **API Gateway Integration** — HTTP API or REST API for serving web requests via Lambda function URLs
- **SQS Queue Processing** — Event-driven queue worker invocation via Lambda triggers
- **Scheduled Tasks** — EventBridge scheduled Lambda invocations for the Laravel scheduler
- **Cold Start** — Lambda initialization delay on first invocation after idle period
- **Provisioned Concurrency** — Pre-warmed Lambda instances to eliminate cold starts for latency-sensitive routes

---

## Mental Models

- **Stateless Invocations** — Each Lambda invocation is a fresh or recycled PHP-FPM process. No persistent state between invocations. Database connections, cache, and sessions must use external services.
- **Cold Start Tax** — The first request to a cold Lambda pays a 500ms-2s initialization penalty. Every optimization (config cache, autoloader optimization, minimal packages) reduces this tax.
- **Bref Is the Engine, Vapor Is the Dashboard** — Bref is the open-source engine for Laravel on Lambda. Vapor is the managed platform built on Bref. Bref gives you full control; Vapor gives you a dashboard.

---

## Internal Mechanics

When an HTTP request arrives at API Gateway, it triggers a Lambda function running the Bref PHP runtime. The runtime starts PHP-FPM (if not already running from a previous warm invocation), boots the Laravel application, handles the request, and returns the response. PHP-FPM persists across subsequent invocations within the same execution environment (Lambda reuse), but the environment is frozen between invocations. Queue jobs are triggered by SQS messages that invoke the CLI Lambda runtime, which executes `php artisan queue:work` for each message.

---

## Patterns

- **Configuration Cache** — `php artisan config:cache` significantly reduces cold start time by eliminating config file parsing
- **Autoloader Optimization** — Use `--optimize-autoloader` with Composer for faster class loading
- **Minimize Package Count** — Each Composer package adds to cold start time; audit and remove unused packages
- **RDS Proxy** — Lambda functions can exhaust database connections without pooling; RDS Proxy manages connection pooling for Lambda
- **Provisioned Concurrency** — For latency-sensitive routes, pre-warm Lambda instances to eliminate cold starts

---

## Architectural Decisions

- **Bref vs. Vapor** — Choose Bref when you need full control over Lambda configuration, want to avoid Vapor pricing, or need custom infrastructure; choose Vapor for managed experience with dashboard
- **Bref vs. Laravel Cloud** — Choose Bref for AWS Lambda-native serverless; choose Cloud for K8s-based managed platform
- **API Gateway vs. Function URL** — Use API Gateway for advanced features (custom domains, WAF, throttling); use Function URLs for simpler setups with direct Lambda invocation

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Auto-scaling with zero idle cost | Cold start latency (500ms-2s) | Not suitable for sub-100ms response requirements |
| No server management | Lambda 15-minute execution timeout | Long-running processes require different architecture |
| Pay-per-use pricing | Cost unpredictable under traffic spikes | Set budget alerts and concurrency limits |
| Full control over Lambda configuration | Significant Bref-specific knowledge required | Team must understand Lambda, API Gateway, SQS, EventBridge |

---

## Performance Considerations

Cold start time is the primary performance concern. Configuration cache, autoloader optimization, and minimal package count each contribute to reducing cold start. Provisioned Concurrency eliminates cold starts for critical routes but adds cost. Lambda execution environment reuse improves warm invocation performance. Database connection pooling (RDS Proxy) prevents connection exhaustion under concurrent invocations. PHP-FPM process reuse within the same execution environment reduces per-invocation overhead.

---

## Production Considerations

Set Lambda concurrency limits to prevent runaway costs. Use RDS Proxy to manage database connections. Configure CloudWatch alarms for error rates and invocation duration. Log in structured format for CloudWatch Logs insights. Use reserved concurrency for critical functions to ensure they are never throttled. Set function timeouts appropriately (max 15 minutes). Use VPC configuration for database and Redis access.

---

## Common Mistakes

- **No Configuration Cache** — Skipping config cache doubles or triples cold start time. Always run `config:cache` in deployment.
- **Synchronous Database Connections** — Creating database connections on every invocation without connection reuse. Use RDS Proxy for connection pooling.
- **Local File System Usage** — Lambda `/tmp` is ephemeral and limited to 512MB. Use S3 for file storage.
- **No Concurrency Limits** — Unthrottled Lambda concurrency during traffic spike causes unexpected AWS costs.

---

## Failure Modes

- **Cold Start Timeout** — Initialization takes longer than API Gateway timeout (29s). Detection: client receives 504 response on first request. Mitigation: optimize cold start time, use Provisioned Concurrency.
- **Database Connection Exhaustion** — Concurrent Lambda invocations exhaust database connection pool. Detection: database connection errors. Mitigation: use RDS Proxy, reduce Lambda concurrency, increase database max connections.
- **Throttled Invocations** - Lambda concurrency limit reached. Detection: 429 throttling errors. Mitigation: request concurrency limit increase, implement queuing for non-critical requests.
- **VPC Configuration Error** — Lambda cannot connect to RDS or Redis in VPC. Detection: database connection timeout. Mitigation: verify VPC configuration, NAT Gateway, and security group rules.

---

## Ecosystem Usage

Bref is the open-source foundation for Laravel on AWS Lambda. It is maintained as a community project with official Laravel endorsement. Bref supports HTTP applications, queue workers, scheduled tasks, and Artisan commands as Lambda functions. The `bref/extra-php-extensions` package provides additional PHP extensions for Lambda. Bref integrates with serverless.com framework for Infrastructure as Code. Laravel Vapor was originally built on Bref.

---

## Related Knowledge Units

### Prerequisites
- AWS Lambda, PHP-FPM

### Related Topics
- Laravel Vapor (managed Bref)
- Laravel Cloud (K8s alternative to Lambda)

### Advanced Follow-up Topics
- RDS Proxy
- Lambda SnapStart
- Provisioned Concurrency

---

## Research Notes

Bref enables full control over Lambda configuration but requires significant AWS knowledge. Configuration cache and autoloader optimization are critical for cold start performance. Use RDS Proxy for connection pooling. Set concurrency limits to control costs. Provisioned Concurrency eliminates cold starts for critical routes. Lambda `/tmp` is ephemeral — use S3 for file storage.
