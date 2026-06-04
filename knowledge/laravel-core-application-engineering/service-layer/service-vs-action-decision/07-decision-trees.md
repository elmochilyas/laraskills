# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service vs Action Decision
**Generated:** 2026-06-03

---

# Decision Inventory

* Service Pattern vs Action Pattern for Business Logic Organization
* Starting with Services vs Starting with Actions
* Service-Only vs Action-Only vs Combined Approach
* Action Calling Services vs Service Calling Actions

---

# Architecture-Level Decision Trees

---

## Decision 1: Service Pattern vs Action Pattern for Business Logic Organization

---

## Decision Context

Whether to organize business logic into multi-method service classes (services) or single-method action classes (actions).

---

## Decision Criteria

* Whether multiple related operations share dependencies
* Whether the operation needs isolated testing
* Whether the operation is called from multiple entry points

---

## Decision Tree

Are there multiple related operations that share dependencies?
↓
YES → Service — constructor-injected dependencies shared across methods; DRY
NO → Is the operation a single, standalone business operation?
    ↓
    YES → Is the operation called from multiple entry points (HTTP, CLI, queue)?
        ↓
        YES → Action — reusable single operation with its own test class
        NO → Does the operation share dependencies with other operations?
            ↓
            YES → Service — shared dependencies make a service worthwhile
            NO → Action — single operation with no shared context; action is simpler
NO → Is the operation complex enough to warrant its own file (20+ lines)?
    ↓
    YES → Action — complex operations benefit from isolation and focused tests
    NO → Service — simple operations can coexist in a service class

---

## Rationale

Services group related operations with shared dependencies. Actions isolate single operations for reuse and testability. The two patterns are complementary. The decision is contextual: default to services for entity-centric grouping; extract to actions when an operation becomes complex, reused, or needs isolated testing.

---

## Recommended Default

**Default:** Service pattern. Extract to action when: operation is complex, called from multiple entry points, or needs isolated testing.
**Reason:** Services provide organizational structure. Actions are for operations that outgrow the service context.

---

## Risks Of Wrong Choice

* Service for single operation: `UserService` with one method `register()` — should be an action
* Action for every operation: 50 action files for a 10-entity app — excessive file proliferation; no organizational grouping
* Service with 40 methods: God service — impossible to test, navigate, or maintain
* Action calling another action: Action composition without a coordinator — orchestration belongs in a service

---

## Related Rules

* Enforce Start with Services, Extract to Actions
* Enforce Service Calls Action (Not Action Calls Service)

---

## Related Skills

* Choose Service Pattern for Related Operations with Shared Dependencies
* Choose Action Pattern for Single, Reusable, or Complex Operations

---

---

## Decision 2: Starting with Services vs Starting with Actions

---

## Decision Context

Whether to create a service class as the default or create action classes as the default when adding new business logic.

---

## Decision Criteria

* Whether the team prefers organization over file proliferation
* Whether the codebase is new (no existing patterns) or established
* Whether the operation is likely to grow in complexity

---

## Decision Tree

Is this a new codebase with no established pattern?
↓
YES → Start with services — default to service organization; extract actions when needed
NO → Does the existing codebase already use services or actions?
    ↓
    YES → Follow the existing pattern — consistency trumps pattern choice
    NO → Start with services — services are the safer default for Laravel
YES → Is the operation likely to grow (more entry points, more complexity)?
    ↓
    YES → Start with services — a service can accommodate growth; extracting from service to action is easier than reorganizing actions into a service later
    NO → Is the operation a simple, single-purpose operation?
        ↓
        YES → Action — simple operations don't need a service; an action is sufficient
        NO → Service — uncertain operations benefit from the flexibility of a service
NO → Does the team prefer smaller files with single responsibilities?
    ↓
    YES → Actions — but be aware of file proliferation risk
    NO → Services — grouping related operations in one file

---

## Rationale

Starting with services and extracting to actions is the recommended workflow. Services provide a "home" for related operations. Extracting an action from a service is a clean refactoring — the action gets its own file, the service delegates to it. Starting with actions and later needing a service requires creating a new service and moving methods — more disruptive.

---

## Recommended Default

**Default:** Start with services. Extract to actions when the operation demonstrates need.
**Reason:** Services are the organizational unit. Extracting actions is cleaner than composing services from existing actions.

---

## Risks Of Wrong Choice

* Start with actions: 50 files with no grouping; difficult to find related operations
* Start with services and never extract: 40-method god services; never decomposed
* Start with actions and switch to services: All action calls must be refactored to service calls; disruptive and risky
* Start with services and extract too early: 5-method service with 4 extracted actions — unnecessary indirection

---

## Related Rules

* Enforce Start with Services, Extract to Actions
* Enforce Service Calls Action (Not Action Calls Service)

---

## Related Skills

* Choose Service Pattern for Related Operations with Shared Dependencies
* Choose Action Pattern for Single, Reusable, or Complex Operations

