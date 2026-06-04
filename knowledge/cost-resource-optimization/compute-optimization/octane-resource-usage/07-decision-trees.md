# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Octane Resource Usage
**Generated:** 2026-06-03

---

# Decision Inventory

1. Octane Worker Count Decision
2. Octane Memory Management
3. Octane vs PHP-FPM Decision

---

# Architecture-Level Decision Trees

---

## Decision Name: Octane Worker Count Decision

---

## Decision Context

Determine optimal Octane worker count based on CPU cores and workload profile.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Number of CPU cores?

Set base worker count = CPU cores

Workload profile?
CPU-bound -> workers = CPU cores (no benefit beyond)
I/O-heavy -> workers = 1.5-2x CPU cores (yield during waits)
Mixed -> workers = CPU cores + 1-2 for overhead

Monitor context switching?
cs/sec < 20000 per core -> OK
cs/sec > 20000 per core -> Reduce workers
Run queue > 2x cores -> Reduce workers

---

## Rationale

CPU-bound workloads saturate cores; extra workers cause context switching that reduces throughput. I/O-heavy workers yield during waits, allowing more concurrent workers.

---

## Recommended Default

**Default:** Workers = CPU cores for CPU-bound; +1-2 for I/O-heavy; monitor cs/sec and run queue

---

## Risks Of Wrong Choice

Too many workers causes extreme context switching where throughput drops below PHP-FPM levels.

---

## Related Rules

Rule: Follow standardized Octane Resource Usage practices

---

## Related Skills

Analyze and Optimize Octane Resource Usage

---

---

## Decision Name: Octane Memory Management

---

## Decision Context

Configure memory limits and restart policies for long-running Octane workers.

---

## Decision Criteria

performance, reliability

---

## Decision Tree

Per-worker memory limit?

Set memory_limit = 256M or 512M in php.ini/Octane config

Memory growth pattern?
Stable at ceiling -> Worker health good
Growing unbounded -> Memory leak detected; set max_requests

max_requests setting?
Set 1000-5000 depending on app
Workers restart after N requests, releasing accumulated memory

OPcache + JIT enabled?
Enabled -> 50-70% CPU reduction (OPcache) + 20-30% (JIT)
Disabled -> Enable immediately for Octane

---

## Rationale

Octane workers persist across thousands of requests, accumulating memory. max_requests provides restart-based memory reclamation. Without it, workers grow to memory_limit and get OOM killed.

---

## Recommended Default

**Default:** memory_limit=256M, max_requests=2000, OPcache + JIT enabled

---

## Risks Of Wrong Choice

No max_requests = unbounded memory growth, OOM kills failing all in-flight requests.

---

## Related Rules

Rule: Follow standardized Octane Resource Usage practices

---

## Related Skills

Analyze and Optimize Octane Resource Usage

---

---

## Decision Name: Octane vs PHP-FPM Decision

---

## Decision Context

Choose between Octane and PHP-FPM based on traffic volume and app compatibility.

---

## Decision Criteria

performance, cost, complexity

---

## Decision Tree

Current traffic volume?

< 50 req/s -> PHP-FPM simpler; cost difference negligible
50-500 req/s -> Octane provides 3-5x throughput improvement
> 500 req/s -> Octane strongly recommended for cost-effective compute

App compatibility?
Simple CRUD -> Octane works with minimal changes
Complex packages -> Test all critical packages for compatibility

Global state usage?
Stateless code -> Octane safe to deploy
Static properties -> Must refactor for Octane sandbox
__destruct() cleanup -> Must refactor for persistent workers

---

## Rationale

Octane eliminates per-request boot overhead (30-80ms), enabling 3-10x throughput on identical hardware. This reduces server count and compute costs by 50-80%.

---

## Recommended Default

**Default:** Octane for all production > 100 req/s; PHP-FPM for low-traffic or incompatible apps

---

## Risks Of Wrong Choice

Deploying Octane without package compatibility testing causes data leakage across requests.

---

## Related Rules

Rule: Follow standardized Octane Resource Usage practices

---

## Related Skills

Analyze and Optimize Octane Resource Usage

---

