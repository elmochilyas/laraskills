---
id: KU-026 (AI Middleware)
title: "LiteLLM Proxy - Rules"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for LiteLLM Proxy

### R1: Always pin LiteLLM proxy version in production and test upgrades in staging first
- **Category:** Reliability
- **Rule:** Specify an exact proxy image version (`litellm/litellm:6.x.x`) in production Docker Compose and Kubernetes deployments; never use `latest` or a major-version-only tag.
- **Reason:** LiteLLM releases breaking changes that alter API compatibility, configuration format, and default behaviors. A `latest` tag can auto-upgrade and break production without warning.
- **Bad Example:** Docker Compose using `image: litellm/litellm:latest` — a breaking release deploys silently during the next container restart.
- **Good Example:** `image: litellm/litellm:6.2.0` in production; `image: litellm/litellm:6.3.0-rc` in staging for testing.
- **Exceptions:** Development environments where latest is acceptable.
- **Consequences of Violation:** Unexpected production outages from unplanned proxy upgrades; breaking API changes roll out without testing.

### R2: Implement per-team rate limits and spend limits in proxy config before onboarding any team
- **Category:** Cost Management
- **Rule:** Configure LiteLLM proxy's `team_config` with both `max_budget` (daily) and `rpm_limit` for every team before they begin sending requests; never deploy without spending guardrails.
- **Reason:** Without team-level limits, a single team's runaway traffic or misuse can exhaust the entire organization's AI budget, denying service to all other teams.
- **Bad Example:** Proxy configured with a global monthly limit but no per-team limits — one team runs a CPU-intensive batch job that consumes 80% of the budget in one day.
- **Good Example:** Each team configured with `team_config: { team_id: 'customer-support', max_budget: 500, rpm_limit: 1000 }`.
- **Exceptions:** Pilot teams with explicit opt-out approved by finance.
- **Consequences of Violation:** Single-team cost overrun cascades to all teams; budget is consumed unevenly, causing friction and last-minute emergency requests for budget increases.

### R3: Monitor LiteLLM proxy metrics with an external monitoring system, not just its audit logs
- **Category:** Observability
- **Rule:** Export LiteLLM proxy metrics (tokens per model, error rate, latency p50/p95, active requests) to Prometheus and set up alerts in Grafana; never rely solely on LiteLLM's internal audit logs for monitoring.
- **Reason:** Audit logs are for after-the-fact investigation, not real-time alerting. Without external monitoring, response time regression or error spikes go undetected until users report them.
- **Bad Example:** Checking LiteLLM's audit logs only when users complain about slow responses — the regression started 3 days ago.
- **Good Example:** A Grafana dashboard with panels for tokens per model, 95th-percentile latency, error rate, and alert thresholds at p95 > 5s and error rate > 5%.
- **Exceptions:** Non-critical internal tools where monitoring is not required.
- **Consequences of Violation:** Degraded quality of service continues for hours or days before detection; no historical data for root cause analysis after incidents.
