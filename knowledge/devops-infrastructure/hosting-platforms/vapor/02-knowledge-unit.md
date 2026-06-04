# Vapor

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Hosting Platforms
- **Knowledge Unit:** Vapor
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Vapor is a serverless deployment platform powered by AWS Lambda, providing auto-scaling Laravel hosting with a `vapor.yml` configuration file. It makes serverless Laravel accessible to teams without AWS expertise, offering pay-per-use pricing and zero server management.

---

## Core Concepts

- **Serverless Architecture** — AWS Lambda-based compute with auto-scaling
- **vapor.yml** — Single configuration file defining infrastructure and deployment settings
- **Managed AWS Services** — RDS, ElastiCache, CloudFront, SQS managed by Vapor
- **Pay-Per-Use Pricing** — No idle costs; pay only for actual usage
- **Vapor CLI** — Command-line tool for deployment and management

---

## Best Practices

- **Use Vapor CLI for Deployments** — Run `vapor deploy` from CI/CD, not manually
- **Enable Configuration Cache** — Set `--config-cache` in vapor.yml for cold start optimization
- **Monitor Vapor Costs** — Set AWS budget alerts for Lambda and RDS costs
- **Use Queues** — Offload long-running tasks to Vapor queue (SQS-backed Lambda)

---

## Architectural Decisions

- **Vapor vs. Forge** — Choose Vapor for auto-scaling serverless with no server management; choose Forge for server-level access and predictable pricing
- **Vapor vs. Cloud** — Choose Vapor for Lambda-based serverless; choose Cloud for WebSocket support and K8s reliability
- **Vapor vs. Bref** — Choose Vapor for managed experience with dashboard; choose Bref for full control over Lambda configuration

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Auto-scaling with zero server management | Cold start latency | Not suitable for sub-100ms response requirements |
| Pay-per-use (no idle cost) | Cost spikes with traffic | Set budget alerts to manage cost unpredictability |
| Single YAML file deployment | No WebSocket support | Real-time features require alternative platforms |
| Managed AWS services | Vendor lock-in | Migration away from Vapor requires re-architecting |

---

## Production Considerations

Use Vapor CLI from CI/CD for automated deployments. Enable configuration cache for cold start optimization. Set AWS budget alerts. Use queues for long-running tasks. Monitor Lambda error rates and invocation counts. Test deployments with `vapor deploy staging` before production.

---

## Common Mistakes

- **No Configuration Cache** — Skipping config cache increases cold start time. Enable `--config-cache` in vapor.yml.
- **Cost Surprises** — Low-traffic apps are cheap but traffic spikes dramatically increase costs. Set budget alerts.
- **Vendor Lock-In** — Vapor-specific infrastructure abstractions make migration difficult. Document architecture for future migration.
- **API Gateway Timeout** — Synchronous processing exceeding 30s returns errors. Use queues for long-running tasks.

---

## Related Knowledge Units

### Prerequisites
- Laravel basics, AWS account (for some configurations)

### Related Topics
- Laravel Cloud (next-generation platform)
- Bref (open-source alternative)
- Forge

### Advanced Follow-up Topics
- Lambda Optimization
- Cost Analysis
- Vapor CI/CD

---

## Research Notes

Vapor provides the simplest path to serverless Laravel. Use config cache for cold start improvement. Set budget alerts for cost management. Offload long-running tasks to queues. Vapor does not support WebSockets — use Cloud for real-time features. Understand that Vapor's abstractions create vendor lock-in.
