# New Relic Ingestion Pricing

## Metadata
- **ID**: KU-31-NEWRELIC-PRICING
- **Subdomain**: monitoring-observability-cost
- **Domain**: cost-resource-optimization
- **Topic**: New Relic Ingestion Pricing
- **Version**: 1.0
- **Classification**: Emerging
- **Maturity**: High

## Overview
New Relic's per-GB pricing model ($0.30/GB ingested across all telemetry types) is more predictable than Datadog's per-host model. The free tier offers 100GB/month free (never expires). For mid-scale deployments, New Relic costs ~$2,500-4,000/month vs Datadog's $6,500+. The per-GB model rewards lean instrumentation and penalizes high-cardinality/copious-log environments.

## Core Concepts
- **Data Plus**: $0.30/GB ingested (all telemetry: metrics, logs, traces, events)
- **Free tier**: 100GB/month free (per account, not per host)
- **User pricing**: $49/user/month for full platform access
- **Predictability**: Costs scale linearly with data volume, not host count
- **vs Datadog**: At 200 hosts, New Relic is ~40-60% cheaper depending on log volume

## When To Use
- Teams preferring predictable per-GB billing over per-host model
- Development-centric teams needing deep APM with code-level insights
- Mid-scale deployments (50-200 hosts) where 100GB free tier covers baseline
- Multi-cloud or hybrid environments needing a single observability platform
- Teams wanting generous free tier (100GB/month, never expires)

## When NOT To Use
- High-log-volume apps (>500GB/month): Per-GB cost makes self-hosted cheaper
- AWS-only small teams: CloudWatch + Scout APM is more cost-effective
- Teams without data minimization discipline: Log volume spikes cause cost shocks
- Organizations needing complex per-team billing: User-based pricing per seat adds up
- Container-heavy Fargate/ECS: Per-host billing (Datadog) may be cheaper at large scale

## Best Practices
- **Set log verbosity to WARN+ in production**: Reduce DEBUG/INFO log volume by 60-80% (WHY: New Relic charges $0.30/GB for all telemetry; debug logs are the largest cost driver; most production debug logs are never queried)
- **Use trace sampling at 10% for high-traffic endpoints**: Sample only 1 in 10 requests for detailed tracing (WHY: full traces on every request generates 10x the data volume; 10% sampling captures 95% of issues at 10% of cost)
- **Drop health check and heartbeat traffic**: Filter out ELB health checks, cron job heartbeats, and synthetic monitoring traffic from ingestion (WHY: health checks can generate 20-30% of total request volume; they provide zero debugging value)
- **Monitor per-service data volume**: Use NRQL queries to track GB ingestion per service (WHY: identifies which services are cost drivers; `SELECT sum(`usage.*`) FROM `TelemetrySummary` SINCE 1 week AGO FACET `service``)
- **Set ingest budget alerts**: Configure New Relic alerts for daily ingestion approaching budget threshold (WHY: prevents end-of-month billing surprises; alert at 80% of monthly data budget)

## Architecture Guidelines
- New Relic for teams wanting consistent per-GB pricing across all telemetry types
- Combine with CloudWatch for AWS infrastructure metrics (free) to minimize New Relic infra data
- Use OpenTelemetry SDK for vendor-neutral instrumentation; send to New Relic as backend
- Implement log forwarding only for ERROR and above from Laravel; INFO/DEBUG stays in local files
- For high-scale environments, route verbose logs to cheaper storage (S3) and only errors to New Relic

## Performance Considerations
- New Relic agent adds 1-3% overhead per request; similar to Datadog agent
- Log ingestion rate: agent handles 10MB/s sustained before backpressure
- Trace sampling at 10% reduces APM overhead proportionally
- Custom attributes on spans increase ingest volume; limit to 10-15 attributes per span

## Security Considerations
- New Relic supports SOC 2, HIPAA, and FedRAMP compliance
- Data encryption in transit (TLS) and at rest (KMS)
- API keys used for agent communication; rotate regularly
- Drop sensitive data (PII, passwords) via agent configuration before ingestion
- New Relic's FedRAMP Moderate authorization for government workloads

## Common Mistakes
1. **Not using the 100GB free tier effectively**: Small apps sending 20GB/month still get free tier (Cause: not realizing free tier exists; Consequence: paying $6/month for what's free; Better: New Relic free tier covers small deployments entirely)
2. **Ingesting full telemetry from all environments**: Development, staging, CI/CD all sending full data (Cause: wanting parity across environments; Consequence: 3x data volume for non-production traffic; Better: sample non-production at 1% or exclude entirely)
3. **High-cardinality custom attributes**: Adding user_id, order_id, or request_id as span attributes (Cause: wanting granular breakdowns; Consequence: each unique attribute value creates a new metric time series; Better: limit attributes to low-cardinality values like service, region, environment)
4. **No data minimization strategy**: Letting engineers add telemetry without cost review (Cause: no telemetry governance process; Consequence: data volume creeps up 10-20% month-over-month; Better: designate telemetry cost owner, review per-service volume monthly)

## Anti-Patterns
- **Sending infrastructure metrics to New Relic**: CloudWatch provides free EC2/RDS metrics
- **Full tracing on all endpoints**: 100% trace sampling generates 10x cost vs 10% sampling
- **Logging everything to New Relic**: Route verbose logs to S3, only errors to New Relic
- **No ingest budget**: No alerting on data volume approaching budget limits

## Examples
- **Small app (5 EC2, 2 RDS, 20GB/month)**: Free tier covers 100%; $0/month
- **Mid-scale (50 EC2, 30GB/month logs, 10GB traces)**: 150GB total - 100GB free = 50GB x $0.30 = $15/month + user fees = ~$200-400/month
- **Large scale (200 EC2, 200GB logs/month, 100GB traces)**: 400GB total - 100GB = 300GB x $0.30 = $90/month + user fees = ~$500-1000/month vs Datadog $6K+

## Related Topics
- CloudWatch Cost Analysis (ku-29)
- Datadog Enterprise Pricing (ku-30)
- Monitoring Cost Comparison (ku-33)
- Scout APM for Laravel (ku-32)

## AI Agent Notes
- Default: use 100GB free tier effectively before scaling
- Set log verbosity to WARN+ in production
- Sample traces at 10% for high-traffic endpoints
- Monitor per-service data volume quarterly
- Use NRQL to track GB ingestion per service
