# Rule Card: K051 — `ThrottlesExceptions` Middleware

---

## Rule 1

**Rule Name:** decay-exceeds-recovery-time

**Category:** Always

**Rule:** Always set `decayMinutes` longer than the downstream service's typical recovery time.

**Reason:** A too-short window releases the job while the service is still down — it immediately fails again, consuming retries.

**Bad Example:**
```php
public function middleware(): array
{
    return [new ThrottlesExceptions(5, 1)]; // 1-minute window — service takes 5 min to recover
}
```

**Good Example:**
```php
public function middleware(): array
{
    return [new ThrottlesExceptions(5, 10)]; // 10-minute window — covers recovery time
}
```

**Exceptions:** When recovery time is unknown, start with a conservative window (10-15 minutes) and tune based on observed behavior.

**Consequences Of Violation:** The job retries every minute, fails, increments the counter, hits the threshold, waits 1 minute, retries — and fails again because the service is still down. Each cycle wastes worker time and burns retry attempts.

---

## Rule 2

**Rule Name:** use-backoff-callback-for-exception-types

**Category:** Always

**Rule:** Always use the `backoff` callback for exception-specific release delays.

**Reason:** Different exceptions need different delays — 429 (Rate Limiting) should back off longer than 503 (Service Unavailable).

**Bad Example:**
```php
return [new ThrottlesExceptions(5, 10)];
// All exceptions get the same release delay
```

**Good Example:**
```php
return [(new ThrottlesExceptions(5, 10))
    ->backoff(fn(Throwable $e) => match (true) {
        $e instanceof RateLimitException => 60,  // Wait a full minute
        $e instanceof ServiceUnavailable => 30,  // But not as long for 503
        default => 10,                           // Default fallback
    })];
```

**Exceptions:** When all failure modes have similar recovery characteristics, a single backoff value may be sufficient.

**Consequences Of Violation:** A 429 error (retry-After: 60s) gets a 10-second release — the job retries too early and immediately fails again, consuming multiple retry attempts before the rate limit window actually resets.

---

## Rule 3

**Rule Name:** rate-limited-before-throttles-exceptions

**Category:** Prefer

**Rule:** Prefer applying `RateLimited` before `ThrottlesExceptions` in the middleware stack.

**Reason:** `RateLimited` prevents execution entirely when the rate limit is hit — `ThrottlesExceptions` only reacts after a failure occurs.

**Bad Example:**
```php
public function middleware(): array
{
    return [
        new ThrottlesExceptions(5, 10),  // Reactive first — exceptions already occurred
        new RateLimited('api-requests'),  // Proactive second — too late
    ];
}
```

**Good Example:**
```php
public function middleware(): array
{
    return [
        new RateLimited('api-requests'),         // Proactive — prevent execution
        new ThrottlesExceptions(5, 10),           // Reactive — backstop for unexpected failures
    ];
}
```

**Exceptions:** When only one type of protection is needed, order is irrelevant.

**Consequences Of Violation:** The job executes, hits the API rate limit, throws an exception, and `ThrottlesExceptions` reacts — but the job already consumed API quota. `RateLimited` would have prevented the execution entirely.
