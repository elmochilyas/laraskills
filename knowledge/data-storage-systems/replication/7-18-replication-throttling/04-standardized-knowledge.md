# 7-18 Replication Throttling

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-18 |
| Knowledge Unit Title | Replication Throttling |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.5 Replica lag | 7.6 Replica lag monitoring | 7.13 Plan replication topology |
| Last Updated | 2026-06-04 |

## Overview

Replication throttling limits the rate of replication apply on replicas to prevent resource exhaustion. True replication throttling is limited in standard MySQL/PostgreSQL. Approaches include flow control (MySQL Group Replication), intentional delay (pt-slave-delay), and application-level backpressure.

---

## Core Concepts

- **Resource-based throttling**: Limiting write rate based on replica CPU, IO, or network utilization.
- **Flow control**: Group Replication feature that throttles the entire group when a replica falls behind.
- **Intentional delay**: pt-slave-delay keeps a replica intentionally behind for point-in-time recovery.
- **Application backpressure**: Application detects lag and reduces write throughput proactively.
- **Replica upgrade**: Often more effective than throttling — upgrade replica to match primary capacity.

## When To Use

- Replica is undersized and can't keep up with primary write rate
- Need to control resource consumption on replica
- Batch processes on replica must not impact replication

## When NOT To Use

- Replica can handle full write rate
- Lag is already under threshold without throttling

## Best Practices

- Monitor replica resource utilization before implementing throttling
- Prefer replica upgrade over throttling when possible
- Test throttling impact on user traffic before production

## Architecture Guidelines

| Approach | Mechanism | Impact | Effectiveness |
|----------|-----------|--------|--------------|
| Flow control (Group Replication) | Cluster-wide throttle | Reduces write throughput | High |
| pt-slave-delay | Intentional lag | Delays but doesn't reduce apply rate | Low |
| Application backpressure | Reduce write rate | Reduces writes during lag | High |
| Replica upgrade | More resources | No throttling needed | Best |

## Performance Considerations

- Flow control reduces write throughput cluster-wide
- pt-slave-delay doesn't reduce resource consumption
- Application backpressure is most effective but affects user experience

## Security Considerations

- Throttling should not require superuser access from application
- Backpressure must not lead to denial of service

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Throttling too aggressively | Overreaction to lag | Replica useless for reads | Start conservative, adjust based on metrics |
| 2 | Flow control without testing | Default enable | Unnecessary write throttling | Test flow control impact before enabling |
| 3 | No application backpressure | Relying only on DB | No graceful degradation | Implement multi-level throttling |

## Anti-Patterns

- Throttling replica without addressing root cause (undersized replica)
- Aggressive throttling that makes replica useless for reads
- No monitoring before implementing throttling

## Verification

- [ ] Throttling mechanism configured
- [ ] Replica resource utilization stays within range
- [ ] Lag doesn't exceed critical threshold
- [ ] Application backpressure works
- [ ] No unintended side effects
