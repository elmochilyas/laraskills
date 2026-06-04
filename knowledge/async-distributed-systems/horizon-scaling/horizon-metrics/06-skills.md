# Skill: Monitor Horizon Metrics — Throughput, Runtime, Wait Time

## Purpose
Use Horizon's built-in metrics (throughput, runtime, wait time) to monitor queue health, detect performance regressions, and inform capacity planning.

## When To Use
Reactive capacity scaling — wait time spike triggers investigation; performance regression detection — runtime increase after deploy; capacity planning — throughput growth trends; operational dashboards.

## When NOT To Use
Real-time alerting (snapshot-based, 10s granularity); SLA measurement (wait time is estimated); long-term trend analysis (default 1-hour retention); debugging individual job issues (averages hide outliers).

## Prerequisites
- Horizon running and collecting metrics
- Access to Horizon dashboard

## Inputs
- Queue names to monitor
- Baseline values per queue

## Workflow
1. Monitor wait time per queue — best indicator of processing health
2. Use wait time for trends, not absolute SLAs (it's an estimate)
3. Monitor runtime anomalies with p95/p99, not just average
4. Export metrics externally (Pulse, Prometheus) for long-term trends
5. Account for metrics reset after Horizon restart (5-10 minute warmup)
6. Use rolling average baselines, not static thresholds
7. Combine with resource monitoring (CPU, memory, DB) for root cause

## Validation Checklist
- [ ] Wait time monitored per queue with per-queue thresholds
- [ ] Runtime monitored with percentiles (not just average)
- [ ] Metrics exported externally for long-term trends
- [ ] Metrics reset after restart accounted for
- [ ] Rolling baselines used (not static thresholds)
- [ ] Wait time used for trend, not SLA compliance
- [ ] Root cause investigation combines metrics + resource data

## Common Failures
- Treating wait time as SLA — it's an estimate, not guaranteed
- Relying on runtime average — p95/p99 issues hidden
- Not extending metrics retention — no historical trend data
- Assuming metrics are real-time — 10-second lag
- Ignoring metrics reset after restart — 5-10 minute blind spot

## Decision Points
- Capacity scaling: wait time trend
- Performance regression: runtime percentile change
- Long-term analysis: external export (Prometheus, DataDog)

## Related Rules
- Rule 1: use-wait-time-for-trends-not-slas
- Rule 2: monitor-percentile-not-average
- Rule 3: export-metrics-externally
- Rule 4: account-for-metrics-reset

## Related Skills
- Monitor Horizon Wait Time and Set Alerts
- Configure Custom Pulse Recorders for Queue Depth
- Configure Pulse SlowJobs Recorder

## Success Criteria
Wait time is monitored per queue with rolling baselines, runtime percentiles catch anomalies, metrics are exported externally, and post-restart metrics reset is accounted for.
