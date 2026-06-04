# Rules: APM Tool Integration

## Rule APM-01: Configure sampling for all production APM agents
**Condition:** When deploying any APM agent to production.
**Action:** Set sampling rate appropriate for traffic volume. For >1000 req/s: 10% base rate. Always sample 100% of error transactions and slow transactions (>p95 threshold).
**Consequence:** Predictable span volume and cost. Critical transactions never lost.

## Rule APM-02: Exclude health check endpoints from APM instrumentation
**Condition:** When configuring APM transaction capture.
**Action:** Add health check, readiness, and liveness probe URLs to the APM agent's ignored transaction list.
**Consequence:** Health check traffic (10-30% of total requests) does not consume sampling budget or skew Apdex scores.

## Rule APM-03: Normalize dynamic URL segments in transaction names
**Condition:** When configuring APM transaction naming.
**Action:** Ensure `/users/{id}` routes appear as `/users/{id}` not `/users/42`, `/users/99`. Use APM agent URL grouping rules.
**Consequence:** Transactions aggregate correctly. Meaningful p50/p95/p99 per endpoint type.

## Rule APM-04: Set Apdex thresholds per endpoint group
**Condition:** When configuring APM dashboards and alerting.
**Action:** Define Apdex thresholds per endpoint functional group. API: 0.5s. Admin: 1.0s. Background: 5.0s. Health: excluded.
**Consequence:** Actionable Apdex scores that reflect actual user expectations.

## Rule APM-05: Never run multiple APM agents simultaneously
**Condition:** When selecting an APM tool.
**Action:** Choose one primary APM agent. Remove or disable all others. Each agent adds 3-10% overhead.
**Consequence:** Predictable performance overhead. No contention for framework hooks.

## Rule APM-06: Benchmark APM agent overhead before production deployment
**Condition:** Before enabling APM on production servers.
**Action:** Measure request latency, CPU usage, and memory consumption with and without the agent. Compare under peak load.
**Consequence:** Quantified understanding of APM cost. Capacity adjustments made if overhead exceeds budget.

## Rule APM-07: Use release tracking to correlate performance with deployments
**Condition:** When APM is active.
**Action:** Configure release version tracking. Tag deployments with git SHA or build number. Monitor p99 latency changes after each deployment.
**Consequence:** Performance regressions are detected within hours of deployment, not weeks later.

## Rule APM-08: Disable APM agents in non-production environments
**Condition:** For development, staging, and CI environments.
**Action:** Set APM agent enable flag to false. Use environment-specific configuration.
**Consequence:** No overhead on non-production infrastructure. APM budget spent only on production insights.
