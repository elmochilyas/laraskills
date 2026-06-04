# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Domain Entity to Eloquent Model Mapping
Knowledge Unit ID: LAP-10-domain-eloquent-mapping
Difficulty Level: Advanced
Category: Architecture | Persistence Mapping
Last Updated: 2026-06-04

---

# Overview

In layered architecture with DDD tactical patterns, Domain Entities are pure PHP objects with business behavior, while Eloquent Models are database-aware persistence objects. Mapping between these two representations is the primary responsibility of Repository implementations in the Infrastructure layer.

This mapping is not trivial. Domain Entities may use Value Objects, have complex hierarchies, enforce invariants through behavior methods, and use identity types different from database primary keys. Eloquent Models have timestamps, foreign keys, pivot tables, and Eloquent-specific relationship patterns. The mapper bridges these two worlds.

The key architectural principle: mapping code lives in Infrastructure, never in Domain or in Eloquent models. The Domain should not know about Eloquent. The Eloquent model should not contain Domain logic. The mapper is an Infrastructure concern that translates between the two representations.

---

# Core Concepts

**Hydrator (Model → Domain)**: Code that reads from Eloquent Model(s) and constructs Domain Entity/Aggregate instances. Handles nested relationships, Value Object reconstruction, and recursion through complex Aggregate structures.

**Extractor (Domain → Model)**: Code that reads from Domain Entity/Aggregate and populates Eloquent Model(s). Handles Value Object flattening to primitives, nested entity persistence, and diff-based updates.

**Mapping Direction**: Mapping is bidirectional. The read path (Model → Domain) constructs Domain objects from database state. The write path (Domain → Model) persists Domain state to the database. These are separate concerns with separate code.

**Persistence Diff**: The strategy for detecting what changed in a Domain Aggregate and applying only those changes to the database. Options include full replacement (delete and re-insert all relations) or field-level diff tracking.

**Round-Trip**: A test pattern where a Domain Aggregate is mapped to Model, then back to Domain, and the result is compared to the original. Round-trip tests validate the mapping is correct and complete.

---

# When To Use

- Clean Architecture or DDD where Domain entities are separate from Eloquent models
- Database schema differs from Domain model structure (normalized DB vs. rich Domain model)
- Need to enforce Aggregate consistency boundaries through Repository abstraction
- Business logic must be testable without database — Domain objects exist independent of persistence
- Value Objects with complex structure need conversion to/from database columns

---

# When NOT To Use

- Simple CRUD where Domain entity equals database schema — Active Record is sufficient
- Small projects where mapping overhead is not justified by complexity
- Prototypes where speed matters more than architectural purity
- When Domain objects and database schema are isomorphic (one-to-one mapping with no transformation)

---

# Best Practices

**Keep mapping in Infrastructure, not in Domain or Model.** Mapping logic belongs in Repository implementations or dedicated Mapper classes. Domain Entities should not have `toArray()` methods that mirror database columns. Eloquent Models should not have methods that construct Domain objects.

**Map bidirectionally with separate code paths.** The hydrator (Model → Domain) and extractor (Domain → Model) are separate concerns. Do not share code between them. They may diverge as the Domain model and database schema evolve independently.

**Handle Value Objects explicitly.** Each Value Object needs mapping logic: flatten to primitive(s) for the database, reconstruct from primitive(s) for the Domain. Use explicit conversion methods or dedicated mapper sub-classes.

**Test round-trip fidelity.** Create a Domain Aggregate, map to Model, map back to Domain, and assert equality. This catches mapping gaps, missing properties, and incorrect Value Object reconstruction.

**Handle nested entities recursively.** Aggregates contain nested Entities and Value Objects. The mapper must traverse the entire Aggregate structure, handling collections, ordering, and relationship hydration.

---

# Architecture Guidelines

- Mapper classes exist in the Infrastructure layer, alongside Repository implementations.
- The Repository interface (Domain) defines load/save operations. The Repository implementation (Infrastructure) orchestrates mapping.
- Domain Entities should not implement `JsonSerializable`, `Arrayable`, or Eloquent-specific interfaces.
- Eloquent Models should not reference Domain classes. The mapper bridges them.
- Mapping is structural, not behavioral. Mappers should not invoke Domain behavior — they extract and populate data only.
- For simple Value Objects, Eloquent custom casts provide a lighter-weight alternative to explicit mapping.

---

# Performance Considerations

- Mapping overhead varies with Aggregate size. Profile real aggregates, not micro-benchmarks. Typical overhead is <5ms per request for complex Aggregates.
- Lazy loading in the hydrator causes N+1 queries. Eager-load all known relationships when hydrating a full Aggregate.
- For batch operations, map in bulk and persist in a single transaction. Avoid per-Aggregate mapping overhead in loops.
- Diff-based persistence reduces write operations for partial updates but adds comparison overhead. Profile to determine which strategy is faster for your Aggregate.

