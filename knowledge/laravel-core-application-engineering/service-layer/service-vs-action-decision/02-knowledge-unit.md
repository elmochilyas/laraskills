# Service vs Action Decision

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service vs Action Decision
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-01

---

## Executive Summary

The service vs action decision governs whether business logic is organized into multi-method service classes (entity-oriented, cohesive groupings) or single-method action classes (operation-oriented, isolated responsibility). This is the most active architectural debate in the Laravel community, with strong advocates on both sides and an emerging consensus that both patterns belong in the same codebase.

The engineering significance of this decision is that it determines the codebase's navigability, change isolation, and testing granularity. Services reduce file count and centralize navigation for related operations — a single `UserService` is one import, one directory entry, one mental model for all user logic. Actions improve test isolation and reduce merge conflicts — each action is a separate file, a separate test class, a separate responsibility. Getting the decision wrong causes either service bloat (a `UserService` with 40 unrelated methods) or file proliferation (hundreds of near-identical action files).

The dominant architectural schema in production Laravel applications is the Service-Action complement: services orchestrate actions. Services provide the entity grouping and shared dependency injection; actions provide isolated single-responsibility execution. A `CheckoutService` composes `ValidateCartAction`, `ChargePaymentAction`, `CreateOrderAction` — the service organizes by domain, the actions isolate by operation.

---

## Core Concepts

### Service
A multi-method class that groups related business operations. Methods are organized by entity (`OrderService` with `create()`, `cancel()`, `refund()`) or capability (`NotificationService` with `send()`, `schedule()`, `cancelDigest()`).

- Multiple public methods per class
- Shared constructor dependencies across methods
- Organized by entity or domain topic
- Coarse granularity

### Action
A single-method class (typically `handle()` or `execute()`) that performs exactly one business operation.

- One public method per class
- Each class declares its own dependencies
- Named by operation (`CreateOrder`, `ChargePayment`, `SendConfirmation`)
- Fine granularity

### Use Case
A variant of the action pattern that enforces framework-agnostic input via DTOs. The use case receives a typed DTO and returns a typed result — no HTTP classes, no Eloquent models in the signature.

- DTO input, typed result
- Framework-agnostic interface
- Runnable from HTTP, queue, CLI identically

---

## Mental Models

### Service as Library, Action as Command
A service is a library of related operations. A developer imports the service and calls the method they need. The service provides shared context (same dependencies, same entity focus). An action is a command — something to be executed, dispatched, or queued. The action carries everything it needs.

### Balloon Squeezing
The "balloon squeezing" metaphor describes a common anti-pattern: extracting business logic from a fat controller into a fat service. The problem moves but does not shrink. True architecture requires organizing the logic, not just relocating it. The service vs action decision is about organization, not extraction.

### Multiple Right Answers
There is no single correct answer — the best pattern depends on team size, domain complexity, navigation preferences, and deployment frequency. The meta-skill is recognizing which pattern fits the current context rather than applying one pattern everywhere.

---

## Internal Mechanics

### Container Resolution Difference
Services and actions resolve identically through the container — both use `Container::make()` with constructor injection. The difference is usage pattern:

- A service is resolved once per request, then multiple methods are called on the same instance.
- An action is resolved and called in one step: `app(CreateOrderAction::class)->execute($data)`.
- An orchestrated service resolves all its action dependencies at its own construction time.

The resolution cost is the same per class. The total cost differs only by the number of classes resolved — an orchestrator with 5 actions resolves 6 classes; a monolithic service resolves 1.

### Serialization for Route Caching
Actions used in route definitions (as single-action controllers) must be serializable for `route:cache`. The action string is stored as `Class@__invoke`. Services are never serialized in route definitions — controllers call services, not the route system.

### Transaction Boundary Difference
A service method typically manages its own transaction boundary. An action class typically does NOT manage its own transaction — it delegates transaction control to the orchestrator that calls it. The difference in transaction ownership affects how both patterns compose:

```php
// Service: owns its transaction
class UserService {
    public function register(array $data): User {
        return DB::transaction(function () use ($data) {
            return $this->users->create($data);
        });
    }
}

// Action: does NOT own transaction
class CreateUserAction {
    public function execute(array $data): User {
        return $this->users->create($data); // No transaction
    }
}
```

