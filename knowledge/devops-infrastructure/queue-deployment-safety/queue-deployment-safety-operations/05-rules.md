# Rule Card: Queue Deployment Safety Operations

---

## Rule 1

**Rule Name:** restart-queue-after-every-deploy

**Category:** Always

**Rule:** Always execute `php artisan queue:restart` after every production deployment.

**Reason:** Workers continue running old code indefinitely without a restart signal. The `queue:restart` command writes a timestamp to cache that workers poll between jobs. Without it, workers process new jobs with old code — potentially causing runtime errors against new schemas, new dependencies, or changed business logic.

**Bad Example:**
```bash
# Deploy script
git pull
composer install --no-dev
php artisan migrate --force
# Missing: php artisan queue:restart
```

**Good Example:**
```bash
# Deploy script
git pull
composer install --no-dev --optimize-autoloader
php artisan queue:restart
php artisan migrate --force
```

**Exceptions:** Serverless environments (Laravel Vapor) where workers are ephemeral and always load fresh code. Batch processing systems without persistent workers.

**Consequences Of Violation:** Old code continues processing for hours/days. Schema changes break old workers. Bug fixes don't take effect. Customer-facing issues persist despite being "fixed."

---

## Rule 2

**Rule Name:** use-serializes-models-on-all-jobs

**Category:** Always

**Rule:** Always use the `SerializesModels` trait on every queued job that accepts Eloquent model instances as constructor parameters.

**Reason:** Without `SerializesModels`, the full model object is serialized at dispatch time. The worker deserializes a stale object — changes made to the database after dispatch are invisible. Constructor signature changes during deployment break deserialization of old payloads. `SerializesModels` stores only the class name and ID, and re-fetches from the database on execution.

**Bad Example:**
```php
class ProcessOrder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable; // Missing SerializesModels

    public function __construct(public Order $order) {} // Full model serialized
}
```

**Good Example:**
```php
class ProcessOrder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Order $order) {} // Only ID serialized
}
```

**Exceptions:** Jobs that accept primitive types only (int, string, array) don't need `SerializesModels`. Jobs that intentionally need the model state frozen at dispatch time (audit snapshots) may forgo it — but this should be explicitly documented.

**Consequences Of Violation:** Old payloads fail deserialization after constructor signature changes — jobs are lost. Stale model data processed by workers. Large job payloads (full model objects) bloat queue storage.

---

## Rule 3

**Rule Name:** deploy-code-before-migrations

**Category:** Always

**Rule:** Deploy application code before running database migrations. Code must handle both old and new schema states.

**Reason:** Running `DROP COLUMN` before deploying code that still references that column causes runtime errors on in-flight workers. Similarly, adding a `NOT NULL` column without a default value breaks old code that inserts without that column. Code-first deployment ensures workers can handle either schema state.

**Bad Example:**
```bash
# Deploy script
php artisan migrate --force   # Adds NOT NULL column
git pull                      # Code doesn't know about new column yet
php artisan queue:restart
```

**Good Example:**
```bash
# Deploy script
git pull                      # Code deployed first — handles both schema states
php artisan queue:restart     # Workers reload with new code
php artisan migrate --force   # Schema changes applied — new code handles both old and new
```

**Exceptions:** Additive changes that are fully backward-compatible (new nullable columns with defaults) can be migrated in either order. However, consistency recommends always deploying code first.

**Consequences Of Violation:** Runtime errors on old workers when schema changes are applied before code. "Column not found" errors. In-flight jobs crash. Data integrity issues from partial writes.

---

## Rule 4

**Rule Name:** graceful-horizon-terminate-with-timeout

**Category:** Always

**Rule:** Always use `php artisan horizon:terminate` for graceful Horizon shutdown, and configure the timeout to exceed the p99 job execution time.

**Reason:** Hard-killing Horizon (`kill -9`) terminates in-flight jobs mid-execution — leaving stale locks (`WithoutOverlapping`, `ShouldBeUnique`), partial database writes, and unreleased resources. `horizon:terminate` sends SIGTERM, workers finish current jobs, then exit. The timeout must be generous enough to let slow jobs complete.

**Bad Example:**
```bash
sudo systemctl stop horizon  # May SIGKILL after default timeout
```

**Good Example:**
```bash
php artisan horizon:terminate --wait  # Wait for all workers to finish
```

```php
// config/horizon.php — set timeout to 2× p99 job duration
'environments' => [
    'production' => [
        'supervisor-1' => [
            'timeout' => 300, // 5 minutes — 2× p99 of 150s
        ],
    ],
],
```

**Exceptions:** Emergency deployments where immediate restart is required and data consistency can be sacrificed (with explicit acknowledgment). Scheduled maintenance windows where jobs are drained beforehand.

**Consequences Of Violation:** Stale locks from killed workers. `ShouldBeUnique` keys never released. `WithoutOverlapping` locks orphaned. Partial database writes from transactions interrupted mid-flight. Manual recovery required.

---

## Rule 5

**Rule Name:** monitor-failed-jobs-post-deploy

**Category:** Always

**Rule:** Actively monitor the `failed_jobs` table for the first 15 minutes after every deployment. Set up automated alerting for unexpected spikes.

**Reason:** Payload incompatibility is discovered on the first deserialization after workers restart. A spike in `failed_jobs` within 15 minutes of deploy indicates a constructor signature change that broke old payloads, a missing `SerializesModels` trait, or a schema-code mismatch.

**Bad Example:**
```
Deploy completes. No monitoring. 2 hours later: customers report missing orders.
Investigation reveals 50,000 failed jobs from incompatible payloads.
```

**Good Example:**
```php
// Post-deploy monitoring command
php artisan queue:failed --count  // Check failed_jobs count

// Alert rule
if failed_jobs_increase > 10% within 15 minutes of deploy → Slack alert → rollback
```

**Exceptions:** None. Every deployment should include post-deploy monitoring. The 15-minute window may be extended for deployments with long-running jobs.

**Consequences Of Violation:** Payload incompatibility goes undetected for hours. Thousands of jobs silently fail. Business operations disrupted. Customer impact before detection.

---

## Rule 6

**Rule Name:** backward-compatible-constructor-changes

**Category:** Always

**Rule:** When modifying job constructor parameters, always add new parameters with default values. Never remove or reorder parameters without a compatibility window.

**Reason:** Jobs dispatched before the deploy have payloads matching the old constructor signature. New workers attempting to unserialize old payloads must succeed. Adding optional parameters with defaults maintains compatibility. Removing parameters breaks it. Reordering non-named parameters breaks it.

**Bad Example:**
```php
// Before deploy: __construct(int $userId)
// After deploy:  __construct(int $userId, string $priority)
// Old payload: {userId: 42} — cannot unserialize (missing $priority)
```

**Good Example:**
```php
// Before deploy: __construct(int $userId)
// After deploy:  __construct(int $userId, ?string $priority = null)
// Old payload: {userId: 42} — unserializes successfully ($priority = null)
```

**Exceptions:** When the old job type is being fully deprecated and a purge of old jobs is performed before deployment (e.g., `DB::table('jobs')->where('payload', 'like', '%OldJob%')->delete()`).

**Consequences Of Violation:** All in-flight jobs with the old constructor signature fail deserialization after deploy. Jobs are lost permanently (moved to failed_jobs without processing). Business operations are interrupted.
