# Prune Command

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Last Updated:** 2026-06-02

## Executive Summary
The `model:prune` Artisan command discovers models that use the `Prunable` or `MassPrunable` trait and calls their `prune()` method. It can target specific models with the `--model` flag, simulate execution with `--pretend`, and is typically scheduled via `Kernel::schedule()` for periodic cleanup of stale data.

## Core Concepts
- **`model:prune` Artisan command** — registered as `php artisan model:prune`. Iterates all discovered models and calls `prune()` on those using the `Prunable` or `MassPrunable` trait.
- **`--model` flag** — restricts pruning to one or more specific model classes: `php artisan model:prune --model="App\Models\User"`.
- **`--pretend` flag** — dry-run mode that outputs which records would be pruned without actually deleting them.
- **Model discovery** — the command scans all models in `app/Models` (configurable in `prune.discovery` config) for the `Prunable` or `MassPrunable` trait.
- **Scheduling** — typically run in `App\Console\Kernel::schedule()`: `$schedule->command('model:prune')->daily()`.

## Mental Models
- **Garbage truck** — the prune command is the garbage truck that makes its rounds on a schedule. Models with `Prunable` are the bins it picks up. `--model` flag is selecting which bins to empty.
- **Dry run** — `--pretend` is the inspection before emptying. You see what will be thrown away without actually losing anything.
- **Central dispatcher** — the command doesn't know what pruning means for each model. It simply calls `prune()` on each discoverable model. Each model defines its own pruning logic.

## Internal Mechanics
- **Command registration** — defined in `Illuminate\Database\Console\PruneCommand`. Registered automatically when the framework is booted.
- **Handle method** —
  1. Resolves model classes from `app/Models` (or the configured `prune.discovery` paths).
  2. Filters to models that use the `Prunable` or `MassPrunable` trait (checked via `in_array(Prunable::class, class_uses_recursive($model))`).
  3. For each matching model, instantiates it and calls `$model->prune()`.
  4. If `--model` is specified, only those models (which must exist in the discovery list) are pruned.
  5. If `--pretend` is specified, calls `$model->prunable()` and outputs the query and record count without executing the delete.
- **`--model` resolution** — accepts fully qualified class names and aliases (the short class name is resolved against `App\Models` by default).

### Configuration
```php
// config/prune.php
'discovery' => [
    'model_paths' => [
        app_path('Models'),
    ],
],
```

## Patterns
- **Discovery pattern** — the command discovers models rather than requiring explicit registration. This is convention-over-configuration in action.
- **Command + Trait interface** — there is no `Prunable` interface. The command checks for trait usage via `class_uses_recursive()`. This is a duck-typing approach: "if it has the trait, it can be pruned."
- **Scheduled batch processing** — the command is designed to run as a scheduled task, not interactively. This acknowledges that data cleanup is an operational concern, not a user-facing feature.

## Architectural Decisions
- **Decision:** Use trait detection rather than a marker interface.
  - **Context:** Eloquent traits are the primary extension mechanism. Adding an interface would be redundant.
  - **Consequence:** Models that import the trait are automatically discovered. If you import `Prunable` but don't define `prunable()`, the command still runs but prunes nothing (silent no-op).
- **Decision:** `--model` flag accepts multiple values and wildcards? In practice, `--model` accepts comma-separated class names.
  - **Context:** Allows targeted pruning in custom commands or deployment scripts.
  - **Consequence:** `php artisan model:prune --model="User,Post"` prunes only those two models.
- **Decision:** `--pretend` outputs to stdout rather than logging.
  - **Context:** Operators run the command manually to preview; stdout is the natural output channel.
  - **Consequence:** For automated dry-run logging, pipe to a file: `php artisan model:prune --pretend > prune-preview.txt`.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Automatic discovery — no registration needed | Discovery scans filesystem (can be slow with many models) | Cache discovery results or use `--model` for performance |
| `--pretend` allows safe preview | Pretend still executes the prunable query (loading the DB) | Queries in `prunable()` should be safe for repeated execution |
| `--model` flag enables targeted pruning | Must know the full class name or exact alias | Provide helper docs for developers |
| Schedule integration is simple (`daily()`) | No built-in monitoring of prune success/failure | Wrap in a scheduled job with logging and alerting |

