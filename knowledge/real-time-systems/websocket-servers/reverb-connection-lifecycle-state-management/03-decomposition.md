# Decomposition: Reverb Connection Lifecycle State Management

## Topic Overview
Reverb manages WebSocket connection state through a connection lifecycle that spans handshake, authentication, subscription, data transfer, heartbeat/keepalive, and disconnection. Each connection transitions through states: connecting, connected, subscribed, active, idle, reconnecting, and disconnected. Reverb tracks these states in memory (Redis or Database for scaling) and provides a metrics endpoint at `/apps/{appId}/connections` for monitoring. The Pulse system periodically writes connect...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
websocket-servers/K05-reverb-connection-lifecycle-state-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Reverb Connection Lifecycle State Management
- **Purpose:** Reverb manages WebSocket connection state through a connection lifecycle that spans handshake, authentication, subscription, data transfer, heartbeat/keepalive, and disconnection. Each connection transitions through states: connecting, connected, subscribed, active, idle, reconnecting, and disconnected. Reverb tracks these states in memory (Redis or Database for scaling) and provides a metrics endpoint at `/apps/{appId}/connections` for monitoring. The Pulse system periodically writes connect...
- **Difficulty:** Intermediate
- **Dependencies:
  - K03: Reverb Installation & Configuration
  - K04: Reverb Horizontal Scaling via Redis
  - K09: Laravel Echo Core API
  - K15: Reconnection Strategies & Storm Mitigation
  - K37: Reverb Monitoring Metrics

## Dependency Graph
**Depends on:**
  - K03: Reverb Installation & Configuration
  - K04: Reverb Horizontal Scaling via Redis
  - K09: Laravel Echo Core API
  - K15: Reconnection Strategies & Storm Mitigation
  - K37: Reverb Monitoring Metrics

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **State machine**: Connection lifecycle follows a clear state transition: connecting → connected → subscribed → [active↔idle] → disconnected**Heartbeat-based health detection**: Periodic ping/pong detects dead connections without waiting for TCP timeout**Pulse-based state persistence**: Periodic writes (not real-time) for monitoring and scaling coordination**Graceful degradation on disconnect**: Clean up subscriptions, notify presence members, free resources**JSON-framed ping/pong**: Uses Pusher protocol's application-level heartbeats rather than WebSocket control frames for protocol consistency**Pulse interval decoupled from connection events**: State is written on a timer, not on every state change, to reduce write pressure**Activity timeout before ping**: Reverb waits `activity_timeout` seconds of silence before initiating ping; reduces unnecessary traffic**State tracking overhead**: Every connection, subscription, and presence state consumes memory; scaling to 100k connections requires proportional memory**Pulse interval tradeoff**: Shorter intervals (5s) provide fresher state but increase write load; longer intervals (30s) reduce load but show stale state**No built-in reconnection**: Reverb does not reconnect to clients—that is Echo's responsibility; Reverb only detects and cleans up dead connectionsMemory per connection: ~1-2KB base plus subscription and presence metadataPulse writes: Each pulse cycle writes state for all connections; at 50k connections, this is significant write throughputPing frequency: Default 60s ping interval is appropriate for most deployments; reduce for high-churn connectionsConnection limits: OS file descriptor limits (`ulimit -n`) often hit before PHP memory limitsConfigure `activity_timeout` (default 30s) and `ping_interval` (default 60s) based on client reliability expectationsMonitor the `/apps/{appId}/connections` endpoint for connection count trendsUse the Pulse Reverb card in Laravel to track active connections over timeSet `max_connections_per_ip` in Reverb config to prevent IP-based DoSConfigure `max_message_size` to prevent oversized payload abuseEnsure Supervisor restart wait time (`stopwaitsecs`) exceeds `activity_timeout` to allow graceful client migrationNot distinguishing between connection and subscription counts (one connection subscribes to multiple channels)Setting `activity_timeout` too low, causing premature disconnection of legitimate idle connectionsNot enabling Pulse on the Reverb server, missing connection state visibilityMisconfiguring `pulse_ingest_interval` causing stale connection data in monitoring dashboardsIgnoring the 1024 file descriptor limit on `stream_select` engine (must use `ext-uv` for >1000 connections)**Zombie connections**: Connections that close without proper WebSocket close frame; Reverb detects these via ping timeout**Connection leak**: Client reconnects rapidly, creating connections faster than Reverb can clean up old ones**State desync**: In scaled setups, Pulse that is too infrequent causes connection count discrepancies between instances**Deadlock on disconnect**: Long-running disconnect handlers block the event loop, delaying other connection processingEcho's `useConnectionStatus()` hook directly maps to connection lifecycle statesLaravel Pulse displays connection counts via Reverb's Pulse integrationHealth check systems probe `/apps/{appId}/connections` to verify Reverb is runningLoad balancers rely on connection health for draining and routing decisionsK03: Reverb Installation & ConfigurationK04: Reverb Horizontal Scaling via RedisK09: Laravel Echo Core APIK15: Reconnection Strategies & Storm MitigationK37: Reverb Monitoring Metrics

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