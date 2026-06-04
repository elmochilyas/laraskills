# Singleton — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Singleton pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Using singleton() for Request-Scoped State in Octane | Critical |
| 2 | Classic GoF Singleton in Service Classes | Critical |
| 3 | Resolving Services Inside register() | High |
| 4 | Binding Concrete Class Instead of Interface | Medium |
| 5 | Singleton with Mutable Internal State | High |

---

## 1. Using singleton() for Request-Scoped State in Octane

### Category
Reliability

### Description
Binding request-scoped state (current user, session data) as singletons in Octane long-running processes, causing cross-request data contamination.

### Why It Happens
Developers use `$this->app->singleton()` for classes that hold request-scoped state, not realizing singletons persist across requests in Octane.

### Warning Signs
- User data from previous request appearing in current request
- Session state leaking between requests
- Request-scoped services bound as singletons
- Octane workers showing cross-request contamination

### Why Harmful
Cross-request data contamination leaks user data between requests, causing data corruption, privacy violations, and hard-to-diagnose bugs.

### Consequences
- Cross-request data leaks
- Privacy violations
- Hard-to-debug data corruption
- Unpredictable behavior

### Alternative
Use `scoped()` binding (Laravel 11+) for request-scoped services. Or use `bind()` (non-singleton) for per-request state.

### Refactoring Strategy
1. Identify singleton bindings of request-scoped services
2. Change to `scoped()` or `bind()`
3. Verify request isolation
4. Test with concurrent requests in Octane

### Detection Checklist
- [ ] Review singleton bindings for request-scoped state
- [ ] Test cross-request isolation
- [ ] Verify Octane compatibility

### Related Rules/Skills/Trees
- Skills: Singleton, Laravel Octane, Service Container
- Decision Trees: Singleton vs Scoped vs Transient

---

## 2. Classic GoF Singleton in Service Classes

### Category
Architecture

### Description
Using the classic GoF Singleton pattern (private constructor, static `getInstance()`) in service classes instead of letting the container manage singletons.

### Why It Happens
Developers come from languages/frameworks where GoF Singleton is standard. They don't use the container's binding.

### Warning Signs
- `private static $instance` in service classes
- `private function __construct()`
- `public static function getInstance()`
- Tests using `Singleton::setInstance()` or reflection hacks

### Why Harmful
GoF Singleton cannot be mocked in tests (static method mocking required). It creates hidden global state and couples callers to the concrete class.

### Consequences
- Cannot mock in tests
- Hidden global state
- Framework bypass
- Testing complexity
- Coupling to concrete class

### Alternative
Register the class as singleton in the service container. Use dependency injection for access.

### Refactoring Strategy
1. Remove static instance and getInstance()
2. Make constructor public
3. Bind as singleton in service provider
4. Inject via constructor in consuming code
5. Update tests to use DI

### Detection Checklist
- [ ] Scan for GoF Singleton pattern
- [ ] Verify container singleton binding
- [ ] Test without static access

### Related Rules/Skills/Trees
- Skills: Singleton, Service Container, Dependency Injection
- Decision Trees: Singleton vs Scoped vs Transient

---

## 3. Resolving Services Inside register()

### Category
Architecture

### Description
Calling `$this->app->make()` or resolving services inside a service provider's `register()` method, before all providers are registered.

### Why It Happens
Developers need a service instance during registration. They call the container at registration time.

### Warning Signs
- `$this->app->make()` in `register()` method
- Constructor injection in service providers
- Accessing resolved instances during registration
- `Cannot resolve ... before all providers registered` errors

### Why Harmful
Not all providers have registered their bindings yet. The resolved service may be incomplete or use wrong implementations.

### Consequences
- Wrong service instances
- Binding order issues
- Runtime errors
- Incomplete configuration

### Alternative
Defer service resolution to `boot()` method, where all providers have registered. Use closures for deferred resolution.

### Refactoring Strategy
1. Move resolution from register() to boot()
2. Use `$this->app->when()->needs()->give()` for parameter binding
3. Use closures for lazy resolution
4. Test provider order

### Detection Checklist
- [ ] Check for resolution in register()
- [ ] Verify boot() usage
- [ ] Test provider order independence

### Related Rules/Skills/Trees
- Skills: Singleton, Service Provider Lifecycle
- Decision Trees: Service Provider Organization

---

## 4. Binding Concrete Class Instead of Interface

### Category
Architecture

### Description
Binding a concrete class to itself (`$this->app->singleton(ConcreteClass::class)`) instead of binding an interface to its implementation.

### Why It Happens
Simpler to bind the class directly. No interface exists.

### Warning Signs
- `$this->app->singleton(SomeClass::class)` without interface
- Auto-resolution used but class has no interface
- Mocking requires complex workarounds
- Implementation cannot be swapped

### Why Harmful
Binding concrete class to itself provides no abstraction benefit. Auto-resolution bypasses the binding. Cannot substitute implementation.

### Consequences
- No abstraction benefit
- Cannot swap implementation
- Testing difficulty
- Bypassed bindings

### Alternative
Define an interface for the service. Bind interface to implementation in container. Depend on interface, not concrete class.

### Refactoring Strategy
1. Extract interface from concrete class
2. Bind interface to implementation
3. Update consumers to depend on interface
4. Verify auto-resolution goes through binding

### Detection Checklist
- [ ] Check bindings for concrete class vs interface
- [ ] Verify dependency on interfaces in consuming code
- [ ] Test implementation swapping

### Related Rules/Skills/Trees
- Skills: Singleton, Dependency Inversion Principle, Interface Segregation
- Decision Trees: Singleton vs Scoped vs Transient

---

## 5. Singleton with Mutable Internal State

### Category
Reliability

### Description
A singleton service holds mutable internal state (counters, caches, temporary data) that gets corrupted across concurrent requests.

### Why It Happens
Services are designed as singletons for performance without considering state safety.

### Warning Signs
- Singleton with mutable properties
- Counters, accumulators, or temporary caches in singleton
- Data from one request appearing in another
- Race conditions in long-running processes

### Why Harmful
Concurrent requests modify the same singleton instance. Mutable state causes data corruption, race conditions, and unpredictable behavior.

### Consequences
- Data corruption
- Race conditions
- Cross-request state leaks
- Non-deterministic behavior

### Alternative
Singletons should be stateless. Use immutable configuration. For per-request state, inject new instances or use request-scoped services.

### Refactoring Strategy
1. Remove mutable state from singleton
2. Move state to parameters or request-scoped services
3. Make singleton methods stateless
4. Test concurrent access safety

### Detection Checklist
- [ ] Check singletons for mutable state
- [ ] Verify concurrent access safety
- [ ] Test cross-request isolation

### Related Rules/Skills/Trees
- Skills: Singleton, Immutability, Concurrency
- Decision Trees: Singleton vs Scoped vs Transient
