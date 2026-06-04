# Skill: Monitor Horizon Wait Time and Set Alerts

## Purpose
Track Horizon wait time per queue as a trend indicator for queue health, and supplement with external monitoring for alerting (Horizon has no built-in alerting).

## When To Use
Capacity planning — wait time trends determine when to add/remove workers; anomaly detection — spikes indicate worker failures or dispatch surges; baseline establishment for tuning.

## When NOT To Use
SLA compliance measurement (wait time is estimated, not measured); per-job latency tracking (use actual queue time from job metadata); short-term spikes below baseline.

## Prerequisites
- Horizon metrics collecting (snapshot every minute)
- Access to Horizon Redis metrics or dashboard

## Inputs
- Queue names to monitor
- Rolling average baseline (e.g., 5-minute)

## Workflow
1. Monitor wait time per queue as a trend, not an absolute value
2. Use rolling average baselines: alert when wait time > baseline × 2
3. Supplement with external monitoring (Pulse, Prometheus, PagerDuty) — Horizon has no alerting
4. Understand wait time vs queue depth: depth × avg_runtime / workers = estimate
5. Use actual job processing time for SLA compliance (not wait time)
6. Investigate wait time spikes with resource monitoring (CPU, Redis, DB)
7. Wait time increasing + throughput constant = worker shortage

## Validation Checklist
- [ ] Wait time monitored per queue (not global average)
- [ ] Rolling average baseline used (not static threshold)
- [ ] External monitoring supplements Horizon (Pulse/Prometheus)
- [ ] SLA compliance uses actual timing, not estimated wait time
- [ ] Wait time investigated with resource context (CPU, Redis, DB)
- [ ] Wait time alert threshold > normal baseline × 2
- [ ] Understands wait time = depth × avg_runtime / workers

## Common Failures
- Treating wait time as SLA metric — it's an estimate
- False alarms from transient spikes — use rolling baselines
- No external monitoring — Horizon shows metrics but doesn't alert
- Ignoring wait time trend — gradual increase unnoticed until jobs back up
- Alert threshold too tight — constant false alarms, alert fatigue

## Decision Points
- Trend alert: wait time > baseline × 2 for 5 minutes
- Critical alert: wait time > business SLA (actual measurement)
- Capacity planning: wait time + throughput growth trend

## Related Rules
- Rule 1: monitor-wait-time-trends-not-spikes
- Rule 2: understand-wait-time-limitations
- Rule 3: use-actual-timing-for-sla
- Rule 4: combine-with-resource-monitoring

## Related Skills
- Configure Horizon Notifications for Wait Time Alerts
- Configure Pulse SlowJobs Recorder
- Build Custom Pulse Recorders for Queue Observability

## Success Criteria
Wait time is monitored per queue with rolling average baselines, external monitoring provides alerting, SLA uses actual job timing, and wait time investigations include resource context.
