# Skill: Apply the Pool Sizing Formula with Full Rationale

## Purpose

Use the comprehensive pool sizing formula (max_children = (total_RAM - OS_reserve) / (per_worker_RAM)) and understand each term's derivation and assumptions.

## When To Use

- Initial PHP-FPM pool capacity planning
- Documenting the rationale behind worker count decisions
- Auditing existing pool configurations
- Training team members on capacity planning

## When NOT To Use

- When the full formula cannot be applied (missing data)
- Without first measuring per-worker RSS
- For Octane or alternative runtimes (different capacity models)

## Prerequisites

- Server total RAM
- Worker RSS measurement (idle and peak)
- OS and service memory requirements (database, web server, monitoring)
- Traffic pattern understanding

## Inputs

- Total server RAM
- OS reservation (typically 1-2GB for OS + services)
- Web server memory (Nginx/Apache)
- Database memory (MySQL buffer pool, etc.)
- Per-worker RSS at idle and peak
- Safety margin percentage

## Workflow (numbered steps)

1. Calculate total available RAM: total_RAM - OS_reserve - other_service_RAM
2. Reserve for OS: 1-2GB depending on OS and monitoring agents
3. Subtract other co-located services: database, Redis, web server, monitoring
4. Measure per-worker RSS at idle (post-request) and at peak (during request)
5. Use peak RSS for conservative sizing, or weighted average if peak is rare
6. Calculate raw max_children: available_RAM / per_worker_RAM
7. Apply safety margin: raw_value × (1 - safety_margin) — typically 0.7-0.8
8. Round down to the nearest reasonable number
9. Validate against traffic-based calculation (P95 concurrency) — use the lower of the two
10. Document the full formula with all terms explained

## Validation Checklist

- [ ] Total server RAM documented
- [ ] OS reservation calculated
- [ ] Other service RAM subtracted
- [ ] Per-worker RSS measured (idle and peak)
- [ ] Raw max_children calculated
- [ ] Safety margin applied
- [ ] Cross-validated with traffic-based calculation
- [ ] Full formula documented with assumptions

## Common Failures

- **Not accounting for all services**: Database, Redis, web server, monitoring, and OS all consume RAM
- **Using idle RSS instead of peak**: Workers use more memory during request processing — peak must be used
- **Safety margin too small**: 10% margin is insufficient for traffic variability — 20-30% recommended
- **Not documenting assumptions**: When the formula is revisited, the original assumptions must be known

## Decision Points

- Co-located database (MySQL): subtract buffer_pool_size + 20% overhead from available RAM
- Co-located Redis: subtract maxmemory configuration + 20% overhead
- Dedicated PHP server: OS_reserve = 1-2GB, no other services to subtract
- Safety margin: 20% for predictable traffic, 30% for variable traffic
- If RAM-constrained: calculate with peak RSS; if RAM-abundant: calculate with idle RSS

## Performance Considerations

- Each idle worker: 30-50MB for framework applications
- Each peak worker: 50-200MB depending on request complexity
- OS reservation: 512MB-2GB depending on monitoring agents, logging, and system services
- Memory overcommit: Linux allows overcommit but swap kills performance — avoid it
- Worker count vs throughput: relationship is not linear — diminishing returns past a point

## Security Considerations

- Over-provisioning workers increases blast radius of a compromised worker
- Under-provisioning causes 502 errors — availability impact
- Swap usage from over-provisioning degrades all services on the server
- Regular review of the formula assumptions prevents configuration drift

## Related Rules (from 05-rules.md)

- Size pm.max_children to Available RAM, Not Traffic
- Always Apply 20-30% Safety Margin
- Never Use Ondemand for Production APIs Above 50 req/s

## Related Skills

- Capacity Planning and Safety Margins
- PM Max Children P95 Calculation
- Worker RSS Capacity Ceiling
- CPU vs IO Bound Worker Ratios

## Success Criteria

- Full pool sizing formula applied and documented
- All terms explained with measured or estimated values
- Cross-validated against traffic-based calculation
- No swap usage at peak traffic
- Formula assumptions documented for future review
