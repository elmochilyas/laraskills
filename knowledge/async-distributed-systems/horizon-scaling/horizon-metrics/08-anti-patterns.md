---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K047 — Horizon Metrics (Throughput, Runtime, Wait Time)
Knowledge ID: K047
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Treating Wait Time as SLA Metric | Operations | Medium |
| 2 | Relying on Runtime Average | Observability | Medium |
| 3 | Not Exporting Metrics Externally | Architecture | Medium |
| 4 | Metric-Driven Auto-Scaling Based Only on Throughput | Performance | Medium |
| 5 | Ignoring Metrics After Horizon Restart | Operations | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Average-Only Monitoring | Medium — p95/p99 degradation invisible | Use percentiles for performance-critical monitoring |
| No External Metric Export | Medium — no historical trend data | Export to Pulse/Prometheus for weekly/monthly trends |
| 10s Granularity Blindness | Low — real-time events missed | Use event-based alerting for immediate notification |

---

## 1. Treating Wait Time as SLA Metric

### Category
Operations

### Description
Using Horizon's wait time metric as a guaranteed SLA measurement — relying on the exact numerical value for decision-making, alerting, and reporting, despite wait time being an estimate derived from average runtime, queue depth, and worker count.

### Why It Happens
- Wait time looks like a precise measurement (shown in milliseconds in the dashboard)
- Not reading the documentation stating wait time is an estimate
- Assuming Horizon's dashboard numbers are authoritative for SLA reporting
- Setting static thresholds based on wait time without understanding the formula
- No alternative SLA measurement system in place

### Warning Signs
- Alerts firing because of transient wait time spikes that don't correspond to actual user-facing delays
- SLA reports generated from Horizon wait time values
- Wait time shown as "0s" after Horizon restart — reported as 100% SLA compliance
- Confusion between "estimated wait time" and "actual processing time"
- Static wait time thresholds that trigger false alarms during normal operation

### Why Harmful
Wait time is calculated as: `(queue_size × average_runtime) / active_workers`. Both queue size and average runtime fluctuate — a single 10-second outlier job raises the average runtime, doubling wait time for the entire queue. The alert fires even though no user-facing delay exists, causing unnecessary escalation.

### Consequences
- False alarms desensitize the on-call team
- Real SLA violations masked by wait time noise
- Misleading SLA reports (wait time appears compliant while actual processing is delayed)
- Trust in monitoring erodes over time
- Alert fatigue when bursty queues with variable-duration jobs trigger constant alerts

### Alternative
- Use wait time for trend monitoring and relative comparisons, not absolute SLA tracking
- Track actual job processing time end-to-end for SLA measurement (job dispatched → job completed)
- Use rolling averages to smooth out noise
- Set thresholds relative to rolling baseline, not absolute values

### Refactoring Strategy
1. Identify all places where wait time is used as an absolute metric (alerts, dashboards, reports)
2. Replace static wait time thresholds with rolling average-based thresholds
3. Implement actual job completion time tracking for SLA purposes
4. Educate the team: wait time is a trend indicator, not an SLA guarantee
5. Monitor false alarm rate before and after the change

### Detection Checklist
- [ ] Wait time used for trend/relative comparison, not absolute SLA
- [ ] No static thresholds that don't account for runtime variance
- [ ] Rolling average-based alerting in place
- [ ] Actual job completion time tracked for SLA
- [ ] Team understands wait time estimation formula

### Related Rules
- use-wait-time-for-trends-not-slas

### Related Skills
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time

### Related Decision Trees
- Metric Collection Strategy for Queue Monitoring

---

## 2. Relying on Runtime Average

### Category
Observability

### Description
Using the arithmetic mean of job runtime as the primary performance indicator for queue health. The average runtime hides p95/p99 degradation — a few slow jobs increase the p99 significantly while the average stays low.

### Why It Happens
- Average is the default metric shown in Horizon dashboard
- Not implementing percentile-based monitoring (Pulse, Prometheus, custom logging)
- Assuming average is representative of typical job performance
- Not profiling individual job execution times
- Relying on Horizon's built-in metrics without supplementing

### Warning Signs
- Average runtime looks healthy (200ms) but users report intermittent delays
- P95 runtime is 5x-10x the average
- Horizon dashboard shows no anomaly in average runtime during incidents
- No percentile data collected or visualized
- "The average looks fine" dismisses performance complaints

### Why Harmful
A single 10s job in a sea of 100ms jobs (100 jobs) produces an average of ~200ms — the dashboard looks healthy. But every hundredth request experiences a 10-second delay. The average masks a significant p99 degradation. Performance regressions affecting a small percentage of jobs go undetected until they grow to affect more traffic.

