# ECC Anti-Patterns — Constructor Injection (ku-02)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Constructor Injection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Over-Injection (7+ Parameters)
2. Constructor Service Locator
3. Side Effects in Constructors
4. Mixing injection with `new`
5. Not Type-Hinting Interfaces

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — constructors should not perform I/O
- Premature Caching — resolution caching belongs at container level, not constructor

---

## Anti-Pattern 1: Over-Injection (7+ Parameters)

### Category
Architecture

### Description
A class's constructor accepts 7 or more dependencies, violating the Single Responsibility Principle.

### Why It Happens
Classes accumulate dependencies over time without refactoring — each new feature adds another parameter.

### Warning Signs
- Constructor with 5+ parameters
- Class with multiple responsibilities (e.g., handles orders, inventory, notifications, billing)
- `__construct` method longer than 10 lines of parameter declarations

### Why It Is Harmful
Over-injection is a strong indicator the class does too much. Per ku-02, 3-4 parameters is the recommended maximum. Beyond that, the class violates SRP — it has too many responsibilities and is hard to test (combinatorial mock setup).

### Real-World Consequences
An `OrderController` has 10 constructor parameters — `OrderService`, `InventoryService`, `PaymentGateway`, `NotificationService`, `Logger`, `Mailer`, `EventDispatcher`, `Config`, `Cache`, `Analytics`. Writing a unit test requires setting up 10 mocks. Any parameters 6-10 trigger warnings that the controller handles unrelated concerns.

### Preferred Alternative
Split the class into smaller, focused classes. Use facades or action classes for cross-cutting concerns.

### Detection Checklist
- [ ] Constructor has 5+ parameters
- [ ] Class handles multiple unrelated responsibilities
- [ ] Tests require excessive mock setup

### Related Rules
ku-02 (05-rules.md): N/A

### Related Skills
ku-02 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Constructor Service Locator

### Category
Architecture

### Description
Accepting `Container $container` in the constructor and pulling dependencies in methods.

### Why It Happens
Developers think injecting the container qualifies as DI, not realizing it's the service locator pattern.

### Warning Signs
- Constructor accepts `Container` or `Application`
- `$this->container->make()` calls in methods
- No explicit dependency parameters

### Why It Is Harmful
Same harm as service locator: hidden dependencies, fragile tests requiring container mocking, and coupling to the container.

### Preferred Alternative
Inject each dependency explicitly as a typed constructor parameter.

### Detection Checklist
- [ ] `Container` type-hinted in constructor
- [ ] `->make()` called in methods

### Related Rules
ku-02 (05-rules.md): N/A

### Related Skills
ku-02 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Side Effects in Constructors

### Category
Reliability

### Description
Performing database queries, HTTP calls, or file operations inside a constructor.

### Why It Happens
Developers use the constructor for initialization tasks.

### Warning Signs
- `DB::query()` in constructor
- `Http::get()` in constructor
- `Log::info()` in constructor

### Why It Is Harmful
ku-02 states: "The constructor should only accept and assign dependencies. No I/O, no service resolution." Side effects in constructors cause unexpected behavior when the class is instantiated — especially in serialization (queue), testing, or deferred resolution.

### Preferred Alternative
Move I/O to a dedicated method or boot hook.

### Detection Checklist
- [ ] I/O operations in constructor
- [ ] Side effects on instantiation

### Related Rules
ku-02 (05-rules.md): N/A

### Related Skills
ku-02 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Mixing injection with `new`

### Category
Architecture

### Description
Some dependencies are injected via constructor, others are created with `new` inside methods.

### Why It Happens
Developers don't realize that `new SomeClass()` bypasses the container and its injected dependencies.

### Preferred Alternative
Let the container resolve all dependencies. Use `app(SomeClass::class)` only in the composition root.

### Detection Checklist
- [ ] `new SomeClass()` inside services
- [ ] Mixed injection patterns

### Related Rules
ku-02 (05-rules.md): N/A

### Related Skills
ku-02 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Not Type-Hinting Interfaces

### Category
Architecture

### Description
Type-hinting concrete classes in constructor parameters instead of interfaces.

### Why It Happens
Developers bind to concrete implementations directly.

### Preferred Alternative
Always type-hint interfaces in constructor parameters and bind them in service providers.

### Detection Checklist
- [ ] Constructor params typed as concrete classes
- [ ] Interface exists but not used in type-hints

### Related Rules
ku-02 (05-rules.md): N/A

### Related Skills
ku-02 (06-skills.md): N/A

### Related Decision Trees
N/A
