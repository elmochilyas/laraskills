# ECC Anti-Patterns — DI Container Basics (ku-01)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | DI Container Basics |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Service Locator in Business Logic
2. Container as Dependency
3. Over-Binding Concrete Classes
4. Modifying Bindings at Runtime
5. Singleton with Mutable State

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — container resolution is about object construction, not database access
- Premature Caching — caching container bindings before all providers register

---

## Anti-Pattern 1: Service Locator in Business Logic

### Category
Architecture

### Description
Using `app()` inside controllers, services, or domain classes instead of injecting dependencies via constructor.

### Why It Happens
Developers use `app()` for convenience — it works without changing constructor signatures during prototyping and becomes permanent.

### Warning Signs
- `app(Service::class)` scattered across method bodies
- Classes that work without being called from the container
- Constructor parameters are empty despite many dependencies used

### Why It Is Harmful
`app()` hides dependencies — a class may use 10 services but only its method bodies reveal them. This makes testing difficult (mocks cannot be injected) and the dependency graph invisible to readers.

### Real-World Consequences
An `OrderController` calls `app(OrderService::class)`, `app(InventoryService::class)`, and `app(NotificationService::class)` in three different methods. A new developer cannot see what the controller needs without reading every method. Writing a unit test requires discovering and mocking hidden dependencies.

### Preferred Alternative
Inject all dependencies via constructor. Let the container handle recursive resolution.

### Refactoring Strategy
1. Identify all `app()`, `resolve()`, `Container::getInstance()->make()` calls in business classes
2. Add each resolved service as a constructor parameter
3. Move the `app()` call to the caller (or remove it entirely)
4. Run tests to verify injection works

### Detection Checklist
- [ ] `app()` used outside service providers
- [ ] Constructor injection absent despite many `app()` calls
- [ ] Tests cannot inject mocks

### Related Rules
ku-01-di-container-basics (05-rules.md): Never Use app() in Business Logic.

### Related Skills
ku-01-di-container-basics (06-skills.md): Apply Constructor Injection for Explicit Dependencies.

### Related Decision Trees
ku-01-di-container-basics (07-decision-trees.md): D02 — Explicit Binding vs Auto-Resolution.

---

## Anti-Pattern 2: Container as Dependency

### Category
Architecture

### Description
Injecting `Container $container` into a class and calling `$container->make()` in its methods.

### Why It Happens
Developers think they are "using DI" because the container itself is injected, but they are actually creating a disguised service locator.

### Warning Signs
- Constructor parameter type-hinted as `Container` or `Application`
- `$this->container->make()` or `$this->app->make()` calls in methods
- No explicit constructor dependencies beyond the container

### Why It Is Harmful
This is the service locator anti-pattern in disguise — the class still resolves dependencies internally, making them invisible to test setup and static analysis. The container is a framework concern that should not leak into domain classes.

### Real-World Consequences
An `InvoiceService` accepts `Container $container` and calls `$container->make(TaxCalculator::class)` internally. To test, the developer must mock `Container`'s `make()` method — a complex and fragile test setup. After refactoring to inject `TaxCalculator` directly, the test becomes a simple constructor parameter.

### Preferred Alternative
Inject each dependency explicitly. Never inject the container to pull dependencies.

### Refactoring Strategy
1. List every `$container->make()` call in the class
2. Add each as a constructor parameter
3. Remove the `Container $container` parameter
4. Replace internal `->make()` calls with `$this->dependency`

### Detection Checklist
- [ ] `Container` or `Application` type-hinted as constructor parameter
- [ ] `->make()` called in business logic methods
- [ ] Container injected but no direct container features used (other than resolution)

### Related Rules
ku-01-di-container-basics (05-rules.md): Never Inject Container as a Dependency.

### Related Skills
ku-01-di-container-basics (06-skills.md): Apply Constructor Injection for Explicit Dependencies.

### Related Decision Trees
ku-01-di-container-basics (07-decision-trees.md): D02 — Explicit Binding vs Auto-Resolution.

---

## Anti-Pattern 3: Over-Binding Concrete Classes

### Category
Code Organization

### Description
Registering explicit `bind()` calls for concrete classes that auto-resolution handles without registration.

### Why It Happens
Developers register every class they use, thinking explicit registration is required.

