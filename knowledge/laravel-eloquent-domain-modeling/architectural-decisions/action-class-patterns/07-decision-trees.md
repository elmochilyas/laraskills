# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Action Class Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Action Class vs Model Method vs Inline Controller Logic
* Decision 2: Sync Action vs Queued Action
* Decision 3: Single Action vs Sub-Action Composition
* Decision 4: Constructor Injection vs Container Resolution Inside Method

---

# Architecture-Level Decision Trees

---

## Decision 1: Action Class vs Model Method vs Inline Controller Logic

---

## Decision Context

Choose where to place orchestration logic: a dedicated action class, a model method, or inline within a controller.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the operation involve two or more aggregate roots?
↓
YES → Does the operation have external side-effects (email, queue, API)?
    YES → Action Class
    NO → Action Class
NO → Is the operation a simple CRUD save under 3 lines?
    YES → Inline Controller
    NO → Does the operation only read or mutate a single model's own state?
        YES → Model Method
        NO → Action Class

---

## Rationale

Action classes provide a named, testable boundary for cross-aggregate orchestration. Model methods are sufficient when the operation stays within a single model's responsibility. Inline controller logic is acceptable only for trivial CRUD saves where an action would add ceremony without benefit.

---

## Recommended Default

**Default:** Action Class when cross-aggregate. Model Method for single-model operations. Inline Controller only for trivial saves under 3 lines.
**Reason:** Action classes enforce single responsibility, make dependencies explicit, and enable independent testing. Premature action extraction for trivial operations creates unnecessary indirection.

---

## Risks Of Wrong Choice

* Choosing inline for cross-aggregate logic: untestable orchestration, fat controllers, hidden transaction gaps
* Choosing action for trivial CRUD: class explosion, unnecessary indirection for simple saves
* Choosing model method for cross-aggregate: model accumulates responsibilities beyond its aggregate boundary

---

## Related Rules

* Rule 6: Limit actions to one use case and under 100 lines (`05-rules.md`)
* Rule 7: Never pass raw request input to actions (`05-rules.md`)

---

## Related Skills

* Create an Action Class (`06-skills.md` Skill 1)
* Refactor Inline Controller Logic into an Action (`06-skills.md` Skill 2)

---

## Decision 2: Sync Action vs Queued Action

---

## Decision Context

Determine whether an action should execute synchronously in the request lifecycle or be dispatched to a queue for async processing.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the caller need the action's return value immediately?
↓
YES → Sync Action
NO → Does the action involve external I/O >500ms?
    YES → Queued Action
    NO → Does the action perform file processing, email sending, or API calls?
        YES → Queued Action
        NO → Sync Action

---

## Rationale

Queued actions return control to the user quickly and survive request timeouts. Synchronous actions are simpler but block the HTTP response. The primary driver is latency tolerance: if the caller must wait for the result, keep it sync; otherwise, queue.

---

## Recommended Default

**Default:** Sync action for immediate-consistency operations. Queued action for I/O-bound work >500ms or fire-and-forget side-effects.
**Reason:** Synchronous actions are simpler to reason about and test. Queues introduce eventual consistency and require worker infrastructure, so they should only be used when the latency benefit is meaningful.

---

## Risks Of Wrong Choice

* Choosing sync for slow I/O: request timeouts, poor user experience, worker processes blocked
* Choosing queue for fast operations: unnecessary infrastructure complexity, delayed results, eventual consistency issues
* Missing return values: caller cannot act on queued action's result

---

## Related Rules

* Rule 5: Dispatch domain events with `DB::afterCommit()` (`05-rules.md`)
* Rule 6: Limit actions to one use case and under 100 lines (`05-rules.md`)

---

## Related Skills

* Implement a Queued Action with Proper Serialization (`06-skills.md` Skill 3)
* Create an Action Class (`06-skills.md` Skill 1)

---

## Decision 3: Single Action vs Sub-Action Composition

---

## Decision Context

Decide whether to implement a use case as one monolithic action class or decompose it into smaller sub-actions that the main action composes via constructor injection.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the action exceed 100 lines?
↓
YES → Extract sub-operations into child actions
NO → Does the action coordinate 3+ distinct responsibilities?
    YES → Extract sub-operations into child actions
    NO → Does the action have multiple steps that could be reused elsewhere?
        YES → Extract those steps into separate actions
        NO → Keep as single action

---

## Rationale

Sub-action composition preserves single responsibility, enables independent testing of each step, and allows reuse. A monolithic action is acceptable when the logic is linear, short, and specific to one use case with no reusable sub-steps.

---

## Recommended Default

**Default:** Single action up to 100 lines. Decompose into sub-actions when exceeding that or when steps need independent reuse.
**Reason:** Premature decomposition creates unnecessary classes and indirection. Deferred decomposition is cheap because sub-actions follow the same constructor injection pattern and can be extracted via simple refactoring.

---

## Risks Of Wrong Choice

* Monolithic action: hard to test, single reason to change becomes multiple reasons, reusable steps are duplicated
* Excessive sub-actions: class explosion, call chain overhead, cognitive load from navigating many small files
* Wrong decomposition boundary: sub-actions that are too coupled or too granular

---

## Related Rules

* Rule 6: Limit actions to one use case and under 100 lines (`05-rules.md`)

---

## Related Skills

* Create an Action Class (`06-skills.md` Skill 1)
* Refactor Inline Controller Logic into an Action (`06-skills.md` Skill 2)

---

## Decision 4: Constructor Injection vs Container Resolution Inside Method

---

## Decision Context

Choose how an action obtains its dependencies: through the constructor (injected by the container) or via `app()`/`resolve()` calls inside the method body.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Can the dependency be known at construction time?
↓
YES → Is the dependency always needed (not conditionally resolved)?
    YES → Constructor injection
    NO → Does the dependency depend on runtime values?
        YES → Inject a factory in constructor; use factory at runtime
        NO → Constructor injection
NO → Inject a factory in constructor; resolve conditionally at runtime

---

## Rationale

Constructor injection makes all dependencies explicit in the class signature, enables mocking in tests, and allows static analysis to detect missing dependencies. Container calls inside method bodies create hidden coupling that cannot be mocked and bypasses PHPStan's dependency tracking.

---

## Recommended Default

**Default:** Constructor injection for all dependencies. Use factory pattern only when a dependency is truly conditional on runtime data.
**Reason:** Constructor injection is the most testable and analyzable approach. The factory exception handles the rare case where the class doesn't know which implementation it needs until method invocation time.

---

## Risks Of Wrong Choice

* Using `app()` inside methods: untestable code, hidden dependencies, no static analysis detection, coupling to service container
* Over-injection in constructor: many constructor parameters for rarely-used dependencies; consider splitting the class

---

## Related Rules

* Rule 2: Never use `app()` or `resolve()` inside action methods (`05-rules.md`)
* Rule 7: Never pass raw request input to actions (`05-rules.md`)

---

## Related Skills

* Create an Action Class (`06-skills.md` Skill 1)
* Refactor Inline Controller Logic into an Action (`06-skills.md` Skill 2)
