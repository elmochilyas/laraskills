# Phase 5: Rules — Prune Command

## Rule 1: Always schedule `model:prune` with `->withoutOverlapping()`
---
## Category
Reliability
---
## Rule
Chain `->withoutOverlapping()` on every `model:prune` schedule entry. Do not schedule pruning without concurrency protection.
---
## Reason
If a prune run exceeds the schedule interval, a second process starts before the first finishes. Two prune processes operating on the same tables cause resource contention, deadlocks, and potential duplicate processing of records.
---
## Bad Example
```php
protected function schedule(Schedule $schedule): void
{
    $schedule->command('model:prune')->daily();
    // If prune takes >24h, the next run starts while previous is still running
}
```
---
## Good Example
```php
protected function schedule(Schedule $schedule): void
{
    $schedule->command('model:prune')
        ->daily()
        ->withoutOverlapping();
}
```
---
## Exceptions
Prune operations that are guaranteed to complete in seconds and are scheduled at intervals much longer than their duration.
---
## Consequences Of Violation
Duplicate prune processes; database deadlocks; doubled database load; corrupted audit logs.
---

## Rule 2: Use `--model` in production to avoid discovery overhead
---
## Category
Performance
---
## Rule
Specify exact model class names with the `--model` flag in production cron entries. Do not rely on model discovery in production.
---
## Reason
Model discovery scans the filesystem (default `app/Models`) and loads every model file to check for `Prunable`/`MassPrunable` trait usage. This adds 100-500ms startup overhead, may load large libraries (Scout, Telescope) as model dependencies, and can pick up unintended models. `--model` specifies exactly which models to prune.
---
## Bad Example
```php
// Discovery mode — loads all models, adds overhead, may prune unexpected models
$schedule->command('model:prune')->daily()->withoutOverlapping();
```
---
## Good Example
```php
// Targeted — only prunes specified models, skips discovery overhead
$schedule->command('model:prune', [
    '--model' => [
        \App\Models\ArchivedPost::class,
        \App\Models\SessionLog::class,
    ],
])->daily()->withoutOverlapping();
```
---
## Exceptions
Development environments where model counts are small and discovery overhead is negligible.
---
## Consequences Of Violation
Unnecessary startup latency; memory from loading unintended models; accidental pruning of models that should not be pruned yet.
---

## Rule 3: Run `--pretend` in production before enabling any new prune schedule
---
## Category
Reliability
---
## Rule
Execute `php artisan model:prune --pretend --model=YourModel` in the production environment before adding the model to the prune schedule. Do not schedule pruning for a new model without a dry-run verification.
---
## Reason
The `--pretend` flag shows exactly which records match the `prunable()` query without deleting them. This catches critical mistakes (missing `onlyTrashed()`, incorrect date conditions, overly broad filters) before they cause irreversible data loss.
---
## Bad Example
```php
// New prunable model added to schedule without any production preview
$schedule->command('model:prune', [
    '--model' => [\App\Models\ArchivedPost::class],
])->daily()->withoutOverlapping();
```
---
## Good Example
```php
// Step 1: Preview in production
// ssh production "php artisan model:prune --model=ArchivedPost --pretend"
// Output shows 150 records would be pruned, all trashed > 90 days — correct

// Step 2: Deploy the schedule
// Step 3: Monitor prune output on first execution
```
---
## Exceptions
Models that have been running pruning for months and are being edited — rerun `--pretend` after each edit to the `prunable()` query.
---
## Consequences Of Violation
Mass deletion of active records on the first prune cycle; catastrophic data loss requiring database restore.
---

## Rule 4: Capture prune output to a log file for audit trail
---
## Category
Security
---
## Rule
Use `->sendOutputTo()` to capture `model:prune` output to a log file. Do not let prune output go to stdout without persistence.
---
## Reason
The prune command outputs which records were pruned, how many, and any errors. Without capturing this output to a file, the information is lost after the terminal session closes. Audit trails are essential for compliance and incident investigation.
---
## Bad Example
```php
$schedule->command('model:prune')
    ->daily()
    ->withoutOverlapping();
// Output goes to stdout — not persisted, no audit trail
```
---
## Good Example
```php
$schedule->command('model:prune')
    ->daily()
    ->withoutOverlapping()
    ->sendOutputTo(storage_path('logs/prune.log'))
    ->onFailure(fn () => Log::error('model:prune command failed'))
    ->then(fn () => Log::info('model:prune completed successfully'));
```
---
## Exceptions
No common exceptions. Always persist prune output for audit purposes.
---
## Consequences Of Violation
No trace of prune execution history; inability to investigate data loss; compliance audit gaps.
---

