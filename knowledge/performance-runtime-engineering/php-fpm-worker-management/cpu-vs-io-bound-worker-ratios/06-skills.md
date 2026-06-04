# Skill: Match Worker Ratios to CPU vs I/O Bound Profiles

## Purpose

Determine whether worker capacity is limited by CPU (compute-heavy) or I/O (waiting for database/external services) and adjust worker counts accordingly.

## When To Use

- Tuning PHP-FPM worker counts for specific workload profiles
- Diagnosing why increased workers do not improve throughput
- Capacity planning for mixed-workload servers

## When NOT To Use

- When workload profile is unknown (profile first)
- For Octane or alternative runtimes (they handle I/O differently)
- Without first measuring per-request I/O wait vs CPU time

## Prerequisites

- Profiling data showing CPU vs I/O wait time per request
- Understanding of synchronous blocking I/O in PHP-FPM
- Worker pool statistics (busy workers, queue length)

## Inputs

- Average request wall time
- CPU time per request (from profiling)
- I/O wait time per request (wall time - CPU time)
- Database query latency and count per request

## Workflow (numbered steps)

1. Profile a representative sample of requests: measure total wall time and CPU time
2. Calculate I/O wait: wall time - CPU time
3. If I/O wait > 50% of wall time: the workload is I/O-bound — increasing workers improves throughput up to the I/O subsystem capacity
4. If CPU time > 50% of wall time: the workload is CPU-bound — increasing workers may degrade performance (CPU contention)
5. For I/O-bound workloads: worker count can approach the calculated max from capacity planning (workers spend most time waiting)
6. For CPU-bound workloads: worker count should be limited to CPU core count + small buffer (1-2 extra)
7. For mixed workloads: find the balance — start with 2x CPU core count and adjust based on utilization
8. Monitor CPU utilization: if >80% with workers waiting for CPU, reduce worker count
9. Monitor I/O utilization: if I/O is saturated, reduce workers or optimize queries
10. Document the workload classification and worker ratio

## Validation Checklist

- [ ] CPU vs I/O wait time measured per request
- [ ] Workload classified as CPU-bound, I/O-bound, or mixed
- [ ] Worker count matched to classification
- [ ] CPU utilization monitored (<80% target)
- [ ] I/O utilization monitored (database query time, external API)
- [ ] Worker count adjusted based on monitoring
- [ ] Classification documented

## Common Failures

- **Assuming all workloads are I/O-bound**: Many API endpoints become CPU-bound with optimized databases
- **Adding workers to CPU-bound workloads**: More workers compete for CPU — increases context switching, decreases throughput
- **Ignoring I/O subsystem limits**: Database connection pool, disk IOPS, and network bandwidth all have limits
- **Not re-evaluating after optimization**: A CPU-bound workload may become I/O-bound after JIT optimization

## Decision Points

- I/O-bound (I/O wait > 50%): max workers = total_RAM / per_worker_RAM (I/O bound workers use less CPU)
- CPU-bound (CPU > 50%): max workers = CPU_cores + 1 or 2
- Mixed workload: start with 2x CPU cores, adjust based on monitoring
- Heavy database queries (>100ms each): I/O-bound — workers will queue on database, not CPU
- Light queries (<10ms) but many per request: CPU-bound — query optimization benefits more than worker tuning

## Performance Considerations

- I/O-bound workers: 1-5% CPU utilization while waiting for I/O
- CPU-bound workers: 50-100% CPU utilization during request processing
- Context switching overhead: 5-15% CPU penalty for over-provisioning workers
- I/O saturation symptoms: increasing database query times, connection pool exhaustion
- CPU saturation symptoms: increasing request latency, high system CPU (context switches)

## Security Considerations

- CPU-bound workloads with too many workers can cause CPU starvation for other services
- I/O-bound workloads with too many workers can exhaust database connection pools
- Resource exhaustion from misconfiguration is a denial-of-service risk
- Monitor both CPU and I/O metrics to detect saturation before it causes failures

## Related Rules (from 05-rules.md)

- Limit CPU-Bound Workers to Core Count
- I/O-Bound Workers Can Exceed Core Count
- Monitor CPU Utilization After Worker Changes

## Related Skills

- Capacity Planning and Safety Margins
- Pool Sizing Formula Rationale
- PM Max Children P95 Calculation

## Success Criteria

- Workload classified as CPU-bound, I/O-bound, or mixed
- Worker count matched to classification
- CPU utilization <80% at peak
- I/O subsystems not saturated
- Throughput optimized for the workload type
