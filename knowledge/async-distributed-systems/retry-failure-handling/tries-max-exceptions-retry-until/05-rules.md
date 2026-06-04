# Rule Card: K017 — `$tries`, `$maxExceptions`, `retryUntil()`

---

## Rule 1

**Rule Name:** always-set-explicit-tries

**Category:** Always

**Rule:** Always set `$tries` explicitly on every job class.

**Reason:** Default `null` means infinite retries — one overlooked bug causes indefinite worker consumption.

**Bad Example:**
```php
class ProcessOrder implements ShouldQueue
{
    // $tries not set — infinite retries if handle() always throws
}
```

**Good Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public $tries = 3; // Max 3 attempts
}
```

**Exceptions:** Jobs with `retryUntil()` defined may safely leave `$tries` at null since time-based cutoff applies.

**Consequences Of Violation:** A buggy job retries forever, consuming worker time and queue capacity until manually killed — no alert fires because it hasn't "failed" permanently.

---

## Rule 2

**Rule Name:** prefer-retryuntil-for-api-calls

**Category:** Prefer

**Rule:** Prefer `retryUntil()` over `$tries` for external API calls.

**Reason:** `retryUntil()` adapts to variable execution times — a 10-minute retry window with fast responses might get 100 attempts, while slow responses get 10. `$tries` is fixed regardless.

**Bad Example:**
```php
class ApiJob implements ShouldQueue
{
    public $tries = 10; // Fixed — doesn't adapt to response times
}
```

**Good Example:**
```php
class ApiJob implements ShouldQueue
{
    public function retryUntil(): Carbon
    {
        return now()->addMinutes(10); // Adapts to variable response times
    }
}
```

**Exceptions:** Jobs where exact retry count matters (e.g., exactly 3 retries for SLA compliance) should use `$tries`.

**Consequences Of Violation:** During slow API response times, fixed `$tries` may exhaust the available retry window before reaching the limit — the job fails even though the API might recover given more time.

---

## Rule 3

**Rule Name:** max-exceptions-less-than-tries

**Category:** Always

**Rule:** Always keep `$maxExceptions` ≤ `$tries`.

**Reason:** If `$maxExceptions` > `$tries`, the job exhausts `$tries` before reaching `$maxExceptions`, making the exception limit useless.

**Bad Example:**
```php
public $tries = 3;
public $maxExceptions = 5; // Never reached — $tries exhausted first
```

**Good Example:**
```php
public $tries = 5;
public $maxExceptions = 3; // Fails after 3 exceptions, regardless of $tries
```

**Exceptions:** When `$tries` is null (with `retryUntil()`), `$maxExceptions` works independently.

**Consequences Of Violation:** The `$maxExceptions` setting has no effect — the job always exhausts `$tries` first, and the exception limit is silently ignored.

---

## Rule 4

**Rule Name:** no-infinite-retries-without-until

**Category:** Never

**Rule:** Never set `$tries` to `null` without defining `retryUntil()`.

**Reason:** `$tries = null` means unlimited retries — without a time-based cutoff, the job retries forever.

**Bad Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public $tries = null; // No limit, no retryUntil — infinite retries
}
```

**Good Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public $tries = 3; // Explicit limit prevents infinite retries
}
```

**Exceptions:** `retryUntil()` provides a time-based safety net — when defined, `$tries = null` is safe.

**Consequences Of Violation:** One permanent failure condition causes the job to retry forever — consumes worker capacity, fills logs, and generates infinite queue traffic.
