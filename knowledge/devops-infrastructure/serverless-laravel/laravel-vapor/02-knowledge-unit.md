# Laravel Vapor

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Serverless Laravel
- **Knowledge Unit:** Laravel Vapor
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Vapor is a serverless deployment platform for Laravel powered by AWS Lambda, abstracting API Gateway, SQS queues, RDS databases, ElastiCache, CloudFront CDN, and IAM roles behind a single `vapor.yml` file. It provides auto-scaling, pay-per-use pricing, and zero server management for Laravel applications.

---

## Core Concepts

- **vapor.yml** — Single YAML configuration file defining all AWS resources and deployment settings
- **HTTP Lambda** — Handles web requests through API Gateway and Lambda function URLs
- **CLI Lambda** — Handles queue jobs and scheduled tasks via separate Lambda runtime
- **CloudFront CDN** — Global static asset delivery with edge caching
- **RDS Database** — Managed MySQL database provisioned and managed by Vapor
- **ElastiCache Redis** — Cache and session storage managed by Vapor

---

## Mental Models

- **Serverless Dashboard** — Vapor is Bref with a dashboard. It automates the AWS infrastructure that Bref requires you to configure manually.
- **Pay-Per-Use** — You pay for what you use, not for idle capacity. Great for variable traffic; expensive for consistent high traffic.
- **Single File Configuration** — Everything about your infrastructure is in `vapor.yml`. No AWS console access needed for standard operations.

---

## Internal Mechanics

When `vapor deploy` is run, the Vapor CLI packages the application and uploads it to AWS Lambda. API Gateway routes HTTP requests to Lambda functions running the Bref PHP runtime. Queue jobs are processed by a separate CLI Lambda triggered by SQS messages. Static assets are uploaded to S3 and distributed via CloudFront. RDS and ElastiCache are provisioned based on `vapor.yml` configuration. IAM roles are automatically created and managed. The `vapor deploy` command uses the Vapor API to orchestrate the deployment across all AWS services.

---

## Patterns

- **Use Vapor CLI Locally** — Test deployments with `vapor deploy staging` before production to catch configuration issues
- **Enable Configuration Cache** — Set `--config-cache` in vapor.yml for reduced cold start time
- **Monitor Costs** — Vapor costs can be unpredictable; set budget alerts on AWS
- **Use Queues** — Offload long-running tasks to Vapor CLI Lambda (SQS-backed) to avoid API Gateway 30s timeout

---

## Architectural Decisions

- **Vapor vs. Forge** — Choose Vapor for auto-scaling serverless with zero server management; choose Forge for server-level access and predictable pricing
- **Vapor vs. Cloud** — Choose Vapor for Lambda-based serverless with variable traffic; choose Cloud for WebSocket support and K8s reliability
- **Vapor vs. Bref** — Choose Vapor when you want managed infrastructure without AWS configuration; choose Bref for full control over Lambda and infrastructure

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Auto-scaling with zero server management | Cold start latency on first request | Not suitable for latency-sensitive applications |
| Pay-per-use pricing (no idle cost) | Cost can spike with traffic | Set budget alerts and concurrency limits |
| Single YAML file infrastructure definition | No WebSocket support | Real-time features require Laravel Cloud |
| Managed AWS services included | Vendor lock-in to Vapor-specific infrastructure | Migration away requires re-architecting |

---

## Performance Considerations

Configuration cache significantly reduces cold start time. Route cache and view cache also improve performance. Cold start latency (500ms-2s) is the primary performance concern — Vapor automatically keeps some instances warm but not for all routes. Lambda 15-minute timeout limits long-running request processing. RDS Proxy manages database connection pooling for concurrent Lambda invocations. CloudFront CDN accelerates static asset delivery globally.

---

## Production Considerations

Set AWS budget alerts to monitor Vapor costs. Use `vapor deploy staging` before production for configuration validation. Configure queues for any processing that might exceed API Gateway 30s timeout. Monitor Lambda error rates and invocation counts. Vapor automatically manages scaling but you should understand the concurrency limits. Use Vapor's environment management for staging/production separation.

---

## Common Mistakes

- **No Configuration Cache** — Skipping config cache increases cold start time significantly. Enable `--config-cache` in vapor.yml.
- **Cost Surprises** — Low-traffic apps are cheap on Vapor, but traffic spikes can dramatically increase costs. Set budget alerts.
- **Vendor Lock-In** — Vapor makes assumptions about your infrastructure. Migrating away from Vapor requires re-architecting your deployment.
- **API Gateway Timeout** — Synchronous processing that exceeds 30s returns errors. Offload long-running tasks to queues.

---

## Failure Modes

- **Cold Start Timeout** — Lambda initialization exceeds API Gateway 29s timeout. Detection: 504 response on first request after idle. Mitigation: optimize config cache, use Vapor's warm instances feature.
- **Cost Spike** — Unexpected traffic causes Lambda invocation cost surge. Detection: AWS budget alert triggers. Mitigation: set Vapor concurrency limits, implement application-level rate limiting.
- **Database Connection Exhaustion** — Concurrent invocations exhaust RDS connections. Detection: database connection errors. Mitigation: use RDS Proxy, increase RDS max connections.
- **Vapor CLI Version Mismatch** — Local CLI version differs from API expectations. Detection: `vapor deploy` returns unexpected errors. Mitigation: keep Vapor CLI updated, use in CI/CD.

---

## Ecosystem Usage

Vapor is a first-party Laravel service maintained by Laravel LLC. It is the original serverless deployment platform for Laravel, built on top of Bref. Vapor integrates with the Laravel ecosystem through Forge-like authentication and billing. The `vapor-core` package provides Laravel-specific runtime support for Lambda environments. Vapor's architecture informed the development of Laravel Cloud (the next-generation platform). Many Laravel applications start on Vapor for its simplicity and migrate to other platforms as they grow.

---

## Related Knowledge Units

### Prerequisites
- AWS basics, Laravel fundamentals

### Related Topics
- Laravel Cloud (next-generation platform)
- Bref Laravel (open-source alternative)

### Advanced Follow-up Topics
- AWS Lambda Optimization
- Vapor CI/CD Integration

---

## Research Notes

Vapor provides the simplest path to serverless Laravel but with tradeoffs. Cold start and cost predictability are the main concerns. Use config cache, route cache, and view cache for performance. Set AWS budget alerts for cost management. Understand that Vapor's infrastructure abstractions create vendor lock-in — document the architecture for future migration. Vapor does not support WebSockets — use Cloud for real-time features.
