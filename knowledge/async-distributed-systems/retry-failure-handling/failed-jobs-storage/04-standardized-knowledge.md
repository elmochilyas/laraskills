# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K020 — `failed_jobs` Table and DynamoDB Storage
- **Knowledge ID:** K020
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Failed Jobs
  - Laravel Source — `DatabaseFailedJobProvider`, `DynamoDbFailedJobProvider`

---

# Overview

Failed jobs are persisted in either the `failed_jobs` database table or DynamoDB. The database implementation stores ID, UUID, connection, queue, payload, exception, and timestamps. DynamoDB is an alternative for high-volume failure storage with auto-scaling. Both implement `FailedJobProviderInterface` and are swappable via config.

---

# Core Concepts

- **Database storage:** `failed_jobs` table: `id`, `uuid`, `connection`, `queue`, `payload` (TEXT), `exception` (TEXT), `failed_at`.
- **DynamoDB storage:** Keyed by `uuid`. Uses AWS SDK. No schema migrations.
- **`FailedJobProviderInterface`:** Contract: `log()`, `find()`, `all()`, `forget()`, `flush()`.
- **Payload storage:** Full serialized job payload stored for retry.
- **Exception storage:** Full stack trace stored for debugging.

---

# When To Use

- **Database:** Simple, no-infrastructure setup. Default choice for most apps.
- **DynamoDB:** High failure volume (>1000/day), want to avoid DB bloat, already on AWS.

---

# When NOT To Use

- Never prune the table — grows unbounded, slows retry operations.
- Store sensitive data in payload without encryption.

---

# Best Practices

- **Prune failed jobs regularly via scheduler.** `$schedule->command('queue:prune-failed --hours=168')->daily()`. *Why: The `failed_jobs` table grows forever — every failure adds kilobytes of payload + stack trace. An unpruned table with 100K+ rows makes `queue:retry` and `queue:retry-batch` operations slow.*
- **Use a dedicated database connection for failed jobs in high-volume systems.** Prevents failure storage from competing with application queries. *Why: `INSERT INTO failed_jobs` on every failure competes with regular application queries. Under high failure rates, this DB contention compounds the problem.*
- **Be aware that payload may contain sensitive data.** The serialized job payload is stored as-is. *Why: The `payload` column contains the full serialized job object, including constructor arguments — PII, API keys, or internal IDs may be stored permanently in `failed_jobs`.*

---

# Performance Considerations

- Database `failed_jobs` queries scale poorly at high volume — `SELECT *` on 1M rows is slow.
- The `exception` TEXT column stores full stack trace — 2-10KB per failure.
- DynamoDB writes cost ~$1.25/million writes on-demand.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Never pruning | No scheduled cleanup | Table grows unbounded — slow queries | Schedule daily prune |
| Storing sensitive data in payload | Serializes full job state | PII/keys stored permanently in failed_jobs | Remove sensitive data before passing to job |
| Relying on DynamoDB for analytics | DynamoDB lacks complex queries | Can't analyze failure patterns | Stream to analytics store |

---

# Related Topics

- **K021 failed() Method (K021)** — Cleanup on failure
- **K086 Pruning Failed Jobs (K086)** — Table maintenance