---

# Security Considerations

- Domain Entities control what data is exposed through behavior methods. Mappers extract data for persistence purposes only — not for API responses.
- Ensure mapping does not expose internal Entity state to unauthorized callers. The mapper is a persistence concern, not a serialization concern.
- Mappers should not copy sensitive data (passwords, tokens) between representations unnecessarily. If the Domain uses Value Objects for sensitive data, ensure the mapper handles them appropriately.

---

# Common Mistakes

1. **Domain dependencies in mapping code.** Mapper logic that invokes Domain behavior during mapping (e.g., calling business methods while hydrating). Mapping should be purely structural — copy data, don't execute business rules.

2. **Eloquent in Domain.** Returning Eloquent collections from Repository interface methods. The Repository interface must return Domain objects. Callers should never see Eloquent types.

3. **Circular mapping.** Related entities mapping back to their parent creates infinite loops. Break cycles with identity-only references or depth limits.

4. **Over-mapping.** Mapping every single field even when the Aggregate subset is never consumed. Map only the data that is actually used by the application.

5. **Identity mismatch.** Domain identity (UUID string) vs database identity (auto-increment integer). Maintain both if needed. The Domain uses its own identity type; the database identity is an Infrastructure concern.

6. **Missing round-trip tests.** Without round-trip tests, mapping errors go unnoticed until production data reveals inconsistencies.

---

# Anti-Patterns

- **Domain-Laced Mapping**: Mapper that invokes Domain behavior methods during data extraction.
- **Eloquent Leak**: Repository interface returning Eloquent collection types or paginators.
- **Circular Reference Loop**: Bi-directional mappings that infinitely recurse.
- **Anemic Mapping**: Mapping only primitive fields while ignoring Value Objects and nested entities.
- **Mixed Direction Code**: Single method that both hydrates and extracts, collapsing two concerns.

---

# Examples

**Domain Aggregate:**
```php
class Invoice
{
    public function __construct(
        private readonly InvoiceId $id,
        private CustomerId $customerId,
        private InvoiceStatus $status,
        private Money $total,
        private array $lineItems,
        private \DateTimeImmutable $createdAt,
    ) {}
}
```

**Eloquent Model:**
```php
class InvoiceModel extends Model
{
    protected $table = 'invoices';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    public function lineItems(): HasMany
    {
        return $this->hasMany(LineItemModel::class, 'invoice_id');
    }
}
```

**Mapper in Infrastructure:**
```php
class EloquentInvoiceMapper
{
    public function toDomain(InvoiceModel $model): Invoice
    {
        return new Invoice(
            id: new InvoiceId($model->id),
            customerId: new CustomerId($model->customer_id),
            status: InvoiceStatus::from($model->status),
            total: new Money($model->total_cents, new Currency($model->currency)),
            lineItems: $model->lineItems->map(
                fn(LineItemModel $item) => $this->toLineItemDomain($item)
            )->toArray(),
            createdAt: new \DateTimeImmutable($model->created_at),
        );
    }

    public function toModel(Invoice $invoice): InvoiceModel
    {
        $model = new InvoiceModel();
        $model->id = $invoice->id()->toString();
        $model->customer_id = $invoice->customerId()->toString();
        $model->status = $invoice->status()->value;
        $model->total_cents = $invoice->total()->cents();
        $model->currency = $invoice->total()->currency()->code();
        $model->created_at = $invoice->createdAt();
        return $model;
    }
}
```

**Repository Implementation:**
```php
class EloquentInvoiceRepository implements InvoiceRepositoryInterface
{
    public function __construct(
        private EloquentInvoiceMapper $mapper,
    ) {}

    public function find(InvoiceId $id): ?Invoice
    {
        $model = InvoiceModel::with('lineItems')->find($id->toString());
        return $model ? $this->mapper->toDomain($model) : null;
    }

    public function save(Invoice $invoice): void
    {
        $model = $this->mapper->toModel($invoice);
        $model->save();
        // Map and persist line items...
    }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-06 DDD Tactical Patterns | LAP-07 Value Objects | LAP-11 Transaction Boundaries |
| LAP-04 Dependency Rule | LAP-03 Hexagonal Architecture | Event Sourcing (no mapping needed) |
| LAP-02 Clean Architecture | LAP-08 Domain Events | CQRS read model separation |

---

# AI Agent Notes

- Generate Mapper classes in Infrastructure as dedicated classes separate from Repository implementations.
- Map bidirectionally with separate toDomain/toModel methods.
- Always generate round-trip tests that validate mapping fidelity.
- For Value Objects, generate explicit conversion methods in the mapper.
- Default to eager loading in hydrators to prevent N+1.
- For simple Value Objects, consider Eloquent custom casts as a lighter alternative.
