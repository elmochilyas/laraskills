# Skill: Configure and Analyze the FPM Status Page

## Purpose

Enable the PHP-FPM status page and use its metrics (active processes, idle processes, queue length, request duration) to monitor pool health and diagnose issues.

## When To Use

- Monitoring PHP-FPM pool health
- Diagnosing 502/504 errors from worker exhaustion
- Tuning pm settings based on real-time metrics
- Capacity planning validation

## When NOT To Use

- For Octane or alternative runtimes (they do not use FPM)
- When the status page would be publicly accessible without protection
- Without understanding the fields displayed

## Prerequisites

- PHP-FPM configured and running
- Access to FPM pool configuration
- Web server configuration for the status page route

## Inputs

- FPM pool configuration (pm mode, max_children)
- Access to pm.status_path in pool configuration
- Monitoring system integration (Prometheus, Datadog, etc.)

## Workflow (numbered steps)

1. Enable the status page: set `pm.status_path = /status` in the FPM pool configuration
2. Configure the web server to route `/status` to the FPM socket/address
3. Restart PHP-FPM and web server
4. Access the status page: `curl http://localhost/status?full` for full details
5. Key metrics to monitor: `active processes`, `total processes`, `idle processes`, `max active processes`, `queue length`, `max children reached`, `slow requests`
6. If `max children reached` > 0: the pool hit max_children — consider increasing max_children or optimizing request duration
7. If `queue length` is consistently > 0: workers are backlogged — increase workers or optimize request time
8. If `idle processes` is consistently high: too many workers allocated — reduce max_children for memory efficiency
9. If `active processes` consistently equals max_children: pool is saturated — investigate or scale
10. Integrate these metrics into the monitoring dashboard and set alerts

## Validation Checklist

- [ ] pm.status_path configured in FPM pool
- [ ] Web server routes /status to FPM
- [ ] Status page accessible (protected)
- [ ] Key metrics identified for monitoring
- [ ] Alerts set for max_children_reached, queue_length > 0
- [ ] Metrics integrated into monitoring dashboard
- [ ] Status page access secured (internal network)

## Common Failures

- **Exposing status page publicly**: The status page reveals pool configuration and request counts — restrict to internal network
- **Not enabling the full status page**: `?full` parameter provides per-worker details needed for root cause analysis
- **Monitoring only active processes**: Queue length is equally important — it shows pending work before it becomes an error
- **Ignoring max_children_reached**: This counter increments when a request cannot be served — even once is significant

## Decision Points

- max_children_reached > 0: increase max_children or optimize request duration
- queue consistently > 0: increase workers (if I/O-bound) or optimize application (if CPU-bound)
- idle > max_children * 0.5: too many workers for current traffic — reduce max_children
- active = max_children: pool is saturated — investigate before it causes errors
- slow requests increasing: enable slow log to identify sluggish endpoints

## Performance Considerations

- Status page request overhead: < 1ms — negligible
- Query string parameters: `?full` (per-worker details), `?html` (HTML output), `?json` (JSON output)
- The status page shows current state — use it for real-time monitoring, not historical analysis
- Integrate with Prometheus exporter (php-fpm-exporter) for trend analysis

## Security Considerations

- Status page must be protected — internal network only, or HTTP authentication
- The `?full` parameter shows script paths — may reveal application structure
- Max children reached = 0 is a good security baseline (zero means no capacity failures)
- Queue length > 0 may indicate a slow loris attack or legitimate traffic spike

## Related Rules (from 05-rules.md)

- Enable FPM Status Page for Monitoring
- Never Expose Status Page Publicly
- Monitor max_children_reached Actively

## Related Skills

- Capacity Planning and Safety Margins
- Slow Log Configuration and Analysis
- Request Timeout Configuration

## Success Criteria

- FPM status page enabled and protected
- Key metrics (active, idle, queue, max_children_reached) monitored
- Alerts configured for pool saturation conditions
- Metrics integrated into production dashboard
- Status page access documented