The action can be composed into any orchestrator's transaction. The service's transaction is fixed to the service method scope.

### File System Organization
Services and actions differ in filesystem footprint:

- A service with 7 methods: 1 file, 1 test file, 7 method definitions.
- Equivalent 7 actions: 7 files, 7 test files, 7 single-method definitions.

The difference is purely organizational — all files are autoloaded identically. File count does not affect runtime performance (OpCache caches compiled files) but affects navigation.

---

## Patterns

### Three Questions

**Question 1: Does this logic belong to a set of related operations on the same entity?**
- Yes → Service class. If you have `register()`, `update()`, `suspend()`, `changePassword()` on User, a `UserService` groups them naturally.
- No → Consider action class.

**Question 2: Is this a single, distinct operation that might be reused or composed?**
- Yes → Action class. `ApproveApplication` does not belong in an `ApplicationService` alongside unrelated operations. One class, one method.
- No → Consider service class grouping.

**Question 3: Does this logic need to run identically from HTTP, queue, and CLI with a framework-agnostic guarantee?**
- Yes → Use Case class with DTO. The DTO enforces that no HTTP class leaks into core logic.
- No → Service or action class is sufficient.

### Decision Matrix

| Aspect | Service Class | Action Class | Use Case Class |
|--------|--------------|--------------|----------------|
| Methods per class | Multiple | One | One |
| Organized by | Entity or domain | Single operation | Business intent |
| Naming | `UserService` | `CreateUser` / `CreateUserAction` | `RegisterUserUseCase` |
| Constructor DI | Shared across methods | One per action | One per use case |
| DTO boundary | Optional | Optional | Required |
| Reuse across entry points | Method-level | Class-level | Class-level |
| File count | Low (one per entity) | High (one per operation) | High |
| Merge conflict rate | High (shared file) | Low (isolated files) | Low |
| Growth trajectory | Accumulates methods | Stays single-method | Stays single-method |

### When to Merge Actions into a Service

1. **Cohesive grouping:** Multiple actions operate on the same entity and share context. `CreateUser`, `UpdateUser`, `SuspendUser` all touch the User entity — a `UserService` may be more navigable.

2. **Shared dependencies:** If 5 actions all inject the same `UserRepository` and `PasswordHasher`, a `UserService` reduces constructor repetition.

3. **Related call patterns:** Operations always called together or in sequence. Registration always involves creating a user + sending email + assigning roles.

4. **Navigation preference:** The team prefers entity-centric navigation ("find all user logic in one place").

### When to Split a Service into Actions

1. **Too many methods (the "fat service" threshold):** A `UserService` with 15+ unrelated methods has lost cohesive identity. Each method pulls in different dependencies.

2. **Merge conflict magnet:** In team environments, a single `OrderService` file becomes a bottleneck where multiple developers constantly merge changes.

3. **Testing pain:** When a `UserService` needs mocks for 8 different dependencies because its methods collectively touch every subsystem, it is time to split.

4. **Conditional complexity:** When a public method accumulates `if/else` branches for different sub-flows, each branch should be its own action or the branching should be at the orchestration level.

### The Service-Action Complement Pattern

Services and actions are not alternatives — they are complements. The dominant production pattern:

```
CheckoutService (orchestrates)
  ├── createOrder() calls CreateOrderAction
  ├── processRefund() calls ProcessRefundAction
  └── sendInvoice() calls SendInvoiceAction
```

The service provides the orchestration layer, entity grouping, and shared context. Actions provide isolated execution for each discrete operation.

---

## Architectural Decisions

### Why Both Patterns Coexist
The framework solves different problems at different scales. For simple CRUD on a single entity, a service with 3–5 methods is clean and navigable. For a complex workflow across multiple entities, individual actions with isolated tests are clearer. Enforcing only one pattern forces either service bloat or file proliferation. The patterns complement each other.

### Why Actions Reduce Merge Conflicts
A team of 10 developers working on user management: with a single `UserService`, 3 developers editing different methods create merge conflicts. With actions (`CreateUser`, `UpdateUser`, `SuspendUser`), each developer edits a different file. Zero merge conflicts. The cost: each developer must import the action class instead of calling `$userService->method()`.

