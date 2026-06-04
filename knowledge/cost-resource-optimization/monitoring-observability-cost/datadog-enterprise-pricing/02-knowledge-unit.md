# K30: Datadog Enterprise Pricing

## Metadata
- **ID**: K30
- **Subdomain**: Monitoring & Observability Cost
- **Topic**: Datadog Enterprise Pricing
- **Source**: Industry Research (2026), Uptrace Comparison, DevToolsWatch
- **Reliability**: High

## Executive Summary
Datadog at enterprise scale (200 hosts, 100 services) runs $18-45K/month, often exceeding compute infrastructure costs. Pricing components: $18-23/host for infrastructure, $31-40/host for APM, $0.10/GB for logs, plus additional charges for custom metrics, synthetics, and RUM. The per-host pricing model penalizes large fleets of small hosts (common with containerized Laravel on Fargate). Datadog is the most expensive observability option but has the richest integration ecosystem.

## Core Concepts
- **Infra monitoring**: $18/host/month (Pro), $23/host/month (Enterprise)
- **APM**: $31-40/host/month (per APM host)
- **Logs**: $0.10/GB ingested + $0.025/GB/day retention
- **Custom metrics**: $0.05/metric/month beyond 100/host
- **Enterprise ($18-45K/month)**: 200 hosts, 100 services, 50GB logs/day
- **Key gotcha**: Containerized hosts (Fargate tasks) each count as a billable host

## Mental Models
- **Datadog as luxury car**: Best feature set, highest total cost, premium experience
- **Host-count tax**: Every tiny container counts as a host; Fargate tasks with 0.5 vCPU cost $18/month to monitor

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
- K31: New Relic Ingestion Pricing
- K33: Monitoring Cost Comparison
- K32: Scout APM Laravel

## Research Notes
Datadog's pricing complexity is a known pain point. Key cost traps: (1) Every ECS/Fargate task counts as a host; (2) Custom metrics beyond 100/host trigger additional charges; (3) Log retention beyond 15 days increases cost 5x; (4) RUM session replay is expensive per-session. For Laravel teams at mid-scale, Scout APM ($299/month flat) or CloudWatch+Grafana ($500-800/month) are 90% as effective at 5-10% of Datadog's cost.
