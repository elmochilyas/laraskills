# Standardized Knowledge: FPM Status Page Monitoring

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | FPM Status Page Monitoring |
| Difficulty | Intermediate |
| Lifecycle | Monitor, Diagnose |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP-FPM's built-in status page provides real-time pool health metrics. The critical indicators: **active processes** (should be < max_children), **max children reached** (should be 0 — if >0, pool saturation has occurred), **listen queue** (should be 0 — if >0, requests are waiting for workers). The status page is the first place to check when diagnosing 502 errors or performance degradation.

## Core Concepts

- **Enable via**: `pm.status_path=/fpm-status` in pool config. Access via web: `curl http://localhost/fpm-status`.
- **Key metrics**: `pool`, `process manager`, `start time`, `start since`, `accepted conn`, `listen queue`, `max listen queue`, `listen queue len`, `idle processes`, `active processes`, `total processes`, `max active processes`, `max children reached`, `slow requests`.
- **listen queue > 0**: Earliest indicator of pool saturation. Requests are waiting because all workers are busy. Increase max_children, optimize slow code, or scale horizontally.
- **max children reached**: Incremented every time all children are busy and a new request arrives. If increasing over time, the pool has been saturated. Immediate action required.

## When To Use

- Always-on monitoring for every PHP-FPM deployment
- First diagnostic step when investigating 502 errors or latency degradation
- Capacity planning validation after configuration changes
- Real-time troubleshooting during incidents

## When NOT To Use

- When PHP-FPM is not the runtime (Octane with Swoole/RoadRunner/FrankenPHP)
- As a substitute for APM or profiling (status page shows pool health, not code-level issues)
- When the status page is exposed publicly (always restrict access)

## Best Practices (WHY)

- **Scrape every 10s into monitoring**: Prometheus, Datadog, or custom scripts. Alert on critical thresholds.
- **Alert on listen_queue > 0 for >30s**: Indicates sustained pool saturation. Immediate investigation required.
- **Alert on max_children_reached increasing**: Pool has been saturated at some point. Track the rate of increase.
- **Alert on active_processes = max_children for >10s**: Pool is fully utilized. Any additional traffic causes queuing.

## Architecture Guidelines

- **Monitor-then-size workflow**: 1) Enable FPM status page, 2) Measure average and P95 worker RSS under peak load, 3) Calculate max_children, 4) Set pm.max_children, 5) Verify listen queue stays at 0 under peak.
- The status page can output in HTML, XML, JSON, or full JSON formats.
- Protect the status page with firewall rules (localhost-only) — not application authentication.

## Performance

- Accessing the status page has negligible overhead (<1ms)
- Scraping every 10s adds no measurable load
- JSON format is preferred for automated scraping (parsing efficiency)
- Full JSON format includes additional details (script, request URI, CPU, memory per worker)

## Security

- Status page reveals internal metrics — restrict to localhost or internal network
- Never expose the status page on public endpoints
- Use firewall rules, not application authentication, to protect it
- Full JSON format includes request URIs — may expose sensitive paths

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not enabling the status page | Default config, unawareness | No visibility into pool health | Enable pm.status_path in pool config |
| Exposing status page publicly | Misconfiguration | Information disclosure, DoS target | Bind to localhost; firewall access |
| Not monitoring listen queue | Only checking active processes | Miss earliest saturation signal | Alert on listen_queue > 0 immediately |
| Ignoring max_children_reached | Metric not tracked | Unnoticed pool saturation events | Track the rate of max_children_reached increments |

## Anti-Patterns

- **Monitoring only active processes**: Listen queue is the earliest indicator of saturation. Active processes = max_children is already too late.
- **Using application authentication for the status page**: The status page must be accessible without session/auth for monitoring. Use firewall rules.
- **Not scraping the status page**: Manual checks miss intermittent saturation events. Automate scraping into monitoring.

## Examples

```bash
# Access status page (JSON format)
curl http://localhost/fpm-status?json

# Access full status page (per-worker details)
curl http://localhost/fpm-status?full&json

# Parse listen queue metric
curl -s http://localhost/fpm-status?json | python3 -c "import sys,json; d=json.load(sys.stdin); print('Listen queue:', d['listen queue'])"
```

## Related Topics

- Pool Sizing Formula
- PM Max Children P95 Calculation
- Slow Log Configuration
- Capacity Planning Safety Margins
- FPM Monitoring and Alerting

## AI Agent Notes

- The FPM status page is the first place to check when diagnosing 502 errors.
- listen_queue > 0 is the earliest indicator of pool saturation.
- max_children_reached > 0 means pool saturation has occurred.
- Scrape every 10s into monitoring; alert on critical thresholds.
- Protect the status page with firewall rules — not application auth.

## Verification

- [ ] pm.status_path configured in pool config
- [ ] Status page accessible from monitoring system
- [ ] Status page restricted to localhost/internal network
- [ ] listen queue metric scraped and monitored
- [ ] Alert configured for listen_queue > 0 for >30s
- [ ] Alert configured for max_children_reached increasing
- [ ] Status page data used for capacity planning decisions
