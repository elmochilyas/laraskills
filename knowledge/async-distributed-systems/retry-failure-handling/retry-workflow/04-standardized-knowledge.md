# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K024 — Retry Workflow (`queue:retry`, Horizon Retry)
- **Knowledge ID:** K024
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Retrying Failed Jobs
  - Laravel Source — `Illuminate\Queue\Console\RetryCommand`

---

# Overview

Failed jobs can be retried via `queue:retry` (individual or batch), `queue:retry-batch` (retry all failed in a batch), or Horizon's retry button. The mechanism re-dispatches the job from the stored `failed_jobs` record — the original payload is extracted and dispatched to the original connection and queue. Retry does NOT reset the attempt counter — `$job->attempts()` reflects total across original and retried executions.

---

# Core Concepts

- **`queue:retry {id}`:** Retries by UUID or `all` for all failed jobs.
- **`queue:retry-batch {batchId}`:** Retries all failed jobs within a batch.
- **Horizon retry:** Dashboard button — equivalent to `queue:retry` via Horizon API.
- **No attempt reset:** Retried job continues from original attempt count. If `$tries=3` and 3 attempts used, retry gives exactly 1 more.
- **Payload preservation:** Original payload re-dispatched unchanged.

---

# When To Use

- **`queue:retry` for ad-hoc recovery:** Run manually after investigating failure cause.
- **Horizon retry for operational convenience:** Quick button click during incident response.
- **Automated retry pipelines:** Only for well-understood transient failures.

---

# When NOT To Use

- Retrying without fixing the underlying cause — same exception, immediate re-failure.
- `queue:retry all` on large `failed_jobs` table — dispatches thousands of jobs at once.
- Jobs with expired `retryUntil()` — retried job fails immediately with "time has passed."

---

# Best Practices

- **Investigate before retrying.** If the underlying cause isn't fixed, the job fails again immediately — wasting worker time. *Why: The retry mechanism re-dispatches the exact same payload — if the exception is structural (missing data, invalid state), it will throw the same exception again.*
- **Be aware that attempts counter does not reset.** A job that failed after 3 attempts with `$tries=3` gets only 1 more attempt on retry. *Why: The attempt counter is stored in the payload. When re-dispatched, the payload still shows 3 attempts — the next execution is attempt 4, which exceeds `$tries=3` and fails immediately.*
- **Test a single retry before retrying all.** If the single retry succeeds, retrying the rest is safe. If it fails, investigate first. *Why: A single retry reveals whether the underlying issue is resolved. Retrying all blindly can flood the queue with immediately-failing jobs.*
- **Consider payload age.** A job that failed 30 days ago may reference data that no longer exists. *Why: The payload stores model IDs at dispatch time — after 30 days, the corresponding DB records may have been deleted or archived.*

---

# Performance Considerations

- Retrying many jobs at once can flood the queue — use specific IDs.
- Each retry dispatches a new queue job — same cost as new dispatch.
- `queue:retry-batch` re-dispatches only the batch's failed jobs, preserving batch context.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming retry resets attempt count | Not documented behavior | Job fails immediately on retry (exceeds $tries) | Account for existing attempts |
| `queue:retry all` without filtering | Convenience | Floods queue with hundreds/thousands of jobs | Retry specific IDs first |
| Retrying without investigation | Urgency | Same exception, same failure | Investigate root cause first |
| Ignoring payload age | Old failures | Missing data causes re-failure | Skip very old failures |

---

# Related Topics

- **K016 Failure Taxonomy (K016)** — Where retry fits in state machine
- **K020 failed_jobs Storage (K020)** — Source of retry data
