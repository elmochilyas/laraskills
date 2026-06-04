---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K046 — Silenced Jobs and Silenced Tags
Knowledge ID: K046
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Silencing Without Alerting | Operations | Critical |
| 2 | Over-Silencing — Dashboard Appears Empty | Operations | Medium |
| 3 | Silencing During Incidents Without Removing | Operations | Medium |
| 4 | Using `ShouldBeSilenced` for Throttling | Architecture | Low |
| 5 | Tag-Based Silencing with Generic/Wildcard Tags | Configuration | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Unalerted Silenced Failures | Critical — failures invisible | Never silence without external alerting |
| Empty Dashboard | Medium — no monitoring context | Only silence high-frequency expected jobs |
| Forgotten Incident Silencing | Medium — silencing persists after incident | Remove silencing after incident resolution |

---

## 1. Silencing Without Alerting

### Category
Operations

### Description
Implementing `ShouldBeSilenced` on a job class or adding tag-based silencing without configuring external alerting for failures. The silenced job's failures are hidden from the default dashboard view — if it starts failing, the information is invisible unless an operator specifically enables the "show silenced" toggle.

### Why It Happens
- Assuming silencing only reduces noise, not hides failures
- Not reading that silencing hides from default dashboard view
- Unaware that silenced failures still generate events (but are not displayed)
- Focusing on silencing "noisy" jobs without considering failure scenarios
- Not having external monitoring infrastructure in place

### Warning Signs
- Silenced jobs have no `failed()` method that sends alerts
- No Slack/PagerDuty notification for silenced job failures
- No monitoring for `Queue::failing` events that include silenced jobs
- "We silenced the health check because it was noisy" — no failure alerting added
- Silenced job failures discovered during post-mortem: "did anyone notice?"

### Why Harmful
The health check job starts failing due to a database connection issue — it's silenced, so it doesn't appear in the default dashboard view. No one notices for 2 hours until users report the site is down. The health check was supposed to be the early warning system, but because it was silenced, its failures were invisible. The silencing feature removed the noise AND the signal.

### Consequences
- Silenced job failures go undetected for hours
- Early warning jobs (health checks) become invisible — defeating their purpose
- Incident response delayed (discovered by user reports, not monitoring)
- Post-mortem: "why didn't we see the health check failures?"
- Trust in the monitoring system erodes
- Developers hesitate to silence jobs in the future (even appropriately)

### Alternative
- Always configure alerting before silencing any job:
  ```php
  class HealthCheckJob implements ShouldQueue
  {
      use Silenced;
  
      public function failed(\Throwable $e): void
      {
          // Must have external alerting
          Slack::send('Health check failed: ' . $e->getMessage());
      }
  }
  ```

### Refactoring Strategy
1. Audit all silenced jobs — check if they have failure alerting
2. For each silenced job without alerting: either add alerting or unsilence
3. Implement `failed()` method on each silenced job that sends to Slack/PagerDuty
4. Or use `Queue::failing` for global silenced failure monitoring
5. Add code review rule: "jobs implementing `Silenced` must also alert on failure"

### Detection Checklist
- [ ] Every silenced job has failure alerting
- [ ] Silenced job failures trigger Slack/PagerDuty notification
- [ ] `Queue::failing` monitored for silenced failures
- [ ] No silenced job without accompanying alerting
- [ ] Code review enforces alerting for silenced jobs

### Related Rules
- never-silence-without-alerting

### Related Skills
- Silence Jobs with `ShouldBeSilenced`

### Related Decision Trees
- Silencing Jobs vs Filtering in Horizon Dashboard

---

## 2. Over-Silencing — Dashboard Appears Empty

### Category
Operations

### Description
Silencing too many jobs or using broad silenced tags, resulting in an empty or near-empty Horizon dashboard. Operators lose visibility into normal processing patterns and cannot easily distinguish "healthy silence" from "no processing happening."

### Why It Happens
- Silencing every "expected" job without considering monitoring needs
- Aggressive noise reduction: silencing all recurring jobs
- Using broad tag-based silencing that catches more jobs than intended
- Silencing entire job categories without considering operational context
- No review of silenced jobs vs dashboard usefulness

### Warning Signs
- Horizon dashboard shows few or zero completed jobs
- "Show silenced" toggle reveals 90%+ of jobs are silenced
- Operators don't use the dashboard because "there's nothing to see"
- New team members think jobs aren't running (dashboard looks empty)
- Incident response: operator can't tell if jobs are processing normally

### Why Harmful
The dashboard, which should provide operational visibility, is rendered useless. New operators think jobs aren't running because the default view shows nothing. During an incident, the team can't quickly assess whether jobs are processing normally — they must toggle "show silenced" first. The silencing feature intended to reduce noise has removed so much signal that the dashboard loses its value as a monitoring tool.

