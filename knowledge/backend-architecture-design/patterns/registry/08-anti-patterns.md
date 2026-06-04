# Registry — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Registry pattern (Service Container) |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | app() Calls Scattered Through Business Logic | Critical |
| 2 | config() Used for Runtime State | High |
| 3 | Storing Mutable Objects in Registry | High |
| 4 | Using Registry as Service Locator | Critical |
| 5 | Overriding Registered Services Without Understanding Lifecycle | Medium |

---

## 1. app() Calls Scattered Through Business Logic

### Category
Architecture

### Description
Calling `app()` (service locator pattern) inside business logic classes to resolve dependencies instead of using constructor injection, creating hidden dependencies.

### Why It Happens
Convenience: `app()->make()` is available anywhere. Developers don't want to add constructor parameters.

### Warning Signs
- `app()->make()`, `resolve()`, or `app(SomeClass::class)` in domain/business code
- Hidden dependencies not visible in constructor signature
- Unit tests requiring container setup
- Classes with no explicit dependency list

### Why Harmful
Dependencies are hidden. A class can pull anything from the container at any time. Testing requires full container knowledge. The class's actual dependencies are undocumented.

### Consequences
- Hidden dependencies
- Difficult testing (must mock container)
- Unknown coupling
- Runtime errors from missing bindings
- Violates Dependency Inversion

### Alternative
Use constructor injection. All dependencies are explicit, visible, and verifiable. The container resolves constructor parameters automatically.

### Refactoring Strategy
1. Identify `app()` calls in business logic
2. Move dependencies to constructor parameters
3. Add type hints for each dependency
4. Remove `app()` calls
5. Verify tests no longer need container mocking

### Detection Checklist
- [ ] Scan for `app()->make()` or `resolve()` in business code
- [ ] Verify constructor injection pattern
- [ ] Check test setup complexity

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Registry, Dependency Injection, Service Container

---

## 2. config() Used for Runtime State

### Category
Architecture

### Description
Using `config()` to store and retrieve runtime state (request data, session values, computed results) instead of static configuration values.

### Why It Happens
`config()` is globally accessible and convenient for storing any key-value data.

### Warning Signs
- `config()` values changing at runtime
- Config used for session data, request parameters
- `config(['key' => 'value'])` during request processing
- Config values varying per request

### Why Harmful
Config is meant for static, environment-specific configuration. Runtime state should not be conflated with configuration. It causes unpredictable behavior and coupling.

### Consequences
- Config mutation surprises
- Thread-safety issues in long-running processes
- Config caching conflicts
- Debugging confusion
- Unpredictable system behavior

### Alternative
Use request objects, DTOs, or session for runtime state. Keep config for static values only.

### Refactoring Strategy
1. Identify runtime state stored in config
2. Move to appropriate storage (DTO, request, session)
3. Restore config to static state only
4. Verify config caching compatibility

### Detection Checklist
- [ ] Scan for config mutation at runtime
- [ ] Review config values for request-specific data
- [ ] Check config caching behavior

### Related Rules/Skills/Trees
- Skills: Registry, Configuration Management

---

## 3. Storing Mutable Objects in Registry

### Category
Reliability

### Description
Storing mutable objects (models, collections, services with state) in the service container as singletons, causing unexpected side effects across requests.

### Why It Happens
Binding classes as singletons for performance without considering mutability.

### Warning Signs
- Mutable objects bound as singletons
- State leaking between requests in Octane
- Unexpected behavior across request boundaries
- Services with setter injection in registry

### Why Harmful
Singleton instances persist across requests in long-running processes. State from one request affects the next, causing data leaks and incorrect behavior.

### Consequences
- Cross-request state leakage
- Data corruption in long-running processes
- Hard-to-debug race conditions
- Production-only bugs

### Alternative
Bind mutable objects as non-singletons. Use factories for transient dependencies. For stateless services, singletons are safe.

### Refactoring Strategy
1. Identify singleton bindings of mutable objects
2. Change to transient (factory) binding
3. Refactor stateful objects to be stateless
4. Test cross-request isolation

### Detection Checklist
- [ ] Review singleton bindings for mutability
- [ ] Test cross-request state isolation
- [ ] Verify service container bindings

### Related Rules/Skills/Trees
- Skills: Registry, Service Container, Singleton vs Transient
- Decision Trees: Service Container Binding Strategy

---

## 4. Using Registry as Service Locator

### Category
Architecture

### Description
Every class resolves its own dependencies from the container (`app()->make()`), turning the registry into a service locator and hiding all dependency relationships.

### Why It Happens
Lack of DI understanding. Developers use the container as a global service locator because it's the path of least resistance.

### Warning Signs
- Every class calls `app()->make()` in constructor or methods
- No constructor dependency injection
- Tests require full container bootstrap
- Dependencies not visible in class signatures

### Why Harmful
Service locator is an anti-pattern because it hides dependencies, makes testing difficult, and creates implicit coupling to the container.

### Consequences
- Hidden dependencies
- Runtime errors from missing bindings
- Complex test setup
- Violates DI principles
- Container lock-in

### Alternative
Use proper dependency injection. Constructor injection for required dependencies. Setter injection for optional ones. Container resolves automatically.

### Refactoring Strategy
1. Audit classes using service locator pattern
2. Move to constructor injection
3. Remove all `app()->make()` from business logic
4. Add explicit type hints
5. Test without container

### Detection Checklist
- [ ] Identify service locator usage
- [ ] Verify constructor injection compliance
- [ ] Test dependency resolution

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Registry, Dependency Injection
- Decision Trees: DI vs Service Locator

---

## 5. Overriding Registered Services Without Understanding Lifecycle

### Category
Operations

### Description
Overriding service container bindings (e.g., in tests or service providers) without understanding when instances are resolved, leading to stale or incorrect instances.

### Why It Happens
Binding order and resolution timing are not well understood. Bindings replaced after resolution have no effect.

### Warning Signs
- Service providers registered in wrong order
- Extensions not applied to resolved instances
- Test overrides not taking effect
- Confusion about binding vs resolved instance

### Why Harmful
Services resolved before override use the old instance. Extensions are not retroactive. This causes testing inconsistencies and runtime surprises.

### Consequences
- Test flickering (sometimes works, sometimes doesn't)
- Production bugs from wrong service instances
- Hard-to-diagnose binding issues
- Wasted debugging time

### Alternative
Bind early (in service providers, before resolution). Use `extend()` for post-resolution modifications. In tests, bind before boot.

### Refactoring Strategy
1. Review service provider binding order
2. Move bindings earlier where needed
3. Use `extend()` instead of rebinding
4. Add tests for binding behavior
5. Document binding lifecycle expectations

### Detection Checklist
- [ ] Review binding registration order
- [ ] Verify binding vs resolution timing
- [ ] Test service resolution consistency

### Related Rules/Skills/Trees
- Skills: Registry, Service Container Lifecycle
- Decision Trees: Service Provider Organization