## Rule 5: Add `->onFailure()` and `->then()` handlers for monitoring
---
## Category
Maintainability
---
## Rule
Attach both `->onFailure()` and `->then()` callbacks to every `model:prune` schedule entry. Do not schedule pruning without monitoring.
---
## Reason
Prune failures can go unnoticed for days without monitoring. A failure may mean no records were pruned (table bloat continues) or, worse, the `--pretend` flag was accidentally removed and records were incorrectly deleted. `onFailure()` alerts the team; `then()` provides a heartbeat that pruning is running.
---
## Bad Example
```php
$schedule->command('model:prune')
    ->daily()
    ->withoutOverlapping();
// No monitoring — failures are invisible
```
---
## Good Example
```php
$schedule->command('model:prune')
    ->daily()
    ->withoutOverlapping()
    ->sendOutputTo(storage_path('logs/prune.log'))
    ->onFailure(fn () => Log::error('Prune command failed', [
        'output' => file_get_contents(storage_path('logs/prune.log')),
    ]))
    ->then(fn () => Log::info('Prune completed'));
```
---
## Exceptions
No common exceptions. Always monitor prune execution.
---
## Consequences Of Violation
Silent failures causing unchecked table growth; undetected data loss; delayed incident response.
---

## Rule 6: Use separate schedule entries with different frequencies for models with different retention needs
---
## Category
Architecture
---
## Rule
Create separate `--model` schedule entries when models have different pruning frequency requirements. Do not use a single `model:prune` call for all models with different retention windows.
---
## Reason
A daily prune that processes all models is appropriate only when all models need daily pruning. A model that needs hourly pruning (session logs) conflicts with a model that needs weekly pruning (archived content). Separate entries allow each model to be pruned at its appropriate frequency.
---
## Bad Example
```php
// Single entry — all models pruned daily, even those needing different frequencies
$schedule->command('model:prune', [
    '--model' => [
        SessionLog::class,     // Should be hourly
        ArchivedPost::class,   // Should be weekly
    ],
])->daily()->withoutOverlapping();
```
---
## Good Example
```php
// Hourly — ephemeral data
$schedule->command('model:prune', [
    '--model' => [SessionLog::class],
])->hourly()->withoutOverlapping();

// Daily — standard retention
$schedule->command('model:prune', [
    '--model' => [Notification::class],
])->daily()->withoutOverlapping();

// Weekly — archival data
$schedule->command('model:prune', [
    '--model' => [ArchivedPost::class],
])->weekly()->withoutOverlapping();
```
---
## Exceptions
When all models share the same pruning frequency and retention window.
---
## Consequences Of Violation
Session logs retained for 24 hours (security risk with sensitive session data); archived posts pruned too aggressively; wasted prune cycles on models that don't need daily pruning.
---

## Rule 7: Never expose `model:prune` functionality via an HTTP route
---
## Category
Security
---
## Rule
Run `model:prune` only via the CLI Artisan command (scheduled or manual). Do not create a web route or controller that triggers pruning.
---
## Reason
The `model:prune` command is designed as a background maintenance operation. Exposing it via HTTP creates security risks (unauthorized triggering, CSRF, DoS amplification), timeout issues (prune may exceed HTTP timeout), and bypasses scheduling constraints (no `->withoutOverlapping()` protection).
---
## Bad Example
```php
// Security risk: pruning via HTTP
Route::post('/admin/prune', function () {
    Artisan::call('model:prune');
    return response()->json(['pruned' => true]);
})->middleware('auth');
```
---
## Good Example
```php
// Scheduled only — safe and reliable
protected function schedule(Schedule $schedule): void
{
    $schedule->command('model:prune')
        ->daily()
        ->withoutOverlapping();
}

// Admin can trigger via SSH or deployment pipeline:
// ssh production "php artisan model:prune --model=User"
```
---
## Exceptions
Internal admin endpoints protected by IP whitelist, authentication, rate limiting, and an async job dispatch pattern that queues the prune rather than executing it synchronously.
---
## Consequences Of Violation
Unauthorized data deletion; HTTP timeouts on long-running prunes; DoS attack vector; overlapping prune executions without protection.
---

