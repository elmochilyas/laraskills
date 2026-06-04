# Skill: Deploy Reverb to Production (SSL, Nginx, Supervisor)

## Purpose
Configure SSL termination, Nginx WebSocket proxying, and Supervisor process management for production Reverb deployment.

## When To Use
Deploying Reverb to any production environment; the baseline setup before multi-process scaling.

## When NOT To Use
Development environments (default setup sufficient); environments already using Pusher SaaS.

## Prerequisites
- Laravel Reverb installed and tested locally
- Server with Nginx, Supervisor, and SSL certificate
- PHP extensions: `pcntl`, `posix`, `socket`

## Inputs
- Domain for WebSocket endpoint (e.g., `ws.example.com`)
- SSL certificate path
- Expected concurrent connection count

## Workflow
1. Configure Nginx site with WebSocket upgrade headers
2. Set `proxy_read_timeout 86400s` (24 hours)
3. Set `proxy_send_timeout 86400s`
4. Set `worker_connections` in nginx.conf to expected connections
5. Configure Supervisor: `command=php artisan reverb:start`, `numprocs=1` initially
6. Set `minfds=65536` in Supervisor config (NOT shell `ulimit`)
7. Never expose Reverb directly — always proxy through Nginx
8. Never block event loop — dispatch queued jobs for blocking work
9. Monitor RSS memory — alert on growth trend

## Validation Checklist
- [ ] Nginx WebSocket proxy configured with Upgrade headers
- [ ] `proxy_read_timeout` = 86400
- [ ] SSL valid — WSS connections succeed
- [ ] Supervisor managing Reverb with `autorestart=true`
- [ ] `minfds=65536` in Supervisor config
- [ ] Reverb not exposed directly (only via Nginx)
- [ ] No blocking I/O in event handlers
- [ ] Memory stable over 24h
- [ ] `worker_connections` >= expected connections

## Common Failures
- Direct Reverb exposure — no SSL, no rate limiting
- Not increasing file limits — "too many open files" at low connections
- Running without Supervisor — crash = permanent disconnection
- Nginx timeout too low — WebSocket drops after 60s idle
- Blocking event loop — all connections freeze

## Decision Points
- Single server: one Supervisor process
- Multi-core: set `numprocs` to CPU count
- SSL: terminate at Nginx

## Related Rules
- Rule 1: proxy-reverb-through-nginx
- Rule 2: never-block-reverb-event-loop
- Rule 3: set-ulimit-via-supervisor-minfds
- Rule 4: stabilize-memory-no-leaks

## Related Skills
- Scale Reverb via Multiple Processes
- Implement `ShouldBroadcast` for Real-Time Events
- Set Up Laravel Echo Client-Side Consumption

## Success Criteria
Reverb runs behind Nginx with SSL, Supervisor ensures auto-recovery, file descriptor limits are sufficient, memory is stable, and event loop is non-blocking.
