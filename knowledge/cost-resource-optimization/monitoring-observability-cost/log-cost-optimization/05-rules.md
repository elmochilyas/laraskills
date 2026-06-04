# Log Cost Optimization — Rules

## R1: Set LOG_LEVEL to Warning in Production

**Category**: Log Level Configuration

**Rule**: ALWAYS set `LOG_LEVEL=warning` in production environments. NEVER use DEBUG or INFO log levels in production unless actively debugging an incident.

**Reason**: DEBUG logs are 10-100x more verbose than WARNING logs — each log line costs $0.50/GB to ingest (CloudWatch). A production app generating 10GB/day at DEBUG produces 100MB/day at WARNING — a 100x reduction. The informational value of DEBUG logs in production is near-zero for normal operations; they are only useful during active incident debugging. Keeping DEBUG in production is the single most expensive logging mistake.

**Bad Example**: A team deploys to production with `LOG_LEVEL=debug` (default from .env.example). The Laravel framework logs every query, every request, every cache hit. Daily log volume: 15GB. Monthly CloudWatch log cost: 15GB x 30 x $0.50 = $225/month. The team never queries DEBUG logs.

**Good Example**: `LOG_LEVEL=warning` in production `.env`. Only WARNING and above events are logged. Daily log volume: 200MB. Monthly CloudWatch log cost: 6GB x $0.50 = $3/month. During an incident, the team temporarily sets LOG_LEVEL=debug for the affected service, then reverts.

**Exceptions**: During active incident debugging, temporarily set `LOG_LEVEL=debug` for the affected service only. Set a 24-hour reminder to revert. Automate this with a feature flag or scheduled task that resets the level.

**Consequences Of Violation**: Unnecessary $200-2,000+/month in log ingestion costs. The cost is invisible until the CloudWatch bill arrives — it's a silent budget drain.

---

## R2: Use Structured JSON Logging — Never Unstructured Text

**Category**: Log Format

**Rule**: ALWAYS configure Laravel to output structured JSON logs in production. NEVER use unstructured text logs (default Laravel single-file log format) when shipping to log aggregators.

**Reason**: Structured JSON logs enable selective ingestion, efficient searching, automated parsing, and compression benefits (JSON compresses better than formatted text). Unstructured text logs require regex parsing, cannot be filtered at ingestion, and increase storage and search costs. Laravel 11+ natively supports structured logging — configuration is a single channel change.

**Bad Example**: Default Laravel logging writes unstructured text: `[2024-01-01 12:00:00] production.INFO: User 123 created order 456`. When shipped to CloudWatch, each line costs $0.50/GB to ingest and cannot be parsed without expensive regex patterns.

**Good Example**: JSON logging: `{"level":"INFO","message":"User created order","user_id":123,"order_id":456,"timestamp":"2024-01-01T12:00:00Z","service":"web","env":"production"}`. Reduces volume by 30% (no timestamp formatting overhead), compresses 5x better, and can be queried with CloudWatch Logs Insights or Datadog log queries.

**Exceptions**: For local development, text logs are more readable — use `stack` channel sending `single` for development and `stderr` or `json` channel for production.

**Consequences Of Violation**: 30-50% higher log volume from unstructured format, 5x worse compression, and inability to perform structured queries. Migration to structured logging later is painful.

---

## R3: Sample High-Volume Logs — Never Sample Errors

**Category**: Sampling

**Rule**: ALWAYS sample high-volume informational logs (1:10 or 1:100) while retaining 100% of ERROR and CRITICAL logs. NEVER sample error logs.

**Reason**: 90% of log volume typically comes from 5% of endpoints — health checks, status pings, and high-traffic APIs. Sampling these at 1:10 reduces volume by 90% while preserving the statistical signal for trend analysis. Errors constitute 1-5% of log volume but provide 90% of debugging value — sampling them would miss incidents entirely.

