## Always Set Up Laravel Pulse with the Reverb Card
---
## Maintainability
---
Always configure Laravel Pulse with the `ReverbConnections` recorder enabled on the Reverb server.
---
Without Pulse, connection metrics are invisible. You cannot detect connection anomalies, growth trends, or reconnection storms until users report problems.
---
```php
// Pulse Reverb card not configured — blind to connection metrics
```
```php
// config/pulse.php
'recorders' => [
    \Laravel\Pulse\Recorders\ReverbConnections::class => [
        'enabled' => env('PULSE_REVERB_ENABLED', true),
    ],
],
```
---
Development environments. No common exceptions for production.
---
Blind to connection anomalies; undetected storms; no capacity planning data.

## Always Monitor All Four Metric Categories
---
## Maintainability
---
Always monitor connections, messages, errors, and resources — not just connection count.
---
Only monitoring connections misses critical signals: message rate indicates system usage, error rate indicates problems, and resource usage indicates capacity constraints.
---
```bash
# Only connection count — blind to other dimensions
```
```bash
# Four categories:
# Connections: active, rate, peak
# Messages: per-second, size distribution
# Errors: auth failures, disconnection reasons, protocol errors
# Resources: memory, CPU, event loop lag, file descriptors
```
---
Development environments. No common exceptions for production.
---
Missed failure signals; delayed incident detection.

## Always Run `pulse:check` on the Reverb Server
---
## Framework Usage
---
Always run the `pulse:check` daemon on the Reverb server itself, not just on application servers.
---
Pulse's Reverb card collects metrics by reading Reverb's internal state. If `pulse:check` runs on a different server, it cannot access Reverb's connection data and the card remains empty.
---
```bash
# pulse:check on app server only — Reverb card empty
```
```bash
# pulse:check on the Reverb server
$schedule->command('pulse:check')->everyTenSeconds();
```
---
No common exceptions; `pulse:check` must run on the same server as Reverb.
---
Empty Reverb monitoring card; no connection metrics.

## Always Alert on Connection Anomalies
---
## Reliability
---
Always set alerts for sudden connection drops (>10% in 1 minute) and sustained high memory usage (>80%).
---
Sudden drops signal crashes or network partitions. Without alerts, real-time features silently degrade until users report widespread issues.
---
```bash
# No alerts — silent degradation
```
```bash
# Alert thresholds
connection_drop_rate > 10% in 1m  # Crash detection
memory_usage > 80%              # Capacity warning
event_loop_lag > 500ms          # Performance degradation
```
---
Development environments. No common exceptions for production.
---
Silent degradation; delayed incident response; user-reported outages.

## Always Monitor Redis Pub/Sub Subscriber Count
---
## Maintainability
---
Always track the number of Redis pub/sub subscribers as a health indicator for Reverb-Redis connectivity.
---
The subscriber count directly indicates how many Reverb instances are connected and receiving broadcast events. A drop signals Reverb instances losing connection to Redis.
---
```bash
# Not monitored — Reverb-Redis health invisible
```
```bash
redis-cli -p 6380 pubsub numsub reverb-production
# Reverb instances should match subscriber count
```
---
No common exceptions; subscriber count is a critical health metric.
---
Undetected Reverb-Redis disconnection; broadcast drops.

## Always Secure the `/apps/{appId}/connections` Endpoint
---
## Security
---
Always restrict access to the Reverb connections endpoint via `allowed_origins` or firewall rules.
---
The `/apps/{appId}/connections` endpoint is unauthenticated by default. Without restriction, anyone can discover your connection counts and usage patterns.
---
```php
// config/reverb.php
'allowed_origins' => ['*'],  // Any domain can query connection counts
```
---
```php
'allowed_origins' => ['https://admin.example.com'],  // Restricted
```
---
No common exceptions; connection count endpoints should be restricted.
---
Information disclosure; competitive intelligence; recon data.
