# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Laravel Octane Throughput & Cost Impact
**Generated:** 2026-06-03

---

# Decision Inventory

1. Octane Adoption Decision
2. Octane Worker and Memory Configuration
3. Octane Package Compatibility Audit

---

# Architecture-Level Decision Trees

---

## Decision Name: Octane Adoption Decision

---

## Decision Context

Decide whether to adopt Octane based on traffic and app profile.

---

## Decision Criteria

performance, cost, complexity

---

## Decision Tree

Current traffic?

< 100K req/day -> PHP-FPM sufficient
100K-1M req/day -> Octane strongly recommended
> 1M req/day -> Octane mandatory

App type?
CPU-bound -> 7-10x throughput gain
I/O-bound -> 3-5x throughput gain

Compatibility?
All packages tested -> Proceed
Some untested -> Test all critical packages
Incompatible -> Refactor or find alternatives

Backend selection?
FrankenPHP -> Default (Docker-native)
Swoole -> Maximum throughput
RoadRunner -> Simplest debugging

---

## Rationale

Octane delivers 3-10x throughput over PHP-FPM on identical hardware, reducing server count by 50-80%.

---

## Recommended Default

**Default:** Enable Octane for all production > 100K req/day; FrankenPHP for new deployments

---

## Risks Of Wrong Choice

Not using Octane leaves 50-80% cost savings on the table.

---

## Related Rules

Rule: Follow standardized Laravel Octane Throughput & Cost Impact practices

---

## Related Skills

Analyze and Optimize Laravel Octane Throughput & Cost Impact

---

---

## Decision Name: Octane Worker and Memory Configuration

---

## Decision Context

Configure worker count, max_requests, and memory limits.

---

## Decision Criteria

performance, reliability

---

## Decision Tree

CPU cores?

CPU-bound -> workers = cores
I/O-heavy -> workers = 1.5-2x cores

max_requests?
Set 1000-5000 (prevents unbounded memory growth)

Memory limit?
256M or 512M per worker
Monitor > 10KB/req growth = memory leak

JIT enabled?
For CPU-bound tasks: mode=tracing, buffer=100M
For I/O-bound: minimal benefit

---

## Rationale

CPU-bound workers saturate cores. max_requests prevents memory leak accumulation. JIT compiles hot functions to native code.

---

## Recommended Default

**Default:** Workers = CPU cores + 1; max_requests = 2000; memory = 256M; JIT for CPU-bound

---

## Risks Of Wrong Choice

Too many workers = CPU thrashing. No max_requests = OOM kills.

---

## Related Rules

Rule: Follow standardized Laravel Octane Throughput & Cost Impact practices

---

## Related Skills

Analyze and Optimize Laravel Octane Throughput & Cost Impact

---

---

## Decision Name: Octane Package Compatibility Audit

---

## Decision Context

Audit packages for Octane compatibility before migration.

---

## Decision Criteria

reliability, performance

---

## Decision Tree

Critical packages identified?

YES -> List all; categorize by risk
NO -> Run composer show -i

Static/global state?
Static properties -> Must be stateless or reset per-request
Singletons -> Must be request-scoped safe
Service providers -> Must be Octane-compatible

Destructors?
__destruct() cleanup -> Won't fire; must refactor
Shutdown functions -> Register via Octane lifecycle hooks

Load test:
Run 10K+ test requests before production
Monitor for data leakage, memory growth, errors
Compare to PHP-FPM baseline

---

## Rationale

Octane keeps state across requests. Packages assuming per-request lifecycle break silently, causing data leakage.

---

## Recommended Default

**Default:** Test all critical packages with Octane for 10K+ requests before production cutover

---

## Risks Of Wrong Choice

Untested packages cause data leakage across users or silent failures in production.

---

## Related Rules

Rule: Follow standardized Laravel Octane Throughput & Cost Impact practices

---

## Related Skills

Analyze and Optimize Laravel Octane Throughput & Cost Impact

---

