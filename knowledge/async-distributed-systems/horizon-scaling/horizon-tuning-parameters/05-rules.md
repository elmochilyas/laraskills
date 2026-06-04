# Rule Card: K044 — Horizon Tuning Parameters

---

## Rule 1

**Rule Name:** set-min-processes-to-at-least-one

**Category:** Always

**Rule:** Always set `minProcesses` to at least 1.

**Reason:** A queue with 0 minProcesses may never get a worker allocated during balancing — jobs sit unprocessed indefinitely.

**Bad Example:**
```php
'minProcesses' => 0, // Queue may get zero workers
```

**Good Example:**
```php
'minProcesses' => 1, // Guarantee at least one worker
```

**Exceptions:** Queues that should only process during high-load periods (non-default queues).

**Consequences Of Violation:** The auto-balancer deprioritizes a queue with 0 minProcesses — no workers are assigned, jobs accumulate indefinitely, and the queue effectively stops processing.

---

## Rule 2

**Rule Name:** base-max-processes-on-ram

**Category:** Always

**Rule:** Always base `maxProcesses` on available server RAM.

**Reason:** Each worker uses ~20-40MB — exceeding available RAM causes swapping or OOM kills.

**Bad Example:**
```php
'maxProcesses' => 50, // 50 workers × 40MB = 2GB — server has 1GB RAM
```

**Good Example:**
```php
'maxProcesses' => (int) floor($availableRAM / 40), // 1GB / 40MB = 25 workers
```

**Exceptions:** Workers that use significantly less memory (simple I/O jobs) may allow higher counts.

**Consequences Of Violation:** Auto-balancer scales to 50 workers on a 1GB server — each worker uses 40MB = 2GB total. The OS starts swapping to disk, all workers slow to a crawl, and eventually an OOM killer terminates random processes.

---

## Rule 3

**Rule Name:** detect-oscillation-sawtooth

**Category:** Prefer

**Rule:** Prefer detecting oscillation (sawtooth process count pattern) and tuning accordingly.

**Reason:** Sawtooth indicates the balancer is over-reacting — increase cooldown or decrease max shift.

**Bad Example:**
```php
// Monitoring shows sawtooth: 2→8→2→8 workers every 10 seconds
// Ignored — unnecessary churn wastes resources
```

**Good Example:**
```php
// If sawtooth detected:
'balanceMaxShift' => 1,  // Reduce from 2
'balanceCooldown' => 5,  // Increase from 3
```

**Exceptions:** Genuinely bursty workloads that oscillate naturally may need different tuning.

**Consequences Of ViolATION:** The sawtooth pattern spawns and kills 6 workers every 10 seconds — each cycle costs 20-40MB per worker. Memory bandwidth is consumed by allocation/deallocation, not actual job processing.

---

## Rule 4

**Rule Name:** set-min-equal-max-for-static

**Category:** Prefer

**Rule:** Prefer setting `minProcesses = maxProcesses` to disable balancing for predictable workloads.

**Reason:** Equal min and max prevents any scaling — useful for steady workloads where the balancer adds unnecessary complexity.

**Bad Example:**
```php
// Auto balancing — adds workers for transient spikes, kills them immediately
```

**Good Example:**
```php
'balance' => 'simple',
'minProcesses' => 3,
'maxProcesses' => 3, // Fixed — no scaling events
```

**Exceptions:** Variable workloads that benefit from dynamic allocation.

**Consequences Of ViolATION:** The auto-balancer adds workers during a 2-second throughput blip — by the time the workers spawn, the blip has passed, and they're immediately killed. The system spends more time balancing than processing.
