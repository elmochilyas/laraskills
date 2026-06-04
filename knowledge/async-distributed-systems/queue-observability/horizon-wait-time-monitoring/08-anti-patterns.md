---
Domain: Async & Distributed Systems
Subdomain: Queue Observability
Knowledge Unit: K071 — Horizon Wait Time Monitoring and Alerts
Knowledge ID: K071
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Monitoring Queue Depth Instead of Wait Time | Observability | Medium |
| 2 | Static Threshold for All Queues | Operations | Medium |
| 3 | No External Alerting — Horizon Has No Built-In Alerts | Operations | Critical |
| 4 | Treating Wait Time as SLA Measurement | Operations | Medium |
| 5 | Ignoring Cold Start After Horizon Restart | Operations | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Depth-Only Monitoring | Medium — shallow queue with slow workers looks healthy | Monitor both depth AND wait time |
| No Alerting Outside Horizon | Critical — wait time spikes go undetected | Set up external monitoring (Pulse, Slack, PagerDuty) |
| No Post-Restart Warmup | High — wait time = 0, auto-scaler scales down | Suppress auto-scaling decisions for 5 min after restart |

---

## 1. Monitoring Queue Depth Instead of Wait Time

### Category
Observability

### Description
Using queue depth (number of pending jobs) as the primary queue health indicator instead of wait time. Depth is easier to measure but misleading — a shallow queue with slow workers has high wait time, and a deep queue with fast workers has low wait time.

### Why It Happens
- Depth is the most visible metric (shown prominently in Horizon)
- Wait time requires calculation (depth × avg_runtime / workers)
- Not understanding the relationship between depth and wait time
- Assuming depth always correlates with user-facing delay
- "Our queue depth is low, so everything is fine" — incorrect

### Warning Signs
- Queue health monitoring relies primarily on job count
- Auto-scaling decisions based on queue depth
- "Depth is normal" but users report processing delays
- Workers are saturated but depth is low (new jobs arrive and wait long)
- Horizon dashboard shows low depth but high wait time

### Why Harmful
Queue depth is 50 — looks manageable. But the jobs are running slow (5 seconds each) and there are only 2 workers. Wait time is `50 × 5 / 2 = 125 seconds`. Users wait 2+ minutes for their jobs to process. Depth says "healthy," wait time says "critical." Monitoring only depth means the ops team doesn't see the problem until someone reports slow processing.

### Consequences
- False sense of health: depth looks fine while users experience delays
- Auto-scaling doesn't fire (depth threshold not crossed)
- Wait time grows silently until users complain
- Capacity planning based on depth underestimates needed workers
- Incident response is reactive (user reports) instead of proactive (wait time alert)

### Alternative
- Monitor BOTH depth and wait time:
  - Wait time = user-facing latency (the real metric)
  - Depth = operational metric (capacity planning)
- Use wait time for auto-scaling decisions
- Alert on wait time thresholds, not depth thresholds
- Investigate: wait time increasing + depth constant = workers too slow; wait time increasing + depth increasing = not enough workers

### Refactoring Strategy
1. Audit current queue monitoring: is it depth-based or wait-time-based?
2. Add wait time to all queue dashboards and alerts
3. Change auto-scaling triggers from depth to wait time
4. Educate team: wait time = user-facing metric, depth = operational metric
5. Verify: auto-scaling now responds to wait time changes

### Detection Checklist
- [ ] Wait time is the primary queue health metric
- [ ] Depth used as secondary (operational) metric
- [ ] Auto-scaling uses wait time, not depth
- [ ] Alerts based on wait time thresholds
- [ ] Team distinguishes depth vs wait time

### Related Rules
- monitor-wait-time-trends-not-spikes, use-wait-time-for-autoscaling

### Related Skills
- Monitor Horizon Wait Time and Set Alerts

### Related Decision Trees
- Wait Time Alert Threshold Strategy

---

## 2. Static Threshold for All Queues

### Category
Operations

