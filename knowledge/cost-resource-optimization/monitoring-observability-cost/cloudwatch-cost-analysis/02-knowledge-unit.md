# K29: CloudWatch Cost Analysis

## Metadata
- **ID**: K29
- **Subdomain**: Monitoring & Observability Cost
- **Topic**: CloudWatch Cost Analysis
- **Source**: Industry Research, Dev.to (2025), AWS Documentation
- **Reliability**: High

## Executive Summary
CloudWatch is the cheapest option for basic AWS infrastructure monitoring ($0 for default EC2/RDS metrics) but becomes expensive at log scale due to per-GB ingestion pricing ($0.50/GB ingested). A typical mid-scale Laravel deployment (50 EC2, 10 RDS, 20 Lambda, 100GB logs/month) costs ~$800/month on CloudWatch. The cost drivers are: log ingestion (40-60%), custom metrics (20-30%), and dashboard charges (10-15%).

## Core Concepts
- **Free metrics**: CPU, memory, disk, network for EC2/RDS (default, 5-minute granularity)
- **Detailed monitoring**: $0.014/vCPU-hour for 1-minute granularity
- **Log ingestion**: $0.50/GB ingested (first 5GB free)
- **Log storage**: $0.03/GB/month after ingestion
- **Custom metrics**: $0.30/metric/month
- **Dashboards**: $3.60/dashboard/month (first 3 free)

## Mental Models
- **CloudWatch as tax**: Cheap for defaults, expensive at scale Ã¢â‚¬â€ like a reasonable entry fee with steep usage charges
- **Logs as cost center**: Most CloudWatch spend comes from log ingestion, not infrastructure monitoring

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
- K30: Datadog Enterprise Pricing
- K31: New Relic Ingestion Pricing
- K33: Monitoring Cost Comparison

## Research Notes
CloudWatch cost optimization: (1) Use filter patterns to reduce log ingestion (only store ERROR and above); (2) Set log retention to 7-14 days for most logs; (3) Use Contributor Insights for high-cardinality analysis instead of custom metrics; (4) Consolidate dashboards; (5) Use Lambda Insights selectively. For Laravel-specific monitoring, CloudWatch + Scout APM ($39-299/month) covers 90% of needs at 20% of Datadog cost.