## Rule 8: Configure custom model paths in `config/prune.php` if models live outside `app/Models`
---
## Category
Code Organization
---
## Rule
Publish and configure `config/prune.php` with custom discovery paths when prunable models are organized in subdirectories or modules. Do not rely on the default `app/Models` scanner for non-standard layouts.
---
## Reason
The `model:prune` command discovers prunable models by scanning the configured paths (default `app/Models`). Models in subdirectories (`app/Models/Analytics/SessionLog`) or modular structures (`app/Modules/Billing/Models/Invoice`) are not discovered unless the paths are explicitly configured.
---
## Bad Example
```php
// Model in a subdirectory — never discovered by default scanner
// app/Models/Analytics/SessionLog.php — uses Prunable
// model:prune never finds it because it's not directly in app/Models
```
---
## Good Example
```php
// config/prune.php
return [
    'discovery' => [
        'paths' => [
            app_path('Models'),
            app_path('Modules/*/Models'),
        ],
    ],
];

// Or use --model explicitly (preferred for production):
$schedule->command('model:prune', [
    '--model' => [
        \App\Modules\Billing\Models\Invoice::class,
    ],
])->daily()->withoutOverlapping();
```
---
## Exceptions
No common exceptions. Either configure discovery paths or use `--model` for non-standard locations.
---
## Consequences Of Violation
Prunable models in subdirectories are silently ignored; no pruning occurs for models the developer assumed were being pruned.
---

## Rule 9: Verify that `model:prune` exit code is monitored in CI/CD pipelines
---
## Category
Testing
---
## Rule
Check the exit code of `model:prune` in CI/CD pipelines. Do not assume the command succeeded without verifying the return code.
---
## Reason
The command returns exit code 0 on success and non-zero on failure (exception during pruning, model not found, etc.). Without checking the exit code, pipeline steps that depend on pruning (e.g., post-prune validation) may execute against an un-pruned database state.
---
## Bad Example
```bash
# CI pipeline step — exit code not checked
php artisan model:prune --model=User --pretend
```
---
## Good Example
```bash
# CI pipeline step — exit code checked
php artisan model:prune --model=User --pretend
if ($LASTEXITCODE -ne 0) {
    Write-Error "Prune validation failed"
    exit 1
}
```
---
## Exceptions
No common exceptions. Always verify exit codes in automated pipelines.
---
## Consequences Of Violation
CI pipelines passing despite prune failures; deployment proceeding with unverified prune behavior; silent regressions in prune logic.
---

## Rule 10: Do not prune the same model in multiple overlapping schedule entries
---
## Category
Reliability
---
## Rule
Ensure each prunable model appears in at most one schedule entry. Do not include the same model in multiple `model:prune` calls.
---
## Reason
If the same model is pruned by two separate schedule entries (e.g., one all-models entry and one targeted entry), the model's `prune()` method executes twice per cycle. This doubles the database load and, for `MassPrunable`, the second call deletes an empty result set (wasted query), but for `Prunable`, it re-iterates remaining records unnecessarily.
---
## Bad Example
```php
// SessionLog is pruned TWICE per cycle
$schedule->command('model:prune')->daily(); // Includes SessionLog via discovery
$schedule->command('model:prune', [
    '--model' => [SessionLog::class], // Also prunes SessionLog
])->daily();
```
---
## Good Example
```php
// Each model appears in exactly one entry
$schedule->command('model:prune', [
    '--model' => [
        SessionLog::class,
        ArchivedPost::class,
    ],
])->daily();
```
---
## Exceptions
No common exceptions. Deduplicate prune schedules.
---
## Consequences Of Violation
Double the prune workload on the database; unnecessary CPU and I/O for duplicate `prunable()` queries; inflated prune log output.
