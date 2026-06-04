# Skill: Deploy and Secure Laravel Reverb in Production

## Purpose
Configure, deploy, and secure Laravel Reverb as a production WebSocket server with Nginx proxying, SSL termination, Supervisor process management, and appropriate OS limits.

## When To Use
Self-hosted real-time features requiring data sovereignty or cost control; high-volume WebSocket applications exceeding Pusher plan limits; Laravel 11+ apps needing first-party WebSocket integration.

## When NOT To Use
Small apps with low connections (Pusher SaaS is simpler); teams that can't manage self-hosted processes; global multi-region delivery (Pusher network is superior); serverless environments (Vapor, Lambda).

## Prerequisites
- Laravel Reverb installed (`php artisan install:broadcasting`)
- PHP 8.1+ with `pcntl`, `posix`, `socket` extensions
- Server with Nginx and Supervisor
- SSL certificate

## Inputs
- Expected concurrent connection count
- CPU core count
- Reverb port (default 8080)

## Workflow
1. Increase open file limits: set `minfds=65536` in Supervisor config (NOT shell `ulimit`)
2. Configure Nginx as reverse proxy with WebSocket upgrade headers
3. Set `proxy_read_timeout 86400s` — prevents idle disconnect
4. Terminate SSL at Nginx, proxy to Reverb over HTTP
5. Configure Supervisor: `numprocs` = CPU cores, `autorestart=true`
6. Never block event loop — no `sleep()`, sync HTTP, or DB queries in handlers
7. Monitor RSS memory — should stabilize, not grow
8. Set `worker_connections` in Nginx to expected concurrent connections

## Validation Checklist
- [ ] Nginx proxy configured with `Upgrade` and `Connection` headers
- [ ] `proxy_read_timeout` set to 86400
- [ ] SSL certificate valid — WSS connections work
- [ ] Supervisor `minfds` set (not shell `ulimit`)
- [ ] No blocking I/O in event handlers
- [ ] Memory stabilizes over 24h (no leak)
- [ ] Nginx `worker_connections` >= expected connections
- [ ] Reverb auto-restarts on crash
- [ ] Supervisor `numprocs` = CPU cores

## Common Failures
- Not increasing open file limits — "too many open files" errors
- Running without Supervisor — crash disconnects all clients permanently
- No Redis pub/sub for multi-process — clients on different processes isolated
- Nginx `proxy_read_timeout` too low — WebSocket disconnects after 60s idle
- Blocking the event loop — all connections freeze

## Decision Points
- Single server: Nginx proxy + Supervisor
- Multi-server: add Redis pub/sub and load balancer
- SSL: terminate at Nginx (not Reverb directly)

## Related Rules
- Rule 1: proxy-reverb-through-nginx
- Rule 2: never-block-reverb-event-loop
- Rule 3: set-ulimit-via-supervisor-minfds
- Rule 4: stabilize-memory-no-leaks

## Related Skills
- Scale Reverb via Multiple Processes
- Set Up Laravel Echo Client-Side Consumption
- Configure Channel Types — Public, Private, Presence

## Success Criteria
Reverb runs behind Nginx with SSL, file descriptor limits are sufficient for expected connections, process management ensures auto-recovery, memory is stable, and event loop never blocks.
