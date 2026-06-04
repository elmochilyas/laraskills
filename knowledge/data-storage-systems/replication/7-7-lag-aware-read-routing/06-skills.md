# Skill: Implement Lag-Aware Read Splitting

## Purpose

Route read queries to replicas only when replication lag is below a defined threshold; fall back to replica or primary when lag exceeds the threshold.

## When To Use

- Stale reads from replicas are acceptable within a defined lag window
- Need to balance read scaling with data freshness
- Important: reads that need fresh data go to primary

## When NOT To Use

- All reads must be immediately consistent (read from primary only)
- Replication lag is consistently near zero
- Proxy-level routing handles this transparently

## Prerequisites

- Replica lag monitoring (pt-heartbeat or SBM)
- Read/write connection separation
- Application can tolerate some reads from primary

## Inputs

- Replica lag threshold (e.g., 1 second for user-facing, 30s for analytics)
- Current replica lag measurement
- Read-only queries

## Workflow (numbered steps)

1. Define lag threshold based on application requirements:
   - User-facing: 1-2 seconds
   - Reporting/analytics: 30-60 seconds
   - Admin: 0-1 seconds
2. Implement a custom connection resolver or database middleware:
   - Before executing a read, check current lag on the replica
   - If lag > threshold: route read to primary (or another replica with lower lag)
   - If lag <= threshold: route read to replica normally
3. For Laravel: override `DB_READ_HOST` fallback logic or use a middleware
4. Consider replica-level health checks: if all replicas exceed threshold, route to primary
5. Monitor how often reads are routed to primary (defeats read scaling if threshold too low)

## Validation Checklist

- [ ] Reads route to replica when lag is below threshold
- [ ] Reads route to primary when lag is above threshold
- [ ] Fallback works when all replicas lagging
- [ ] Threshold meets application data freshness requirements

## Common Failures

- Lag threshold too low — every read goes to primary
- Lag check adds query latency to every read
- Relying on SBM — lag check may be inaccurate

## Decision Points

- Lag threshold per query type vs global
- Check lag on every read vs cached lag value
- Fallback to primary vs fail reader with error

## Performance Considerations

- Lag check query adds ~1ms per read (if not cached)
- Cached lag values (10-100ms stale) reduce overhead
- Too many fallbacks to primary hurt write capacity

## Security Considerations

- Lag measurement must not expose credentials
- Fallback to primary is safe (primary handles all query types)

## Related Rules

- 7-7-1: Always Check Lag Before Reading From Replica
- 7-7-2: Never Route Time-Sensitive Reads To Lagging Replicas

## Related Skills

- Monitor Replica Lag
- Implement Sticky Writes
- Implement Read/Write Connection Separation

## Success Criteria

- Reads served from replicas when lag is low
- Reads served from primary when lag is high
- Fallback mechanism works without application errors
