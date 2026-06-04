# Standardized Knowledge: Reverb Connection Lifecycle & State Management

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit ID | K05 |
| Title | Reverb Connection Lifecycle & State Management |
| Difficulty | Intermediate |
| Dependencies | K03, K04, K09, K15, K37 |

## Overview
Reverb manages WebSocket connection state through a lifecycle spanning handshake, authentication, subscription, data transfer, heartbeat/keepalive, and disconnection. Each connection transitions through states: connecting, connected, subscribed, active, idle, reconnecting, and disconnected. Reverb tracks these states in memory (Redis or Database for scaling) and provides a metrics endpoint at `/apps/{appId}/connections` for monitoring.

## Core Concepts
- The WebSocket handshake is an HTTP upgrade request (`Upgrade: websocket`, `Connection: Upgrade`)
- On success, Reverb validates the connection via Pusher protocol—client must authenticate with the app key
- Private and presence channels require additional authorization via HTTP callbacks to `/broadcasting/auth`
- Heartbeat (ping/pong) frames keep the connection alive and detect stale connections
- On timeout or close, Reverb cleans up channel subscriptions and notifies presence channel members

## When To Use
- Understanding connection lifecycle is essential for all Reverb deployments
- Debugging connection issues, authentication failures, or premature disconnections
- Tuning timeouts and heartbeat intervals for specific application needs
- Implementing custom monitoring or state management

## When NOT To Use
- This KU is informational—always relevant for operating Reverb

## Best Practices (Why)
- **Configure `activity_timeout` and `ping_interval` appropriately**: Defaults (30s/60s) work for most; reduce for high-churn connections, increase for stable long-lived connections
- **Use Pulse-based state persistence**: State is written on a timer (not every state change) to reduce write pressure; tune `pulse_ingest_interval` based on connection count
- **Monitor the `/apps/{appId}/connections` endpoint**: Provides programmatic access to current connection counts for health checks and monitoring
- **Set `max_connections_per_ip`**: Prevents individual IP DoS by limiting connections per source address
- **Configure `max_message_size`**: Prevents oversized payload abuse (default 10KB)

## Architecture Guidelines
- Reverb uses JSON-framed ping/pong (Pusher protocol application-level heartbeats) rather than WebSocket control frames
- Pulse interval is decoupled from connection events—state written on a timer, not on every state change
- Activity timeout before ping: Reverb waits `activity_timeout` seconds of silence before initiating ping, reducing unnecessary traffic
- Reverb does not reconnect to clients—that is Echo's responsibility; Reverb only detects and cleans up dead connections

## Performance Considerations
- Memory per connection: ~1-2KB base plus subscription and presence metadata
- Pulse writes: each cycle writes state for all connections; at 50k connections, this is significant write throughput
- Ping frequency: default 60s is appropriate for most deployments
- Connection limits: OS file descriptor limits (`ulimit -n`) often hit before PHP memory limits
- Without `ext-uv`, `stream_select` engine limits to ~1024 concurrent connections

## Security Considerations
- Channel authorization via `/broadcasting/auth` provides per-channel access control
- `max_connections_per_ip` prevents abuse from single source
- Connection lifecycle logs should not expose sensitive data
- Presence channel notifications include user information—ensure proper authorization

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Confusing connections and subscriptions | One connection may subscribe to multiple channels | Not understanding relationship | Inaccurate capacity planning | Track both metrics separately |
| activity_timeout too low | Legitimate idle connections disconnected prematurely | Not tuning based on usage pattern | Unnecessary reconnections | Set based on expected idle time |
| Pulse not enabled on Reverb server | No connection state visibility | Running Pulse only on app server | Missing monitoring data | Enable Pulse on Reverb server |
| Ignoring 1024 fd limit | Connection cap on stream_select engine | Not installing ext-uv | Connections rejected at 1024 | Install ext-uv or ext-event |
| stopwaitsecs < activity_timeout | Connections killed before pong timeout | Not aligning Supervisor config | Aborted reconnections | Keep stopwaitsecs > activity_timeout |

## Anti-Patterns
- **No distinction between connecting and connected states in monitoring**: Understanding the lifecycle helps identify connection issues early
- **Not handling zombie connections**: Connections closed without proper WebSocket close frame; Reverb detects these via ping timeout, but monitoring should alert on stale connection accumulation
- **Single connection lifecycle handler for all events**: Different lifecycle stages need different handling; separate concerns for auth, subscription, and disconnection

## Examples

### Connection state machine
```
Connecting → Connected → Subscribed → Active ↔ Idle → Disconnected
                                       ↓
                                 Reconnecting (client-side, via Echo)
```

### Monitoring connection count
```bash
# Get current connection count
curl -s https://ws.example.com/apps/123456/connections
# Response: {"connections": 42}
```

### Echo connection status hook
```javascript
Echo.connector.pusher.connection.bind('state_change', (states) => {
    console.log('Connection state:', states.current);
    // states: initialized, connecting, connected, unavailable, failed
});
```

## Related Topics
- K03: Reverb Installation & Configuration
- K04: Reverb Horizontal Scaling via Redis
- K09: Laravel Echo Core API
- K15: Reconnection Strategies & Storm Mitigation
- K37: Reverb Monitoring Metrics

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Reverb's connection lifecycle follows the Pusher protocol specification
- The FrankenPHP engine option provides a different threading model (goroutine-like) compared to ReactPHP's event loop
- Laravel 13 database scaling driver stores connection state in MySQL/PostgreSQL tables with a prune job

## Verification
- [ ] `activity_timeout` and `ping_interval` configured appropriately
- [ ] Pulse enabled on Reverb server for connection monitoring
- [ ] `max_connections_per_ip` configured
- [ ] `max_message_size` configured
- [ ] `ext-uv` or `ext-event` installed for >1024 connections
- [ ] Stopwaitsecs in Supervisor > activity_timeout
- [ ] `/apps/{appId}/connections` monitored for health checks
- [ ] Connection lifecycle understood for debugging
