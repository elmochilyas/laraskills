# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Broadcasting & Real-Time
**Knowledge Unit:** K034 — Reverb Production Deployment
**Generated:** 2026-06-03

---

# Decision Inventory

* Reverb SSL Termination Strategy
* Reverb Reverse Proxy Configuration

---

# Architecture-Level Decision Trees

---

## Reverb SSL Termination Strategy

---

### Decision Context

Where to terminate SSL for Reverb WebSocket connections — at the reverse proxy or at Reverb itself.

---

### Decision Criteria

* Reverse proxy presence (Nginx, Caddy)
* Operational simplicity
* Certificate management preference

---

### Decision Tree

Using Nginx as reverse proxy?
YES → Terminate SSL at Nginx — standard practice, WSS via proxy
NO → Using Reverb directly (no reverse proxy)?
    YES → Reverb can terminate SSL (FrankenPHP/Caddy handles it)
NO → Using Caddy as reverse proxy?
    YES → Caddy auto-HTTPS — terminate at Caddy

---

### Rationale

The standard production setup is Reverb behind Nginx with SSL termination at Nginx. Nginx handles the TLS handshake and proxies WebSocket connections to Reverb over plain HTTP on localhost.

---

### Recommended Default

**Default:** Terminate SSL at Nginx reverse proxy; configure WSS endpoint pointing to Nginx
**Reason:** Nginx handles SSL efficiently, provides DDoS protection, and is standard for Laravel deployments. Let Nginx deal with certificate management.

---

### Risks Of Wrong Choice

- No SSL for WSS: browsers block insecure WebSocket on HTTPS pages
- SSL at Reverb without proxy: Reverb handles TLS directly — less flexible
- Missing CORS config: browser blocks cross-origin WebSocket connections

---

### Related Rules

- increase-ulimit-for-websocket-connections
- always-run-reverb-under-supervisor

---

### Related Skills

- Configure Laravel Reverb WebSocket Server
- Deploy Reverb to Production

---

## Reverb Reverse Proxy Configuration

---

### Decision Context

Configuring the reverse proxy (Nginx) for WebSocket proxying to Reverb.

---

### Decision Criteria

* WebSocket upgrade headers
* Proxy timeouts
* Load balancing across multiple Reverb processes

---

### Decision Tree

Single Reverb process?
YES → Proxy to localhost:ReverbPort with upgrade headers
NO → Multiple Reverb processes?
    YES → Load balance across processes — all are identical (state via Redis pub/sub)
NO → Need sticky sessions?
    YES → Not required — Reverb processes are stateless (state in Redis)

---

### Rationale

WebSocket connections require the `Upgrade` and `Connection` headers. Nginx `proxy_read_timeout` must be set to 86400 seconds (WebSocket connections idle for extended periods). Multiple processes can be load balanced without sticky sessions.

---

### Recommended Default

**Default:** Proxy `CONFIG_REVERB_PATH` to `http://localhost:REVERB_PORT` with `proxy_read_timeout 86400s` and required upgrade headers
**Reason:** Standard WebSocket proxying. Long timeout prevents idle disconnections. No sticky sessions needed with shared Redis state.

---

### Risks Of Wrong Choice

- proxy_read_timeout too short (default 60s): WebSocket disconnects after idle period
- Missing upgrade headers: WebSocket handshake fails, connection not upgraded
- Sticky sessions: unnecessary with shared Redis state

---

### Related Rules

- increase-ulimit-for-websocket-connections
- always-run-reverb-under-supervisor

---

### Related Skills

- Configure Laravel Reverb WebSocket Server
- Deploy Reverb to Production
