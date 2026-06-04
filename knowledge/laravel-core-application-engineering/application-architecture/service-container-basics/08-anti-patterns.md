# ECC Anti-Patterns — Service Container Basics

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Service Container Basics |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Service Locator Abuse (`app()->make()` in Business Logic)
2. Binding Concrete-to-Concrete Redundantly
3. Using `bind()` for Stateless Services (Singleton Required)
4. Resolving Value Objects Through Container

---

## Repository-Wide Anti-Patterns

- God Binding Configuration (hundreds of bindings in a single provider)
- Circular Dependencies Through Constructor Injection
- Container Reference in Serialized Job Payloads

---

## Anti-Pattern 1: Service Locator Abuse

### Category
Design | Testing

### Description
Calling `app(UserRepository::class)->find($id)` inside service, action, or domain classes instead of constructor injection.

### Why It Happens
It's faster to write `app(Service::class)` than to add a constructor parameter. The class "works" immediately.

### Warning Signs
- `app()` or `resolve()` calls in method bodies of business logic classes
- Class constructor has fewer parameters than the number of services used
- Unit tests require `$this->instance()` mocking for every test
- Class cannot be instantiated with `new` in a pure unit test

### Why It Is Harmful
Every `app()` call creates a hidden dependency invisible in the class signature. The class cannot be tested in isolation without the container. The dependency graph is undocumented. Refactoring requires grep-based searches.

### Refactoring Strategy
1. Identify all `app()`, `resolve()`, `make()` calls in each business logic class
2. Add each identified service as a constructor parameter
3. Replace method body calls with `$this->service->method()`
4. Update tests to inject mocks through the constructor

### Related Rules
- Rule: Use Constructor Injection Over Container Resolution in Application Code

---

## Anti-Pattern 2: Binding Concrete-to-Concrete Redundantly

### Category
Architecture

### Description
Registering `$this->app->bind(FileLogger::class, FileLogger::class)` — a redundant binding because concrete classes auto-resolve via reflection.

### Why It Happens
Copy-paste from interface binding patterns. The developer assumes all services need explicit registration.

### Warning Signs
- Service provider contains `bind(Service::class, Service::class)` entries
- Removing the binding does not break anything (the class auto-resolves)
- Provider code is cluttered with noise bindings

### Preferred Alternative
Only bind interfaces or abstract classes. Let concrete classes auto-resolve.

### Related Rules
- Rule: Bind Interfaces, Not Concrete Classes

---

## Anti-Pattern 3: Using `bind()` for Stateless Services

### Category
Performance

### Description
Registering a stateless service (logger, repository, gateway) with `$app->bind()` instead of `$app->singleton()`, creating a new instance on every resolution.

### Why It Happens
Developers default to `bind()` without considering the service's statefulness.

### Warning Signs
- Stateless services registered with `bind()` (no instance holds per-request state)
- Object construction cost is paid repeatedly for the same service
- Memory allocation increases proportionally to resolution count

### Preferred Alternative
Use `singleton()` for stateless services. Use `bind()` only for services that need a fresh instance on every resolution.

### Related Rules
- Rule: Use Singletons for Stateless Services

---

## Anti-Pattern 4: Resolving Value Objects Through Container

### Category
Design | Performance

### Description
Using `app(UserRegistrationData::class, ['email' => '...'])` instead of `new UserRegistrationData(...)`.

### Why It Happens
Developers over-apply container resolution to all object creation, including data objects with no dependencies.

### Warning Signs
- DTOs, value objects, and data transfer objects resolved through `app()` or `make()`
- Constructor only takes data parameters (no service dependencies)
- Reflection overhead for simple data construction

### Preferred Alternative
Use `new` for value objects and DTOs. Reserve container resolution for services with dependencies.

### Related Rules
- Rule: Never Use Container Resolution for Value Objects or DTOs
