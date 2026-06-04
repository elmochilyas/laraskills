# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache CLI Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | OpCache configuration for CLI scripts | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: OpCache CLI Configuration

---

## Decision Context

OpCache for CLI uses separate configuration from web (opcache.enable_cli). CLI caching benefits repeated script execution (artisan commands, queue workers).

---

## Decision Criteria

* **performance** — CLI OpCache speeds repeated artisan commands
* **architectural** — CLI processes are short-lived; cache benefit is per run
* **operations** — CLI cache memory is separate from web

---

## Decision Tree

Are long-running CLI processes used (queue workers)?
↓
**YES** — Enable opcache.enable_cli. Single worker benefits from caching.
**NO (adhoc commands)** — Benefit is minimal for one-off commands.

---

Are artisan commands executed frequently?
↓
**YES** — Enable CLI OpCache. Repeated commands benefit.
**NO** — Enable only for queue workers.

---

Is the CLI process memory-constrained?
↓
**YES** — Keep CLI OpCache small. Separate memory pool.
**NO** — Use standard settings.

---

## Recommended Default

**Default:** Enable opcache.enable_cli with opcache.memory_consumption = 64MB for CLI.
**Reason:** Queue workers benefit from OpCache; 64MB is sufficient for CLI.

---

## Risks Of Wrong Choice

* No CLI OpCache: queue workers recompile on every job
* Full OpCache for CLI: memory waste if commands are one-off

---

## Related Skills

* OpCache CLI Configuration
