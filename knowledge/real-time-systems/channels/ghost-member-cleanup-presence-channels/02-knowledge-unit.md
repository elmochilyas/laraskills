# Metadata
Domain: Real-Time Systems
Subdomain: Channel Types & Authorization
Knowledge Unit: Ghost Member Cleanup in Presence Channels
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Ghost members are stale presence channel entries that remain in the membership store after a client has disconnected without a clean WebSocket close frame. This occurs during network drops, browser crashes, hard server restarts, or any abrupt disconnection. Ghost members cause inflated online user counts, stale user lists, and inaccurate presence state. Reverb and Pusher handle ghost member cleanup through periodic pulse/prune mechanisms, configurable activity timeouts, and TTL-based Redis key expiration. The Reverb database scaling driver (Laravel 13+) uses a dedicated `reverb_pings` table and a prune job for cleanup. Configuration of pruning aggressiveness involves tuning the pulse interval, activity timeout, and prune threshold.

## Core Concepts
A ghost member is a presence channel entry whose WebSocket connection has been terminated but whose membership state was never explicitly removed. The WebSocket close handshake (a four-way frame exchange) is the clean path—if interrupted, the server cannot distinguish between a temporary network blip and a permanent disconnect. The server uses the activity timeout threshold: if a connection has not sent any data (including ping/pong) within the timeout window, it is considered dead and its membership is pruned.

## Mental Models
Ghost members are like people who leave a meeting room without telling anyone. The room's attendee list stays wrong until a periodic roll call (pulse/prune) identifies and removes the missing attendees.

## Internal Mechanics
Reverb's Pulse system periodically (default every 15 seconds) writes connection state and last-seen timestamps to the scaling backend. The prune mechanism checks for connections where the last-seen timestamp exceeds the activity timeout. For the Redis scaling driver, presence member entries in Redis have a TTL set (matching the activity timeout). When TTL expires, Redis auto-removes the member. For the database scaling driver (Laravel 13+), the `reverb_pings` table records last-seen timestamps, and a periodic prune job deletes rows where `last_ping` exceeds the threshold. The `reverb:prune` command can be run manually or scheduled.

## Patterns
- **TTL-based auto-expiry**: Redis entries with TTL ensure ghost members are eventually removed even if prune fails
- **Pulse/prune cycle**: Periodic state persistence + periodic stale state removal = eventual consistency
- **Graceful vs. abrupt disconnect handling**: Clean close handshake removes membership immediately; pulse/prune handles the rest
- **Connection heartbeat**: Regular ping/pong keeps connections alive and updates last-seen timestamps

## Architectural Decisions
- **Reactive cleanup on close**: Normal disconnections are handled inline (immediate membership removal)
- **Proactive cleanup via pulse/prune**: Periodic sweep catches abrupt disconnections that skipped the close handshake
- **TTL as safety net**: Redis key TTL ensures ghost members are eventually removed even if the pulse system is delayed

## Tradeoffs
- **Pulse interval vs. stale state accuracy**: Shorter intervals (5s) mean more accurate counts but higher write load; longer intervals (30s) reduce load but ghost members persist longer
- **TTL duration vs. premature cleanup**: Too short TTL may remove legitimate connections during network blips; too long TTL keeps ghosts visible longer
- **Prune cost at scale**: Scanning and removing stale entries is O(n) in connection count; frequent pruning on large deployments has performance impact
- **Database scaling driver overhead**: The `reverb_pings` table grows with connection count; prune job requires database I/O

## Performance Considerations
- Pulse interval: Default 15s is a good balance; reduce for high-churn applications, increase for stable long-lived connections
- Prune query: Database-based pruning should use indexed columns (`last_ping`, `connection_id`) for efficient deletion
- Redis TTL: Set to 2x the activity timeout to prevent premature cleanup during slow network conditions
- Ghost member ratio: Monitor as a percentage of total members; high ratio indicates connection reliability issues

## Production Considerations
- Monitor presence channel member counts vs. actual active connections (dashboard metric)
- Tune pulse and prune intervals based on connection churn rate
- For database driver, monitor `reverb_connections` table growth and prune effectiveness
- Implement alerting on ghost member spikes (indicative of network issues or deployment problems)
- During deployments with rolling restarts, expect temporary ghost member inflation—this is normal
- Consider using WebSocket close frames with reason codes for cleaner disconnections during planned maintenance

## Common Mistakes
- Setting pulse interval too high (ghost members persist for minutes, degrading user experience)
- Relying solely on Redis TTL without application-level prune (TTL only catches Redis-stored ghost members)
- Not monitoring ghost member counts—they silently inflate over time with repeated disconnections
- Confusing connection count with unique user count (one user with multiple tabs = multiple connections)
- Expecting immediate member list accuracy after a mass disconnect event

## Failure Modes
- **Ghost accumulation**: Pulse/prune mechanism fails or is too slow; ghost members accumulate over days/weeks
- **TTL misconfiguration**: Redis key TTL not set or too long; ghost members persist indefinitely in Redis
- **Prune job failure**: Database pruning job crashes or is not scheduled; database scaling driver connections table grows unbounded
- **Network partition**: Reverb instance is partitioned from Redis but connections remain alive; when partition heals, old members marked as ghosts are incorrectly listed
- **Deployment-related ghost surge**: Rolling restart disconnects thousands of connections without proper drain; ghost members spike until pulse/prune catches up

## Ecosystem Usage
- All presence channel deployments benefit from ghost member cleanup
- Chat applications: stale "online" indicators if ghosts not cleaned
- Collaborative editing: incorrect collaborator lists
- Live dashboards: inaccurate viewer counts
- Social features: stale "X others are viewing" messages

## Related Knowledge Units
- K13: Presence Channels & Online User Tracking
- K34: Redis Dependency & Failure Modes
- K05: Reverb Connection Lifecycle & State Management
- K03: Reverb Installation & Configuration

## Research Notes
Ghost member cleanup is an inherent challenge in presence-based systems. The pulse/prune mechanism in Reverb mirrors Pusher's approach. The database scaling driver (Laravel 13+) required new cleanup approaches since Redis TTL is not available. The `reverb:prune` command and scheduled task handle this for database-backed deployments. Ghost member cleanup is directly related to the `activity_timeout` configuration—connections that have been silent longer than this threshold are considered stale. For chat applications that need accurate online indicators, a combined approach of pulse/prune + application-level heartbeat is recommended.
