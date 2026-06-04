# Standardized Knowledge: Reverb Installation & Configuration

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit ID | K03 |
| Title | Reverb Installation & Configuration |
| Difficulty | Foundation |
| Dependencies | K04, K05, K27, K32, K28 |

## Overview
Laravel Reverb is the first-party WebSocket server for Laravel, now the default broadcasting backend. Installation is via `php artisan install:broadcasting`, which scaffolds the Reverb package, Laravel Echo, Pusher JS SDK, and configuration files. Reverb uses the Pusher wire protocol, making it compatible with all existing Echo-based frontend code. Configuration spans three layers: environment variables (`.env`), broadcast config (`config/broadcasting.php`), and Reverb-specific config (`config/reverb.php`).

## Core Concepts
- Reverb is a long-running PHP process built on ReactPHP's event loop (optional FrankenPHP engine)
- It does not run within the traditional PHP request-response lifecycle
- `REVERB_HOST`/`REVERB_PORT` control where clients connect; `REVERB_SERVER_HOST`/`REVERB_SERVER_PORT` control internal daemon listening
- Echo connects to Reverb using the Pusher protocol with the `reverb` broadcaster type
- The `install:broadcasting` command sets `BROADCAST_CONNECTION=reverb` and generates app credentials

## When To Use
- Default choice for Laravel broadcasting since 2024 (replaces Pusher as default)
- Self-hosted WebSocket server for any Laravel application
- Applications needing Pusher protocol compatibility without third-party service costs

## When NOT To Use
- Applications already on managed services (Pusher, Ably) that don't want to self-host
- Laravel Cloud deployments (managed Reverb is provided automatically)
- Serverless Laravel (Vapor) where Reverb cannot run natively

## Best Practices (Why)
- **Always run behind Nginx reverse proxy**: Nginx handles TLS termination, domain routing, and connection management—Reverb receives plain WS internally
- **Configure Supervisor to auto-restart**: Reverb is a long-running process that crashes without a process manager; Supervisor ensures uptime
- **Set `allowed_origins` in production**: Prevents unauthorized domains from opening WebSocket connections
- **Tune `ping_interval` and `activity_timeout`**: Defaults (60s/30s) work for most deployments; adjust based on client reliability needs
- **Use unique app credentials per environment**: Do not reuse generated credentials across development, staging, and production

## Architecture Guidelines
- Reverb runs independently from the HTTP server (Laravel/Nginx) as a separate process
- Use internal vs. external port separation: Reverb daemon listens on internal port; Nginx proxies external connections
- Scaling driver abstraction: Redis for horizontal scaling, Database driver (Laravel 13+) for single-server
- Multiple apps can be defined in `config/reverb.php` with per-app credentials and limits

## Performance Considerations
- Single Reverb instance handles 10k+ connections on a 4-core/8GB server with `ext-uv`
- Without `ext-uv` or `ext-event`, `stream_select` limits to ~1024 concurrent connections
- Each connection consumes ~1-2 KB overhead plus application memory for subscribed channels
- `max_message_size` (default 10KB) prevents oversized payload abuse

## Security Considerations
- WSS is mandatory in production—configure TLS at Nginx, not in Reverb itself
- `allowed_origins` prevents CSWSH attacks by restricting which domains can connect
- App credentials should be treated as secrets; rotate if compromised
- Reverb v1.7.0+ fixes CVE-2026-23524 (critical Redis deserialization RCE)

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Port conflict | REVERB_HOST and REVERB_SERVER_PORT on same port | Not understanding internal/external port separation | Reverb fails to start | Use separate ports for client and server |
| QUEUE_CONNECTION=sync in production | Broadcasts never fire because they're synchronous | Development config left in production | No events delivered | Use proper queue driver (redis, database) |
| No process manager | Reverb dies on SSH logout or crash | Running with `php artisan reverb:start` directly | All connections drop | Use Supervisor or systemd |
| No allowed_origins | Any domain can connect | Production config not hardened | CSWSH vulnerability | Set explicit allowlist |
| Default credentials in production | Generated per-install credentials not updated | Skipping credential regeneration | Security risk, credential guessing | Generate unique credentials per environment |

## Anti-Patterns
- **Running Reverb without a reverse proxy**: Exposes the Reverb daemon directly to the internet; bypasses TLS termination
- **Binding Reverb to 0.0.0.0 without firewall**: Makes Reverb accessible from any network interface
- **Not verifying Reverb version after Composer update**: Dependency constraints may resolve to older, vulnerable versions

## Examples

### Installation command
```bash
php artisan install:broadcasting
# This scaffolds: Reverb, Laravel Echo, pusher-js, config files
```

### Reverb configuration (config/reverb.php)
```php
return [
    'apps' => [
        [
            'app_id' => env('REVERB_APP_ID'),
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'allowed_origins' => ['https://example.com'],
            'ping_interval' => env('REVERB_PING_INTERVAL', 60),
            'activity_timeout' => env('REVERB_ACTIVITY_TIMEOUT', 30),
            'max_message_size' => env('REVERB_MAX_MESSAGE_SIZE', 10000),
        ],
    ],
];
```

### Environment variables
```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
REVERB_HOST=ws.example.com
REVERB_PORT=443
REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8080
REVERB_SCALING_DRIVER=redis
```

## Related Topics
- K04: Reverb Horizontal Scaling via Redis
- K05: Reverb Connection Lifecycle & State Management
- K27: Supervisor & Production Process Management
- K32: Nginx WebSocket Proxy Configuration
- K28: Laravel Cloud Managed WebSockets

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Reverb has 5.3M+ Composer downloads as of mid-2026
- Laravel 13 introduced the database scaling driver, removing Redis as a hard dependency for single-server deployments
- CVE-2026-23524 fixed in v1.7.0—all installations should be on v1.7.0+

## Verification
- [ ] `php artisan install:broadcasting` completed
- [ ] Reverb configured in `config/reverb.php` with unique credentials
- [ ] `BROADCAST_CONNECTION=reverb` set in `.env`
- [ ] `allowed_origins` configured for production
- [ ] Reverb running behind Nginx reverse proxy
- [ ] Supervisor configured for Reverb process management
- [ ] `QUEUE_CONNECTION` set to proper queue driver
- [ ] Reverb version verified as v1.7.0+
