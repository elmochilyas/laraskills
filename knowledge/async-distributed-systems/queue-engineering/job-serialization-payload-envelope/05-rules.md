# Rule Card: K004 — Job Serialization and Payload Envelope Structure

---

## Rule 1

**Rule Name:** pass-ids-not-models

**Category:** Always

**Rule:** Always pass model IDs instead of full Eloquent models to jobs.

**Reason:** Serializing a model with loaded relations serializes the entire object graph — large payload, stale data, and N+1 deserialization queries.

**Bad Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public function __construct(public Order $order) {}
    // Serializes entire model + loaded relations
}
```

**Good Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public function __construct(public int $orderId) {}
    // handle() re-fetches fresh model
}
```

**Exceptions:** When using `SerializesModels` trait and the model is small with no loaded relations, passing the model is acceptable.

**Consequences Of Violation:** Job payloads contain stale model data, large payloads exceed backend limits (SQS 256KB), and deserialization triggers unnecessary queries.

---

## Rule 2

**Rule Name:** keep-payloads-minimal

**Category:** Always

**Rule:** Always keep job payloads minimal — only pass data the job actually needs.

**Reason:** Payload size directly impacts Redis memory, SQS network transfer, and deserialization time.

**Bad Example:**
```php
class GenerateReport implements ShouldQueue
{
    public function __construct(public array $fullPayload) {}
    // Passing entire request payload when only companyId and date range needed
}
```

**Good Example:**
```php
class GenerateReport implements ShouldQueue
{
    public function __construct(
        public int $companyId,
        public string $startDate,
        public string $endDate,
    ) {}
}
```

**Exceptions:** When the job genuinely needs complex data structures that can't be decomposed, pass exactly what's needed — no more.

**Consequences Of Violation:** Larger payloads reduce throughput proportionally — a 10KB payload takes 10x longer to serialize, store, and deserialize than a 1KB payload.

---

## Rule 3

**Rule Name:** avoid-closures-for-complex-jobs

**Category:** Avoid

**Rule:** Avoid closures for complex or reusable jobs.

**Reason:** Closure serialization is ~5-10x slower, more fragile across deploys, and cannot use `$this`, `release()`, or `delete()`.

**Bad Example:**
```php
dispatch(function () use ($order) {
    $order->process();
    // No access to release(), delete(), batch()
});
```

**Good Example:**
```php
class ProcessOrder implements ShouldQueue
{
    public function __construct(public int $orderId) {}

    public function handle(): void
    {
        $order = Order::find($this->orderId);
        $order->process();
    }
}
```

**Exceptions:** Simple one-off async tasks (cache warm, log cleanup) are appropriate for closures.

**Consequences Of Violation:** Fragile serialization breaks on deployment (closure scope changes), and jobs cannot participate in retry control or batches.

---

## Rule 4

**Rule Name:** dont-modify-job-properties-after-construction

**Category:** Never

**Rule:** Never modify job properties after the constructor.

**Reason:** The payload is serialized once when the `PendingDispatch` destructor fires — post-construction changes to properties may not be serialized.

**Bad Example:**
```php
$job = new ProcessOrder($order);
$job->extraData = ['key' => 'value']; // May not be serialized
ProcessOrder::dispatch($job);
```

**Good Example:**
```php
$job = new ProcessOrder($order, ['key' => 'value']);
ProcessOrder::dispatch($job);
```

**Exceptions:** When using `dispatchSync()` (no serialization), post-construction property changes are fine.

**Consequences Of Violation:** Data set after construction is silently lost — the job runs without it, causing logic errors that are difficult to trace because the payload looks correct at serialization time.