### Warning Signs
- `$app->bind(Service::class, Service::class)` — identical abstract and concrete
- Hundreds of bindings in AppServiceProvider for simple concrete classes
- No interfaces involved — concrete-to-concrete bindings

### Why It Is Harmful
Auto-resolution already handles concrete classes with resolvable constructors. Explicit concrete-to-concrete bindings add no value — they duplicate what the container does automatically, clutter provider files, and add maintenance overhead.

### Real-World Consequences
An `AppServiceProvider` has 50 lines of `$this->app->bind(ConcreteService::class, ConcreteService::class)`. Removing them all changes nothing — the container auto-resolves the same way. The provider is now readable and maintainable.

### Preferred Alternative
Let auto-resolution handle concrete classes. Only bind interfaces and classes with non-resolvable dependencies.

### Refactoring Strategy
1. Scan bindings: remove any where abstract === concrete and no special behavior is needed
2. Run the application — if no errors, the bindings were unnecessary
3. Add only interface and contextual bindings

### Detection Checklist
- [ ] `bind(Concrete::class, Concrete::class)` patterns
- [ ] Provider has many bindings for concrete classes
- [ ] Auto-resolution would work without changes

### Related Rules
ku-01-di-container-basics (05-rules.md): Avoid Over-Binding.

### Related Skills
ku-01-di-container-basics (06-skills.md): Skill: Manage Service Container Bindings.

### Related Decision Trees
ku-01-di-container-basics (07-decision-trees.md): D02 — Explicit Binding vs Auto-Resolution.

---

## Anti-Pattern 4: Modifying Bindings at Runtime

### Category
Reliability

### Description
Using `instance()` or `bind()` to change a binding after the application has booted and the original binding may have been resolved.

### Why It Happens
Developers attempt to swap implementations mid-request for conditional behavior.

### Warning Signs
- `$this->app->instance()` called in middleware or controllers
- Conditional binding logic in `boot()` that changes based on request state
- `rebind()` callbacks triggered unexpectedly

### Why It Is Harmful
Once a binding is resolved, the resolved instance is cached in the container's resolved array. Modifying the binding after resolution does not affect already-resolved consumers. Additionally, mid-request binding changes create unpredictable behavior — some consumers get the old instance, some get the new.

### Preferred Alternative
Use contextual binding or strategy pattern for conditional behavior. Register all bindings statically in `register()`.

### Detection Checklist
- [ ] `instance()` called outside service provider `register()`
- [ ] Runtime conditional binding in `boot()`
- [ ] Inconsistent behavior from mid-request binding changes

### Related Rules
ku-01-di-container-basics (05-rules.md): Do Not Modify Container Bindings at Runtime.

### Related Skills
ku-01-di-container-basics (06-skills.md): Skill: Manage Service Container Bindings.

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Singleton with Mutable State

### Category
Reliability

### Description
Using `singleton()` for a service that stores per-request data in properties.

### Why It Happens
Developers don't understand the lifecycle difference — singleton is application-scoped, not request-scoped.

### Warning Signs
- Singleton service has `setUser()`, `setRequestId()`, or similar mutable setters
- Data from one request appears in another
- Service properties modified after initialization

### Why It Is Harmful
A singleton is created once and shared across all requests (or across the entire Octane worker lifetime). If it stores per-request state, request A's data leaks into request B.

### Real-World Consequences
A `CurrentUserService` is registered as singleton with a `setUser(User $user)` method. Request A sets user ID 42. Before A completes, Request B calls `getUser()` and gets user ID 42 — the wrong user. This is a critical data leakage bug.

### Preferred Alternative
Use `bind()` for stateful services, or use `scoped()` in Octane. Ensure singletons are completely stateless.

### Refactoring Strategy
1. Identify mutable properties on singleton services
2. Move per-request state to method parameters or injected request objects
3. Change `singleton()` to `bind()` if state cannot be eliminated
4. For Octane, use `scoped()` bindings

### Detection Checklist
- [ ] Singleton with mutable setters
- [ ] Per-request state stored in service properties
- [ ] Data leaking between requests

### Related Rules
ku-01-di-container-basics (05-rules.md): Prefer Singleton for Stateless Services.

### Related Skills
ku-01-di-container-basics (06-skills.md): Skill: Manage Service Container Bindings.

### Related Decision Trees
ku-01-di-container-basics (07-decision-trees.md): D01 — bind() vs singleton() vs instance().
