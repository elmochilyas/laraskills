## Always Configure `SOKETI_DEFAULT_APP_*` Environment Variables
---
## Framework Usage
---
Always set `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, and `SOKETI_DEFAULT_APP_SECRET` environment variables for Soketi.
---
Without default app credentials, Soketi has no authentication configured, and clients cannot connect. Connection attempts are rejected with authentication errors.
---
```yaml
# Missing credentials — clients cannot connect
environment:
  SOKETI_DEBUG: 'false'
```
---
```yaml
environment:
  SOKETI_DEFAULT_APP_ID: my-app-id
  SOKETI_DEFAULT_APP_KEY: my-app-key
  SOKETI_DEFAULT_APP_SECRET: my-app-secret
```
---
No common exceptions; app credentials are required for Soketi connections.
---
Authentication failures; clients cannot establish WebSocket connections.

## Always Deploy Soketi Behind Nginx Reverse Proxy
---
## Architecture
---
Always use Nginx as a reverse proxy in front of Soketi for TLS termination and domain routing.
---
Soketi does not handle TLS natively. Without Nginx, clients connect over plain `ws://`, transmitting all real-time data unencrypted.
---
```yaml
ports:
  - "6001:6001" # Direct exposure — no TLS
```
---
```nginx
# Nginx terminates TLS, proxies to Soketi
server {
    listen 443 ssl;
    location / {
        proxy_pass http://127.0.0.1:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```
---
Local development environments. No common exceptions for production.
---
Unencrypted WebSocket traffic; MITM vulnerability.

## Always Update `config/broadcasting.php` with Soketi Host
---
## Framework Usage
---
Always set the correct `options.host` in `config/broadcasting.php` to point to the Soketi server.
---
Without updating the broadcast configuration, Laravel sends events to Pusher's servers instead of Soketi. Broadcasting silently goes to the wrong destination.
---
```php
'options' => [
    // Defaults to api.pusherapp.com — events go to Pusher
],
```
---
```php
'options' => [
    'host' => env('PUSHER_HOST', '127.0.0.1'),
    'port' => env('PUSHER_PORT', 6001),
    'scheme' => env('PUSHER_SCHEME', 'http'),
],
```
---
No common exceptions; the host must be configured to point to Soketi.
---
Events sent to Pusher instead of Soketi; broadcasting non-functional.

## Always Configure Rate Limits on Soketi
---
## Security
---
Always set `SOKETI_GLOBAL_RATE_LIMIT` and per-channel rate limits to prevent abuse.
---
Without rate limits, a single client can flood the server with messages, degrading performance for all users and potentially exhausting resources.
---
```yaml
# No rate limits — abuse vulnerability
```
```yaml
environment:
  SOKETI_GLOBAL_RATE_LIMIT: 100
  SOKETI_RATE_LIMIT: 50
```
---
Trusted internal networks with known client behavior. No common exceptions.
---
Message flood abuse; resource exhaustion; degraded performance.

## Always Use Redis Adapter for Multi-Instance Soketi Deployments
---
## Scalability
---
Always configure the Redis (or NATS) adapter for Soketi when running multiple instances behind a load balancer.
---
The default in-memory adapter keeps subscription state local to each instance. Without a shared adapter, clients reconnecting to different instances lose their subscriptions.
---
```yaml
# In-memory adapter — state isolated per instance
```
```yaml
environment:
  SOKETI_ADAPTER_DRIVER: redis
  SOKETI_REDIS_HOST: 10.0.0.10
```
---
Single-instance deployments. No common exceptions for multi-instance.
---
Lost subscriptions; broken private channels across instances.

## Always Use a Process Manager for Soketi
---
## Reliability
---
Always use Supervisor or container orchestration to manage the Soketi process.
---
Soketi is a long-running Node.js process that can crash due to uncaught exceptions or memory issues. Without process management, a crash causes complete real-time downtime until manually restarted.
---
```bash
# Direct npm start — no recovery on crash
soketi start
```
```ini
# Supervisor manages Soketi
[program:soketi]
command=soketi start
autorestart=true
```
---
Containerized environments with orchestration. No common exceptions for VM deployments.
---
Complete real-time downtime on crash; manual recovery required.

## Never Use Soketi Without `allowed_origins` Configuration
---
## Security
---
Always configure allowed origins for Soketi to prevent CSWSH attacks.
---
Without origin validation, any website can open a WebSocket connection to Soketi using a victim's cookies, enabling Cross-Site WebSocket Hijacking.
---
```yaml
# No origin validation — CSWSH vulnerability
```
```yaml
environment:
  SOKETI_ALLOWED_ORIGINS: https://example.com
```
---
No common exceptions; origin validation is required for CSWSH prevention.
---
CSWSH vulnerability; unauthorized channel subscriptions.