### Description
Using a single static wait time threshold (e.g., "alert if wait > 300 seconds") for all queues regardless of their priority, SLA, or normal operating range. Different queues have different acceptable wait times — one threshold fits none.

### Why It Happens
- Setting up monitoring quickly without per-queue analysis
- Not knowing each queue's business SLA
- "300 seconds sounds reasonable" — applied to all queues
- Copying threshold from another project without adjustment
- Not reviewing thresholds after the initial setup

### Warning Signs
- All queues share the same wait time alert threshold
- Critical queue (password resets) and bulk queue (emails) have identical thresholds
- "We use the same threshold for everything" — never adjusted
- False positives on bulk queues during normal batch processing
- Missed alerts on critical queues (threshold is too high for them)

### Why Harmful
The threshold is set to 300 seconds (5 minutes). A critical password-reset queue normally processes in 10 seconds — by the time it hits 300 seconds, users have already waited 5 minutes for a time-sensitive email. The bulk email queue accepts 10-minute processing delays — but it alerts at 5 minutes, triggering false alarms during normal batch operations. One threshold is simultaneously too tight (causing false alarms) and too loose (missing critical SLA breaches).

### Consequences
- Critical queues: alerts fire too late (SLA already violated)
- Bulk queues: false alarms from normal operation (alert fatigue)
- On-call desensitization: all alerts look the same, urgency is lost
- Engineering time wasted investigating false alarms on bulk queues
- Compliance risk: SLA violations for critical queues go undetected
- Alert fatigue: on-call starts ignoring all queue alerts

### Alternative
- Set per-queue thresholds based on business SLA:
  ```php
  // Critical queue: 60 seconds
  if ($waitTime['password-reset'] > 60) { alert('critical'); }
  
  // Standard queue: 5 minutes
  if ($waitTime['default'] > 300) { alert('warning'); }
  
  // Bulk queue: 30 minutes
  if ($waitTime['emails'] > 1800) { alert('info'); }
  ```
- Use dynamic baselines: rolling 7-day average to detect anomalies per queue

### Refactoring Strategy
1. Document SLA for each queue (acceptable processing time)
2. Set wait time thresholds per queue (50% of SLA for warning, 80% for critical)
3. Use rolling baselines for pattern-based alerting
4. Monitor false alarm rate — expect reduction
5. Review thresholds quarterly

### Detection Checklist
- [ ] Per-queue wait time thresholds configured
- [ ] Thresholds align with business SLAs
- [ ] Rolling baselines used (not static where pattern varies)
- [ ] False alarm rate is low
- [ ] Critical queues alert before SLA is violated

### Related Rules
- monitor-wait-time-trends-not-spikes

### Related Skills
- Monitor Horizon Wait Time and Set Alerts

### Related Decision Trees
- Wait Time Alert Threshold Strategy

---

## 3. No External Alerting — Horizon Has No Built-In Alerts

### Category
Operations

### Description
Relying solely on the Horizon dashboard for queue monitoring without configuring external alerting. Horizon displays wait time metrics but has no built-in alerting — wait time spikes are only visible if someone is watching the dashboard.

### Why It Happens
- Not knowing Horizon lacks alerting
- Assuming Horizon's dashboard would notify on issues (it shows metrics, doesn't alert)
- Using Horizon as the only monitoring tool
- Not setting up external monitoring (Pulse, Prometheus, PagerDuty)
- "We check the dashboard regularly" — not sufficient for incident response

### Warning Signs
- Horizon dashboard is the only queue monitoring
- No alerts configured for wait time thresholds
- "We look at Horizon when we suspect issues" — reactive, not proactive
- Queue issues discovered during post-mortem: "wait time was high for hours"
- No integration with PagerDuty, Slack, or other alerting tools

### Why Harmful
A database outage causes a queue backlog at 2 AM. Wait time climbs from 5 seconds to 5 minutes over 30 minutes. No one is watching the Horizon dashboard at 2 AM. The issue is discovered at 8 AM when a developer checks the dashboard. 6 hours of queue backlog accumulated because there was no alerting to wake up the on-call engineer. Horizon displayed the problem clearly — but only if someone was looking.

