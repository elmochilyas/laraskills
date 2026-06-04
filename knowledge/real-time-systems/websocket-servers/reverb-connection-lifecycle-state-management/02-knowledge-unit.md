# Metadata
Domain: Real-Time Systems
Subdomain: WebSocket Servers
Knowledge Unit: Reverb Connection Lifecycle & State Management
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Reverb manages WebSocket connection state through a connection lifecycle that spans handshake, authentication, subscription, data transfer, heartbeat/keepalive, and disconnection. Each connection transitions through states: connecting, connected, subscribed, active, idle, reconnecting, and disconnected. Reverb tracks these states in memory (Redis or Database for scaling) and provides a metrics endpoint at `/apps/{appId}/connections` for monitoring. The Pulse system periodically writes connection state to the configured backend, enabling health checks, connection counting, and stale connection pruning. The lifecycle is governed by configurable parameters: `activity_timeout` (idle threshold), `ping_interval` (heartbeat frequency), `max_message_size` (payload limits), and `pulse_ingest_interval` (state persistence cadence).

## Core Concepts
The WebSocket handshake is an HTTP upgrade request (`Upgrade: websocket`, `Connection: Upgrade`). On success, the connection switches to the WebSocket protocol. Reverb then validates the connection via the Pusher protocol—the client must authenticate with the app key. Private and presence channels require additional authorization via HTTP callbacks to `/broadcasting/auth`. The connection remains open until either side closes it. Heartbeat (ping/pong) frames keep the connection alive and detect stale connections. When a connection times out or closes, Reverb cleans up channel subscriptions and notifies presence channel members.

## Mental Models
Each WebSocket connection is a persistent tube between client and server. Reverb is the switchboard operator who manages all the tubes—knows who is connected to which channel, routes messages to the right tubes, and disconnects tubes that go silent.

## Internal Mechanics
Reverb's ReactPHP event loop uses a `LoopInterface` to poll for I/O events. Each WebSocket connection is represented by a `Connection` object wrapping a TCP socket. The `ChannelManager` tracks which channels have which connections. The `PresenceChannelManager` handles presence-specific state (user lists, joining/leaving). The `Pulse` system periodically serializes connection state to the scaling backend (Redis or Database). On horizontal scaling setups, the `Pulse` data is shared across instances. Reverb uses the Pusher protocol's `pusher:ping` and `pusher:pong` events (JSON-framed) rather than WebSocket-level ping/pong frames.

## Patterns
- **State machine**: Connection lifecycle follows a clear state transition: connecting → connected → subscribed → [active↔idle] → disconnected
- **Heartbeat-based health detection**: Periodic ping/pong detects dead connections without waiting for TCP timeout
- **Pulse-based state persistence**: Periodic writes (not real-time) for monitoring and scaling coordination
- **Graceful degradation on disconnect**: Clean up subscriptions, notify presence members, free resources

## Architectural Decisions
- **JSON-framed ping/pong**: Uses Pusher protocol's application-level heartbeats rather than WebSocket control frames for protocol consistency
- **Pulse interval decoupled from connection events**: State is written on a timer, not on every state change, to reduce write pressure
- **Activity timeout before ping**: Reverb waits `activity_timeout` seconds of silence before initiating ping; reduces unnecessary traffic

## Tradeoffs
- **State tracking overhead**: Every connection, subscription, and presence state consumes memory; scaling to 100k connections requires proportional memory
- **Pulse interval tradeoff**: Shorter intervals (5s) provide fresher state but increase write load; longer intervals (30s) reduce load but show stale state
- **No built-in reconnection**: Reverb does not reconnect to clients—that is Echo's responsibility; Reverb only detects and cleans up dead connections

## Performance Considerations
- Memory per connection: ~1-2KB base plus subscription and presence metadata
- Pulse writes: Each pulse cycle writes state for all connections; at 50k connections, this is significant write throughput
- Ping frequency: Default 60s ping interval is appropriate for most deployments; reduce for high-churn connections
- Connection limits: OS file descriptor limits (`ulimit -n`) often hit before PHP memory limits

## Production Considerations
- Configure `activity_timeout` (default 30s) and `ping_interval` (default 60s) based on client reliability expectations
- Monitor the `/apps/{appId}/connections` endpoint for connection count trends
- Use the Pulse Reverb card in Laravel to track active connections over time
- Set `max_connections_per_ip` in Reverb config to prevent IP-based DoS
- Configure `max_message_size` to prevent oversized payload abuse
- Ensure Supervisor restart wait time (`stopwaitsecs`) exceeds `activity_timeout` to allow graceful client migration

## Common Mistakes
- Not distinguishing between connection and subscription counts (one connection subscribes to multiple channels)
- Setting `activity_timeout` too low, causing premature disconnection of legitimate idle connections
- Not enabling Pulse on the Reverb server, missing connection state visibility
- Misconfiguring `pulse_ingest_interval` causing stale connection data in monitoring dashboards
- Ignoring the 1024 file descriptor limit on `stream_select` engine (must use `ext-uv` for >1000 connections)

## Failure Modes
- **Zombie connections**: Connections that close without proper WebSocket close frame; Reverb detects these via ping timeout
- **Connection leak**: Client reconnects rapidly, creating connections faster than Reverb can clean up old ones
- **State desync**: In scaled setups, Pulse that is too infrequent causes connection count discrepancies between instances
- **Deadlock on disconnect**: Long-running disconnect handlers block the event loop, delaying other connection processing

## Ecosystem Usage
- Echo's `useConnectionStatus()` hook directly maps to connection lifecycle states
- Laravel Pulse displays connection counts via Reverb's Pulse integration
- Health check systems probe `/apps/{appId}/connections` to verify Reverb is running
- Load balancers rely on connection health for draining and routing decisions

## Related Knowledge Units
- K03: Reverb Installation & Configuration
- K04: Reverb Horizontal Scaling via Redis
- K09: Laravel Echo Core API
- K15: Reconnection Strategies & Storm Mitigation
- K37: Reverb Monitoring Metrics

## Research Notes
Reverb's connection lifecycle follows the Pusher protocol specification for state management. The Pulse-based state persistence was designed to minimize write amplification at scale. The FrankenPHP engine option provides a different threading model (goroutine-like) compared to ReactPHP's event loop, affecting connection handling behavior. Laravel 13's database scaling driver stores connection state in MySQL/PostgreSQL tables (`reverb_connections`, `reverb_channels`, `reverb_pings`) with a prune job for stale connection cleanup.
