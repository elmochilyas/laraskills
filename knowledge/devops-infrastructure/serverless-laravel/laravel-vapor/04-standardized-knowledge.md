# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 06-serverless-laravel
**Knowledge Unit:** laravel-vapor
**Difficulty:** Intermediate
**Category:** Serverless
**Last Updated:** 2026-06-03

# Overview

Laravel Vapor is a serverless deployment platform for Laravel powered by AWS Lambda. It abstracts the complexity of running Laravel on Lambda by managing API Gateway, SQS queues, RDS databases, ElastiCache, CloudFront CDN, and IAM roles behind a single `vapor.yml` file and CLI command.

Vapor exists to make serverless Laravel accessible without Bref's complexity. The engineering value is auto-scaling, pay-per-use pricing, and zero server management — all configured through a single YAML file.

# When To Use

- Teams wanting serverless Laravel without managing Lambda
- Applications with variable traffic and long idle periods
- Cost optimization for low-traffic production apps
- Teams already in AWS ecosystem

# When NOT To Use

- Applications requiring WebSocket support (use Laravel Cloud)
- Latency-sensitive applications (cold start adds delay)
- Long-running processes exceeding Lambda 15-minute limit
- Budget-sensitive teams at scale (Lambda costs can exceed traditional servers)

# Core Concepts

- **vapor.yml** — Single configuration file for all AWS resources
- **HTTP Lambda** — Handles web requests through API Gateway
- **CLI Lambda** — Handles queue jobs and scheduled tasks
- **CloudFront CDN** — Static asset delivery
- **RDS Database** — Managed MySQL database
- **ElastiCache Redis** — Cache and session storage

# Best Practices

**Use Vapor CLI Locally.** Test deployments with `vapor deploy staging` before production.

**Configure Cache.** Enable config cache, route cache, and view cache to reduce cold start time.

**Monitor Costs.** Vapor costs can be unpredictable. Set budget alerts on AWS.

**Use Queues.** Offload long-running tasks to queues. Vapor queues run on Lambda.

# Common Mistakes

**No Configuration Cache.** Skipping config cache increases cold start time significantly.

**Vendor Lock-In Concern.** Vapor makes assumptions about your infrastructure. Migrating away requires re-architecting.

**Cost Surprises.** Low-traffic apps are cheap on Vapor, but traffic spikes can dramatically increase costs.

# Related Topics

**Prerequisites:** AWS basics, Laravel fundamentals
**Closely Related:** Laravel Cloud (next-gen), Bref Laravel (open-source alternative)
**Advanced Follow-Ups:** AWS Lambda optimization, Vapor CI/CD integration
