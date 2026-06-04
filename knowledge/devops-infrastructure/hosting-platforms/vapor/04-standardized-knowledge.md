# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** vapor
**Difficulty:** Intermediate
**Category:** Hosting Platforms
**Last Updated:** 2026-06-03

# Overview

Laravel Vapor is a serverless deployment platform powered by AWS Lambda, providing auto-scaling Laravel hosting with a `vapor.yml` configuration file. This KU covers Vapor as a platform — pricing, teams, environments, and integration with the Laravel ecosystem.

Vapor as a platform exists to make serverless Laravel accessible to teams without AWS expertise. The engineering value is auto-scaling Laravel hosting with zero server management.

# When To Use

- Teams wanting serverless auto-scaling
- Variable traffic patterns with idle periods
- AWS-native Laravel deployments
- Applications where operational overhead reduction justifies premium pricing

# When NOT To Use

- Consistent high-traffic applications (Lambda costs exceed fixed servers)
- WebSocket-dependent applications (Vapor doesn't support WebSockets)
- Budget-constrained teams (Vapor cost can be unpredictable)
- Applications needing custom PHP extensions or Nginx configuration

# Best Practices

**Use Vapor CLI for Deployments.** Run `vapor deploy` from CI/CD, not manually.

**Enable Configuration Cache.** Set `--config-cache` in vapor.yml for cold start optimization.

**Monitor Vapor Costs.** Set AWS budget alerts for Lambda and RDS costs.

**Use Queues.** Offload long-running tasks to Vapor queue (SQS-backed Lambda).

# Related Topics

**Prerequisites:** Laravel basics, AWS account (for some configurations)
**Closely Related:** Laravel Cloud (next-gen), Bref (open-source alternative), Forge
**Advanced Follow-Ups:** Lambda Optimization, Cost Analysis, Vapor CI/CD
