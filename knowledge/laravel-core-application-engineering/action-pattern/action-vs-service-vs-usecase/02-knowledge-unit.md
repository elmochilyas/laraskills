# Action vs Service vs Use Case

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Actions Pattern
- **Knowledge Unit:** Action vs Service vs Use Case
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-02

---

## Executive Summary

The Laravel ecosystem has three distinct architectural patterns for organizing business logic: Services (multi-method, entity-oriented), Actions (single-method, operation-oriented), and Use Cases (framework-agnostic, DTO-contracted). These are not competing alternatives — they form a spectrum of granularity and coupling. Most production Laravel codebases use all three, applying each where its tradeoffs fit the operation's complexity, reuse requirements, and framework coupling tolerance.

The engineering significance of the three-way distinction is that it provides an explicit vocabulary for architectural decisions. A team that can say "this is a service because it groups related entity operations" or "this is a use case because it must run from HTTP and CLI identically" has made the decision criteria explicit. A team that applies one pattern everywhere (all actions or all services) forfeits the flexibility to match the pattern to the operation.

---

## Core Concepts

### The Three-Way Spectrum

```
                    Action                    Use Case
                     │                          │
    Service          │                          │
  (entity group)  (single operation)    (framework-agnostic)
      │                  │                          │
  More coupled ───────────────────────────────── Less coupled
  Fewer files ──────────────────────────────────── More files
  Shared DI ──────────────────────────────── Independent DI
  Framework-aware ────────────────────── Framework-agnostic
```

Each pattern occupies a position on the spectrum between coupling and decoupling, between file economy and file proliferation, between shared context and independent context.

### Distinguishing Dimensions

| Dimension | Service | Action | Use Case |
|-----------|---------|--------|----------|
| Methods per class | Multiple (3-15+) | One | One |
| Organized by | Entity or domain | Single operation | Business intent |
| Constructor DI | Shared across methods | One per action | One per use case |
| DTO boundary | Never | Optional | Required |
| Framework imports | Expected | Possible | Forbidden in logic |
| Reuse across entry points | Method-level | Class-level | Class-level |
| File count | Low | Medium | High (w/ DTOs) |

### The DTO Boundary as Key Differentiator

The presence of a DTO input boundary is the single most important architectural signal. Its presence distinguishes a Use Case from an Action. Its absence distinguishes a Service from both.

- **No DTO boundary**: The method accepts loose input (array, Model, Request). Framework coupling is possible. Service or Action.
- **Optional DTO boundary**: The method may accept a DTO or an array. The choice is per-call. Action.
- **Required DTO boundary**: The method accepts only a typed DTO. Framework-agnostic input. Use Case.

---

## Mental Models

### The Three-Tier Decision Framework
When organizing business logic, ask three questions in order:

1. **Cohesion**: Does this operation belong to a group of related operations on the same entity? Service.
2. **Granularity**: Is this a single, distinct operation that may be reused or composed? Action.
3. **Portability**: Does this operation need to run identically across entry points with framework-agnostic contracts? Use Case.

If the answer to all three is "yes," choose the most specific pattern (Use Case). If only the first is "yes," choose Service. If only the first two are "yes," choose Action.

### The Cost Curve
The cost of each pattern increases as you move from Service to Use Case:

- **Service**: Low cost — one file, shared DI, one test file.
- **Action**: Medium cost — one file per operation, no DI sharing, dedicated test.
- **Use Case**: High cost — one file for logic + one DTO per input + one result DTO + one interface per dependency.

The cost is justified when the pattern's benefits are realized. A Use Case that runs from 3 entry points pays for its DTO overhead. A Use Case that runs from 1 entry point does not.

### The Balloon Squeezing Metaphor (Extended)
Extracting business logic from a service into actions does not reduce complexity — it redistributes it. The "balloon squeezing" metaphor (pressure moves but does not shrink) applies at the codebase level: moving logic from 1 service to 10 actions moves the cognitive load from "understanding one file" to "navigating 10 files." The Use Case pattern squeezes the balloon further by adding DTOs and interfaces. The total complexity is constant — only its distribution changes.

---

## Internal Mechanics

### Dependency Resolution Across Patterns
All three patterns resolve through the same container mechanism (`Container::make()`):

- **Service**: Resolved once per request. Multiple methods called on the same instance.
- **Action**: Resolved and called in one step. Fresh instance per call.
- **Use Case**: Resolved and called in one step (like Action). Has interface dependencies that require service provider binding.

The resolution mechanism is identical. The difference is in what is bound and how the resolved instance is used.

### Serialization Behavior
- **Service**: Never serialized. Services are resolved from the container per request.
- **Action**: Not serialized when called synchronously. When queued (via Spatie), the class name is serialized, not the instance.
- **Use Case**: Same as Action. Can be queued if the DTOs are serializable.

### Transaction Boundary Ownership
- **Service**: Typically owns its transaction boundary. `DB::transaction()` is inside the service method.
- **Action**: Typically does NOT own its transaction. Delegates to orchestrator.
- **Use Case**: Same as Action — does not own transaction. The entry point (controller/command/worker) or a service orchestrator manages the transaction.

