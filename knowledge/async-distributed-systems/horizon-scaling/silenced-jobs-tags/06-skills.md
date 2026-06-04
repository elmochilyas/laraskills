# Skill: Silence Jobs with `ShouldBeSilenced`

## Purpose
Implement `ShouldBeSilenced` on job classes (or use the `Silenced` trait) to hide high-frequency expected jobs from the Horizon dashboard's default view, reducing noise.

## When To Use
High-frequency expected jobs — health checks, heartbeat jobs, scheduled maintenance; cross-cutting job categories via tag-based silencing; reducing dashboard noise.

## When NOT To Use
Critical jobs whose failures must be immediately visible; jobs that rarely fail but are catastrophic when they do; silencing without setting up external alerting for failures.

## Prerequisites
- Job class to silence
- External alerting configured for failure notification

## Inputs
- Job class to silence (per-job) or tag pattern (cross-cutting)

## Workflow
1. For per-job silencing: add `use \Laravel\Horizon\Contracts\Silenced;` trait
2. For cross-cutting silencing: add tag and configure `'silenced'` array in `config/horizon.php`
3. Never silence without external alerting (Slack, PagerDuty) for failures
4. Document silenced jobs in team runbooks
5. Use `Silenced` trait over implementing `ShouldBeSilenced` manually (more explicit)
6. Silenced jobs still count in metrics — check there for health

## Validation Checklist
- [ ] External alerting configured before silencing
- [ ] `Silenced` trait used (preferred) or `ShouldBeSilenced` interface
- [ ] Silenced jobs documented in runbooks
- [ ] Failures in silenced jobs still generate events/failed_jobs entries
- [ ] Metrics checked for silenced job health
- [ ] Not silencing critical jobs (payment reconciliation, etc.)
- [ ] Not silencing all jobs (dashboard appears empty)

## Common Failures
- Silencing without alerting — failures in silenced jobs go undetected
- Using `ShouldBeSilenced` for throttling — job still runs, only hidden from dashboard
- Over-silencing — dashboard appears empty, operators miss context
- No team documentation — operators may think jobs aren't running

## Decision Points
- Single noisy job: `Silenced` trait on the class
- Cross-cutting category: tags + `silenced` config array
- Critical jobs: never silence; alert on failure instead

## Related Rules
- Rule 1: never-silence-without-alerting
- Rule 2: prefer-silenced-trait-over-interface
- Rule 3: document-silenced-jobs-in-runbooks
- Rule 4: use-tag-based-silencing-for-cross-cutting

## Related Skills
- Tag Jobs for Horizon Dashboard Filtering
- Configure Horizon Notifications for Wait Time Alerts
- Listen to `Queue::failing` for Global Failure Monitoring

## Success Criteria
Only appropriate jobs are silenced, external alerting covers failures, silenced jobs are documented, and the dashboard remains useful for monitoring meaningful failures.
