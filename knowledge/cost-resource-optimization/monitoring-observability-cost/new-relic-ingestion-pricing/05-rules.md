# New Relic Ingestion Pricing — Rules

## R1: Effectively Use the 100GB Free Tier Before Paying

**Category**: Cost Baseline

**Rule**: ALWAYS optimize your data ingestion to stay within New Relic's 100GB/month free tier before paying for additional capacity. NEVER pay for New Relic ingestion when your volume is under 100GB/month.

**Reason**: New Relic offers 100GB/month free telemetry ingestion — this never expires and applies per account. For small-to-mid-scale Laravel deployments (<50 EC2, <50GB/month logs), the free tier covers all ingestion needs. Paying for a Pro plan ($349/user/month) or Data Plus ($0.55/GB) when free tier suffices is pure waste. Many teams assume they exceed 100GB but with proper filtering are well within it.

**Bad Example**: A small Laravel app with 5 servers and 20GB/month logs signs up for New Relic Pro ($349/user/month for 3 users = $1,047/month). They don't realize the free tier covers 100GB/month — 5x their volume. First month bill: $1,047 for what could be $0.

**Good Example**: The same team signs up for New Relic free tier (1 user, 100GB/month). They filter DEBUG logs, sample traces at 10%, and drop health check traffic. Actual usage: 25GB/month. Cost: $0. When they exceed 100GB/month, they upgrade to a paid plan — but they've saved $12,564/year while growing.

**Exceptions**: Teams needing Full Platform user seats (beyond 1) for alerting and collaboration will pay $49-99/user regardless of data volume. Evaluate whether the free tier's collaboration limits are acceptable.

**Consequences Of Violation**: Paying $500-2,000+/month for New Relic when the free tier covers all needs. The free tier is generous — most small teams will never exceed 100GB with proper optimization.

---

## R2: Set Log Verbosity to WARN+ in Production

**Category**: Log Volume Control

**Rule**: ALWAYS configure New Relic log forwarding to send only WARNING and above levels from production services. NEVER send DEBUG or INFO logs to New Relic as default.

**Reason**: New Relic charges $0.30-0.50/GB for all ingested telemetry — logs are typically the largest volume contributor. DEBUG and INFO logs represent 60-80% of log volume but provide minimal value for production debugging. Sending them to New Relic multiplies ingestion costs 3-5x for no actionable benefit. Errors and warnings should stay at 100% capture for incident response.

**Bad Example**: A team sends all Laravel logs (DEBUG, INFO, WARNING, ERROR) to New Relic. Monthly log volume: 80GB at $0.30/GB beyond 100GB free = $24/month. Analysis shows 55GB is DEBUG/INFO from health checks and routine operations — zero debugging value, $16.50/month wasted.

**Good Example**: Log forwarding filter: only WARNING, ERROR, and CRITICAL levels. DEBUG and INFO stay in local files (retained 7 days). Monthly log volume: 10GB. Ingestion cost: $0 (within free tier). During incidents, temporarily forward DEBUG from the affected service. Savings: $16.50/month.

**Exceptions**: During active incident debugging, temporarily enable INFO/DEBUG for the affected service. Automate with a feature flag so the level reverts after 24 hours.

**Consequences Of Violation**: Paying $0.30-0.50/GB for logs that will never be queried. A "free tier under 100GB" team may exceed 100GB solely due to low-value log data.

---

## R3: Use Trace Sampling at 10% — Never 100% at Scale

**Category**: Trace Sampling

**Rule**: ALWAYS configure trace sampling at 10% or lower for high-traffic endpoints (>100 req/s). NEVER send 100% of traces for high-traffic services.

**Reason**: Traces are the most expensive telemetry type in per-GB pricing because they contain detailed span data (every database query, cache call, and HTTP request within a transaction). At 100 req/s with 50 spans per request, an application generates 5,000 spans/second = 432M spans/day = significant GB. Sampling at 10% reduces this by 90% while preserving statistical significance for trend analysis. Error traces should be exempt from sampling.

