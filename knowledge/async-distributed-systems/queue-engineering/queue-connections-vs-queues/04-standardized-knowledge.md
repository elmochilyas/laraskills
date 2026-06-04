# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K001 — Queue Connections vs. Queues Distinction
- **Knowledge ID:** K001
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues
  - Laravel Source — `config/queue.php`

---

# Overview

The connection-vs-queue distinction is the most misunderstood concept in Laravel queue configuration. A **connection** is a backend driver instance (Redis, SQS, database) defining where and how jobs are stored. A **queue** is a logical named channel within a connection — a named pile of work. A single Redis connection can host dozens of named queues (`high`, `default`, `low`), each processed independently by workers. Confusing these leads to infrastructure multiplication — creating separate Redis instances per queue when only separate queue names are needed.

---

# Core Concepts

- **Connection:** A configured backend service. Driver type, credentials, driver-specific options. Defined in `config/queue.php` under `connections`.
- **Queue:** A named channel within a connection. Jobs dispatch to a queue name. Workers subscribe to specific queue names.
- **Default queue:** The `queue` key in connection config — fallback when no queue is specified during dispatch.
- **Worker queue subscription:** `--queue=high,default` processes `high` first (priority ordering), then `default`.
- **Failover connections:** Laravel 12+ `failover` driver chains multiple connections for HA.

---

# When To Use

- **Single connection + multiple queues:** 95% of applications. Add new connections only when changing driver type or using separate Redis instances.
- **Multiple connections:** Different drivers for different jobs (Redis for latency-sensitive, SQS for bulk), or isolating queue Redis from cache Redis.
- **Failover connection:** When queue availability is critical and dual-backend complexity is manageable.

---

# When NOT To Use

- Separate connections per queue — queues are logical partitions within a connection
- Failover when zero data loss tolerance is required — no automatic failback exists

---

# Best Practices

- **Define topology before deploying first job.** Retroactive splitting requires draining and migrating queues. *Why: Moving a job class from one queue to another requires queue draining, worker reconfiguration, and careful monitoring — all avoidable with upfront planning.*
- **Name queues by workload characteristic, not job class.** Use `critical`, `default`, `media`, `reports` — not `ProcessOrderQueue`, `SendEmailQueue`. *Why: Queue names describe processing requirements (latency, resource intensity), not job types. Multiple job classes share the same queue — the name should describe their common workload characteristic.*
- **One connection can serve many queues.** Adding a queue name requires zero infrastructure changes. *Why: Queues are just list keys in Redis or `WHERE queue = ?` conditions in the database — they cost nothing to create.*
- **Set `after_commit` at the connection level.** Jobs dispatched within transactions may process before the transaction commits. *Why: A worker processing a job before the dispatching transaction commits may read stale or missing data — `after_commit` defers dispatch until the transaction is committed.*

---

# Performance Considerations

- All queues on one Redis connection share the same connection pool — Redis handles multiplexing.
- SQS charges per request — polling many empty queues costs the same as polling one full queue.
- Database driver: each queue is a separate `WHERE queue = ?` filter — proper indexing is essential.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Separate Redis per queue | Confusing connection with queue | Unnecessary infrastructure overhead | Use one connection, multiple queue names |
| Not setting `after_commit` | Default is false | Jobs process before transaction commits | Set `after_commit=true` on connection |

---

# Related Topics

- **K002 Queue Driver Architecture (K002)** — Technical foundation
- **K077 Queue Priority via Multiple Queues (K077)** — Advanced topology
- **K080 block_for Redis Option (K080)** — Worker polling mechanics
