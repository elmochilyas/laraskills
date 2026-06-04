# Architectural Decision Rules: Read Model Separation

---

## Rule 1: Never call `save()`, `create()`, `update()`, or `delete()` on a read model
---
## Category
Architecture
---
## Rule
Read model classes must never call persistence mutation methods. Make read models read-only by omitting the `$table` property for writes, or use `Model::readOnly()` or `Model::setConnection()` to a read replica.
---
## Reason
A read model represents data for display, not for mutation. Calling write methods on a read model bypasses domain invariants, corrupts read-optimized data structures, and violates the separation of concerns that makes the pattern valuable.
---
## Bad Example
```php
class UserOrderSummary extends Model
{
    protected $table = 'user_order_summaries';

    public function markAsProcessed(): void
    {
        $this->update(['processed' => true]); // Mutation on read model
    }
}
```
---
## Good Example
```php
class UserOrderSummary extends Model
{
    protected $table = 'user_order_summaries';
    public $incrementing = false;
    public $timestamps = false;

    // No write methods — read-only
    public function isHighValue(): bool
    {
        return $this->lifetime_value_cents > 100000;
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Data integrity violations when writes bypass domain validation; silent corruption of read-optimized schemas; write logic hidden in read paths where it is not expected.

---

## Rule 2: Provide a rebuild Artisan command for every read model
---
## Category
Reliability
---
## Rule
Every read model must have an Artisan command that can rebuild it from scratch using the write model's data. Register the command in `App\Console\Commands\`.
---
## Reason
Projection bugs, schema migrations, or data corruption can leave a read model in an inconsistent state. Without a rebuild command, recovery requires manual database fixes or restore from backup. A rebuild command makes recovery a one-command operation.
---
## Bad Example
```php
// No rebuild command — if projection breaks, data is unrecoverable
class OrderSummaryProjector
{
    // Only runs on events, no way to rebuild from scratch
}
```
---
## Good Example
```php
#[AsCommand('read-model:rebuild-order-summaries')]
class RebuildOrderSummariesCommand extends Command
{
    public function handle(OrderSummaryProjector $projector): void
    {
        Order::chunk(100, function ($orders) use ($projector) {
            foreach ($orders as $order) {
                $projector->projectOrder($order);
            }
        });
        $this->info('Order summaries rebuilt.');
    }
}
```
---
## Exceptions
When the read model is backed by a database view — the view always reflects the current data and cannot become stale.
---
## Consequences Of Violation
Read model corruption is unrecoverable without manual SQL; projection bugs force full data migration; operational incidents require extended manual recovery procedures.

---

## Rule 3: Define acceptable staleness per read model
---
## Category
Reliability
---
## Rule
Document a maximum acceptable staleness for each read model (e.g., "5 minutes" for dashboards, "real-time" for user-facing balances). Monitor projection lag and alert when it exceeds the threshold.
---
## Reason
Different use cases tolerate different delays. A dashboard report can be 15 minutes stale; a user's wallet balance must be current. Without documented SLAs, developers assume real-time consistency for all read models, leading to either over-engineering or disappointed users.
---
## Bad Example
```php
// No staleness documented — assumed real-time
class OrderSummary extends Model
{
    // ... projectors update this asynchronously
    // No one knows if 1 second or 1 hour lag is acceptable
}
```
---
## Good Example
```php
/**
 * OrderSummary read model
 * Acceptable staleness: 5 minutes for dashboard views
 * Rebuild command: php artisan read-model:rebuild-order-summaries
 * SLA: Must not exceed 10 minutes of lag (PagerDuty alert at 8 min)
 */
class OrderSummary extends Model
{
    protected $table = 'order_summaries';
}
```
---
## Exceptions
Read models that must be real-time consistent with the write model. In this case, use synchronous projection within the write transaction.
---
## Consequences Of Violation
Users see stale data without understanding why; projection lag goes unmonitored until complaints arise; inconsistent expectations between team members about data freshness.

---

## Rule 4: Use database views as the default read model before building a projection system
---
## Category
Performance
---
## Rule
Start with a database view for read model separation before building a queue-based projection system. Map an Eloquent model with `$table` pointing to the view name for immediate query capability.
---
## Reason
Database views require no projection code, no event handlers, and no queue infrastructure. They always reflect the current data and have near-zero maintenance cost. Only migrate to a projection system when the view query becomes a performance bottleneck.
---
## Bad Example
```php
// Event-sourced projection for a simple use case that a view could serve
class UserStatsProjector
{
    // 50 lines of event handling + queue setup + rebuild command
    // When a simple SQL view would suffice
}
```
---
## Good Example
```php
// View-backed read model — zero maintenance
class UserOrderSummary extends Model
{
    protected $table = 'user_order_summaries'; // CREATE VIEW ... SELECT ...
    public $incrementing = false;
    public $timestamps = false;
}

