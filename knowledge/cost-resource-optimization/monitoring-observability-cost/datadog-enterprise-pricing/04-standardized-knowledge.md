# Datadog Enterprise Pricing

## Metadata
- **ID**: KU-30-DATADOG-PRICING
- **Subdomain**: monitoring-observability-cost
- **Domain**: cost-resource-optimization
- **Topic**: Datadog Enterprise Pricing
- **Version**: 1.0
- **Classification**: Emerging
- **Maturity**: High

## Overview
Datadog at enterprise scale (200 hosts, 100 services) runs $18-45K/month, often exceeding compute infrastructure costs. Pricing components: $18-23/host for infrastructure, $31-40/host for APM, $0.10/GB for logs, plus additional charges for custom metrics, synthetics, and RUM. The per-host pricing model penalizes large fleets of small hosts (common with containerized Laravel on Fargate). Datadog is the most expensive observability option but has the richest integration ecosystem.

## Core Concepts
- **Infra monitoring**: $18/host/month (Pro), $23/host/month (Enterprise)
- **APM**: $31-40/host/month (per APM host)
- **Logs**: $0.10/GB ingested + $0.025/GB/day retention
- **Custom metrics**: $0.05/metric/month beyond 100/host
- **Enterprise ($18-45K/month)**: 200 hosts, 100 services, 50GB logs/day
- **Key gotcha**: Containerized hosts (Fargate tasks) each count as a billable host

## When To Use
- Multi-cloud or hybrid environments requiring a unified observability platform
- Enterprise teams with dedicated observability budget ($20K+/month)
- Organizations needing rich integration ecosystem (500+ integrations)
- Teams requiring advanced APM, distributed tracing, and RUM capabilities
- Compliance-heavy environments needing long data retention and auditing

## When NOT To Use
- Small to mid-scale Laravel deployments (<50 hosts)
- Cost-sensitive teams where monitoring budget is <10% of infrastructure spend
- AWS-only deployments where CloudWatch + Scout APM covers 90% of needs
- Teams without dedicated SRE/observability engineering resources
- Container-heavy environments (Fargate/ECS) where every task counts as a host

## Best Practices
- **Consolidate hosts to minimize per-host costs**: Merge small workloads onto fewer hosts (WHY: Datadog charges per host, not per vCPU; 10 Fargate tasks on 2 EC2 hosts cost $360 vs $1800 for 10 individual hosts)
- **Use tag-based exclusion filters**: Drop verbose logs from non-critical services before ingestion (WHY: log cost is $0.10/GB; dropping 60% of log volume from staging/development saves proportional cost)
- **Set custom metric limits per host**: Configure Datadog agent to limit custom metrics to 100/host default (WHY: custom metrics beyond 100/host cost $0.05/metric/month; high-cardinality metrics can add thousands to monthly bill)
- **Leverage Datadog standard metrics first**: Before creating custom metrics, check if standard integration metrics meet needs (WHY: standard metrics are included in the per-host price; custom metrics are additional)
- **Use synthetics sparingly**: Target 10-20 critical API endpoints, not every page (WHY: synthetic tests cost $5/test/month per location; 50 tests from 3 locations = $750/month)

## Architecture Guidelines
- Datadog for multi-cloud/hybrid environments where a single pane of glass is required
- Prefer Scout APM over Datadog APM for Laravel-specific application monitoring
- Use Datadog infrastructure monitoring only (skip APM) to reduce per-host costs
- Implement log forwarding from CloudWatch to Datadog only for cross-service correlation
- For containerized Laravel on ECS/Fargate, evaluate if per-task billing justifies Datadog

## Performance Considerations
- Datadog agent adds 1-3% CPU overhead per host; negligible for most workloads
- Log ingestion rate: agent can handle 50MB/s per host before backpressure
- Custom metric submission: 1-2ms per metric; batch submissions reduce overhead
- Trace sampling: default 10 head-based samples/second per agent; adjust based on traffic

## Security Considerations
- Datadog agent communicates over TLS; API keys stored in agent config
- Restrict API key permissions to observability team only
- Sensitive data in logs can be scrubbed via Datadog Agent log processing rules
- SOC 2 and HIPAA compliance available in Enterprise tier
- RUM data contains user interaction data; ensure GDPR/privacy compliance

## Common Mistakes
1. **Every ECS/Fargate task as a host**: 50 Fargate tasks each counting as a $18/host = $900/month (Cause: Datadog bills per container as per-host; Consequence: $900/month for small compute footprint; Better: consolidate containers onto fewer EC2 instances or use alternative monitoring)
2. **Unlimited custom metrics**: Adding user_id, session_id, or request_id as custom metric dimensions (Cause: wanting granular breakdowns; Consequence: $0.05 per custom metric per month; with 10K users = $500/month extra; Better: use log-based analytics instead)
3. **Long log retention by default**: Keeping 30+ days of all logs at $0.025/GB/day (Cause: default retention may be 30 days; Consequence: retention cost doubles for every 15 days past first 15; Better: set 7-day retention for debug, 15 for info, 30 for error)
4. **Full APM on all services**: Enabling APM on development, staging, and non-critical services (Cause: wanting complete visibility; Consequence: $31/host for 50 hosts = $1550/month extra; Better: APM only on production critical services)

## Anti-Patterns
- **Buying Datadog for a single-service Laravel app**: Enterprise tool for a mid-scale workload
- **Ignoring host count optimization**: Letting containers proliferate without consolidation
- **No sampling strategy**: Tracing every request on every host at all times
- **Relying solely on Datadog without infra alerts**: Datadog agent failure means complete visibility loss

## Examples
- **Mid-scale Laravel (50 EC2, 10 RDS, 20 Lambda)**: 50 infra hosts ($900) + 50 APM hosts ($1550) + 100GB logs ($300) = $2,750/month (Scout APM + CloudWatch alternative: ~$800/month)
- **Enterprise (200 hosts, 100 services, 50GB logs/day)**: 200 infra ($3600) + 200 APM ($6200) + 1500GB logs ($4500) + misc ($1000) = $15,300-45,000/month
- **Container-heavy (100 Fargate tasks, 10 services)**: 100 hosts ($1800) + APM on critical ($620) + 50GB logs ($150) = $2,570/month; evaluate Grafana Cloud or New Relic

## Related Topics
- CloudWatch Cost Analysis (ku-29)
- New Relic Ingestion Pricing (ku-31)
- Monitoring Cost Comparison (ku-33)
- Scout APM for Laravel (ku-32)

## AI Agent Notes
- Default: Scout APM over Datadog for Laravel teams
- Every Fargate/ECS task counts as a billable host
- Recommend host consolidation before deploying Datadog
- Set log exclusion filters immediately
- Limit custom metrics to 100/host
