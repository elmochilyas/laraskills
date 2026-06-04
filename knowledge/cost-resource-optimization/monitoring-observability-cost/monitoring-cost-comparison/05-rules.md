# Monitoring Cost Comparison — Rules

## R1: Match Monitoring Tool to Infrastructure Maturity

**Category**: Tool Selection

**Rule**: ALWAYS choose a monitoring tool that matches current infrastructure scale — not the scale you hope to reach. AVOID adopting enterprise tools (Datadog, New Relic Enterprise) before the team and infrastructure justify the cost.

**Reason**: Each monitoring tool has a cost-optimal scale range. CloudWatch + Scout APM is optimal for <50 hosts ($400-800/month). Grafana Cloud suits 50-200 hosts ($2,500/month). New Relic fits 100-500 hosts ($4,000/month). Datadog serves 200+ hosts ($6,500+/month). Adopting Datadog at 10 hosts costs $180/month when CloudWatch is $0 — the enterprise features provide zero value at that scale but cost significantly more.

**Bad Example**: A startup with 10 EC2 instances deploys Datadog because "everyone uses it." Monthly: 10 hosts x $18 (infra) + 10 x $31 (APM) = $490/month. CloudWatch would cost $0 for the same infrastructure visibility. The startup burns $5,880/year on unnecessary monitoring.

**Good Example**: The same startup uses CloudWatch (free EC2 metrics) + Scout APM ($99/month). Total: $99/month. When they grow to 200 hosts, they evaluate Grafana Cloud ($2,500/month) or New Relic ($4,000/month). At 500 hosts, they consider Datadog Enterprise ($6,500+/month). Monitoring cost always stays proportional to infrastructure value.

**Exceptions**: Multi-cloud environments need a unified platform regardless of scale. Compliance requirements (FedRAMP, HIPAA) may mandate specific enterprise tools.

**Consequences Of Violation**: Paying 60-70% of the observability budget on features that are never used at the current scale. The monitoring cost-to-infrastructure ratio exceeds 15%, starving other investment.

---

## R2: Keep Monitoring Cost Under 15% of Total Infrastructure Spend

**Category**: Budget Ratio

**Rule**: ALWAYS keep total monitoring and observability costs below 15% of total infrastructure spend. If monitoring exceeds this ratio, optimize tool selection, reduce data volume, or improve sampling.

**Reason**: Monitoring is a supporting cost — it enables reliability but does not directly generate revenue. When monitoring exceeds 15% of infrastructure spend, it indicates either over-instrumentation (too much data) or over-procurement (wrong tool for the scale). A healthy ratio is 5-10% for most organizations. At 15%, the monitoring line item is large enough to fund significant infrastructure improvements.

**Bad Example**: A team spends $8,000/month on Datadog for a $30,000/month AWS bill. Monitoring ratio: 26.7%. The Datadog cost is nearly as large as the compute it monitors. A tool that should enable cost optimization has itself become a major cost.

**Good Example**: The same team switches to CloudWatch + Scout APM at $800/month. Monitoring ratio: 2.7%. They saved $7,200/month, which funds 2 additional m7g.2xlarge instances for capacity or an additional developer. Monitoring still provides full visibility.

**Exceptions**: Highly regulated industries (finance, healthcare) may need multiple monitoring tools for separate compliance domains, pushing the ratio higher. Document and cap the exceptions.

**Consequences Of Violation**: The monitoring bill becomes a significant line item, reducing the budget available for actual infrastructure. The ironies of paying more to monitor than to run the infrastructure are both financial and operational.

---

## R3: Use Hybrid Approach for Laravel Teams — CloudWatch + Scout APM

**Category**: Stack Recommendation

**Rule**: ALWAYS start Laravel teams with the CloudWatch (infrastructure monitoring, free) + Scout APM (Laravel application performance, $39-299/month) hybrid stack. NEVER start with a full-stack enterprise APM for Laravel-only environments.

**Reason**: CloudWatch provides all AWS infrastructure metrics (EC2, RDS, Lambda, ELB) at zero cost — CPU, memory, disk, network, and basic alarms. Scout APM provides Laravel-specific observability (N+1 detection, query analysis, Octane support, queue tracing) at a flat $39-299/month. Combined, they cover >90% of observability needs. Enterprise APMs (Datadog, New Relic, Dynatrace) cost $2,000-6,500+/month and provide capabilities (multi-language tracing, custom metrics, Kubernetes monitoring) that single-language Laravel teams rarely need.

