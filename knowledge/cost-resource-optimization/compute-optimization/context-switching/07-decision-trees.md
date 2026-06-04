# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Context Switching
**Generated:** 2026-06-03

---

# Decision Inventory

1. Web and Queue Server Separation
2. Worker Count to CPU Core Ratio
3. CPU Priority for Mixed Workloads

---

# Architecture-Level Decision Trees

---

## Decision Name: Web and Queue Server Separation

---

## Decision Context

Decide whether to run queue workers on web servers or use dedicated instances.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Current architecture?

Web + queue on same -> Evaluate separation
Web and queue separate -> Already optimal

Server CPU utilization?
< 50% at peak -> Co-locate with cgroups limits
50-80% -> Separate servers recommended
> 80% -> Immediate separation required

Traffic volume?
< 50 req/s -> Co-location with cgroups acceptable
50-200 req/s -> Separate servers recommended
> 200 req/s -> Separate servers mandatory

Cost vs performance priority?
Cost savings -> Co-locate with cgroups CPU limits
Performance -> Dedicated servers

---

## Rationale

Queue workers cause 10,000+ extra context switches per second, stealing 30-50% CPU from customer-facing web requests. Separation eliminates this contention.

---

## Recommended Default

**Default:** Separate servers for web and queue; cgroups only for low-traffic apps under 50 req/s

---

## Risks Of Wrong Choice

Co-location causes 30-50% web response time degradation and confusing troubleshooting.

---

## Related Rules

Rule: Follow standardized Context Switching practices

---

## Related Skills

Analyze and Optimize Context Switching

---

---

## Decision Name: Worker Count to CPU Core Ratio

---

## Decision Context

Set optimal worker-to-CPU ratio to minimize context switching overhead.

---

## Decision Criteria

performance

---

## Decision Tree

Workload type?

CPU-bound -> Workers = 1-2x CPU cores
I/O-bound -> Workers = 2-4x CPU cores

Current vmstat cs/sec?
< 10,000 cs/sec per core -> Healthy
10,000-20,000 -> Monitor
> 20,000 per core -> Too many workers; reduce 25%

Run queue length?
< 2x cores -> Appropriate
> 2x cores -> Workers over-allocated; reduce

Throughput before vs after reduction?
Increased -> Context switching was bottleneck
Decreased -> Original count was needed

---

## Rationale

Each worker beyond CPU cores causes 100+ involuntary context switches/second. Beyond 2x cores, throughput decreases due to switching overhead.

---

## Recommended Default

**Default:** CPU-bound: workers=cores; I/O-bound: 2-3x cores; target cs/sec < 20,000 per core

---

## Risks Of Wrong Choice

Over-allocating workers wastes 20-50% of CPU on context switching, reducing effective capacity.

---

## Related Rules

Rule: Follow standardized Context Switching practices

---

## Related Skills

Analyze and Optimize Context Switching

---

---

## Decision Name: CPU Priority for Mixed Workloads

---

## Decision Context

Configure CPU priority via cgroups or nice on shared servers.

---

## Decision Criteria

performance, reliability

---

## Decision Tree

Mixed workloads on same server?

YES -> Configure cgroups or nice values
NO -> No CPU priority needed on dedicated servers

cgroups available?
YES -> Set CPU shares: web=512, queue=256 (2:1 priority)
NO -> Use nice: web=0, queue=10

Octane workers present?
YES -> CPU-pin to dedicated cores via taskset
NO -> Standard scheduling sufficient

Memory cgroups also configured?
YES -> Prevents queue workers consuming all RAM
NO -> Configure memory limits for queue cgroup

---

## Rationale

cgroups ensure web workers get CPU priority during traffic spikes. CPU pinning eliminates cache misses from workers migrating between cores, providing ~5-10% throughput improvement.

---

## Recommended Default

**Default:** cgroups CPU shares (web=512, queue=256); Octane workers CPU-pinned

---

## Risks Of Wrong Choice

No CPU limits on shared servers = queue jobs steal CPU from web during spikes.

---

## Related Rules

Rule: Follow standardized Context Switching practices

---

## Related Skills

Analyze and Optimize Context Switching

---

