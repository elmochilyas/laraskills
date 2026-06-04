# Decision Trees: afterCommit

## Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** 08-async-patterns
**Knowledge Unit:** afterCommit
**Generated:** 2026-06-04

---

## Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Global Default vs Per-Dispatch afterCommit | Configuration | Design |
| 2 | afterCommit vs beforeCommit per Job | Design | Implement |
| 3 | afterCommit vs Outbox Pattern | Architectural | Design |
| 4 | Transaction Scope for afterCommit | Design | Implement |
| 5 | Immediate Dispatch vs afterCommit | Design | Implement |

---

## Decision 1: Global Default vs Per-Dispatch afterCommit

### Context
How to configure afterCommit behavior across the application.

### Decision Tree
Do >80% of your dispatches inside transactions need afterCommit?
- **YES** → Set global default to `true`
- **NO** → Continue

Is your team large enough (>5 developers) that forgetting afterCommit is likely?
- **YES** → Set global default to `true` (safety net)
- **NO** → Continue

Do you have dispatches that must run before commit (audit logs)?
- **YES** → Global default `true` with explicit `->beforeCommit()` overrides
- **NO** → Global default `true`

### Recommended Default
Set `after_commit => true` globally. Explicitly opt out with `->beforeCommit()` for the rare exceptions.

### Risks
- Global `false`: forgotten afterCommit creates race conditions
- Global `true`: developers may not know about `->beforeCommit()`, causing unnecessary delay for audit logs

---

## Decision 2: afterCommit vs beforeCommit per Job

### Context
Whether a specific job should use afterCommit or beforeCommit.

### Decision Tree
Does the job read data created/modified in the same transaction?
- **YES** → afterCommit
- **NO** → Continue

Does the job need to run even if the transaction rolls back (audit, logging)?
- **YES** → beforeCommit (runs before commit, executes regardless of commit outcome)
- **NO** → Continue

Is the job a notification that only needs an ID (no data dependency)?
- **YES** → Either — afterCommit is safe, immediate dispatch is also safe
- **NO** → afterCommit

### Recommended Default
afterCommit by default. beforeCommit for audit/monitoring jobs that must run regardless.

### Risks
- afterCommit for audit: job lost on rollback — audit gap
- beforeCommit for business logic: job runs before data is committed — reads stale data

---

## Decision 3: afterCommit vs Outbox Pattern

### Context
Which transactional messaging pattern to use.

### Decision Tree
Does the system use a single database for both application and queue data?
- **YES** → afterCommit is sufficient (simpler)
- **NO** → Continue

Does the system process jobs across multiple databases or services?
- **YES** → Outbox pattern (distributed transaction safety)
- **NO** → Continue

Is at-most-once delivery acceptable?
- **YES** → afterCommit (may lose jobs on crash before commit)
- **NO** → Outbox pattern (guaranteed delivery via database persistence)

Are jobs high-value (financial, billing)?
- **YES** → Outbox pattern (guaranteed delivery)
- **NO** → afterCommit may suffice

### Recommended Default
afterCommit for single-database systems. Outbox pattern for multi-database or guaranteed-delivery requirements.

### Risks
- afterCommit for critical jobs: loss on crash between dispatch and commit
- Outbox pattern for simple cases: unnecessary complexity, extra table, cleanup required

---

## Decision 4: Transaction Scope for afterCommit

### Context
Where to draw the transaction boundary for afterCommit dispatches.

### Decision Tree
Does the transaction include external API calls or slow operations?
- **YES** → Move external calls outside transaction, keep only DB writes inside
- **NO** → Continue

Does the transaction dispatch multiple afterCommit jobs?
- **YES** → Minimize transaction duration — workers wait for commit
- **NO** → Continue

Is the transaction wrapping a single database operation?
- **YES** → Remove transaction entirely (single statement is atomic)
- **NO** → Keep transaction

### Recommended Default
Narrow transaction scope. Only include operations that must be atomic. Keep external calls outside.

### Risks
- Too broad: long transaction delays afterCommit jobs, holds database locks
- Too narrow: no atomicity for related writes

---

## Decision 5: Immediate Dispatch vs afterCommit

### Context
Whether a specific dispatch inside a transaction should use afterCommit or dispatch immediately.

### Decision Tree
Does the job read data written in the current transaction?
- **YES** → afterCommit
- **NO** → Continue

Does the job need to execute as early as possible?
- **YES** → Immediate dispatch (no afterCommit)
- **NO** → Continue

Is the job purely diagnostic (metrics, logging, monitoring)?
- **YES** → Immediate dispatch (should run even on rollback)
- **NO** → afterCommit (safer default)

### Recommended Default
afterCommit unless the job has no dependency on transaction data AND must run immediately.

### Risks
- Immediate for dependent jobs: race condition, ModelNotFoundException
- afterCommit for diagnostic jobs: lost on rollback, missing audit trail
