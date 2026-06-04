# Skill: Schedule Artisan Commands

## Purpose
Replace multiple system crontab entries with a single `php artisan schedule:run` entry, defining task frequency, constraints, lifecycle hooks, and execution modes in PHP.

## When To Use
- Recurring maintenance tasks (cache cleanup, log rotation, session pruning)
- Scheduled data processing (report generation, data exports, sync jobs)
- Heartbeat monitoring and health checks
- Queue worker management and supervisor tasks
- Notification dispatch (daily summaries, pending action reminders)

## When NOT To Use
- Real-time or event-driven tasks (use queues/listeners instead)
- Tasks requiring sub-minute precision (cron minimum is 1 minute)
- One-off tasks (run directly or via queue)
- Tasks needing complex workflow orchestration (use dedicated workflow tools)

## Prerequisites
- Laravel scheduler configured with `* * * * * php artisan schedule:run` system cron
- Task definitions in `App\Console\Kernel::schedule()`
- Understanding of frequency methods, constraints, and execution modes

## Inputs
- Task list with desired frequency (daily, hourly, every minute)
- Constraints (weekdays, environments, condition checks)
- Execution mode (without overlapping, background, on one server)
- Log output paths for audit trails

## Workflow
1. Add a single system cron entry: `* * * * * php artisan schedule:run`
2. Define each task in `Kernel::schedule()` grouped by domain or frequency
3. Use `->command('name')` for Artisan commands, `->job(JobClass)` for queue jobs
4. Apply `->withoutOverlapping()` to tasks running more frequently than their duration
5. Set mutex TTL: `->withoutOverlapping(60)` to prevent deadlocks from crashed tasks
6. Use `->runInBackground()` for long tasks so scheduler continues processing
7. Add `->appendOutputTo($path)` for all tasks to capture logs
8. Use `->onOneServer()` for multi-server deployments with shared cache (Redis)
9. Gate environment-specific tasks with `->environments('production')`
10. Add a heartbeat health-check task every minute to detect if cron stops
11. Never call interactive methods (ask, confirm) in scheduled commands

## Validation Checklist
- [ ] Single system cron entry `* * * * * php artisan schedule:run` in place
- [ ] `->withoutOverlapping()` applied to tasks running more frequently than their duration
- [ ] Mutex TTL set with `->withoutOverlapping(seconds)`
- [ ] All tasks have output logged via `->appendOutputTo()`
- [ ] Long tasks use `->runInBackground()`
- [ ] Multi-server tasks use `->onOneServer()` with shared cache
- [ ] Environment-specific tasks gated with `->environments()`
- [ ] Heartbeat monitoring task runs every minute
- [ ] No interactive methods called in scheduled tasks
- [ ] Tasks grouped logically in `Kernel::schedule()`

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Tasks pile up and overlap | No `withoutOverlapping()` | Apply to all tasks running more frequently than their duration |
| Deadlock from crashed task | No mutex TTL | Set `->withoutOverlapping(seconds)` timeout |
| Scheduler blocks on long tasks | No background mode | Use `->runInBackground()` for long tasks |
| Can't debug failing tasks | No logging | Add `->appendOutputTo($path)` to all tasks |
| Tasks run on all servers | No `onOneServer()` | Use `->onOneServer()` with shared Redis cache |
| Cron silently stops | No monitoring | Add heartbeat monitoring task |
| Tasks run in wrong environment | No environment gate | Use `->environments('production')` |

## Decision Points
- **Execution mode:** Background vs foreground (background for long; foreground for short)
- **Multi-server coordination:** On One Server vs run on all servers
- **Task type:** `command()` vs `job()` vs `exec()` vs `call()`
- **Frequency:** Fixed (daily/hourly) vs dynamic (cron expression)

## Performance/Security Considerations
- Scheduled tasks must never call interactive methods — they fail in non-interactive mode
- Use mutex TTL to prevent deadlocks from crashed tasks
- Heartbeat monitoring detects if scheduler stops (critical for production)
- Log output rotation should be configured to prevent disk exhaustion
- Use `->environments('production')` to prevent dev-only tasks from running in production

## Related Rules
- SCHED-RULE-001 through SCHED-RULE-012

## Related Skills
- Create Custom Artisan Commands
- Automate CLI Workflows
- Build Interactive Commands
- Set Up Queue Workers
- Monitor Application Health

## Success Criteria
- All recurring tasks managed through Laravel scheduler, not system cron
- No task overlaps occur (verified by monitoring)
- Scheduled task failures are caught and logged
- Multi-server deployments run scheduled tasks exactly once
- Heartbeat monitoring detects cron failures within 1 minute
- Audit trail exists for all scheduled task executions
