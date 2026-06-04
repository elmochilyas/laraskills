# Standardized Knowledge: Ghost Member Cleanup in Presence Channels

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Channel Types & Authorization |
| Knowledge Unit ID | K35 |
| Knowledge Unit | Ghost Member Cleanup in Presence Channels |
| Difficulty | Intermediate |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Ghost members are stale presence channel entries that remain in the membership store after a client disconnects without a clean WebSocket close frame. This occurs during network drops, browser crashes, hard server restarts, or any abrupt disconnection. Ghost members cause inflated online user counts, stale user lists, and inaccurate presence state. Reverb handles ghost member cleanup through periodic pulse/prune mechanisms, configurable activity timeouts, and TTL-based Redis key expiration. The Reverb database scaling driver (Laravel 13+) uses a dedicated `reverb_pings` table and a prune job for cleanup.

## Core Concepts

A ghost member is a presence channel entry whose WebSocket connection has been terminated but whose membership state was never explicitly removed. The WebSocket close handshake is the clean path—if interrupted, the server cannot distinguish between a temporary network blip and a permanent disconnect. The server uses the activity timeout threshold: if a connection has not sent any data within the timeout window, it is considered dead and its membership is pruned.

Reverb's Pulse system periodically writes connection state and last-seen timestamps. The prune mechanism checks for connections where the last-seen timestamp exceeds the activity timeout. For Redis, presence member entries have a TTL set. When TTL expires, Redis auto-removes the member. For the database scaling driver, a periodic prune job deletes stale rows.

## When To Use

- All production deployments using presence channels
- Chat applications where stale "online" indicators degrade UX
- Collaborative editing where incorrect collaborator lists cause confusion
- Live dashboards where inaccurate viewer counts misrepresent engagement
- Any application where ghost members accumulate over time

## When NOT To Use

- Applications not using presence channels (no ghost member risk)
- Development environments where connection drops are not a concern
- Ephemeral channels with very short lifetimes where cleanup is naturally handled

## Best Practices (WHY)

- **TTL-based auto-expiry**: Set Redis TTL on presence entries as a safety net—ghost members are eventually removed even if the pulse system fails
- **Pulse/prune cycle**: Periodic state persistence + periodic stale state removal provides eventual consistency for presence state
- **Connection heartbeat**: Regular ping/pong keeps connections alive and updates last-seen timestamps
- **Tune pulse interval to churn rate**: Stable long-lived connections can use longer intervals (30s); high-churn applications need shorter intervals (5s)

## Architecture Guidelines

- Normal disconnections are handled inline (immediate membership removal via close frame)
- Proactive cleanup via pulse/prune catches abrupt disconnections that skipped the close handshake
- Redis key TTL ensures ghost members are eventually removed even if the pulse system is delayed
- The database scaling driver requires a scheduled prune job—not automatic like Redis TTL

## Performance Considerations

- Pulse interval: Default 15s balances freshness and write load
- Prune query: Database pruning should use indexed columns for efficient deletion
- Redis TTL: Set to 2x the activity timeout to prevent premature cleanup during slow network conditions
- Ghost member ratio: Monitor as percentage of total members—high ratio indicates connection reliability issues
- Prune cost at scale: Scanning stale entries is O(n) in connection count

## Security Considerations

- Ghost members can be exploited to inflate connection counts (resource exhaustion attack vector)
- Presence data of ghost members remains visible until cleanup—ensure no sensitive data in presence payloads
- During deployments with rolling restarts, expect temporary ghost member inflation

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Pulse interval too high | Default accepted without tuning | Ghost members persist for minutes | Tune based on connection churn rate |
| Relying solely on Redis TTL | Assuming TTL is sufficient | Only Redis-stored ghosts cleaned; database ghosts persist | Implement both TTL and application-level prune |
| No ghost member monitoring | No metrics on stale members | Ghosts silently accumulate over weeks | Track ghost ratio as a dashboard metric |
| Confusing connections with unique users | Multiple tabs = multiple connections | Incorrect member count interpretation | Track connection ID separately from user ID |
| Too-short activity timeout | Aggressive cleanup tuning | Legitimate connections pruned during network blips | Set activity timeout to 2x expected reconnection time |

## Anti-Patterns

- **No cleanup mechanism at all**: Presence membership grows unbounded, eventually exhausting Redis memory
- **Overly aggressive pruning**: Cleaning up members before they have a chance to reconnect during transient network issues
- **Manual cleanup only**: Relying on administrators to run prune commands instead of automated scheduling

## Examples

```env
# Reverb pulse configuration
REVERB_PULSE_INGEST_INTERVAL=15
REVERB_ACTIVITY_TIMEOUT=30
```

```php
// Scheduled prune command for database scaling driver
// Schedule in App\Console\Kernel
$schedule->command('reverb:prune')->everyMinute();
```

## Related Topics

- K13: Presence Channels & Online User Tracking
- K34: Redis Dependency & Failure Modes
- K05: Reverb Connection Lifecycle & State Management
- K03: Reverb Installation & Configuration

## AI Agent Notes

- Ghost member cleanup is essential for production presence reliability
- Redis TTL provides automatic cleanup; database driver requires scheduled prune
- Pulse interval tuning is application-specific, not one-size-fits-all
- Monitor ghost member counts proactively—the problem grows silently

## Verification

- [ ] Redis presence keys have TTL configured
- [ ] Pulse interval is set appropriately for connection churn rate
- [ ] Database prune job is scheduled for database scaling driver
- [ ] Ghost member ratio is monitored as a dashboard metric
- [ ] Activity timeout is not too aggressive for network conditions
- [ ] Cleanup works correctly after abrupt disconnections (browser crash, network drop)
- [ ] Rolling deployments do not cause permanent ghost member inflation
