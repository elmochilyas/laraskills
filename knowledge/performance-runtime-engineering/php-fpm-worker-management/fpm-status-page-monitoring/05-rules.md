## Always enable the FPM status page in every production pool configuration
---
Category: Monitoring
---
Configure pm.status_path in every production PHP-FPM pool to expose real-time health metrics via a dedicated endpoint.
---
Reason: Without the status page, pool health is invisible. Key metrics like listen queue depth, active processes, and max_children_reached are only available through this built-in interface. The monitoring overhead is negligible (<1ms per request), making the cost of not enabling it — blind operation — far greater.
---
Bad Example:
```ini
; Status page not configured — operating blind
; pm.status_path not set (default: disabled)
```

Good Example:
```ini
; Status page enabled
pm.status_path = /fpm-status
```
---
Exceptions: Non-FPM runtimes (Octane, FrankenPHP, Swoole, RoadRunner) have their own monitoring interfaces and do not use the FPM status page.
---
Consequences Of Violation: No visibility into pool saturation, delayed incident detection, inability to correlate configuration changes with pool health.

## Alert on listen queue > 0 sustained for more than 30 seconds
---
Category: Monitoring
---
Configure monitoring to alert when the FPM status page reports a listen queue greater than 0 for 30 consecutive seconds.
---
Reason: Listen queue > 0 means requests are waiting for an available worker — the pool is saturated. Brief spikes (1-5s) are normal during traffic bursts, but sustained queuing for 30+ seconds indicates the pool is persistently undersized and users are experiencing increased latency.
---
Bad Example:
```bash
# Alerting only on active processes = max_children — too late
if active == max_children:
    alert("Pool fully saturated") # Requests already queued for minutes
```

Good Example:
```bash
# Alerting on listen queue — early detection
if listen_queue > 0 for 30s:
    alert("Pool saturation imminent") # Time to react before user impact
```
---
Exceptions: Applications with auto-scaling that resolves listen queue within 30 seconds may set a higher threshold (60s).
---
Consequences Of Violation: Delayed detection of pool saturation, prolonged user-facing latency, potential 502 errors from request timeouts.

## Scrape the FPM status page every 10 seconds into monitoring
---
Category: Maintainability
---
Configure a monitoring agent to fetch the FPM status page in JSON format at 10-second intervals and store metrics in Prometheus, Datadog, or equivalent.
---
Reason: 10-second granularity captures traffic bursts and saturation events that longer intervals miss. Without automated scraping, intermittent saturation goes undetected between manual checks. The JSON format minimizes parsing overhead. The 10-second interval adds no measurable server load (status page response is <1ms).
---
Bad Example:
```bash
# Manual checks only — intermittent issues missed entirely
# No automated scraping configured
```

Good Example:
```yaml
# Prometheus scrape config
scrape_configs:
  - job_name: 'php-fpm'
    scrape_interval: 10s
    metrics_path: '/fpm-status'
    params:
      format: ['json']
```
---
Exceptions: Environments without monitoring infrastructure may use log-based collection from FPM slow log as a fallback.
---
Consequences Of Violation: Missed intermittent saturation events, inability to trend pool health over time, reactive rather than proactive incident response.

## Never expose the FPM status page on public endpoints
---
Category: Security
---
Bind the FPM status page to localhost or an internal network interface and restrict access with firewall rules — never use application-layer authentication.
---
Reason: The status page reveals internal pool metrics (active processes, request URIs, worker memory) that aid attackers in understanding the application's resource profile and traffic patterns. Authentication at the application layer is unreliable — the status page must be accessible without session validation for monitoring systems to scrape it.
---
Bad Example:
```nginx
# Exposed to the internet — never do this
location /fpm-status {
    access_log off;
    # No IP restriction — anyone can access
}
```

Good Example:
```nginx
# Restricted to localhost only
location /fpm-status {
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```
---
Exceptions: Internal monitoring networks may extend access to specific monitoring server IPs, but never to the public internet.
---
Consequences Of Violation: Information disclosure (pool metrics, request URIs), potential DoS amplification, easier reconnaissance for attackers.

## Track max_children_reached as a critical pool saturation metric
---
Category: Monitoring
---
Monitor the max_children_reached counter from the FPM status page and alert when it increases between monitoring intervals.
---
Reason: max_children_reached increments every time all children are busy and a new request arrives. Unlike listen queue (which may resolve quickly), this counter permanently records that saturation occurred. A continuously increasing counter means the pool is regularly saturated — the pool needs resizing even if the listen queue clears between bursts.
---
Bad Example:
```bash
# Only monitoring listen queue — missing historical saturation
# Listen queue is 0 now, but max_children_reached has increased 500 times today
```

Good Example:
```bash
# Tracking max_children_reached over time
prev = get_metric("max_children_reached")
current = get_metric("max_children_reached")
if current > prev:
    alert("Pool saturation events detected — investigate capacity")
```
---
Exceptions: None. This metric should always be tracked alongside listen queue for complete pool health visibility.
---
Consequences Of Violation: Missed intermittent saturation, false sense of security when listen queue shows zero, delayed capacity upgrades.
