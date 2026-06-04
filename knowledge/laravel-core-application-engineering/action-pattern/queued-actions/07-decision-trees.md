# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Queued Actions
**Generated:** 2026-06-03

---

# Decision Inventory

* Queued Action vs Job Wrapper Class
* Synchronous vs Asynchronous Execution
* Queue Routing — Class-Level vs Call-Site Configuration

---

# Architecture-Level Decision Trees

---

## Decision 1: Queued Action vs Job Wrapper Class

---

## Decision Context

Whether to make an action queueable using Spatie's `QueueableAction` trait or create a separate job class that calls the action.

---

## Decision Criteria

* Number of actions that need queuing
* Whether the team wants to avoid Spatie package dependency
* Whether the action needs to be both sync and async from the same call site

---

## Decision Tree

How many actions need to be queued?
↓
5+ → QueueableAction trait (Spatie) — eliminates job wrapper classes, reduces ceremony
1-2 → Manual job wrapper — avoids package dependency, simpler for few actions
NO → Does the action need to be callable both sync and async from the same call site?
    YES → QueueableAction — caller decides: `$action->execute()` vs `$action->onQueue()->execute()`
    NO → Job wrapper (always async) or keep sync
NO → Does the team already use Spatie's package?
    YES → QueueableAction — consistent with existing usage
    NO → Is the team willing to add `spatie/laravel-queueable-action` dependency?
        YES → QueueableAction
        NO → Manual job wrapper

---

## Rationale

The QueueableAction trait eliminates the traditional job wrapper class by making the action itself dispatchable. For teams queuing many actions, this reduces class count and indirection significantly. For few actions, a manual job wrapper is simpler.

---

## Recommended Default

**Default:** QueueableAction trait for teams queuing 5+ actions; manual job wrapper for 1-2 queued actions
**Reason:** At 5+ actions, the trait eliminates 5+ wrapper classes. At 1-2, the package dependency may not be justified.

---

## Risks Of Wrong Choice

* Trait for 1-2 actions: Unnecessary package dependency
* Wrappers for 20+ actions: 20+ job wrapper classes, indirection
* Hardcoded async in action: Caller cannot choose sync mode

---

## Related Rules

* Let the Caller Decide Sync vs Async Execution (05-rules.md)
* Do Not Use Queueable Actions for Operations That Must Return a Result (05-rules.md)

---

## Related Skills

* Skill: Make an Action Queueable with Spatie QueueableAction

---

## Decision 2: Synchronous vs Asynchronous Execution

---

## Decision Context

Whether to execute an action synchronously (same request, return result) or asynchronously (dispatch to queue, return void).

---

## Decision Criteria

* Whether the caller depends on the action's return value
* Whether the action is expensive or time-consuming
* Whether the action produces side effects that must be immediate

---

## Decision Tree

Does the caller depend on the action's return value for the response or subsequent operations?
↓
YES → Synchronous: `$action->execute($data)` — caller needs the result
NO → Is the action expensive or time-consuming (>200ms)?
    YES → Asynchronous: `$action->onQueue()->execute($data)` — don't block the response
    NO → Is the action a side effect (email, notification, log)?
        YES → Is the side effect critical to the user experience (must be immediate)?
            YES → Synchronous — user expects immediate feedback
            NO → Asynchronous — defer to queue for faster response
NO → Does the action need to be tested deterministically?
    YES → Synchronous in tests: `$action->execute($data)` without queue
    NO → Caller decides

---

## Rationale

The caller must decide sync vs async based on whether the result is needed and whether the action is expensive. Queuing an action whose result is needed for the response is architecturally incorrect — the caller receives void, not the result.

---

## Recommended Default

**Default:** Synchronous for actions whose result is needed; asynchronous for side effects and expensive operations
**Reason:** Sync preserves the return value contract. Async keeps responses fast for non-critical operations.

---

## Risks Of Wrong Choice

* Async for needed result: Caller gets void, cannot use the return value
* Sync for expensive operation: Blocks HTTP response for 5+ seconds
* No sync path for testing: Cannot unit-test action without queue worker

---

## Related Rules

* Let the Caller Decide Sync vs Async Execution (05-rules.md)
* Do Not Pass Non-Serializable Parameters to Queued Action Methods (05-rules.md)

---

## Related Skills

* Skill: Make an Action Queueable with Spatie QueueableAction

---

## Decision 3: Queue Routing — Class-Level vs Call-Site Configuration

---

## Decision Context

Whether to configure the target queue on the action class itself (`public string $queue = 'pdfs'`) or at the call site (`$action->onQueue('tenant-42')->execute()`).

---

## Decision Criteria

* Whether the action always routes to the same queue
* Whether the queue varies by context (per-tenant, per-caller)
* Whether the team needs centralized queue configuration

---

## Decision Tree

Does the action ALWAYS route to the same queue regardless of caller?
↓
YES → Class-level: `public string $queue = 'pdfs';`
    All dispatches of this action go to the same queue predictably
NO → Does the queue vary by caller context (tenant, priority, action type)?
    YES → Call-site fluent API: `$action->onQueue('tenant-42')->execute($data)`
    NO → Default queue is acceptable (no explicit queue needed)
NO → Are BOTH class-level and call-site configuration needed for the same action?
    YES → Choose ONE pattern — mixing causes confusion about precedence
    NO → Use the appropriate pattern for the need

---

## Rationale

Class-level configuration provides predictability — every dispatch of `GeneratePdfAction` goes to the `pdfs` queue. Fluent configuration provides flexibility — the same action can be routed to different queues depending on the caller's context. Mixing both creates confusion about which takes precedence.

---

## Recommended Default

**Default:** Class-level `$queue` for actions that always route to the same queue; fluent `onQueue()` for context-dependent routing; never both for the same action
**Reason:** Class-level is predictable and simple. Fluent API is flexible. Mixing both is confusing.

---

## Risks Of Wrong Choice

* Both class and call-site: Conflicting configuration, unpredictable routing
* Class-level for context-dependent: All callers forced to same queue regardless of context
* Fluent for single-queue action: No central configuration, each caller must remember the queue

---

## Related Rules

* Configure Predictable Queues on the Action, Context-Dependent Queues via Fluent API (05-rules.md)
* Override `queueMethod()` When Using Non-Standard Method Names (05-rules.md)

---

## Related Skills

* Skill: Make an Action Queueable with Spatie QueueableAction
