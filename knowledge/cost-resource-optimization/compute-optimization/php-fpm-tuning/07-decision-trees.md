# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** PHP-FPM Tuning
**Generated:** 2026-06-03

---

# Decision Inventory

1. max_children Memory Calculation
2. pm.max_requests Configuration
3. Dynamic vs Static vs On-Demand Pool Mode

---

# Architecture-Level Decision Trees

---

## Decision Name: max_children Memory Calculation

---

## Decision Context

Calculate optimal PHP-FPM max_children based on server memory and worker footprint.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Total server RAM?

2GB -> Reserve 0.5GB OS = ~40 children max
4GB -> Reserve 1GB OS = ~70 children max
8GB -> Reserve 1.5GB OS = ~150 children max
16GB -> Reserve 2GB OS = ~310 children max

Average worker memory measured?
Yes -> Use actual value (Laravel: 30-80MB per worker)
Unknown -> Default 45MB, adjust after monitoring

CPU cores also a factor?
Children > 2x cores -> Cap at 2x cores (context switching degrades throughput)
Children <= 2x cores -> Memory-based calculation is correct

---

## Rationale

Each Laravel PHP-FPM worker consumes 30-80MB. Setting max_children higher than available memory causes OOM kills. CPU-bound workloads get diminishing returns beyond 2x cores.

---

## Recommended Default

**Default:** max_children = (RAM - OS_reserve) / avg_worker_memory; cap at 2x CPU cores

---

## Risks Of Wrong Choice

max_children too high causes OOM kills and 50x errors. Too low wastes CPU capacity.

---

## Related Rules

Rule: Follow standardized PHP-FPM Tuning practices

---

## Related Skills

Analyze and Optimize PHP-FPM Tuning

---

---

## Decision Name: pm.max_requests Configuration

---

## Decision Context

Set optimal max_requests to balance memory cleanup vs worker restart overhead.

---

## Decision Criteria

performance, reliability

---

## Decision Tree

OPcache validate_timestamps enabled?

NO (production) -> 500-1000 requests (memory cleanup focus)
YES (development) -> 200-500 (fresher state)

Memory leak rate?
Low (< 1 KB/req) -> 1000-2000 requests
Medium (1-10 KB/req) -> 500-1000 requests
High (> 10 KB/req) -> 200-500 + fix leaks first

Traffic volume?
High (> 100 req/s) -> 1000 (fewer restarts, lower overhead)
Low (< 10 req/s) -> 500 (restart overhead negligible)

---

## Rationale

Laravel requests accumulate ~1KB memory per request. After 10K requests, a worker may use 2x baseline memory. max_requests restarts workers to release accumulated memory.

---

## Recommended Default

**Default:** 500-1000 for production; start at 1000, reduce if memory issues appear

---

## Risks Of Wrong Choice

No max_requests = unbounded memory growth, eventual OOM kills. Too low = constant restarts wasting CPU.

---

## Related Rules

Rule: Follow standardized PHP-FPM Tuning practices

---

## Related Skills

Analyze and Optimize PHP-FPM Tuning

---

---

## Decision Name: Dynamic vs Static vs On-Demand Pool Mode

---

## Decision Context

Choose PHP-FPM pool mode based on traffic pattern and server resources.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Traffic pattern?

Predictable stable load -> Static pool
Variable traffic -> Dynamic pool (most common)
Very low or sporadic -> On-demand pool

Server resources?
Memory-constrained (< 2GB) -> On-demand (saves memory)
Adequate RAM (4GB+) -> Dynamic (pre-spawned, no latency penalty)

Latency sensitivity?
High (user-facing API) -> Dynamic or Static
Low (background) -> On-demand acceptable

---

## Rationale

Static pool wastes memory during low traffic. Dynamic balances memory and latency. On-demand creates workers per request (50-200ms penalty) but saves memory.

---

## Recommended Default

**Default:** Dynamic for most production; On-demand for low-traffic; Static for predictable high-traffic

---

## Risks Of Wrong Choice

On-demand for high-traffic adds 50-200ms latency per request. Static for variable load wastes 80% of workers.

---

## Related Rules

Rule: Follow standardized PHP-FPM Tuning practices

---

## Related Skills

Analyze and Optimize PHP-FPM Tuning

---

