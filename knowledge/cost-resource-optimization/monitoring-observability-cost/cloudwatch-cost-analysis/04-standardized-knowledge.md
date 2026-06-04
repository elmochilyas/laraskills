# CloudWatch Cost Analysis

## Metadata
- **ID**: KU-29-CLOUDWATCH-COST
- **Subdomain**: monitoring-observability-cost
- **Domain**: cost-resource-optimization
- **Topic**: CloudWatch Cost Analysis
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
CloudWatch is the cheapest option for basic AWS infrastructure monitoring ($0 for default EC2/RDS metrics) but becomes expensive at log scale due to per-GB ingestion pricing ($0.50/GB ingested). A typical mid-scale Laravel deployment (50 EC2, 10 RDS, 20 Lambda, 100GB logs/month) costs ~$800/month on CloudWatch. The cost drivers are: log ingestion (40-60%), custom metrics (20-30%), and dashboard charges (10-15%).

## Core Concepts
- **Free metrics**: CPU, memory, disk, network for EC2/RDS (default, 5-minute granularity)
- **Detailed monitoring**: $0.014/vCPU-hour for 1-minute granularity
- **Log ingestion**: $0.50/GB ingested (first 5GB free)
- **Log storage**: $0.03/GB/month after ingestion
- **Custom metrics**: $0.30/metric/month
- **Dashboards**: $3.60/dashboard/month (first 3 free)
- **Alarms**: $0.10 per alarm metric per month

## When To Use
- AWS-only deployments where team has AWS expertise
- Default infrastructure monitoring (EC2, RDS, ELB, Lambda) with zero additional cost
- Teams needing basic dashboards and alarm-based alerting
- Cost-sensitive deployments where observability budget is constrained
- Combined with Scout APM for comprehensive Laravel monitoring at low cost

## When NOT To Use
- Multi-cloud environments requiring a single observability pane
- Teams needing advanced APM features (distributed tracing, code-level profiling)
- High-volume log environments (>500GB/month) where Grafana or self-hosted solutions are cheaper
- Applications requiring custom metric dimensions with high cardinality (user_id, session_id)
- Teams without AWS-specific monitoring expertise

## Best Practices
- **Set log retention policies**: 7 days for debug, 30 days for info, 90 days for error; transition to S3 Glacier for long-term archival (WHY: log storage costs scale with retention period; 90 days of all logs costs 3x more than 30 days; errors rarely needed beyond 90 days for compliance)
- **Use filter patterns to reduce log volume**: Use metric filters and log subscription filters to drop DEBUG/INFO logs in high-volume services (WHY: 80% of log volume is often DEBUG/INFO; dropping them reduces ingestion cost by 40-60% with no loss of actionable signals)
- **Consolidate dashboards**: Use multi-metric widgets instead of one dashboard per service (WHY: first 3 dashboards free, $3.60/month after; consolidating 10 dashboards into 3 saves $25/month)
- **Use Contributor Insights instead of custom metrics**: For high-cardinality analysis, Contributor Insights on logs is cheaper than creating per-value custom metrics (WHY: custom metrics cost $0.30/metric/month; with 1000 unique IPs, that's $300/month; Contributor Insights is included in log ingestion cost)
- **Enable Lambda Insights selectively**: Only on critical functions, not all functions (WHY: Lambda Insights generates custom metrics per function invocation; on 50 functions, this adds significant custom metric cost)

## Architecture Guidelines
- CloudWatch for AWS-native infrastructure monitoring; aggregate logs into S3 for query cost reduction
- Combine CloudWatch (infra metrics, free) + Scout APM ($39-299/month) for comprehensive Laravel visibility
- Use AWS Budgets and Cost Anomaly Detection to alert on monitoring cost spikes
- Set log retention via CloudWatch Logs subscription filters to S3 for long-term archival
- Tag resources by environment, team, and application for cost allocation in Cost Explorer

## Performance Considerations
- APM agents add 1-5% overhead per request; CloudWatch agent adds negligible overhead for basic metrics
- Log ingestion rate: 1GB/hour for typical mid-size app; cost grows linearly with log verbosity
- Trace sampling: head-based (decision at request start) is cheaper than tail-based (store all then sample)
- Custom metrics: cost per metric per hour; high cardinality (user_id as dimension) is prohibitively expensive

## Security Considerations
- CloudWatch Logs encryption at rest using KMS adds no additional CloudWatch cost
- IAM policies should restrict who can alter log retention and metric filter configurations
- Log groups contain sensitive data; ensure IAM least privilege for log access
- CloudWatch Logs Insights queries can export data; monitor query activity

## Common Mistakes
1. **Not setting log retention limits**: Logs accumulate indefinitely, driving up storage costs (Cause: default retention is "never expire"; Consequence: 6 months of verbose logs = 6x storage cost; Better: set retention to 30 days for most logs, 90 days for errors)
2. **Creating high-cardinality custom metrics**: Each unique dimension value is a separate metric (Cause: adding user_id as custom metric dimension; Consequence: $0.30 per unique user_id per month; 10K users = $3K/month; Better: use Contributor Insights on logs instead)
3. **Enabling full tracing for all endpoints**: Trace every request without sampling (Cause: wanting "complete data" without understanding cost; Consequence: cost becomes prohibitive at scale; Better: sample 1 in 100 requests, target 10% trace rate)
4. **Not using AWS Budget alerts for monitoring services**: Monitoring costs can surprise if telemetry volume increases (Cause: focusing budget alerts on compute/database; Consequence: log injection attack or traffic spike causes $5K+ unexpected CloudWatch bill; Better: set budget alerts for CloudWatch specifically)

## Anti-Patterns
- **Verbose debug logging in production**: DEBUG-level logs from frameworks at production scale cost $500+/month
- **Keeping all logs forever**: "We might need them" leads to indefinite storage accumulation
- **One metric per state**: Creating separate custom metrics for each application state instead of using dimensions
- **Manual dashboard proliferation**: Each team creating their own dashboards without consolidation

## Examples
- **Small Laravel app (5 EC2, 1 RDS, 10 Lambda)**: $0 (free metrics) + $50-100 (logs at 100GB) = $50-100/month
- **Mid-scale (50 EC2, 10 RDS, 20 Lambda, 100GB logs)**: $0 (free) + $500 (logs) + $100 (metrics/alarms) + $50 (dashboards) = ~$650-800/month
- **Large scale (200 EC2, 30 RDS, 100 Lambda, 500GB logs)**: $0 (free) + $2500 (logs) + $300 (metrics) + $100 (dashboards) = ~$2900/month; evaluate Grafana/self-hosted alternatives

## Related Topics
- Datadog Enterprise Pricing (ku-30)
- New Relic Ingestion Pricing (ku-31)
- Monitoring Cost Comparison (ku-33)
- Scout APM for Laravel (ku-32)

## AI Agent Notes
- Default: CloudWatch + Scout APM combo for Laravel teams
- Set log retention to 30 days by default
- Avoid high-cardinality custom metrics
- Use Contributor Insights instead of per-value custom metrics
- Budget alerts for CloudWatch specifically