---

## Patterns

### Pure Service Pattern
- **When**: All operations share dependencies and entity context.
- **Why**: Maximum file economy; one import for all user operations.
- **Limit**: 10+ methods or 5+ unrelated constructor dependencies.

### Pure Action Pattern
- **When**: Operation is a single unit of work, independently callable.
- **Why**: Maximum isolation; no merge conflicts; single responsibility.
- **Limit**: 15+ per domain.

### Pure Use Case Pattern
- **When**: Operation must run from multiple entry points with framework-agnostic contracts.
- **Why**: Maximum portability and contractual clarity.
- **Limit**: Only justified for complex multi-entry-point operations.

### Service-Action Complement (Dominant Production Pattern)
Services for entity grouping, actions for individual operations, services orchestrate actions.

- **When**: Entity grouping benefits from central navigation but operations have distinct responsibilities.
- **Why**: Best of both worlds — centralized navigation with isolated execution.
- **Tradeoffs**: Double class count (service + each action).

### Service-Action-UseCase Hybrid
All three patterns coexist in the same codebase, each used where it fits.

- **When**: The codebase has grown to justify specialization.
- **Why**: Each operation uses the pattern that fits its complexity and reuse requirements.
- **Tradeoffs**: Requires team-wide understanding of when to use which pattern.

---

## Architectural Decisions

### When to Choose Each Pattern

**Choose Service when:**
- Operations naturally group around an entity (user, order, product)
- Constructor dependencies are shared across operations
- The team prefers centralized navigation
- File count minimization is a priority
- Operations are always called from the same entry point

**Choose Action when:**
- The operation is a single distinct unit
- The operation might be reused from multiple contexts
- Test isolation is a priority
- Merge conflicts in shared service files are a problem
- The operation has unique dependencies

**Choose Use Case when:**
- The same operation must run from HTTP, queue, and CLI identically
- Framework-agnostic contracts are required by architectural policy
- The domain is complex enough to justify DTO overhead
- The team has 10+ developers who benefit from strict boundaries
- The project uses Hexagonal / Clean Architecture explicitly

### Evolution Path
Start simple, evolve as patterns emerge:

1. **Start with Services**: Entity-oriented services for all operations.
2. **Extract to Actions**: When a service reaches 10+ methods or 5+ deps, extract distinct operations to actions.
3. **Introduce Use Cases**: When an action must run from multiple entry points, upgrade it to a Use Case by adding DTOs and interface dependencies.
4. **Document the Convention**: Write down when to use each pattern as the codebase matures.

### Pattern Consistency Across Teams
The pattern choice must be consistent within a domain. A billing domain should not have some operations as services and others as actions with no criteria. However, different domains can use different patterns — simple CRUD domains may use services, while complex workflow domains use actions or Use Cases.

---

## Tradeoffs

### Three-Way Tradeoff Matrix

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Service: Centralized navigation, shared DI, fewer files | Service: Bloat risk — one class absorbs unrelated operations | Monitor method count; split at 10+ methods |
| Action: Isolated responsibility, no merge conflicts, easy testing | Action: File proliferation — one file per operation | Domain subdirectories mitigate navigation issues |
| Use Case: Framework-agnostic, DTO-contracted, multi-entry-point | Use Case: Boilerplate — DTOs, interfaces, mapping code | Use only when multiple entry points actually exist |

| Decision | Right Choice Signal | Wrong Choice Outcome |
|----------|-------------------|---------------------|
| Service vs Action | Are operations on the same entity with shared deps? | Service: grows to 40 methods, 15 deps, impossible to test. Action: 100+ files, duplicated logic, no central coordination. |
| Action vs Use Case | Does the operation need framework-agnostic contracts for multi-entry-point execution? | Action: framework coupling blocks queue/CLI reuse. Use Case: unnecessary DTO boilerplate for single-entry-point operations. |
| No decision made | — | Random mix of all three with no consistent criteria |

---

## Performance Considerations

### Resolution Cost Comparison
Service: one resolution per request for all methods. Action: one resolution per call. Use Case: one resolution plus interface dispatch. The difference between the three patterns in resolution cost is negligible (~0.05ms per resolution). The architectural difference is the deciding factor, not performance.

### File Count Impact
Service pattern: 1 file per entity. Action pattern: N files per entity. Use Case pattern: N files + N DTOs + N interfaces. File count has zero runtime performance impact (OpCache) but affects IDE performance at extreme scale (500+ files in a directory).

---

## Production Considerations

### Team Convention Documentation
The most important rule: document which pattern to use when. A codebase where some teams use services, others use actions, and others use use cases with no consistent criteria creates confusion. The convention should specify the decision criteria, not just the pattern names.

### Code Review Checklist
- Does this operation share constructor dependencies with other operations? Service candidate.
- Does this operation have a unique dependency set? Action candidate.
- Does this operation run from multiple entry points with framework-agnostic requirements? Use Case candidate.
- Does the chosen pattern match the team's documented convention?

