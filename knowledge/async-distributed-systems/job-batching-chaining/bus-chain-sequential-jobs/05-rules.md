# Rule Card: K013 — `Bus::chain` for Sequential Job Execution

---

## Rule 1

**Rule Name:** make-chain-jobs-idempotent

**Category:** Always

**Rule:** Always make each job in a chain idempotent.

**Reason:** If a worker crashes after job 1 succeeds but before dispatching job 2, the chain breaks permanently — job 1's effects persist but job 2 never runs.

**Bad Example:**
```php
class ProcessPayment implements ShouldQueue
{
    public function handle(): void
    {
        DB::table('orders')->where('id', $this->orderId)->update(['paid' => true]);
        // Not idempotent — running twice would double-charge
    }
}
```

**Good Example:**
```php
class ProcessPayment implements ShouldQueue
{
    public function handle(): void
    {
        DB::table('orders')->where('id', $this->orderId)->where('paid', false)->update(['paid' => true]);
        // Idempotent — safe to retry
    }
}
```

**Exceptions:** Trivially idempotent operations (setting a flag to the same value) don't need special handling.

**Consequences Of Violation:** A chain broken by a worker crash leaves the system in an inconsistent state — no automated recovery mechanism exists.

---

## Rule 2

**Rule Name:** set-per-job-timeout-explicitly

**Category:** Always

**Rule:** Always set `$timeout` explicitly on each job in a chain.

**Reason:** Chain total duration = sum of all job durations — worker timeout must cover the entire chain.

**Bad Example:**
```php
class SlowProcess implements ShouldQueue
{
    public $timeout = 120; // OK for this job alone
}
// But chain: SlowProcess + AnotherSlowJob = 240s, worker --timeout=120 kills it
```

**Good Example:**
```php
// Each job has appropriate timeout, worker timeout covers worst-case chain
```

**Exceptions:** When all chain jobs complete well within the default timeout (60s), explicit timeouts may be unnecessary.

**Consequences Of Violation:** The worker kills the chain mid-execution even though each individual job is within its timeout — the last job fails, the chain aborts, and the `catch()` callback fires.

---

## Rule 3

**Rule Name:** use-catch-for-compensation

**Category:** Always

**Rule:** Always use `catch()` for compensatory actions, not just logging.

**Reason:** A chain failure does NOT roll back previous jobs — each job commits independently.

**Bad Example:**
```php
Bus::chain([$payment, $shipment, $email])
    ->catch(fn(Throwable $e) => Log::error($e)) // Just logging — no compensation
    ->dispatch();
```

**Good Example:**
```php
Bus::chain([$payment, $shipment, $email])
    ->catch(function (Throwable $e) use ($orderId) {
        CompensateFailedOrder::dispatch($orderId); // Compensation action
    })
    ->dispatch();
```

**Exceptions:** When the chain's side effects are harmless or idempotent, logging may be sufficient.

**Consequences Of Violation:** Payment is processed, shipment is created — but the confirmation email failed. The customer is charged and the order ships, but no one is notified and no compensation action fires.

---

## Rule 4

**Rule Name:** limit-chain-length

**Category:** Prefer

**Rule:** Prefer keeping chain length under 5 jobs.

**Reason:** Longer chains increase the probability of mid-chain failure and serialization payload size.

**Bad Example:**
```php
Bus::chain([$a, $b, $c, $d, $e, $f, $g, $h])->dispatch();
// 8 jobs — probability of at least one failure is high
```

**Good Example:**
```php
Bus::chain([$a, $b, $c])->dispatch();
// 3 jobs — manageable failure probability
```

**Exceptions:** Ordered data pipelines with well-tested, fast, deterministic jobs may extend to 10 jobs.

**Consequences Of Violation:** Each additional job doubles the chance of a chain-aborting failure — long chains break frequently, requiring manual recovery.

---

## Rule 5

**Rule Name:** no-chains-for-parallel-work

**Category:** Never

**Rule:** Never use `Bus::chain` for work that can run in parallel.

**Reason:** Chain execution is strictly sequential — parallelizable work wastes time and worker capacity.

**Bad Example:**
```php
Bus::chain([$processOrder1, $processOrder2, $processOrder3])->dispatch();
// All three orders are independent — should run in parallel
```

**Good Example:**
```php
Bus::batch([$processOrder1, $processOrder2, $processOrder3])->dispatch();
// All three run concurrently across workers
```

**Exceptions:** When order is critical due to shared state (e.g., updating a running total), sequential execution is required.

**Consequences Of Violation:** Job throughput is N times slower than possible — three independent orders each take 10s take 30s total instead of 10s.
