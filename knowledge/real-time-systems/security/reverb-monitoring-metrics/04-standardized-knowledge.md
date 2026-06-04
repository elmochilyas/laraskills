# Standardized Knowledge: Reverb Monitoring Metrics

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Security |
| Knowledge Unit ID | K37 |
| Title | Reverb Monitoring Metrics |
| Difficulty | Intermediate |
| Dependencies | K05, K21, K34, K27 |

## Overview
Monitoring Reverb requires tracking connection metrics (active connections, connection rate, peak concurrency), message metrics (messages per second, message size distribution), error metrics (auth failures, disconnection reasons, protocol errors), and resource metrics (memory usage, CPU load, event loop lag, file descriptor count). Laravel Pulse provides a first-party Reverb monitoring card. Reverb exposes a `/apps/{appId}/connections` endpoint for programmatic connection counts.

## Core Concepts
- Unlike HTTP servers where every request is logged, WebSocket connections persist and their lifecycle events must be explicitly tracked
- Primary monitoring data sources: Reverb's internal metrics, Laravel Pulse, PHP process metrics, Redis pub/sub stats, Nginx connection metrics
- Key thresholds: connection drop rate >10% in 1 minute, auth endpoint P95 latency >200ms, memory usage >80% of PHP limit, event loop lag >500ms

## When To Use
- All production Reverb deployments
- Any deployment where WebSocket reliability is critical
- Multi-server Reverb fleets requiring per-instance visibility
- Applications approaching connection or throughput limits

## When NOT To Use
- Local development environments
- Single-user applications with trivial WebSocket usage

## Best Practices (Why)
- **Set up Laravel Pulse on the Reverb server**: The Pulse Reverb card provides built-in connection time series—run `pulse:check` on the Reverb server itself
- **Monitor `/apps/{appId}/connections` endpoint**: Poll every 5-10s for programmatic connection counts; it's lightweight and unauthenticated (protected by allowed_origins)
- **Track event loop lag**: Inject a periodic timer that measures timestamp offset—if >500ms, the event loop is blocked
- **Alert on connection anomalies**: Sudden drops indicate crashes; sudden increases indicate reconnection storms

## Architecture Guidelines
- Configure `pulse:check` daemon to run on the Reverb server (or one server in a fleet)
- Implement external monitoring that probes the WebSocket endpoint
- Monitor Redis connection count—Reverb instances show as connected clients
- Set up log aggregation for Reverb logs (stdout from Supervisor) to detect error patterns
- Create dashboards for: active connections (current + trend), messages per second, auth failures, reconnection rate

## Performance Considerations
- `/apps/{appId}/connections` endpoint is lightweight; poll every 5-10s without significant impact
- Pulse's Redis storage for metrics adds minimal overhead
- Custom Prometheus metric collection should use pull (scrape) over push
- Monitoring should not significantly impact the monitored system—<1% overhead target

## Security Considerations
- `/apps/{appId}/connections` endpoint is unauthenticated by default (protected only by allowed_origins)
- Ensure monitoring endpoints are not exposed to the public internet
- Pulse dashboards containing Reverb metrics should require authentication

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Only monitoring HTTP metrics | Ignoring WebSocket-specific metrics | Traditional monitoring mindset | Missed disconnection storms | Monitor connections, messages, auth failures |
| pulse:check not on Reverb server | Pulse shows no Reverb data | Running pulse:check on app server only | Empty Reverb monitoring card | Run pulse:check on the Reverb server |
| No authentication for metrics endpoint | `/apps/{appId}/connections` publicly accessible | Default config not changed | Anyone can see connection counts | Restrict access via allowed_origins or firewall |
| Confusing clients and connections | One user may have multiple tabs | Not distinguishing metrics | Inaccurate capacity planning | Track both unique clients and total connections |
| Assuming connection count is sufficient | Missing message rate, auth failures, memory | Narrow monitoring scope | Blind to critical issues | Monitor all categories: connections, messages, errors, resources |

## Anti-Patterns
- **No alerting on connection anomalies**: Without alerts, a crash or reconnection storm goes undetected until user complaints
- **Setting alerts without proper thresholds**: False alerts during rolling deployments cause alert fatigue; account for planned connection drops
- **Not monitoring Redis pub/sub subscriber count**: This is the indicator of Reverb-to-Redis connectivity health

## Examples

### Laravel Pulse Reverb card configuration
```php
// config/pulse.php
'recorders' => [
    \Laravel\Pulse\Recorders\ReverbConnections::class => [
        'enabled' => env('PULSE_REVERB_ENABLED', true),
    ],
],
```

### External monitoring health check
```bash
# Poll connection count
curl -s https://ws.example.com/apps/123456/connections | jq '.connections'
```

## Related Topics
- K05: Reverb Connection Lifecycle & State Management
- K21: Laravel Pulse Monitoring
- K34: Redis Dependency & Failure Modes
- K27: Supervisor & Production Process Management

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- As of 2026, Reverb monitoring is primarily through Laravel Pulse
- Custom Prometheus integration requires building middleware or a periodic job
- Key differentiator from Soketi: Soketi has built-in Prometheus endpoint; Reverb relies on Pulse

## Verification
- [ ] Laravel Pulse configured with Reverb card enabled
- [ ] `pulse:check` running on the Reverb server
- [ ] `/apps/{appId}/connections` monitored (polling interval 5-10s)
- [ ] Event loop lag monitoring implemented
- [ ] Alerts configured for: connection drop >10%, memory >80%, event loop lag >500ms
- [ ] Redis pub/sub subscriber count monitored
- [ ] Reverb logs aggregated via log management system
- [ ] Dashboards created for connections, messages, errors, resources
