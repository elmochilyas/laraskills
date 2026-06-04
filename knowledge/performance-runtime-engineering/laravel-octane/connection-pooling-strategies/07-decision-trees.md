# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Connection Pooling Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Database connection pooling in Octane | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Connection Pooling in Octane

---

## Decision Context

In FPM, each request opens/closes DB connections. In Octane, connections persist. Octane reuses connections across requests, reducing connect/disconnect overhead.

---

## Decision Criteria

* **performance** — persistent connections avoid TCP handshake overhead
* **architectural** — connections must reset state between requests
* **operations** — DB may have connection limit per client

---

## Decision Tree

Does Octane handle connection reuse?
↓
**YES** — Octane automatically reuses DB connections. Connection per worker.
**NO (via config)** — Configure per-worker connection pooling.

---

Is connection state reset between requests (transactions, temp tables)?
↓
**YES** — Octane resets via middleware after each request.
**NO** — A forgotten transaction could affect next request.

---

Does the DB have a connection limit?
↓
**YES** — Ensure Octane workers × worker pool connections < DB limit + headroom.
**NO** — Standard pooling.

---

Is Redis used?
↓
**YES** — Redis connections also persist in Octane. Same pooling principles apply.
**NO** — Not relevant.

---

## Recommended Default

**Default:** Let Octane manage connection pooling. Ensure no per-request connection state (transactions) leaks between requests.
**Reason:** Octane handles pooling efficiently; the risk is uncommitted transactions, not connections.

---

## Risks Of Wrong Choice

* Uncommitted transaction: locks held for next request
* Connection limit exceeded: worker connection pool too large for DB

---

## Related Skills

* Connection Pooling Strategies