### Consequences
- Silent p99 degradation — users experience intermittent delays while dashboard shows green
- Performance regressions not caught until they affect 25%+ of jobs
- Engineering time wasted investigating user reports that "the system is slow" with no dashboard evidence
- False sense of performance stability
- Delayed incident response — problem exists for hours/days before detection

### Alternative
- Monitor p95 and p99 runtime, not just average
- Use Pulse's `SlowJobs` recorder for built-in percentile tracking
- Export runtime percentiles to external monitoring (Prometheus, DataDog)
- Set alerts on p99 crossing thresholds

### Refactoring Strategy
1. Implement Pulse SlowJobs recorder for percentile runtime data
2. Set up external monitoring (Prometheus/DataDog) to track p95/p99 runtime
3. Create dashboards showing p50, p95, p99 overlays
4. Set alerts on p99 crossing defined thresholds
5. Retire "average runtime" as primary performance indicator

### Detection Checklist
- [ ] P95 and p99 runtime tracked and monitored
- [ ] Average runtime not used as sole performance indicator
- [ ] Pulse SlowJobs or equivalent percentile monitoring in place
- [ ] Alerts on p99 threshold crossing
- [ ] Performance review includes percentile data
- [ ] Team can identify p95/p99 degradation from dashboards

### Related Rules
- monitor-percentile-not-average

### Related Skills
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time

### Related Decision Trees
- Metric Collection Strategy for Queue Monitoring

---

## 3. Not Exporting Metrics Externally

### Category
Architecture

### Description
Relying solely on Horizon's built-in Redis-based metrics retention (default 1 hour) for all monitoring needs — no external export to time-series databases, monitoring platforms, or trend analysis tools.

### Why It Happens
- Not realizing Horizon only keeps 1 hour of metrics by default
- Assuming Horizon dashboard supports historical analysis
- Not having external monitoring infrastructure (Prometheus, Grafana, DataDog)
- Horizon dashboard looks comprehensive — doesn't feel like it's missing data
- Team doesn't need historical trends (short-sighted)

### Warning Signs
- Cannot view queue metrics from yesterday or last week in any tool
- Hourly metrics are trimmed — data older than 60 minutes is gone
- Capacity planning based on intuition rather than throughput growth trends
- Performance regression investigation can't compare "before deploy" vs "after deploy" data
- Weekly report uses screenshots of Horizon dashboard taken at different times

### Why Harmful
A gradual throughput decline over 3 days goes unnoticed — hourly metrics are trimmed after 60 minutes, leaving no data to compare current performance against last week's baseline. When a deploy causes a 10% throughput drop, the team has no historical data to confirm the regression. Capacity planning becomes guesswork because traffic growth trends are invisible after they roll out of the 1-hour window.

### Consequences
- No historical data for trend analysis
- Capacity planning is guesswork (no traffic growth trends)
- Performance regression detection is delayed (no before/after comparison)
- Post-mortem analysis lacks metric data from the incident period
- Compliance requirements for metric retention are not met

### Alternative
- Export Horizon metrics to external monitoring (Prometheus, DataDog, Grafana)
- Use Pulse for built-in Laravel metric aggregation
- Implement `horizon:snapshot` Artisan command for programmatic metric export
- Set up retention aligned with compliance/operational needs (30-90 days typical)

### Refactoring Strategy
1. Determine external monitoring target (Prometheus, DataDog, Pulse, Grafana)
2. Implement metric export — Pulse recorder, Prometheus exporter, or DataDog agent
3. Configure retention period for external storage
4. Create external dashboards showing trend data
5. Validate historical data is available for past 30+ days

### Detection Checklist
- [ ] Metrics exported to external storage (not just Redis)
- [ ] Historical data available for 30+ days
- [ ] Trend dashboards in external monitoring tool
- [ ] Capacity planning uses exported metric data
- [ ] Before/after deploy comparison possible

### Related Rules
- export-metrics-externally

### Related Skills
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time

### Related Decision Trees
- Metric Collection Strategy for Queue Monitoring

---

## 4. Metric-Driven Auto-Scaling Based Only on Throughput

### Category
Performance

### Description
Basing auto-scaling decisions solely on throughput (jobs per minute) without considering wait time or runtime. Throughput can remain high while wait time increases — the system is processing jobs quickly but not keeping up with the incoming rate.

### Why It Happens
- Throughput is the most visible metric in Horizon dashboard
- Confusing "busy workers" with "enough workers"
- Not understanding that throughput stays high even when backlog grows
- Assuming high throughput equals healthy queue processing
- Not monitoring queue depth alongside throughput

