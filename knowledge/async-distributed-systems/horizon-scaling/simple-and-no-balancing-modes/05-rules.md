# Rule Card: K043 — Simple and No Balancing Modes

---

## Rule 1

**Rule Name:** prefer-auto-balancing-for-most

**Category:** Prefer

**Rule:** Prefer `auto` with `time` strategy for most general-purpose workloads.

**Reason:** `simple` and `false` are special cases — `auto` provides load-aware allocation.

**Bad Example:**
```php
'balance' => 'simple', // Even distribution — ignores actual load
```

**Good Example:**
```php
'balance' => 'auto',
'autoScalingStrategy' => 'time', // Load-aware allocation
```

**Exceptions:** SLA-critical queues needing guaranteed capacity or workloads with symmetric requirements.

**Consequences Of Violation:** `simple` mode splits 10 workers evenly across 3 queues (3, 3, 4). The high-priority webhook queue needs 6 workers, but the low-priority report queue hogs 3 workers it doesn't need.

---

## Rule 2

**Rule Name:** use-false-for-sla-critical-queues

**Category:** Prefer

**Rule:** Prefer `balance: false` for SLA-critical queues with over-provisioned `processes`.

**Reason:** `false` mode guarantees dedicated capacity — no other queue can borrow workers.

**Bad Example:**
```php
'balance' => 'auto', // Auto-scaling may deprioritize critical queue
```

**Good Example:**
```php
'balance' => false,
'processes' => 3, // Dedicated — always 3 workers for this queue
```

**Exceptions:** Variable-load critical queues where static allocation wastes capacity.

**Consequences Of ViolATION:** Under `auto` balancing, the payment processing queue's workers are borrowed by a bulk email queue during a campaign — payment jobs back up, delaying order fulfillment and triggering SLA penalties.

---

## Rule 3

**Rule Name:** avoid-simple-for-unequal-durations

**Category:** Avoid

**Rule:** Avoid `simple` balancing when job durations vary significantly between queues.

**Reason:** Even allocation doesn't account for job duration — fast-queue workers appear idle while slow-queue workers are saturated.

**Bad Example:**
```php
// Queue A: 100ms jobs (webhooks), Queue B: 10s jobs (reports)
'simple' => true // Each gets same workers — A finishes fast, B backs up
```

**Good Example:**
```php
// Separate supervisors:
'supervisor-webhooks' => ['queue' => ['webhooks'], 'balance' => 'auto'],
'supervisor-reports'  => ['queue' => ['reports'],  'balance' => 'false', 'processes' => 2],
```

**Exceptions:** Queues with similar job durations and equal priority.

**Consequences Of ViolATION:** Under `simple`, Queue A's workers finish jobs in 100ms and sit idle for 900ms while Queue B's workers struggle with 10s jobs. The system is 50% utilized, but Queue B has a 5-minute backlog.

---

## Rule 4

**Rule Name:** require-processes-with-false

**Category:** Always

**Rule:** Always set explicit `processes` when using `balance: false`.

**Reason:** `false` mode does not support `minProcesses`/`maxProcesses` — omitting `processes` causes a configuration error.

**Bad Example:**
```php
'balance' => false,
// No processes setting — Horizon throws error
```

**Good Example:**
```php
'balance' => false,
'processes' => 3, // Required for false mode
```

**Exceptions:** None — `processes` is mandatory with `balance: false`.

**Consequences Of ViolATION:** Horizon fails to start with `InvalidArgumentException: The "processes" option is required when balancing is disabled.` — the deployment fails, and no workers process any jobs until the config is fixed.
