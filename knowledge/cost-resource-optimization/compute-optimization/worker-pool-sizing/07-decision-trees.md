# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Worker Pool Sizing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Worker Count by Bottleneck Identification
2. Separate Worker Pools Design
3. Queue Worker Throughput Sizing

---

# Architecture-Level Decision Trees

---

## Decision Name: Worker Count by Bottleneck Identification

---

## Decision Context

Determine optimal worker count based on CPU, memory, or I/O bottleneck.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Identify primary bottleneck?

CPU-bound (intensive computation) -> workers = CPU cores
Memory-bound (limited RAM) -> workers = Available RAM / worker_memory
I/O-bound (DB, API, cache) -> workers = 2-4x CPU cores

Memory per worker estimated?
< 50MB -> Memory constrained; reduce workers
50-150MB -> Normal range for Laravel workers
> 150MB -> I/O bound or over-provisioned

Monitor idle worker %?
0% idle at peak -> Under-provisioned; add workers
10-20% idle -> Optimal range
> 50% idle -> Over-provisioned; reduce workers

---

## Rationale

Sizing for the wrong bottleneck wastes resources. CPU-bound: workers beyond cores cause context switching. Memory-bound: too many workers cause OOM. I/O-bound: more workers can run concurrently.

---

## Recommended Default

**Default:** CPU-bound: workers=cores; I/O-bound: 2-3x cores; Memory-bound: calculate from RAM

---

## Risks Of Wrong Choice

Oversubscribed workers cause OOM and context switching thrashing. Undersubscribed workers waste capacity.

---

## Related Rules

Rule: Follow standardized Worker Pool Sizing practices

---

## Related Skills

Analyze and Optimize Worker Pool Sizing

---

---

## Decision Name: Separate Worker Pools Design

---

## Decision Context

Design separate worker pools for web, queue, and scheduled task workloads.

---

## Decision Criteria

performance, reliability

---

## Decision Tree

Workload types on server?

Web only -> Single pool for PHP-FPM or Octane workers
Web + queue -> Separate pools; dedicated servers preferred
Multiple queue priorities -> Separate pools per priority

Queue priority needed?
YES -> High pool (more workers, lower latency) + Low pool (fewer workers)
NO -> Single queue pool with uniform worker count

Server dedicated to single workload?
YES -> Optimal; size pool for that workload only
NO -> Use cgroups to allocate CPU shares per pool

---

## Rationale

A large queue job should never block web request processing. Separate pools ensure each workload gets appropriate capacity without interference.

---

## Recommended Default

**Default:** Dedicated servers for web and queue; separate pools per priority with different worker counts

---

## Risks Of Wrong Choice

Shared pool causes queue jobs to degrade web response times by 30-50% during batch processing.

---

## Related Rules

Rule: Follow standardized Worker Pool Sizing practices

---

## Related Skills

Analyze and Optimize Worker Pool Sizing

---

---

## Decision Name: Queue Worker Throughput Sizing

---

## Decision Context

Calculate required queue workers from job throughput and duration.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Job throughput required (jobs/hour)?

Measure desired_jobs_per_hour from requirements

Average job duration (seconds)?
Measure avg_job_duration via Horizon/Telescope

Formula: workers = ceil(desired_throughput / (3600 / avg_job_duration))
Example: 500 jobs/hour at 3s avg job = ceil(500 / 1200) = 1 worker

Add buffer for spikes?
YES -> 20-30% above calculated peak
NO -> Risk of queue backlog during load spikes

---

## Rationale

Worker count should be derived from throughput requirements and job duration, not guesswork. Each worker processes (3600 / avg_job_duration) jobs per hour.

---

## Recommended Default

**Default:** Calculate from throughput + duration; add 20-30% buffer above estimated peak

---

## Risks Of Wrong Choice

Under-provisioning creates hours of backlog. Over-provisioning wastes memory on idle workers.

---

## Related Rules

Rule: Follow standardized Worker Pool Sizing practices

---

## Related Skills

Analyze and Optimize Worker Pool Sizing

---