### Why Services Reduce Navigation Overhead
A developer searching for "order logic" opens one file: `OrderService`. With actions, they must know about `CreateOrder`, `CancelOrder`, `RefundOrder`, `ShipOrder`, `InvoiceOrder` — potentially 10+ files. The service centralizes navigation but creates a single point of contention.

---

## Tradeoffs

### Service vs Action

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Service: Centralized navigation, shared DI, fewer files | Service: Bloat risk — one class absorbs unrelated methods | Monitor method count; split at 10+ methods |
| Action: Isolated responsibility, no merge conflicts, easy testing | Action: File proliferation — one file per operation | Domain subdirectories mitigate navigation issues |

### The Fat Service

| Signal | Threshold | Action |
|--------|-----------|--------|
| Public methods | 10+ | Evaluate splitting |
| Constructor deps | 5+ | Evaluate splitting |
| Unrelated methods | Not sharing dependencies | Split immediately |
| Single file merge conflicts | 2+ developers editing same service | Split by operation |

### The Action Explosion

| Signal | Threshold | Action |
|--------|-----------|--------|
| Actions per domain | 15+ | Consider merging into services |
| Duplicated DI | Same 3 deps across 5 actions | Extract to service |
| Navigation difficulty | Cannot find the right action | Improve subdirectory structure |
| Common logic forked | Same rule implemented in 2+ actions | Extract to shared service |

### The Cost Spectrum

| Decision | Wrong Choice Outcome |
|----------|---------------------|
| Chose service, needed action | Service grows to 40 methods, 15 deps, becomes impossible to test |
| Chose action, needed service | 100+ action files, duplicated logic, no central coordination |
| No decision made | Random mix of both with no consistent criteria |

---

## Performance Considerations

### Resolution Cost
Services: one resolution per request for all methods. Actions: one resolution per action. An orchestrated service calling 5 actions resolves 6 classes (service + 5 actions) vs a monolithic service resolving 1 class. The difference is negligible (~0.05ms per resolution).

### File Count Impact
Action classes increase file count. PHP OpCache caches compiled files. The per-request autoloading cost is zero after warmup. File count is not a performance concern — it is a navigation and discoverability concern.

---

## Production Considerations

### Team Consistency
The most important rule: pick a convention and document it. A codebase where some services have 3 methods and others have 30 methods, with actions inconsistently mixed in, creates confusion. The convention does not need to be "all services" or "all actions" — it should be "when to use which."

### Code Review Checklist
When reviewing a service candidate for splitting into actions:
- Does this method use different dependencies than other methods?
- Would extracting this method reduce merge conflicts?
- Is this method independently testable?
- Would this method be reusable from a different entry point?

When reviewing an action candidate for merging into a service:
- Does this action share dependencies with other actions?
- Does the existence of this action as a separate file cause navigation overhead?
- Is the action's logic so simple that a service method would be clearer?

### Evolution Path
The recommended evolution path:
1. Start with a service for each entity (simple, navigable)
2. Extract complex or unrelated operations to actions as the service grows
3. Extract shared orchestration logic back to the service when patterns emerge
4. Document the decision criteria as the codebase matures

This path avoids premature action creation (which causes file proliferation) and reactive service splitting (which is always possible when the service shows signs of bloat).

---

## Common Mistakes

### Applying One Pattern Everywhere
Why it happens: Reading a blog post about "use actions" or "use services" and applying the advice as dogma. Why it's harmful: Actions for simple CRUD create file proliferation without benefit. Services for complex workflows create god classes. Better approach: Use the three-question framework to decide per-operation whether the logic belongs in a service, an action, or a use case.

### Actions as Services with Different Names
Why it happens: Creating action classes that import the same dependencies and call the same methods as a service would. Why it's harmful: The action class is just a service with a different naming convention. It provides no architectural benefit — it's a single-method service with no orchestration advantage. Better approach: Use actions when there is a clear single-responsibility benefit (isolated testing, independent deployment, composition). Use services for cohesive multi-method groupings.

### Splitting Too Early
Why it happens: Following the action pattern before the service shows signs of bloat. Why it's harmful: Every new feature requires a new file, a new import, and a new naming decision. Simple CRUD with 3 methods becomes 3 action files with 3 sets of tests. Better approach: Start with a service. Split into actions only when the service shows concrete signs of overload (method count, dependency count, merge conflicts).

