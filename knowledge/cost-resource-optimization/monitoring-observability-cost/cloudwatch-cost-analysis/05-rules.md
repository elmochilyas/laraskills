# CloudWatch Cost Analysis — Rules

## R1: Set Log Retention Policies Immediately — Never Keep Logs Indefinitely

**Category**: Log Retention

**Rule**: ALWAYS set CloudWatch Logs retention policy to 30 days for operational logs and 90 days for error logs. NEVER use the default "never expire" retention.

**Reason**: CloudWatch Logs default retention is "never expire" — logs accumulate indefinitely and storage costs grow unbounded. A typical app generating 100GB/month will have 600GB stored after 6 months at $0.03/GB/month = $18/month storage vs $90/month after 30 months. Most logs lose all operational value after 30 days — only compliance and error logs need longer retention. Setting retention limits prevents runaway storage costs.

**Bad Example**: A Laravel app generates 50GB/month of application logs. Retention is set to "never expire" (default). After 2 years, 1.2TB is stored at $0.03/GB/month = $36/month. Storage cost grows every month forever. The team has never queried logs older than 2 weeks.

**Good Example**: Retention policy: 7 days for debug logs (most verbose), 30 days for application events, 90 days for error logs. Logs older than 90 days are exported to S3 Glacier for $0.004/GB/month. Monthly storage cost: $4.50 vs $36. Savings: $31.50/month.

**Exceptions**: Compliance logs (PCI, HIPAA, SOC2) must be retained for 1-7 years per regulatory requirements. For these, export to S3 with Object Lock and delete from CloudWatch.

**Consequences Of Violation**: Storage costs grow unbounded over time. A $50/month log storage bill becomes $500/month within 2 years. The growth is silent — it increases by $1.50/month every month and goes unnoticed.

---

## R2: Use Filter Patterns to Reduce Log Ingestion Volume by 40-60%

**Category**: Ingestion Control

**Rule**: ALWAYS use CloudWatch Logs subscription filters and metric filters to drop low-value log events (DEBUG, INFO, health checks) before ingestion. NEVER send all log levels to CloudWatch at full verbosity.

**Reason**: CloudWatch charges $0.50/GB for log ingestion — this is 15x more expensive than storage. 80% of log volume in typical Laravel apps comes from INFO/DEBUG levels and health check endpoints that are rarely queried. Filtering them at the source reduces ingestion cost by 40-60% with zero loss of actionable signals. Errors and warnings (the high-value logs) are preserved.

**Bad Example**: A team sends all Laravel log levels (including DEBUG) to CloudWatch. Monthly ingestion: 100GB at $50/month. Analysis shows 65GB is DEBUG/INFO from health checks and cron jobs — never queried, zero value.

**Good Example**: The team adds a subscription filter that drops all log events below WARNING level from non-critical services. Health check logs are dropped entirely via a separate filter. Monthly ingestion drops to 30GB at $15/month. WARNING and above events are still 100% captured and queryable.

**Exceptions**: During active incident debugging, temporarily lower the filter to capture DEBUG logs for the affected service. After the incident, restore the filter.

**Consequences Of Violation**: Paying $0.50/GB for logs that provide zero debugging value. Annual waste of $500-5,000+ for mid-to-large apps. The cost grows linearly with traffic, not with debugging need.

---

## R3: Avoid High-Cardinality Custom Metrics (Use Contributor Insights Instead)

**Category**: Metric Design

**Rule**: NEVER create CloudWatch custom metrics with high-cardinality dimensions (user_id, session_id, ip_address). ALWAYS use Contributor Insights on logs for high-cardinality analysis.

**Reason**: CloudWatch custom metrics cost $0.30/metric/month per unique dimension combination. If you add user_id as a dimension to an "API Request" metric, each new user creates a new metric — 10,000 users = $3,000/month. Contributor Insights analyzes log data in-place without creating per-value metrics, making it the appropriate tool for high-cardinality analysis.

