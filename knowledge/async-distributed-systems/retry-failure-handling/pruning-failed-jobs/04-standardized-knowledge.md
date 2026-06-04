# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K086 — Pruning Failed Jobs
- **Knowledge ID:** K086
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Pruning Failed Jobs

---

# Overview

The `failed_jobs` table grows unbounded as jobs fail over time. Left unpruned, it degrades query performance, increases storage costs, and slows retry operations. `queue:prune-failed` deletes records older than a given age. Pruning should be standard queue maintenance — typically keep 7-30 days of failure history.

---

# Core Concepts

- **`queue:prune-failed`:** Deletes `failed_jobs` records older than `--hours` (default 24).
- **Scheduler integration:** `$schedule->command('queue:prune-failed --hours=168')->daily()`.
- **`FailedJobProviderInterface::prune()`:** Implemented by Database and DynamoDB providers.
- **All-or-nothing by age:** You can't prune by exception type or queue without custom code.

---

# When To Use

- **7-day retention:** Sufficient for most applications — enough time to investigate failures.
- **30-day retention:** Financial/regulated apps needing longer trend analysis.
- **Daily pruning during low-traffic periods:** Avoids contention with peak processing.

---

# When NOT To Use

- No pruning at all — table grows forever, queries slow down.
- Pruning too aggressively (1-hour retention) — incident evidence deleted before investigation.

---

# Best Practices

- **Schedule pruning daily.** `$schedule->command('queue:prune-failed --hours=168')->daily()`. *Why: Without scheduling, the table grows unbounded — a missed manual prune after an incident leaves the table bloated forever.*
- **Run pruning during low-traffic periods.** Large `DELETE` operations on the `failed_jobs` table can impact database performance. *Why: `DELETE FROM failed_jobs WHERE failed_at < ?` may lock rows or slow the DB during execution. Running during peak job processing can affect `failed_jobs` writes.*
- **For very large tables, implement chunked pruning.** `DELETE ... LIMIT 1000` in a loop avoids long table locks. *Why: A single `DELETE` on a 1M-row table can take minutes and block other operations. Chunking spreads the operation across smaller transactions.*

---

# Performance Considerations

- Pruning a large table (>100K rows) may lock rows in InnoDB.
- For very large tables, chunk the delete: `DELETE FROM failed_jobs WHERE failed_at < ? LIMIT 1000`.
- The `exception` column contains full stack traces — large columns freed by pruning.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No pruning | Never configured | Table grows unbounded — slow queries | Schedule daily prune |
| Pruning too aggressively (1h) | Over-eager cleanup | Incident evidence lost before investigation | Keep 7-30 days |
| Pruning during peak hours | Convenience | DB contention during prune | Schedule off-peak |

---

# Related Topics

- **K020 failed_jobs Storage (K020)** — Storage structure
- **K087 Ignoring Missing Models (K087)** — Related failure handling
