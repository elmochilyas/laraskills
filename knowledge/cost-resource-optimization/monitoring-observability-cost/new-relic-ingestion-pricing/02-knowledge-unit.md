# K31: New Relic Ingestion Pricing

## Metadata
- **ID**: K31
- **Subdomain**: Monitoring & Observability Cost
- **Topic**: New Relic Ingestion Pricing
- **Source**: Vendor Docs (2026), TechPlained
- **Reliability**: High

## Executive Summary
New Relic's per-GB pricing model ($0.30/GB ingested across all telemetry types) is more predictable than Datadog's per-host model. The free tier offers 100GB/month free (never expires). For mid-scale deployments, New Relic costs ~$2,500-4,000/month vs Datadog's $6,500+. The per-GB model rewards lean instrumentation and penalizes high-cardinality/copious-log environments.

## Core Concepts
- **Data Plus**: $0.30/GB ingested (all telemetry: metrics, logs, traces, events)
- **Free tier**: 100GB/month free (per account, not per host)
- **User pricing**: $49/user/month for full platform access
- **Predictability**: Costs scale linearly with data volume, not host count
- **vs Datadog**: At 200 hosts, New Relic is ~40-60% cheaper depending on log volume

## Mental Models
- **New Relic as metered water**: Pay per GB regardless of what generates it; low users pay less
- **Per-GB vs per-host**: New Relic rewards data minimization; Datadog rewards host minimization

## Ecosystem Usage

- **Laravel Telescope**: Free, self-hosted; great for development; store in Redis/DB; not suitable for production at scale\n- **Laravel Pulse**: Built-in health monitoring; stores aggregated metrics in database; zero additional cost\n- **Scout APM**: Laravel-specific APM with Laravel-aware instrumentation (Octane, Horizon, queue support)\n- **Laravel Cloud**: Includes CloudWatch-based monitoring; cost included in platform pricing

## Performance Considerations

- APM agents add 1-5% overhead per request; Xdebug profiling adds 50-200% (not for production)\n- Log ingestion rate: 1GB/hour for typical mid-size app; cost grows linearly with log verbosity\n- Trace sampling: head-based (on decision at request start) is cheaper than tail-based (store all then sample)\n- Custom metrics: cost per metric per hour; high cardinality (user_id as dimension) is prohibitively expensive

## Production Considerations

- Set log retention policies: 7 days for debug, 30 days for info, 90 days for error\n- Configure metric filters on logs: extract and aggregate key metrics from log streams\n- Use AWS Budgets and Cost Anomaly Detection to alert on monitoring cost spikes\n- For managed APMs, regularly review and clean unused dashboards, alerts, and custom metrics\n- Implement sampling for high-throughput endpoints: sample 1 in 1000 requests for detailed tracing

## Failure Modes

- Agent crash: APM agent crash takes down application; test agent under load before production rollout\n- Log ingestion backpressure: slow log processing causes agent to buffer and potentially OOM\n- Telemetry cost shock: sudden traffic increase dramatically increases ingestion costs; set hard limits in agent config\n- Data retention compliance failure: incorrect retention configuration leads to data loss during audit

## Architectural Decisions

- CloudWatch for AWS-only deployments where team has AWS expertise; lowest entry cost\n- Datadog for multi-cloud or enterprise with dedicated observability budget\n- New Relic for development-centric teams needing deep APM capabilities\n- Scout APM for Laravel-specific teams wanting simple, predictable pricing\n- OpenTelemetry: vendor-neutral; use with self-hosted backend (SigNoz, Grafana) to control costs at scale

## Tradeoffs

- **CloudWatch vs Datadog**: CloudWatch is cheaper for AWS-only but less feature-rich; Datadog excels in multi-cloud\n- **Per-host vs per-GB vs per-request**: Different pricing models suit different scale and monitoring patterns\n- **Managed APM vs OTel + self-hosted**: Managed is simpler but cost scales; self-hosted has lower variable cost but operational overhead\n- **Full telemetry vs sampling**: Full data gives accuracy; sampling reduces cost (10% sample = 90% cost reduction)

## Patterns

- CloudWatch: use for AWS-native infrastructure monitoring; aggregate logs into S3 for query cost reduction\n- Datadog: best for multi-cloud/hybrid environments; per-host pricing rewards consolidation\n- New Relic: ingestion-based pricing (per GB); optimize by reducing telemetry volume and using sampling\n- Scout APM: Laravel-native APM; fixed pricing per application based on request volume\n- Cost optimization: sample traces (1-10%), filter noisy logs, reduce metric cardinality

## Internal Mechanics

CloudWatch pricing includes metrics (per custom metric), logs (per GB ingested + archived), dashboards (/month per dashboard), and alarms (.10 per alarm). DataDog pricing is per-host (infrastructure) plus per-million events (APM, logs). New Relic uses per-GB ingested model with user-based pricing. Scout APM charges per-application based on monthly request volume.

## Common Mistakes

- Not setting log retention limits: logs accumulate indefinitely, driving up storage costs\n- Creating high-cardinality custom metrics: each unique dimension value is a separate metric\n- Enabling full tracing for all endpoints: trace every request without sampling; cost becomes prohibitive\n- Not using AWS Budget alerts for monitoring services: monitoring costs can surprise if telemetry volume increases\n- Keeping verbose debug logging enabled in production: debug logs are high-volume and rarely useful

## Related Knowledge Units
- K29: CloudWatch Cost Analysis
- K30: Datadog Enterprise Pricing
- K33: Monitoring Cost Comparison
- K32: Scout APM Laravel

## Research Notes
New Relic's free tier (100GB/month) is the most generous among major observability platforms. For small Laravel apps (<50GB/month telemetry), New Relic is effectively free. The $0.30/GB pricing is flat across all products Ã¢â‚¬â€ logs cost the same as traces. Key optimization: reduce log verbosity (WARN+ only), sample traces at 10% for high-traffic endpoints. New Relic's AI (NRQL) helps identify cost drivers by querying data volume per service.
