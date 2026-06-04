# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Mapping between domain entities and Eloquent models
Knowledge Unit ID: LAP-10
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Mapping between domain entities (pure PHP business objects) and Eloquent models (Laravel's ORM) is the central challenge of Clean Architecture in Laravel. Domain entities know nothing about databases; Eloquent models know nothing about business rules. The mapping layer translates between them. This is where most Clean Architecture projects either succeed or fail.

---

# Core Concepts

- **Domain entity**: Pure PHP object with business behavior. No extends, no traits, no framework.
- **Eloquent model**: ActiveRecord implementation extending `Model`. Knows about database tables, relationships, serialization.
- **Mapping (translation)**: Converting between domain entities and Eloquent models. Usually in Repository implementation.
- **Bidirectional conversion**: Eloquent model → Domain entity (read), Domain entity → Eloquent model (write).

---

# When To Use

- Full Clean Architecture with framework-independent domain
- Domain entities significantly differ from database schema
- Application requires explicit separation between business objects and persistence

---

# When NOT To Use

- Laravel DDD approach (domain entities ARE Eloquent models — accept the coupling)
- Simple mapping where domain entity and database schema are nearly identical
- Projects where mapping overhead exceeds the benefit of framework independence

---

# Best Practices

- **Maintain mappers in Infrastructure layer.** WHY: Mapping is an infrastructure concern — it converts between domain and persistence. Keeping it in Infrastructure respects layer boundaries.
- **Write bidirectional mapper tests.** WHY: An incorrect mapper produces corrupted domain state. Test both directions (domain → model → domain roundtrip) with dedicated unit tests.
- **Use eager loading explicitly before mapping.** WHY: Mappers that trigger lazy loading create N+1 problems and unpredictable performance. Load all needed relationships before calling the mapper.
- **Avoid partial mapping.** WHY: Some fields mapped, others passed through directly creates confusion about where transformations happen. Be consistent — either map all fields or none.
- **Consider DTO as intermediate form.** WHY: Instead of direct entity-to-model mapping, use DTOs as intermediate structures to decouple mapping from both representations.

---

# Architecture Guidelines

- Repository implementation handles mapping — it's the bridge between domain and persistence.
- Mapper accuracy is critical — test roundtrip for every aggregate.
- Mapping deep object graphs (Order → LineItems → Product) creates cascading dependencies and performance issues.
- If mapping overhead is unjustified, consider partial independence (domain entities are Eloquent models).

---

# Performance Considerations

- Mapping overhead is measurable but rarely significant for typical request volumes.
- Each mapping operation creates new objects with memory allocation.
- For high-throughput endpoints, consider caching mapped domain entities or using direct Eloquent for read-only.

---

# Security Considerations

- Mappers should not transform or expose sensitive data beyond what the domain entity defines.
- Ensure mapper does not accidentally expose internal model attributes.

---

# Common Mistakes

1. **Identity crisis:** Mapper duplicates logic existing in both domain entity and Eloquent casts. Cause: not establishing clear responsibility. Consequence: duplicated transformation logic. Better: keep transformations in one place.

2. **Partial mapping:** Some fields mapped, others passed through. Cause: inconsistency. Consequence: confusion about where transformations happen. Better: map all fields or none.

3. **Lazy loading in domain:** Mapper triggers lazy loading when accessing relationships. Cause: not pre-loading. Consequence: N+1 performance issues. Better: eager load before mapping.

4. **Roundtrip failure:** domain → Eloquent → domain produces different object (timezone, floating point, null handling). Cause: asymmetric mapping. Consequence: corrupted domain state. Better: test roundtrip for all mappers.

---

# Anti-Patterns

- **Skipping mapping entirely**: Domain entities are Eloquent models with business methods added — framework coupling accepted but not acknowledged.
- **Mapper as anemic service**: Mapper that just copies field-by-field without any transformation logic — may not justify its existence.

---

# Examples

```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function find(InvoiceId $id): Invoice {
        $model = InvoiceModel::with('lineItems')->findOrFail($id->toString());
        return $this->mapper->toDomain($model);
    }
    public function save(Invoice $invoice): void {
        $data = $this->mapper->toEloquent($invoice);
        InvoiceModel::updateOrCreate(['id' => $invoice->id()->toString()], $data);
    }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-05 Domain layer | LAP-09 Framework independence | LAP-14 Clean Architecture tradeoffs |
| LAP-07 Infrastructure layer | SLP-05 DTO pattern | SLP-18 Anemic domain model |

---

# AI Agent Notes

- Generate mappers in Infrastructure layer, not Domain or Application.
- Ensure bidirectional mapping is complete and symmetrical.
- When domain entities and DB schema are similar, suggest using partial independence (domain as Eloquent) instead of mapping overhead.

---

# Verification

- [ ] Mappers exist for each aggregate root requiring framework independence
- [ ] Roundtrip tests pass for all mappers (domain → model → domain)
- [ ] No lazy loading triggered during mapping (eager load explicitly)
- [ ] Mapper is in Infrastructure layer, not in Domain
- [ ] All fields are explicitly mapped (no partial mapping)
