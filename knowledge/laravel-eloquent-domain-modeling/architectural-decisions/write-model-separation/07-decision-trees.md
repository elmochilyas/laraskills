# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Write Model Separation
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Command Handler vs Direct Model Mutation
* Decision 2: Model Invariants vs Handler Invariants (Where Business Rules Live)
* Decision 3: Optimistic Concurrency vs Pessimistic Locking
* Decision 4: Idempotent Handler vs Non-Idempotent Handler

---

# Architecture-Level Decision Trees

---

## Decision 1: Command Handler vs Direct Model Mutation

---

## Decision Context

Choose between routing every state mutation through a named command handler class or performing mutations directly in controllers, Blade directives, or event listeners.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the operation a trivial field update with no domain invariants (e.g., `last_viewed_at`)?
↓
YES → Direct Model Mutation (lightweight)
NO → Does the mutation involve complex transactional requirements?
    YES → Command Handler
    NO → Does the operation need auditing, replay, or throttling capability?
        YES → Command Handler
        NO → Is the operation a simple CRUD save with no business rules?
            YES → Direct Model Mutation
            NO → Command Handler

---

## Rationale

Command handlers provide a single, named entry point for each mutation, making state changes auditable, interceptable, and testable in isolation. Direct mutations scattered across controllers are invisible to auditing and cannot be monitored or replayed. However, trivial field updates like `last_viewed_at` do not justify the ceremony of a full command handler.

---

## Recommended Default

**Default:** Command handler for every meaningful state mutation. Direct mutation only for trivial field updates with no domain invariants.
**Reason:** Named command handlers make every state change visible. The overhead is minimal for meaningful mutations but unnecessary for simple timestamp updates.

---

## Risks Of Wrong Choice

* Direct mutations everywhere: state changes scattered and hard to audit, no logging/replay, no single point for transactional consistency
* Command handler for trivial updates: ceremony without value, class explosion for simple field sets

---

## Related Rules

* Rule 1: Route every state mutation through a command handler (`05-rules.md`)
* Rule 6: Always wrap command handlers in transactions (`05-rules.md`)

---

## Related Skills

* Create a Command Handler with Transaction (`06-skills.md` Skill 1)

---

## Decision 2: Model Invariants vs Handler Invariants

---

## Decision Context

Decide whether business rules and state transition guards should be enforced in the domain model's methods or in the command handler.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the invariant involve state from a single model?
↓
YES → Push invariant to the model method
NO → Does the invariant involve state from multiple models that don't naturally belong to any single one?
    YES → Keep in the handler (or extract a domain service)
    NO → Is the rule a pure domain concept (e.g., "order can't be cancelled after shipping")?
        YES → Push invariant to the model method
        NO → Evaluate: does it reference domain state at all?

---

## Rationale

Invariants in command handlers are invisible when reasoning about the domain model. When the business rule changes, the developer must find every handler that duplicates the rule. Model methods provide a single authoritative enforcement point. Cross-model invariants that don't belong to any single model are the exception.

---

## Recommended Default

**Default:** Push all invariants to the model method. If the handler contains `if` statements about domain state, that logic belongs in the model.
**Reason:** Model methods are the single authoritative enforcement point for business rules. Duplicating rules across handlers creates maintenance hazards.

---

## Risks Of Wrong Choice

* Invariants in handler: hidden domain rules, duplication across handlers, rule changes require hunting through multiple files
* Invariants in model for cross-model rules: model gains knowledge of other models it shouldn't own

---

## Related Rules

* Rule 2: Push invariants to the model, not the command handler (`05-rules.md`)
* Rule 8: Write models must not have public query methods (`05-rules.md`)

---

## Related Skills

* Create a Command Handler with Transaction (`06-skills.md` Skill 1)

---

## Decision 3: Optimistic Concurrency vs Pessimistic Locking

---

## Decision Context

Choose between optimistic concurrency (version column) and pessimistic locking (`lockForUpdate()`) to prevent lost updates from concurrent writes.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the operation financial (payments, refunds, balance transfers)?
↓
YES → Pessimistic Locking (`lockForUpdate()`) + transaction
NO → Is contention expected to be high on the specific aggregate?
    YES → Pessimistic Locking
    NO → Are lost updates unacceptable?
        YES → Optimistic Concurrency (version column)
        NO → Neither — low contention, acceptable to last-write-wins

---

## Rationale

Pessimistic locking prevents concurrent access entirely by locking the row, which is necessary for financial operations where conflicts must be prevented, not just detected. Optimistic concurrency detects conflicts after they happen and requires the caller to retry, making it suitable for most business operations where conflicts are rare.

---

## Recommended Default

**Default:** Optimistic concurrency with a version column for most write models. Pessimistic locking for financial operations.
**Reason:** Optimistic concurrency scales better because readers are never blocked. Pessimistic locking is safer for financial operations where any conflict is unacceptable.

---

## Risks Of Wrong Choice

* Optimistic for financial: conflicts detected but not prevented, retry logic needed, risk of double-processing
* Pessimistic for everything: database lock contention, deadlocks under high concurrency, poor scalability
* No concurrency control: silent data loss from concurrent writes

---

## Related Rules

* Rule 3: Use optimistic concurrency with a version column for write models (`05-rules.md`)

---

## Related Skills

* Implement Optimistic Concurrency for Writes (`06-skills.md` Skill 2)
* Create a Command Handler with Transaction (`06-skills.md` Skill 1)

---

## Decision 4: Idempotent Handler vs Non-Idempotent Handler

---

## Decision Context

Determine whether a command handler must be idempotent (safe to execute multiple times) or can assume single-execution semantics.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the command have financial side-effects (charges, refunds, transfers)?
↓
YES → Idempotent (idempotency key required)
NO → Can the command be dispatched from a queue with retries?
    YES → Idempotent (queue redelivery can cause duplicates)
    NO → Can the command be triggered by user double-clicks or network retries?
        YES → Idempotent
        NO → Is the command inherently idempotent (e.g., "set user preferences")?
            YES → Non-idempotent (last-write-wins is fine)
            NO → Non-idempotent (low risk of duplicates)

---

## Rationale

Network retries, queue redeliveries, and user double-clicks can cause the same command to be processed multiple times. Without idempotency, duplicates cause double charges, duplicate orders, or duplicate notifications. Commands where last-write-wins is safe (setting preferences) do not need idempotency keys.

---

## Recommended Default

**Default:** Make all queue-dispatched and financial command handlers idempotent. Non-idempotent only for commands where duplicate execution is safe.
**Reason:** Idempotency prevents catastrophic duplicate side-effects. The cost is small (idempotency key table/cache + check) but the protection is significant.

---

## Risks Of Wrong Choice

* Non-idempotent financial commands: double charges, duplicate orders, customer dissatisfaction, support overhead
* Idempotent for everything: unnecessary storage and check overhead for commands where duplicates are harmless

---

## Related Rules

* Rule 4: Design command handlers to be idempotent (`05-rules.md`)

---

## Related Skills

* Add Idempotency to a Command Handler (`06-skills.md` Skill 3)
