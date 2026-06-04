# Rule Card: K055 — `ShouldBeUnique` and Unique Job Locking

---

## Rule 1

**Rule Name:** override-unique-id-per-entity

**Category:** Always

**Rule:** Always override `uniqueId()` to scope uniqueness per entity.

**Reason:** The default `uniqueId()` returns the class name — ALL instances share the same lock, so only ONE instance of the job can ever be queued.

**Bad Example:**
```php
class ProcessWebhook implements ShouldQueue, ShouldBeUnique
{
    // uniqueId() defaults to class name — only ONE webhook ever queued
}
```

**Good Example:**
```php
class ProcessWebhook implements ShouldQueue, ShouldBeUnique
{
    public function uniqueId(): string
    {
        return $this->eventId; // Per-event uniqueness
    }
}
```

**Exceptions:** Jobs that are truly global singletons (e.g., "generate nightly report") may use the default class-name key intentionally.

**Consequences Of Violation:** A job for event 123 is dispatched — the lock is held for the class. A job for event 456 is silently dropped. Events are lost forever with no error.

---

## Rule 2

**Rule Name:** always-set-unique-for-ttl

**Category:** Always

**Rule:** Always set `uniqueFor` to a reasonable TTL.

**Reason:** With `uniqueFor = 0` (default), the lock only releases on job completion — a crashed job leaves the lock forever, blocking all future dispatches.

**Bad Example:**
```php
class ProcessWebhook implements ShouldQueue, ShouldBeUnique
{
    public function uniqueId(): string { return $this->eventId; }
    // uniqueFor defaults to 0 — lock never expires on crash
}
```

**Good Example:**
```php
class ProcessWebhook implements ShouldQueue, ShouldBeUnique
{
    public function uniqueId(): string { return $this->eventId; }

    public function uniqueFor(): int
    {
        return 3600; // Lock auto-releases after 1 hour
    }
}
```

**Exceptions:** For `ShouldBeUniqueUntilProcessing`, the lock releases when processing starts — `uniqueFor` is less critical but still recommended as a safety net.

**Consequences Of Violation:** A worker crashes mid-job — the lock persists forever. No future webhook for that event ID can ever be processed until the cache key is manually expired.

---

## Rule 3

**Rule Name:** match-unique-for-to-total-time

**Category:** Always

**Rule:** Always set `uniqueFor` to at least max queue wait time + max execution time + buffer.

**Reason:** If `uniqueFor` expires while the first job is still queued (waiting or running), a second instance is dispatched — defeating the uniqueness guarantee.

**Bad Example:**
```php
public function uniqueFor(): int
{
    return 60; // Job takes 30s but queue wait can be 2 minutes
}
```

**Good Example:**
```php
public function uniqueFor(): int
{
    return 600; // 10 minutes — covers queue wait + execution + buffer
}
```

**Exceptions:** When queue wait time is bounded by Horizon's balancing and execution time is predictable, a tighter `uniqueFor` can be calculated.

**Consequences Of Violation:** The lock expires while the job is still queued — a second dispatch succeeds, and two identical jobs are processed concurrently, negating the uniqueness guarantee.

---

## Rule 4

**Rule Name:** combine-with-without-overlapping

**Category:** Prefer

**Rule:** Prefer combining `ShouldBeUnique` with `WithoutOverlapping` for strict guarantees.

**Reason:** `ShouldBeUnique` only prevents dispatch — two jobs dispatched before the second was suppressed can both be in the queue. `WithoutOverlapping` prevents concurrent execution at the processing level.

**Bad Example:**
```php
class ProcessWebhook implements ShouldQueue, ShouldBeUnique
{
    // Unique at dispatch — but timing windows can overlap
}
```

**Good Example:**
```php
class ProcessWebhook implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function middleware(): array
    {
        return [(new WithoutOverlapping($this->eventId))
            ->releaseAfter(10)
            ->expireAfter(120)];
    }
}
```

**Exceptions:** When duplicate execution is acceptable (idempotent jobs), `ShouldBeUnique` alone provides a softer guarantee.

**Consequences Of Violation:** Two webhook events for the same entity both arrive within microseconds — neither dispatch is suppressed. Both jobs are in the queue. Without `WithoutOverlapping`, they execute concurrently.
