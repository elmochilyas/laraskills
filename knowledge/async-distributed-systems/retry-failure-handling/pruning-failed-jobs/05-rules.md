# Rule Card: K086 — Pruning Failed Jobs

---

## Rule 1

**Rule Name:** schedule-daily-pruning

**Category:** Always

**Rule:** Always schedule `queue:prune-failed` to run daily.

**Reason:** Without scheduling, the table grows unbounded — a missed manual prune after an incident leaves the table bloated.

**Bad Example:**
```php
// No scheduled pruning — table grows forever
```

**Good Example:**
```php
// Daily pruning — keeps 7 days of history
$schedule->command('queue:prune-failed --hours=168')->daily();
```

**Exceptions:** Regulated environments requiring longer retention may customize the retention period.

**Consequences Of Violation:** After a high-failure incident, the `failed_jobs` table grows by thousands of rows — without automatic pruning, it stays large indefinitely, slowing all `failed_jobs` queries.

---

## Rule 2

**Rule Name:** prune-during-low-traffic

**Category:** Always

**Rule:** Always run pruning during low-traffic periods.

**Reason:** Large `DELETE` operations on the `failed_jobs` table can lock rows and impact database performance.

**Bad Example:**
```php
// Runs at peak traffic
$schedule->command('queue:prune-failed')->dailyAt('12:00');
```

**Good Example:**
```php
// Runs at 3 AM — low traffic
$schedule->command('queue:prune-failed --hours=168')->dailyAt('03:00');
```

**Exceptions:** When the `failed_jobs` table is small (< 1K rows), peak-time pruning is acceptable.

**Consequences Of Violation:** A large `DELETE` during peak processing locks rows and blocks `INSERT INTO failed_jobs` — a failure during the prune may not be recorded properly.

---

## Rule 3

**Rule Name:** chunked-pruning-for-large-tables

**Category:** Prefer

**Rule:** Prefer chunked pruning for very large failed_jobs tables (> 100K rows).

**Reason:** A single `DELETE` on a 1M-row table can take minutes and block other operations.

**Bad Example:**
```bash
# Single DELETE on 1M rows — long lock time
php artisan queue:prune-failed --hours=168
```

**Good Example:**
```php
// Custom script with chunked deletion
do {
    $deleted = DB::delete("DELETE FROM failed_jobs WHERE failed_at < ? LIMIT 1000", [now()->subDays(7)]);
    usleep(100000); // 100ms pause between chunks
} while ($deleted > 0);
```

**Exceptions:** Small tables (< 10K rows) don't need chunked pruning.

**Consequences Of Violation:** The `DELETE` operation locks rows for minutes — application queries waiting on the same table time out, causing cascading failures.

---

## Rule 4

**Rule Name:** no-overly-aggressive-pruning

**Category:** Never

**Rule:** Never prune failed jobs too aggressively (e.g., 1-hour retention).

**Reason:** Incident evidence is deleted before investigation can discover the root cause.

**Bad Example:**
```php
$schedule->command('queue:prune-failed --hours=1')->daily(); // 1 hour — too aggressive
```

**Good Example:**
```php
$schedule->command('queue:prune-failed --hours=168')->daily(); // 7 days — reasonable
```

**Exceptions:** Development environments where failure history is not needed for debugging.

**Consequences Of Violation:** A production incident occurs at 2 AM — by 9 AM, all failure evidence is pruned. The root cause investigation starts with no data.
