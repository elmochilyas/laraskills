# Skill: Tune Min/Max Spare Servers for Dynamic Mode

## Purpose

Configure `pm.min_spare_servers` and `pm.max_spare_servers` to balance rapid response to traffic increases against memory waste from idle workers.

## When To Use

- Using pm = dynamic mode
- Tuning spare server counts for traffic variability
- Diagnosing latency spikes from worker spawning
- Optimizing memory usage during low-traffic periods

## When NOT To Use

- For pm = static (no spare server concept)
- For pm = ondemand (spare servers are irrelevant)
- Without understanding the traffic pattern (peak/trough ratio)

## Prerequisites

- pm = dynamic mode selected
- Traffic pattern data (typical low and high traffic periods)
- pm.max_children already calculated
- Understanding of spawn latency (~10-50ms)

## Inputs

- Typical low-traffic concurrent request count
- Typical high-traffic concurrent request count
- Traffic ramp-up speed (requests per second increase rate)
- Server memory available for idle workers

## Workflow (numbered steps)

1. Determine typical idle request concurrency during low traffic (e.g., 5 concurrent requests)
2. Set `pm.min_spare_servers` to this number + small buffer (e.g., 8-10)
3. Determine the maximum comfortable surplus during normal traffic (e.g., 20-30% of max_children)
4. Set `pm.max_spare_servers` to this number (e.g., 15-20)
5. Set `pm.start_servers` to the midpoint between min and max spare (e.g., 12-15)
6. Monitor FPM logs for spawn events: if "spawning child" appears frequently, min_spare is too low
7. Monitor idle worker count: if it consistently exceeds max_spare, max_spare is too high
8. Adjust: increase min_spare if traffic frequently exceeds it (causing spawn delays)
9. Adjust: decrease max_spare if memory is constrained and idle workers waste RAM
10. Document the spare server configuration and rationale

## Validation Checklist

- [ ] Low-traffic concurrency measured
- [ ] min_spare_servers set above low-traffic baseline
- [ ] max_spare_servers set for reasonable surplus
- [ ] start_servers set to midpoint
- [ ] No excessive spawn events in FPM log
- [ ] Idle worker count stays within configured range
- [ ] Memory usage acceptable during low traffic
- [ ] Configuration documented

## Common Failures

- **Setting min_spare too high**: Many workers are idle during low traffic, wasting RAM
- **Setting min_spare too low**: Traffic increases cause spawn delays — users see latency spikes
- **Setting max_spare too high**: Workers accumulate after traffic drops, wasting RAM
- **Static-like settings**: Setting min_spare = max_spare = max_children negates dynamic mode benefits

## Decision Points

- Traffic ramps up slowly (minutes): low min_spare is acceptable (spawn rate can keep up)
- Traffic ramps up quickly (seconds): high min_spare needed to absorb spikes without spawning
- Memory is constrained: low min_spare and max_spare to minimize idle workers
- Memory is abundant: higher spare counts for faster response to traffic changes
- Traffic is predictable (scheduled jobs): schedule spare counts to change with expected load

## Performance Considerations

- Each spawn event: 10-50ms delay for the request that triggers it
- Spawn rate limit: 1 worker per second (default) — limits recovery speed after traffic spike
- Idle workers: 30-50MB RAM each for framework apps
- Ramps up vs ramps down: FPM kills idle workers faster than it spawns them (process_idle_timeout)
- Balancing: min_spare = 20% of max_children, max_spare = 40% of max_children is a common starting point

## Security Considerations

- High min_spare on memory-constrained servers can cause OOM during combined low traffic
- Low min_spare on bursty traffic can cause 502 errors during traffic spikes
- Proper spare tuning prevents resource exhaustion from both under- and over-provisioning

## Related Rules (from 05-rules.md)

- Set min_spare_servers Above Low-Traffic Baseline
- Never Set min_spare = max_spare in Dynamic Mode
- Monitor Spawn Events to Validate Spare Settings

## Related Skills

- FPM Process Manager Mode Selection
- Capacity Planning and Safety Margins
- FPM Status Page Monitoring

## Success Criteria

- No excessive spawn events in FPM log
- Idle worker count stays within min/max spare range
- No latency spikes from worker spawning
- Memory usage optimized for traffic pattern
- Configuration documented with rationale
