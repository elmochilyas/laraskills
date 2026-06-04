## Always Configure `activity_timeout` and `ping_interval` Appropriately
---
## Performance
---
Always tune Reverb's `activity_timeout` and `ping_interval` based on your application's connection patterns.
---
Defaults (30s/60s) work for many applications, but high-churn connections need shorter intervals to detect dead connections quickly, while stable long-lived connections benefit from longer intervals to reduce heartbeat traffic.
---
```env
# Default — may not match connection pattern
REVERB_ACTIVITY_TIMEOUT=30
REVERB_PING_INTERVAL=60
```
---
```env
# Mobile app with frequent disconnections — faster detection
REVERB_ACTIVITY_TIMEOUT=15
REVERB_PING_INTERVAL=30
# Stable dashboard — reduce heartbeat traffic
REVERB_ACTIVITY_TIMEOUT=60
REVERB_PING_INTERVAL=120
```
---
No common exceptions; tuning should match your specific use case.
---
Slow dead connection detection; or excessive heartbeat traffic.

## Always Enable Pulse on the Reverb Server
---
## Maintainability
---
Always run `pulse:check` on the Reverb server itself to collect connection lifecycle metrics.
---
Pulse's Reverb card reads Reverb's internal connection state. Running `pulse:check` on a different server leaves the Reverb card empty and provides no connection visibility.
---
```bash
# pulse:check running on app server only — Reverb card empty
```
```bash
# pulse:check on Reverb server
php artisan pulse:check  # Connection metrics collected
```
---
No common exceptions; Pulse must run on the Reverb server for Reverb metrics.
---
Empty Pulse Reverb card; no connection lifecycle visibility.

## Always Configure `max_connections_per_ip`
---
## Security
---
Always set a per-IP connection limit to prevent connection exhaustion from a single source.
---
Without per-IP limits, a single compromised client, NAT gateway, or DoS attack can consume all available file descriptors and prevent other users from connecting.
---
```php
// config/reverb.php
'max_connections_per_ip' => -1, // Unlimited — DoS vulnerability
```
---
```php
'max_connections_per_ip' => 100, // Prevent single-source exhaustion
```
---
Trusted internal networks. No common exceptions for public-facing apps.
---
Connection exhaustion; single-source DoS; service unavailability.

## Always Set `max_message_size` to Prevent Payload Abuse
---
## Security
---
Always configure `max_message_size` in Reverb to limit the maximum WebSocket message payload.
---
Without limits, a compromised client can send arbitrarily large messages, consuming memory on the Reverb server and all connected clients that receive the broadcast.
---
```php
'max_message_size' => 0 // Unlimited — memory exhaustion risk
```
---
```php
'max_message_size' => 10000 // 10KB — reasonable default
```
---
No common exceptions; message size limits prevent resource exhaustion.
---
Memory exhaustion; OOM kills; DoS via oversized messages.

## Always Install `ext-uv` or `ext-event` for High-Connection Deployments
---
## Performance
---
Always install the `ext-uv` or `ext-event` PHP extension for deployments exceeding 1024 concurrent connections.
---
Without these extensions, Reverb falls back to PHP's `stream_select` engine, which is limited to 1024 concurrent connections due to OS file descriptor constraints in `select()`.
---
```bash
# No ext-uv — limited to 1024 connections
php -m | grep uv  # (empty)
```
---
```bash
pecl install uv
php -m | grep uv  # "uv" — 10k+ connections supported
```
---
Deployments under 1024 concurrent connections. No common exceptions for larger scale.
---
Connection limit at 1024; rejected connections; capacity ceiling.

## Always Monitor the `/apps/{appId}/connections` Endpoint
---
## Maintainability
---
Always poll the Reverb connections endpoint regularly for health check and capacity monitoring.
---
Without connection count monitoring, you cannot detect connection anomalies, track growth trends, or verify that load balancing distributes connections evenly.
---
```bash
# No health checks — blind to connection health
```
```bash
# Poll every 10 seconds for health monitoring
while true; do
    curl -s https://ws.example.com/apps/123/connections | jq '.connections'
    sleep 10
done
```
---
No common exceptions; connection monitoring is a production requirement.
---
Blind to anomalies; no capacity planning data; undetected outages.