**Bad Example**: A team creates a custom metric `ApiRequest` with dimension `user_id` to track per-user request counts. With 50,000 monthly active users, this creates 50,000 individual metrics. Monthly cost: $15,000. The team only views the top 5 users by request count.

**Good Example**: The team logs each API request with the user_id field in structured JSON. They configure Contributor Insights to analyze the log stream for top-N users by request count. Cost: $0 (included in log ingestion). Query time: 2 seconds. Same insight, zero additional metric cost.

**Exceptions**: For low-cardinality dimensions (service name: 5 values, environment: 3 values, region: 4 values), custom metrics are appropriate. The cardinality risk starts above ~50 distinct values.

**Consequences Of Violation**: Unbounded metric costs that scale with application usage, not with monitoring value. A $15,000/month bill for metrics that could be replaced with free log-based analytics.

---

## R4: Consolidate Dashboards — Use Multi-Metric Widgets

**Category**: Dashboard Optimization

**Rule**: ALWAYS consolidate CloudWatch dashboards using multi-metric widgets. Limit to 3 dashboards per account (free tier). AVOID creating one dashboard per service or per team.

**Reason**: CloudWatch charges $3.60/dashboard/month after the first 3 free dashboards. For an organization with 10 microservices, 3 environments, and 4 teams, ad-hoc dashboard creation can easily generate 25+ dashboards at $79.20/month. Consolidating into unified dashboards with multi-metric widgets provides the same visibility at zero cost.

**Bad Example**: Each of 10 microservices has its own CloudWatch dashboard (10 dashboards) + each team has their own (4 dashboards) + environment-specific dashboards (3 dashboards) = 17 dashboards. Monthly cost: (17-3) x $3.60 = $50.40.

**Good Example**: 3 consolidated dashboards: (1) Production overview — all services, (2) Staging — all services, (3) Business metrics — revenue, users, orders. Monthly cost: $0 (within free tier). Multi-metric widgets show all 10 services per dashboard.

**Exceptions**: For compliance-mandated separation (PCI data vs non-PCI), create separate dashboards. For external client-facing dashboards, each client dashboard costs $3.60 but is billable.

**Consequences Of Violation**: Paying $50-100+/month for dashboard proliferation. This cost adds no monitoring value — it's purely organizational overhead.

---

## R5: Set CloudWatch-Specific Budget Alerts to Prevent Bill Surprises

**Category**: Cost Governance

**Rule**: ALWAYS configure AWS Budget alerts specifically for CloudWatch costs with a threshold of $X/month (based on expected usage + 50% buffer). NEVER rely only on total-infrastructure budget alerts.

**Reason**: CloudWatch costs can spike dramatically without corresponding infrastructure changes. A log injection attack (attacker sends verbose log entries) can increase log volume 100x overnight. A misconfigured log level (accidentally set to DEBUG in production) multiplies ingestion costs by 10-50x. Infrastructure-level budget alerts will catch the total increase but with attribution delay. Service-specific alerts for CloudWatch catch monitoring-specific anomalies immediately.

**Bad Example**: The team has a $10,000/month total infrastructure budget alert. A developer sets LOG_LEVEL=debug in production. Log volume increases from 50GB to 750GB/month. Monthly CloudWatch bill increases from $250 to $3,750. The budget alert fires at $10,000 from combined compute+monitoring costs 10 days into the billing cycle — $1,875 in CloudWatch overage already incurred.

**Good Example**: A separate $500/month CloudWatch budget alert is configured. On day 3, CloudWatch costs hit $500 — the alert fires immediately. The team investigates and finds the LOG_LEVEL misconfiguration within hours. Overage: $75 vs $1,875.

**Exceptions**: For very small deployments (<$100/month total), combined budget alerts are sufficient. Monitor the budget alert threshold in proportion to service-specific risk.

**Consequences Of Violation**: Surprise CloudWatch bills of $2,000-10,000+ before detection. The cost accumulates silently for days or weeks before the next billing cycle reveals it.
