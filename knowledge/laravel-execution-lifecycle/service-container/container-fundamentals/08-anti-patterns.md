# ECC Anti-Patterns — Container Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Container Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Service Locator in Business Logic
2. Using Container as Key-Value Store
3. Binding Concrete-to-Concrete
4. Array Push Syntax for Service Registration
5. Calling make() Inside Controllers Instead of Constructor Injection

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — container resolution triggers object construction, not DB queries
- Premature Caching — container instance cache is for singleton lifecycle, not performance optimization

---

## Anti-Pattern 1: Service Locator in Business Logic

### Category
Architecture

### Description
Calling `app()->make()`, `resolve()`, or `app('service')` inside controllers, jobs, or services instead of declaring dependencies in the constructor.

### Why It Happens
Developers find it convenient to resolve services inline rather than managing constructor parameter lists.

### Warning Signs
- `resolve()` or `app()->make()` inside `handle()` methods
- Hidden dependencies not visible in constructor signature
- Tests requiring full container bootstrapping

### Why It Is Harmful
Every `app()->make()` call hides a dependency from the class signature. The class cannot be tested without bootstrapping the full container — you cannot mock the dependency by passing a constructor argument. Static analysis tools cannot trace the dependency graph. Refactoring becomes risky because you don't know which services are expected to exist.

### Preferred Alternative
Declare all dependencies in the constructor. Use the container only in the composition root (service providers).

### Detection Checklist
- [ ] `resolve()` or `app()->make()` in business logic
- [ ] Hidden dependencies in methods
- [ ] Tests requiring container bootstrapping

### Related Rules
Do Not Inject app() or resolve() in Business Logic (05-rules.md)

---

## Anti-Pattern 2: Using Container as Key-Value Store

### Category
Framework Usage

### Description
Using `$app['key'] = value` for arbitrary data storage instead of `bind()` or `instance()` — bypasses the binding system.

### Preferred Alternative
Use `$app->instance()` for pre-constructed objects, `$app->bind()` for factories.

### Detection Checklist
- [ ] `$app['key'] = value` for non-service data
- [ ] Bypassed binding lifecycle
- [ ] Extenders and callbacks don't apply

---

## Anti-Pattern 3: Binding Concrete-to-Concrete

### Category
Architecture

### Description
Binding `$app->bind(ConcreteA::class, ConcreteB::class)` instead of binding an interface to a concrete.

### Preferred Alternative
Bind interfaces or abstract contracts to implementations.

### Detection Checklist
- [ ] Two concrete classes bound together
- [ ] No interface in the binding
- [ ] Violates Dependency Inversion Principle

---

## Anti-Pattern 4: Array Push Syntax for Service Registration

### Category
Framework Usage

### Description
Using `$app['services'][] = new Service()` in providers — rebound callbacks not triggered, modifications invisible to lifecycle.

### Preferred Alternative
Use `tag()` for service collections.

### Detection Checklist
- [ ] Array push syntax in provider
- [ ] Rebound callbacks not firing
- [ ] Invisible container modifications

---

## Anti-Pattern 5: Calling make() Inside Controllers Instead of Constructor Injection

### Category
Architecture

### Description
Controller methods calling `$this->app->make(Service::class)` instead of injecting via constructor.

### Preferred Alternative
Declare all controller dependencies in the constructor.

### Detection Checklist
- [ ] `make()` in controller methods
- [ ] Empty constructors
- [ ] Untestable controllers in isolation
