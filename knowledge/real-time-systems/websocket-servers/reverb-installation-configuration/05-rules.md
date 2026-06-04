## Always Run Reverb Behind an Nginx Reverse Proxy
---
## Architecture
---
Always configure Nginx as a reverse proxy in front of Reverb for TLS termination and connection management.
---
Running Reverb exposed directly to the internet bypasses TLS encryption, exposes the ReactPHP process to direct attack, and prevents centralized connection management.
---
```env
REVERB_SERVER_HOST=0.0.0.0  # Direct exposure — no TLS, direct attack surface
```
---
```env
REVERB_SERVER_HOST=127.0.0.1  # Internal only
REVERB_SERVER_PORT=8080       # Nginx proxies external traffic
```
---
Local development environments. No common exceptions for production.
---
Missing TLS; direct attack surface; no centralized connection management.

## Always Configure Supervisor to Auto-Restart Reverb
---
## Reliability
---
Always use Supervisor (or systemd) to manage the Reverb process and auto-restart it on failure.
---
Reverb is a long-running process that can crash due to memory limits, uncaught exceptions, or port conflicts. Without a process manager, a crash causes complete real-time downtime until manually restarted.
---
```bash
# Manual start — stops on crash or SSH logout
php artisan reverb:start
```
```ini
# Supervisor — auto-restarts on failure
[program:reverb]
command=php /path/artisan reverb:start
autorestart=true
```
---
Containerized environments with orchestration (Kubernetes). No common exceptions for VM deployments.
---
Complete real-time downtime on crash; manual recovery required.

## Always Set `allowed_origins` in Production
---
## Security
---
Always configure a non-empty `allowed_origins` array in Reverb config for production deployments.
---
Without origin validation, any website can open a WebSocket connection to your Reverb server, enabling Cross-Site WebSocket Hijacking (CSWSH) attacks.
---
```php
// config/reverb.php
'allowed_origins' => [],  // No validation — any origin can connect
```
```php
'allowed_origins' => [
    'https://example.com',
    'https://admin.example.com',
],
```
---
No common exceptions; origin validation is required for CSWSH prevention.
---
CSWSH vulnerability; unauthorized channel subscriptions.

## Always Use Separate Internal and External Ports
---
## Framework Usage
---
Always use different values for `REVERB_HOST`/`REVERB_PORT` (external) and `REVERB_SERVER_HOST`/`REVERB_SERVER_PORT` (internal).
---
Using the same port for both creates port conflicts and exposes the internal daemon port directly to clients, breaking the Nginx proxy architecture.
---
```env
# Same port — port conflict
REVERB_PORT=8080
REVERB_SERVER_PORT=8080
```
```env
# Separate ports — clean separation
REVERB_PORT=443          # Client-facing via Nginx
REVERB_SERVER_PORT=8080  # Internal daemon
```
---
Single-server development setups. No common exceptions for production.
---
Port conflicts; architecture confusion; direct daemon exposure.

## Always Generate Unique Credentials Per Environment
---
## Security
---
Always generate unique `REVERB_APP_ID`, `REVERB_APP_KEY`, and `REVERB_APP_SECRET` per deployment environment.
---
Shared credentials across environments mean compromised development credentials can be used to connect to production Reverb. Each environment should be independently secure.
---
```env
# Same credentials everywhere — cross-environment access
REVERB_APP_KEY=dev-and-prod-key
```
```env
# Development
REVERB_APP_KEY=dev-key-abc
# Production
REVERB_APP_KEY=prod-key-xyz
```
---
No common exceptions; credentials must be unique per environment.
---
Cross-environment access; compromised dev credentials affect production.

## Always Verify Reverb Version After Composer Update
---
## Maintainability
---
Always run `composer show laravel/reverb` after updating to verify the intended version was installed.
---
Dependency constraints can resolve to an older version than expected, leaving the application vulnerable to known CVEs or missing important features.
---
```bash
composer require laravel/reverb:^1.7
# composer.lock may resolve to 1.6.5 due to other constraints
composer show laravel/reverb  # Verify actual installed version
```
---
No common exceptions; version verification prevents false confidence.
---
Unpatched vulnerabilities; missing features; false sense of security.
