# Skill: Listen to `Queue::failing` for Global Failure Monitoring

## Purpose
Register a `Queue::failing` listener to capture all permanent job failures in one place for centralized logging, metrics, alerting, and infrastructure-level monitoring.

## When To Use
Any production application needing centralized failure visibility; cross-cutting concerns like Slack alerts, PagerDuty, Prometheus metrics; complementing per-job `failed()` cleanup.

## When NOT To Use
Job-specific cleanup (use `failed()` instead); logic depending on `failed_jobs` table being present (order varies by Laravel version); heavy I/O without dispatching to queue.

## Prerequisites
- Access to `Illuminate\Queue\Events\JobFailed`
- Service provider registration context

## Inputs
- Event listener: `Queue::failing(function (JobFailed $event) { ... })`
- Exception filtering criteria

## Workflow
1. Register listener in `AppServiceProvider::boot()` — never in controllers or commands
2. Keep listener lightweight: log, increment counter, or dispatch async notification
3. Filter by exception type: alert on validation errors, not rate limits
4. Never use for job-specific cleanup — use `failed()` method for that
5. Avoid registering listeners repeatedly — accumulates in daemon workers
6. For heavy notifications (Slack, PagerDuty): dispatch a queued job from the listener

## Validation Checklist
- [ ] Listener registered in service provider — not controllers/commands
- [ ] No heavy I/O in listener (or dispatched async)
- [ ] Exception filtering applied to reduce noise
- [ ] Not used for job-specific cleanup
- [ ] No duplicate registration on each worker loop
- [ ] Log output visible in centralized logging system

## Common Failures
- Heavy I/O in listener — worker blocked during failure handling
- Not filtering failure types — noise from transient errors buries real issues
- Confusing `Queue::failing` with `JobFailed` event — double handling
- Registering listeners repeatedly — memory growth, duplicate execution

## Decision Points
- Simple logging: inline in listener
- Slack/PagerDuty: dispatch to queue from listener
- Metrics (Prometheus): increment counter inline

## Related Rules
- Rule 1: keep-failing-listeners-lightweight
- Rule 2: use-for-infrastructure-monitoring
- Rule 3: prevent-listener-accumulation

## Related Skills
- Implement `failed()` Method for Job-Specific Cleanup
- Configure `failed_jobs` Storage and Pruning
- Schedule Pruning of Failed Jobs

## Success Criteria
All permanent failures are captured in centralized monitoring, alerts apply filtering to reduce noise, listeners are lightweight and registered once, and failure trends are visible in metrics.
