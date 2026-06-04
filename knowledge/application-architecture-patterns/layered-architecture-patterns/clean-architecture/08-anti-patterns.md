# ECC Anti-Patterns — Clean Architecture Layers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | Clean Architecture layers: Domain, Application, Infrastructure, Presentation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Contaminated Domain
2. Anemic Domain
3. Over-Mapping
4. Architecture Paralysis

---

## Anti-Pattern 1: Contaminated Domain

### Description
Domain layer contains `use Illuminate\*` imports, Eloquent model extensions, or facade calls. The core business logic is coupled to Laravel — the primary benefit of Clean Architecture is destroyed.

### Why It Happens
Habit — using facades and Eloquent is reflex for Laravel developers. Not enforcing the Dependency Rule with architecture tests.

### Warning Signs
- `use Illuminate\Database\Eloquent\Model` in Domain classes
- `\DB::table()`, `\Cache::get()` in Domain
- Domain entities `extends Model`
- Architecture tests fail for Domain layer

### Preferred Alternative
Domain layer must have zero framework imports — pure PHP only. Architecture tests enforce this strictly.

### Related Rules
- Dependency Rule (LAP-04/05-rules.md)

### Related Skills
- Implement Clean Architecture Layers in Laravel (LAP-02/06-skills.md)

---

## Anti-Pattern 2: Anemic Domain

### Description
Domain entities are property bags with only getters/setters and no behavior. All business logic lives in Application services. The Domain layer is just a data structure — business rules are scattered across outer layers.

### Why It Happens
Treating entities like data containers. Not understanding that entities should enforce their own invariants.

### Warning Signs
- Entity methods are only `getX()`, `setX()`
- Business rules checked in Application/Presentation only
- `$invoice->setStatus()` can set any status without validation

### Preferred Alternative
Entities enforce their own invariants. `$invoice->markAsPaid()` checks preconditions before changing state.

### Related Rules
- Entities enforce their own invariants (LAP-05/05-rules.md)

---

## Anti-Pattern 3: Over-Mapping

### Description
Domain entities are identical to Eloquent models in structure, but mapping code converts between them anyway. The mapping adds cost (performance, maintenance) without providing value since both representations are identical.

### Why It Happens
Following Clean Architecture dogma without evaluating if the abstraction provides benefit.

### Preferred Alternative
If domain entities are identical to Eloquent models, reconsider whether Clean Architecture is justified. Use three-layer architecture instead.