### Migration Between Patterns
Moving from Service -> Action -> Use Case is additive (extracting, not changing). Moving backwards (Use Case -> Action -> Service) is reductive and rare. The evolution path is forward-only — start simple and specialize as evidence accumulates.

---

## Common Mistakes

### Dogmatic One-Pattern-Only
Enforcing one pattern (all services, all actions, or all use cases) across the entire codebase ignores the tradeoffs. Simple CRUD operations benefit from service grouping. Complex workflows benefit from action isolation. Multi-entry-point operations benefit from Use Case contracts. The patterns are tools, not religions.

### Pattern by Convention, Not by Evidence
Choosing a pattern because "the team uses actions" rather than because "this operation fits the action criteria" leads to misapplication. Apply the decision framework (cohesion, granularity, portability) to each operation individually.

### Use Case Without Multi-Entry-Point Need
Creating a Use Case with full DTO and interface infrastructure for an operation that only runs from HTTP is paying the cost without receiving the benefit. The DTO overhead is only recouped when the same Use Case runs from at least 2 entry points.

### Service as Default Without Criteria
Using services for every operation by default leads to service bloat. A `UserService` with 30 methods is unmaintainable. Establish splitting criteria (method count, dependency count, unrelated operations) and enforce them from the start.

---

## Failure Modes

### Pattern Inconsistency in Team Environments
Two developers on the same team choose different patterns for similar operations. One creates `OrderService::cancel()`, another creates `CancelOrderAction`. The codebase becomes unpredictable — developers cannot find related operations because they do not know which pattern was used. The solution: documented team convention and code review enforcement.

### Use Case Interface Explosion
Every Use Case adds a repository interface method. After 20 Use Cases, the repository interface has 40+ methods, most used by one Use Case each. The interface becomes a god object. Solution: query objects or specification pattern instead of repository interface expansion.

### Service That Should Be Use Case
A service method that performs a complex multi-step operation across multiple entry points (HTTP, queue, CLI) is better served as a Use Case with DTO contracts. The service method's array parameters and Eloquent return types couple each entry point to the framework, defeating the multi-entry-point reuse.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream uses **actions only** (no services, no use cases). Jetstream actions live in `App\Actions\Jetstream` and are called directly from controllers and Livewire components. This is the simplest pattern, appropriate for Jetstream's bounded, well-defined scope.

### Laravel Horizon
Horizon uses **services internally** for process management and queue monitoring. Horizon does not use the action pattern — its architecture is built around longer-lived service objects with multiple methods.

### Spatie Packages
Spatie uses a **pragmatic mix**: services for internal operations with shared state, actions for public interfaces with single responsibilities. Spatie's packages demonstrate the Service-Action complement pattern in production.

### Monica CRM
Monica uses a **service-heavy** architecture with entity-oriented services (ContactService, ActivityService) and actions for standalone operations (logging, notifications). Monica represents the "services by default, actions when needed" approach.

### QadrLabs Reference Architecture
QadrLabs (2026) provides a production-ready architecture using all three patterns with explicit decision criteria: services for entity grouping, actions for single operations, use cases for framework-agnostic multi-entry-point operations.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — understanding the base action structure
- Service Class Design — understanding the service pattern structure
- Use Case Variant — understanding the use case pattern structure

### Related Topics
- Service vs Action Decision (Service Layer Pattern) — the existing two-way comparison that this KU extends to three-way
- Service Orchestration — how services compose actions in the Service-Action complement pattern
- Action Composition — how actions compose other actions
- Domain vs Application Services — how the domain-application distinction maps to Use Cases

### Advanced Follow-up Topics
- Hexagonal Architecture with Laravel — the full architectural framework that Use Cases belong to
- CQRS — how Commands and Queries map to Actions and Use Cases
- Repository Pattern — how repository interfaces connect Use Cases to infrastructure

---

## Research Notes

- The three-way distinction (Service vs Action vs Use Case) was formalized by QadrLabs in 2026, but the underlying patterns have existed in the Laravel community since 2019-2020. The formalization provides vocabulary for decisions that teams were already making implicitly.
- The existing "Service vs Action Decision" KU (in the Service Layer Pattern subdomain) covers the two-way comparison extensively. This KU extends that work to three-way, adding the Use Case variant as a distinct architectural choice. Teams should read both KUs together for the complete decision framework.
- Jetstream's exclusive use of actions (no services, no use cases) is a deliberate simplicity choice for its bounded scope. Jetstream is not a template for application architecture — it is a scaffolding tool for authentication and team management. Application codebases should not copy Jetstream's pattern without considering their own scope.
- The evolution path (Service -> Action -> Use Case) is widely recommended but rarely documented in production codebases. Most teams that use all three patterns arrived at them through organic growth, not a planned evolution. Writing down the evolution path helps new team members understand when to specialize.
- The Service-Action complement pattern is the dominant production pattern in the Laravel ecosystem as of 2024-2026. It combines the navigability of services with the isolation of actions. Most teams that start with services and encounter bloat end up with this pattern.