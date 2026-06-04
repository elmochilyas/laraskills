# Metadata

**Domain:** real-time-systems
**Subdomain:** security
**Knowledge Unit:** websocket-security-tls-cors-auth-cswsh
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `allowed_origins` configured in Reverb config (no wildcards)
- [ ] Channel authorization via `/broadcasting/auth` implemented
- [ ] Message size limits configured
- [ ] Always Configure allowed_origins with an Explicit Allowlist
- [ ] Always Keep Reverb Updated for Security Patches
- [ ] Always Use Token-Based Authentication Over Cookie-Only
- [ ] Always Use WSS in Production
- [ ] Always Validate Origins at Both Reverb and Application Level
- [ ] `allowed_origins` configured with explicit allowlist (no wildcards)
- [ ] Channel authorization via `/broadcasting/auth` implemented
- [ ] Message size limits configured in Reverb
- [ ] Configure `allowed_origins` with explicit allowlist in Reverb config
- [ ] Configure message size limits in Reverb (`max_message_size`)
- [ ] Enforce WSS in production: `forceTLS: true` in Echo configuration
- [ ] All WebSocket traffic uses WSS (encrypted) in production
- [ ] Channel-level authorization prevents unauthorized subscription
- [ ] CSWSH attack fails: malicious page cannot open authenticated WebSocket

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `allowed_origins` with explicit allowlist in Reverb config
- [ ] Configure message size limits in Reverb (`max_message_size`)
- [ ] Enforce WSS in production: `forceTLS: true` in Echo configuration
- [ ] Implement channel-level authorization via `routes/channels.php`
- [ ] Implement token-based authentication for WebSocket auth endpoint
- [ ] Keep Reverb updated to latest version for security patches
- [ ] Set SameSite cookies to Lax or Strict for defense in depth
- [ ] Terminate TLS at Nginx, proxy plain WS to Reverb internally
- [ ] Test CSWSH scenario: malicious page attempting WebSocket connection
- [ ] Validate origins at both Reverb level and application middleware level
- [ ] Always Configure allowed_origins with an Explicit Allowlist
- [ ] Always Keep Reverb Updated for Security Patches

---

# Performance Checklist

- [ ] Origin validation via string comparison is O(n) in allowlist length; negligible cost
- [ ] TLS session resumption (session IDs, session tickets) reduces handshake overhead for reconnections
- [ ] Token validation (JWT verification, database lookup) adds per-connection latency
- [ ] WSS handshake: TLS negotiation adds ~50-200ms to initial connection (worth it for security)
- [ ] TLS session resumption reduces handshake overhead for reconnections
- [ ] Token validation (JWT verification) adds per-connection latency

---

# Security Checklist

- [ ] Auth token in query string appears in server logs, referrer headers, browser history
- [ ] Message size limits prevent DoS via oversized payloads (configure `max_message_size` in Reverb)
- [ ] Non-browser clients (mobile apps, server-to-server) don't send Origin header reliablyâ€”use token auth
- [ ] Origin validation is the primary defense against CSWSH; do not rely on SameSite alone
- [ ] CSWSH is the primary WebSocket-specific threat; origin validation is the primary defense
- [ ] Origin validation via string comparison is O(n) in allowlist length â€” negligible cost
- [ ] TLS session resumption reduces handshake overhead for reconnections
- [ ] Token validation (JWT verification) adds per-connection latency

---

# Reliability Checklist

- [ ] Cookie sent automatically enabling CSWSH
- [ ] CORS error but WebSocket still connects
- [ ] CSWSH: malicious page opens WS
- [ ] WebSocket handshake fails due to origin
- [ ] WebSocket traffic sent in plaintext
- [ ] Always Configure allowed_origins with an Explicit Allowlist
- [ ] Always Keep Reverb Updated for Security Patches
- [ ] Always Use Token-Based Authentication Over Cookie-Only
- [ ] Always Use WSS in Production
- [ ] Always Validate Origins at Both Reverb and Application Level

---

# Testing Checklist

- [ ] `allowed_origins` configured in Reverb config (no wildcards)
- [ ] `allowed_origins` configured with explicit allowlist (no wildcards)
- [ ] All WebSocket traffic uses WSS (encrypted) in production
- [ ] Channel authorization via `/broadcasting/auth` implemented
- [ ] Channel-level authorization prevents unauthorized subscription
- [ ] CSWSH attack fails: malicious page cannot open authenticated WebSocket
- [ ] Message size limits configured
- [ ] Message size limits configured in Reverb
- [ ] Only allowlisted origins can establish WebSocket connections
- [ ] Origin validation at both Reverb and application level

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Plain WS in Production (No TLS)]
- [ ] [Wildcard or Empty allowed_origins (CSWSH Vulnerability)]
- [ ] [Cookie-Only Authentication for WebSocket]
- [ ] [Relying on CORS for WebSocket Protection]
- [ ] [Single Origin Validation Layer]
- [ ] Exposing Reverb on a public port without Nginx
- [ ] Relying solely on CORS for WebSocket protection
- [ ] Using the same credentials for development and production

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


