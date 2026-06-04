# 7-7 Lag-Aware Read Routing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-7 |
| Knowledge Unit Title | Lag-Aware Read Routing |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.5 Replica lag | 7.6 Replica lag monitoring | 7.1 Master-replica topology |
| Last Updated | 2026-06-04 |

## Overview

Lag-aware read routing directs read queries to replicas only when replication lag is below a defined threshold, falling back to the primary when lag exceeds the threshold. This balances read scaling benefits with data freshness requirements.

---

## Core Concepts

- **Lag threshold**: Maximum acceptable replication lag before reads must go to primary. Typically 1-2 seconds for user-facing, 30-60s for analytics.
- **Lag measurement**: Uses Seconds Behind Master (SBM), pt-heartbeat, or GTID-based lag calculation.
- **Fallback routing**: When all replicas exceed threshold, route reads to primary to preserve availability.
- **Stale read tolerance**: Different query types tolerate different staleness. Auth/session reads must go to primary.

## When To Use

- Stale reads are acceptable within a defined lag window
- Need to scale read capacity with replica fleet
- Application can tolerate eventual consistency for non-critical reads

## When NOT To Use

- All reads must be immediately consistent
- Replication lag is consistently near zero (no benefit)

## Best Practices

- Define per-query-type lag thresholds rather than a single global value
- Cache lag measurements on high-traffic systems to reduce per-read overhead
- Always provide a fallback path to primary when all replicas lag

## Architecture Guidelines

| Approach | Read Freshness | Write Impact | Complexity |
|----------|---------------|-------------|------------|
| Always read from replicas | Stale (lag duration) | None | Low |
| Lag-aware routing | Configurable | None | Medium |
| Always read from primary | Fresh | None | None |
| Session-based routing | Mixed | None | High |

## Performance Considerations

- Lag check query adds ~1ms per read if uncached
- Cached lag values (10-100ms stale) reduce overhead significantly
- Too many fallbacks to primary hurt write capacity under load

## Security Considerations

- Lag measurement must not expose database credentials
- Fallback to primary is safe for all query types

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Lag threshold too low | Overly conservative | All reads go to primary, defeating read scaling | Set thresholds based on actual freshness requirements |
| 2 | No lag check caching | High read volume | Every read incurs ~1ms overhead | Cache lag for 10-100ms on high-traffic systems |
| 3 | Relying only on SBM | Simplicity | Lag may be inaccurate with parallel replication | Use pt-heartbeat or GTID-based lag |

## Anti-Patterns

- Routing time-sensitive reads (auth, session) to lagging replicas
- Single global lag threshold for all query types
- No fallback when all replicas exceed threshold

## Verification

- [ ] Reads route to replica when lag is below threshold
- [ ] Reads route to primary when lag exceeds threshold
- [ ] Fallback works when all replicas lagging
- [ ] Thresholds match application freshness requirements
