# Knowledge Unit: Command Scheduling

## Metadata
- **Subdomain:** CLI Tooling & Artisan Extensions
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** cli-tooling-artisan-extensions/command-scheduling
- **Maturity:** Mature
- **Related Technologies:** Laravel Scheduler, Cron, Symfony Process, Task Scheduling

## Executive Summary

Laravel's command scheduler provides a fluent, expressive API for defining task schedules within PHP code, replacing the need for multiple system crontab entries. Instead of adding a crontab entry for each scheduled task, you add a single `* * * * * cd /project && php artisan schedule:run` entry, and Laravel evaluates all scheduled tasks within the `schedule` method of `App\Console\Kernel`. The scheduler supports a wide range of scheduling frequencies (`everyMinute()`, `daily()`, `hourly()`, `cron('* * * * *')`), constraints (`->weekdays()`, `->between('8:00', '17:00')`), lifecycle hooks (`->before()`, `->after()`, `->onSuccess()`, `->onFailure()`), and execution modes (`->withoutOverlapping()`, `->runInBackground()`, `->appendOutputTo()`). The scheduler operates on a single-server model by default but supports multi-server coordination via mutex locking.

## Core Concepts

- **Schedule Definition:** Tasks registered in `App\Console\Kernel::schedule()` using the fluent API: `$schedule->command('emails:send')->daily()`
- **Scheduling Frequency:** Methods like `daily()`, `hourly()`, `everyFifteenMinutes()`, `cron('* * * * *')` define when the task executes
- **Constraints:** Chainable conditions like `->weekdays()`, `->when(function() { return true; })`, `->environments('production')` gate whether the task runs
- **Execution Options:** `->withoutOverlapping()` prevents concurrent runs; `->runInBackground()` spawns a subprocess; `->onOneServer()` coordinates across servers
- **Lifecycle Hooks:** `->before()`, `->after()`, `->onSuccess()`, `->onFailure()` attach callbacks to task lifecycle events
- **Task Types:** `$schedule->command()` for Artisan commands, `$schedule->exec()` for shell commands, `$schedule->job()` for queued jobs, `$schedule->call()` for closures

## Mental Models

- **Schedule as Single Cron Entry:** The scheduler transforms many virtual cron jobs into a single system cron entry—like a traffic controller that dispatches to the right handler
- **Schedule as Time-Based Queue:** Each scheduled task is like a queued job with a time trigger instead of an event trigger; the scheduler is the worker that polls the time trigger
- **Overlapping as Lock:** `->withoutOverlapping()` is a mutex—it acquires a lock at the start of the task and releases it on completion, preventing concurrent execution

## Internal Mechanics

1. **schedule:run Entry Point:** The kernel's `schedule:run` command is triggered every minute by the system cron. It calls `Schedule::dueEvents($app)` to find events whose scheduled time has passed.
2. **Due Event Evaluation:** Each event checks its cron expression against the current time, evaluates constraints (`->when()`, `->environments()`), and checks mutex locks (`->withoutOverlapping()`). Only events passing all checks are marked as due.
3. **Command Execution:** Due events are executed: in-process (`Artisan::call()`), as background processes (`Symfony Process` detached), or dispatched to the queue.
4. **Lifecycle Callback Invocation:** Before/after/success/failure callbacks are invoked around the task execution with access to the exit code and output.
5. **Mutex Management:** Mutex locks are stored in the cache (configurable via `->evenInMaintenanceMode()` considerations) and released when the task completes or fails.

## Patterns

- **Maintenance Window Pattern:** Schedule heavy tasks (report generation, data cleanup) during maintenance windows using `->dailyAt('02:00')` or specific time constraints
- **Heartbeat Pattern:** Schedule a health-check command every minute that records a heartbeat timestamp; monitoring alerts if the heartbeat is missing
- **Deferred Cleanup Pattern:** Schedule cleanup commands (log rotation, temp file purging, expired session cleanup) on a `->daily()` or `->weekly()` basis
- **Rate-Limited Task Pattern:** Use `->everyMinute()` with `->withoutOverlapping()` for tasks that should run as often as possible but never concurrently
- **Environment-Specific Schedule Pattern:** Use `->environments('production', 'staging')` to run certain tasks only on specific environments; use `->environment('local')` for dev-only tasks
- **Notification Pattern:** Schedule tasks that check for conditions (expired subscriptions, low stock, pending approvals) and send notifications when triggered

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Execution mode | In-process vs background (`runInBackground`) | Background for long-running tasks; in-process for quick tasks needing output |
| Concurrency control | `withoutOverlapping` vs queue job serialization | `withoutOverlapping` for single-server; queue serialization for multi-server |
| Mutex driver | Cache (Redis/File/Database) vs Database locks | Cache for speed; Database for persistence if cache is volatile |
| Task vs Job scheduling | `schedule:command` vs `schedule:job` with queue | Queue jobs when tasks should retry on failure; commands when tasks need full Laravel context |

## Tradeoffs

