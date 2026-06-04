# Anti-Patterns: Prune Command

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Prune Command

## Anti-Patterns

### Pruning Without Monitoring
Scheduling `model:prune` without logging output, tracking failures, or alerting the team. Prune failures go unnoticed, causing unchecked table growth and performance degradation.

**Problem:** Silent failures causing unchecked table growth; undetected data loss from buggy `prunable()` queries; no visibility into prune performance or completion status.

**Solution:** Add `->sendOutputTo()`, `->onFailure()`, and `->then()` handlers to every `model:prune` schedule entry. Monitor duration and record counts.

### Model Discovery in Production
Relying on model discovery (scanning `app/Models`) in production cron instead of using the `--model` flag. Discovery adds startup overhead, loads unintended models, and may auto-include new models with untested `prunable()` queries.

**Problem:** Unnecessary startup latency; memory from loading unintended models; accidental pruning of models that should not be pruned yet; risk of untested `prunable()` auto-executing.

**Solution:** Use `--model` with explicit class names in production scheduler entries. Reserve discovery mode for development.

### No --pretend Validation
Enabling pruning in production without a dry-run validation step. The first scheduled prune may delete far more (or different) records than intended if the `prunable()` query is incorrect.

**Problem:** Mass deletion of active records on the first prune cycle; catastrophic data loss requiring database restore if the query has a bug.

**Solution:** Run `php artisan model:prune --pretend --model=YourModel` in production before adding the model to the prune schedule. Review the output carefully.

### Overlapping Prune Schedules
Running the same prune command at intervals shorter than its execution time without `->withoutOverlapping()`. Two prune processes operate on the same tables simultaneously.

**Problem:** Duplicate prune processes; database deadlocks; doubled database load; corrupted audit logs; resource contention.

**Solution:** Always chain `->withoutOverlapping()` on every `model:prune` schedule entry.

### Prune as a Web Endpoint
Exposing model pruning functionality via an HTTP route or controller. The `model:prune` command is designed as a CLI/background operation — HTTP execution creates security and timeout risks.

**Problem:** Unauthorized data deletion; HTTP timeouts on long-running prunes; DoS attack vector; overlapping prune executions without protection; CSRF exposure.

**Solution:** Run `model:prune` only via the CLI Artisan command (scheduled or manual SSH). Never create a web route that triggers pruning.

### Single Schedule Frequency for All Models
Using one `model:prune` call without `--model` for all prunable models, even when they have different retention needs. Session logs needing hourly pruning conflict with archived content needing weekly pruning.

**Problem:** Session logs retained for 24 hours (security risk with sensitive session data); archived posts pruned too aggressively; wasted prune cycles on infrequently changed models.

**Solution:** Create separate schedule entries with different frequencies for models with different retention policies.

### Pruning the Same Model in Multiple Schedule Entries
Including the same model in both a discovery-based `model:prune` entry and a targeted `--model` entry. The model's `prune()` executes twice per cycle.

**Problem:** Double the prune workload on the database; unnecessary CPU and I/O for duplicate `prunable()` queries; inflated prune log output.

**Solution:** Ensure each prunable model appears in exactly one schedule entry. Deduplicate by using only targeted `--model` entries in production.

### Not Capturing Prune Output
Letting `model:prune` output go to stdout without persistence. When run via the scheduler, stdout output may be lost or unrecorded.

**Problem:** No trace of prune execution history; inability to investigate data loss; compliance audit gaps; no record of how many records were pruned.

**Solution:** Use `->sendOutputTo(storage_path('logs/prune.log'))` to capture prune output to a persistent log file.

### Not Configuring Custom Discovery Paths
Placing prunable models outside `app/Models` without configuring custom discovery paths in `config/prune.php`. The command never discovers these models.

**Problem:** Prunable models in subdirectories or modules are silently ignored; no pruning occurs for models the developer assumed were being pruned.

**Solution:** Configure `config/prune.php` with custom discovery paths, or use `--model` with the full class name for models outside `app/Models`.

### Not Verifying Exit Codes in CI
Running `model:prune` in CI/CD pipelines without checking the exit code. The pipeline may pass even if the command failed, masking pruning regressions.

**Problem:** CI pipelines passing despite prune failures; deployment proceeding with unverified prune behavior; silent regressions in prune logic.

**Solution:** Check the exit code of `model:prune` commands in CI pipelines. Fail the pipeline step on non-zero exit codes.
