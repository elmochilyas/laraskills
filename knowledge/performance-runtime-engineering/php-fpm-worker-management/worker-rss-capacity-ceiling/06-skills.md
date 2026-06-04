# Skill: Determine the Worker RSS Capacity Ceiling

## Purpose

Calculate the maximum worker RSS before server memory is exhausted, establishing the absolute ceiling for max_children configuration.

## When To Use

- Establishing the upper bound for max_children
- Diagnosing OOM or swap events
- Server memory capacity planning
- Evaluating if worker count or per-worker memory is the constraint

## When NOT To Use

- Without first measuring actual worker RSS
- When server memory configuration is unknown
- For Octane workers (they use a different memory model)

## Prerequisites

- Server total RAM
- Per-worker RSS measurement at peak load
- Understanding of other services' memory usage on the server

## Inputs

- Total server RAM (GB)
- OS memory footprint (GB)
- Co-located services memory (database, Redis, web server)
- Per-worker RSS at peak (MB)
- Swap status (active/inactive)

## Workflow (numbered steps)

1. Measure total server RAM: `cat /proc/meminfo | grep MemTotal` or `Get-WmiObject Win32_ComputerSystem | Select-Object TotalPhysicalMemory` (on Windows)
2. Measure OS + services baseline memory: check free/available memory with zero PHP-FPM workers active
3. Measure per-worker RSS at peak: capture RSS during a request that uses maximum memory
4. Calculate available PHP memory: total_RAM - OS_services_baseline
5. Calculate maximum workers: available_PHP_memory / peak_worker_RSS
6. This is the absolute ceiling — do not configure max_children at this value
7. Apply safety margin: ceiling × 0.7 (30% below ceiling) for production
8. Validate: if max_children × peak_worker_RSS < available_PHP_memory × 0.7, configuration is safe
9. If swap is active at any point, reduce max_children or add RAM
10. Document the ceiling calculation

## Validation Checklist

- [ ] Total RAM measured
- [ ] OS + services baseline measured
- [ ] Per-worker peak RSS measured
- [ ] Absolute ceiling calculated
- [ ] Safety margin applied (30% below ceiling)
- [ ] No swap activity at peak traffic
- [ ] Ceiling documented with all inputs

## Common Failures

- **Configuring at the ceiling**: Any extra memory usage (OS cache, service spikes) causes OOM
- **Not using peak RSS**: Workers consume more memory during requests than at idle
- **Ignoring OS page cache**: Linux uses free RAM for page cache — aggressive caching can coexist with workers
- **Forgetting swap is not RAM**: Swap usage indicates memory pressure — increase RAM or reduce workers

## Decision Points

- Ceiling calculated but swap active: workers are still too many — reduce until swap stops
- Ceiling calculated but max_children_reached = true: increase max_children within ceiling
- OS cache is large: OK to count some for worker memory (Linux will release cache under memory pressure)
- Overcommit ratio: Linux allows overcommit (allocating more virtual memory than physical) — but going over causes OOM

## Performance Considerations

- Worker RSS includes: PHP heap (zend_mm_heap), loaded classes, extension memory, stack
- Peak RSS is typically 2-5x idle RSS due to request processing allocations
- OS memory pressure: reclaims page cache first, then swaps — swap is 1000x slower than RAM
- Overcommit: Linux allows it but OOM killer is triggered when actual physical memory is exhausted
- RSS growth over time (drift): adds to the per-worker memory — must be factored into ceiling

## Security Considerations

- OOM killer may target PHP-FPM workers or critical system processes
- Swap usage degrades performance and indicates capacity failure
- An attacker can trigger OOM by sending memory-intensive requests
- Monitoring worker RSS as a percentage of the ceiling enables proactive capacity management

## Related Rules (from 05-rules.md)

- Size pm.max_children to Available RAM, Not Traffic
- Never Exceed 70% of Capacity Ceiling
- Monitor Swap Usage as Capacity Indicator

## Related Skills

- Capacity Planning and Safety Margins
- Pool Sizing Formula Rationale
- PM Max Children P95 Calculation

## Success Criteria

- Capacity ceiling calculated and documented
- max_children set at 70% or below ceiling
- No swap activity at peak traffic
- Worker RSS monitored as percentage of ceiling
- Ceiling recalculated after any server or application changes
