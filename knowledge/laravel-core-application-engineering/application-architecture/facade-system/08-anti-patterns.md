# ECC Anti-Patterns — Facade System

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Facade System |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Hidden Dependencies via Facades in Business Logic Classes
2. Facade Calls in Constructors (Tight Coupling at Instantiation)
3. Facades in Service Provider `register()` Methods
4. Real-Time Facade Overuse (Every Service as a Facade)

---

## Repository-Wide Anti-Patterns

- Facade Chains (multiple facades in a single expression)
- Inconsistent Access Patterns (mixing facades and injection without rationale)
- Mock Pollution Between Tests (facade state leaks across tests)

---

## Anti-Pattern 1: Hidden Dependencies via Facades in Business Logic Classes

### Category
Design | Testing

### Description
Using `Cache::get()`, `Log::info()`, or `Config::get()` directly inside service, action, or domain classes instead of injecting the dependencies.

### Why It Happens
Facades are globally available and convenient. The developer uses them in every class without considering testability.

### Warning Signs
- Service classes contain `Cache::`, `Log::`, `Config::`, `DB::` calls in method bodies
- Class constructor signature reveals only some dependencies; the rest are hidden in method bodies
- Unit tests must use `Cache::shouldReceive()` or `Bus::fake()` for every test
- Class cannot be instantiated with `new` in a pure unit test

### Preferred Alternative
Use constructor injection for all dependencies in business logic classes. Reserve facades for controllers and views.

### Related Rules
- Rule: Use Facades for Framework Services, Injection for Application Services

---

## Anti-Pattern 2: Facade Calls in Constructors

### Category
Design | Testing

### Description
`Config::get('report.prefix')` or `Cache::get('key')` inside a class constructor, coupling the class to the facade at instantiation time.

### Why It Happens
Developers want to "resolve early" and store the value as a property.

### Warning Signs
- Constructor body contains facade calls
- Class cannot be constructed without the container being bootstrapped
- Value is frozen at construction and cannot be changed

### Preferred Alternative
Use constructor injection for construction-time dependencies: `__construct(private string $prefix) {}`.

### Related Rules
- Rule: Avoid Facade Calls in Class Constructors

---

## Anti-Pattern 3: Facades in Service Provider `register()` Methods

### Category
Architecture

### Description
Calling `Log::info()`, `Cache::get()`, or any facade inside a service provider's `register()` method.

### Why It Happens
The developer treats `register()` like any other method, not understanding the two-phase bootstrap contract.

### Warning Signs
- `Log::info()`, `Cache::get()`, `Config::get()` in `register()` method
- "Facade does not implement getFacadeRoot" or "Facade application not set" errors during bootstrap
- Service resolution in `register()` combined with facade calls

### Preferred Alternative
Move all facade calls to `boot()`. Restrict `register()` to container bindings.

### Related Rules
- Rule: Never Use Facades in Service Provider register() Methods

---

## Anti-Pattern 4: Real-Time Facade Overuse

### Category
Maintainability

### Description
Using `Facades\App\Services\PaymentService::process()` for every service call instead of injecting the dependency.

### Why It Happens
Real-time facades are convenient — they provide static syntax without the setup cost of injection.

### Warning Signs
- Widespread use of `Facades\` prefix in business logic classes
- Method signatures show no dependencies despite using multiple services
- Refactoring a service requires searching all `Facades\` usages in function bodies
- No constructor injection exists in the codebase — everything is a real-time facade

### Preferred Alternative
Use real-time facades only for prototyping or leaf operations. Use constructor injection for all production business logic.

### Related Rules
- Rule: Use Facades for Framework Services, Injection for Application Services