// SQL:
// CREATE VIEW user_order_summaries AS
// SELECT u.id, u.name, COUNT(o.id) AS total_orders,
//   COALESCE(SUM(o.total), 0) AS lifetime_value
// FROM users u LEFT JOIN orders o ON o.user_id = u.id
// GROUP BY u.id, u.name;
```
---
## Exceptions
When the view query involves complex joins on large tables that become slow at scale. At that point, migrate to a materialized view or projection table with appropriate refresh strategy.
---
## Consequences Of Violation
Unnecessary complexity from queue-based projection for simple read needs; event handling code that must be maintained and monitored; projection lag even when real-time data is available via a view.

---

## Rule 5: Index read model tables independently from write model tables
---
## Category
Performance
---
## Rule
Design read model indexes to optimize query performance, independent of write model indexes. Add indexes that support read model queries even if they are redundant for the write model.
---
## Reason
Write model indexes are optimized for transactional integrity and single-row lookups by primary key. Read model indexes should optimize for the filter, sort, and aggregation patterns of the actual queries hitting them. Different access patterns require different indexes.
---
## Bad Example
```php
// Read model uses the same indexes as the write model
Schema::table('order_summaries', function (Blueprint $table) {
    $table->index('user_id'); // Only index that matches write model
    // No index on columns that reports actually filter by
});
```
---
## Good Example
```php
// Read model indexes optimized for actual query patterns
Schema::table('order_summaries', function (Blueprint $table) {
    $table->index('user_id');
    $table->index(['status', 'created_at']); // Report filtering
    $table->index('total_cents'); // Sorting by value
});
```
---
## Exceptions
When the read model is backed by a database view on the same table as the write model. In that case, indexes on the underlying table must balance read and write performance.
---
## Consequences Of Violation
Read model queries perform slowly despite being optimized for reads; full table scans on filter columns; indexes added reactively after performance incidents.

---

## Rule 6: Never expose write-model columns (passwords, internal flags) in read models
---
## Category
Security
---
## Rule
When projecting data to a read model, explicitly exclude sensitive write-model columns. Use a selective column list rather than `SELECT *` in projections and view definitions.
---
## Reason
Read models are often consumed by API responses and Blade views where data exposure risks are higher. Including password hashes, internal status flags, or audit columns in a read model creates a data leak vector if the read model is inadvertently serialized or logged.
---
## Bad Example
```php
// View that exposes sensitive columns
// CREATE VIEW user_profiles AS
// SELECT * FROM users; -- Includes password_hash, remember_token, internal_notes
```
---
## Good Example
```php
// View that only exposes safe columns
// CREATE VIEW user_profiles AS
// SELECT id, name, email, avatar_url, created_at
// FROM users;
```
---
## Exceptions
When the write model columns are already public-only (e.g., public user profile data) and no sensitive columns exist.
---
## Consequences Of Violation
Data leak when read model is serialized to JSON; sensitive internal flags visible in API responses; compliance violations (GDPR, SOC2) from exposing unnecessary personal data.

---

## Rule 7: Monitor projection lag and alert on threshold breaches
---
## Category
Reliability
---
## Rule
Track the time delta between write model changes and read model updates. Alert when the lag exceeds the documented SLA for that read model.
---
## Reason
Projection lag silently grows when the queue backs up, a projector crashes, or the database slows. Without monitoring, the read model becomes increasingly stale without anyone noticing until users report incorrect data.
---
## Bad Example
```php
// No monitoring — projection lag can grow indefinitely
class OrderSummaryProjector
{
    public function handle(OrderCreated $event): void
    {
        // Projects but nobody monitors if this keeps up
    }
}
```
---
## Good Example
```php
class OrderSummaryProjector
{
    public function handle(OrderCreated $event): void
    {
        $this->project($event);
        ReadModelHealth::recordProjection(
            model: 'order_summaries',
            lagSeconds: now()->diffInSeconds($event->occurredAt),
        );
    }
}

// Health check endpoint or scheduled task checks lag
if (ReadModelHealth::maxLag('order_summaries') > 300) {
    Alert::critical('Order summaries projection lag exceeds 5 minutes');
}
```
---
## Exceptions
Read models backed by database views — they can never become stale.
---
## Consequences Of Violation
Users see stale data without system awareness; projection failures go undetected for hours or days; operational trust in read model data erodes.

---

## Rule 8: Separate read model classes into a `Models\Read\` namespace
---
## Category
Code Organization
---
## Rule
Place all read model classes in a dedicated `App\Models\Read\` namespace. Use `App\Models` for write/domain models and `App\Models\Read` for display-optimized models.
---
## Reason
A dedicated namespace makes the read vs. write concern visible at the filesystem level. Developers immediately know whether a given model can be used for writes or is strictly for querying. This prevents accidental mutations on read models and clarifies architectural intent.
---
## Bad Example
```php
// All models mixed in one namespace
App\Models\User.php           // Write model
App\Models\UserOrderSummary.php // Read model — unclear intent
```
---
## Good Example
```php
// Clear separation at namespace level
App\Models\User.php                  // Write model
App\Models\Read\UserOrderSummary.php // Read model
App\Models\Read\MonthlyReport.php    // Read model
```
---
## Exceptions
When using database views mapped to Eloquent models in the same namespace. In small projects, a naming convention suffix (`*Summary`, `*Report`) can substitute for a directory split.
---
## Consequences Of Violation
Developers accidentally call `save()` on read models; no filesystem cue for architectural intent; read/write models mixed in import auto-completion, confusing IDE suggestions.
