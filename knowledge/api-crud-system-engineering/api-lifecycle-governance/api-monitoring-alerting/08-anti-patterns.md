# Anti-Patterns: API Monitoring and Alerting

## AP-1: Alert Storm (Cascading Alerts Without Deduplication)
**Category**: Reliability

**Description**: A single root cause triggering dozens or hundreds of related alerts. During an incident, the on-call engineer is overwhelmed by alert noise — database alerts, cache alerts, application error alerts, latency alerts — all from the same underlying failure.

**Warning Signs**:
- Single incident generates 10+ alerts
- Multiple alerts for the same root cause
- PagerDuty/OpsGenie floods during incidents
- On-call ignores "noisy" alerts
- Alert fatigue leads to missed genuine issues
- Related alerts not grouped or deduplicated

**Harms**:
- On-call overwhelmed during incidents
- Critical alerts lost in noise
- Extended MTTR (time wasted triaging duplicate alerts)
- Alert fatigue desensitizes team
- Genuine issues missed because of noise
- Burnout from constant alerting

**Real-World Consequence**: A database failure causes: database connection alert, query timeout alert, 5xx error rate alert, p95 latency alert, health check failure alert, cache miss rate alert, queue backlog alert. The on-call receives 7 pages in 30 seconds. They spend 10 minutes confirming all alerts are from the same root cause before starting remediation.

**Preferred Alternative**: Implement alert deduplication and grouping. Use dependency-aware alerting: if the database is down, suppress dependent service alerts. Group related alerts into a single incident.

**Refactoring Strategy**: Implement alert deduplication rules, create dependency graph for alert correlation, use Alertmanager grouping/ inhibition rules, consolidate related alerts into incident summaries, run post-mortem on alert storms to refine rules.

**Detection Checklist**:
- `[ ]` Are related alerts grouped or deduplicated?
- `[ ]` Do cascading alerts get suppressed when root cause is identified?
- `[ ]` Is there alert fatigue in the on-call team?
- `[ ]` Are incidents linked to a single root-cause alert?

**Related**: 04-standardized-knowledge.md, 06-skills.md

---

## AP-2: Alerting on Symptoms Instead of Consumer Impact
**Category**: Reliability

**Description**: Setting alerts on infrastructure symptoms (CPU usage, memory, disk I/O) instead of consumer-impact signals (error rate, latency, availability). A server can have high CPU without affecting consumers, and consumers can have errors without high CPU.

**Warning Signs**:
- Alerts for CPU, memory, disk without consumer-impact correlation
- PagerDuty pages for infrastructure metrics that don't affect consumers
- On-call investigates "high CPU" that doesn't affect API response times
- No alerts for error rate or latency degradation
- Incidents reported by consumers before monitoring

**Harms**:
- False positive alerts waste on-call time
- Genuine consumer-impacting issues missed
- Infrastructure-focused monitoring ignores user experience
- On-call desensitized to alerts that "don't matter"
- Incidents discovered by consumer complaints, not monitoring
- No alert for the thing that actually matters (consumer-facing errors)

**Real-World Consequence**: An API server has CPU alert at 90% — pages the on-call team. Investigation reveals a background analytics job is consuming CPU. API response times are normal. The on-call wastes 30 minutes investigating a non-issue. Meanwhile, an API endpoint has been returning 500 errors for 10 minutes with no alert because CPU is at 40%.

**Preferred Alternative**: Alert on consumer-impact signals first (error rate, latency, availability). Use infrastructure alerts as supporting context, not primary pages.

**Refactoring Strategy**: Prioritize RED method alerts (Rate/Errors/Duration) as primary pages, demote infrastructure alerts to warnings (non-paging), add correlation dashboards linking infrastructure symptoms to consumer impact, set infrastructure alerts at extreme thresholds only.

**Detection Checklist**:
- `[ ]` Are primary alerts based on consumer impact (errors, latency)?
- `[ ]` Are infrastructure alerts demoted to warnings?
- `[ ]` Do pages correlate with actual consumer-facing issues?
- `[ ]` Are there incidents discovered by consumers before monitoring?

**Related**: 05-rules.md (Rule 1: Monitor Using RED Method for Every Service), 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: Health Check Without Dependency Verification
**Category**: Reliability

**Description**: A health check endpoint that always returns 200 OK without actually testing any dependencies. The load balancer routes traffic to an instance that returns 200 healthy but whose database, cache, or queue are disconnected — requests fail immediately after passing the health check.

**Warning Signs**:
- Health check returns `{ "status": "ok" }` without checking dependencies
- Load balancer routes traffic to instances with failed dependencies
- Requests fail immediately after passing health check
- "Works in health check, fails in request" pattern
- No database or cache connectivity testing in health endpoint

