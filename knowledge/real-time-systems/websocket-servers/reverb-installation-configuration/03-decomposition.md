# Decomposition: Reverb Installation Configuration

## Topic Overview
Laravel Reverb is the first-party WebSocket server for Laravel, released as a first-party package in 2024 and now the default broadcasting backend. Installation is via `php artisan install:broadcasting`, which scaffolds the Reverb package, Laravel Echo, Pusher JS SDK, and configuration files. Reverb uses the Pusher wire protocol, making it compatible with all existing Echo-based frontend code. Configuration spans three layers: environment variables (`.env`), broadcast config (`config/broadcas...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
websocket-servers/K03-reverb-installation-configuration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Reverb Installation Configuration
- **Purpose:** Laravel Reverb is the first-party WebSocket server for Laravel, released as a first-party package in 2024 and now the default broadcasting backend. Installation is via `php artisan install:broadcasting`, which scaffolds the Reverb package, Laravel Echo, Pusher JS SDK, and configuration files. Reverb uses the Pusher wire protocol, making it compatible with all existing Echo-based frontend code. Configuration spans three layers: environment variables (`.env`), broadcast config (`config/broadcas...
- **Difficulty:** Foundation
- **Dependencies:
  - K04: Reverb Horizontal Scaling via Redis
  - K05: Reverb Connection Lifecycle & State Management
  - K27: Supervisor & Production Process Management
  - K32: Nginx WebSocket Proxy Configuration
  - K28: Laravel Cloud Managed WebSockets

## Dependency Graph
**Depends on:**
  - K04: Reverb Horizontal Scaling via Redis
  - K05: Reverb Connection Lifecycle & State Management
  - K27: Supervisor & Production Process Management
  - K32: Nginx WebSocket Proxy Configuration
  - K28: Laravel Cloud Managed WebSockets

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Pusher protocol compatibility**: Enables drop-in replacement for Pusher without frontend changes**Separate process architecture**: The HTTP server (Laravel/Nginx) and WebSocket server (Reverb) run independently**Config-driven app registration**: Multiple apps can be defined in `config/reverb.php` with per-app credentials and limits**Scaling driver abstraction**: Swap Redis for Database driver in Laravel 13+ without application code changes**ReactPHP over Swoole/RoadRunner**: Chosen for broad PHP compatibility (no extension required for basic use)**Pusher protocol over custom protocol**: Enables immediate compatibility with Echo and existing Pusher client libraries**Internal vs external port separation**: `REVERB_SERVER_PORT` for daemon listening; `REVERB_PORT` for client connections (typically behind Nginx)**Config-first app management**: Apps defined in config rather than database for simplicity, with optional provider pattern**PHP process management**: Unlike Node.js WebSocket servers, Reverb requires Supervisor or systemd for process management**Event loop limitations**: `stream_select` caps at ~1024 connections without `ext-uv` or `ext-event`**Memory per connection**: Each WebSocket connection consumes PHP process memory; 10k connections require significant RAM**No native cluster mode**: Horizontal scaling requires external Redis or database coordinationSingle Reverb instance handles 10k+ connections on 4-core/8GB server with `ext-uv`Without `ext-uv` or `ext-event`, `stream_select` limits to ~1024 concurrent connectionsEach connection consumes approximately 1-2 KB of overhead plus application memory for subscribed channelsPulse interval (default 15s) controls state write frequency—tune based on connection countMessage size limit (`max_message_size`, default 10KB) prevents oversized payload abuseAlways run Reverb behind Nginx reverse proxy for TLS terminationConfigure Supervisor to auto-restart Reverb on crashSet `allowed_origins` to prevent unauthorized WebSocket connectionsTune `ping_interval` (60s default) and `activity_timeout` (30s default) for connection healthUse `REVERB_SCALING_DRIVER=database` for single-server deployments (Laravel 13+); Redis for horizontal scalingMonitor with `php artisan reverb:status` and Laravel Pulse Reverb cardSetting `REVERB_HOST` to the public domain but `REVERB_SERVER_PORT` on the same port (causes port conflict)Forgetting to set `QUEUE_CONNECTION=sync` during development (broadcasts never fire)Running Reverb without a process manager (dies on SSH logout or crash)Not setting `allowed_origins` in production (any domain can connect)Using default app credentials in production (generated credentials should be unique per environment)**Port conflict**: Reverb fails to start if the configured port is already in use**Process death**: Reverb stops without Supervisor; all WebSocket connections drop**Connection leak**: PHP memory limit exceeded under high concurrent connection load**TLS misconfiguration**: Browser rejects WebSocket connection due to cert/port mismatch**Queue not running**: Events dispatched but never reach Reverb; clients see no updatesDefault broadcasting backend for all Laravel starter kits since 2024Supported by Laravel Forge with one-click deployment recipeManaged Reverb available on Laravel Cloud (zero-infrastructure WebSocket hosting)Compatible with all Echo framework integrations (React, Vue, Svelte)Used with Nginx, Caddy, Traefik as reverse proxyK04: Reverb Horizontal Scaling via RedisK05: Reverb Connection Lifecycle & State ManagementK27: Supervisor & Production Process ManagementK32: Nginx WebSocket Proxy ConfigurationK28: Laravel Cloud Managed WebSockets

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization