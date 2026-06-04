# Standardized Knowledge: Octane Interop with Reverb

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Security |
| Knowledge Unit ID | K26 |
| Title | Octane Interop with Reverb |
| Difficulty | Advanced |
| Dependencies | K03, K27, K34, K37 |

## Overview
Laravel Octane (running on Swoole, RoadRunner, or FrankenPHP) can coexist with Reverb, but they serve different roles and run in separate processes. Octane boots the Laravel application once and keeps it in memory for sub-50ms HTTP response times. Reverb is a ReactPHP-based WebSocket server that runs independently. They can share server infrastructure but operate on different ports and process management. FrankenPHP provides a unique hybrid mode where the same binary serves both HTTP and WebSocket.

## Core Concepts
- Octane accelerates HTTP request handling by keeping the application booted in memory between requests
- Reverb manages long-lived WebSocket connections via an event loop
- They run as separate processes with separate lifecycles
- Broadcast events on Octane-served applications work identically: `ShouldBroadcast` events are dispatched and queued
- FrankenPHP can embed Reverb directly within the Caddy server, running both HTTP and WebSocket in the same process

## When To Use
- High-performance Laravel deployments using both Octane (HTTP) and Reverb (WebSocket)
- FrankenPHP users wanting integrated HTTP + WebSocket from a single binary
- Applications needing sub-50ms HTTP response times alongside real-time broadcasting

## When NOT To Use
- Standard PHP-FPM deployments (Octane adds unnecessary complexity)
- Applications not needing HTTP acceleration (Octane's benefits are HTTP-specific)
- Simple deployments where performance requirements are modest

## Best Practices (Why)
- **Run as separate Supervisor programs**: Octane and Reverb are independent processes; manage them separately with distinct memory limits
- **Verify broadcast event serialization under Octane**: Octane's persistent memory means event objects may retain stale references; closures are serialized differently
- **Test Octane sandboxing compatibility**: Octane's `Sandbox` resets static state; verify it doesn't affect broadcast event dispatch
- **Monitor combined memory usage**: Octane workers + Reverb connections share the same PHP memory pool; size server RAM accordingly

## Architecture Guidelines
- Octane does not replace Reverb—they solve different problems (HTTP acceleration vs. WebSocket server)
- Queue workers are still needed; Octane does not change the broadcasting pipeline
- For FrankenPHP deployments, ensure the embedded Reverb version is patched (v1.7.0+) for CVE-2026-23524
- Standard broadcasting code (events, channels, Echo) does not change for Octane compatibility

## Performance Considerations
- Octane reduces HTTP response latency (including broadcast dispatch) to sub-50ms
- Broadcasting through Octane: event dispatch is faster, but queue processing remains unchanged
- FrankenPHP hybrid mode may reduce Redis pub/sub latency by keeping Reverb and app in the same process
- No direct performance conflict; both can run optimally on the same server with adequate resources

## Security Considerations
- Octane's persistent memory could retain sensitive data across requests; ensure proper sandboxing
- FrankenPHP's embedded Reverb must be patched for CVE-2026-23524
- Both services should run under separate users with minimal privileges

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Assuming Octane replaces Reverb | Expecting Octane to handle WebSocket | Misunderstanding their roles | No real-time functionality | Run Octane for HTTP, Reverb for WebSocket |
| Expecting Octane to accelerate WebSocket | Octane only accelerates HTTP; WebSocket delivery handled by Reverb | Confusing HTTP and WebSocket | No performance benefit for real-time | Understand they serve different concerns |
| No testing broadcast events under Octane | Serialization issues under persistent memory | Assuming identical behavior | Production failures | Test before deploying to production |
| Not verifying FrankenPHP version compatibility | Embedded Reverb may be outdated | Forgetting to check | CVE exposure | Verify Reverb version in FrankenPHP |

## Anti-Patterns
- **Using Octane features inside broadcast event constructors**: `Octane::concurrently()` may cause unexpected behavior in event serialization
- **Assuming Octane accelerates queue processing**: Octane accelerates HTTP only; queue workers run independently
- **Running Octane and Reverb without separate memory monitoring**: Combined memory pressure can cause OOM kills

## Examples

### Supervisor config for Octane + Reverb
```ini
[program:octane]
command=php /path/to/artisan octane:start --server=swoole --host=127.0.0.1 --port=8000
user=forge
autostart=true
autorestart=true
stopwaitsecs=60

[program:reverb]
command=php /path/to/artisan reverb:start --host=127.0.0.1 --port=8080
user=forge
autostart=true
autorestart=true
stopwaitsecs=60
```

## Related Topics
- K03: Reverb Installation & Configuration
- K27: Supervisor & Production Process Management
- K34: Redis Dependency & Failure Modes
- K37: Reverb Monitoring Metrics

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- The primary integration risk is at the operator level, not the framework level
- FrankenPHP is the only architecture where HTTP and WebSocket share the same process space
- Octane + Reverb is a common production architecture for high-traffic Laravel applications

## Verification
- [ ] Octane and Reverb run as separate Supervisor programs
- [ ] Broadcast events tested under Octane before production
- [ ] Octane sandboxing confirmed compatible with broadcast dispatch
- [ ] Memory limits configured for both services
- [ ] FrankenPHP embedded Reverb version verified (v1.7.0+)
- [ ] Standard broadcasting code confirmed working (no Octane-specific changes needed)
