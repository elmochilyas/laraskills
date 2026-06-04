---
Domain: Async & Distributed Systems
Subdomain: Queue Observability
Knowledge Unit: K070 — Laravel Pulse SlowJobs Recorder
Knowledge ID: K070
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Threshold Too Low (200ms) — Every Job Flagged | Operations | Medium |
| 2 | Not Ignoring Known Slow Jobs | Observability | Medium |
| 3 | Alerting on Raw Slow Job Count Instead of Percentile | Operations | Medium |
| 4 | Confusing Slow with Failed Jobs | Observability | Low |
| 5 | No Resource Correlation | Observability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Overly Aggressive Threshold | Medium — dashboard becomes noise | Start high (2-3s), tune downward |
| Known-Slow Job Noise | Medium — expected-slow jobs hide real outliers | Use `ignore_after` to filter expected-slow jobs |
| Raw Count Alerting | Medium — false alarms from traffic volume changes | Alert on percentile (p95/p99) |

---

## 1. Threshold Too Low (200ms) — Every Job Flagged

### Category
Operations

### Description
Setting the Pulse slow job threshold too low (e.g., 200ms) without calibration. Network calls, database queries, and cache operations add baseline latency — most jobs will exceed the threshold, flooding the dashboard with noise.

### Why It Happens
- Using default threshold without calibration
- Assuming any job over "instant" should be flagged
- Not measuring normal job execution times first
- Copying threshold from a benchmark environment (no network latency, no DB)
- "I want to catch every slow job" — catches everything, identifies nothing

### Warning Signs
- Pulse "Slow Jobs" card shows 80%+ of jobs as slow
- Every job type appears in the slow jobs list
- The dashboard is always full — no signal, all noise
- Team stops looking at the slow jobs card (too much noise)
- "We have 500 slow jobs per minute" — that's most of the traffic

### Why Harmful
The threshold is 200ms. Every email job that makes an SMTP call (500ms), every webhook job that makes an HTTP call (300ms), and every job that queries the database (150ms) is flagged as "slow." The dashboard shows hundreds of slow jobs per minute — but they're all normal. The team learns to ignore the slow jobs card entirely. When a genuinely slow job appears (a report taking 60 seconds), it's buried in the noise of hundreds of "normal slow" jobs.

### Consequences
- Dashboard becomes noise — no actionable signal
- Team ignores the slow jobs card entirely
- Genuine performance regressions hidden in the noise
- Alert fatigue: "slow jobs are always high"
- Engineering time wasted investigating false positives
- Pulse slow jobs feature becomes useless

### Alternative
- Start with a high threshold (2-3 seconds) and tune downward:
  ```php
  // Start: 3000ms — only genuinely slow jobs flagged
  'threshold_ms' => 3000,
  ```
- Calibrate: measure normal job execution times, set threshold at 3x normal max
- Adjust: if too many false positives, raise threshold; if too few, lower
- Aim for: 1-5% of jobs flagged as slow (meaningful outliers)

### Refactoring Strategy
1. Audit current threshold setting
2. Measure normal job execution time distribution per queue
3. Set threshold to 3x the p95 of normal execution time
4. Monitor: slow job count should be 1-5% of total jobs
5. Tune downward if too few slow jobs are caught

### Detection Checklist
- [ ] Threshold calibrated to job type (not arbitrary default)
- [ ] Slow job rate is 1-5% of total jobs (not 80%+)
- [ ] Dashboard shows meaningful outliers, not normal variance
- [ ] Team trusts the slow jobs card
- [ ] Threshold tuned per-queue where durations differ significantly

### Related Rules
- set-appropriate-slow-job-threshold

### Related Skills
- Configure Pulse SlowJobs Recorder

### Related Decision Trees
- Slow Job Threshold Definition

---

## 2. Not Ignoring Known Slow Jobs

### Category
Observability

