## Use adaptive sampling — low frequency (1-5 Hz) during normal operation, high frequency (50-100 Hz) during incidents
---
Category: Monitoring
---
Configure continuous profiling to sample at 1-5 Hz during normal operation and automatically increase to 50-100 Hz when an SLO breach alert fires on the affected hosts.
---
Reason: Continuous profiling at 99 Hz on all hosts adds 5-10% CPU overhead — too expensive for always-on use. At 1-5 Hz, overhead is <2% and provides sufficient data for baseline comparison. Burst sampling at 50-100 Hz during incidents captures detailed flame graphs for diagnosis while limiting the overhead cost to the incident window. The adaptive approach minimizes cost while ensuring diagnostic data is available when needed.
---
Bad Example:
```bash
# Always-on high frequency — unnecessary overhead
# 99 Hz on all hosts, 24/7 — 5-10% CPU waste
```

Good Example:
```bash
# Adaptive sampling
# Normal: 1 Hz baseline on all hosts (<2% overhead)
# Incident: auto-increase to 99 Hz on affected hosts
# Post-incident: return to 1 Hz
```
---
Exceptions: Security-critical systems where any profiling overhead is unacceptable may use eBPF at 1 Hz only or omit profiling entirely.
---
Consequences Of Violation: Unnecessary 5-10% CPU overhead across all hosts during normal operation (high frequency) or missing diagnostic data during incidents (low frequency only).

## Establish baseline profiles during normal operation before incidents occur
---
Category: Monitoring
---
Run continuous profiling at 1-5 Hz on all production hosts at all times to establish baseline behavior — never start profiling only when investigating an incident.
---
Reason: Without baseline profiles, burst profiles captured during an incident have no reference point. A flame graph showing high CPU in a certain function during an incident is meaningless unless you know that function normally uses 5% of CPU, not 40%. Baselines enable differential analysis — comparing what changed during the incident versus normal operation. Without baselines, you have data but no context.
---
Bad Example:
```bash
# No baselines — can't tell what changed
# Incident profile shows QueryBuilder at 60% CPU
# But is that normal for this time of day? Unknown.
```

Good Example:
```bash
# Baseline available
# Baseline: QueryBuilder at 5% CPU during normal operation
# Incident: QueryBuilder at 60% CPU — clear regression detected
```
---
Exceptions: Development or staging environments where production-like baselines are available may skip always-on production profiling.
---
Consequences Of Violation: Incident profiles show what is slow but cannot answer "what changed" — root cause analysis takes longer.

## Exclude health check and monitoring traffic from profiling data
---
Category: Monitoring
---
Configure profiling tools to filter out health check endpoints, monitoring probes, and load balancer pings — profile only user-facing traffic.
---
Reason: Health checks generate regular, repetitive traffic that dilutes profiling data. If 20% of all requests are health checks, then 20% of profile samples show health check code paths rather than real user behavior. Over time, the baseline profile shifts to represent health check patterns, making it harder to detect user-facing regressions. Filtering health checks keeps profiles representative.
---
Bad Example:
```bash
# Health checks included — 20% of profile data is non-representative
# Profile shows RoutingServiceProvider at 10% — mostly from health check requests
```

Good Example:
```bash
# Health checks excluded — all profile data is user traffic
# Profile accurately reflects user-facing performance
```
---
Exceptions: When investigating a health-check-specific performance issue, include health checks in a targeted profiling session.
---
Consequences Of Violation: Profiling data diluted with non-representative traffic, baseline profiles skewed toward health check patterns, user-facing regressions harder to detect.

## Integrate burst profiling with alerting — trigger high-frequency sampling automatically from SLO breach alerts
---
Category: Monitoring
---
Configure the monitoring system to send a webhook or API call to the profiling agent when an SLO breach alert fires, triggering burst sampling on the affected hosts.
---
Reason: Manual profiling during an incident requires someone to notice the alert, access the profiling tool, enable burst mode, and wait for data. This takes 2-5 minutes — long enough to miss the initial onset of the incident. Automatic triggering captures the flame graph from the first moment of the breach, including the transition from normal to degraded behavior that is often the most diagnostic.
---
Bad Example:
```bash
# Manual profiling during incident — 5-minute delay
# 09:00: Alert fires
# 09:05: Engineer enables profiling — missed the transition
```

Good Example:
```bash
# Automatic burst profiling
# 09:00: Alert fires → auto-enabled burst profiling on affected hosts
# 09:00: First burst profile captures the initial degradation
```
---
Exceptions: Non-critical services with slower incident response expectations may use manual triggering.
---
Consequences Of Violation: Missed diagnostic window during incident onset, profiles start after the most interesting behavior has already occurred.

## Store profiles for 30+ days for historical comparison and trend analysis
---
Category: Maintainability
---
Configure profile retention for at least 30 days to enable week-over-week and month-over-month comparison of performance characteristics.
---
Reason: Performance regressions often develop gradually over weeks, not suddenly. A function that adds 2% CPU per week will cause 50% regression in 6 months — but is invisible in any single profile. Weekly profile comparison reveals the trend. Thirty-day retention also supports post-mortem analysis of incidents that may not be investigated immediately.
---
Bad Example:
```bash
# 7-day retention — can't see weekly trends
# Week 1: QueryBuilder at 10% CPU
# Week 2: Profile expired — no comparison possible
```

Good Example:
```bash
# 30-day retention — trend analysis possible
# Week 1: QueryBuilder at 10% CPU
# Week 2: QueryBuilder at 12% CPU (+20% WoW)
# Week 3: QueryBuilder at 15% CPU — trend identified and investigated
```
---
Exceptions: Storage-constrained environments may use 14-day retention for raw profiles and 90-day for aggregated/summarized data.
---
Consequences Of Violation: Gradual performance regressions undetected for weeks, root cause lost when profiles expire before investigation.
