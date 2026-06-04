# ECC Anti-Patterns — Layered Architecture

## Domain: Backend Architecture & Design | Subdomain: Architectural Styles

### Anti-Pattern Inventory

1. **Layer Skipping** — Presentation calling Infrastructure directly, bypassing Application/Domain
2. **Domain Depends on Infrastructure** — Models calling Mail Facade or Queue directly
3. **God Layer** — Infrastructure layer used everywhere, no isolation
4. **No Clear Boundaries** — Business logic in controllers, database queries in views
5. **Framework Coupling** — All layers tightly coupled to Laravel, impossible to swap
6. **Fat Controller** — Controllers containing business logic that belongs in services

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Layer Skipping

**Category:** Architecture

**Description:** Controllers or views directly calling Eloquent models, repositories, or infrastructure code.

**Why It Happens:** Convenience — Laravel's `User::find()` is always available from any layer.

**Warning Signs:** `App\Models\User::where(...)` in Blade views; controller methods with raw DB queries.

**Why Is It Harmful:** Bypasses application/domain layer where business rules should live. Changes to persistence affect presentation layer directly.

**Preferred Alternative:** Controllers delegate to services/actions; views receive prepared data only.

**Refactoring Strategy:** Move DB calls from controllers to service layer. Replace inline queries with repository/action classes.

**Related Rules:** Presentation depends only on Application layer (05-rules.md)

---

### Anti-Pattern 2: Domain Depends on Infrastructure

**Category:** Architecture

**Description:** Domain layer (Models, Domain Services) calling Mail, Queue, Cache, or other infrastructure.

**Why It Happens:** Convenience — Laravel facades available globally; domain objects need to send notifications.

**Warning Signs:** `Mail::send()` inside model method; `Queue::push()` in domain service; `Cache::remember()` in entity.

**Why Is It Harmful:** Creates tight coupling between business rules and infrastructure. Domain cannot be tested without infrastructure. Changes to mail/queue break domain logic.

**Preferred Alternative:** Domain defines interfaces; infrastructure layer implements them. Domain calls abstractions, not concrete services.

**Refactoring Strategy:** Extract infrastructure calls behind interfaces (e.g., `NotificationSender`). Inject into domain via constructor.

**Related Rules:** Domain must not depend on infrastructure layer (05-rules.md)

---

### Anti-Pattern 3: God Layer

**Category:** Architecture

**Description:** Infrastructure layer contains most logic and is depended on by all other layers.

**Why It Happens:** Eloquent models are treated as both domain objects and persistence objects, making them a dependency sink.

**Warning Signs:** Every service class injects multiple Eloquent models; infrastructure classes coupled to everything.

**Why Is It Harmful:** Infrastructure changes cascade throughout system. Testing requires full Laravel bootstrap. Becomes a big ball of mud.

**Preferred Alternative:** Isolate infrastructure behind interfaces. Domain depends on abstractions, not implementations.

**Refactoring Strategy:** Add repository interfaces in domain. Move Eloquent-specific code behind them.

**Related Rules:** Isolate infrastructure behind interfaces (05-rules.md)

---

### Anti-Pattern 4: No Clear Boundaries

**Category:** Architecture

**Description:** Business logic scattered across controllers, services, helpers, and models without clear layer assignment.

**Why It Happens:** No architectural guidelines; each developer follows their own pattern.

**Warning Signs:** Same business rule implemented differently in different controllers; no consistent service layer.

**Why Is It Harmful:** Inconsistent design makes code unpredictable. Bugs introduced when developers can't find where logic lives.

**Preferred Alternative:** Define clear layer responsibilities and enforce with architecture rules.

**Refactoring Strategy:** Define layer map. Move business logic to domain/services. Enforce with PHPStan custom rules.

**Related Rules:** Define and enforce layer boundaries (05-rules.md)

---

### Anti-Pattern 5: Framework Coupling

**Category:** Architecture

**Description:** All layers import Laravel-specific classes, making framework replacement impossible.

**Why It Happens:** Laravel is the framework; why abstract from it? — common but short-sighted reasoning.

**Warning Signs:** Domain classes extend `Model`, use `Facade`, import `Request`; business logic tied to Laravel's conventions.

**Why Is It Harmful:** Framework lock-in. Cannot migrate to different framework without full rewrite. Business logic not portable.

**Preferred Alternative:** Inner layers (Domain, Use Cases) are pure PHP without framework imports.

**Refactoring Strategy:** Extract pure domain classes. Move framework concerns to outer layers. Use dependency injection for framework services.

**Related Rules:** Inner layers must be framework-independent (05-rules.md)

---

### Anti-Pattern 6: Fat Controller

**Category:** Architecture

**Description:** Controllers containing business logic, validation, persistence, and response formatting.

**Why It Happens:** Convenience — controller is the entry point, easy to add logic there.

**Warning Signs:** Controller methods > 20 lines; controllers calling Eloquent directly; controllers with injected repositories and services.

**Why Is It Harmful:** Business logic not reusable across controllers. Testing requires HTTP stack. Single-responsibility principle violated.

**Preferred Alternative:** Controllers handle HTTP concerns only. Delegate to service/action classes for business logic.

**Refactoring Strategy:** Extract inline logic to action/service class. Controller calls one method on action. Move validation to Form Requests.

**Related Rules:** Keep controllers thin (05-rules.md)
