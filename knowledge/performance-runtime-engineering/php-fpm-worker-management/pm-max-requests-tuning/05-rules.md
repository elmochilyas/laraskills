## Never set pm.max_requests=0 in production
---
Category: Configuration
---
Always set pm.max_requests to a positive value (500-1000 recommended). Zero disables recycling, guaranteeing memory drift will eventually exhaust RAM.
---
Reason: PHP's allocator does not return all memory to the OS between requests. A worker starting at 65MB RSS grows to ~120MB over 12 hours without recycling. max_requests=0 removes the only safety mechanism against this drift.
---
Bad Example:
```ini
; Unlimited — memory drift until OOM
pm.max_requests = 0
```

Good Example:
```ini
; Controlled recycling
pm.max_requests = 1000 ; Worker recycles before memory critical
```
---
Exceptions: Development environments where recycling is unnecessary.
---
Consequences Of Violation: Monotonically increasing RSS, eventual OOM kills, production outage.

## Start at 500-1000 max_requests and tune based on drift measurement
---
Category: Configuration
---
Set initial pm.max_requests to 500-1000. Measure RSS drift, then adjust up or down based on data.
---
Reason: 500-1000 provides a safe baseline. Measure worker RSS at spawn vs after max_requests — if drift >20%, lower the value. If drift <5%, raise it. This data-driven approach balances memory safety with spawn overhead.
---
Bad Example:
```ini
; Arbitrary value without measurement
pm.max_requests = 200 ; Too low — unnecessary spawn overhead
```

Good Example:
```bash
# Measure drift
# Worker at spawn: 65MB
# Worker after 500 requests: 72MB (10.7% drift — safe, raise to 1000)
pm.max_requests = 1000
```
---
Exceptions: Known memory-leak-prone applications (WordPress with plugins) should start at 300-500.
---
Consequences Of Violation: Either excessive spawn overhead (too low) or memory exhaustion risk (too high).

## Preloading enables more frequent recycling at lower cost
---
Category: Performance
---
Enable OpCache preloading to reduce PHP bootstrap time, making more frequent worker recycling less costly.
---
Reason: Preloading reduces PHP bootstrap time by 50-80%. Each worker spawn is cheaper, allowing you to set lower max_requests for better memory safety without significant CPU overhead.
---
Bad Example:
```ini
; High max_requests because spawn is expensive
pm.max_requests = 5000 ; Memory risk
```

Good Example:
```ini
opcache.preload=/etc/php/preload.php
; Preloading reduces spawn cost → can recycle more safely
pm.max_requests = 1000 ; Memory safe, spawn cost minimized
```
---
Exceptions: Applications where preloading is not feasible or provides negligible benefit.
---
Consequences Of Violation: Higher memory risk to avoid spawn costs that could be mitigated by preloading.
