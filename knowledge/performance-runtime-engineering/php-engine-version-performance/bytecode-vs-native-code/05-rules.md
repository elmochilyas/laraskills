---
## Rule Name

Enable OpCache Before Evaluating JIT

## Category

Performance

## Rule

Always enable and tune OpCache before considering JIT compilation. Never deploy any production PHP environment without OpCache, regardless of JIT status.

## Reason

OpCache provides a 2-4x throughput gain by eliminating recompilation to bytecode — the single highest-ROI performance change. JIT provides additional gain only for CPU-bound workloads and is dependent on OpCache being already enabled.

## Bad Example

```ini
; JIT enabled but OpCache disabled — missing the foundational 2-4x gain
opcache.jit=1255
opcache.enable=0
```

## Good Example

```ini
; OpCache enabled and tuned before JIT
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.jit=1255
```

## Exceptions

CI or test environments where OpCache may interfere with code coverage or test behavior.

## Consequences Of Violation

2-4x throughput loss that could have been recovered with zero code changes, wasted JIT evaluation on a suboptimal baseline.

---

## Rule Name

Match JIT Investment to Workload Boundedness

## Category

Performance

## Rule

Do not invest significant tuning effort in JIT configuration unless the workload has been profiled and confirmed as CPU-bound.

## Reason

JIT provides 61-95% additional gain for CPU-bound workloads but 0-5% for I/O-bound web applications. The 64-256MB JIT buffer allocation and warm-up compilation overhead provide no return for I/O-bound workloads.

## Bad Example

```bash
# 128MB JIT buffer configured for an I/O-bound Laravel API
# JIT provides 0-2% gain — RAM is wasted
```

## Good Example

```bash
# 1. Profile: CPU utilization at 80%+ during peak (CPU-bound)
# 2. Enable JIT: jit_buffer_size=256M for CPU-heavy app
# 3. Measure: 60% throughput improvement
```

## Exceptions

Universal JIT enablement with default settings is harmless (0-2% overhead) and provides benefit if workload characteristics change.

## Consequences Of Violation

Wasted RAM on JIT buffer for I/O-bound workloads, unnecessary complexity, or missed optimization opportunity for CPU-bound workloads.

---

## Rule Name

Treat OpCache and JIT as Complementary, Not Alternative

## Category

Architecture

## Rule

Never choose between OpCache and JIT. Both should be enabled simultaneously as they target different phases of the execution pipeline.

## Reason

OpCache caches bytecode across requests (eliminating re-compilation). JIT compiles hot bytecode to native code (eliminating VM dispatch). They are complementary layers — removing one cripples the performance of the other.

## Bad Example

```ini
; Disabling OpCache because JIT is enabled
opcache.enable=0
opcache.jit=1255
```

## Good Example

```ini
; Both enabled — each targets a different phase
opcache.enable=1
opcache.jit=1255
```

## Exceptions

No common exceptions. Both should always be enabled in production.

## Consequences Of Violation

Each request recompiles source to bytecode while JIT only optimizes execution, leaving the 2-4x OpCache gain unrealized.

---

## Rule Name

Use opcache_reset Instead of Disabling OpCache for Freshness

## Category

Maintainability

## Rule

Never disable OpCache in production to ensure code freshness. Use `opcache_reset()` during deployment to invalidate the opcode cache while keeping OpCache enabled.

## Reason

Disabling OpCache forces every request to recompile all source files, causing severe performance degradation for the entire period it is disabled. `opcache_reset()` provides fresh compilation with zero ongoing overhead.

## Bad Example

```bash
# Hard way — disable and re-enable
# Performance plummets for every request while disabled
```

## Good Example

```bash
# Clean way — atomic reset
opcache_reset()
```

## Exceptions

Deployments using `opcache.validate_timestamps=1` where automatic file timestamp checks suffice and manual reset is unnecessary.

## Consequences Of Violation

2-4x throughput loss during the deployment window, increased latency for all users, potential cascading failures under load.

---

## Rule Name

Size JIT Buffer According to Workload Profile

## Category

Performance

## Rule

Set `jit_buffer_size` based on the application's CPU-boundedness: 64MB for standard web apps, 128-256MB for CPU-heavy workloads.

## Reason

Over-provisioning JIT buffer wastes RAM without benefit; under-provisioning causes JIT thrashing (frequent compilation and eviction), degrading performance.

## Bad Example

```ini
; Default 128MB for a lightweight API with no CPU-bound code
opcache.jit_buffer_size=128M  # 128MB mostly unused
```

## Good Example

```ini
; Lightweight API (I/O-bound)
opcache.jit_buffer_size=64M
; CPU-heavy data processing
opcache.jit_buffer_size=256M
```

## Exceptions

No common exceptions. Monitor JIT buffer usage via `opcache_get_status()` and adjust if thrashing is detected.

## Consequences Of Violation

Wasted memory in over-provisioned scenarios, or JIT thrashing and wasted compilation cycles in under-provisioned scenarios.