**Bad Example**: A Laravel API handles 500 req/s with full trace capture at 50 spans/trace. Daily trace volume: 2.16B spans ≈ 200GB/month. New Relic ingestion cost beyond free tier: (200GB - 100GB) x $0.30 = $30/month just for traces. 99% of spans are never viewed.

**Good Example**: 10% head-based sampling for non-error traces. 100% capture for error traces (>400 status). Daily trace volume: 200M spans ≈ 20GB/month. Ingestion cost beyond free tier: $0 (within 100GB). Error traces: 100% preserved.

**Exceptions**: Low-traffic services (<10 req/s) can use 100% sampling — trace cost is negligible. Active debugging may temporarily increase sampling rate.

**Consequences Of Violation**: Trace data dominates the ingestion budget. A team that stays under the 100GB free tier on logs and metrics may exceed it on traces alone.

---

## R4: Monitor Per-Service Data Volume with NRQL

**Category**: Usage Visibility

**Rule**: ALWAYS monitor per-service data ingestion volume using NRQL queries. Set a weekly review to identify services generating disproportionately high volume. NEVER manage ingestion costs without per-service visibility.

**Reason**: Ingestion costs are invisible at the aggregate level — you can't optimize what you can't measure. A single misconfigured service (DEBUG logging, 100% traces) can generate 60% of total ingestion volume. NRQL queries like `SELECT sum(`usage.*`) FROM TelemetrySummary SINCE 1 week ago FACET service` identify which services are cost drivers so you can target optimization efforts.

**Bad Example**: A team reviews their New Relic bill at $800/month and wonders why. They have no per-service breakdown. Investigation reveals that a staging environment service is accidentally sending full telemetry to production New Relic account — generating 200GB/month of useless data costing $30/month beyond free tier. Without per-service visibility, this goes unnoticed for 6 months.

**Good Example**: The team runs a weekly NRQL query: `SELECT sum(`usage.*`) FROM TelemetrySummary SINCE 1 week ago FACET service`. They notice `staging-payment-worker` is ingesting 50GB/month. Investigation reveals DEBUG logging was left on after an incident. They fix it, reducing ingestion by 45GB/month. Monthly savings: $13.50.

**Exceptions**: For very small deployments (<10GB/month), per-service volume monitoring is low value. Implement it when total ingestion exceeds 50GB/month.

**Consequences Of Violation**: Ingestion cost drivers go unidentified. A single misconfigured service can double the monthly bill before anyone notices.

---

## R5: Set Ingest Budget Alerts — Never Wait for the Bill

**Category**: Cost Governance

**Rule**: ALWAYS configure New Relic ingest budget alerts at 80% of monthly data volume budget. NEVER discover ingestion overage at the end of the billing cycle.

**Reason**: New Relic bills on consumption — volume can spike without corresponding infrastructure changes. A developer deploying a new logging library, a misconfigured agent, or a traffic surge can double ingestion overnight. Without proactive alerts, the overage accumulates for an entire billing cycle before detection. An 80% alert provides early warning and time to investigate before the month closes.

**Bad Example**: A team's monthly data budget is 200GB (estimated $30/month beyond free tier). In week 2, a developer deploys a logging middleware that logs all request/response bodies. Daily ingestion jumps from 6GB to 18GB. By end of month, actual usage: 480GB. Bill: (480-100) x $0.30 = $114/month vs expected $30. The team discovers this on the invoice — 2 weeks after the overage period.

**Good Example**: Alert configured at 160GB (80% of 200GB budget). On day 10, the alert fires. The team reviews per-service volume, finds the logging middleware, and reverts it. Actual monthly usage: 180GB. Bill: $24/month. Overage caught and corrected within hours, not weeks.

**Exceptions**: For teams within the free tier (<100GB/month), budget alerts are lower priority. Set them at 80GB to catch growth before exceeding the free tier.

**Consequences Of Violation**: Surprise monthly bills 2-5x the expected amount. The overage accumulates silently for weeks before appearing on the invoice.
