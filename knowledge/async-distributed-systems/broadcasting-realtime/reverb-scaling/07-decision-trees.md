# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Broadcasting & Real-Time
**Knowledge Unit:** K035 — Reverb Scaling
**Generated:** 2026-06-03

---

# Decision Inventory

* Vertical vs Horizontal Scaling for Reverb

---

# Architecture-Level Decision Trees

---

## Vertical vs Horizontal Scaling for Reverb

---

### Decision Context

Whether to scale Reverb vertically (bigger server) or horizontally (more servers).

---

### Decision Criteria

* Connection count
* Memory per connection (~50-100KB)
* File descriptor limits
* Budget for additional servers

---

### Decision Tree

Expected connections < 10,000?
YES → Vertical scaling — single server with enough RAM (500MB-1GB)
NO → Connections 10,000-50,000?
    YES → Horizontal scaling — 2-5 servers with load balancer + shared Redis
NO → Connections > 50,000?
    YES → Horizontal scaling — dedicated server cluster + Redis pub/sub
NO → Memory per server limited (< 8GB)?
    YES → Horizontal — spread connections across servers

---

### Rationale

A single Reverb process handles ~1K connections. A server with multiple cores runs one Reverb process per core (via Supervisor numprocs). At ~50-100KB per connection, 10K connections need ~500MB-1GB memory. Beyond a single server, use horizontal scaling with load balancer and shared Redis.

---

### Recommended Default

**Default:** Scale vertically first (up to 10K connections); scale horizontally beyond that
**Reason:** Vertical scaling is simpler — no load balancer, no shared Redis complexity. Horizontal scaling adds operational overhead that's only justified at scale.

---

### Risks Of Wrong Choice

- Vertical beyond capacity: file descriptor exhaustion, OOM, connection drops
- Horizontal too early: unnecessary complexity, Redis pub/sub overhead
- No load balancer for horizontal: clients can't distribute across servers
- No shared Redis: servers don't coordinate — clients on different servers isolated

---

### Related Rules

- increase-ulimit-for-websocket-connections
- always-run-reverb-under-supervisor

---

### Related Skills

- Scale Reverb for Production
- Configure Laravel Reverb WebSocket Server
