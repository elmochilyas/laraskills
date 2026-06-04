# Rule Card: K042 — Auto Balancing with `time` Strategy

---

## Rule 1

**Rule Name:** use-time-strategy-over-size

**Category:** Always

**Rule:** Always use `autoScalingStrategy: 'time'` over `'size'`.

**Reason:** `time` accounts for job duration, not just count — a queue with 10 long jobs has higher wait time than 100 fast jobs.

**Bad Example:**
```php
'autoScalingStrategy' => 'size', // Job count alone — misleading for variable durations
```

**Good Example:**
```php
'autoScalingStrategy' => 'time', // Accounts for average job runtime
```

**Exceptions:** Queues where all jobs have identical, predictable duration — `size` is acceptable.

**Consequences Of Violation:** A queue with 10 slow jobs (10s each) gets fewer workers than a queue with 100 fast jobs (10ms each), despite having 10× the wait time — the slow queue starves.

---

## Rule 2

**Rule Name:** cap-balance-max-shift

**Category:** Always

**Rule:** Always set `balanceMaxShift` to 1-2.

**Reason:** Higher values cause excessive process churn — spawning/killing workers wastes memory.

**Bad Example:**
```php
'balanceMaxShift' => 10, // Can add 10 workers in one cycle
```

**Good Example:**
```php
'balanceMaxShift' => 2, // Gradual scaling — prevents overshoot
```

**Exceptions:** Extremely bursty workloads where immediate capacity is worth the churn cost.

**Consequences Of ViolATION:** A transient spike adds 10 workers — the spike subsides, 10 workers are killed. Each spawn/kill cycle costs 20-40MB, causing memory fragmentation and unnecessary GC pressure.

---

## Rule 3

**Rule Name:** set-balance-cooldown

**Category:** Always

**Rule:** Always set `balanceCooldown` to 3-5 seconds.

**Reason:** Frequent rebalancing (1s) is CPU-intensive; infrequent (10s+) responds slowly to load.

**Bad Example:**
```php
'balanceCooldown' => 1, // Too frequent — CPU waste
```

**Good Example:**
```php**
'balanceCooldown' => 3, // Balanced responsiveness and overhead
```

**Exceptions:** None — 3-5s is the optimal range for most workloads.

**Consequences Of Violation:** At `balanceCooldown: 1`, Horizon rebalances 60 times/minute — each cycle reads metrics from Redis and may spawn/kill workers, consuming supervisor CPU on coordination rather than processing.

---

## Rule 4

**Rule Name:** always-set-max-processes-bound

**Category:** Always

**Rule:** Always set `maxProcesses` to prevent unbounded scaling.

**Reason:** A queue with failing jobs may have ever-increasing wait time, attracting more workers indefinitely.

**Bad Example:**
```php
// No maxProcesses — balancer can allocate unlimited workers
```

**Good Example:**
```php**
'maxProcesses' => 10, // Hard cap — prevents resource exhaustion
```

**Exceptions:** None — unbounded process allocation is always a risk.

**Consequences Of Violation:** A corrupted job keeps failing, increasing wait time — the balancer adds workers until server memory is exhausted, causing OOM kills across all processes on the server.
