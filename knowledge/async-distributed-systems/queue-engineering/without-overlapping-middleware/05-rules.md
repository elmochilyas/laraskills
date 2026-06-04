# Rule Card: K052 — `WithoutOverlapping` Middleware

---

## Rule 1

**Rule Name:** always-scope-by-key

**Category:** Always

**Rule:** Always use `->byKey()` with `WithoutOverlapping` to scope the lock per entity.

**Reason:** Without scoping, the lock key is just the job class name — one job instance blocks ALL instances of that class.

**Bad Example:**
```php
public function middleware(): array
{
    return [new WithoutOverlapping(5)];
    // Global lock — order 123 blocks order 456
}
```

**Good Example:**
```php
public function middleware(): array
{
    return [(new WithoutOverlapping(5))
        ->byKey(fn($job) => $job->order->id)];
    // Per-entity lock — orders 123 and 456 run in parallel
}
```

**Exceptions:** Jobs that are truly global singletons (e.g., "process daily report") should use the default global key.

**Consequences Of Violation:** All jobs of the same class execute serially — order 456 waits for order 123 even though they're completely independent, destroying throughput.

---

## Rule 2

**Rule Name:** set-release-after-backoff

**Category:** Always

**Rule:** Always set `releaseAfter` to a meaningful backoff (5-30 seconds).

**Reason:** Default `releaseAfter` is 0 — the job is released immediately and immediately retries, creating a tight retry loop.

**Bad Example:**
```php
public function middleware(): array
{
    return [(new WithoutOverlapping(5))->byKey(fn($j) => $j->orderId)];
    // releaseAfter defaults to 0 — infinite tight loop
}
```

**Good Example:**
```php
public function middleware(): array
{
    return [(new WithoutOverlapping(5))
        ->byKey(fn($j) => $j->orderId)
        ->releaseAfter(10)]; // 10-second backoff on contention
}
```

**Exceptions:** Jobs that must retry as fast as possible (sub-second latency requirements) may use short release times, but never 0.

**Consequences Of Violation:** The worker consumes 100% CPU releasing and re-popping the same job — the lock is still held, so every retry immediately re-releases. No other jobs can make progress.

---

## Rule 3

**Rule Name:** expire-after-twice-p99

**Category:** Always

**Rule:** Always set `expireAfter` to at least 2x the job's p99 execution time.

**Reason:** If the lock expires while the job is still running, a second instance acquires the lock and overlaps execution.

**Bad Example:**
```php
public function middleware(): array
{
    return [(new WithoutOverlapping(5))
        ->byKey(fn($j) => $j->orderId)
        ->expireAfter(30)]; // Job takes 25s at p99 — lock expires during execution
}
```

**Good Example:**
```php
return [(new WithoutOverlapping(5))
    ->byKey(fn($j) => $j->orderId)
    ->expireAfter(60)]; // 2x p99 — sufficient margin
```

**Exceptions:** Jobs that hold locks for very long durations (hours) may need to balance safety against crash-recovery time.

**Consequences Of Violation:** Two workers process the same entity simultaneously — data corruption, duplicate charges, or race condition bugs that only surface under load.

---

## Rule 4

**Rule Name:** use-atomic-lock-cache-driver

**Category:** Always

**Rule:** Only use `WithoutOverlapping` with cache drivers that support atomic locks.

**Reason:** Non-atomic lock operations are racy — two workers can both acquire "the lock" and run concurrently.

**Bad Example:**
```php
// CACHE_DRIVER=file — no atomic lock support
// WithoutOverlapping silently allows concurrent execution
```

**Good Example:**
```php
// CACHE_DRIVER=redis — full atomic lock support
// WithoutOverlapping guarantees exclusive execution
```

**Exceptions:** Development environments may use any cache driver since exclusive execution is not critical for correctness verification.

**Consequences Of Violation:** The lock is advisory — both workers check, both find "no lock", both set "lock acquired". The "exclusive execution" guarantee is broken silently with no alert.