### Warning Signs
- Throughput chart shows high values but wait time is increasing
- Queue depth grows while throughput remains steady
- Workers are at 100% utilization — cannot process more even if queued
- Auto-scaling doesn't trigger because "throughput looks fine"
- New jobs wait longer but throughput per minute is unchanged

### Why Harmful
Throughput measures completed jobs per minute — a system at max capacity has high throughput but also high wait time. If auto-scaling only considers throughput, it never detects that the queue is backlogged. The system appears healthy (busy processing) while user-facing delays grow. Adding more workers (if possible) would increase throughput and reduce wait time, but the metric fails to trigger the scaling action.

### Consequences
- Auto-scaling doesn't fire during backlog build-up
- Wait time grows silently while throughput looks healthy
- User-facing delays increase without automatic response
- Operators manually intervene when wait time becomes visible (reactive, not automated)
- Scaling decisions based on wrong metric

### Alternative
- Use wait time as the primary auto-scaling trigger
- Combine throughput with wait time for comprehensive view
- Scale up when wait time exceeds threshold (regardless of throughput)
- Scale down when throughput decreases AND wait time is low (no backlog)

### Refactoring Strategy
1. Identify all auto-scaling rules that use throughput as the primary metric
2. Change primary scaling trigger to wait time thresholds
3. Use throughput as a secondary signal (trend indicator, not trigger)
4. Verify scaling behavior under load test
5. Monitor that scaling now correlates with wait time changes

### Detection Checklist
- [ ] Auto-scaling uses wait time as primary trigger
- [ ] Wait time monitored alongside throughput
- [ ] Scaling up triggers on wait time threshold, not throughput drop
- [ ] Throughput used for trend analysis, not scaling decisions
- [ ] Load test confirms wait time-based scaling responds to backlog

### Related Rules
- use-wait-time-for-trends-not-slas

### Related Skills
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time

### Related Decision Trees
- Metric Collection Strategy for Queue Monitoring

---

## 5. Ignoring Metrics After Horizon Restart

### Category
Operations

### Description
Not accounting for the fact that all Horizon metrics reset to zero after a restart or deploy. Wait time shows 0, runtime shows 0 — the system appears healthier than it is for 5-10 minutes until runtime data accumulates.

### Why It Happens
- Not knowing that metrics are ephemeral (stored in Redis, not persisted)
- Assuming metrics survive process restart
- Not noticing the 5-10 minute warmup period after each deploy
- Deploying frequently (multiple times per day) — the system never reaches stable metric state
- No post-restart monitoring in place

### Warning Signs
- Auto-scaler scales down processes after deploy (wait time = 0 → "no backlog")
- Queue backlog builds immediately after restart but wait time shows 0
- Runtime graphs show a dip to zero after each deploy
- Wait time alerts don't fire for 10 minutes after restart
- "Everything looks green" after deploy — but queues are growing

### Why Harmful
After a deploy, Horizon restarts with zero metrics. Wait time shows 0, the auto-balancer scales workers to minimum. Jobs accumulate for 5 minutes until runtime averages stabilize, causing a spike of late processing. The system is most vulnerable immediately after a restart — metrics are blind, and automatic responses are based on incorrect data (zero). This compounds the deployment risk: the deploy introduces new code AND the buffer of reliable metrics is gone.

### Consequences
- Post-deploy queue backlog as workers scale down in response to zero wait time
- Delayed detection of post-deploy regressions (metrics need to accumulate)
- Auto-scaler makes wrong decisions for 5-10 minutes after restart
- Deployment rollback decisions based on incomplete metric data
- False sense of health immediately after deploy

### Alternative
- Implement a warmup period after restart: no auto-scaling decisions for first 5 minutes
- Force wait time to a conservative value during warmup (e.g., use pre-restart baseline)
- Persist pre-restart metrics and restore them on restart
- Monitor queue depth as a leading indicator during the warmup period
- Deploy during low-traffic periods to minimize impact of blind window

### Refactoring Strategy
1. Implement warmup mode in auto-scaler (5-10 min after restart, no scaling down)
2. If possible, cache pre-restart metrics and seed them after restart
3. Monitor queue depth during warmup as a backup indicator
4. Alert if queue depth grows during warmup period
5. Review deploy schedules — avoid peak traffic for metric-reliant deployments

### Detection Checklist
- [ ] Warmup period implemented (no scaling decisions for 5-10 min after restart)
- [ ] Metrics reset is documented in deployment runbook
- [ ] Queue depth monitored during warmup period
- [ ] Auto-scaler does not scale down immediately after restart
- [ ] Load-balancer awareness of post-restart blind window

### Related Rules
- account-for-metrics-reset

### Related Skills
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time

### Related Decision Trees
- Metric Collection Strategy for Queue Monitoring
