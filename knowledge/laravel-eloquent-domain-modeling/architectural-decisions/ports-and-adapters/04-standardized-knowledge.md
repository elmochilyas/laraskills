# Ports and Adapters (Hexagonal Architecture)

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Ports and Adapters |
| Classification | Expert |
| Last Updated | 2026-06-02 |

## Overview

Ports and Adapters (Hexagonal Architecture) places the domain at the center with all external concerns (web, database, email, queue) treated as interchangeable adapters. Ports are interfaces defined by the domain; adapters are infrastructure implementations. In Laravel, this means the domain never imports framework classes — instead it defines what it needs (ports) and Laravel provides concrete implementations (adapters). The pattern ensures the domain is completely isolated from infrastructure concerns.

## Core Concepts

- **Port**: A domain-defined interface expressing a need (e.g., `InvoiceRepositoryInterface`, `MailSenderInterface`)
- **Adapter**: An infrastructure class implementing a port (e.g., `EloquentInvoiceRepository`, `LaravelMailSender`)
- **Domain Center**: The domain layer has zero dependencies on framework, database, or UI
- **Dependency Inversion**: High-level modules (domain) and low-level modules (infrastructure) both depend on abstractions (ports)
- **Driver/Driven Adapters**: Driver adapters (controllers, CLI) initiate calls inward; driven adapters (repositories, mailers) are called by the domain

## When To Use

- The domain is complex and must be testable in complete isolation
- The domain may be reused across different frameworks (Laravel, Symfony, CLI worker)
- You need strict architectural boundaries enforced by static analysis
- The application is a long-lived project with complex domain rules

## When NOT To Use

- The application is simple CRUD with minimal domain logic
- Team size makes indirection overhead too high (small teams, fast prototyping)
- The domain and infrastructure are inseparably coupled by design

## Best Practices

- **Ports express domain needs, not adapter capabilities**: A port method named `findWhere(array $criteria)` leaks SQL concepts. Instead, name it `findActiveContracts()` — the domain's concept, not the database's.
- **One port per aggregate root boundary**: Don't create a port for every entity. Aggregate roots are the natural unit for repository abstraction.
- **Write contract tests**: A test suite that runs against all adapters of a port ensures no adapter violates the contract when the port changes.
- **Wire adapters in service providers**: The service provider is the single place where port-to-adapter binding occurs, making the architecture's wiring visible in one location.

## Architecture Guidelines

- Ports in `Domain\Contracts\` — interfaces only, no implementation
- Adapters in `Infrastructure\*` — concrete implementations using framework tools
- Service providers bind port → adapter
- Controllers, CLI commands, and queue jobs are driver adapters (outer layer)
- Static analysis enforces: Domain depends on nothing; Infrastructure depends on Domain

## Performance Considerations

- Interface dispatch adds a negligible virtual method call
- In-memory adapters for testing are significantly faster than database-backed tests
- Hex arch doesn't inherently affect query performance — that depends on adapter implementation

## Security Considerations

- Input sanitization and validation happen in driver adapters before reaching the domain
- Domain code never accesses raw HTTP input, preventing injection through that path
- Driven adapters (repositories) enforce data-level security (soft deletes, tenant scoping)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Ports mirroring adapter API | Leaky abstraction | Abstraction provides no hiding | Design ports around domain concepts |
| Domain logic in adapters | Convenience | Business rules hidden in infrastructure | Keep domain logic in domain models/services |
| Controller calling repository directly | Ignoring domain service layer | Missing orchestration and business rules | Controller → Domain Service → Repository |
| Mixed driver/driven adapters | Unclear boundaries | Architectural confusion | Separate driver (inbound) and driven (outbound) adapters |
| Ports in infrastructure layer | Misunderstanding ownership | Domain depends on infrastructure | Ports must live in the domain |

## Anti-Patterns

- **Port Explosion**: An interface for every class — dozens of tiny ports with one adapter each. Group related ports; only abstract at aggregate root boundaries.
- **Leaky Port**: Port interface specifies `findWhere(array)` which is clearly SQL leak. Design ports around domain concepts.
- **No Tests for Port Contract**: Port changes break adapters but no test catches it. Write contract tests against all adapters.
- **Anemic Domain**: Port abstracts everything but domain has no logic. Domain should contain domain logic, not just interface definitions.

## Examples

```php
// Port — domain layer
interface InvoiceRepository
{
    public function findById(int $id): ?Invoice;
    public function store(Invoice $invoice): Invoice;
    public function delete(Invoice $invoice): void;
}
```

```php
// Adapter — infrastructure layer
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findById(int $id): ?Invoice
    {
        $eloquent = EloquentInvoice::find($id);
        return $eloquent ? Invoice::fromArray($eloquent->toArray()) : null;
    }

    public function store(Invoice $invoice): Invoice
    {
        $eloquent = EloquentInvoice::updateOrCreate(
            ['id' => $invoice->id],
            $invoice->toArray()
        );
        return Invoice::fromArray($eloquent->fresh()->toArray());
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | Eloquent as Adapter |
| Closely Related | Framework Decoupling |
| Closely Related | When Repositories Help |
| Closely Related | Write Model Separation |

## AI Agent Notes

- Domain layer must have zero imports from `Illuminate\*` or `App\Models\*`
- All ports (interfaces) are defined in the Domain layer
- All adapters (implementations) are in the Infrastructure layer
- A port must be exchangeable (e.g., `InMemoryInvoiceRepository` for tests)
- Service Provider is the only place where port → adapter binding occurs

## Verification

- [ ] Domain layer has zero imports from `Illuminate\*` or `App\Models\*`
- [ ] All ports (interfaces) defined in Domain layer
- [ ] All adapters (implementations) in Infrastructure layer
- [ ] A port can be exchanged — e.g., in-memory implementation for tests
- [ ] Static analysis enforces Domain does not depend on Infrastructure
- [ ] Service Provider only place where port → adapter binding occurs