### Description
Not using the `ignore_after` callback to exclude expected-slow jobs (report generation, batch exports, file processing) from Pulse monitoring. These jobs always exceed the threshold — they drown out the signal from anomalously slow jobs.

### Why It Happens
- Not knowing `ignore_after` exists
- Assuming all jobs should be monitored equally
- Not considering that some jobs are inherently slow and that's acceptable
- "We want to see ALL slow jobs" — including the ones that are supposed to be slow
- Not configuring the recorder's ignore list

### Warning Signs
- Report generation jobs always appear in Pulse slow jobs
- Batch export jobs are consistently flagged (they take 30-60 seconds as designed)
- "We know those are slow, they're always there" — but they're in the dashboard
- The top 5 slowest jobs are always the same expected-slow jobs
- New performance regressions in fast jobs are invisible (buried by expected-slow jobs)

### Why Harmful
A report generation job that takes 60 seconds (by design) appears at the top of the Pulse slow jobs list every hour. A cache warming job that normally takes 200ms now takes 5 seconds (regression) — but it's at position 15 in the list, below 14 entries of expected-slow batch jobs. The team reviews the Pulse slow jobs card, sees the same expected names every day, and stops looking carefully. The regression goes unnoticed for a week.

### Consequences
- Expected-slow jobs dominate the dashboard
- Real performance regressions in fast jobs are invisible
- Team becomes desensitized: "those jobs are always slow"
- Wasted investigation time: checking expected-slow jobs repeatedly
- False confidence: "we monitor slow jobs" — but the monitoring is useless
- Delayed detection of actual performance degradation

### Alternative
- Use `ignore_after` to filter expected-slow jobs:
  ```php
  'recorders' => [
      SlowJobs::class => [
          'threshold_ms' => 3000,
          'ignore_after' => function (object $event) {
              return $event->job === 'App\Jobs\GenerateMonthlyReport'
                  || str_starts_with($event->job, 'App\Jobs\Export\\');
          },
      ],
  ],
  ```
- Create separate recorder instances for different job duration profiles

### Refactoring Strategy
1. Identify all expected-slow job classes (reports, exports, batch processing)
2. Add them to `ignore_after` callback
3. Create a separate recorder for slow-expected jobs with a higher threshold (if needed)
4. Monitor: slow job card should now show anomalously slow jobs, not expected slow ones
5. Document the ignore list and review quarterly

### Detection Checklist
- [ ] Expected-slow jobs are excluded via `ignore_after`
- [ ] Dashboard shows anomalously slow jobs, not expected slow ones
- [ ] Separate recorder exists for expected-slow jobs (if monitoring needed)
- [ ] Ignore list is documented
- [ ] Team can now see performance regressions in normally-fast jobs

### Related Rules
- set-appropriate-slow-job-threshold

### Related Skills
- Configure Pulse SlowJobs Recorder

### Related Decision Trees
- Slow Job Threshold Definition

---

## 3. Alerting on Raw Slow Job Count Instead of Percentile

### Category
Operations

### Description
Setting alerts based on the raw count of slow jobs rather than the percentile (p95/p99). Raw count increases with traffic volume — a 10x traffic spike naturally produces 10x slow jobs, even if the percentage of slow jobs remains constant.

### Why It Happens
- Raw count is easier to understand than percentiles
- Not considering traffic volume normalization
- "50 slow jobs per minute is too many" — but what's the traffic volume?
- Static threshold that makes sense at normal traffic becomes noise at peak
- Not implementing percentile-based monitoring

### Warning Signs
- Alert: "Slow job count > 50" fires during peak traffic
- During off-peak, slow job count is 10 — at peak, it's 100 (but percentage is the same)
- "Our slow job alerts only fire during peak hours" — traffic-driven, not issue-driven
- Alarm fatigue: peak hour alerts ignored (they always fire)
- P95 runtime is stable but raw count keeps triggering alerts

