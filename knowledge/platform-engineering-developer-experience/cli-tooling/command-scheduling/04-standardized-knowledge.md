# 04-Standardized Knowledge: Command Scheduling

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | cli-tooling-artisan-extensions |
| **Knowledge Unit** | command-scheduling |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | cli-workflow-automation, custom-artisan-command-patterns, interactive-commands |
| **Framework/Language** | Laravel Scheduler, Cron, Symfony Process |

## Overview

Laravel's command scheduler replaces multiple system crontab entries with a single `* * * * * php artisan schedule:run` entry. Tasks define frequency (`daily()`, `hourly()`, `everyMinute()`, `cron('* * * * *')`), constraints (`->weekdays()`, `->between()`, `->when()`), lifecycle hooks (`->before()`, `->after()`, `->onSuccess()`, `->onFailure()`), and execution modes (`->withoutOverlapping()`, `->runInBackground()`, `->onOneServer()`). Task types include `command()`, `exec()`, `job()`, and `call()`.

## Core Concepts

- **Schedule Definition**: tasks registered in `Kernel::schedule()` via fluent API
- **Frequencies**: `daily()`, `hourly()`, `everyFifteenMinutes()`, `cron('* * * * *')`, etc.
- **Constraints**: `->weekdays()`, `->weekends()`, `->when(fn)`, `->environments('production')`
- **Execution Modes**: `->withoutOverlapping()` (prevent concurrency), `->runInBackground()` (async), `->onOneServer()` (multi-server coordination)
- **Lifecycle Hooks**: `->before(fn)`, `->after(fn)`, `->onSuccess(fn)`, `->onFailure(fn)`
- **Task Types**: `command('name')` for Artisan, `exec('shellcmd')` for system, `job(JobClass)` for queue, `call(fn)` for closures

## When to Use

- Recurring maintenance tasks (cache cleanup, log rotation, session pruning)
- Scheduled data processing (report generation, data exports, sync jobs)
- Heartbeat monitoring and health checks
- Queue worker management and supervisor tasks
- Notification dispatch (daily summaries, pending action reminders)

## When NOT to Use

- Real-time or event-driven tasks (use queues/listeners instead)
- Tasks requiring sub-minute precision (cron minimum is 1 minute)
- One-off tasks (run directly or via queue)
- Tasks needing complex workflow orchestration (use dedicated workflow tools)

## Best Practices (WHY)

- **Single cron entry**: the entire schedule operates through one `* * * * * php artisan schedule:run` system cron
- **Always use `->withoutOverlapping()`** for tasks that run more frequently than their duration
- **Log all task output** with `->appendOutputTo($path)` for audit trails and debugging
- **Background for long tasks**: use `->runInBackground()` so the scheduler continues processing other due tasks
- **Set mutex TTL**: `->withoutOverlapping(60)` with a timeout prevents deadlocks from crashed tasks
- **Heartbeat monitoring**: schedule a health-check recording task every minute to detect if cron stops
- **`evenInMaintenanceMode()` for critical tasks**: heartbeats, security cleanup should run even during maintenance

## Architecture Guidelines

- Define schedules in `Kernel::schedule()` grouped by domain or frequency
- Use `->environments('production')` to gate environment-specific tasks
- For multi-server deployments, use `->onOneServer()` with shared cache (Redis) for coordination
- Scheduled commands should never call `ask()`, `confirm()`, or other interactive methods
- Test scheduled tasks by running the command directly and verifying behavior

## Performance Considerations

- Due event evaluation with 10-20 tasks takes <1ms; with hundreds, 10-100ms — still negligible
- `->runInBackground()` spawns a PHP subprocess per task — monitor concurrent background limit
- Mutex checking via Redis is ~1ms per task; file cache is 5-10ms
- Background tasks can accumulate and exhaust memory on resource-constrained machines

## Security Considerations

- Scheduled commands run with the app's full privileges — limit destructive operations
- Use `->evenInMaintenanceMode()` judiciously — only for safety-critical tasks
- Store sensitive output separately; scheduled task logs may contain sensitive data
- Validate that external exec commands (`schedule->exec()`) are not injectable

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Missing cron entry | Tasks defined but no system cron running | Assuming scheduler works without cron | Tasks never execute | Verify `* * * * * php artisan schedule:run` is active |
| No withoutOverlapping | 2-min task scheduled every minute | Not accounting for duration | Data corruption, resource exhaustion | Always use for frequent tasks |
| Task order assumption | Relying on definition order for execution | Misunderstanding scheduler | Order changes may break workflows | Design tasks to be independent |
| Background task blind spot | `runInBackground` without monitoring | Forgetting to check completion | Silent failures go undetected | Log and monitor background task completion |
| Timezone mismatch | `dailyAt('00:00')` in wrong timezone | App vs system timezone confusion | Tasks run at wrong time | Verify `config('app.timezone')` matches intent |

## Anti-Patterns

- **Interactive in Scheduled Tasks**: commands using `$this->ask()` in scheduled tasks hang the scheduler
- **Overlapping without Mutex TTL**: `withoutOverlapping()` without a timeout causes deadlocks on crash
- **Many `everyMinute()` Tasks**: too many frequent tasks can starve the scheduler
- **Hard-Coded Paths**: using absolute paths in `exec()` tasks breaks across environments
- **No Failure Notification**: tasks that fail silently with no alerting

## Examples

```php
// App\Console\Kernel.php
protected function schedule(Schedule $schedule): void
{
    // Maintenance tasks
    $schedule->command('cleanup:expired-sessions')->daily()->at('03:00')
        ->appendOutputTo(storage_path('logs/scheduler-cleanup.log'));

    $schedule->command('reports:generate-daily')->daily()->at('02:00')
        ->withoutOverlapping(60)
        ->runInBackground()
        ->onFailure(fn () => Log::alert('Daily report generation failed'))
        ->environments('production');

    // Heartbeat
    $schedule->command('monitor:heartbeat')->everyMinute()
        ->evenInMaintenanceMode()
        ->onOneServer();

    // Queue worker health
    $schedule->command('queue:restart')->hourly()
        ->appendOutputTo(storage_path('logs/queue-restart.log'));
}
```

## Related Topics

- cli-workflow-automation — chaining commands into workflows
- custom-artisan-command-patterns — command structure and registration
- cache-queue-services — Redis, queue configuration
- automated-deployment-pipelines — deployment hooks and automation

## AI Agent Notes

- The scheduler is single-server by default; multi-server needs `->onOneServer()` with shared cache
- Mutex keys stored in cache — if cache is flushed, all locks release simultaneously
- Laravel 11+ supports `onOneServer` for jobs too, not just commands
- When generating schedule definitions, prefer `command()` over `exec()` for portability

## Verification

- [ ] `* * * * * php artisan schedule:run` cron entry installed
- [ ] All tasks have `->appendOutputTo()` or logging configured
- [ ] Frequent tasks use `->withoutOverlapping()` with TTL
- [ ] No interactive prompts in any scheduled task
- [ ] Background tasks have monitoring/alerting
- [ ] Multi-server tasks use `->onOneServer()`
- [ ] `->evenInMaintenanceMode()` applied only where needed
- [ ] Heartbeat monitoring in place to detect cron failure
- [ ] Mutex TTL set on all `withoutOverlapping()` tasks
- [ ] Scheduler tested by running `schedule:run` manually
