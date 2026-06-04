# Factory — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Factory pattern in PHP/Laravel context |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Factory That Just Calls new | Medium |
| 2 | Factory That Does Too Much | High |
| 3 | Factory Depending on Request State | High |
| 4 | Not Testing the Factory | High |

---

## 1. Factory That Just Calls new

### Category
Architecture

### Description
A factory method that simply returns `new SomeClass()` with no arguments, providing no abstraction value over direct instantiation.

### Why It Happens
Developers are taught "always use factories" without understanding when they add value.

### Warning Signs
- Factory method: `return new SomeClass();`
- No parameters, no logic, no configuration
- Factory could be replaced with `new SomeClass()` everywhere
- Factory adds no testability benefit

### Why Harmful
The factory adds code, indirection, and maintenance burden without providing abstraction, decoupling, or testability benefit.

### Consequences
- Unnecessary code
- Indirection without value
- Maintenance burden
- YAGNI violation

### Alternative
Use `new SomeClass()` directly, or let the service container auto-resolve. Only add a factory when construction requires runtime logic.

### Refactoring Strategy
1. Identify no-value factories
2. Replace with direct instantiation or container
3. Remove factory class
4. Update consumers

### Detection Checklist
- [ ] Evaluate factory value vs direct instantiation
- [ ] Check for factory logic beyond `new`
- [ ] Assess abstraction benefit

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: Factory, Service Container

---

## 2. Factory That Does Too Much

### Category
Architecture

### Description
A factory method that validates input, logs creation, sends notifications, and caches results — violating SRP.

### Why It Happens
Convenience: the factory is the creation point, so adding logic there seems natural.

### Warning Signs
- Factory methods over 20 lines
- Validation logic in factory
- Logging, caching, or notification in creation
- Factory imports from diverse namespaces

### Why Harmful
Factory SRP violation makes testing difficult, creates side effects during object creation, and couples creation to unrelated concerns.

### Consequences
- Side effects during creation
- Testing complexity
- SRP violation
- Hidden dependencies

### Alternative
Factory only constructs and configures the object. Validation before factory call, logging as decorator, caching as separate layer.

### Refactoring Strategy
1. Identify non-construction logic
2. Extract validation to caller or guard
3. Extract logging to decorator
4. Extract caching to separate layer
5. Factory keeps only construction logic

### Detection Checklist
- [ ] Review factory for SRP compliance
- [ ] Measure factory method length
- [ ] Identify side effects during creation

### Related Rules/Skills/Trees
- Skills: Factory, SRP, Decorator Pattern

---

## 3. Factory Depending on Request State

### Category
Architecture

### Description
Factory methods depend on HTTP request state (session, auth, request parameters) to make creation decisions, coupling the factory to the web context.

### Why It Happens
Object creation needs runtime context. Using request data is the path of least resistance.

### Warning Signs
- Factory importing `Request` or `Session`
- Factory calling `auth()`, `request()`, `session()` helpers
- Factory behavior differs by request context
- Factory not usable from CLI/queue

### Why Harmful
Factory cannot be used outside the web context. Tests require request simulation. The domain layer becomes HTTP-coupled.

### Consequences
- Coupling to HTTP
- Not reusable in CLI/queue
- Test complexity
- Hidden request dependency

### Alternative
Pass extracted data (configuration values, enums, identifiers) as factory method parameters. Keep factory context-agnostic.

### Refactoring Strategy
1. Identify request state dependencies
2. Extract data before factory call
3. Pass as parameters
4. Remove HTTP imports from factory
5. Test factory without HTTP context

### Detection Checklist
- [ ] Check factory for HTTP imports
- [ ] Verify CLI/queue compatibility
- [ ] Test without web context

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Factory, Dependency Inversion
- Decision Trees: Factory vs Container Resolution

---

## 4. Not Testing the Factory

### Category
Reliability

### Description
The factory has no tests, so changes to constructor signatures, dependencies, or creation logic go undetected until runtime.

### Why It Happens
Factory testing is overlooked. Tests focus on the objects themselves, not their creation.

### Warning Signs
- No factory test class
- Constructor parameter changes break factory silently
- Factory throws unexpected errors in production
- No coverage for factory methods

### Why Harmful
The factory is the single point of construction. If it breaks, no objects of that type can be created, causing system-wide failures.

### Consequences
- Runtime creation failures
- Undetected dependency changes
- Production incidents
- No safety net

### Alternative
Test factory methods by verifying correct object type, configuration, and dependency injection.

### Refactoring Strategy
1. Create factory test
2. Test each factory method
3. Verify correct return type
4. Test with mock dependencies
5. Add tests for edge cases

### Detection Checklist
- [ ] Check for factory test existence
- [ ] Verify test coverage
- [ ] Test construction edge cases

### Related Rules/Skills/Trees
- Skills: Factory, Unit Testing
