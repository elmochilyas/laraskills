# Queue Autoscale SLA

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** sla-management
- **Knowledge Unit:** Queue Autoscale SLA
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Queue Autoscale SLA is an architectural pattern that dynamically adjusts Laravel queue worker capacity based on queue throughput, backlog size, and SLA targets. For applications with SLA commitments on background job processing (email delivery, report generation, data processing), autoscaling ensures queue processing meets time targets during traffic spikes while minimizing cost during low-demand periods.

---

## Core Concepts

- **Queue SLA targets** specify maximum acceptable processing time for queued jobs by queue and priority
- **Backlog monitoring** tracks queue depth, job age, and processing throughput
- **Autoscaling triggers** add or remove queue workers based on backlog thresholds and SLA risk
- **Worker pool management** dynamically adjusts the number of queue workers (Horizon or custom)
- **Priority queue scaling** allocates more workers to high-priority queues during contention
- **Cost optimization** scales down workers during low demand to reduce infrastructure cost

---

## Mental Models

- **The Highway Toll Booth:** During rush hour (high queue volume), more toll booths (workers) open to keep traffic moving within SLA time. At night, only one booth stays open.
- **The Restaurant Kitchen:** When orders (jobs) pile up, more cooks (workers) are called in. When the rush ends, cooks are sent home. The goal is to serve every table within the target time (SLA).
- **The Elastic Workforce:** Like a cloud-based call center that adds agents during peak hours and reduces during off-hours, queue workers scale to match processing demand.

---

## Internal Mechanics

An autoscaling controller (scheduled Artisan command or continuous process) monitors queue metrics from Redis or database: queue length per queue, oldest job age, job processing rate, and average processing time. It compares current metrics against SLA targets and thresholds. If backlog exceeds threshold or oldest job approaches SLA limit, it increases worker count. If backlog is below threshold for sustained period, it decreases worker count. Worker count changes are applied via Horizon configuration updates, supervisor process scaling, or container orchestration (Kubernetes HPA).

---

## Patterns

**Threshold-Based Autoscaling Pattern:** Add workers when queue depth exceeds threshold N, remove workers when depth stays below threshold M for sustained period. Benefit: Simple, predictable scaling behavior. Tradeoff: Threshold selection requires tuning for workload patterns.

**Time-to-SLA Autoscaling Pattern:** Scale based on estimated time to clear backlog vs. SLA target. If estimated clearance time exceeds SLA, add workers. Benefit: Directly tied to SLA compliance. Tradeoff: Requires accurate job processing time estimation.

**Predictive Autoscaling Pattern:** Use historical traffic patterns to predict queue volume and pre-scale workers before demand arrives. Benefit: Proactive scaling, no SLA risk during demand ramp-up. Tradeoff: Requires historical data and forecasting model.

---

## Architectural Decisions

Use time-to-SLA autoscaling for strict SLA commitments, threshold-based for general workload management. Implement autoscaling at the container orchestration level (Kubernetes HPA based on queue metrics) for infrastructure-native scaling. Use Laravel Horizon for queue monitoring and worker management. Define SLA targets per queue — high-priority queues (email, notifications) have stricter targets than batch processing queues. Implement cooldown periods to prevent worker thrashing.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Guaranteed SLA compliance during spikes | Autoscaling infrastructure complexity | Reliable processing with operational overhead |
| Cost optimization during low demand | Scaling lag during demand spikes | Cost savings with potential lag risk |
| Priority queue SLA protection | Priority configuration and monitoring | Critical jobs processed first during contention |
| Automated, no manual scaling intervention | Autoscaling tuning and threshold selection | Hands-off but requires initial tuning |

---

## Performance Considerations

Queue monitoring adds overhead proportional to polling frequency — poll every 5-30 seconds depending on SLA strictness. Worker scaling operations take time (30-120 seconds for container start, seconds for Horizon worker add). Autoscaling should account for this lag. Memory overhead scales with worker count — monitor per-worker memory usage. Cooldown periods prevent rapid scaling oscillations but may delay downscaling cost savings. Queue metrics monitoring can use Redis for minimal overhead.

---

## Production Considerations

Implement SLA breach prediction — alert when backlog size indicates impending SLA failure despite current worker count. Monitor autoscaling decisions and log all scale events. Test autoscaling with load testing before relying on it for production SLAs. Set maximum worker limits to prevent runaway costs. Implement fallback processing for when workers max out — queue oldest jobs first. Document autoscaling behavior for incident response. Regularly review SLA compliance metrics.

---

## Common Mistakes

**Scaling too aggressively** — adding many workers quickly can overwhelm downstream systems (database, API services). Implement gradual scaling with cooling periods.

**Not accounting for worker startup time** — new workers take time to be ready. Trigger autoscaling before SLA risk becomes critical.

**Ignoring downstream capacity limits** — more workers don't help if the database is the bottleneck. Monitor downstream system capacity.

---

## Failure Modes

- **Autoscaler failure:** Workers don't scale during demand spike. Set up backup autoscaling (e.g., Kubernetes HPA as fallback).
- **Worker crash loop:** Workers start but immediately crash. Implement health checks and circuit breaker for scaling.
- **Downstream bottleneck:** Adding workers increases load on already-stressed database. Implement database connection pooling and query optimization.
- **Queue metrics data loss:** Redis/data source for queue metrics is unavailable. Fall back to fixed worker count.

---

## Ecosystem Usage

Laravel applications implement queue autoscaling through: Laravel Horizon (queue monitoring API), custom Artisan commands for autoscaling logic, Redis (queue metrics source), Kubernetes HPA (container-level scaling), and monitoring tools (Laravel Pulse, Prometheus). The combination of Horizon for queue visibility and Kubernetes for worker scaling provides a comprehensive autoscaling solution. For simpler deployments, Forge or Envoyer with worker process management provides basic scaling capability.

---

## Related Knowledge Units

### Prerequisites
- Laravel Queues and Jobs
- Laravel Horizon (queue monitoring)
- Container Orchestration (Kubernetes)

### Related Topics
- SLA Timer (SLA tracking for individual jobs)
- Escalated Laravel (SLA breach escalation)
- Laravel Service Desk (SLA management in support context)

### Advanced Follow-up Topics
- Predictive Autoscaling with Machine Learning
- Multi-Queue Priority Scheduling
- Cost-Optimized Worker Pool Allocation

---

## Research Notes

Queue autoscaling is a specialized area where Laravel's ecosystem (Horizon, Redis) provides excellent monitoring but lacks built-in autoscaling logic — most implementations are custom or infrastructure-level (Kubernetes HPA). The key challenge is balancing scaling responsiveness (adding workers quickly enough to meet SLAs) with stability (avoiding oscillation and over-provisioning). The time-to-SLA autoscaling pattern provides the most direct SLA alignment but requires accurate job processing time estimates. For Laravel applications on Kubernetes, the combination of KEDA (Kubernetes Event-Driven Autoscaling) with Redis queue metrics provides production-ready autoscaling without custom development.
