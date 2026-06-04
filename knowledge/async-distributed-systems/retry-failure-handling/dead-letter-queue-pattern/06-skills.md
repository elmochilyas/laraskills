# Skill: Implement a Dead-Letter Queue for Permanently Failed Jobs

## Purpose
Route permanently failed jobs to a dedicated dead-letter queue (DLQ) for manual inspection, delayed reprocessing, or automated triage, preventing poison messages from burning worker capacity.

## When To Use
Production systems with any job failure volume; jobs with side effects where permanent failures need investigation; systems using RabbitMQ or SQS with infrastructure-level DLQ support.

## When NOT To Use
`failed_jobs` table alone is sufficient for low failure volume; no monitoring for the DLQ (just a second place for jobs to die silently); infinite reprocessing loop without backoff.

## Prerequisites
- `failed()` method on relevant job classes
- Dedicated queue connection configured (e.g., `dead-letter`)
- Monitoring on DLQ depth and age

## Inputs
- Job payload for re-dispatch
- Queue name for dead-letter routing
- Cool-off period for reprocessing

## Workflow
1. Implement poison message detection: jobs that fail in <100ms on first retry are likely poison
2. Route failed jobs to DLQ in `failed()`: `DeadLetterJob::dispatch($this->payload)->onQueue('dead-letter')`
3. Set up DLQ monitoring: alert when depth > threshold or oldest message > 1 hour
4. Implement scheduled reprocessing with cool-off period (e.g., 1 hour delay before re-dispatched)
5. Never use `failed_jobs` table as a DLQ — it's passive storage, not routable
6. Apply backoff in reprocessing to avoid DLQ→reprocess→fail→DLQ loops

## Validation Checklist
- [ ] `failed()` dispatches to dedicated DLQ queue
- [ ] Poison message detection implemented for early retry failures
- [ ] DLQ depth and age monitored with alerts
- [ ] Reprocessing has cool-off period (no immediate re-dispatch)
- [ ] Not using `failed_jobs` table as DLQ
- [ ] DLQ workers have dedicated capacity
- [ ] No infinite reprocessing loop

## Common Failures
- No poison detection — every retry consumed for doomed jobs
- DLQ without monitoring — silent failures pile up
- Infinite reprocessing loop — no backoff in DLQ→queue cycle
- Using `failed_jobs` as DLQ — can't route, prioritize, or backpressure

## Decision Points
- Infrastructure DLQ (RabbitMQ/SQS): broker handles routing automatically
- Application DLQ (Redis): implemented in `failed()` with manual dispatch
- Low failure volume: `failed_jobs` table may be sufficient

## Related Rules
- Rule 1: implement-poison-message-detection
- Rule 2: monitor-dlq-depth-and-age
- Rule 3: dlq-reprocessing-with-cool-off
- Rule 4: no-failed-jobs-as-dlq

## Related Skills
- Use `failed()` Method for Job-Specific Cleanup
- Retry Failed Jobs Safely
- Schedule Pruning of Failed Jobs

## Success Criteria
Permanently failed jobs are routed to a monitored DLQ, poison messages are detected early, reprocessing has a cool-off period, and alerts fire on DLQ growth.