- **Single Cron vs Synchronous Execution:** With a single cron entry, all due tasks run sequentially by default. This can cause task backlog if one task takes longer than a minute. Use `->runInBackground()` to parallelize or split across multiple schedule:run instances.
- **In-Process vs Background:** In-process execution shares the parent process's memory and environment (faster startup) but blocks the scheduler. Background execution starts independently (non-blocking) but adds process spawning overhead (~50ms).
- **Cache Mutex vs Database Mutex:** Cache-based mutexes (Redis, Memcached) are fast but volatile—if the cache is flushed, all locks are released and overlapping tasks may run concurrently. Database mutexes are persistent but slower.

## Performance Considerations

- **Cron Execution Frequency:** The scheduler checks due events every minute. With 10-20 events, the evaluation takes <1ms. With hundreds, it could take 10-100ms—still negligible.
- **Background Process Allocation:** Each `->runInBackground()` spawns a PHP process. On a machine with limited RAM, 10 concurrent background tasks could exhaust memory. Monitor and limit concurrent background executions.
- **Mutex Check Overhead:** Each `->withoutOverlapping()` check requires a cache read. With Redis, this is ~1ms per task. With file cache, it could be 5-10ms.
- **Task Duration and Overlap:** If a task runs longer than its frequency interval (e.g., a 5-minute task scheduled every minute), it will either overlap or be skipped depending on the `->withoutOverlapping()` setting.

## Production Considerations

- **Maintenance Mode:** By default, scheduled tasks don't run when the app is in maintenance mode. Use `->evenInMaintenanceMode()` for critical tasks (heartbeats, cleanup).
- **Logging and Monitoring:** Log all scheduled task execution: start time, duration, exit code, output. Monitor for tasks that consistently fail or run longer than expected.
- **Server Time Synchronization:** Scheduler accuracy depends on the server's clock. Use NTP to keep server time in sync. Timezone settings in `config/app.php` affect `dailyAt()` interpretation.
- **Deployment and Schedule Changes:** When deploying new scheduled tasks, ensure the `schedule:run` cron is running. Deployment scripts should not interrupt running scheduled tasks.
- **Task Output Management:** Use `->appendOutputTo($path)` to capture task output. Implement log rotation to prevent disk space exhaustion from verbose task output.

## Common Mistakes

- **Forgetting the single cron entry:** Adding task definitions to `Kernel::schedule()` but forgetting the `* * * * * php artisan schedule:run` cron entry; no tasks will ever run
- **Not using withoutOverlapping:** A task that runs every minute but takes 2 minutes creates overlapping executions, potentially corrupting data or exhausting resources
- **Assuming exact timing:** `->dailyAt('02:00')` runs when `schedule:run` fires at 02:00:00—if the cron fires at 02:00:30, the task runs at :30 past the hour, not exactly 2:00
- **Background task without monitoring:** Using `->runInBackground()` for critical tasks but not monitoring their completion; a silently failing background task goes undetected
- **Timezone confusion:** `->dailyAt('00:00')` uses the app's timezone (`config/app.php`), but server cron uses system timezone; they may differ

## Failure Modes

- **Cron Not Running:** The system cron daemon crashes or is stopped; all scheduled tasks silently stop. Mitigate: implement heartbeat monitoring that alerts if `schedule:run` stops firing.
- **Mutex Deadlock:** A task crashes without releasing its mutex lock; subsequent runs are blocked until the cache key expires. Mitigate: set reasonable mutex TTLs via `->withoutOverlapping(60)` (60-minute lock expiration).
- **Resource Exhaustion:** Multiple background tasks accumulate over time, consuming all available memory or CPU. Mitigate: use `->withoutOverlapping()` and monitor background process count.
- **Database Connection Pool Exhaustion:** Scheduled tasks that maintain database connections can exhaust the connection pool during peak times. Mitigate: schedule heavy database tasks during low-traffic windows.

## Ecosystem Usage

- **Laravel Forge:** Forge provides a visual interface for scheduled tasks and automatically installs the cron entry when provisioning servers
- **Laravel Vapor:** Vapor uses its own scheduler for serverless Laravel applications, executing scheduled tasks via AWS Lambda
- **Ploy:** Ploi server management panel also configures Laravel's cron entry automatically during provisioning
- **Horizon:** Laravel Horizon uses its own scheduling for queue worker management but integrates with the main scheduler for maintenance tasks

## Related Knowledge Units

- cli-workflow-automation
- custom-artisan-command-patterns
- interactive-commands
- cache-queue-services

## Research Notes

- The scheduler's mutex system used the Cache facade exclusively before Laravel 8.x; since 8.x, the mutex can be customized via `SchedulingMutex` contract
- The `onOneServer` method uses the cache's atomic locking features (Redis, DynamoDB) to coordinate across multiple servers—critical for load-balanced production environments
- Laravel 11.x introduced the `onOneServer` method for job scheduling, extending the pattern beyond command scheduling
- The scheduler processes tasks in the order they're defined in `schedule()`; this ordering is deterministic but not guaranteed in future versions