---

---

## Decision 3: Service-Only vs Action-Only vs Combined Approach

---

## Decision Context

Whether to use only services, only actions, or both patterns together in the codebase.

---

## Decision Criteria

* Whether the application has a mix of simple and complex operations
* Whether the codebase size justifies both patterns
* Whether the team is comfortable with pattern selection decisions

---

## Decision Tree

Is the application small (<20 business operations)?
↓
YES → Service-only — simplicity; extract actions only if an operation clearly needs it
NO → Does the application have a mix of simple CRUD and complex business logic?
    ↓
    YES → Combined approach — services for CRUD/entity grouping; actions for complex/reused operations
    NO → Does the application uniformly have complex operations only?
        ↓
        YES → Action-only — each operation is complex enough to warrant its own file
        NO → Combined approach — most applications benefit from both patterns
YES → Is the team experienced with both patterns?
    ↓
    YES → Combined approach — experienced teams know when to use each
    NO → Is the team experienced with service pattern but not actions?
        ↓
        YES → Service-only + gradual action adoption — introduce actions slowly as team matures
        NO → Start with one pattern (services) — avoid confusing the team with two patterns
NO → Does the team have strong opinions or standards?
    ↓
    YES → Follow the team standard — consistency is more important than which pattern
    NO → Combined approach — default recommendation for most Laravel applications

---

## Rationale

Both patterns are valid and complementary. Service-only or action-only are extreme positions that work in specific contexts but are not optimal for most applications. The combined approach uses services for organizational grouping and actions for complex or reused operations. This provides structure without sacrificing isolation.

---

## Recommended Default

**Default:** Combined approach — services for entity/capability grouping; actions for complex or reused operations.
**Reason:** Services provide organization. Actions provide isolation. Most applications need both.

---

## Risks Of Wrong Choice

* Service-only (40 methods): Unmaintainable god services; merge conflicts on the same file
* Action-only (100 files): No organizational structure; operations scattered across files with no grouping
* Combined without guidance: Inconsistent — some operations in services, some in actions, no clear criteria
* Service-only for simple apps: 10 services with 2 methods each — 5 of those should be actions

---

## Related Rules

* Enforce Start with Services, Extract to Actions
* Enforce Service Calls Action (Not Action Calls Service)

---

## Related Skills

* Choose Service Pattern for Related Operations with Shared Dependencies
* Choose Action Pattern for Single, Reusable, or Complex Operations

---

---

## Decision 4: Action Calling Services vs Service Calling Actions

---

## Decision Context

Whether actions can call services, or services call actions, or they operate independently.

---

## Decision Criteria

* Whether the dependency direction is clear (layered architecture)
* Whether circular dependency is a risk
* Whether the action needs to coordinate multiple actions

---

## Decision Tree

Does the action need to call other actions as part of its operation?
↓
YES → WRONG — actions should NOT orchestrate; this is service responsibility
    ↓
    YES → Move orchestration to a service — the service calls all actions; actions remain single-responsibility
    NO → The action should not need to call another action; extract orchestration to service
NO → Does the service need to call an action?
    ↓
    YES → CORRECT — service orchestrates by calling actions; this is the intended pattern
    NO → Does the action need a dependency that the service provides?
        ↓
        YES → Service calls action with the dependency; action receives it as a parameter
        NO → Does the action need to trigger the service as a side effect?
            ↓
            YES → RED FLAG — action should not trigger services; if needed, use events to decouple
            NO → Actions and services can be independent — no cross-references needed
NO → Is there a risk of circular dependency (Service A → Action B → Service A)?
    ↓
    YES → Enforce strict layering: services call actions; actions never call services
    NO → Service calls action — safe, one-directional dependency

---

## Rationale

The dependency direction must be unilateral: services call actions. Actions calling services creates circular dependency risk and inverts the layering. Services orchestrate (coordinate multiple actions); actions execute (single operation). An action that needs other actions is no longer a single-responsibility action — it's an orchestrator that should be a service.

---

## Recommended Default

**Default:** Services call actions. Actions NEVER call services.
**Reason:** Layered architecture: services orchestrate at the top, actions execute below. Inverted dependencies create circular coupling.

---

## Risks Of Wrong Choice

* Action calling service: `RegisterUserAction` calls `NotificationService` — action is now orchestrating functionality beyond its responsibility
* Action calling another action: `PlaceOrderAction` calls `ReserveInventoryAction` — should be `OrderService.place()` coordinating both actions
* Circular dependency: Service → Action → Service — impossible to test in isolation; unpredictable behavior
* Event-based decoupling needed: Action needs to trigger service behavior — use events/ listeners instead of direct calls

---

## Related Rules

* Enforce Start with Services, Extract to Actions
* Enforce Service Calls Action (Not Action Calls Service)

---

## Related Skills

* Choose Service Pattern for Related Operations with Shared Dependencies
* Choose Action Pattern for Single, Reusable, or Complex Operations
