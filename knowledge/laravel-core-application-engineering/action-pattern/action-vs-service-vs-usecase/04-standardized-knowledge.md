# ECC Standardized Knowledge — Action vs Service vs Use Case

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action vs Service vs Use Case |
| **Difficulty** | Expert |
| **Category** | Application Architecture — Business Logic Organization |
| **Last Updated** | 2026-06-02 |

---

## Overview

The Laravel ecosystem has three distinct architectural patterns for organizing business logic: Services (multi-method, entity-oriented), Actions (single-method, operation-oriented), and Use Cases (framework-agnostic, DTO-contracted). These are not competing alternatives — they form a spectrum of granularity and coupling. Most production Laravel codebases use all three, applying each where its tradeoffs fit the operation's complexity, reuse requirements, and framework coupling tolerance.

The engineering significance of the three-way distinction is that it provides an explicit vocabulary for architectural decisions. A team that can say "this is a service because it groups related entity operations" or "this is a use case because it must run from HTTP and CLI identically" has made the decision criteria explicit. A team that applies one pattern everywhere forfeits the flexibility to match the pattern to the operation.

---

## Core Concepts

### The Three-Way Spectrum

Service (entity group) → Action (single operation) → Use Case (framework-agnostic). Moving from Service to Use Case increases decoupling, file count, and independent DI, while decreasing framework coupling and shared context.

### Distinguishing Dimensions

Services have multiple methods (3-15+), are organized by entity, share constructor DI across methods, accept loose input, and import framework classes. Actions have one method, are organized by single operation, have one DI per action, optionally accept DTOs, and may import framework classes. Use Cases have one method, are organized by business intent, have one DI per use case, require DTO input, and forbid framework imports in business logic.

### The DTO Boundary as Key Differentiator

The presence of a DTO input boundary is the single most important architectural signal. No DTO = Service or Action. Optional DTO = Action. Required DTO = Use Case.

### The Three-Tier Decision Framework

Ask three questions in order: (1) Cohesion — does this operation belong to a group of related operations on the same entity? Service. (2) Granularity — is this a single, distinct operation that may be reused or composed? Action. (3) Portability — does this operation need to run identically across entry points with framework-agnostic contracts? Use Case.

---

## When To Use

**Choose Service when:** operations naturally group around an entity (user, order, product), constructor dependencies are shared across operations, the team prefers centralized navigation, file count minimization is a priority, and operations are always called from the same entry point.

**Choose Action when:** the operation is a single distinct unit that may be reused from multiple contexts, test isolation is a priority, merge conflicts in shared service files are a problem, and the operation has unique dependencies.

**Choose Use Case when:** the same operation must run from HTTP, queue, and CLI identically, framework-agnostic contracts are required by architectural policy, the domain is complex enough to justify DTO overhead, and the team has 10+ developers who benefit from strict boundaries.

---

## When NOT To Use

- Do NOT use only one pattern for the entire codebase. Different operations have different characteristics — the pattern should match the operation.
- Do NOT use Use Cases for single-entry-point operations. The DTO overhead is paid but never recouped through multi-entry-point reuse.
- Do NOT use Services as the default without splitting criteria. A `UserService` with 30 methods is unmaintainable.
- Do NOT use Actions for operations that share all their dependencies — a service provides shared DI that actions duplicate across files.
- Do NOT use Use Cases for simple CRUD operations with no business logic — the boilerplate-to-logic ratio becomes absurd.

---

## Best Practices (WHY)

- **Start with Services, evolve to Actions, introduce Use Cases as needed.** The evolution path is additive (extracting, not changing). Start simple and specialize as evidence accumulates.
- **Apply the three-tier decision framework to each operation individually.** Ask: cohesion? (service), granularity? (action), portability? (use case). Choose the most specific pattern that fits.
- **Document the team's convention explicitly.** Write down when to use each pattern, with concrete examples and decision criteria. New team members should not have to infer the pattern from existing code.
- **Keep patterns consistent within a domain but flexible across domains.** A billing domain can use actions while a CRUD domain uses services — but within billing, all operations should follow the same convention.
- **Use the Service-Action complement pattern as the default.** Services for entity grouping and navigation, actions for individual operations. This is the dominant production pattern in the Laravel ecosystem.

---

## Architecture Guidelines

- **Service pattern:** One file per entity/domain. Shared constructor DI. Multiple public methods. Framework imports expected. No DTO boundary. Transaction ownership inside service methods.
- **Action pattern:** One file per operation. One DI per action. Single public method. Optional DTO boundary. May import framework classes. No transaction ownership (delegates to orchestrator).
- **Use Case pattern:** One file + one DTO per input + one result DTO + interface dependencies. Single public method. Required DTO boundary. Zero framework imports. No transaction ownership.
- **Service-Action complement:** Services for navigation and orchestration, actions for execution. The service calls 3-5 actions in sequence within a transaction boundary.
- **Evolution path:** Start with services (file economy), extract to actions (isolation) when a service exceeds 10 methods or 5+ unrelated dependencies, upgrade to Use Cases (portability) when an action must run from multiple entry points.
- **Migration between patterns is additive only.** Service → Action → Use Case is forward. Use Case → Action → Service is reductive and rare.

