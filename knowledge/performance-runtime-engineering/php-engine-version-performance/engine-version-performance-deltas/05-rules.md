---
## Rule Name

Prioritize OpCache and Runtime Over Version Upgrades

## Category

Performance

## Rule

Never invest in a PHP version upgrade for performance reasons before ensuring OpCache is optimally tuned and the runtime architecture matches the workload.

## Reason

OpCache tuning provides 2-4x throughput with zero code changes. Runtime migration (FPM to Octane) provides 3-15x for API workloads. A well-tuned PHP 8.0 with OpCache outperforms default-configured PHP 8.5 without OpCache.

## Bad Example

```bash
# Upgraded from 8.3 to 8.5 for "performance" — gained 3%
# OpCache was still on default 128MB with 87% hit rate
```

## Good Example

```bash
# 1. Tune OpCache first (2-4x gain)
# 2. Profile bottleneck
# 3. Consider runtime upgrade if applicable (3-15x gain)
# 4. PHP version upgrade last (1-26% gain)
```

## Exceptions

Security-mandated version upgrades where the primary driver is EOL, not performance.

## Consequences Of Violation

Investment in marginal gains while larger levers remain untuned, misallocation of performance budget.

---

## Rule Name

Benchmark Before and After Each Version Upgrade

## Category

Testing

## Rule

Always capture baseline throughput and latency metrics immediately before a PHP version upgrade and compare with post-upgrade results.

## Reason

Version upgrades can introduce regressions (e.g., PHP 8.4 showed 5.2% regression under light I/O). Without a pre-upgrade baseline, regressions go undetected and gains cannot be quantified.

## Bad Example

```bash
# Upgraded to PHP 8.4 — "it seems fine"
# Actual p95 latency increased 8% — undetected
```

## Good Example

```bash
# Baseline: 5000 RPS, p50=20ms, p95=45ms
# After upgrade: 5200 RPS, p50=19ms, p95=43ms
# Improvement: 4% throughput, 5% latency — regression-free
```

## Exceptions

Emergency security upgrades where the version change is forced and performance impact is accepted without verification.

## Consequences Of Violation

Undetected regressions in production, inability to quantify ROI of upgrade effort, false assumptions about version performance.

---

## Rule Name

Leapfrog Intermediate Versions

## Category

Maintainability

## Rule

When upgrading across PHP versions, skip intermediate minors (e.g., 8.1 directly to 8.4) rather than upgrading through each version sequentially.

## Reason

Each version upgrade requires testing, validation, and deployment cycles. Later versions (8.2 to 8.5) offer marginal performance gains of 1-3% each. Leapfrogging reduces migration cycles while capturing the cumulative benefit.

## Bad Example

```bash
# 8.1 -> 8.2 -> 8.3 -> 8.4 -> 8.5 (four migration cycles)
# Total gain over 8.1: ~15%
```

## Good Example

```bash
# 8.1 -> 8.5 directly (one migration cycle)
# Total gain over 8.1: ~15% — same result, less work
```

## Exceptions

When a specific feature in an intermediate version is required and cannot wait.

## Consequences Of Violation

Wasted engineering time on repetitive testing cycles, delayed migration to supported versions, prolonged EOL risk exposure.

---

## Rule Name

Use Typed Properties for Maximum Version Benefit

## Category

Performance

## Rule

Always declare explicit types on all class properties when targeting PHP 8.0+ to maximize the benefit of engine-level optimizations across version upgrades.

## Reason

Typed properties enable the Zend Engine to generate specialized opcodes and provide type information essential for JIT guard elimination. The performance delta between typed and untyped code widens with each PHP version.

## Bad Example

```php
// Untyped — misses 5-15% engine optimization across all versions
public $id;
public $name;
```

## Good Example

```php
// Typed — benefits compound with each version's opcode improvements
public int $id;
public string $name;
```

## Exceptions

Legacy codebases where incremental refactoring is in progress (but all new code must use typed properties).

## Consequences Of Violation

Missed 5-15% execution time reduction per request, reduced JIT guard elimination, suboptimal performance on all PHP versions.

---

## Rule Name

Do Not Chase Minor Versions for Marginal Gains

## Category

Performance

## Rule

Do not allocate engineering cycles to upgrade between recent PHP minor versions (8.3 to 8.4 to 8.5) purely for performance.

## Reason

Incremental gains between PHP 8.2 through 8.5 are 1-3% per version for typical web applications. The effort of testing, validation, and deployment outweighs the performance benefit. Optimize runtime and application code first.

## Bad Example

```bash
# Two-week migration from 8.3 to 8.4
# Result: 2% throughput improvement — 20 engineering days
```

## Good Example

```bash
# Stay on 8.3 until 8.5 is stable
# Upgrade directly 8.3 -> 8.5 (one cycle)
# Result: 4% improvement from two versions — one migration
```

## Exceptions

When the target version fixes a regression or security issue affecting the application.

## Consequences Of Violation

Low-ROI engineering investment, delayed larger improvements, upgrade fatigue in the team.
