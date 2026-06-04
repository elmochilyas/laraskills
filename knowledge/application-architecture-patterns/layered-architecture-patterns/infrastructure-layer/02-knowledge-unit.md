# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Infrastructure layer: Eloquent implementations, external adapters
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The Infrastructure layer implements the interfaces (ports) defined by inner layers using specific technologies: Eloquent for database access, Mail for email, Queue for async processing, HTTP clients for external APIs. This is where Laravel's framework capabilities are fully utilized. The Infrastructure layer is the "dirty" layer—it deals with database connections, network calls, filesystem operations, and framework-specific code. Its purpose is to keep all other layers clean by absorbing framework coupling.

---

# Core Concepts

Infrastructure implements:
- **Repository interfaces** from the Application/Domain layer using Eloquent
- **Event bus interfaces** using Laravel's event system
- **Mail interfaces** using Laravel's Mail facade
- **Queue interfaces** using Laravel's queue system
- **External API clients** using Laravel's HTTP client or Guzzle
- **Caching interfaces** using Laravel's Cache facade

Each implementation class is an Adapter in Hexagonal Architecture terms.

---

# Mental Models

**The "Dirty Implementation" model:** Infrastructure code is not "bad" code—it's necessary code that must exist somewhere. The goal is to confine it to this layer so other layers don't know it exists.

**The "Swap Zone" model:** If you ever switch from MySQL to PostgreSQL, or from Mailgun to SendGrid, or from Redis to DynamoDB, the Infrastructure layer is the only place that changes.

**The "Framework Utilization" model:** This is where Laravel's power lives. Eloquent's expressive query builder, Mail's driver system, Queue's worker management—all used here, not in Domain or Application.

---

# Internal Mechanics

```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function save(Invoice $invoice): void {
        $model = InvoiceModel::findOrFail($invoice->id());
        $model->status = $invoice->status()->value;
        $model->total_cents = $invoice->total()->amount();
        $model->save();
    }

    public function find(InvoiceId $id): Invoice {
        $model = InvoiceModel::findOrFail($id->toString());
        return new Invoice(
            new InvoiceId($model->id),
            new Money($model->total_cents, $model->currency),
            InvoiceStatus::from($model->status),
            // ...
        );
    }
}
```

The mapping between Domain entities and Eloquent models is explicit—this is where the coupling is managed.

---

# Patterns

**Repository pattern (Infrastructure implementation):** Each Repository interface from the Application/Domain layer has an Eloquent implementation in Infrastructure. The Repository translates between Eloquent models and Domain entities.

**Adapter pattern:** External services (payment gateways, shipping APIs) have adapter classes that implement port interfaces. The adapter handles HTTP calls, error mapping, and response parsing.

**Factory pattern for complex objects:** Infrastructure factories create Eloquent models from domain entities, handling the mapping details.

**Laravel-specific implementation:** Using Eloquent scopes, accessors, and mutators within the Infrastructure layer to bridge between Eloquent behavior and domain needs.

---

# Architectural Decisions

**Use explicit mapping** when domain entities differ significantly from database schema. This is the correct approach for Clean Architecture but adds code overhead.

**Use direct Eloquent** (domain entity is the Eloquent model) when domain rules are simple and framework coupling is acceptable. This is the pragmatic Laravel approach (see LAP-09 tradeoffs).

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| All framework coupling in one place | Explicit mapping between domain and Eloquent | Many small mapping classes |
| Swappable infrastructure | Eloquent's power is limited by interface | Repository interface may not expose Eloquent-specific features |
| Tech-specific code isolated | Developer must know both domain models and Eloquent models | Cognitive load of dual model systems |

---

# Performance Considerations

Infrastructure layer is the primary performance concern. N+1 queries, missing indexes, slow external API calls all live here. Profile infrastructure code separately from domain/application code.

Eloquent performance optimization (eager loading, chunking, cursor) happens entirely in Infrastructure.

---

# Production Considerations

Infrastructure code is where most production bugs manifest: database connection issues, API timeouts, queue failures. Monitor Infrastructure layer with observability tooling (Laravel Pulse, Telescope).

---

# Common Mistakes

**Business logic in Infrastructure:** Placing business rules (discount calculations, validation logic) in Eloquent model methods or repository implementations. Business logic belongs in Domain.

**Leaky abstractions:** Repository methods that expose Eloquent-specific return types (`Collection`, `LengthAwarePaginator`). Return domain types instead, or use application-layer DTOs.

**Over-abstracting Infrastructure:** Creating interfaces for every Infrastructure class even when only one implementation exists or will ever exist.

---

# Failure Modes

**Infrastructure coupling spread:** A single `use` statement in the Application layer that imports an Infrastructure class. Once one exists, more follow. Enforce with architecture tests.

**Eloquent in Domain:** The most common Clean Architecture violation in Laravel. Eloquent models in Domain directories that extend `Model`, creating unavoidable framework coupling.

---

# Ecosystem Usage

Laravel's own packages (Horizon, Telescope, Pulse, Reverb) are Infrastructure-layer tools. Spatie's `laravel-medialibrary` uses Eloquent internally while exposing a clean interface. Most Laravel packages assume they're used in the Infrastructure layer.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-06 Application layer | LAP-10 Domain entity mapping | LAP-09 Framework independence |
| LAP-04 Dependency Rule | CPC-01 Interface contracts | AEG-01 Architecture testing |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche�most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
