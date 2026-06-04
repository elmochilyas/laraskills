# Monitoring Cost Comparison

## Metadata
- **ID**: KU-33-MONITORING-COMPARISON
- **Subdomain**: monitoring-observability-cost
- **Domain**: cost-resource-optimization
- **Topic**: Monitoring Cost Comparison
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: Medium

## Overview
At mid-scale (50 EC2, 10 RDS, 20 Lambda, 100GB logs/month), monitoring costs range from $800/month (CloudWatch) to $6,500/month (Datadog). Grafana Cloud offers a middle ground at $2,500/month, New Relic at $4,000/month. For Laravel-specific teams, a hybrid approach (CloudWatch infra + Scout APM) delivers 90% of value at ~$800/month. The cost gap between cheapest and most expensive widens with infrastructure growth.

## Core Concepts
- **CloudWatch**: ~$800/month (best for basic infra, log volume drives cost)
- **Grafana Cloud**: ~$2,500/month (good for K8s/container-heavy teams)
- **New Relic**: ~$4,000/month (predictable, per-GB billing)
- **Datadog**: ~$6,500/month (most expensive, richest ecosystem)
- **Scout APM + CW**: ~$800/month (best for Laravel-first teams)
- **Self-hosted Prometheus+Grafana**: ~$0 software + $200-500 infra (highest engineering cost)

## When To Use
- CloudWatch: AWS-only, cost-sensitive teams, basic infra + Scout APM combo
- Grafana Cloud: K8s/container-heavy, teams already using Prometheus, open-source familiarity
- New Relic: Development-centric teams, per-GB predictable billing preferred
- Datadog: Multi-cloud enterprise, rich integration needs, dedicated observability budget
- Scout APM: Laravel-optimized teams, flat predictable pricing, small to mid-scale

## When NOT To Use
- Datadog for single-cloud Laravel app: Overkill; CloudWatch + Scout covers 90%
- CloudWatch for multi-cloud: Limited to AWS; use Grafana or New Relic for hybrid
- Self-hosted for <20 hosts: Engineering time exceeds $800/month savings
- Scout APM alone: No infrastructure monitoring; always pair with CloudWatch or Grafana
- New Relic for high-log-volume apps: Per-GB pricing becomes expensive above 500GB/month

## Best Practices
- **Match monitoring tool to infrastructure maturity**: AWS-only small teams use CloudWatch; growing teams add Scout APM; enterprises use Datadog (WHY: each tool has a cost-optimal scale range; adopting enterprise tools too early wastes 60-70% of observability budget)
- **Keep monitoring cost under 10-15% of total infrastructure spend**: If monitoring costs exceed this ratio, optimize tool selection or sampling (WHY: monitoring is a supporting cost, not a primary service; 15% ratio ensures observability doesn't dominate the infrastructure bill)
- **Use hybrid approach for Laravel teams**: CloudWatch for free infrastructure metrics + Scout APM for Laravel-specific tracing (WHY: CloudWatch infra = $0 default metrics; Scout APM = $39-299/month flat; total $400-800/month vs $6K+ Datadog)
- **Implement sampling before scaling up**: Set 10% trace sampling and log filtering BEFORE traffic grows (WHY: retroactive cost optimization is harder than proactive; per-GB models punish volume)
- **Review and clean unused resources quarterly**: Dashboards, alerts, custom metrics, and synthetic tests accumulate (WHY: each unused dashboard costs $3.60, each unused alarm costs $0.10; 50 unused items = $180+/month waste)

## Architecture Guidelines
- Start with CloudWatch (free metrics) + basic log monitoring
- Add Scout APM at $39/month when APM visibility needed (500+ requests/day)
- Migrate to Grafana Cloud if Kubernetes/container-heavy deployment
- Consider New Relic only if multi-cloud or per-GB billing preferred
- Only adopt Datadog at enterprise scale with dedicated observability budget
- Self-hosted Prometheus+Grafana for teams with existing SRE capabilities

## Performance Considerations
- APM agents add 1-5% overhead per request regardless of vendor
- Log ingestion rate: 1GB/hour for typical mid-size app; cost grows linearly with log verbosity
- Trace sampling: head-based (decision at request start) is cheaper than tail-based (store all then sample)
- Custom metrics: cost per metric per hour; high cardinality is prohibitively expensive in all platforms

## Security Considerations
- All major platforms support SOC 2, HIPAA, and GDPR compliance at enterprise tiers
- OpenTelemetry provides vendor-neutral data collection; lock-in risk is lower
- Self-hosted Prometheus/Grafana gives full data control but requires security maintenance
- Log data may contain PII; ensure scrubbing before ingestion into any platform

## Common Mistakes
1. **Choosing Datadog for a single Laravel app at mid-scale**: 50-host Laravel deployment on Datadog = $6.5K/month vs CloudWatch + Scout = $800/month (Cause: "everyone uses Datadog" without evaluating alternatives; Consequence: 8x higher monitoring cost for equivalent capability; Better: start with CloudWatch + Scout APM)
2. **Not factoring engineering time for self-hosted**: Self-hosted Prometheus at $0 software cost but requiring 0.5 FTE SRE (Cause: comparing only software costs; Consequence: $50K+/year engineering time to save $500/month; Better: use managed option until >$1000/month achievable savings)
3. **Ignoring sampling at scale**: Full trace and log data on New Relic at 500GB/month = $150/month vs $1200 at 4000GB (Cause: "we want complete data"; Consequence: cost grows 8x with 8x volume; Better: sample traces at 10%, reduce log verbosity)
4. **Tool sprawl**: Using CloudWatch + Datadog + New Relic + Scout simultaneously in same org (Cause: different teams choosing different tools; Consequence: paying multiple tool minimums, losing correlation; Better: standardize on 1-2 maximum)

## Anti-Patterns
- **Enterprise tool for startup scale**: Datadog at 10 hosts ($180/month) could be $0 CloudWatch
- **No hybrid strategy**: Using only APM without infrastructure monitoring or vice versa
- **Tool proliferation**: Each team choosing their own monitoring platform
- **Set-and-forget monitoring cost**: Not reviewing monitoring spend quarterly

## Examples
- **Small (10 EC2, 2 RDS, 5 Lambda)**: CloudWatch = $50-100/month; Scout APM = $39/month; Total = $90-140/month
- **Mid-scale (50 EC2, 10 RDS, 20 Lambda, 100GB logs)**: CloudWatch+Scout = $800/month; Grafana = $2500; New Relic = $4000; Datadog = $6500
- **Enterprise (200 EC2, 50 RDS, 100 Lambda, 500GB logs)**: CloudWatch = $2900; Grafana = $8000; New Relic = $15000; Datadog = $18000-45000

## Related Topics
- CloudWatch Cost Analysis (ku-29)
- Datadog Enterprise Pricing (ku-30)
- New Relic Ingestion Pricing (ku-31)
- Scout APM for Laravel (ku-32)

## AI Agent Notes
- Default recommendation: CloudWatch + Scout APM for Laravel teams
- Monitoring cost target: <10-15% of total infrastructure spend
- Start with cheapest, scale tooling as infrastructure grows
- Always include sampling in initial configuration
- Review monitoring costs quarterly