**Harms**:
- Load balancer sends traffic to unhealthy instances
- Requests fail despite health check passing
- Cascading failures as unhealthy instances receive more traffic
- False sense of security from "green" health checks
- Downstream consumers receive errors from "healthy" services

**Real-World Consequence**: A health check endpoint returns 200 without checking the database. The database connection pool is exhausted (all connections in use). The load balancer sees "healthy" and sends traffic. Every request times out waiting for a database connection. 100% of requests fail while the health check reports "ok."

**Preferred Alternative**: Implement health checks that verify dependency connectivity (database, cache, queue, critical services). Return 503 if any critical dependency is unhealthy.

**Refactoring Strategy**: Add connectivity checks for each critical dependency, set health check timeout to < 100ms total, categorize dependencies (critical vs non-critical), return 200 only if all critical dependencies are healthy, return 503 with details if degraded.

**Detection Checklist**:
- `[ ]` Does the health check verify database connectivity?
- `[ ]` Does the health check verify cache connectivity?
- `[ ]` Does the health check verify queue connectivity?
- `[ ]` Does the health check return 503 when dependencies fail?

**Related**: 05-rules.md (Rule 3: Implement Health Checks with Dependency Verification), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-4: No Synthetic Monitoring (Reactive Only)
**Category**: Reliability

**Description**: Relying solely on real-user monitoring and server-side metrics without synthetic transactions simulating real consumer behavior. Issues are only discovered after real consumers are affected and report problems.

**Warning Signs**:
- No automated test transactions running against production
- Incidents discovered by consumer support tickets
- Regional issues undetected (only monitoring from local datacenter)
- "Works on my machine" but fails in production for consumers
- No pre-production validation of API behavior

**Harms**:
- Issues detected only after consumers are affected
- Regional latency/availability issues invisible
- No proactive detection of API degradation
- Consumer-reported incidents have longer resolution time
- Can't validate API behavior changes before release

**Real-World Consequence**: An API deployment accidentally removes CORS headers for the EU region (configuration scoping issue). Server-side metrics show normal latency and error rates. The EU SPA team notices their app can't make cross-origin requests and files a support ticket. 3 hours pass before the issue is detected — all because no synthetic check tests CORS headers from EU.

**Preferred Alternative**: Run synthetic monitoring transactions from multiple geographic regions simulating real consumer behavior. Detect issues before consumers report them.

**Refactoring Strategy**: Implement synthetic monitoring tool (Checkly, Playwright, custom scripts), define critical user journeys as synthetic tests, run from 3+ geographic regions at 60-second intervals, alert on synthetic test failures, include synthetic checks in release validation.

**Detection Checklist**:
- `[ ]` Are synthetic transactions running against production?
- `[ ]` Do synthetic tests cover critical user journeys?
- `[ ]` Are synthetic checks running from multiple regions?
- `[ ]` Have issues been detected by consumers before synthetic monitoring?

**Related**: 05-rules.md (Rule 4: Run Synthetic Monitoring from Multiple Regions), 04-standardized-knowledge.md, 06-skills.md

---

## AP-5: No Runbooks for Alerts
**Category**: Reliability

**Description**: Sending alerts to on-call engineers without providing runbooks that define what to check, how to diagnose, and how to remediate. Each incident response starts from zero, extending MTTR and causing inconsistent responses across shifts.

**Warning Signs**:
- Alert fires and on-call asks "what do I do?"
- No documentation linked in alert notifications
- Different on-call engineers respond to same alert differently
- Incident response starts with investigation (should start with diagnosis)
- MTTR is inconsistent across shifts
- Runbooks exist only in senior engineers' heads

**Harms**:
- Extended MTTR (minutes lost to figuring out what to do)
- Inconsistent incident response across shifts
- Panic during critical incidents
- Knowledge siloed in senior team members
- Mistakes from ad-hoc diagnosis under pressure
- On-call burnout from stress of unprepared response

**Real-World Consequence**: A "HighErrorRate" alert fires at 3 AM. The on-call engineer has never seen this alert before. They spend 25 minutes checking random dashboards, finding no obvious cause. They escalate to the senior engineer who knows that the common cause is a recently deployed config change. Rollback fixes the issue in 5 minutes. The total MTTR is 30 minutes — 25 minutes of avoidable investigation.

**Preferred Alternative**: Write runbooks for every alert defining: what to check first, common causes, diagnostic steps, remediation actions, and escalation paths.

