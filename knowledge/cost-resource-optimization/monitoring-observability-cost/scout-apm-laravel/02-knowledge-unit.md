# K32: Scout APM for Laravel

## Metadata
- **ID**: K32
- **Subdomain**: Monitoring & Observability Cost
- **Topic**: Scout APM for Laravel
- **Source**: Vendor Docs (2026)
- **Reliability**: High

## Executive Summary
Scout APM offers Laravel-specific application performance monitoring at $39-299/month flat pricing Ã¢â‚¬â€ dramatically cheaper than Datadog ($6K+/month) or New Relic ($3K+/month) for equivalent visibility. Scout provides Laravel-optimized tracing (N+1 detection, query analysis, Octane support) with predictable billing. For Laravel-first teams, Scout APM + CloudWatch for infrastructure covers 90%+ of observability needs at <10% of enterprise APM costs.

## Core Concepts
- **Pricing**: $39/month (10 requests/min), $99/month (100 requests/min), $299/month (unlimited)
- **Laravel-optimized**: N+1 query detection, Octane support, queue tracing, cache analysis
- **Flat pricing**: No per-host, per-GB, or per-metric charges
- **vs Datadog**: At mid-scale, Scout APM costs $299/month vs Datadog APM $6K+
- **Coverage**: APM + error tracking + deployment tracking

## Mental Models
- **Scout as specialist**: Like a specialized mechanic vs a full-service dealership (Datadog)
- **Predictable pricing**: Flat fee regardless of scale Ã¢â‚¬â€ costs don't grow with infrastructure

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

## Research Notes
Scout is the most cost-effective APM option for Laravel teams. The Octane support (added 2025) makes it viable for modern Laravel deployments. Limitations: no Kubernetes/host-level monitoring (need CloudWatch for that), no custom metrics, no log management. Recommendation: Scout APM ($299) + CloudWatch essentials ($200-500/month) = complete observability at $500-800/month vs $6K+ for Datadog.
