# Framework Decoupling

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
Framework decoupling is the practice of keeping the domain layer free of framework dependencies. The domain defines its own interfaces (ports) and owns them; the framework (Laravel) provides implementations (adapters). This prevents framework-specific concerns from leaking into business logic and allows the domain to be tested, understood, and potentially reused independently of Laravel. The core mechanism is Dependency Inversion — high-level domain code depends on abstractions it defines, not on concrete framework classes.

## Core Concepts
- **Dependency Inversion Principle (DIP):** Depend on abstractions, not concretions. Abstractions belong to the domain.
- **Interface Ownership:** The domain defines the interface; the framework implements it. Not the other way around.
- **Domain Purity:** Domain code has no use Illuminate\* statements.
- **Inversion of Control:** The framework calls into the domain (via controllers, commands), not the other way around.
- **Hexagonal Boundary:** The framework lives in the outer ring; the domain lives in the center, isolated.

## Mental Models
- **The Judge and The Court Clerk:** The domain is the judge — it knows the law (business rules) and makes decisions. The framework is the court clerk — it files paperwork, schedules hearings, manages the building. The judge doesn't clean the courtroom or file documents.
- **The Engine and The Dashboard:** The domain is the car engine — it runs whether the dashboard is analog or digital. The framework is the dashboard — it displays information but doesn't affect how the engine runs. You can swap the dashboard without touching the engine.
- **The Screenplay and The Production:** The domain is the screenplay (story, characters, dialogue). The framework is the production (cast, crew, cameras). The same screenplay can be a stage play, a film, or a radio drama. The screenplay doesn't import cinematography libraries.

## Internal Mechanics
1. Domain defines interfaces for external needs (persistence, mail, events, time).
2. Domain implements business logic using only those interfaces and native PHP types.
3. Laravel's service container binds concrete implementations to those interfaces.
4. Controllers, CLI commands, and queue jobs (framework layer) call into domain services.
5. Domain services never reference Request, Response, Facade, Model, or any Illuminate class.
6. Static analysis (PHPStan, Psalm) enforces no framework imports in the domain namespace.

## Patterns
- **Interface Ownership:** Domain\Contracts\Repositories\ContractRepository — domain defines it.
- **Framework Adapter:** Infrastructure\Persistence\EloquentContractRepository — Laravel implements it.
- **Domain Event + Framework Listener:** Domain raises an interface-based event; Laravel listens and handles side-effects.
- **Port Interface for Time:** Domain\Contracts\Clock interface; Infrastructure\SystemClock wraps Carbon.
- **Port Interface for Identity:** Domain\Contracts\IdGenerator; Infrastructure\SnowflakeIdGenerator.
- **Service Provider Binding:** $this->app->bind(ContractRepository::class, EloquentContractRepository::class).

## Architectural Decisions
- Decouple the domain from the framework when the domain has complex, valuable business logic.
- Decouple when you want to unit-test the domain without loading Laravel's kernel.
- Decouple when the application may outlive the current framework choice.
- Decouple when multiple teams own different parts of the codebase and need clear boundaries.
- Skip decoupling when the application is simple CRUD with minimal business rules.
- Skip when the team size is small and delivery speed is the primary concern.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain testable without Laravel bootstrap | Extra interfaces and adapters increase code volume | Worth it for complex business logic |
| Framework lock-in reduced | Manual mapping between domain and framework objects | Acceptable for long-lived projects |
| Domain logic is portable (Laravel ? Symfony ? standalone) | Developers must know both Laravel and hex arch | Requires team training and discipline |
| Clear architectural boundaries enforced by static analysis | Slower initial development velocity | Pay the cost upfront; benefit accrues over time |
| Framework upgrades less risky for domain | May miss framework features (magic methods, shortcuts) | Trade convenience for purity |

## Performance Considerations
- Interface dispatch overhead is negligible (one extra virtual call).
- The real cost is in the mapping layer between domain and infrastructure — benchmark to ensure it's acceptable.
- Domain purity does not affect query performance — that's the adapter's concern.
- Tests run faster because domain tests don't need Laravel's container (pure PHP function calls).

## Production Considerations
- **Service Providers:** Every domain-interface-to-framework-adapter binding needs a service provider.
- **IDE Helper:** Use arryvdh/laravel-ide-helper to generate _ide_helper.php for autocompletion across the architecture boundary.
- **Deployment:** Framework decoupling doesn't affect deployment — same Docker image, same server.
- **Static Analysis:** Integrate PHPStan or Psalm with path-based rules (e.g., Domain/ cannot import Illuminate/).

## Common Mistakes
- Defining ports in the infrastructure layer (ports belong to the domain).
- Allowing domain models to extend Eloquent Model (leaks framework into domain).
- Using Laravel facades in domain code (Cache::get(), Event::dispatch()).
- Injecting Illuminate\Http\Request into domain services.
- Using Carbon (Illuminate\Support\Carbon) in domain models — use DateTimeImmutable.
- Using Eloquent collections in domain return types — use rray or rray<int, DomainModel>.

## Failure Modes
- **Pseudo-Decoupling:** Domain still uses Facades in practice despite hex arch structure. Mitigate: enforce with PHPStan rules and code review.
- **Adapter Proliferation:** Every domain interface has one adapter and no plan to ever change it. Mitigate: question each interface: "Would we actually implement this differently?"
- **Mapping Hell:** 10+ mapper classes converting between domain and framework objects with complex logic. Mitigate: consider keeping the domain and Eloquent model close when mapping is too expensive.
- **Developer Resistance:** Team feels the hex arch overhead isn't worth it for a simple CRUD app. Mitigate: only introduce hex arch where the domain complexity justifies it.

## Ecosystem Usage
- **spatie/domain-oriented-laravel:** Provides directory structure and examples for framework-decoupled Laravel.
- **Laravel framework itself:** Internal use of contracts (Illuminate\Contracts\*) demonstrates interface ownership — the framework defines its own interfaces.
- **Laravel Spark:** Uses framework features directly (not decoupled), illustrating the tradeoff in practice.
- **Enterprise Laravel projects (case studies):** Large-scale projects (100k+ lines) commonly adopt some form of framework decoupling.
- **Slim Framework migrations:** Projects migrating from Slim to Laravel benefit from decoupled domains that transfer cleanly.
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [Ports and Adapters](../ports-and-adapters/02-knowledge-unit.md) — The architectural pattern that enforces framework decoupling.
- [Eloquent as Adapter](../eloquent-as-adapter/02-knowledge-unit.md) — Eloquent as the framework adapter for persistence.
- [When Repositories Help](../when-repositories-help/02-knowledge-unit.md) — Repository interfaces as domain-owned ports.
- [Action Class Patterns](../action-class-patterns/02-knowledge-unit.md) — Actions as framework-agnostic use-case orchestrators.

### Advanced Follow-up Topics

## Research Notes
- **Robert C. Martin (Clean Architecture):** Frameworks are details that should be kept at the edges.
- **Matthias Noback (A Year with Symfony / Advanced Web Application Architecture):** Practical PHP guidance on framework decoupling.
- **Freek Van der Herten (spatie):** "Treat the framework as a detail, not the foundation of your application."
- **Taylor Otwell:** Laravel's design philosophy acknowledges this — Facades and contracts allow "unwinding" from the framework.
- **DDD community:** Strategic design — bounded contexts with framework-agnostic domains is a recommended practice.