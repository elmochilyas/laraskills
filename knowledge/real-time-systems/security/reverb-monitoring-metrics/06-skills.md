# Skill: Monitor Reverb Metrics with Laravel Pulse

## Purpose
Set up comprehensive Reverb monitoring covering connections, messages, errors, and resources using Laravel Pulse, connection endpoint polling, and alerting on anomalies.

## When To Use
- All production Reverb deployments
- Any deployment where WebSocket reliability is critical
- Multi-server Reverb fleets requiring per-instance visibility
- Applications approaching connection or throughput limits

## When NOT To Use
- Local development environments
- Single-user applications with trivial WebSocket usage

## Prerequisites
- Laravel Pulse installed and configured
- `pulse:check` daemon running
- Reverb server access for Pulse configuration
- Monitoring/alerting infrastructure

## Inputs
- Pulse configuration with Reverb card
- `/apps/{appId}/connections` endpoint access
- Redis pub/sub metrics access
- Alert threshold definitions

## Workflow
1. Enable `ReverbConnections` recorder in `config/pulse.php`
2. Run `pulse:check` daemon on the Reverb server (not just app servers)
3. Monitor all four metric categories: connections, messages, errors, resources
4. Poll `/apps/{appId}/connections` every 5-10s for programmatic connection counts
5. Implement event loop lag monitoring (periodic timer measuring timestamp offset)
6. Set alerts: connection drop >10% in 1min, memory >80%, event loop lag >500ms
7. Monitor Redis pub/sub subscriber count for Reverb-Redis health
8. Secure the connections endpoint via `allowed_origins` and/or firewall
9. Set up log aggregation for Reverb logs (stdout from Supervisor)
10. Create dashboards for active connections, messages/s, auth failures, reconnection rate

## Validation Checklist
- [ ] Laravel Pulse configured with Reverb card
- [ ] `pulse:check` running on the Reverb server
- [ ] `/apps/{appId}/connections` monitored (5-10s interval)
- [ ] Event loop lag monitoring implemented
- [ ] Alerts configured for connection drop, memory, event loop lag
- [ ] Redis pub/sub subscriber count monitored
- [ ] Reverb logs aggregated
- [ ] Connections endpoint secured via `allowed_origins`

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Pulse shows empty Reverb card | `pulse:check` running on wrong server | Run `pulse:check` on the Reverb server |
| Connection anomalies undetected | Only HTTP metrics monitored | Add WebSocket metrics to monitoring |
| `/apps/connections` publicly accessible | `allowed_origins: ['*']` | Restrict to admin domain |
| Reverb-Redis disconnect invisible | Redis subscriber count not monitored | Track `pubsub numsub reverb-production` |
| False alerts during deployments | Thresholds not accounting for planned drops | Account for connection drops during rolling deploys |

## Decision Points
- **Polling interval for connections**: 5s for tight monitoring; 10s for reduced overhead
- **Alert thresholds**: `connection_drop >10%/1min` for crash detection; `memory >80%` for capacity; `lag >500ms` for degradation
- **Pulse vs custom metrics**: Pulse for built-in Reverb card; custom Prometheus for advanced dashboards

## Performance/Security Considerations
- `/apps/{appId}/connections` is lightweight — polling every 5-10s has <1% overhead
- Secure connections endpoint: restrict `allowed_origins`, use firewall rules
- Pulse dashboards should require authentication
- Monitoring overhead should be <1% of system resources

## Related Rules (from 05-rules.md)
- Always Set Up Laravel Pulse with the Reverb Card
- Always Monitor All Four Metric Categories
- Always Run `pulse:check` on the Reverb Server
- Always Alert on Connection Anomalies
- Always Monitor Redis Pub/Sub Subscriber Count
- Always Secure the `/apps/{appId}/connections` Endpoint

## Related Skills
- Manage Redis Dependency and Failure Modes for Reverb
- Deploy and Operate a Dedicated Reverb Fleet

## Success Criteria
- Pulse dashboard shows live Reverb connection metrics
- Alerts fire on connection drops, high memory, and event loop lag
- Redis subscriber count confirms Reverb-Redis connectivity
- All metric categories (connections, messages, errors, resources) are tracked
- Connections endpoint is secured against public access