**Bad Example**: A team of 4 Laravel developers adopts New Relic at $4,000/month. They use 20% of its features (APM + error tracking). The remaining 80% (multi-language tracing, infrastructure monitoring, browser monitoring) goes unused. Effective utilization: 20% at $400/month per used feature.

**Good Example**: The same team uses CloudWatch (free) + Scout APM ($99/month). They use 100% of Scout's features (Laravel-optimized, N+1 detection, Octane support). CloudWatch covers infrastructure. Total: $99/month. Effective utilization: 100% of both tools.

**Exceptions**: Polyglot environments (Laravel + Node.js + Python) need multi-language tracing — New Relic or Grafana Cloud is appropriate. Kubernetes-heavy deployments need container-native monitoring — Grafana Cloud is better suited.

**Consequences Of Violation**: Paying $40,000-80,000/year for enterprise APM when a $1,200/year Laravel-native solution provides full coverage. The difference funds an additional junior developer.

---

## R4: Implement Sampling BEFORE Traffic Grows — Not After

**Category**: Proactive Cost Control

**Rule**: ALWAYS configure trace sampling and log filtering BEFORE application traffic scales. NEVER wait until monitoring costs become a problem to implement sampling.

**Reason**: Per-GB monitoring models punish data volume. Implementing sampling after traffic grows requires (a) convincing the team to give up "complete data" they've become accustomed to, (b) refactoring existing dashboards and alerts that depend on full data, and (c) managing a period of behavior change. Implementing sampling from day one means: (a) no attachment to 100% data, (b) dashboards built on sampled data, (c) cost stays proportional to traffic growth. Proactive sampling preserves the 90th percentile of signal at 10% of the cost from the start.

**Bad Example**: A new service launches without sampling — 100% trace capture. After 6 months, traffic grows 10x and the Datadog bill goes from $500 to $5,000/month. The team scrambles to implement 10% sampling, but (a) engineers complain about "lost data," (b) existing alerts fail due to sample rate adjustment, (c) migration takes 3 weeks. During this time, the $5,000/month bill continues.

**Good Example**: The service launches with 10% head-based trace sampling, priority-sampling for errors (100%), and health check log filtering. When traffic grows 10x, the monitoring cost grows only 2x (some metrics are volume-independent). No refactoring needed. Cost is always under control.

**Exceptions**: Low-traffic services (<10 req/s) can start with 100% sampling and add sampling when traffic exceeds 100 req/s. Set a CloudWatch budget alarm to trigger the sampling conversation.

**Consequences Of Violation**: A sudden monitoring cost shock that requires a painful, reactive migration to sampling. During the migration, either costs remain high or observability quality degrades.

---

## R5: Review and Clean Unused Observability Resources Quarterly

**Category**: Housekeeping

**Rule**: ALWAYS review unused dashboards, alerts, custom metrics, synthetic tests, and log sources quarterly. Remove or disable anything unused for 90+ days.

**Reason**: Observability resources accumulate over time. Dashboards from past incidents, alerts from decommissioned services, synthetic tests for deprecated endpoints, and custom metrics from feature experiments all continue costing money. A quarterly review removes this "observability debt," keeping the monitoring bill proportional to current infrastructure value, not cumulative past effort.

**Bad Example**: A team finds during a quarterly review: 12 decommissioned service dashboards ($43.20/month), 30 stale alerts ($3/month) that fire constantly but are ignored, 15 synthetic tests for deprecated API endpoints ($225/month), and 80 unused custom metrics ($24/month). Monthly waste: $295.20/month ($3,542.40/year).

**Good Example**: The same team cleans quarterly. After each clean: 3-5 dashboards, 20-30 active alerts, 10-15 critical synthetics, 50-60 custom metrics. Monthly cost: $50-80/month. When a service is decommissioned, its monitoring resources are removed in the same sprint.

**Exceptions**: Compliance-mandated dashboards and alerts must be preserved regardless of usage. Document and exempt them from cleanup.

**Consequences Of Violation**: Monitoring costs creep up 10-20% quarter-over-quarter from zombie resources. After 2 years, the organization pays 2-3x the necessary monitoring cost for an infrastructure that has not grown proportionally.
