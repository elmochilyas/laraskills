# ECC Anti-Patterns — God Class

## Domain: Backend Architecture & Design | Subdomain: Anti-Patterns & Architectural Smells

### Anti-Pattern Inventory

1. **Eloquent God Model** — User/Order model handling auth, billing, notifications, reporting
2. **Service God Class** — Service class doing CRUD, export, email, validation
3. **Trait Accumulation** — Model accumulating behaviors via traits instead of composition
4. **Accessor/Mutator Proliferation** — Too many computed attributes on model
5. **Model Event Overload** — Too many model event listeners causing cascading side effects
6. **Controller God Class** — Controller handling many unrelated endpoints

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Eloquent God Model

**Category:** Architecture

**Description:** Eloquent model accumulating responsibilities across multiple domains (auth, billing, notifications, profile).

**Why It Happens:** Eloquent's Active Record design makes models the natural place for anything related to that entity.

**Warning Signs:** User model > 500 lines with authentication, billing, notification, and profile methods.

**Why Is It Harmful:** SRP violation — change to billing affects user model used everywhere. Testing requires complete setup.

**Preferred Alternative:** Extract domain-specific behaviors into dedicated classes. Model is thin, focused on core identity.

**Refactoring Strategy:** Extract billing methods to `BillingService`; profile methods to `ProfileService`; notification methods to notification classes.

**Related Rules:** Keep models focused on core identity (05-rules.md)

---

### Anti-Pattern 2: Service God Class

**Category:** Architecture

**Description:** Single service class handling CRUD, reporting, export, email, and validation.

**Why It Happens:** Service is the "default" place for logic; all related operations go there.

**Warning Signs:** `OrderService` with 20+ public methods for unrelated operations.

**Why Is It Harmful:** Multiple variation axes. Testing requires mocking many dependencies. Changes cause unexpected side effects.

**Preferred Alternative:** Single-action classes or focused services with one responsibility.

**Refactoring Strategy:** Split service methods into individual action classes (`CreateOrder`, `ExportOrders`, `SendOrderNotifications`).

**Related Rules:** One action class or focused service per responsibility (05-rules.md)

---

### Anti-Pattern 3: Trait Accumulation

**Category:** Architecture

**Description:** Eloquent model using multiple traits to gain behaviors, leading to hidden coupling.

**Why It Happens:** Laravel promotes trait usage for shared model behavior; developers add traits for every feature.

**Warning Signs:** Model with 5+ traits; trait methods conflict; understanding model behavior requires reading all traits.

**Why Is It Harmful:** Traits create implicit coupling. Overriding trait methods is fragile. Behavior is scattered across files.

**Preferred Alternative:** Use composition — inject behavior classes instead of inheriting via traits.

**Refactoring Strategy:** Replace traits with injected services. Model delegates to composed services.

**Related Rules:** Prefer composition over trait inheritance (05-rules.md)

---

### Anti-Pattern 4: Accessor/Mutator Proliferation

**Category:** Design

**Description:** Too many computed attributes on Eloquent models (`getXAttribute`, `setXAttribute`).

**Why It Happens:** Convenient way to add computed fields; grows without discipline.

**Warning Signs:** >10 accessors/mutators on single model; accessors mixing formatting, calculation, and business logic.

**Why Is It Harmful:** Model becomes a view layer and calculation layer. Business logic in accessors. SRP violation.

**Preferred Alternative:** Use dedicated value objects or presenters for formatting. Domain services for calculations.

**Refactoring Strategy:** Extract formatting accessors to presenters/view models. Extract calculation accessors to domain services.

**Related Rules:** Limit accessors to simple field formatting (05-rules.md)

---

### Anti-Pattern 5: Model Event Overload

**Category:** Architecture

**Description:** Model events (`creating`, `saved`, `deleted`) triggering too many side effects.

**Why It Happens:** Model events execute automatically, making them attractive for cross-cutting concerns.

**Warning Signs:** >5 model event listeners; model events sending emails, updating caches, notifying external systems.

**Why Is It Harmful:** Implicit behavior — saving a model triggers unknown side effects. Testing models becomes dangerous. Debugging hard.

**Preferred Alternative:** Explicit service/action calls for operations with side effects. Reserve model events for model-specific concerns.

**Refactoring Strategy:** Move side effects from model events to explicit service calls. Keep only model-internal events (slug generation, status sync).

**Related Rules:** Avoid implicit side effects in model events (05-rules.md)

---

### Anti-Pattern 6: Controller God Class

**Category:** Architecture

**Description:** Single controller handling many unrelated endpoints and actions.

**Why It Happens:** Grouping by resource makes controller grow; all CRUD + custom actions in one class.

**Warning Signs:** Controller with 15+ methods; single controller handling admin, API, and web routes.

**Why Is It Harmful:** Large controller is hard to navigate. Multiple SRP violations. Testing requires full HTTP setup.

**Preferred Alternative:** Split controllers by action or feature. One controller per resource or use case.

**Refactoring Strategy:** Extract each group of related actions to its own controller. Use single-action controllers for complex operations.

**Related Rules:** Keep controllers focused on single resource or action group (05-rules.md)
