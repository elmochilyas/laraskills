# Decision Trees: Command Scheduling

## Metadata
- **KU ID:** cli-tooling-artisan-extensions/command-scheduling
- **Subdomain:** cli-tooling-artisan-extensions
- **Domain:** platform-engineering-developer-experience
- **Phase:** 4 (Experience Curation)
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Task type | `command()` / `exec()` / `job()` / `call()` | What kind of work the scheduled task performs |
| 2 | Frequency selection | `daily()` / `hourly()` / `everyMinute()` / `cron()` | How often the task needs to run |
| 3 | Overlap prevention | `withoutOverlapping()` / None / With TTL | Preventing concurrent execution of long-running tasks |
| 4 | Multi-server coordination | `onOneServer()` / Run on all / Manual sharding | Preventing duplicate execution across server fleet |
| 5 | Failure notification | `onFailure()` / Log only / Silent | Alerting when scheduled tasks fail |

## Architecture-Level Decision Trees

### Tree 1: Task Type Selection

- **Start:** Choosing how to define a scheduled task
- **Is the task an existing Artisan command?**
  - Yes → Use `$schedule->command('name:args')`. Preferred for Laravel operations. Full app context available.
  - No → Continue.
- **Is the task a queued job?**
  - Yes → Use `$schedule->job(JobClass::class)`. Dispatches to queue. Avoids holding the scheduler. Good for long-running work.
  - No → Continue.
- **Is the task a shell command (git, backup, system tool)?**
  - Yes → Use `$schedule->exec('shell command')`. Last resort. Only for system operations. Validate command string to prevent injection.
  - No → Use `$schedule->call(fn)` for closures. Useful for simple inline tasks. Not config-cacheable.

### Tree 2: Frequency and Timing Configuration

- **Start:** Determining how often a task should run
- **Does the task need to run more than once per minute?**
  - Yes → Cannot use the scheduler. Cron minimum is 1 minute. Use queue for sub-minute tasks.
  - No → Continue.
- **Is the task time-critical (heartbeat, monitoring)?**
  - Yes → `everyMinute()`. Add `->evenInMaintenanceMode()` for safety-critical tasks.
  - No → Continue.
- **How often does the task need to execute?**
  - Daily → `daily()->at('03:00')`. Use off-peak hours for maintenance tasks.
  - Hourly → `hourly()` or `hourlyAt(15)`.
  - Multiple times per hour → `everyThirtyMinutes()`, `everyFifteenMinutes()`, etc.
  - Custom → `cron('*/5 * * * *')`.
- **Constraints:** `weekdays()`, `weekends()`, `between('0:00', '6:00')`, `when(fn)` for conditional execution.

### Tree 3: Overlap Prevention Strategy

- **Start:** Deciding if the task needs concurrency protection
- **Does the task duration exceed its frequency interval?**
  - Yes → Must use `->withoutOverlapping()`. Without it, concurrent instances will run and cause data corruption or resource exhaustion.
  - No → Overlap prevention not needed. The task finishes before the next scheduled run.
- **Example:** A task scheduled `everyMinute()` that takes 90 seconds → must use `->withoutOverlapping()`.
- **TTL configuration:** Set timeout: `->withoutOverlapping(60)`. Prevents deadlocks if the task crashes while holding the mutex.
- **Multi-server note:** `->withoutOverlapping()` works per-server. Combine with `->onOneServer()` for fleet coordination.

### Tree 4: Multi-Server and Failure Handling

- **Start:** Configuring tasks for a multi-server environment
- **Is the application deployed on multiple servers?**
  - Yes → Continue.
  - No → Single-server configuration is sufficient.
- **Should the task run once across all servers?**
  - Yes → Use `->onOneServer()`. Requires shared cache (Redis). Mutex stored in cache. Only one server executes each tick.
  - No → Task runs on every server. Suitable for idempotent operations or per-server maintenance.
- **Failure notification:**
  - Critical tasks (heartbeat, billing, security) → `->onFailure(fn)` to alert immediately. Use notification channels (Slack, email, PagerDuty).
  - Routine tasks (cleanup, report generation) → `->appendOutputTo($path)` for log-based monitoring. Alert only after repeated failures.
  - All tasks → Log output to file for audit. Never suppress errors.
- **Heartbeat monitoring:** Schedule a `monitor:heartbeat` task every minute using `->evenInMaintenanceMode()` and `->onOneServer()`. If heartbeat stops, cron or scheduler has failed.
