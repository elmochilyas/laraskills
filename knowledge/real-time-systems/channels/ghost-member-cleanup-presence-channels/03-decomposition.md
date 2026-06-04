# Decomposition: Ghost Member Cleanup Presence Channels

## Topic Overview
Ghost members are stale presence channel entries that remain in the membership store after a client has disconnected without a clean WebSocket close frame. This occurs during network drops, browser crashes, hard server restarts, or any abrupt disconnection. Ghost members cause inflated online user counts, stale user lists, and inaccurate presence state. Reverb and Pusher handle ghost member cleanup through periodic pulse/prune mechanisms, configurable activity timeouts, and TTL-based Redis ke...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
channel-types-authorization/K35-ghost-member-cleanup-presence-channels/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Ghost Member Cleanup Presence Channels
- **Purpose:** Ghost members are stale presence channel entries that remain in the membership store after a client has disconnected without a clean WebSocket close frame. This occurs during network drops, browser crashes, hard server restarts, or any abrupt disconnection. Ghost members cause inflated online user counts, stale user lists, and inaccurate presence state. Reverb and Pusher handle ghost member cleanup through periodic pulse/prune mechanisms, configurable activity timeouts, and TTL-based Redis ke...
- **Difficulty:** Intermediate
- **Dependencies:
  - K13: Presence Channels & Online User Tracking
  - K34: Redis Dependency & Failure Modes
  - K05: Reverb Connection Lifecycle & State Management
  - K03: Reverb Installation & Configuration

## Dependency Graph
**Depends on:**
  - K13: Presence Channels & Online User Tracking
  - K34: Redis Dependency & Failure Modes
  - K05: Reverb Connection Lifecycle & State Management
  - K03: Reverb Installation & Configuration

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **TTL-based auto-expiry**: Redis entries with TTL ensure ghost members are eventually removed even if prune fails**Pulse/prune cycle**: Periodic state persistence + periodic stale state removal = eventual consistency**Graceful vs. abrupt disconnect handling**: Clean close handshake removes membership immediately; pulse/prune handles the rest**Connection heartbeat**: Regular ping/pong keeps connections alive and updates last-seen timestamps**Reactive cleanup on close**: Normal disconnections are handled inline (immediate membership removal)**Proactive cleanup via pulse/prune**: Periodic sweep catches abrupt disconnections that skipped the close handshake**TTL as safety net**: Redis key TTL ensures ghost members are eventually removed even if the pulse system is delayed**Pulse interval vs. stale state accuracy**: Shorter intervals (5s) mean more accurate counts but higher write load; longer intervals (30s) reduce load but ghost members persist longer**TTL duration vs. premature cleanup**: Too short TTL may remove legitimate connections during network blips; too long TTL keeps ghosts visible longer**Prune cost at scale**: Scanning and removing stale entries is O(n) in connection count; frequent pruning on large deployments has performance impact**Database scaling driver overhead**: The `reverb_pings` table grows with connection count; prune job requires database I/OPulse interval: Default 15s is a good balance; reduce for high-churn applications, increase for stable long-lived connectionsPrune query: Database-based pruning should use indexed columns (`last_ping`, `connection_id`) for efficient deletionRedis TTL: Set to 2x the activity timeout to prevent premature cleanup during slow network conditionsGhost member ratio: Monitor as a percentage of total members; high ratio indicates connection reliability issuesMonitor presence channel member counts vs. actual active connections (dashboard metric)Tune pulse and prune intervals based on connection churn rateFor database driver, monitor `reverb_connections` table growth and prune effectivenessImplement alerting on ghost member spikes (indicative of network issues or deployment problems)During deployments with rolling restarts, expect temporary ghost member inflation—this is normalConsider using WebSocket close frames with reason codes for cleaner disconnections during planned maintenanceSetting pulse interval too high (ghost members persist for minutes, degrading user experience)Relying solely on Redis TTL without application-level prune (TTL only catches Redis-stored ghost members)Not monitoring ghost member counts—they silently inflate over time with repeated disconnectionsConfusing connection count with unique user count (one user with multiple tabs = multiple connections)Expecting immediate member list accuracy after a mass disconnect event**Ghost accumulation**: Pulse/prune mechanism fails or is too slow; ghost members accumulate over days/weeks**TTL misconfiguration**: Redis key TTL not set or too long; ghost members persist indefinitely in Redis**Prune job failure**: Database pruning job crashes or is not scheduled; database scaling driver connections table grows unbounded**Network partition**: Reverb instance is partitioned from Redis but connections remain alive; when partition heals, old members marked as ghosts are incorrectly listed**Deployment-related ghost surge**: Rolling restart disconnects thousands of connections without proper drain; ghost members spike until pulse/prune catches upAll presence channel deployments benefit from ghost member cleanupChat applications: stale "online" indicators if ghosts not cleanedCollaborative editing: incorrect collaborator listsLive dashboards: inaccurate viewer countsSocial features: stale "X others are viewing" messagesK13: Presence Channels & Online User TrackingK34: Redis Dependency & Failure ModesK05: Reverb Connection Lifecycle & State ManagementK03: Reverb Installation & Configuration

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization