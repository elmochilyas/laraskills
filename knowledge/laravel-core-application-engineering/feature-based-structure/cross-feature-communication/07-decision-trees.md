# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Inter-Module Communication
**Generated:** 2026-06-03

---

# Decision Inventory

* Direct Model Access vs Service Interface for Cross-Feature Data
* Event Dispatching vs Direct Service Call for Side Effects
* Shared Kernel Contract vs Duplicated Type Per Feature

---

# Architecture-Level Decision Trees

---

## Decision 1: Direct Model Access vs Service Interface for Cross-Feature Data

---

## Decision Context

Whether to access another feature's data by importing its model directly or by calling a service interface defined in the shared kernel.

---

## Decision Criteria

* Whether the consuming feature needs raw model access or specific, bounded data
* Whether the owning feature expects its model structure to change
* Whether the data access pattern is simple (single lookup) or complex (aggregation)
* Whether the consuming feature needs to be testable without the owning feature's database

---

## Decision Tree

Does the consuming feature need raw model access (all columns, all relationships)?
↓
YES → Is the model truly shared across the entire application (User, Setting)?
    YES → Use `App\Models\` — shared models are designed for application-wide access
    NO → Use a service interface in the shared kernel — hide model structure behind a contract
NO → Does the consuming feature need specific methods (findByX, getCountY)?
    YES → Define a service interface in `app/Kernel/Contracts/` — bounded, stable contract
    NO → Is the data needed for read-only purposes (reporting, display)?
        YES → Use a read-only service interface or a DTO — don't expose mutable model
        NO → Use a service interface with explicit methods

---

## Rationale

Direct model access across features creates tight coupling — Feature B can't change its schema without breaking Feature A. A service interface in the shared kernel provides a stable contract that hides implementation details. The exception is truly shared models (User, Team) that are designed for application-wide use.

---

## Recommended Default

**Default:** Always use a service interface in `app/Kernel/Contracts/` for cross-feature data access. Never import a model from another feature's namespace.
**Reason:** The interface decouples features — the owning feature can refactor internally without breaking consumers.

---

## Risks Of Wrong Choice

* Direct model access: Schema changes in one feature break all consumers — tight coupling
* Service interface for every access: Premature abstraction for simple, stable lookups
* No shared model extraction: Same model ends up in every feature — maintenance nightmare
* Interface with too many methods: Becomes a god interface — violating interface segregation

---

## Related Rules

* Never Direct Model Access Across Features
* Shared Kernel Contract Definition

---

## Related Skills

* Define Cross-Feature Communication Contracts

---

---

## Decision 2: Event Dispatching vs Direct Service Call for Side Effects

---

## Decision Context

Whether to trigger cross-feature side effects (notifications, analytics, logging) via event dispatching or by directly calling another feature's service.

---

## Decision Criteria

* Whether the side effect is required for the primary operation to be considered complete
* Whether the side effect should be synchronous or asynchronous
* Whether the side effect could fail independently of the primary operation
* Whether the side effect has multiple consumers now or is expected to grow

---

## Decision Tree

Is the side effect REQUIRED for the primary operation to be considered complete (transactional)?
↓
YES → Direct service call — not a candidate for events, must succeed for primary operation to commit
NO → Could the side effect fail without affecting the primary operation's correctness?
    YES → Event dispatching — the primary operation succeeds regardless of the side effect
    NO → Should the side effect be asynchronous (non-blocking)?
        YES → Event + queue listener — fire and forget, don't block the response
        NO → Does the side effect have 2+ consumers (email notification + Slack notification + audit log)?
            YES → Event dispatching — one event, multiple listeners, no coupling
            NO → Direct service call — simple, traceable, no event infrastructure overhead

---

## Rationale

Events decouple the primary operation from side effects. The primary operation dispatches an event and continues — listeners handle side effects independently. Direct calls are appropriate when the side effect is part of the primary operation's transaction (it must succeed for the operation to commit).

---

## Recommended Default

**Default:** Use event dispatching for cross-feature side effects that are non-critical. Use direct service calls for side effects that are part of the primary transaction.
**Reason:** Events provide loose coupling and enable multiple listeners without modifying the dispatching code. Direct calls preserve transactional integrity.

---

## Risks Of Wrong Choice

* Direct call for non-critical side effect: Notification failure blocks the user action — bad UX
* Event for critical side effect: User sees "saved" but the critical action wasn't persisted — data loss
* Synchronous event listener: Blocks the response — user waits for notification API before getting response
* Event when single consumer exists: Event infrastructure without benefit — direct call is simpler

---

## Related Rules

* Cross-Feature Event Dispatching
* Event-Driven Communication

---

## Related Skills

* Define Cross-Feature Communication Contracts

---

---

## Decision 3: Shared Kernel Contract vs Duplicated Type Per Feature

---

## Decision Context

Whether to define shared types (interfaces, DTOs, enums) in a central `app/Kernel/` directory or duplicate them across features.

---

## Decision Criteria

* Whether the type is consumed by 2+ features
* Whether the type is likely to change and need coordinated updates across features
* Whether the type represents a core domain concept vs a feature-specific implementation detail
* Whether the project is a monorepo with multiple teams

---

## Decision Tree

Is the type consumed by 2+ features?
↓
YES → Does the type represent a core domain concept (Money, Address, UserId, OrderStatus)?
    YES → Define in `app/Kernel/Contracts/` or `app/Kernel/DTOs/` — single source of truth
    NO → Is the type likely to change, requiring coordinated updates across features?
        YES → Define in shared kernel — prevents drift between feature-specific copies
        NO → Is the project a monorepo with multiple teams?
            YES → Define in shared kernel — enables team ownership boundaries
            NO → Define in shared kernel — shared types belong in a shared location
NO → Define inside the feature that owns it — shared kernel is for cross-feature types only

---

## Rationale

Duplicated types across features drift over time — one feature adds a field, another doesn't. The shared kernel is the single source of truth for cross-feature contracts. Types used by only one feature should stay inside that feature to avoid polluting the kernel with implementation details.

---

## Recommended Default

**Default:** Place cross-feature contracts and types in `app/Kernel/`. Place feature-specific types inside the feature.
**Reason:** The shared kernel is for shared concerns. Everything in it has at least two consumers. This prevents the kernel from becoming a dumping ground for types that belong inside features.

---

## Risks Of Wrong Choice

* Duplicated types across features: Drift — one feature adds a field, others don't, causing runtime errors
* Feature-specific type in kernel: Kernel pollution — every feature dumps types into the shared namespace
* No shared kernel: Features create ad-hoc communication through model access — tight coupling
* Kernel grows uncontrolled: Becomes a god directory with 100+ unrelated types

---

## Related Rules

* Shared Kernel Contract Definition
* Never Direct Model Access Across Features

---

## Related Skills

* Define Cross-Feature Communication Contracts
