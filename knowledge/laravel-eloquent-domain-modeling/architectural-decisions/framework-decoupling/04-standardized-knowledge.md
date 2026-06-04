# Framework Decoupling

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Framework Decoupling |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Framework decoupling keeps the domain layer free of framework dependencies by applying the Dependency Inversion Principle: the domain defines its own interfaces (ports) and the framework provides implementations (adapters). This prevents framework-specific concerns from leaking into business logic and allows the domain to be tested, understood, and potentially reused independently of Laravel.

## Core Concepts

- **Dependency Inversion**: High-level domain code depends on abstractions it defines, not on concrete framework classes
- **Interface Ownership**: Domain defines the interface; the framework implements it — never the reverse
- **Domain Purity**: Domain code has zero `use Illuminate\*` statements
- **Inversion of Control**: Framework calls into the domain (via controllers, commands), not the other way around
- **Hexagonal Boundary**: Framework lives in outer rings; domain lives in the center, isolated

## When To Use

- The domain has complex, valuable business logic worth protecting
- You want to unit-test the domain without loading Laravel's kernel
- The application may outlive the current framework choice
- Multiple teams own different parts of the codebase and need clear boundaries

## When NOT To Use

- The application is simple CRUD with minimal business rules
- Team size is small and delivery speed is the primary concern
- The domain logic and framework access patterns are tightly coupled by design

## Best Practices

- **Define ports in the domain, not infrastructure**: The domain owns its abstractions because they express domain needs. Infrastructure-owned ports force domain code to depend on infrastructure concepts.
- **Enforce purity with static analysis**: Configure PHPStan or Psalm with path-based rules (e.g., `Domain/` cannot import `Illuminate/`). This catches violations at CI time rather than code review.
- **Keep domain models native**: Use `DateTimeImmutable` not Carbon, native arrays not Collections, plain PHP classes not Eloquent models. This prevents framework dependency creep.
- **Question every interface**: For each domain interface, ask "Would we actually implement this differently?" If the answer is no, the abstraction may not be justified.

## Architecture Guidelines

- Domain interfaces in `Domain\Contracts\*` — repository, mailer, clock, ID generator
- Framework adapters in `Infrastructure\*` — Eloquent, Laravel Mail, SystemClock
- Service providers bind ports to adapters: `$this->app->bind(ContractRepository::class, EloquentContractRepository::class)`
- Domain services use only domain-defined interfaces and native PHP types
- Framework layer (controllers, commands, jobs) calls into domain services, never the reverse

## Performance Considerations

- Interface dispatch adds one virtual method call — negligible overhead
- The real cost is in the mapping layer between domain and infrastructure; benchmark to ensure it's acceptable
- Domain tests run faster because they don't need Laravel's container (pure PHP function calls)

## Security Considerations

- Domain models use `DateTimeImmutable` for all time values (prevents mutation-based attacks)
- Domain code never accesses `Request`, `Input`, or `$_GET/$_POST` directly
- All input validation happens in the framework adapter layer before reaching the domain

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Defining ports in infrastructure | Convenience during refactoring | Domain depends on infrastructure interfaces | Ports belong to the domain |
| Using Facades in domain code | Familiarity with Laravel patterns | Hidden framework coupling | Inject domain-owned interfaces |
| Using Carbon in domain models | DateTime convenience | Framework dependency in domain | Use `DateTimeImmutable` |
| Using Eloquent collections in domain returns | Lazy loading convenience | Collection type coupling to Laravel | Use `array<int, DomainModel>` |

## Anti-Patterns

- **Pseudo-Decoupling**: Hex arch directory structure exists but domain still uses Facades. Enforce with PHPStan rules.
- **Adapter Proliferation**: Every domain interface has one adapter and no plan to ever change it. Question each interface's necessity.
- **Mapping Hell**: 10+ mapper classes with complex logic. Consider keeping domain and Eloquent models close when mapping cost exceeds benefit.
- **Developer Resistance**: Team feels overhead isn't worth it. Only introduce decoupling where domain complexity justifies it.

## Examples

```php
// Domain — pure PHP, no framework
class BillingService
{
    public function __construct(
        private InvoiceRepository $invoices,  // Domain-owned port
        private Clock $clock,                  // Domain-owned port
    ) {}

    public function processOverdue(): array
    {
        $overdue = $this->invoices->findOverdueAsOf($this->clock->now());
        foreach ($overdue as $invoice) {
            $invoice->applyLateFee();
            $this->invoices->store($invoice);
        }
    }
}
```

```php
// Framework adapter in infrastructure
class SystemClock implements Clock
{
    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now');
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | Ports and Adapters |
| Closely Related | Eloquent as Adapter |
| Closely Related | When Repositories Help |
| Closely Related | Action Class Patterns |

## AI Agent Notes

- Domain namespace must have zero `use Illuminate\*` imports
- Domain models use `DateTimeImmutable`, not Carbon
- All framework adapters implement domain-owned interfaces
- Wire bindings in service providers

## Verification

- [ ] `Domain/` namespace has zero `use Illuminate\*` or `use App\Models\*` imports
- [ ] All domain services receive dependencies via constructor injection (no `app()`, no `resolve()`)
- [ ] Domain models use `DateTimeImmutable` not Carbon
- [ ] Domain models use native PHP arrays not `Collection`
- [ ] All framework adapters implement domain-owned interfaces
- [ ] PHPStan/Psalm configured to reject `Illuminate\*` imports in `Domain/`
- [ ] Domain unit tests run without `RefreshDatabase` — just plain PHPUnit
