# Metadata

**Domain:** real-time-systems
**Subdomain:** websocket-servers
**Knowledge Unit:** soketi-self-hosted-setup
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `config/broadcasting.php` updated with Soketi host
- [ ] `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET` configured
- [ ] Nginx reverse proxy configured for Soketi
- [ ] Always Configure Rate Limits on Soketi
- [ ] Always Configure SOKETI_DEFAULT_APP_* Environment Variables
- [ ] Always Deploy Soketi Behind Nginx Reverse Proxy
- [ ] Always Update config/broadcasting.php with Soketi Host
- [ ] Always Use a Process Manager for Soketi
- [ ] `allowed_origins` configured
- [ ] `config/broadcasting.php` updated with Soketi host
- [ ] `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET` configured
- [ ] Configure `SOKETI_ALLOWED_ORIGINS` for CSWSH prevention
- [ ] Configure `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET`
- [ ] Configure `SOKETI_GLOBAL_RATE_LIMIT` and `SOKETI_RATE_LIMIT` for abuse prevention
- [ ] Laravel broadcasts events to Soketi via Pusher driver
- [ ] Multi-instance deployments have shared state via Redis adapter
- [ ] Process manager auto-restarts Soketi on crash

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `SOKETI_ALLOWED_ORIGINS` for CSWSH prevention
- [ ] Configure `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET`
- [ ] Configure `SOKETI_GLOBAL_RATE_LIMIT` and `SOKETI_RATE_LIMIT` for abuse prevention
- [ ] Deploy behind Nginx reverse proxy with TLS termination and WebSocket upgrade headers
- [ ] Enable Prometheus monitoring via Soketi's `/metrics` endpoint
- [ ] For multi-instance: configure Redis adapter (`SOKETI_ADAPTER_DRIVER=redis`) and sticky sessions
- [ ] Install Soketi: `npm install -g soketi` or use Docker: `quay.io/soketi/soketi:latest`
- [ ] Set `SOKETI_DEBUG=false` in production
- [ ] Set up process manager (Supervisor for VM, container orchestration for Docker)
- [ ] Update `config/broadcasting.php` with Soketi host, port, and scheme
- [ ] Always Configure Rate Limits on Soketi
- [ ] Always Configure SOKETI_DEFAULT_APP_* Environment Variables

---

# Performance Checklist

- [ ] NATS adapter can provide lower latency than Redis in high-throughput deployments
- [ ] Node.js event loop handles thousands of concurrent connections efficiently (lower memory per connection than PHP)
- [ ] Redis adapter for scaling adds 1-5ms publish latency (similar to Reverb)
- [ ] Single instance handles 10k+ concurrent connections with adequate resources
- [ ] Node.js handles 10k+ concurrent connections efficiently (lower memory per connection than PHP)
- [ ] Redis adapter adds 1-5ms publish latency for cross-instance events
- [ ] Single instance handles 10k+ concurrent connections with adequate resources

---

# Security Checklist

- [ ] `SOKETI_MAX_MESSAGE_SIZE` prevents oversized payload attacks
- [ ] CORS must be configured on Soketi's auth endpoint
- [ ] Soketi does not handle TLS termination by defaultâ€”use Nginx reverse proxy for WSS
- [ ] Soketi uses the same channel authorization as Reverb/Pusher via `/broadcasting/auth`
- [ ] Configure rate limits and allowed origins for abuse prevention
- [ ] Soketi does not handle TLS natively â€” always use Nginx reverse proxy for WSS

---

# Reliability Checklist

- [ ] Client floods degrade performance
- [ ] Clients cannot connect to Soketi
- [ ] Events sent to Pusher instead of Soketi
- [ ] Lost subscriptions across instances
- [ ] Soketi crashes, no auto-recovery
- [ ] WebSocket traffic unencrypted
- [ ] Always Configure Rate Limits on Soketi
- [ ] Always Configure SOKETI_DEFAULT_APP_* Environment Variables
- [ ] Always Deploy Soketi Behind Nginx Reverse Proxy
- [ ] Always Update config/broadcasting.php with Soketi Host

---

# Testing Checklist

- [ ] `allowed_origins` configured
- [ ] `config/broadcasting.php` updated with Soketi host
- [ ] `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET` configured
- [ ] Laravel broadcasts events to Soketi via Pusher driver
- [ ] Multi-instance deployments have shared state via Redis adapter
- [ ] Nginx reverse proxy configured for Soketi
- [ ] Process manager auto-restarts Soketi on crash
- [ ] Process manager set up (Supervisor or container orchestration)
- [ ] Prometheus monitoring enabled
- [ ] Prometheus monitoring enabled (optional)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Not configuring `allowed_origins`
- [ ] Running Soketi without Nginx reverse proxy
- [ ] Using Soketi when Reverb would integrate better

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


