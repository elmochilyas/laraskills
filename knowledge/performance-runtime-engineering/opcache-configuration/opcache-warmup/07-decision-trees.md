# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Warmup
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | OpCache warmup strategy | Operations | Deploy |

---

# Architecture-Level Decision Trees

---

## Decision: OpCache Warmup

---

## Decision Context

After PHP-FPM restart or opcache_reset(), OpCache is cold. Compiling files on first access causes slow initial requests. Warmup pre-compiles files.

---

## Decision Criteria

* **performance** — warmup eliminates first-request latency
* **operations** — warmup adds deployment time
* **architectural** — file_cache reduces warmup need

---

## Decision Tree

Is latency critical for the first requests after restart?
↓
**YES** — Implement warmup. Access all key endpoints after deployment.
**NO** — Accept cold start. OpCache warms naturally.

---

Is opcache.file_cache enabled?
↓
**YES** — File cache reduces warmup time. Warmup still beneficial.
**NO** — Warmup is more valuable. Without it, every file is compiled fresh.

---

Is this a containerized deployment?
↓
**YES** — Include warmup in readiness probe. Request key endpoints.
**NO** — Warmup script after restart.

---

What warmup method?
↓
**HTTP requests** — Request all key endpoints via curl. Most realistic.
**PHP script** — Include all PHP files. Less realistic (no execution path).
**Preload** — Preloaded classes are compiled and cached in OpCache.

---

## Recommended Default

**Default:** HTTP warmup: request key endpoints after deployment via curl. 3-5 most critical routes.
**Reason:** Real-world warmup that compiles the hot code paths.

---

## Risks Of Wrong Choice

* No warmup: first 50-100 requests to each endpoint are slow
* Script warmup (only include): doesn't execute, misses some compilations

---

## Related Skills

* OpCache Warmup
