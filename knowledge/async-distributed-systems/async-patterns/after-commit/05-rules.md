# Rule Card: K064 — afterCommit

---

## Rule 1

**Rule Name:** use-afterCommit-for-transactional-consistency

**Category:** Always

**Rule:** Always use `afterCommit` when the job depends on data written in the current transaction.

**Reason:** Without `afterCommit`, a queued job may run before the transaction is committed — the job reads stale or missing data.

**Bad Example:**
```php
DB::transaction(function () {
    $order = Order::create([...]);
    ProcessOrder::dispatch($order); // Job runs — order not yet committed
});
```

**Good Example:**
```php
DB::transaction(function () {
    $order = Order::create([...]);
    ProcessOrder::dispatch($order)->afterCommit(); // Job waits for commit
});
```

**Exceptions:** Jobs that don't read the transaction's data (e.g., sending a notification that only needs the order ID).

**Consequences Of ViolATION:** The worker picks up the job 10ms after dispatch — the order row isn't committed yet. The worker queries for the order, gets `null`, and fails with `ModelNotFoundException`. The job retries 3 times, all failing because the transaction hasn't committed.

---

## Rule 2

**Rule Name:** set-default-channel-to-after-commit

**Category:** Prefer

**Rule:** Prefer setting the queue connection's `after_commit` to `true` globally.

**Reason:** Avoids forgetting `afterCommit()` on individual dispatches — default transactional safety.

**Bad Example:**
```php
// config/queue.php — default: after_commit = false
// Forget to chain ->afterCommit() on 1 in 10 dispatches — random race condition
```

**Good Example:**
```php
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'after_commit' => true, // Default to transactional safety
    ],
],
```

**Exceptions:** Jobs that intentionally dispatch before commit (e.g., logging before commit).

**Consequences Of ViolATION:** A developer adds a new dispatch without `->afterCommit()`. In production, 0.1% of jobs fail with `ModelNotFoundException` — an intermittent race condition that's nearly impossible to reproduce in development.

---

## Rule 3

**Rule Name:** know-afterCommit-behavior-without-transactions

**Category:** Always

**Rule:** Always understand that `afterCommit` dispatches immediately when no transaction is active.

**Reason:** `afterCommit` does not delay the job — it only defers until the current transaction commits.

**Bad Example:**
```php
// No transaction active — afterCommit dispatches immediately
ProcessOrder::dispatch($order)->afterCommit(); // Same as dispatch() in this context
```

**Good Example:**
```php
// afterCommit is only meaningful inside a transaction
// Document this behavior so developers aren't confused
```

**Exceptions:** None — developers must understand this to reason correctly about dispatch timing.

**Consequences Of ViolATION:** A developer wraps the dispatch in a transaction to "make it safer" without understanding the behavior — they add a transaction around a single query, creating unnecessary overhead.

---

## Rule 4

**Rule Name:** validate-before-within-transaction

**Category:** Always

**Rule:** Always validate data before the transaction — don't validate inside the transaction with queued jobs.

**Reason:** Validation failures within the transaction trigger rollback, wasting the transaction.

**Bad Example:**
```php
DB::transaction(function () {
    $order = Order::create($data);
    ProcessOrder::dispatch($order)->afterCommit(); // What if validation inside job fails?
});
```

**Good Example:**
```php
$validator = Validator::make($data, $rules);
$validator->validate(); // Fail fast before transaction

DB::transaction(function () {
    $order = Order::create($data);
    ProcessOrder::dispatch($order)->afterCommit();
});
```

**Exceptions:** Business rules that depend on the transaction's state must run inside.

**Consequences Of ViolATION:** 2% of orders have invalid data that's only caught inside `ProcessOrder`. The order is committed, but the job fails — the order exists in the database but was never processed, requiring manual cleanup of zombie records.
