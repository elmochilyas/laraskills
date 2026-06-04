# Metadata
Domain: Real-Time Systems
Subdomain: WebSocket Servers
Knowledge Unit: Reverb Installation & Configuration
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
Laravel Reverb is the first-party WebSocket server for Laravel, released as a first-party package in 2024 and now the default broadcasting backend. Installation is via `php artisan install:broadcasting`, which scaffolds the Reverb package, Laravel Echo, Pusher JS SDK, and configuration files. Reverb uses the Pusher wire protocol, making it compatible with all existing Echo-based frontend code. Configuration spans three layers: environment variables (`.env`), broadcast config (`config/broadcasting.php`), and Reverb-specific config (`config/reverb.php`). Key settings include app credentials (key, secret, app_id), server host/port, TLS options, scaling driver (Redis or Database), ping intervals, message size limits, and allowed origins. The server is started with `php artisan reverb:start`.

## Core Concepts
Reverb is a long-running PHP process built on ReactPHP's event loop (optional FrankenPHP engine). It does not run within the traditional PHP request-response lifecycle. The installation command publishes `config/reverb.php`, sets `BROADCAST_CONNECTION=reverb` in `.env`, and generates app credentials. The `REVERB_HOST` and `REVERB_PORT` control where clients connect; `REVERB_SERVER_HOST` and `REVERB_SERVER_PORT` control where the daemon listens internally (typically `127.0.0.1:8080`). Echo connects to Reverb using the Pusher protocol with the `reverb` broadcaster type.

## Mental Models
Reverb is a standalone WebSocket server daemon that sits alongside your Laravel application. Think of it as a dedicated "event relay" process—it receives events from Laravel (via the broadcast driver) and pushes them to connected browser clients. Your Laravel app handles HTTP, Reverb handles persistent WebSocket connections.

## Internal Mechanics
The `reverb:start` command bootstraps a ReactPHP event loop. ReactPHP's `stream_select` loop powers the default engine (limited to ~1024 open files). For higher connection counts, the `ext-uv` or `ext-event` PHP extensions provide scalable event loop backends. Reverb implements the Pusher protocol specification, handling WebSocket upgrade handshakes, channel subscriptions, event broadcasting, presence channel state, and client events. The internal architecture uses a `Server` class that manages connections, a `Pulse` system for state tracking, and a scaling driver (Redis or Database) for horizontal coordination. Activity timeout (default 30s) and ping interval (default 60s) manage connection health.

## Patterns
- **Pusher protocol compatibility**: Enables drop-in replacement for Pusher without frontend changes
- **Separate process architecture**: The HTTP server (Laravel/Nginx) and WebSocket server (Reverb) run independently
- **Config-driven app registration**: Multiple apps can be defined in `config/reverb.php` with per-app credentials and limits
- **Scaling driver abstraction**: Swap Redis for Database driver in Laravel 13+ without application code changes

## Architectural Decisions
- **ReactPHP over Swoole/RoadRunner**: Chosen for broad PHP compatibility (no extension required for basic use)
- **Pusher protocol over custom protocol**: Enables immediate compatibility with Echo and existing Pusher client libraries
- **Internal vs external port separation**: `REVERB_SERVER_PORT` for daemon listening; `REVERB_PORT` for client connections (typically behind Nginx)
- **Config-first app management**: Apps defined in config rather than database for simplicity, with optional provider pattern

## Tradeoffs
- **PHP process management**: Unlike Node.js WebSocket servers, Reverb requires Supervisor or systemd for process management
- **Event loop limitations**: `stream_select` caps at ~1024 connections without `ext-uv` or `ext-event`
- **Memory per connection**: Each WebSocket connection consumes PHP process memory; 10k connections require significant RAM
- **No native cluster mode**: Horizontal scaling requires external Redis or database coordination

## Performance Considerations
- Single Reverb instance handles 10k+ connections on 4-core/8GB server with `ext-uv`
- Without `ext-uv` or `ext-event`, `stream_select` limits to ~1024 concurrent connections
- Each connection consumes approximately 1-2 KB of overhead plus application memory for subscribed channels
- Pulse interval (default 15s) controls state write frequency—tune based on connection count
- Message size limit (`max_message_size`, default 10KB) prevents oversized payload abuse

## Production Considerations
- Always run Reverb behind Nginx reverse proxy for TLS termination
- Configure Supervisor to auto-restart Reverb on crash
- Set `allowed_origins` to prevent unauthorized WebSocket connections
- Tune `ping_interval` (60s default) and `activity_timeout` (30s default) for connection health
- Use `REVERB_SCALING_DRIVER=database` for single-server deployments (Laravel 13+); Redis for horizontal scaling
- Monitor with `php artisan reverb:status` and Laravel Pulse Reverb card

## Common Mistakes
- Setting `REVERB_HOST` to the public domain but `REVERB_SERVER_PORT` on the same port (causes port conflict)
- Forgetting to set `QUEUE_CONNECTION=sync` during development (broadcasts never fire)
- Running Reverb without a process manager (dies on SSH logout or crash)
- Not setting `allowed_origins` in production (any domain can connect)
- Using default app credentials in production (generated credentials should be unique per environment)

## Failure Modes
- **Port conflict**: Reverb fails to start if the configured port is already in use
- **Process death**: Reverb stops without Supervisor; all WebSocket connections drop
- **Connection leak**: PHP memory limit exceeded under high concurrent connection load
- **TLS misconfiguration**: Browser rejects WebSocket connection due to cert/port mismatch
- **Queue not running**: Events dispatched but never reach Reverb; clients see no updates

## Ecosystem Usage
- Default broadcasting backend for all Laravel starter kits since 2024
- Supported by Laravel Forge with one-click deployment recipe
- Managed Reverb available on Laravel Cloud (zero-infrastructure WebSocket hosting)
- Compatible with all Echo framework integrations (React, Vue, Svelte)
- Used with Nginx, Caddy, Traefik as reverse proxy

## Related Knowledge Units
- K04: Reverb Horizontal Scaling via Redis
- K05: Reverb Connection Lifecycle & State Management
- K27: Supervisor & Production Process Management
- K32: Nginx WebSocket Proxy Configuration
- K28: Laravel Cloud Managed WebSockets

## Research Notes
Reverb has 5.3M+ Composer downloads as of mid-2026. The `install:broadcasting` command was introduced in Laravel 11 and simplifies setup dramatically. Laravel 13 (2026) introduced the database scaling driver, removing Redis as a hard dependency for single-server deployments. CVE-2026-23524 (CVSS 9.8, insecure Redis deserialization) was fixed in Reverb v1.7.0—all installations should be on v1.7.0+. The FrankenPHP engine option provides alternative event loop via Caddy integration.
