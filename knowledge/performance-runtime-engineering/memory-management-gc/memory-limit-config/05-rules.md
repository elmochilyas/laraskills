---
## Rule Name

Calculate max_children Using P95 RSS

## Category

Scalability

## Rule

Always calculate `pm.max_children` using the P95 per-worker RSS with a 1.2–1.5× safety factor. Never use average RSS.

## Reason

Average RSS under-estimates memory needs because workers above the average cause OOM. P95 RSS accounts for the 95th percentile worker — only 5% of workers exceed this. The safety factor covers edge cases and peak variance.

## Bad Example

```ini
; Average RSS: 50MB. 8GB RAM, 2GB reserved -> 6GB available
pm.max_children = 120  ; 6GB / 50MB = 120 — OOM when workers hit 60MB
```

## Good Example

```ini
; P95 RSS: 80MB. Safety factor: 1.3
pm.max_children = 57   ; 6GB / (80MB × 1.3) = 57 — safe
```

## Exceptions

Environments with guaranteed per-worker memory limits (containers with resource quotas).

## Consequences Of Violation

OOM under peak load, 502 errors, worker crashes, degraded performance as swap is used.

---

## Rule Name

Set memory_limit to 2× Expected Per-Request Peak

## Category

Reliability

## Rule

Set `memory_limit` to approximately 2× the expected per-request peak memory usage. Never set it to -1 (unlimited).

## Reason

A finite limit provides a safety net against memory leaks and unexpectedly large allocations. 2× the expected peak gives headroom for variance while still catching pathological cases. An unlimited limit allows a single request to consume all system RAM.

## Bad Example

```ini
memory_limit = -1  ; Unlimited — can OOM the entire server
```

## Good Example

```ini
memory_limit = 256M  ; 2× the 128MB P95 peak observed in production
```

## Exceptions

CLI scripts with predictable, bounded memory usage.

## Consequences Of Violation

Entire server OOM from a single runaway request, no safety net against memory leaks.

---

## Rule Name

Reserve Memory for System Services Before Worker Calculation

## Category

Scalability

## Rule

Always deduct memory for OS, database, Redis, Nginx, and monitoring agents from total RAM before calculating PHP worker budgets.

## Reason

These services compete with PHP workers for memory. Allocating all RAM to PHP workers causes database OOM, Nginx crashes, and monitoring agent failures when memory pressure is high.

## Bad Example

```bash
# 8GB server — 8GB / 80MB = 100 workers
# OS + MySQL + Redis + Nginx need 3GB
# Only 5GB available — 100 workers need 8GB — guaranteed OOM
```

## Good Example

```bash
# 8GB server - 3GB reserved = 5GB for workers
# 5GB / (80MB × 1.3) = 48 workers — safe
```

## Exceptions

Dedicated containers where only PHP runs in the container.

## Consequences Of Violation

Database OOM kills, Nginx crashes, monitoring agent failures, cascading service outages.

---

## Rule Name

Monitor P95 Worker RSS in Production

## Category

Performance

## Rule

Track the P95 worker RSS over 24-hour windows under peak load and adjust `memory_limit` and `pm.max_children` based on observed values.

## Reason

Worker RSS varies with code changes, data sizes, and traffic patterns. Static configuration based on outdated measurements becomes incorrect over time. Continuous monitoring catches trends before they cause problems.

## Bad Example

```bash
# Configured once during setup — never revisited
# Application grew, RSS doubled — workers now OOM under peak
```

## Good Example

```bash
# Monthly review: P95 RSS increased from 80MB to 120MB
# Adjusted calculations: max_children reduced from 57 to 38
# No OOM incidents
```

## Exceptions

Stable applications where RSS has not changed in 6+ months.

## Consequences Of Violation

Gradual performance degradation as configuration drifts from actual memory usage.

---

## Rule Name

Ensure Zero Swap Usage

## Category

Performance

## Rule

Never allocate more than 80% of physical RAM to PHP workers. Maintain zero swap usage at all times.

## Reason

PHP's Zend Memory Manager performs poorly on swap — memory access latency increases 10–100×. Even 1% swap usage degrades throughput significantly. The 80% threshold ensures headroom for OS caching and burst memory requests.

## Bad Example

```bash
# 16GB server allocated 15GB to PHP workers
# Under peak load, swap is used — performance drops 50%
```

## Good Example

```bash
# 16GB server, 4GB reserved, 12GB for workers
# Workers use 10GB P95 — 2GB headroom, zero swap
```

## Exceptions

No common exceptions. Swap for PHP is always a performance disaster.

## Consequences Of Violation

10–100× performance degradation when PHP pages to swap, latency spikes, timeout errors.

---

## Rule Name

Use php_admin_value[memory_limit] Per Pool

## Category

Security

## Rule

Set `memory_limit` using `php_admin_value[memory_limit]` in the FPM pool configuration. Never set it in global `php.ini` for multi-pool setups.

## Reason

Pool-specific limits allow different applications to have different memory budgets. A global limit in `php.ini` is overridden by pool configuration and may expose one pool to another's memory behavior.

## Bad Example

```ini
; Global php.ini — applies to all pools
memory_limit = 128M
```

## Good Example

```ini
; Pool-specific — each pool has appropriate limits
[pool_api]
php_admin_value[memory_limit] = 256M

[pool_admin]
php_admin_value[memory_limit] = 512M
```

## Exceptions

Single-pool deployments where global configuration is unambiguous.

## Consequences Of Violation

Inconsistent memory limits across pools, one pool's leak affecting resource allocation for others.