**Refactoring Strategy**: Create runbook template (summary, symptoms, checks, common causes, remediation, escalation), write runbooks for all existing alerts, link runbooks in alert notifications and monitoring dashboards, review and update runbooks quarterly.

**Detection Checklist**:
- `[ ]` Does every alert have an associated runbook?
- `[ ]` Are runbooks linked in alert notifications?
- `[ ]` Can a new on-call engineer respond to any alert?
- `[ ]` Is MTTR consistent across shifts?

**Related**: 05-rules.md (Rule 5: Write Runbooks for Every Alert), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: Single-Window Alerting (Misses Burst or Sustained Issues)
**Category**: Reliability

**Description**: Using a single time window for all alert thresholds. A short window catches bursts but fires on transient noise. A long window ignores brief issues but catches sustained degradation. Neither alone provides complete coverage.

**Warning Signs**:
- Single alert window (e.g., 5 minutes) for all scenarios
- Short bursts (30 seconds of high errors) trigger pages unnecessarily
- Sustained degradation (3% errors for 30 minutes) goes unnoticed
- On-call complains about false positives from transient spikes
- Post-mortems reveal issues that "didn't trigger alerts"

**Harms**:
- Short window: false positives from transient noise
- Long window: missed brief but impactful issues
- On-call desensitized to alerts (cry wolf)
- Genuine sustained issues undetected
- Alert configuration doesn't match actual failure patterns

**Real-World Consequence**: A single 5-minute window alert fires when error rate exceeds 5%. A brief 30-second network blip causes 50% errors for one 5-minute window — the alert fires. On-call investigates and finds the issue has already self-resolved. Meanwhile, a slow memory leak causes error rate to climb from 1% to 4% over 45 minutes — never triggering the 5% threshold. The 45-minute degradation goes undetected.

**Preferred Alternative**: Configure multi-window, multi-burst alerting: short window for burst sensitivity (5 min at 5%), long window for sustained detection (30 min at 2%). Use multiple evaluation windows to balance sensitivity and stability.

**Refactoring Strategy**: Implement multi-window alert rules, configure short window (5 min) for burst detection and long window (30 min) for sustained detection, adjust thresholds per alert type, test with historical incident data to validate coverage.

**Detection Checklist**:
- `[ ]` Are there multiple time windows for alert evaluation?
- `[ ]` Do short bursts trigger unnecessary alerts (false positives)?
- `[ ]` Are sustained degradations detected before consumers report them?
- `[ ]` Does the alerting configuration cover both burst and sustained patterns?

**Related**: 05-rules.md (Rule 6: Implement Multi-Window, Multi-Burst Alerting), 04-standardized-knowledge.md, 06-skills.md

---

## AP-7: Silent Monitoring System Outage
**Category**: Reliability

**Description**: The monitoring infrastructure (Prometheus, Grafana, alert manager, Loki) fails without anyone noticing. The API could be down for hours while monitoring is also down — no alerts fire because the alerting system itself is broken.

**Warning Signs**:
- Monitoring system has no health checks
- No heartbeat or dead man's switch for monitoring
- "Why didn't we get an alert?" post-mortem findings
- Monitoring system failures discovered during incident response
- No separate alerting channel for monitoring health

**Harms**:
- Complete blind spot during monitoring outage
- Hours of unmonitored API time
- Incident detection relies on consumer complaints
- Cannot determine incident start time (no metrics)
- Compliance gaps for monitoring requirements

**Real-World Consequence**: Grafana server runs out of disk space and stops recording metrics. Prometheus cannot send data. Alert manager stops processing. No alert fires because the entire monitoring stack is down. The API experiences a 2-hour partial outage. The team discovers the issue when consumers complain. Post-mortem reveals the API was degraded for 2 hours with zero alerts — the monitoring system had been down for 4 hours before the API issue.

**Preferred Alternative**: Implement heartbeat/dead man's switch monitoring for the monitoring infrastructure itself. Use a separate monitoring service or external synthetic check to verify monitoring system health.

**Refactoring Strategy**: Implement dead man's switch (heartbeat metric that must fire every 60 seconds), use external monitoring service (Pingdom, Checkly) to verify monitoring system reachability, alert via separate channel (email, SMS) when monitoring heartbeats fail, create monitoring system health dashboard.

**Detection Checklist**:
- `[ ]` Is there a heartbeat for the monitoring system?
- `[ ]` Is monitoring health checked from outside the monitoring stack?
- `[ ]` Have there been silent monitoring outages?
- `[ ]` Is there a separate alerting channel for monitoring health?

**Related**: 05-rules.md (Rule 7: Monitor the Monitoring System), 04-standardized-knowledge.md, 06-skills.md
