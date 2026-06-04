# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane Tick Hooks
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Use cases for Octane tick hooks | Implementation | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Octane Tick Hooks

---

## Decision Context

Octane provides tick (periodic) and timer hooks that run within workers. Useful for maintenance tasks that must run inside the worker process.

---

## Decision Criteria

* **performance** — ticks run in worker, competing with request processing
* **architectural** — ticks run inside the worker process; share memory
* **maintainability** — tick failures can affect worker stability

---

## Decision Tree

Does the task need to run inside the worker process (cleaning shared state)?
↓
**YES** — Use Octane tick. Runs in worker context.
**NO** — Use Laravel scheduler (separate process). Safer.

---

Is the task lightweight (<100ms)?
↓
**YES** — Tick is fine. Minimal impact on request processing.
**NO** — Use scheduler. Heavy ticks block workers.

---

Is the task tolerance to failure?
↓
**High (can retry)** — Tick is fine.
**Low (must succeed)** — Use scheduler with more robust error handling.

---

What interval?
↓
**Seconds** → Tick (tick hook).
**Minutes/hours** → Scheduler (command-based). Tick only for very frequent tasks.

---

## Recommended Default

**Default:** Use Octane tick for light (<100ms), frequent (seconds) in-worker tasks. Use Laravel Scheduler for everything else.
**Reason:** Keeps worker impact minimal while enabling in-process maintenance.

---

## Risks Of Wrong Choice

* Heavy tick: blocks worker, increases response times
* Tick for non-in-process task: unnecessary complexity

---

## Related Skills

* Octane Tick Hooks
