## Derive SLO targets from measured baseline performance, not aspirational goals
---
Category: Design
---
Measure current p50, p95, and p99 latency for at least 2 weeks of production traffic before setting SLO targets — never define SLOs as aspirational numbers that current performance cannot meet.
---
Reason: An SLO of "p99 < 100ms" when current p99 is 800ms means zero error budget from day one — every single request violates the SLO. This guarantees constant alert fatigue, meaningless error budget tracking, and eventual abandonment of the SLO program. SLOs should represent acceptable performance, not aspirational goals. Set them at or slightly above current performance, then improve over time.
---
Bad Example:
```text
# Aspirational SLO — impossible from day one
SLO: p99 < 100ms (current p99 is 800ms) — zero budget, constant alerts
```

Good Example:
```text
# Baseline-based SLO
Current p99: 800ms → SLO: p99 < 1000ms (achievable, 20% headroom)
Next quarter: improved to 600ms → SLO: p99 < 750ms
```
---
Exceptions: Greenfield services with no production data may use conservative (loose) SLOs based on competitive benchmarks and tighten them after 2 weeks of data.
---
Consequences Of Violation: Zero error budget from day one, constant alert fatigue, team ignores SLO alerts, SLO program abandoned as useless.

## Set SLOs as percentage targets, not absolute latency values
---
Category: Design
---
Define SLOs as "99.5% of requests complete in <500ms" rather than "p95 < 500ms" — the percentage captures both latency and error rate in a single metric.
---
Reason: An absolute latency SLO ("p95 < 500ms") only tracks the latency boundary — it doesn't capture how many requests exceed the boundary or what the error rate is. A percentage-based SLO ("99.5% in <500ms") combines latency and reliability: if 1% of requests fail or 0.6% are slow, the SLO is breached. This provides a single, actionable metric that drives both latency optimization and reliability work.
---
Bad Example:
```text
# Absolute-only — misses error rate
p95 < 500ms  # 5% of requests can be arbitrarily slow, any error rate is OK
```

Good Example:
```text
# Percentage-based — captures both latency and error rate
99.5% of requests complete in <500ms  # Only 0.5% can be slow or error
```
---
Exceptions: Internal debugging tools where error rate is expected to be higher may use absolute latency targets for simplicity.
---
Consequences Of Violation: High error rate within "acceptable" latency SLO, poor user experience despite SLO attainment, misleading service health reporting.

## Implement error budget-aware deployment gates: deploy normally above 50% budget, canary-only at 20-50%, freeze below 20%
---
Category: Reliability
---
Check the remaining error budget in CI/CD before each deployment and enforce gates: normal deploy when budget >50%, canary-only with extended observation when 20-50%, deployment freeze when <20%, with manual override for security patches.
---
Reason: Error budget is the organization's tolerance for unreliability. Deploying when the budget is nearly exhausted risks spending the remaining budget on deployment-related issues, causing an SLO breach. The graduated gate system preserves budget for the remainder of the month while allowing low-risk deployments (canary) and emergency fixes (security override).
---
Bad Example:
```bash
# No budget awareness — deploy regardless
# Budget exhausted on day 20, deploy triggers SLO breach
```

Good Example:
```bash
# Budget-aware deployment
# Budget >50%: normal deploy
# Budget 20-50%: canary-only, 1-hour observation
# Budget <20%: freeze (security patches override with VP approval)
```
---
Exceptions: Organizations without SLO maturity may start with monitoring-only budgets and add gates after 3 months of baseline data.
---
Consequences Of Violation: Deployments during low-budget periods push the service over the SLO threshold, causing reportable breaches and potential customer impact.

## Use multi-window multi-burn rate alerting for SLO breach detection
---
Category: Monitoring
---
Alert on error budget burn rate across 1-hour, 6-hour, and 24-hour windows simultaneously to catch both sudden spikes and gradual degradation.
---
Reason: A single window misses important patterns. A 1-hour window catches sudden spikes but may fire on brief, recoverable blips. A 24-hour window captures gradual degradation but may take too long to alert. Multi-window alerting ensures that both fast burn rates (investigate immediately) and slow burn rates (investigate within hours) trigger appropriate responses without noise from transient events.
---
Bad Example:
```bash
# Single window — misses slow burn or noisy
# 1-hour only: catches spikes, false alarms on brief blips
# 24-hour only: misses fast degradation until too late
```

Good Example:
```bash
# Multi-window: 1h, 6h, 24h
# 1h burn > 10x: critical — immediate investigation
# 6h burn > 5x: warning — investigate within the hour
# 24h burn > 2x: notice — review trend
```
---
Exceptions: Small teams with limited alert response capacity may start with a single window and add multi-window as the practice matures.
---
Consequences Of Violation: Missed slow-burn regressions (single short window) or delayed response to fast incidents (single long window).

## Review SLOs quarterly — they should evolve with user expectations and system capabilities
---
Category: Maintainability
---
Revisit each SLO target every quarter, comparing attainment against the target, and tighten or relax based on observed performance and user feedback.
---
Reason: As the system improves, SLOs that were challenging become trivial — they need tightening to remain meaningful. As user expectations evolve, SLOs that were acceptable become inadequate — they need adjustment to reflect current requirements. A quarterly review cycle ensures SLOs stay relevant without changing so frequently that the team cannot track progress.
---
Bad Example:
```text
# SLO set once, never reviewed
# 2024: p99 < 2000ms — challenging at the time
# 2026: still p99 < 2000ms — trivial, no improvement incentive
```

Good Example:
```text
# Quarterly review
# Q1 2026: p99 < 500ms (99.5%) — tightened from 1000ms
# Achieved: 99.7% attainment — ready to tighten again
```
---
Exceptions: Stable systems with unchanging requirements may extend reviews to semi-annual.
---
Consequences Of Violation: SLOs become either too loose (no improvement incentive) or too tight (constant alert fatigue), losing their operational value.
