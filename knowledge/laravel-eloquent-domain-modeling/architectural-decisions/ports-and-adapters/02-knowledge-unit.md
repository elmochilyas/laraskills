# Ports and Adapters (Hexagonal Architecture)

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
Ports and Adapters (Hexagonal Architecture) is an architectural pattern that places the domain at the center of the application, with all external concerns (web, database, email, queue) treated as adapters around it. Ports are interfaces (contracts) defined by the domain; adapters are implementations of those interfaces in the infrastructure layer. In Laravel, this means the domain never imports framework classes — instead, the domain defines what it needs (ports), and Laravel provides the concrete implementations (adapters).

## Core Concepts
- **Port:** An interface defined in the domain layer that expresses a need (e.g., InvoiceRepositoryInterface, MailSenderInterface).
- **Adapter:** An infrastructure class that implements a port (e.g., EloquentInvoiceRepository, LaravelMailSender).
- **Domain Center:** The domain layer has zero dependencies on framework, database, or UI.
- **Dependency Inversion:** High-level modules (domain) do not depend on low-level modules (infrastructure). Both depend on abstractions (ports).
- **Driver/Driven Adapters:** Driver adapters (controllers, CLI commands) initiate communication inward; driven adapters (repositories, mailers) are initiated by the domain.

## Mental Models
- **The Power Strip:** The domain is an appliance (laptop). The power strip (port) provides a standard interface. The wall outlet (adapter) can be any voltage/country — the laptop doesn't care. You change adapters, not the laptop.
- **The USB-C Standard:** Your device (domain) has a USB-C port. The cable/adapter (infrastructure) changes based on whether you're connecting to a monitor, SSD, or charger. The device's logic never changes — it just sends data over USB-C.
- **The Theater Stage:** The play (domain) is the same regardless of the theater (infrastructure). The actors deliver the same lines whether performing on Broadway (production MySQL) or in a community theater (SQLite testing). The stage, lighting, and sound system (adapters) change per venue.

## Internal Mechanics
1. Domain layer defines interfaces (ports) for external dependencies.
2. Infrastructure layer implements those interfaces (adapters).
3. A service provider or DI container binding wires the adapter to the port.
4. Domain services/actions depend on the port interface, never the concrete adapter.
5. The application entry point (HTTP, CLI, queue) is an outer-layer driver adapter.

## Patterns
- **Interface in Domain, Implementation in Infrastructure:** The canonical hex arch split.
- **Repository Interface (Port) + Eloquent Implementation (Adapter):** Most common Laravel hex-arch example.
- **Mailer Port + LaravelMailAdapter:** Domain defines sendInvoice(Invoice ); adapter wraps Laravel's Mail::to().
- **Event Port + LaravelEventAdapter:** Domain defines dispatch(DomainEvent ); adapter wraps Event::dispatch().
- **Testing Port:** An in-memory adapter for fast testing (e.g., InMemoryInvoiceRepository).

## Architectural Decisions
- Adopt ports and adapters when the domain is complex and needs to be tested in complete isolation.
- Adopt when the domain may be reused across different frameworks (Laravel, Symfony, CLI worker).
- Adopt when you want strict architectural boundaries enforced by static analysis.
- Skip when the application is simple CRUD with minimal domain logic — the cost outweighs the benefit.
- Skip when the team size makes the indirection overhead too high (small teams, fast prototyping).

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain is completely testable without infrastructure | Significant upfront architecture investment | Worth it for complex, long-lived projects |
| Framework can be swapped (theoretically) | Extra interfaces, bindings, and boilerplate | Framework swaps are rare in practice |
| Clear architectural boundaries | Learning curve for team unfamiliar with hex arch | Requires team training and discipline |
| Adapters can be swapped without domain changes | Static analysis must be configured to enforce boundaries (PHPStan level 8+) | Adds CI configuration complexity |
| Domain logic is portable (Laravel ? Symfony ? standalone) | Port interfaces often mirror adapter capabilities (leaky) | Discipline to design ports that express domain needs, not adapter methods |

## Performance Considerations
- Interface dispatch adds a negligible virtual method call.
- The real cost is in process boundary crossing (PHP function calls are fast).
- In-memory adapters for testing are significantly faster than database-backed tests.
- Hex arch doesn't inherently affect query performance — that depends on adapter implementation.

## Production Considerations
- **Service Provider:** Every port-to-adapter binding must be registered in a service provider.
- **Deployment:** Hex arch doesn't change deployment — it's a code organization pattern.
- **Debugging:** Stack traces cross interface boundaries; frameworks with IDE helper generation (barryvdh/laravel-ide-helper) help trace port ? adapter.
- **Migration:** Introducing hex arch to an existing project is best done incrementally — extract one port at a time.

## Common Mistakes
- Creating ports for every possible external interaction (over-engineering).
- Port interfaces that mirror the adapter's API exactly (leaky abstraction — see "when-repositories-hurt").
- Putting domain logic in adapters (e.g., business rules in a repository implementation).
- Mixing driver and driven adapter concerns (controller calling a repository directly without a domain service).
- Incomplete hex arch — domain still imports Facades or \Illuminate\* classes.
- Writing ports in the infrastructure layer (ports must live in the domain).

## Failure Modes
- **Port Explosion:** An interface for every class — dozens of tiny ports with one adapter each. Mitigate: group related ports; only abstract at aggregate root boundaries.
- **Leaky Port:** Port interface specifies indWhere(array ) which is clearly SQL leak. Mitigate: design ports around domain concepts: indActiveContracts(), not indWhere('status', 'active').
- **No Tests for Port Contract:** Port changes break adapters but no test catches it. Mitigate: write contract tests that run against all adapters of a port.
- **Anemic Domain:** Port abstracts everything but domain has no logic. Mitigate: domain should contain domain logic, not just interface definitions.

## Ecosystem Usage
- **Laravel + DDD Boilerplate:** Community repositories that scaffold hex arch structure for Laravel projects.
- **spatie/domain-oriented-laravel:** Directory structure supporting hex arch with domain/infrastructure layers.
- **Laravel codebase:** The framework itself uses contracts (ports) — e.g., Illuminate\Contracts\Mail\Mailer — with multiple adapters (Log, SMTP, SES, Mailgun).
- **Event sourcing:** spatie/laravel-event-sourcing's projector interfaces are ports; Eloquent-based projectors are adapters.
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [Eloquent as Adapter](../eloquent-as-adapter/02-knowledge-unit.md) — Eloquent as an infrastructure adapter behind a port.
- [Framework Decoupling](../framework-decoupling/02-knowledge-unit.md) — How hex arch enables framework independence.
- [When Repositories Help](../when-repositories-help/02-knowledge-unit.md) — Repository interfaces as domain ports.
- [Write Model Separation](../write-model-separation/02-knowledge-unit.md) — Write model ports in hex arch.

### Advanced Follow-up Topics

## Research Notes
- **Alistair Cockburn (Hexagonal Architecture originator, 2005):** Defined ports and adapters to equalize how applications interact with users, databases, and other systems.
- **Eric Evans (DDD):** Hexagonal architecture is the recommended architectural style for DDD applications.
- **Robert C. Martin (Clean Architecture):** Evolved hex arch into "Clean Architecture" — same concept, different circles.
- **Matthias Noback (DDD + Hex Arch in PHP):** Books and talks on applying hex arch specifically in PHP/Laravel projects.
- **Laracon EU 2021 (Freek Van der Herten):** Demonstrated hex arch in Laravel with spatie/domain-oriented-laravel.