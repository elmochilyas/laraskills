# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Mapping between domain entities and Eloquent models
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Mapping between domain entities (pure PHP business objects) and Eloquent models (Laravel's ORM implementation) is the central challenge of Clean Architecture in Laravel. Domain entities know nothing about databases; Eloquent models know nothing about business rules. The mapping layer translates between them. This mapping is where most Clean Architecture projects in Laravel either succeed (clean separation) or fail (by skipping the mapping and putting business logic in Eloquent models). The mapping pattern is controversial in the Laravel community because many practitioners consider it unnecessary ceremony.

---

# Core Concepts

**Domain entity:** Pure PHP object with business behavior. `Invoice` entity with `markAsPaid()`, `addLineItem()`, `calculateTotal()` methods. No extends, no traits, no framework.

**Eloquent model:** Laravel's ActiveRecord implementation. Extends `Model`, knows about database tables, relationships, serialization. `InvoiceModel` with Eloquent relationships, casts, scopes.

**Mapping (translation):** The process of converting between domain entities and Eloquent models. Usually handled by a Repository implementation that calls the mapper.

---

# Mental Models

**The "Translator" model:** The mapper is like a translator between two languages. Domain entity speaks business; Eloquent model speaks database. The translator converts between them without either side learning the other's language.

**The "Two Representations" model:** The same business concept has two representations: one rich with behavior (domain entity), one designed for persistence (Eloquent model). They are not the same object.

**The "Bidirectional Conversion" model:** Mapping goes both ways. Eloquent model → Domain entity (when reading from database). Domain entity → Eloquent model (when writing to database).

---

# Internal Mechanics

```php
// Domain entity (no framework imports)
class Invoice {
    public function __construct(
        private InvoiceId $id,
        private CustomerId $customerId,
        private Money $total,
        private InvoiceStatus $status,
        private array $lineItems,
    ) {}

    public function markAsPaid(\DateTimeImmutable $paidAt): void { /* ... */ }
}

// Eloquent model (Infrastructure)
class InvoiceModel extends Model {
    protected $table = 'invoices';
    protected $casts = ['status' => InvoiceStatus::class];

    public function lineItems(): HasMany {
        return $this->hasMany(LineItemModel::class);
    }
}

// Mapper (Infrastructure)
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice {
        return new Invoice(
            new InvoiceId($model->id),
            new CustomerId($model->customer_id),
            new Money($model->total_cents, $model->currency),
            InvoiceStatus::from($model->status),
            $model->lineItems->map(fn($item) => $this->mapLineItem($item))->toArray(),
        );
    }

    public function toEloquent(Invoice $invoice): array {
        return [
            'id' => $invoice->id()->toString(),
            'customer_id' => $invoice->customerId()->toString(),
            'total_cents' => $invoice->total()->amount(),
            'currency' => $invoice->total()->currency(),
            'status' => $invoice->status()->value,
        ];
    }
}
```

---

# Patterns

**Repository with mapper:** Repository interface defines domain-centric methods. Implementation uses mapper to convert between domain and Eloquent:
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function __construct(
        private InvoiceMapper $mapper,
        private InvoiceModel $model
    ) {}

    public function save(Invoice $invoice): void {
        $data = $this->mapper->toEloquent($invoice);
        $this->model->updateOrCreate(['id' => $invoice->id()->toString()], $data);
    }

    public function find(InvoiceId $id): Invoice {
        $model = $this->model->findOrFail($id->toString());
        return $this->mapper->toDomain($model);
    }
}
```

**DTO as intermediate form:** Instead of direct entity-to-model mapping, use DTOs as intermediate structures. This decouples the mapping from both representations.

---

# Architectural Decisions

**Use explicit mapping when:** Domain entities are significantly different from database schema, business logic is complex enough to warrant framework-independent entities, or the application requires Clean Architecture.

**Skip explicit mapping when:** Domain entities ARE Eloquent models (Laravel DDD approach). The domain entity extends `Model` and uses Eloquent features. Accept the coupling.

**Use partial mapping when:** Most entities map straightforwardly to tables, but some complex concepts need mapping. Apply mapping only where it adds value.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| True framework independence for domain | Every entity needs a corresponding mapper | 2x model + mapper code for each aggregate |
| Business logic survives ORM changes | Mapper maintenance overhead | Schema changes require mapper updates |
| Elastic domain structure decoupled from DB | Performance cost of mapping | Each read/write converts objects, allocates memory |

---

# Performance Considerations

Mapping overhead is measurable but rarely significant for typical request volumes. Each mapping operation creates new objects with associated memory allocation. For high-throughput endpoints, consider caching mapped domain entities or using direct Eloquent access for read-only operations.

---

# Production Considerations

Mapper accuracy is critical. An incorrect mapper produces corrupted domain state. Write dedicated unit tests for each mapper that verify both directions (domain → model → domain roundtrip).

---

# Common Mistakes

**Identity crisis:** The mapper duplicates logic that exists in both models. Example: a `Money` value object mapped to `cents` and `currency` columns also cast in the Eloquent model's `$casts` array.

**Partial mapping:** Some fields mapped, others passed through directly. Inconsistent mapping creates confusion about where transformations happen.

**Lazy loading in domain:** The mapper triggers Eloquent lazy loading when accessing relationships. Use eager loading explicitly before mapping.

---

# Failure Modes

**Roundtrip failure:** Mapping domain → Eloquent → domain produces a different object. Example: timezone conversion, floating-point rounding, null handling.

**Mapping cascading dependencies:** Mapping an `Order` requires mapping its `LineItems`, which requires mapping `Product` references. Deep cascading creates performance issues and tight mapping coupling.

---

# Ecosystem Usage

The `laravel-clean-architecture` package by ElberCanoles generates mapper classes. The `laravel-ddd-starter` includes mapper patterns. Spatie's `laravel-event-sourcing` uses projectors (a form of mapping) to convert events into read-optimized state.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-05 Domain layer | LAP-09 Framework independence | LAP-14 Clean Architecture tradeoffs |
| LAP-07 Infrastructure layer | SLP-05 DTO pattern | SLP-18 Anemic domain model |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche�most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
