# Rule Card: K005 — `SerializesModels` Trait and Model Restoration

---

## Rule 1

**Rule Name:** guard-against-null-models

**Category:** Always

**Rule:** Always guard against null models in your job's `handle()` method.

**Reason:** If a model is deleted between dispatch and processing, the restored property is `null` — any method call on it crashes.

**Bad Example:**
```php
public function handle(): void
{
    $this->order->markAsProcessed(); // Crash if order was deleted
}
```

**Good Example:**
```php
public function handle(): void
{
    if (! $this->order) {
        Log::warning('Order no longer exists', ['order_id' => $this->orderId]);
        return;
    }
    $this->order->markAsProcessed();
}
```

**Exceptions:** When you're certain the model cannot be deleted (immutable records), the null check can be omitted but is still recommended.

**Consequences Of Violation:** "Call to a member function on null" errors with no context — the job fails, goes through retry, fails again, and lands in failed_jobs with no indication that the model was deleted.

---

## Rule 2

**Rule Name:** avoid-models-with-loaded-relations

**Category:** Avoid

**Rule:** Avoid passing models with loaded relations to jobs.

**Reason:** Each loaded relation triggers a cascading `find()` on deserialization — a model with 3 relations makes 4 `find()` queries before `handle()`.

**Bad Example:**
```php
$order = Order::with(['items', 'user', 'billingAddress'])->find($id);
ProcessOrder::dispatch($order);
// Deserialization: 4 find() queries before handle()
```

**Good Example:**
```php
ProcessOrder::dispatch($orderId);
// handle() loads only what it needs
```

**Exceptions:** Small, always-loaded relations (e.g., a `Profile` relation on `User`) may be acceptable at low volume.

**Consequences Of Violation:** Each job execution starts with N+1 database queries before `handle()` runs — at scale, this adds significant database load.

---

## Rule 3

**Rule Name:** pass-ids-for-large-collections

**Category:** Prefer

**Rule:** Prefer passing model IDs instead of collections for collections > 100 items.

**Reason:** Each collection item triggers one `find()` query on deserialization — 1000 items = 1000 queries before `handle()`.

**Bad Example:**
```php
ProcessBatch::dispatch($users); // 5000 users — 5000 find() queries
```

**Good Example:**
```php
ProcessBatch::dispatch($userIds); // Array of IDs — load in handle()
```

**Exceptions:** When the collection is small (< 100) and you need the latest state of each item, the convenience of `SerializesModels` may be acceptable.

**Consequences Of Violation:** Massive N+1 deserialization overhead — a 1000-item job makes 1000 DB queries before executing any business logic.

---

## Rule 4

**Rule Name:** dont-modify-restored-models-for-retries

**Category:** Never

**Rule:** Never modify restored models expecting the change to persist across retries.

**Reason:** The payload is immutable — the serialized `ModelIdentifier` is fixed at dispatch. Retries re-fetch the original data.

**Bad Example:**
```php
public function handle(): void
{
    $this->order->status = 'processing'; // Lost on retry — next retry re-fetches original
    $this->order->save();
}
```

**Good Example:**
```php
public function handle(): void
{
    $order = Order::find($this->orderId);
    $order->status = 'processing';
    $order->save();
}
```

**Exceptions:** None — the job payload is immutable once serialized. Always re-fetch models in `handle()` if you need to modify them for retry scenarios.

**Consequences Of Violation:** On retry, the model is re-fetched from the database — any in-memory changes that weren't persisted to a separate tracking mechanism are lost.

---

## Rule 5

**Rule Name:** dont-rely-on-pivot-attributes

**Category:** Never

**Rule:** Never expect pivot attributes to persist through `SerializesModels` serialization.

**Reason:** Pivot data on `BelongsToMany` relationships is NOT automatically restored during deserialization.

**Bad Example:**
```php
public function handle(): void
{
    $role = $this->user->roles->first();
    $expiresAt = $role->pivot->expires_at; // null — pivot data lost
}
```

**Good Example:**
```php
public function __construct(
    public int $userId,
    public array $pivotData,
) {}

public function handle(): void
{
    // Use $this->pivotData explicitly
}
```

**Exceptions:** None — always pass pivot data explicitly as a separate property.

**Consequences Of Violation:** Pivot attributes silently resolve to `null` — the job runs with missing data, potentially making incorrect decisions or silently skipping operations.
