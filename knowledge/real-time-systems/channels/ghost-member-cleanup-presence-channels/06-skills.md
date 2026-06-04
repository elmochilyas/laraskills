# Skill: Clean Up Ghost Members in Presence Channels

## Purpose
Configure and maintain ghost member cleanup mechanisms to prevent stale presence entries from inflating online counts and wasting Redis memory.

## When To Use
- All production deployments using presence channels
- Chat applications where stale "online" indicators degrade UX
- Collaborative editing where incorrect collaborator lists cause confusion
- Any application where ghost members accumulate over time

## When NOT To Use
- Applications not using presence channels (no ghost member risk)
- Development environments
- Ephemeral channels with very short lifetimes

## Prerequisites
- Presence channels configured in the application
- Reverb installed (Redis or database scaling driver)
- Pulse/prune mechanism understanding

## Inputs
- Reverb env vars: `REVERB_ACTIVITY_TIMEOUT`, `REVERB_PULSE_INGEST_INTERVAL`
- Database prune schedule configuration

## Workflow
1. Configure `REVERB_ACTIVITY_TIMEOUT` to set TTL-based auto-expiry on presence keys
2. Set `REVERB_PULSE_INGEST_INTERVAL` based on connection churn rate (5s for high-churn, 30s for stable)
3. For database scaling driver: schedule `reverb:prune` command every minute
4. Monitor ghost member ratio as a dashboard metric
5. Set activity timeout to at least 2x the expected reconnection time
6. Use both TTL-based cleanup and pulse/prune for defense in depth
7. Test cleanup after abrupt disconnections (browser crash, network drop)
8. Verify cleanup during rolling deployments

## Validation Checklist
- [ ] Redis presence keys have TTL configured via `REVERB_ACTIVITY_TIMEOUT`
- [ ] Pulse interval tuned to connection churn rate
- [ ] Database prune job scheduled for database scaling driver
- [ ] Ghost member ratio monitored (ghost / total members)
- [ ] Activity timeout not too aggressive (≥2x expected reconnect time)
- [ ] Both TTL and pulse/prune are active (defense in depth)
- [ ] Rolling deployments don't cause permanent ghost inflation

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Ghost members persist for minutes | Pulse interval too high for churn rate | Reduce `REVERB_PULSE_INGEST_INTERVAL` |
| Online counts always inflated | No TTL on presence keys | Set `REVERB_ACTIVITY_TIMEOUT` |
| Database presence table grows unbounded | No prune job scheduled | Schedule `reverb:prune` everyMinute |
| Legitimate connections pruned | Activity timeout too aggressive | Set to 2x expected reconnect time |

## Decision Points
- **Pulse interval tuning**: High-churn chat apps need shorter intervals (5s); stable dashboards can use longer (30s)
- **Redis vs database driver**: Redis TTL provides automatic cleanup; database driver needs scheduled prune
- **Activity timeout duration**: Base on network conditions—mobile apps need longer timeouts than wired connections

## Performance/Security Considerations
- Pulse writes increase with shorter intervals—balance freshness against write load
- Ghost member ratio >5% indicates connection reliability issues
- Redis TTL at 2x activity timeout prevents premature cleanup during slow networks
- Ghost members can be exploited for resource exhaustion—monitor and limit

## Related Rules (from 05-rules.md)
- Always Set TTL on Presence Channel Redis Keys
- Always Tune Pulse Interval to Connection Churn Rate
- Always Schedule the Prune Job for the Database Scaling Driver
- Always Monitor Ghost Member Ratio
- Never Set Activity Timeout Too Aggressively
- Always Use Both TTL and Application-Level Prune for Defense in Depth

## Related Skills
- Track Online Users with Presence Channels
- Manage Redis Dependencies and Failure Modes

## Success Criteria
- Ghost members are cleaned up within acceptable timeframe (≤2x pulse interval)
- Online user counts are accurate within the cleanup window
- No unbounded Redis memory growth from stale presence entries
- Database scaling driver's `reverb_pings` table stays within expected size
