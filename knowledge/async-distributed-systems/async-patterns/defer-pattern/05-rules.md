# Rule Card: K065 — Defer Pattern

---

## Rule 1

**Rule Name:** use-defer-for-response-time-sensitivity

**Category:** Prefer

**Rule:** Prefer `defer()` for tasks that must run after response but don't need durability.

**Reason:** Deferred callbacks run in the same process after the response is sent — no queue overhead.

**Bad Example:**
```php
// Queue a simple audit log — full queue pipeline overhead
dispatch(new LogAuditTrail($user, 'login')); // Serialize, Redis, worker, deserialize
```

**Good Example:**
```php
defer(fn() => Log::channel('audit')->info("User {$user->id} logged in"));
// Runs after response — same process, no queue infrastructure
```

**Exceptions:** Tasks that must survive a process crash or need retry logic.

**Consequences Of Violation:** Every page load dispatches 2-3 audit log jobs — the queue worker processes millions of trivial audit entries per day, consuming worker capacity that should process revenue-critical jobs.

---

## Rule 2

**Rule Name:** never-defer-crash-critical-operations

**Category:** Never

**Rule:** Never use `defer()` for operations that must survive a PHP crash.

**Reason:** Deferred callbacks run in the same process — if PHP crashes, they're lost.

**Bad Example:**
```php
defer(fn() => $this->chargeCustomer($order)); // Lost if PHP crashes
```

**Good Example:**
```php
dispatch(new ChargeCustomer($order)); // Survives crash, retries
```

**Exceptions:** Analytics, logging, cache warming — tasks where loss is acceptable.

**Consequences Of ViolATION:** PHP hits memory limit after sending the response — the deferred `chargeCustomer` never runs. The order is created but never charged, and there's no record of the failure.

---

## Rule 3

**Rule Name:** keep-deferred-callbacks-fast

**Category:** Always

**Rule:** Always keep deferred callbacks fast — under 1 second.

**Reason:** The callback runs in the web process — slow callbacks tie up the process and prevent it from serving the next request.

**Bad Example:**
```php
defer(fn() => ReportGenerator::generate(now()->subMonth())); // 30-second report
```

**Good Example:**
```php
dispatch(new GenerateMonthlyReport()); // Queue the heavy work instead
```

**Exceptions:** Callbacks that are guaranteed to execute in under 100ms.

**Consequences Of ViolATION:** Every web process that defers a 5-second task is blocked for 5 seconds — a server with 10 workers processes 10 requests in 5 seconds instead of 100. Throughput drops by 90%.

---

## Rule 4

**Rule Name:** use-defer-for-dispatch-after-response-replacement

**Category:** Prefer

**Rule:** Prefer `defer()` over `dispatchAfterResponse()` for new code.

**Reason:** `defer()` is the Laravel 13 replacement for `dispatchAfterResponse` — more flexible, no job class needed.

**Bad Example:**
```php
// Create a job class for a trivial operation
class LogUserLogin implements ShouldQueue
{
    public function __construct(public User $user) {}
    public function handle(): void { Log::info("User {$this->user->id} logged in"); }
}
$this->dispatchAfterResponse(new LogUserLogin($user));
```

**Good Example:**
```php
defer(fn() => Log::info("User {$user->id} logged in"));
```

**Exceptions:** Tasks that already have job classes and queue infrastructure.

**Consequences Of ViolATION:** The codebase accumulates dozens of trivial job classes (LogAudit, ClearCache, UpdateSession) that could be simple closures — more files to maintain, more points of failure, no benefit.
