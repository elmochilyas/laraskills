# ECC Anti-Patterns — Anemic vs Rich Domain Model

## Domain: Backend Architecture & Design | Subdomain: Anti-Patterns & Architectural Smells

### Anti-Pattern Inventory

1. **Anemic Everywhere** — All models are data holders; all logic in services
2. **Rich Model with Persistence** — Domain model coupled to database/ORM
3. **Overcorrection** — Forcing behavior onto models that don't need it
4. **All-or-Nothing Thinking** — Trying to make entire codebase rich or anemic uniformly
5. **Ignoring Eloquent's Dual Role** — Not acknowledging model is both domain + persistence object
6. **Fat Rich Models** — Models growing beyond reasonable size with too many responsibilities

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Anemic Everywhere

**Category:** Domain Modeling

**Description:** All models are property bags with getters/setters. All business logic in service classes.

**Why It Happens:** Laravel's default pattern encourages anemic models; services feel "cleaner."

**Warning Signs:** Model files contain only `$fillable`, `$casts`, relationships; 500+ line service classes.

**Why Is It Harmful:** Business logic scattered across services. No encapsulation — any code can change model state. Procedural code in OOP clothing.

**Preferred Alternative:** Place behavioral methods on models that operate on their own state.

**Refactoring Strategy:** Identify logic in services that operates on single model state. Move to model methods.

**Related Rules:** Put behavior on the model that owns the data (05-rules.md)

---

### Anti-Pattern 2: Rich Model with Persistence

**Category:** Domain Modeling

**Description:** Rich domain model extends Eloquent Model, mixing behavior with persistence.

**Why It Happens:** Developer wants rich model and uses Eloquent as the model.

**Warning Signs:** `class Order extends Model` contains 20+ business methods and DB concerns.

**Why Is It Harmful:** Business logic coupled to database. Testing requires database. Cannot easily swap storage. Model has two reasons to change.

**Preferred Alternative:** Separate domain model (pure PHP) from persistence (Eloquent model or repository).

**Refactoring Strategy:** Extract pure domain class. Create repository that maps between Eloquent and domain model.

**Related Rules:** Separate domain behavior from persistence (05-rules.md)

---

### Anti-Pattern 3: Overcorrection

**Category:** Domain Modeling

**Description:** Forcing rich model patterns on simple CRUD operations.

**Why It Happens:** Developers read about anemic model anti-pattern and overcorrect.

**Warning Signs:** Simple field update has 3 methods on model, 2 interfaces, a repository; `User->changeName()` for a single field update.

**Why Is It Harmful:** Unnecessary complexity for trivial operations. Development velocity suffers.

**Preferred Alternative:** Use anemic models for simple CRUD. Apply rich model only for complex business rules.

**Refactoring Strategy:** Keep simple setters for CRUD fields. Use behavioral methods only for operations with business rules.

**Related Rules:** Apply rich model selectively by complexity (05-rules.md)

---

### Anti-Pattern 4: All-or-Nothing Thinking

**Category:** Architecture

**Description:** Attempting to make entire codebase use exclusively rich or exclusively anemic models.

**Why It Happens:** Pattern purity valued over pragmatic tradeoffs.

**Warning Signs:** Debates about "what pattern do we use?" instead of "what fits here?"

**Why Is It Harmful:** Forces wrong pattern in wrong places. Simple password update gets same ceremony as order checkout.

**Preferred Alternative:** Mixed approach — rich models for complex domains, anemic for simple CRUD.

**Refactoring Strategy:** Assess each bounded context independently. Pick appropriate model style per context.

**Related Rules:** Choose model style per context, not per codebase (05-rules.md)

---

### Anti-Pattern 5: Ignoring Eloquent's Dual Role

**Category:** Pragmatism

**Description:** Treating Eloquent models as pure domain objects without acknowledging persistence coupling.

**Why It Happens:** Developers want Clean Architecture purity but use Eloquent as domain model.

**Warning Signs:** Rich behavior on Eloquent models with no separation; tests require database for domain logic.

**Why Is It Harmful:** False sense of architecture purity. Domain logic still coupled to DB — just well-hidden.

**Preferred Alternative:** Acknowledge the tradeoff. Either accept Eloquent as domain model (pragmatic) or separate fully.

**Refactoring Strategy:** Either accept Eloquent models with behavior (pragmatic decision) or extract pure domain classes.

**Related Rules:** Acknowledge and manage Eloquent coupling (05-rules.md)

---

### Anti-Pattern 6: Fat Rich Models

**Category:** Maintainability

**Description:** Rich model grows too large with too many responsibilities.

**Why It Happens:** All behavioral methods accumulate on the model.

**Warning Signs:** Model class > 500 lines; model handles reporting, validation, formatting, and persistence.

**Why Is It Harmful:** Violates SRP. Model has multiple reasons to change. Testing requires huge setup.

**Preferred Alternative:** Extract domain services for cross-entity operations. Keep model methods operating on its own state only.

**Refactoring Strategy:** Extract formatting/presentation logic. Extract operations involving multiple entities to domain services.

**Related Rules:** Keep models focused on own state behavior (05-rules.md)
