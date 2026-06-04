# Skill: Manage Reverb Connection Lifecycle and State

## Purpose
Understand and manage the Reverb connection lifecycle from handshake through disconnection, including timeout tuning, heartbeat configuration, monitoring, and resource limits.

## When To Use
- Understanding connection lifecycle is essential for all Reverb deployments
- Debugging connection issues, auth failures, or premature disconnections
- Tuning timeouts and heartbeat intervals for specific application needs
- Implementing custom monitoring or state management

## When NOT To Use
- This KU is informational — always relevant for operating Reverb

## Prerequisites
- Reverb installed and running
- Access to Reverb config (`config/reverb.php`)
- Pulse set up on Reverb server
- `ext-uv` or `ext-event` for high-connection deployments

## Inputs
- Reverb config: `activity_timeout`, `ping_interval`
- Pulse configuration
- `/apps/{appId}/connections` endpoint
- Supervisor config: `stopwaitsecs`

## Workflow
1. Tune `activity_timeout` and `ping_interval` based on connection patterns (default 30s/60s)
2. Enable Pulse on the Reverb server for connection lifecycle metrics
3. Configure `max_connections_per_ip` to prevent single-source exhaustion
4. Set `max_message_size` to prevent oversized payload abuse (default 10KB)
5. Install `ext-uv` or `ext-event` for deployments exceeding 1024 concurrent connections
6. Poll `/apps/{appId}/connections` regularly for health and capacity monitoring
7. Set Supervisor `stopwaitsecs` > `activity_timeout` for graceful drain
8. Monitor connection state transitions via Echo's `state_change` hook

## Validation Checklist
- [ ] `activity_timeout` and `ping_interval` tuned appropriately
- [ ] Pulse enabled on Reverb server for connection monitoring
- [ ] `max_connections_per_ip` configured
- [ ] `max_message_size` configured
- [ ] `ext-uv` or `ext-event` installed for >1024 connections
- [ ] `stopwaitsecs` in Supervisor > `activity_timeout`
- [ ] `/apps/{appId}/connections` monitored for health checks
- [ ] Connection lifecycle understood for debugging

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Legitimate idle connections disconnected | `activity_timeout` too low | Increase based on expected idle time |
| Dead connections accumulate | `activity_timeout` too high | Decrease for faster dead connection detection |
| Connections capped at 1024 | `ext-uv` not installed | Install `ext-uv` via PECL |
| Single IP consumes all connections | `max_connections_per_ip` not set | Configure per-IP limit (e.g., 100) |
| Pulse shows no Reverb data | `pulse:check` not on Reverb server | Run `pulse:check` on the Reverb server |
| Mass disconnections on restart | `stopwaitsecs` < `activity_timeout` | Set `stopwaitsecs > activity_timeout` |

## Decision Points
- **activity_timeout/ping_interval**: Mobile apps → shorter (15s/30s); stable long-lived → longer (60s/120s)
- **ext-uv vs ext-event**: `ext-uv` is simpler (single PECL install); both enable high-connection support
- **Message size limit**: 10KB default; increase for payloads with larger data, but consider bandwidth impact

## Performance/Security Considerations
- Memory per connection: ~1-2KB base plus subscription/presence metadata
- Pulse writes every cycle for all connections; significant throughput at 50k+ connections
- OS file descriptor limits (`ulimit -n`) often hit before PHP memory limits
- `max_connections_per_ip` prevents single-source DoS
- `max_message_size` prevents memory exhaustion

## Related Rules (from 05-rules.md)
- Always Configure `activity_timeout` and `ping_interval` Appropriately
- Always Enable Pulse on the Reverb Server
- Always Configure `max_connections_per_ip`
- Always Set `max_message_size` to Prevent Payload Abuse
- Always Install `ext-uv` or `ext-event` for High-Connection Deployments
- Always Monitor the `/apps/{appId}/connections` Endpoint

## Related Skills
- Monitor Reverb Metrics with Laravel Pulse
- Configure and Operate Laravel Broadcasting Architecture

## Success Criteria
- Connection lifecycle from handshake to disconnection is understood and debuggable
- Timeout/heartbeat values match application connection patterns
- Connection limits (per-IP, message size, fd limit) are configured appropriately
- Pulse shows connection metrics on the Reverb server
- `/apps/{appId}/connections` endpoint provides accurate health data
