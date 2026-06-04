# Skill: Configure Pulse SlowJobs Recorder

## Purpose
Enable and tune Laravel Pulse's `SlowJobs` recorder to capture jobs exceeding a configurable duration threshold, providing real-time visibility into slow execution.

## When To Use
Continuous queue performance monitoring; identifying performance regressions after deploys; first line of defense in queue observability.

## When NOT To Use
Real-time alerting (Pulse aggregates on a 10-60 second delay); per-job-class thresholds (Pulse uses one threshold per recorder); high-frequency slow jobs (thousands/second may need sampling).

## Prerequisites
- Laravel Pulse installed and configured
- Queue worker sending `JobAttemptStarted`/`JobAttemptFinished` events

## Inputs
- Slow job threshold (ms) per recorder instance
- `ignore_after` callback to exclude specific jobs

## Workflow
1. Enable `SlowJobs` recorder in `config/pulse.php`
2. Set `threshold_ms` based on job-type expectations (not global default)
3. Create separate recorder instances for queues with different duration profiles
4. Use `ignore_after` callback to exclude expected-slow jobs (reports, exports)
5. Configure Pulse dashboard card placement
6. Correlate slow jobs with resource monitoring (CPU, memory, DB query time)
7. Investigate slow job top entries — focus on high-frequency slow jobs first

## Validation Checklist
- [ ] `SlowJobs` recorder enabled in config
- [ ] `threshold_ms` set per job-type profile
- [ ] High-frequency expected-slow jobs ignored via `ignore_after`
- [ ] Dashboard card configured and placed
- [ ] Slow jobs correlated with resource monitoring
- [ ] Investigation focuses on high-frequency slow jobs
- [ ] Threshold not too aggressive (false positives) or too lax (missed slow jobs)

## Common Failures
- Single threshold for all queues — emails (15s SMTP) always show as slow
- No `ignore_after` — expected-slow jobs drown out real issues
- No resource correlation — knows job is slow, not why
- Aggregated data hides outliers — use Pulse + point-in-time logs for deep dives

## Decision Points
- Fast jobs (<1s): threshold_ms = 500ms — catch anything unexpectedly slow
- Email queue: threshold_ms = 30000ms — SMTP delivery is inherently slow
- Report queue: threshold_ms = 600000ms — large reports take minutes

## Related Rules
- Rule 1: set-appropriate-slow-job-threshold
- Rule 2: correlate-slow-jobs-with-resources
- Rule 3: ignore-slow-expected-jobs
- Rule 4: use-per-queue-thresholds

## Related Skills
- Build Custom Pulse Recorders for Queue Observability
- Monitor Horizon Wait Time and Set Alerts
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time

## Success Criteria
Pulse slow job recorder captures meaningful slow jobs per-queue, thresholds match job-type expectations, expected-slow jobs are excluded, and slow jobs are investigated with resource context.