---

## Performance

The resolution cost difference between the three patterns is negligible (~0.05ms per resolution). Service: one resolution per request for all methods. Action: one resolution per call. Use Case: one resolution plus interface dispatch. File count has zero runtime performance impact (OpCache) but affects IDE performance at extreme scale (500+ files in a directory).

---

## Security

Services that perform authorization checks inside shared methods can accidentally expose authorization gaps when called from different contexts. Actions provide better authorization isolation because each action can independently verify authorization. Use Cases with strict contract boundaries enable framework-agnostic authorization — the same Use Case can enforce authorization rules regardless of entry point (HTTP, queue, CLI). Interface dependencies in Use Cases make it straightforward to swap authorization providers.

---

## Common Mistakes

- **Dogmatic one-pattern-only approach.** Enforcing all services or all actions across the entire codebase ignores the tradeoffs. Different patterns fit different operations.
- **Pattern by convention, not by evidence.** Choosing a pattern because "the team uses actions" rather than because "this operation fits the action criteria" leads to misapplication.
- **Use Case without multi-entry-point need.** Creating a Use Case with full DTO and interface infrastructure for an operation that only runs from HTTP is paying the cost without receiving the benefit.
- **Service as default without splitting criteria.** Using services for every operation leads to service bloat. A `UserService` with 30 methods is unmaintainable.
- **Pattern inconsistency in team environments.** Two developers choose different patterns for similar operations. The codebase becomes unpredictable.

---

## Anti-Patterns

- **All-service monolith.** Every operation is a method on `UserService` or `OrderService`. Services grow to 30-40 methods with 10-15 dependencies. Testing becomes impossible because each test must instantiate the entire service.
- **All-action fragmentation.** Every operation, including simple getters and setters, is an action class. The codebase has 300 action files for a simple CRUD app. Navigation becomes impossible.
- **All-use-case overengineering.** Even `UpdateUserNameUseCase` gets a dedicated DTO, repository interface, and result DTO. The boilerplate-to-logic ratio is 10:1 for a single field update.
- **Service that should be a Use Case.** A service method performs a complex multi-step operation across multiple entry points (HTTP, queue, CLI) but accepts arrays and returns Eloquent models. The framework coupling prevents clean multi-entry-point reuse.
- **Use case interface explosion.** Every Use Case adds a method to the repository interface. After 20 Use Cases, the interface has 40+ methods, most used by one Use Case each.

---

## Examples

### Service Pattern (Entity Grouping)
```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
    ) {}

    public function create(array $data): User { ... }
    public function update(int $id, array $data): User { ... }
    public function suspend(int $id): void { ... }
    public function reactivate(int $id): void { ... }
}
```

### Action Pattern (Single Operation)
```php
class CreateUserAction
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
    ) {}

    public function execute(array $data): User { ... }
}
```

### Service-Action Complement (Dominant Production Pattern)
```php
class UserService
{
    public function __construct(
        private CreateUserAction $createUser,
        private SuspendUserAction $suspendUser,
        private NotifyUserAction $notifyUser,
    ) {}

    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->createUser->execute($data);
            DB::afterCommit(fn () => $this->notifyUser->execute($user));
            return $user;
        });
    }
}
```

### Use Case Pattern (Framework-Agnostic)
```php
final class RegisterUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}

final class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasherInterface $hasher,
    ) {}

    public function execute(RegisterUserDTO $dto): UserDTO { ... }
}
```

---

## Related Topics

- **Action Class Design** (prerequisite) — understanding the base action structure.
- **Service Class Design** (prerequisite) — understanding the service pattern structure.
- **Use Case Variant** (prerequisite) — understanding the use case pattern structure.
- **Service vs Action Decision (Service Layer Pattern)** — the existing two-way comparison that this KU extends to three-way.
- **Service Orchestration** — how services compose actions in the Service-Action complement pattern.
- **Action Composition** — how actions compose other actions.
- **Domain vs Application Services** — how the domain-application distinction maps to Use Cases.
- **Hexagonal Architecture with Laravel** — the full architectural framework that Use Cases belong to.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Action Class Design, Service Class Design, Use Case Variant (prerequisites). Capstone KU for the action-pattern subdomain.
- **Three-tier decision framework:** Cohesion → Service, Granularity → Action, Portability → Use Case.
- **Evolution path:** Start with Services (file economy). Extract to Actions (isolation) at 10+ methods or 5+ deps. Introduce Use Cases (portability) for multi-entry-point operations.
- **Service-Action complement** is the dominant production pattern as of 2024-2026. Services for navigation, actions for execution.
- **Use Case is NOT a standard Laravel term.** Most production Laravel applications use services or actions. The Use Case pattern is more common in Symfony and enterprise PHP codebases.
- **This KU extends the Service vs Action Decision KU** (in service-layer-pattern subdomain) from two-way to three-way by adding the Use Case variant.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Three-way spectrum documented | ✓ |
| When to use / when NOT to use each pattern | ✓ |
| Best practices with rationale | ✓ |
| Three-tier decision framework | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
