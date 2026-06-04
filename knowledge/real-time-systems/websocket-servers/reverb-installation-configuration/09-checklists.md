# Metadata

**Domain:** real-time-systems
**Subdomain:** websocket-servers
**Knowledge Unit:** reverb-installation-configuration
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `allowed_origins` configured for production
- [ ] `BROADCAST_CONNECTION=reverb` set in `.env`
- [ ] `php artisan install:broadcasting` completed
- [ ] Always Configure Supervisor to Auto-Restart Reverb
- [ ] Always Generate Unique Credentials Per Environment
- [ ] Always Run Reverb Behind an Nginx Reverse Proxy
- [ ] Always Set allowed_origins in Production
- [ ] Always Use Separate Internal and External Ports
- [ ] `allowed_origins` configured for production (non-empty)
- [ ] `BROADCAST_CONNECTION=reverb` set in `.env`
- [ ] `php artisan install:broadcasting` completed
- [ ] Configure `REVERB_HOST` (client-facing) and `REVERB_SERVER_HOST` (internal daemon) with different ports
- [ ] Configure Nginx as reverse proxy with TLS termination and WebSocket upgrade headers
- [ ] Create Supervisor configuration for Reverb process management
- [ ] Echo connects to Reverb and receives broadcast events
- [ ] Nginx reverse proxies WebSocket connections with TLS
- [ ] Reverb installs and starts successfully via `php artisan reverb:start`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `REVERB_HOST` (client-facing) and `REVERB_SERVER_HOST` (internal daemon) with different ports
- [ ] Configure Nginx as reverse proxy with TLS termination and WebSocket upgrade headers
- [ ] Create Supervisor configuration for Reverb process management
- [ ] Generate unique Reverb app credentials per environment
- [ ] Run `php artisan install:broadcasting` to scaffold Reverb, Echo, and config files
- [ ] Set `allowed_origins` to explicit allowlist in `config/reverb.php`
- [ ] Set `BROADCAST_CONNECTION=reverb` in `.env`
- [ ] Set `QUEUE_CONNECTION` to a proper queue driver (not `sync`)
- [ ] Test Echo connects to Reverb via Pusher protocol
- [ ] Verify Reverb version is v1.7.0+ (`composer show laravel/reverb`)
- [ ] Always Configure Supervisor to Auto-Restart Reverb
- [ ] Always Generate Unique Credentials Per Environment

---

# Performance Checklist

- [ ] `max_message_size` (default 10KB) prevents oversized payload abuse
- [ ] Each connection consumes ~1-2 KB overhead plus application memory for subscribed channels
- [ ] Single Reverb instance handles 10k+ connections on a 4-core/8GB server with `ext-uv`
- [ ] Without `ext-uv` or `ext-event`, `stream_select` limits to ~1024 concurrent connections
- [ ] Each connection consumes ~1-2KB overhead plus channel subscription memory
- [ ] Single Reverb instance handles 10k+ connections on a 4-core/8GB server with `ext-uv`
- [ ] Without `ext-uv` or `ext-event`, `stream_select` limits to ~1024 concurrent connections

---

# Security Checklist

- [ ] `allowed_origins` prevents CSWSH attacks by restricting which domains can connect
- [ ] App credentials should be treated as secrets; rotate if compromised
- [ ] Reverb v1.7.0+ fixes CVE-2026-23524 (critical Redis deserialization RCE)
- [ ] WSS is mandatory in productionâ€”configure TLS at Nginx, not in Reverb itself
- [ ] WSS is mandatory in production â€” terminate TLS at Nginx

---

# Reliability Checklist

- [ ] CSWSH: any domain can connect
- [ ] No events delivered
- [ ] Port conflict prevents Reverb start
- [ ] Reverb still vulnerable
- [ ] Reverb stops when SSH session ends
- [ ] Unknown clients can connect
- [ ] Always Configure Supervisor to Auto-Restart Reverb
- [ ] Always Generate Unique Credentials Per Environment
- [ ] Always Run Reverb Behind an Nginx Reverse Proxy
- [ ] Always Set allowed_origins in Production

---

# Testing Checklist

- [ ] `allowed_origins` configured for production
- [ ] `allowed_origins` configured for production (non-empty)
- [ ] `BROADCAST_CONNECTION=reverb` set in `.env`
- [ ] `php artisan install:broadcasting` completed
- [ ] `QUEUE_CONNECTION` set to proper queue driver
- [ ] Echo connects to Reverb and receives broadcast events
- [ ] Nginx reverse proxies WebSocket connections with TLS
- [ ] Reverb configured in `config/reverb.php` with unique credentials
- [ ] Reverb configured with unique credentials per environment
- [ ] Reverb installs and starts successfully via `php artisan reverb:start`

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Binding Reverb to 0.0.0.0 without firewall
- [ ] Not verifying Reverb version after Composer update
- [ ] Running Reverb without a reverse proxy

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