**Bad Example**: A team implements 1:10 sampling on ALL logs including errors. An intermittent payment gateway failure occurs 3 times in a 10-minute window. Two occurrences are sampled out — the team sees 1 error log and assumes it was a one-off. The issue goes undiagnosed for 2 weeks.

**Good Example**: Priority sampling: 100% of ERROR logs retained, 100% of CRITICAL logs retained, 10% of INFO logs sampled (random), 1% of DEBUG logs sampled. Health check endpoint logs: dropped entirely. Total log volume reduction: 80%. Error signal: 100% preserved.

**Exceptions**: Low-traffic apps (<1 req/s) don't need sampling — log everything. For these apps, the log cost is negligible.

**Consequences Of Violation**: Without sampling, log costs scale linearly with traffic. A growing app's monthly log bill grows unbounded. Sampling errors risks missing critical incident signals.

---

## R4: Filter Health Check and Cron Logs at Source

**Category**: Ingestion Filtering

**Rule**: ALWAYS configure log shipping filters to drop health check endpoint logs and cron job output logs. NEVER ingest logs that have zero debugging value.

**Reason**: Health checks (ELB health pings, Kubernetes liveness probes) generate 50-60% of total request volume in many Laravel applications. Cron job logs (every run at 1-minute intervals) add another 10-15%. These logs are never queried for debugging — they exist only to confirm the system is running. Filtering them at the source reduces log ingestion volume by 50-75% with zero loss of debugging capability.

**Bad Example**: An app with 10 EC2 instances behind an ALB generates 50 req/s in user traffic + 50 req/s in health checks. Health check logs: 50 req/s x 86,400 s = 4.3M log lines/day. Monthly log cost from health checks alone: ~$150/month. The team has never queried a health check log.

**Good Example**: Log shipper filter: drop any log line where URL path matches `/health` or `/up` or `/ping`. Health checks still run and keep the instance healthy, but generate zero logs. Monthly log cost reduction: $150/month (50% of previous total).

**Exceptions**: During a health check-related incident (instances marked unhealthy incorrectly), temporarily disable the filter to debug. Re-enable after resolution.

**Consequences Of Violation**: Paying 50-75% of the log bill for health check and cron logs that provide zero debugging value. Annual waste of $500-5,000+ for mid-scale apps.

---

## R5: Set 30-Day Retention for Operational Logs — Export Compliance Logs to S3

**Category**: Retention Management

**Rule**: ALWAYS set CloudWatch/Datadog/New Relic log retention to 30 days for operational logs. Export compliance-mandated logs to S3 Glacier after 30 days. NEVER keep operational logs in hot storage for longer than 90 days.

**Reason**: 99% of log queries occur within the first 7 days of log generation. Keeping logs in hot storage beyond 30 days provides no operational value but adds significant storage cost. CloudWatch charges $0.03/GB/month — 100GB for 12 months = $36/year. S3 Glacier: $4.80/year for the same data. The storage cost of a year of logs in hot storage is 7.5x more than in Glacier, and they are never queried after the first 30 days.

**Bad Example**: A team keeps 1 year of logs in CloudWatch (never expire). After 12 months, 600GB is stored at $0.03/GB/month = $18/month. The team has never queried logs older than 2 weeks. Annual storage cost: $216 for data that provides zero value.

**Good Example**: 30-day retention in CloudWatch. Logs older than 30 days are exported to S3 Parquet, then transitioned to Glacier via lifecycle policy. Monthly storage cost: CloudWatch $3 (30GB) + Glacier $1.20 (remaining 570GB) = $4.20/month. Annual storage cost: $50.40. Savings: $165.60/year.

**Exceptions**: Compliance logs (PCI, HIPAA, SOC2) must be retained per regulatory requirements — export these to S3 with Object Lock and appropriate retention. Never keep them in hot CloudWatch storage.

**Consequences Of Violation**: Growing storage costs for data that has zero operational value. The $10/month storage bill this month becomes $20/month in 6 months and $40/month in 18 months — unbounded growth with no benefit.