### Why Harmful
During Black Friday, traffic is 10× normal — slow job count hits 100 (normally 10). The alert fires. But p95 runtime is 1 second (normal). The system is healthy — raw count was a misleading metric. The on-call team investigates, finds nothing wrong, and resets the alert. After the 3rd such false alarm during peak season, they disable the alert entirely. Two weeks later, a genuine spike in p95 runtime (5 seconds) goes undetected.

### Consequences
- False alarms during peak traffic (traffic-driven, not issue-driven)
- Alert fatigue: on-call ignores slow job alerts
- Alerts disabled or tuned too high (miss genuine issues)
- Ops time wasted investigating normal peak behavior
- No traffic-normalized view of slow job rate

### Alternative
- Alert on percentile (p95/p99) rather than raw count:
  ```php
  // BAD — alerts on raw count (traffic-dependent)
  if ($slowJobCount > 50) { alert(); }
  
  // GOOD — alerts on percentile (traffic-normalized)
  if ($p95Runtime > 5000) { alert(); }
  ```
- Or alert on percentage: "> 5% of jobs exceed the threshold"
- Pulse's aggregation captures min, max, and avg — use these for percentile estimation

### Refactoring Strategy
1. Audit current slow job alerting: raw count or percentile?
2. Change to percentile-based alerting (p95/p99)
3. If Pulse doesn't provide percentiles: use raw count normalized to traffic volume
4. Set threshold: p95 > 5 seconds (or 3x normal p95)
5. Test: during peak traffic, alert should not fire unless actual degradation occurs

### Detection Checklist
- [ ] Alerts use percentile (p95/p99) or percentage, not raw count
- [ ] No traffic-dependent false alarms
- [ ] Slow job rate is monitored (not just absolute count)
- [ ] Pulse configured to provide percentile data
- [ ] Alert threshold adjusted for traffic-normalized view

### Related Rules
- set-appropriate-slow-job-threshold

### Related Skills
- Configure Pulse SlowJobs Recorder

### Related Decision Trees
- Pulse Slow Jobs vs Custom Monitoring

---

## 4. Confusing Slow with Failed Jobs

### Category
Observability

### Description
Treating slow jobs and failed jobs as the same category for monitoring and debugging. A slow job may be processing correctly — slowness is a performance issue, while failure is a correctness issue. They have different root causes and require different responses.

### Why It Happens
- Dashboard groups "problem jobs" together
- Not distinguishing between performance (slow) and correctness (failed)
- Using the same alerting channel for both slow and failed jobs
- Adding failed job monitoring to the SlowJobs dashboard (or vice versa)
- "A slow job is a problem" — true, but different problem than failure

### Warning Signs
- Incident response: "we have 50 slow jobs" — but they're all failing or all succeeding?
- Slow jobs and failed jobs monitored and alerted identically
- No differentiation between "taking too long" and "not completing"
- Post-mortem: "the slow job turned out to be a failure" — confusion in terminology
- Team discusses slow jobs and failed jobs interchangeably

### Why Harmful
A slow job and a failed job both need attention — but the responses are different. A slow job (taking 60 seconds, but completing) suggests a performance optimization opportunity or a need to increase timeout. A failed job suggests a bug, exception, or infrastructure issue. Treating them the same means:
- The slow job gets an urgent investigation (should be performance review)
- The failed job gets a casual review (should be urgent bug fix)
Resources are allocated incorrectly, and response times are wrong for both.

### Consequences
- Misallocation of investigation resources
- Slow jobs treated as urgent incidents (incorrect)
- Failed jobs treated as performance issues (incorrect)
- Confusion in post-mortems: "was it slow or did it fail?"
- Inconsistent alerting: wrong urgency for each category
- Engineers context-switching between two different problem types

### Alternative
- Monitor slow jobs and failed jobs separately:
  - **Slow jobs:** Performance dashboard, p95/p99 tracking, weekly review
  - **Failed jobs:** Incident alerting, per-failure notification, immediate response
