# ECC Anti-Patterns — Facade Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Facade Architecture |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Facades in Business Logic
2. Not Clearing Facade State Between Tests
3. Facade Overuse in a Single Class
4. Real-Time Facades for Production Code
5. Mocking Over swap/instance

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — facades are a static proxy pattern, not a query concern
- Premature Caching — facade root caching via static properties can leak across tests

---

## Anti-Pattern 1: Facades in Business Logic

### Category
Architecture

### Description
Using facades (`Cache::get()`, `Log::info()`) inside domain services, repositories, or action classes.

### Why It Happens
Facades are convenient and available globally without constructor wiring.

### Warning Signs
- `Cache::`, `Log::`, `DB::`, `Event::` etc. in services and repositories
- Classes with no constructor injection despite multiple facade calls
- Tests require `Facade::fake()` for every test case

### Why It Is Harmful
ku-04 Standardized Knowledge states facades are "acceptable" in controllers but should not appear in business logic. Facades hide dependencies, making them invisible in the class signature. The class becomes coupled to the facade system — it cannot function outside a Laravel context.

### Preferred Alternative
Inject services via constructor in business logic. Use facades only in controllers, views, and route files.

### Detection Checklist
- [ ] Facade calls in services/repositories
- [ ] Hidden dependencies not visible in constructor
- [ ] Tests require extensive facade faking

### Related Rules
Facade Architecture (05-rules.md): N/A

### Related Skills
Facade Architecture (06-skills.md): N/A

### Related Decision Trees
Facade Architecture (07-decision-trees.md): D01 — Facade vs Constructor Injection.

---

## Anti-Pattern 2: Not Clearing Facade State Between Tests

### Category
Reliability

### Description
Not calling `Facade::clearResolvedInstance()` in test `setUp()` — state leaks between tests.

### Warning Signs
- Tests pass in isolation but fail in suite
- Facade state from a previous test affects current test
- Mock expectations from one test interfere with another

### Why It Is Harmful
Facade caches resolved instances in static `$resolvedInstance` array. Without clearing between tests, a mock from test A persists into test B, causing false assertions or failures.

### Preferred Alternative
Call `Facade::clearResolvedInstance()` or use `$this->refreshApplication()` in test setUp.

### Detection Checklist
- [ ] Tests order-dependent
- [ ] No facade instance clearing in setUp
- [ ] Static state leaking between tests

### Related Rules
Facade Architecture (05-rules.md): N/A

### Related Skills
Facade Architecture (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Facade Overuse in a Single Class

### Category
Architecture

### Description
Using 5+ different facades in a single class — indicates the class does too much.

### Preferred Alternative
Inject the specific services needed via constructor.

### Detection Checklist
- [ ] Multiple facade types in one class
- [ ] Class handles many unrelated concerns

### Related Rules
Facade Architecture (05-rules.md): N/A

### Related Skills
Facade Architecture (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Real-Time Facades for Production Code

### Category
Architecture

### Description
Using `Facades\App\Services\PaymentService::charge()` real-time facades in production business logic.

### Preferred Alternative
Use constructor injection for production domain code.

### Detection Checklist
- [ ] Real-time facades in production business logic
- [ ] Hidden dependencies via facades namespace

### Related Rules
Facade Architecture (05-rules.md): N/A

### Related Skills
Facade Architecture (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Mocking Over swap/instance

### Category
Testing

### Description
Using manual Mockery mocking instead of `Facade::shouldReceive()` for facade testing.

### Preferred Alternative
Use `shouldReceive()` for facades — it provides better assertions and cleaner setup.

### Detection Checklist
- [ ] Manual mock creation for facade tests
- [ ] `swap()` used without `shouldReceive()`

### Related Rules
Facade Architecture (05-rules.md): N/A

### Related Skills
Facade Architecture (06-skills.md): N/A

### Related Decision Trees
N/A