### Consequences
- Queue issues go undetected for hours (especially overnight)
- Incident response is reactive: users report problems before ops notices
- Backlog accumulates undetected, extending recovery time
- SLA violations from delayed detection
- On-call team only learns about issues from user complaints
- Trust erosion: "our queue monitoring is just a dashboard"

### Alternative
- Set up external alerting that monitors Horizon's Redis metrics:
  - Pulse with custom recorder tracking wait time
  - Prometheus scraping Horizon snapshots
  - Custom script polling Horizon Redis keys
  - PagerDuty/Slack integration triggered by wait time thresholds
- Example with Pulse:
  ```php
  // Wait time — sample every 30 seconds
  $waitTime = // read from Horizon metrics
  if ($waitTime > $threshold) {
      Alert::send("Queue wait time exceeded: {$queue} = {$waitTime}s");
  }
  ```

### Refactoring Strategy
1. Choose external monitoring tool (Pulse, Prometheus, custom script)
2. Implement alerting based on wait time thresholds
3. Configure notification channels (Slack for warnings, PagerDuty for critical)
4. Test: simulate queue backlog, verify alert fires
5. Remove reliance on dashboard-only monitoring

### Detection Checklist
- [ ] External alerting configured for wait time thresholds
- [ ] Horizon dashboard is NOT the only monitoring tool
- [ ] On-call receives alerts for queue issues
- [ ] Alert delivery tested (Slack/PagerDuty working)
- [ ] No reliance on "someone watching the dashboard"

### Related Rules
- use-wait-time-for-autoscaling

### Related Skills
- Monitor Horizon Wait Time and Set Alerts

### Related Decision Trees
- Wait Time Alert Threshold Strategy

---

## 4. Treating Wait Time as SLA Measurement

### Category
Operations

### Description
Using Horizon's calculated wait time as a guaranteed SLA metric for compliance reporting or customer-facing SLAs. Wait time is an estimate derived from average runtime — it is not a measurement of actual job processing time.

### Why It Happens
- Wait time looks like a precise measurement (displayed in milliseconds)
- SLA requirements exist but no actual job timing instrumentation
- Assuming Horizon's estimate is accurate enough for reporting
- Not implementing actual job queued-at → processed-at tracking
- "Horizon says the wait time is 30 seconds, our SLA is 60 seconds" — false confidence

### Warning Signs
- SLA reports generated from Horizon wait time values
- "Our SLA compliance is 99.9% based on wait time" — using estimated metric
- Actual job processing time not tracked or monitored
- Wait time estimate conflicts with actual user experience
- Compliance audit: "how do you measure processing time?" — "Horizon dashboard"

### Why Harmful
Wait time is calculated as `(depth × avg_runtime) / workers` — an estimate that can be significantly wrong. A single 60-second outlier job doubles the average runtime, making wait time jump from 100s to 200s. The SLA report shows a breach — but all other jobs processed within 10 seconds. The false SLA breach triggers an unnecessary investigation. Conversely, wait time can look compliant while actual processing is delayed (runtime outliers in the other direction).

### Consequences
- Incorrect SLA compliance reporting
- False SLA breach investigations
- Missed actual SLA breaches (wait time looks fine but users are waiting)
- Compliance audit findings: "your SLA measurement methodology is flawed"
- Customer disputes: "your SLA report doesn't match our experience"
- Trust erosion: operations team doesn't trust the SLA numbers

### Alternative
- Use actual job processing time for SLA measurement:
  ```php
  // Track actual time from queue to processing
  class MonitoredJob implements ShouldQueue
  {
      public function handle(): void
      {
          $queuedAt = $this->job->getRawBody()['queued_at'] ?? null;
          if ($queuedAt) {
              $waitTime = microtime(true) - $queuedAt;
              Metrics::record('job_wait_time', $waitTime, ['job' => static::class]);
          }
      }
  }
  ```
