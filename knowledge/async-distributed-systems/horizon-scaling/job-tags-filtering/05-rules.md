# Rule Card: K045 — Job Tags for Filtering and Monitoring

---

## Rule 1

**Rule Name:** keep-tags-concise-consistent

**Category:** Always

**Rule:** Always keep tags short and follow a consistent convention like `{entity}:{id}`.

**Reason:** Tags are stored as Redis keys — short consistent tags reduce memory usage and enable predictable filtering.

**Bad Example:**
```php
public function tags(): array
{
    return ['the_order_with_id_' . $this->order->id]; // Verbose, inconsistent
}
```

**Good Example:**
```php
public function tags(): array
{
    return [
        'order:' . $this->order->id,
        'region:' . $this->order->region,
    ];
}
```

**Exceptions:** None — consistent tagging conventions are always beneficial.

**Consequences Of ViolATION:** Tags like `the_order_with_id_42`, `order-number-42`, and `oid:42` exist simultaneously — operators can't reliably filter by "all jobs for order 42" without knowing all naming patterns.

---

## Rule 2

**Rule Name:** call-parent-tags-in-override

**Category:** Always

**Rule:** Always call `parent::tags()` when overriding the `tags()` method.

**Reason:** Overriding without parent call loses automatic model tags from `SerializesModels`.

**Bad Example:**
```php
public function tags(): array
{
    return ['order:' . $this->order->id]; // Lost automatic App\Models\Order:42 tag
}
```

**Good Example:**
```php
public function tags(): array
{
    return array_merge(parent::tags(), [
        'order:' . $this->order->id,
    ]);
}
```

**Exceptions:** Jobs that don't use `SerializesModels` have no automatic tags to preserve.

**Consequences Of ViolATION:** The `App\Models\Order:42` automatic tag is lost — operators can't find this job by searching for `App\Models\Order:42`, breaking entity-level correlation across all job types.

---

## Rule 3

**Rule Name:** never-put-pii-in-tags

**Category:** Never

**Rule:** Never put PII or sensitive data in tags.

**Reason:** Tags are visible to anyone with Horizon dashboard access and stored unencrypted in Redis.

**Bad Example:**
```php
public function tags(): array
{
    return ['email:' . $this->user->email]; // PII exposed in dashboard
}
```

**Good Example:**
```php
public function tags(): array
{
    return ['user:' . $this->user->id]; // Entity ID only — no PII
}
```

**Exceptions:** None — tags must never contain personal data.

**Consequences Of ViolATION:** An operator with read-only Horizon access searches for a user's email — the dashboard displays `user:42` and `email:john@example.com`. This PII exposure violates data protection requirements.

---

## Rule 4

**Rule Name:** monitor-tag-cardinality-redis

**Category:** Always

**Rule:** Always monitor Redis memory growth from high-cardinality tags.

**Reason:** Tags never expire in Redis — unbounded growth consumes memory.

**Bad Example:**
```php
// Per-entity tag for every order — 10M orders = 10M Redis keys
```

**Good Example:**
```php
// Grouped tags — lower cardinality
public function tags(): array
{
    return [
        'region:' . $this->order->region,   // Low cardinality
        'date:' . $this->order->created_at->format('Y-m-d'), // Daily buckets
    ];
}
```

**Exceptions:** Short-lived applications where tag volume is manageable.

**Consequences Of ViolATION:** Over 6 months, 10 million unique order tags accumulate in Redis — each tag is a Redis key. Redis memory grows to 500MB+ just for tags, and dashboard tag search queries slow to a crawl.