### Consequences
- Dashboard becomes useless for operational monitoring
- Operators stop using the dashboard as a monitoring tool
- New team members confused: "is the queue system working?"
- Lost monitoring signal: trends, patterns, anomalies invisible
- Incident response time increased: must toggle silencing to see full picture
- Team builds alternative monitoring to compensate (wasted effort)

### Alternative
- Only silence truly high-frequency expected jobs:
  - Health checks running every 60 seconds (1000+ per day)
  - Heartbeat jobs that always succeed
  - Scheduled maintenance tasks
- Keep at least 50% of jobs visible in default view
- Silencing should remove noise, not remove signal
- Dashboard should show normal processing patterns with silenced jobs excluded

### Refactoring Strategy
1. Review all silenced jobs — categorize as "should silence" vs "should not"
2. Unsilence jobs that run infrequently (< 100/day) or are operationally meaningful
3. Keep silencing only for > 1000/day expected-success jobs
4. Verify dashboard shows useful information with silencing applied
5. Document silencing criteria for future decisions

### Detection Checklist
- [ ] Dashboard shows meaningful processing in default view
- [ ] Silenced jobs are high-frequency only (> 1000/day)
- [ ] No entire job categories silenced (only individual noisy jobs)
- [ ] Operators find the dashboard useful
- [ ] Silencing criteria documented

### Related Rules
- never-silence-without-alerting, document-silenced-jobs-in-runbooks

### Related Skills
- Silence Jobs with `ShouldBeSilenced`

### Related Decision Trees
- Silencing Jobs vs Filtering in Horizon Dashboard

---

## 3. Silencing During Incidents Without Removing

### Category
Operations

### Description
Temporarily silencing non-critical jobs during an active incident to reduce dashboard noise, then forgetting to remove the silencing after the incident resolves. The silencing persists indefinitely, hiding future failures of those jobs.

### Why It Happens
- Emergency measure during incident: "I'll silence these to focus"
- No tracking of temporary silencing changes
- No process to revert incident-related config changes
- Silencing added via config change without PR review
- Incident post-mortem doesn't include config cleanup

### Warning Signs
- Silenced jobs list includes jobs that were silenced "temporarily"
- No record of why specific jobs were silenced
- Git history shows silencing commits during incident windows
- Silencing config has no comments about temporary nature
- Team discovers months later: "why is this job still silenced?"

### Why Harmful
During a payment processing incident, an operator silences the email notification queue to reduce dashboard noise. After the incident resolves, the silencing remains. Over the next month, the email notification job fails silently — no one notices because it's silenced. Customer emails are not sent, but no alert fires. The temporary incident measure has created a permanent blind spot.

### Consequences
- Temporary silencing becomes permanent (until someone notices)
- Silenced jobs fail without detection
- Post-incident blind spots: "we silenced it during the incident and forgot"
- No remediation: the job may be critical in normal operation
- Trust in the silencing feature is damaged (creates blind spots)

### Alternative
- Never silence jobs as an incident measure:
  - Use dashboard filters instead of code-level silencing
  - If code-level silencing is necessary, create a PR with tracking
- Remove silencing after incident:
  - Add "remove temporary silencing" to incident resolution checklist
  - Set a calendar reminder if manual removal is required
  - Use feature flags for silencing that can be toggled quickly

### Refactoring Strategy
1. Audit recently silenced jobs — identify temporary silencing
2. Revert any silencing that was added during incidents
3. Add "temporary config cleanup" to incident resolution checklist
4. Use PR review: silencing changes should be deliberate, not incident-driven
5. Document that silencing is permanent until explicitly removed

### Detection Checklist
- [ ] No silencing added during incident windows still active
- [ ] Incident resolution checklist includes "remove temporary silencing"
- [ ] Silencing changes go through PR review
- [ ] Every silenced job has a documented reason
- [ ] Temporary silencing is tracked and removed promptly

### Related Rules
- never-silence-without-alerting, document-silenced-jobs-in-runbooks

### Related Skills
- Silence Jobs with `ShouldBeSilenced`

### Related Decision Trees
- Silencing Jobs vs Filtering in Horizon Dashboard

---

## 4. Using `ShouldBeSilenced` for Throttling

### Category
Architecture

### Description
Confusing Horizon's silencing feature with execution control — implementing `ShouldBeSilenced` intending to prevent a job from running or to throttle its execution. Silencing only hides the job from the dashboard; the job continues to process normally.

### Why It Happens
- "Silence" implies stopping or preventing
- Not reading that silencing is purely a dashboard visibility feature
- Assuming silencing has execution-level effects
- Searching for job control mechanisms and finding "silencing" first
- Not understanding the separation between dashboard presentation and job execution