- Use Pulse or Prometheus for actual timing
- Wait time = trend indicator; actual time = SLA metric

### Refactoring Strategy
1. Implement actual job timing (queued_at → processing_start)
2. Use actual timing for SLA reports and compliance
3. Keep wait time as a trend indicator for operational monitoring
4. Update SLA documentation: wait time is trend, actual time is SLA
5. Create separate dashboards: operational (wait time) and SLA (actual time)

### Detection Checklist
- [ ] SLA compliance measured with actual job timing, not wait time
- [ ] Wait time used as trend indicator only
- [ ] Actual job timing implemented (queued_at → processing_start)
- [ ] SLA reports reflect actual measurement methodology
- [ ] Team distinguishes wait time (estimate) from actual time (measured)

### Related Rules
- understand-wait-time-limitations

### Related Skills
- Monitor Horizon Wait Time and Set Alerts

### Related Decision Trees
- Wait Time Alert Threshold Strategy

---

## 5. Ignoring Cold Start After Horizon Restart

### Category
Operations

### Description
Not accounting for the fact that wait time resets to zero after a Horizon restart. All metrics are cleared — wait time shows 0 for all queues until runtime data accumulates (5-10 minutes). Auto-scalers may scale down in response to zero wait time, creating a backlog.

### Why It Happens
- Not knowing metrics reset on restart
- Assuming wait time persists across restarts
- No warmup logic in auto-scaling (suppress for first N minutes)
- Deploying during peak hours (worst time for metric reset)
- "Wait time is zero, everything looks good!" — incorrect after restart

### Warning Signs
- After deploy: auto-scaler scales processes to minimum
- Wait time shows 0 for 5-10 minutes after restart
- Queue backlog grows immediately after deploy
- "We deployed and everything slowed down" — wait time was blind
- Process count graph: sharp drop after restart (workers scaled down)

### Why Harmful
After a deploy, Horizon restarts. Wait time is 0 for all queues — the auto-scaling system scales all workers to `minProcesses`. But 100,000 jobs are queued from the deploy downtime. Workers start processing at minimum capacity, building a backlog that takes 30 minutes to clear. The system is most vulnerable immediately after a restart — metrics are blind, and the auto-scaler makes the wrong decision (scale down).

### Consequences
- Post-deploy queue backlog (wait time = 0 → scale down → backlog grows)
- Delayed recovery: backlog takes 30+ minutes to clear
- Increased user-facing latency during recovery
- False sense of health: "wait time is zero"
- Engineers confuse: "why is wait time low but nothing is processing?"
- Deploy rollback decisions based on faulty metric data

### Alternative
- Implement a warmup period after restart:
  ```php
  // Suppress auto-scaling for first 5 minutes after restart
  if (now()->diffInMinutes($horizonStartedAt) < 5) {
      return; // Wait for metrics to stabilize
  }
  ```
- Or force wait time to a conservative value during warmup
- Use queue depth as a backup metric during warmup (depth doesn't reset)
- Deploy during low-traffic periods to minimize impact

### Refactoring Strategy
1. Identify auto-scaling or alerting that uses wait time
2. Add warmup suppression: no scaling decisions for 5 minutes after restart
3. Alternatively: seed wait time with pre-restart baseline
4. Monitor queue depth during warmup as a leading indicator
5. Document wait time reset in deploy runbook

### Detection Checklist
- [ ] Warmup period implemented (no scaling decisions for 5 min after restart)
- [ ] Queue depth monitored during warmup (as backup metric)
- [ ] Auto-scaler does not scale down after restart
- [ ] Deploy runbook documents wait time reset
- [ ] No post-deploy backlog from scaling down

### Related Rules
- account-for-cold-start-after-restart

### Related Skills
- Monitor Horizon Wait Time and Set Alerts

### Related Decision Trees
- Wait Time Alert Threshold Strategy
