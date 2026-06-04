# Skill: Install and Configure Laravel Reverb for Broadcasting

## Purpose
Install, configure, and verify Laravel Reverb as the WebSocket broadcasting backend, including environment setup, process management, reverse proxying, and security hardening.

## When To Use
- Default choice for Laravel broadcasting since Reverb became the standard
- Self-hosted WebSocket server for any Laravel application
- Applications needing Pusher protocol compatibility without third-party service costs

## When NOT To Use
- Applications already on managed services (Pusher, Ably)
- Laravel Cloud deployments (managed Reverb provided automatically)
- Serverless Laravel (Vapor) where Reverb cannot run natively

## Prerequisites
- Laravel 11+ application
- PHP 8.2+ with required extensions
- Composer access
- Server with ability to run long-running processes

## Inputs
- Application environment variables for Reverb credentials
- `config/reverb.php` configuration
- Nginx configuration for reverse proxying
- Supervisor configuration for process management

## Workflow
1. Run `php artisan install:broadcasting` to scaffold Reverb, Echo, and config files
2. Set `BROADCAST_CONNECTION=reverb` in `.env`
3. Generate unique Reverb app credentials per environment
4. Configure `REVERB_HOST` (client-facing) and `REVERB_SERVER_HOST` (internal daemon) with different ports
5. Set `allowed_origins` to explicit allowlist in `config/reverb.php`
6. Configure Nginx as reverse proxy with TLS termination and WebSocket upgrade headers
7. Create Supervisor configuration for Reverb process management
8. Set `QUEUE_CONNECTION` to a proper queue driver (not `sync`)
9. Verify Reverb version is v1.7.0+ (`composer show laravel/reverb`)
10. Test Echo connects to Reverb via Pusher protocol

## Validation Checklist
- [ ] `php artisan install:broadcasting` completed
- [ ] Reverb configured with unique credentials per environment
- [ ] `BROADCAST_CONNECTION=reverb` set in `.env`
- [ ] `allowed_origins` configured for production (non-empty)
- [ ] Reverb running behind Nginx reverse proxy
- [ ] Supervisor configured for Reverb
- [ ] `QUEUE_CONNECTION` set to proper queue driver
- [ ] Reverb version verified as v1.7.0+

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Port conflict prevents Reverb start | Same port for REVERB_PORT and REVERB_SERVER_PORT | Use different internal and external ports |
| No events delivered | QUEUE_CONNECTION=sync in production | Set proper queue driver (redis, database) |
| Reverb stops when SSH session ends | No process manager | Configure Supervisor |
| CSWSH: any domain can connect | No allowed_origins configured | Set explicit allowlist |
| Unknown clients can connect | Default credentials in production | Generate unique credentials per environment |
| Reverb still vulnerable | Version < 1.7.0 | Run `composer show` to verify and update |

## Decision Points
- **Reverse proxy**: Always use Nginx for TLS termination; Reverb receives plain WS internally
- **Process manager**: Supervisor for VM deployments; Kubernetes for containerized
- **Queue driver**: Redis or database — never `sync` in production

## Performance/Security Considerations
- Single Reverb instance handles 10k+ connections on a 4-core/8GB server with `ext-uv`
- Without `ext-uv` or `ext-event`, `stream_select` limits to ~1024 concurrent connections
- Each connection consumes ~1-2KB overhead plus channel subscription memory
- WSS is mandatory in production — terminate TLS at Nginx
- `allowed_origins` prevents CSWSH attacks

## Related Rules (from 05-rules.md)
- Always Run Reverb Behind an Nginx Reverse Proxy
- Always Configure Supervisor to Auto-Restart Reverb
- Always Set `allowed_origins` in Production
- Always Use Separate Internal and External Ports
- Always Generate Unique Credentials Per Environment
- Always Verify Reverb Version After Composer Update

## Related Skills
- Configure Nginx as a WebSocket Proxy for Reverb
- Manage Reverb with Supervisor for Production Process Management
- Scale Reverb Horizontally with Redis Pub/Sub

## Success Criteria
- Reverb installs and starts successfully via `php artisan reverb:start`
- Echo connects to Reverb and receives broadcast events
- Nginx reverse proxies WebSocket connections with TLS
- Supervisor auto-restarts Reverb on crash
- Reverb is secured with origin validation and unique credentials
- Reverb is on v1.7.0+ (patched for CVE-2026-23524)