- Pulse SlowJobs = performance monitoring
- Horizon failed jobs = correctness/error monitoring
- Separate dashboard cards, separate alerting channels

### Refactoring Strategy
1. Audit current monitoring: are slow and failed jobs distinguished?
2. Separate: Pulse for slow jobs, Horizon failed_jobs + events for failures
3. Set up different alerting: email/summary for slow jobs, Slack/PagerDuty for failures
4. Educate team on the distinction
5. Create separate runbooks for slow job investigation vs failed job investigation

### Detection Checklist
- [ ] Slow jobs and failed jobs have separate monitoring
- [ ] Slow jobs trigger performance alerts (not incidents)
- [ ] Failed jobs trigger incident alerts (not performance reviews)
- [ ] Team understands the distinction
- [ ] Separate runbooks exist for slow vs failed jobs

### Related Rules
- correlate-slow-jobs-with-resources

### Related Skills
- Configure Pulse SlowJobs Recorder

### Related Decision Trees
- Pulse Slow Jobs vs Custom Monitoring

---

## 5. No Resource Correlation

### Category
Observability

### Description
Monitoring slow jobs in isolation without correlating with resource metrics (CPU, memory, database query time, Redis latency). A slow job is a symptom — the cause may be resource contention, not the job's own code.

### Why It Happens
- Slow jobs tracked exclusively in Pulse (no resource integration)
- Not configuring Pulse to include server metrics
- Assuming the job itself is slow (rather than the environment)
- Investigating slow jobs by looking only at job code
- "The job is slow, let's optimize it" — but the database was the bottleneck

### Warning Signs
- Slow job investigations focus only on the job's code
- No correlation: CPU/memory/database metrics when slow jobs spike
- "We optimized the job but it's still slow" — because the database was the bottleneck
- Slow job incidents resolved by restarting the database (not job changes)
- Pulse dashboard shows no server metrics alongside slow jobs

### Why Harmful
Pulse shows 50 slow jobs in the last hour — the team adds more queue workers (the intuitive fix). But the actual cause is a MySQL deadlock issue — more workers create more concurrent queries, making the deadlock worse. Worker count increases from 10 to 20, and slow jobs increase to 100. Without resource correlation, the team treated the symptom (slow jobs) without identifying the cause (database contention). The response actively worsened the problem.

### Consequences
- Engineering effort wasted optimizing jobs when the bottleneck is resources
- Wrong fixes: adding workers when the database is the bottleneck
- Root cause misidentified: "the job is slow" vs "the server is slow"
- Fixes that make the problem worse (more workers = more DB contention)
- Extended incident: addressing symptoms while the cause persists
- Delayed resolution: database fix not applied because "it's a job issue"

### Alternative
- Always correlate slow jobs with resource metrics:
  - Pulse should show: slow jobs + CPU usage + memory + DB query time
  - Investigate in order:
    1. Are server resources saturated? (CPU, memory, disk)
    2. Is the database slow? (query time, connection count)
    3. Is Redis responding? (latency, memory)
    4. Only then: is the job code itself slow?
- Configure Pulse to include server metrics (CPU, memory) alongside SlowJobs

### Refactoring Strategy
1. Configure Pulse server metrics (CPU, memory, disk)
2. Add database query time monitoring to Pulse or alongside
3. When slow jobs spike: first check resource metrics
4. Document investigation order: resources → dependencies → job code
5. Create dashboard: slow jobs + CPU + memory + DB query time

### Detection Checklist
- [ ] Slow jobs monitored alongside resource metrics
- [ ] Investigation protocol: resources first, then job code
- [ ] No engineering effort wasted optimizing jobs during resource contention
- [ ] Pulse includes server metrics (CPU, memory)
- [ ] Database and Redis latency tracked for correlation

### Related Rules
- correlate-slow-jobs-with-resources

### Related Skills
- Configure Pulse SlowJobs Recorder

### Related Decision Trees
- Pulse Slow Jobs vs Custom Monitoring