### Not Splitting When Needed
Why it happens: The service "works fine" with 15 methods, so there's no incentive to refactor. Why it's harmful: Each new feature adds one more method to an already crowded class. The constructor grows longer, tests become slower, merge conflicts increase. The refactoring cost compounds over time. Better approach: Set a threshold (10 methods, 5 deps) and proactively review before the service becomes unmanageable.

---

## Failure Modes

### The God Service
A `UserService` with 40 methods, 12 constructor dependencies, and 3000 lines. Any change to any method risks breaking unrelated functionality. Testing requires instantiating all 12 dependencies even for methods that use only 2. The service cannot be reasoned about as a unit — it is a collection of unrelated operations that happen to share the word "User."

### The Action Explosion
An `app/Actions` directory with 200+ files. Developers cannot remember which action to use and duplicate functionality. The same validation logic exists in 3 different action files because no one found the existing implementation. Navigation requires memorizing file names or extensive IDE search.

### Pattern Ambiguity
A codebase where some modules use services, some use actions, some use use cases, and no documentation explains the criteria. New developers cannot determine where to add new logic. Each team member defaults to their preferred pattern, creating a heterogeneous architecture with no consistent approach to navigation, testing, or change management.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream uses action classes exclusively. `CreateTeam`, `UpdateTeam`, `AddTeamMember`, `DeleteTeam` — each is a single-action class. There are no service classes in Jetstream. This demonstrates that the action pattern scales for framework-level code.

### Laravel Horizon
Horizon uses services for cohesive operations. `HorizonService` coordinates queue metrics, process management, and dashboard data. The framework itself uses services when multi-method grouping is appropriate, actions when single operations are needed.

### Spatie Packages
Spatie uses a pragmatic mix. Their packages tend toward service classes for internal operations and action classes for public interfaces. The choice depends on the specific package's complexity and usage pattern.

### Monica CRM
Monica CRM is a service-heavy production codebase. `ContactService`, `ActivityService`, `RelationshipService` — each has 5–15 methods organized by entity. Actions are used sparingly, for complex standalone operations that don't fit the entity structure.

### Community Consensus (2024–2026)
The dominant production pattern: services for entity grouping, actions for complex or standalone operations, use cases only when framework-agnostic execution is required. Both patterns belong in the same codebase. The choice is documented per-domain, not applied globally.

---

## Related Knowledge Units

### Prerequisites
- Service Class Design — What services are and how they work
- Action Class Design — What actions are and how they work

### Related Topics
- Service Orchestration — How services compose actions in the complement pattern
- Stateless Service Design — Statelessness requirements for both services and actions

### Advanced Follow-up Topics
- Domain vs Application Services — The DDD distinction for service layering
- Use Case Pattern — The framework-agnostic action variant
- Action Composition — How actions call other actions

---

## Research Notes

### Source Analysis
- Laravel Jetstream: `App\Actions` directory — action-only pattern from framework authors
- tegos/laravel-action-and-service-guideline — Decision matrix with dependency limits and composition rules
- QadrLabs (Gun Gun Priatna) — "Service Class, Action Class, and Use Case Class" decision framework
- Steve McDougall (Sevalla) — Service-Action complement pattern and "balloon squeezing" metaphor
- Reddit r/laravel — Extensive community debate (2020–2025) on service vs action merits

### Key Insight
The service vs action debate persists because there is no correct universal answer. The correct pattern depends on team size, domain complexity, navigation preference, and deployment frequency. The meta-skill is recognizing which pattern fits the current context — and documenting the decision criteria so the next developer can follow the same logic.

### Key Controversy
Purists on both sides argue that one pattern should be used exclusively. Proponents of actions argue that services inevitably become god classes. Proponents of services argue that actions create file proliferation without architectural benefit. The emerging consensus (2024–2026) rejects both extremes: services and actions are complementary patterns for different architectural contexts.

### Version-Specific Notes
- Action pattern: Gained popularity in Laravel 5–8, standard in Laravel 8+ via Jetstream
- Use Case pattern: Less common in Laravel, more common in DDD-focused projects
- No version-specific changes to the service/action decision in Laravel 10–13
