# Prune Command — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Prune Command
- **ECC Version:** 1.0

## Overview
The `model:prune` Artisan command discovers models that use the `Prunable` or `MassPrunable` trait and calls their `prune()` method. It scans model paths (default `app/Models`) for trait usage, filters to eligible models, and invokes pruning. The `--model` flag targets specific classes; the `--pretend` flag simulates execution without deleting. It is typically scheduled via `Kernel::schedule()` for periodic cleanup of stale data.

## Core Concepts
- `model:prune` — Artisan command that iterates all discovered models and calls `prune()` on prunable ones
- `--model` flag — restricts pruning to one or more specific model classes
- `--pretend` flag — dry-run mode that outputs which records would be pruned without actually deleting
- Model discovery — scans `app/Models` (configurable in `prune.discovery`) for `Prunable`/`MassPrunable` trait usage
- Trait detection — uses `class_uses_recursive()` to check for trait usage (duck-typing approach)
- Scheduling — typically `$schedule->command('model:prune')->daily()` in `Kernel::schedule()`

## When To Use
- Scheduled cleanup of stale data across all prunable models in the application
- Targeted pruning of specific models via `--model` flag in custom maintenance scripts
- Pre-deployment validation via `--pretend` to preview which records will be affected
- CI/CD pipeline checks to verify pruning behavior before production deployment
- Integration with monitoring — capturing prune output for observability and alerting

## When NOT To Use
- Do NOT use `model:prune` without scheduling constraints — running every minute would cause overlapping prunes
- Do NOT use model discovery for single-model pruning in scripts — use `--model` for performance
- Do NOT run `model:prune` without testing with `--pretend` first in production
- Do NOT rely on the command for audit logging — it outputs to stdout; capture and store separately
- Do NOT use `model:prune` in a web request context — it's a CLI-only command

## Best Practices (WHY)
- Always schedule with `->withoutOverlapping()` — pruning can take longer than the schedule interval
- Use `--model` in production cron to avoid discovery overhead — specify the exact models to prune
- Run `model:prune --pretend` before enabling the schedule in production to verify the scope
- Capture prune output to a log file via `->sendOutputTo()` for audit trail
- Add `->onFailure()` and `->then()` handlers to the schedule for monitoring
- Schedule pruning during off-peak hours — default `daily()` at midnight is usually fine

## Architecture Guidelines
- Register `model:prune` in `Kernel::schedule()` with appropriate frequency per model
- Use multiple schedule entries with different `--model` flags if different pruning frequencies are needed
- Configure custom model paths in `config/prune.php` if models live outside `app/Models`
- For models that take a long time to prune, use separate schedule entries with staggered times
- Integrate prune monitoring with the application's observability stack (logs, metrics, alerts)

## Performance
- Discovery overhead — scanning the filesystem and loading model files adds 100-500ms per invocation
- Use `--model` in production to skip discovery entirely for known model sets
- Concurrent command execution — overlapping prunes on the same tables cause contention; use `withoutOverlapping()`
- Memory leaks — model discovery may load large libraries (Scout, Telescope); use `--model` to limit scope
- `--pretend` still executes the `prunable()` query — for slow queries, pretend mode itself may be slow

## Security
- The `model:prune` command should only be executable from CLI — not from web routes
- `--pretend` output may reveal record IDs and query conditions — restrict log access
- Pruning bypasses authorization policies — ensure `prunable()` queries respect data access rules
- Command output may contain sensitive information if `prunable()` queries reveal record details
- Schedule the command as a non-privileged system user with minimal database permissions

## Common Mistakes
- Pruning without `--pretend` first in production — running blind can delete more than intended
- Missing `->withoutOverlapping()` — if a prune takes >24h and runs daily, concurrency issues arise
- Forgetting to import traits — adding `Prunable` without defining `prunable()` results in zero records pruned (silent)
- Using `--model` with wrong namespace — `--model=User` resolves to `App\Models\User`; use full class name for other namespaces
- Not testing prune in CI — a change to `prunable()` that accidentally removes all constraints is catastrophic

## Anti-Patterns
- **Pruning without monitoring**: scheduling `model:prune` without logging or alerting on failures
- **Model discovery in production**: relying on discovery (scanning `app/Models`) instead of `--model` in production cron
- **No `--pretend` validation**: enabling pruning in production without a dry-run validation step
- **Overlapping prune schedules**: running the same prune command at intervals shorter than its execution time
- **Prune as a web endpoint**: exposing model pruning via an HTTP route — it's a CLI/background operation

## Examples
```php
// In App\Console\Kernel.php
protected function schedule(Schedule $schedule): void
{
    // Prune all prunable models daily
    $schedule->command('model:prune')
        ->daily()
        ->withoutOverlapping()
        ->sendOutputTo(storage_path('logs/prune.log'))
        ->onFailure(fn () => Log::error('Prune command failed'))
        ->then(fn () => Log::info('Prune completed'));

    // Targeted pruning with different frequency
    $schedule->command('model:prune', [
        '--model' => [
            \App\Models\SessionLog::class,
            \App\Models\Notification::class,
        ],
    ])->hourly()->withoutOverlapping();
}

// CLI usage
php artisan model:prune                                          # Prune all models
php artisan model:prune --model="App\Models\User"                # Prune specific model
php artisan model:prune --model="User,Post"                      # Multiple models (short names)
php artisan model:prune --pretend                                # Dry run only
php artisan model:prune --pretend > prune-preview.txt            # Capture dry run output
```

## Related Topics
- prunable-trait — what the command calls `prune()` on
- mass-prunable — bulk pruning without per-record events
- soft-deletes-trait — the prerequisite for most pruning use cases
- task-scheduling — scheduling commands in `Kernel::schedule()`
- artisan-console-commands — creating and registering Artisan commands

## AI Agent Notes
- Discover models by scanning `app/Models` for `Prunable`/`MassPrunable` trait usage
- Use `--model` in production for performance — specify exact class names
- Always add `->withoutOverlapping()` to the prune schedule
- Run `--pretend` before enabling pruning in production to verify the scope
- Schedule prunes during off-peak hours; default `daily()` at midnight is standard
- Capture output to a log file for audit trail with `->sendOutputTo()`
- Add `->onFailure()` for alerting when prune fails

## Verification
- [ ] `model:prune` discovers and prunes all prunable models
- [ ] `--model=User` prunes only the User model
- [ ] `--model=User,Post` prunes both models
- [ ] `--pretend` outputs records but does NOT delete
- [ ] Non-prunable models are ignored by the command
- [ ] Schedule executes prune correctly via `Kernel::schedule()`
- [ ] `->withoutOverlapping()` prevents concurrent executions
- [ ] Custom model discovery paths work for models outside `app/Models`
- [ ] Model throwing exception does not stop the entire command
- [ ] Exit code is 0 on success, non-zero on failure
