## Always Run Octane and Reverb as Separate Supervisor Programs
---
## Architecture
---
Always manage Octane (HTTP) and Reverb (WebSocket) as independent Supervisor programs with separate memory limits.
---
Octane and Reverb solve different problems and have different resource profiles. Running them as separate processes allows independent scaling, monitoring, and failure isolation.
---
```ini
[program:laravel]
command=php artisan octane:start && php artisan reverb:start // Combined — can't manage independently
```
---
```ini
[program:octane]
command=php artisan octane:start --port=8000

[program:reverb]
command=php artisan reverb:start --port=8080
```
---
FrankenPHP deployments where HTTP and WebSocket share the same binary. No common exceptions.
---
Inability to restart one service independently; resource contention.

## Never Assume Octane Replaces Reverb
---
## Architecture
---
Never assume Laravel Octane handles WebSocket connections or replaces the need for Reverb.
---
Octane accelerates HTTP request handling by keeping the application in memory. WebSocket connections are managed by Reverb's ReactPHP event loop, which is a completely separate concern.
---
```bash
php artisan octane:start  # Only accelerates HTTP — no WebSocket
# Developers assume real-time features now work
```
---
```bash
php artisan octane:start   # HTTP acceleration
php artisan reverb:start   # WebSocket server — both required
```
---
No common exceptions; both services are needed for accelerated HTTP + WebSocket.
---
Missing real-time functionality; confusion about service responsibilities.

## Always Test Broadcast Event Serialization Under Octane
---
## Testing
---
Always test broadcast event serialization and dispatching under Octane before deploying to production.
---
Octane's persistent memory model means event objects may retain stale references across requests. Closures and serialized models may behave differently than under PHP-FPM.
---
```php
// No Octane-specific testing — production surprises
```
```php
// Test with octane:start
public function test_broadcast_under_octane()
{
    $this->withoutMiddleware();
    $response = $this->post('/orders', [...]);
    // Verify broadcast event was queued correctly
}
```
---
PHP-FPM deployments. No common exceptions for Octane deployments.
---
Serialization errors; stale references; production-only broadcast failures.

## Always Monitor Combined Memory Usage
---
## Maintainability
---
Always monitor the combined memory footprint of Octane workers and Reverb connections on the same server.
---
Octane workers hold the application in memory permanently. Reverb connections add per-connection overhead. Together, they can exceed available RAM and trigger OOM kills.
---
```bash
# No combined monitoring — OOM risk undetected
```
```bash
# Monitor both services
total_used=$(free -m | awk '/Mem/{print $3}')
octane_workers=$(ps aux | grep octane | wc -l)
reverb_connections=$(curl -s /apps/123/connections | jq '.connections')
alert_if(total_used > max_ram * 0.8)
```
---
Servers with ample RAM headroom. No common exceptions.
---
OOM kills; both services going down simultaneously.

## Always Verify FrankenPHP's Embedded Reverb Version
---
## Security
---
Always verify that FrankenPHP's embedded Reverb is at v1.7.0+ when using FrankenPHP's hybrid HTTP+WebSocket mode.
---
FrankenPHP includes Reverb internally. If the embedded version is pre-1.7.0, the CVE-2026-23524 vulnerability applies even if the standalone Reverb package is updated.
---
```bash
# Assuming FrankenPHP includes patched Reverb
```
```bash
frankenphp version | grep reverb  # Check embedded version
# If pre-1.7.0, update FrankenPHP
```
---
Standalone Reverb deployments. No common exceptions for FrankenPHP.
---
Unpatched CVE; false sense of security.