## Performance Considerations
- **Discovery overhead** — the command scans the filesystem and loads model files to check for trait usage. With hundreds of models, this adds 100-500ms per invocation. Use `--model` in production to skip discovery.
- **Concurrent command execution** — running the same command in overlapping schedules (e.g., if a prune takes longer than the schedule interval) causes concurrent prunes on the same tables. Use `withoutOverlapping()` in the scheduler.
- **Memory leaks** — if model discovery loads files that autorequire large libraries (e.g., Scout, Telescope), memory usage spikes. Increase `memory_limit` for the Artisan worker or use `--model` to limit scope.
- **Query execution on `--pretend`** — the prunable query is still executed (to count records). For slow queries, pretend mode itself may take significant time.

## Production Considerations
- **Schedule off-peak** — run `model:prune` during low-traffic hours. The default `daily()` runs at midnight, which is usually fine.
- **Monitor for failures** — add a `then` or `onFailure` handler in the scheduler:
  ```php
  $schedule->command('model:prune')->daily()
      ->onFailure(fn () => ...)
      ->then(fn () => ...);
  ```
- **Log prune output** — capture stdout/stderr to a log file for audit:
  ```php
  $schedule->command('model:prune', ['--pretend' => true])
      ->dailyAt('03:00')
      ->sendOutputTo(storage_path('logs/prune-preview.log'));
  ```
- **Custom model paths** — if models live outside `app/Models`, configure `prune.discovery.model_paths` in `config/prune.php`.
- **Cron environment** — ensure the cron user has the correct PHP version and environment configuration. Use `php artisan` with full paths.
- **Containerized environments** — in Kubernetes or Docker, run the prune command as a CronJob or in a dedicated worker container with the correct environment context.

## Common Mistakes
- **Pruning without `--pretend` first in production** — running `model:prune` blind can delete more than intended. Always run `--pretend` first on a production clone or during a dry-run schedule.
- **Overlapping schedules** — if a prune takes 1 hour and the schedule runs every hour, two prune commands overlap. Always add `->withoutOverlapping()`:
  ```php
  $schedule->command('model:prune')->daily()->withoutOverlapping();
  ```
- **Forgetting to import traits** — adding `Prunable` to a model without defining `prunable()` results in zero records pruned (silently).
- **Using `--model` with wrong namespace** — `--model=User` resolves to `App\Models\User`. If the model is in `App\Models\Admin\User`, use the full class name.
- **Not testing prune in CI** — a change to `prunable()` that accidentally removes all constraints (e.g., `return static::query()`) is catastrophic. Test prune behavior in CI with a small dataset.

## Failure Modes
- **Command timeout** — `model:prune` runs until all models are pruned. With large datasets, this can exceed PHP's `max_execution_time`. Increase the limit or use `MassPrunable`.
- **Discovery fails on broken model** — if a model file has a syntax error, the command fails during class loading. Fix the model file; prune cannot skip broken models.
- **`--pretend` output truncated** — if thousands of records match, the stdout output may be truncated by the terminal or log system. Use `->sendOutputTo()` for complete logs.
- **Prune command crashes mid-way** — if model `A` prunes successfully but model `B` throws an exception, model `A`'s changes are committed and model `B`'s are not. The command does not wrap the entire operation in a transaction.
- **Missing trait on parent class** — if a model extends a base model that uses `Prunable`, the `class_uses_recursive` check correctly detects it. But if the trait is on a trait, `class_uses_recursive` also picks it up.

## Ecosystem Usage
- **Laravel Telescope** — `telescope:prune` is a separate command but uses the same pattern internally.
- **Laravel Horizon** — `horizon:clear` and `horizon:purge` are related cleanup commands.
- **Laravel Pulse** — pulse data is pruned via the standard `model:prune` command.
- **Spatie Activitylog** — `activitylog:clean` is a standalone command, but newer versions also support `model:prune` integration.

## Related Knowledge Units

### Prerequisites
- prunable-trait — what the command calls prune() on
- Artisan Console Commands — creating and registering Artisan commands
- Task Scheduling — scheduling commands in Kernel::schedule()

### Related Topics
- Prunable Trait
- Mass Prunable
- Soft Deletes Trait

### Advanced Follow-up Topics
- Artisan Console Commands
- Task Scheduling

## Research Notes
- `model:prune` was introduced in Laravel 8.x alongside the `Prunable` trait.
- The `--pretend` flag was added in Laravel 9.x.
- In Laravel 10+, discovery can optionally be lazy-loaded using `require` instead of autoload, reducing memory overhead.
- The command uses `class_uses_recursive()` which checks all parent classes and traits recursively. This means trait inheritance for `Prunable` works correctly.
- Future versions may add `--chunk` option to control batch size for mass pruning.
- Community package `laravel-model-cleanup` predates the built-in prune command. The built-in command supersedes it for most use cases.