### Warning Signs
- Code comments suggest silencing should prevent job execution
- Silenced jobs continue to run despite expectation they wouldn't
- Confusion in code review: "this job is silenced, should we also remove it from the schedule?"
- Attempts to use silencing for rate limiting or throttling
- Questions in team chat: "why is my silenced job still running?"

### Why Harmful
A developer silences a job thinking it will prevent it from running. The job continues processing, consuming resources and potentially affecting other systems. Meanwhile, the developer believes the job is stopped. The misunderstanding can lead to unexpected behavior — duplicate processing, resource contention, or downstream system overload.

### Consequences
- Job continues running despite developer thinking it was stopped
- Waste of resources (job not needed but still running)
- Potential duplicate processing if a replacement job is also deployed
- Confusion and debugging time wasted
- Incorrect assumptions about job lifecycle

### Alternative
- Use appropriate job control mechanisms:
  - Remove from schedule: remove from `schedule()` method
  - Conditional execution: check in `handle()` and return early
  - Middleware: use job middleware for throttling or rate limiting
  - Queue removal: unpause or delete the job from Horizon
- Silencing is ONLY for dashboard visibility — never for execution control

### Refactoring Strategy
1. Audit silenced jobs — identify any where silencing was intended for execution control
2. Replace silencing with appropriate execution control (remove from schedule, middleware)
3. Remove silencing from jobs that shouldn't run (silencing was wrong mechanism)
4. Document: "silencing affects dashboard only, not execution"
5. Educate team on proper job control mechanisms

### Detection Checklist
- [ ] No silenced jobs expected to stop execution
- [ ] Team understands silencing is dashboard-only
- [ ] Execution control uses proper mechanisms (schedule, middleware)
- [ ] Silencing used only for dashboard noise reduction
- [ ] Documentation clarifies silencing vs execution control

### Related Rules
- never-silence-without-alerting

### Related Skills
- Silence Jobs with `ShouldBeSilenced`

### Related Decision Trees
- Silencing Jobs vs Filtering in Horizon Dashboard

---

## 5. Tag-Based Silencing with Generic/Wildcard Tags

### Category
Configuration

### Description
Using overly broad or wildcard tags in the `silenced` config array, such as `silenced: ['*']`, `silenced: ['job:*']`, or matching too many job categories unintentionally. Broad tag patterns silence jobs that should remain visible.

### Why It Happens
- Convenience: "just silence everything with this prefix"
- Not realizing how many jobs match the tag pattern
- Not testing which jobs are silenced by the pattern
- Copying broad silencing config from another project
- Assuming tag patterns are more specific than they actually are

### Warning Signs
- `silenced` config contains `['*']` or very broad patterns
- Dashboard is significantly emptier than expected after adding silenced tags
- Expected jobs appear missing from the dashboard
- No validation of which jobs match silenced tag patterns
- Team can't list which jobs are silenced via tag matching

### Why Harmful
`silenced: ['*']` silences every job that has any tag — which is all jobs with custom tags. The dashboard is permanently empty. Even worse, `silenced: ['job:*']` may silence 50 different job types when only 3 were intended. The operator adds a tag thinking "this category is noisy" but accidentally silences an entire system's worth of jobs.

### Consequences
- Dashboard appears empty or near-empty
- All jobs matching the broad pattern are hidden
- Failures in unexpectedly silenced jobs go undetected
- Debugging: "why is my job not showing up in the dashboard?"
- Team may not notice the issue for days (dashboard is already rarely checked)

### Alternative
- Be specific in silenced tags:
  ```php
  // BAD — too broad
  'silenced' => ['type:monitoring'],
  
  // GOOD — specific to noise-generating jobs
  'silenced' => ['type:healthcheck'],
  ```
- List the specific tags for genuinely noisy jobs
- Validate which jobs match each silenced tag before adding
- Prefer per-job `Silenced` trait over tag-based silencing (more explicit)

### Refactoring Strategy
1. Review all entries in `silenced` config array
2. Remove any wildcard or overly broad patterns
3. Replace broad patterns with specific tags
4. Verify the dashboard returns expected visibility
5. Add validation: check which jobs match each silenced tag

### Detection Checklist
- [ ] No wildcard (`*`) patterns in silenced config
- [ ] Silenced tags are specific (not broad categories)
- [ ] Dashboard shows expected job visibility
- [ ] Each silenced tag matches only intended jobs
- [ ] Prefer per-job `Silenced` trait over broad tag matches

### Related Rules
- never-silence-without-alerting, use-tag-based-silencing-for-cross-cutting

### Related Skills
- Silence Jobs with `ShouldBeSilenced`

### Related Decision Trees
- Silencing Jobs vs Filtering in Horizon Dashboard
