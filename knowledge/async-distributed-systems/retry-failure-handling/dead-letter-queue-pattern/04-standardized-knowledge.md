# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K023 — Dead-Letter Queue Pattern and Poison Messages
- **Knowledge ID:** K023
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - RabbitMQ Docs — DLX
  - AWS SQS Docs — Redrive Policy

---

# Overview

The dead-letter queue (DLQ) pattern isolates permanently failed jobs into a separate queue for manual inspection, delayed retry, or automated triage. Laravel has no built-in DLQ — it uses `failed_jobs` instead. A true DLQ is implemented at the application level by dispatching to a dedicated queue in `failed()`. Poison messages — jobs that fail repeatedly and burn retry attempts — must be detected early and redirected to prevent worker starvation.

---

# Core Concepts

- **DLQ:** Separate queue for permanently failed jobs — preserves message structure for reprocessing.
- **Poison message:** A job that can never succeed — keeps failing, consuming retry attempts each time.
- **Application-level DLQ:** Implemented in `failed()` by dispatching to a `dead-letter` queue.
- **Infrastructure-level DLQ:** RabbitMQ (DLX) and SQS (Redrive Policy) move messages automatically after `maxReceiveCount`.

---

# When To Use

- **Application-level DLQ:** Full control, any driver (Redis), per-job custom routing.
- **Infrastructure-level DLQ:** Using RabbitMQ/SQS, broker configuration meets needs.
- **Poison message detection:** Always implement — even without formal DLQ, detect early repeated failures.

---

# When NOT To Use

- `failed_jobs` table alone may be sufficient for low failure volume.
- DLQ without monitoring — just a second place for jobs to die silently.
- Infinite DLQ reprocessing loop — re-dispatch without backoff creates cycles.

---

# Best Practices

- **Always implement poison message detection.** Jobs that fail on first retry in <1 second (no real processing) should be detected early. *Why: A poison message burns 3-10 retry attempts before failing permanently — each attempt wastes worker time, queue capacity, and log space. Early detection saves all of these.*
- **Monitor DLQ depth and oldest message age.** A growing DLQ indicates systemic failure; a flat DLQ may mean the DLQ itself isn't working. *Why: DLQ is the last resort for failed jobs — if it's growing, the root cause isn't fixed. If it's always empty, either nothing fails or the DLQ routing is broken.*
- **Implement DLQ reprocessing with cool-off period.** A scheduled job reads from DLQ and re-dispatches after a delay (e.g., 1 hour) — not immediately. *Why: Immediate reprocessing creates a tight DLQ→reprocess→fail→DLQ loop. A cool-off period allows the underlying issue (e.g., API outage) to resolve before retrying.*

---

# Performance Considerations

- Application-level DLQ: one additional dispatch per failure — negligible.
- DLQ workers need dedicated capacity — backlog delays manual triage.
- Infrastructure DLQ routing happens at broker level — no application overhead.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No poison detection | Not checking retry timing | Every retry consumed for doomed jobs | Detect early repeated failures |
| DLQ without monitoring | Out of sight, out of mind | Silent failures pile up | Monitor depth + age |
| Infinite reprocessing loop | No backoff in DLQ→queue cycle | Endless cycle burning resources | Add cool-off period |
| Using `failed_jobs` as DLQ | Confusing storage with queue | Can't route/prioritize like queue messages | Use a real queue for DLQ |

---

# Examples

```php
class ApiJob implements ShouldQueue
{
    public function failed(Throwable $e): void
    {
        // Application-level DLQ: dispatch to dead-letter queue
        DeadLetterJob::dispatch($this->payload)->onQueue('dead-letter');
    }
}
```

---

# Related Topics

- **K016 Failure Taxonomy (K016)** — Terminal failure → DLQ
- **K024 Retry Workflow (K024)** — DLQ reprocessing
