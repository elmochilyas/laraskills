# Action Classes

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-15-action-classes
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Action classes are invocable, single-method classes that encapsulate isolated business operations. They follow the Single Action Principle: one class, one public `__invoke()` method, one responsibility. Action classes fill the gap between inline controller logic and full Use Case classes — providing a lightweight alternative for operations that are simple enough that a full orchestration class with DTOs, repositories, and transaction management would be over-engineering.

---

## Core Concepts
- **Invocation Contract**: Action classes implement `__invoke()` as their single public method — enabling direct routing and callable usage anywhere in the application
- **Single Responsibility**: An Action does exactly one thing — if the class name uses "and" (`ValidateAndApplyCoupon`), it is two Actions in one
- **Statelessness**: Action classes have no mutable state — all dependencies injected via constructor, all operation-specific data via `__invoke()` parameters
- **Lightweight Dependencies**: Actions typically have 1-3 constructor dependencies — a repository, a service, or a gateway
- **Direct Route Binding**: Laravel's container can resolve Action classes directly from routes, eliminating controllers entirely for Action-backed endpoints

---

## Mental Models
1. **The "Do One Thing" Button**: Each Action class is a button that does exactly one thing — validate a coupon, generate a receipt PDF, calculate shipping cost. Press the button, get the result. No configuration, no orchestration, no multiple steps. If the button needs multiple presses or configuration to work, it should be a Use Case instead.
2. **Testable from End to End**: Because an Action has one public method and injectable dependencies, testing is trivial — create the Action with mocked dependencies, call `__invoke()`, assert on the return value. No HTTP bootstrap, no database setup, no configuration.

---

## Internal Mechanics
An Action class uses PHP 8 constructor promotion to declare dependencies. The class is declared `final readonly` to prevent extension and enforce immutability. The `__invoke()` method receives operation-specific parameters (primitives or a DTO), executes the operation, and returns a meaningful result (DTO, value, or boolean). Laravel's container resolves the Action from a route definition like `Route::post('/coupon/validate', ValidateCouponAction::class)` — the container instantiates the Action with injected dependencies and calls `__invoke()`.

---

## Patterns
### Direct Route Binding Pattern
- **Purpose**: Eliminate controllers for single-operation endpoints
- **Mechanism**: Route directly to the Action class: `Route::post('/coupon/validate', ValidateCouponAction::class)`
- **Benefits**: No controller boilerplate, explicit route-to-operation mapping, minimal indirection
- **Tradeoffs**: Not suitable for endpoints needing multiple related operations

### Action with DTO Pattern
- **Purpose**: Clean input contracts for Actions with more than 2-3 parameters
- **Mechanism**: Action receives a DTO in `__invoke()`, created by the caller or from a Form Request
- **Benefits**: Type-safe input, self-documenting, testable without HTTP
- **Tradeoffs**: Extra DTO class for the Action — justified when parameters exceed 2-3

---

## Architectural Decisions
- **Choose Actions when**: Single isolated operations with 1-3 dependencies that don't require multi-step orchestration
- **Choose Use Cases when**: Multi-step orchestration involving multiple domain objects, transaction management, and complex coordination
- **Choose inline controller when**: Simple one-liner operations where a class adds ceremony without value
- **Key decision**: Keep Actions small (< 30 lines, < 4 dependencies) — if an Action exceeds these limits, promote it to a Use Case

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Minimal architectural overhead per operation | One class per operation — more files than inline logic | Makes each operation independently testable |
| Direct route binding eliminates controllers | Not suitable for multi-operation endpoints | Use controller delegation for CRUD endpoints |
| Stateless, Octane-safe by design | No mutable state allowed — all state must be local | Predictable behavior in persistent runtimes |
| Easiest class to unit test in Laravel | Action without meaningful return prevents proper testing | Always return a result — DTO, value, or boolean |

---

## Performance Considerations
Action class dispatch via `__invoke()` is one PHP method call — negligible overhead. Stateless Actions can be registered as singletons in the container for reuse across requests. Octane workers safely share Action instances since Actions carry no mutable state. No performance penalty from Action encapsulation — the overhead is purely organizational. Direct route binding eliminates controller dispatch overhead entirely.

---

## Production Considerations
Authorization should be handled at the route level (middleware) or called within the Action. Actions should not handle authentication — they receive already-authenticated context. Input validation must be completed before the Action receives data (Form Request or DTO validation). Actions should not log sensitive input data. In Octane, Actions must not cache user-specific data in properties.

---

## Common Mistakes
1. **Too Many Dependencies**: An Action with 6+ constructor parameters — when an Action needs 4+ dependencies, promote it to a Use Case with proper DTOs and transaction management.
2. **Stateful Actions**: Assigning values to properties within `__invoke()` for later use — use local variables for all intermediate state.
3. **Actions Too Simple**: An Action that merely calls one method on one dependency — use an inline closure or direct delegation instead.
4. **Actions Too Complex**: An Action that accumulates helper methods and private logic — promote to a Use Case when it exceeds 30 lines or needs private helpers.
5. **Missing Return Value**: Actions that return void, hiding success or failure — always return a meaningful result (boolean at minimum, typed result DTO best).

---

## Failure Modes
- **God Action**: Action growing to handle multiple scenarios through conditional logic — split into multiple Actions or promote to Use Case
- **Action as Service**: Action accumulating multiple public methods over time — rename to Service or split into individual Actions
- **Action with Request Dependency**: Accepting `Illuminate\Http\Request` in `__invoke()` — couples to HTTP; inject a DTO instead
- **Action in Domain Layer**: Actions are application concerns, not domain — keep them in `app/Actions/`

---

## Ecosystem Usage
Laravel's invocable controller pattern (`__invoke()`) is first-class supported. The `lorisleiva/laravel-actions` package provides Action class scaffolding with batch/transaction/validation support. The `spatie/laravel-data` package pairs naturally with Actions for DTO-based input/output. Many Laravel projects adopt Actions as the primary controller-thinning mechanism before graduating to full Use Cases.

---

## Related Knowledge Units
### Prerequisites
- PHP `__invoke()` magic method
- Laravel Route-to-Class Binding
- Controller Thinning Principles (SLP-03)

### Related Topics
- Use Case Classes (LAP-11) — full orchestration pattern
- Service Classes (SLP-01) — multi-method operation grouping
- DTO Design (LAP-14) — input/output contracts for Actions

### Advanced Follow-up Topics
- Action Naming Conventions
- Action Testing Strategies
- Action vs Service vs Use Case Decision Framework

---

## Research Notes
Declare Actions as `final readonly`. Use `__invoke()` as the single public method. Keep Actions under 30 lines and under 4 constructor dependencies. Route directly when possible. Always return a meaningful result. Actions are inherently Octane-safe because they are stateless. The distinction between Actions and Use Cases is one of complexity — choose the right tool for the operation's orchestration needs.
