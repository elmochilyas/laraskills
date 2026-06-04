# K33: Monitoring Cost Comparison

## Metadata
- **ID**: K33
- **Subdomain**: Monitoring & Observability Cost
- **Topic**: Monitoring Cost Comparison
- **Source**: Industry Research (2026), Uptrace, DevToolsWatch
- **Reliability**: Medium

## Executive Summary
At mid-scale (50 EC2, 10 RDS, 20 Lambda, 100GB logs/month), monitoring costs range from $800/month (CloudWatch) to $6,500/month (Datadog). Grafana Cloud offers a middle ground at $2,500/month, New Relic at $4,000/month. For Laravel-specific teams, a hybrid approach (CloudWatch infra + Scout APM) delivers 90% of value at ~$800/month. The cost gap between cheapest and most expensive widens with infrastructure growth.

## Core Concepts
- **CloudWatch**: ~$800/month (best for basic infra, log volume drives cost)
- **Grafana Cloud**: ~$2,500/month (good for K8s/container-heavy teams)
- **New Relic**: ~$4,000/month (predictable, per-GB billing)
- **Datadog**: ~$6,500/month (most expensive, richest ecosystem)
- **Scout APM + CW**: ~$800/month (best for Laravel-first teams)
- **Self-hosted Prometheus+Grafana**: ~$0 software + $200-500 infra (highest engineering cost)

## Mental Models
- **Monitoring cost paradox**: The tool that monitors your costs can cost more than the infrastructure it monitors
- **Luxury vs economy**: All options provide observability; the extra 30% capability costs 300% more

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
- K31: New Relic Ingestion Pricing
- K32: Scout APM Laravel

## Research Notes
Cost comparison data from multiple 2026 sources (Uptrace, DevToolsWatch, CloudChipr) consistently ranks Datadog as most expensive, CloudWatch as cheapest. The sweet spot for Laravel teams is CloudWatch (free/default metrics) + Scout APM ($299/month). The hybrid approach avoids the complexity of self-hosted Prometheus and the cost of enterprise SaaS. Key insight: monitoring cost should not exceed 10-15% of total infrastructure cost.
