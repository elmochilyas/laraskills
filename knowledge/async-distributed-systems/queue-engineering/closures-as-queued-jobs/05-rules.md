# Rule Card: K078 — Closures as Queued Jobs

---

## Rule 1

**Rule Name:** prefer-class-jobs-over-closures

**Category:** Prefer

**Rule:** Prefer class jobs over closures for anything complex or reusable.

**Reason:** Closure serialization is 5-10x slower, more fragile, and untestable in isolation.

**Bad Example:**
```php
dispatch(function () {
    $report = (new ReportGenerator($this->companyId))->generate();
    Storage::put("reports/{$this->companyId}.pdf", $report);
});
```

**Good Example:**
```php
class GenerateReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue;

    public function __construct(public int $companyId) {}

    public function handle(): void
    {
        $report = (new ReportGenerator($this->companyId))->generate();
        Storage::put("reports/{$this->companyId}.pdf", $report);
    }
}
```

**Exceptions:** Simple one-off async tasks (cache warm, log cleanup) are appropriate for closures.

**Consequences Of Violation:** Slower serialization, fragile scope handling, untestable logic, and no access to `$this->release()`, `$this->delete()`, or batch support.

---

## Rule 2

**Rule Name:** never-use-dollar-this-in-closure

**Category:** Never

**Rule:** Never use `$this` inside a queued closure body.

**Reason:** `$this` may not serialize or may reference an unexpected context on deserialization.

**Bad Example:**
```php
dispatch(function () {
    $this->logActivity('job ran'); // $this is undefined or wrong context
});
```

**Good Example:**
```php
dispatch(function () use ($logger) {
    $logger->logActivity('job ran'); // Capture dependencies explicitly
});
```

**Exceptions:** None — always capture needed variables explicitly via `use (...)`.

**Consequences Of Violation:** Serialization failure at dispatch time, or stale/uninitialized object state at execution time — both cause hard-to-debug runtime errors.

---

## Rule 3

**Rule Name:** import-classes-explicitly-in-closures

**Category:** Always

**Rule:** Always import classes explicitly inside queued closures.

**Reason:** The serialized closure stores source code, not namespaced references — the worker may not have the same auto-imports.

**Bad Example:**
```php
dispatch(function () {
    Cache::put('key', 'value'); // May fail if Cache not imported in worker scope
});
```

**Good Example:**
```php
dispatch(function () {
    use Illuminate\Support\Facades\Cache;
    Cache::put('key', 'value');
});
```

**Exceptions:** When the closure only uses built-in PHP functions and global classes, explicit imports may not be necessary.

**Consequences Of Violation:** Class-not-found errors on the worker — the job fails immediately with no retry useful.

---

## Rule 4

**Rule Name:** closures-only-for-simple-tasks

**Category:** Prefer

**Rule:** Prefer closures only for simple one-off async tasks.

**Reason:** Closures lack full job features (retry controls, batch support, failed method) and are harder to monitor.

**Bad Example:**
```php
dispatch(function () {
    // Complex multi-step order processing with error handling
})->catch(function (Throwable $e) {
    // catch() has no access to retry, delete, or batch API
});
```

**Good Example:**
```php
class ProcessExpiredOrders implements ShouldQueue
{
    public function handle(): void
    {
        // Complex logic with full job API access
    }

    public function failed(): void
    {
        // Dedicated failure handling
    }
}
```

**Exceptions:** Cache warming, log rotation, analytics pings, and other fire-and-forget tasks are good closure candidates.

**Consequences Of Violation:** Debugging failures is harder (no failed() method), retry logic is limited, and the job cannot participate in batches.

---

## Rule 5

**Rule Name:** no-pass-by-reference-in-closures

**Category:** Never

**Rule:** Never pass variables by reference in closure `use (&$var)`.

**Reason:** References are captured at serialization time, not at execution time — the intended late-binding behavior doesn't work across serialization.

**Bad Example:**
```php
$counter = 0;
dispatch(function () use (&$counter) {
    $counter++; // $counter is the value at serialization time, not a live reference
});
```

**Good Example:**
```php
$counter = 0;
dispatch(function () use ($counter) {
    // $counter is a copy of the value at serialization time — predictable behavior
});
```

**Exceptions:** None — pass-by-reference and serialization are fundamentally incompatible.

**Consequences Of Violation:** The reference behavior expected by the developer doesn't survive serialization — unpredictable values at job execution time.
