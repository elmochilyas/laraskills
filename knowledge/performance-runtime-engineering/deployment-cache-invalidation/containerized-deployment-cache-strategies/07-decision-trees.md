# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** Containerized Deployment Cache Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | OpCache strategy for containers | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: OpCache in Containers

---

## Decision Context

Containers start fresh. OpCache is cold on every container start. Strategies: pre-warm in Dockerfile, warm on startup, or accept cold start.

---

## Decision Criteria

* **performance** — cold OpCache costs 50-100ms per first request per file
* **operations** — warmup can be done in CI or at container start
* **cost** — warmup adds deployment time

---

## Decision Tree

Is container start latency critical?
↓
**YES** — Pre-warm OpCache in Dockerfile. Save compiled opcodes to file_cache image layer.
**NO** — Accept cold start. OpCache warms naturally over first requests.

---

Is the container restarted frequently (>1/hour)?
↓
**YES** — File_cache provides value. Warm file_cache in Docker build.
**NO** — Cold start cost is minimal with long-lived containers.

---

Is OpCache file_cache enabled?
↓
**YES** — File_cache persists compiled opcodes in container filesystem. Reduces warmup time.
**NO** — Consider enabling for containers.

---

Can warmup requests be sent after deployment?
↓
**YES** — Include warmup in readiness probe.
**NO** — Pre-warm in Dockerfile.

---

## Recommended Default

**Default:** Pre-warm OpCache via file_cache in Dockerfile + readiness probe warmup requests.
**Reason:** Reduces first-request latency after container start.

---

## Risks Of Wrong Choice

* No warmup: first requests to each endpoint are slow
* Pre-warming in Dockerfile adds build time: 5-10s per build

---

## Related Skills

* Containerized Deployment Cache Strategies
