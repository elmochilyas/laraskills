# Use Case Classes

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-11-use-case-classes
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Use Case classes encapsulate each distinct application operation into a single-purpose class with exactly one public method. They sit between the presentation layer (controllers) and the domain layer, serving as the orchestration boundary for business operations. Use Cases enforce the separation between what the application does (orchestration) and how business rules are implemented — they receive input from adapters, coordinate domain objects, manage transaction boundaries, and return results without containing business logic themselves.

---

## Core Concepts
- **Single Public Method Contract**: Every Use Case exposes exactly one public method — `__invoke()`, `handle()`, or `execute()` — creating a predictable interface regardless of complexity
- **Orchestration vs Implementation**: Use Cases orchestrate — they create domain objects, call their methods, and use port interfaces for persistence; business rules stay inside domain objects
- **Port Dependency Injection**: Use Cases depend on abstractions (interfaces/ports) injected through the constructor, making every dependency explicit and testable without infrastructure
- **Transaction Boundaries**: The Use Case controls the transaction scope — opens a transaction, performs orchestration steps, and commits or rolls back
- **DTO Input/Output**: Use Cases accept DTOs or primitives as input and return DTOs or void — HTTP Request objects are never passed, Domain objects are never returned
- **Framework Independence**: A properly designed Use Case contains zero Laravel-specific imports — no `Request`, `Response`, `Facade` imports

---

## Mental Models
1. **Application as a Collection of Use Cases**: The application layer is not a group of services — it is a collection of use cases. Each use case is a complete business operation that a user or external actor can perform. Reading the `app/UseCases/` directory reveals every capability of the application.
2. **Orchestra Conductor, Not Musician**: A Use Case conducts the orchestra (coordinates domain objects, repositories, and services) but does not play any instrument (does not contain business logic). The conductor ensures the right musicians play at the right time in the right order.

---

## Internal Mechanics
A controller extracts HTTP input, validates via Form Request, creates an input DTO, and calls the Use Case. The Use Case receives the DTO, injects dependencies through its constructor, executes the orchestration steps (create domain objects, call their methods, persist via repositories, manage transactions), and returns a result DTO. The controller then formats the result as an HTTP response. Dependency injection — constructor injection for repositories, services, and gateways — makes every external interaction explicit and testable. Transaction management is contained within the Use Case method using `DB::transaction()` or manual begin/commit/rollback.

---

## Patterns
### Use Case with DTO Pattern
- **Purpose**: Clean input/output contracts at the application boundary
- **Mechanism**: Input DTO from controller, output DTO returned to controller
- **Benefits**: Type-safe input/output, testable without HTTP, self-documenting contracts
- **Tradeoffs**: Extra DTO classes per Use Case; overkill for trivial operations

### Use Case as Invocable Controller Pattern
- **Purpose**: Eliminate controllers entirely for single-operation endpoints
- **Mechanism**: Use Case implements `__invoke()` directly routable via `Route::post('/invoices', CreateInvoice::class)`
- **Benefits**: Direct route-to-class binding, no controller boilerplate, explicit operation-per-endpoint mapping
- **Tradeoffs**: Not suitable for endpoints needing multiple related operations (use controller delegation instead)

---

## Architectural Decisions
- **Choose Use Cases when**: Multi-step orchestration with multiple dependencies, business rules from different domain objects must be coordinated, or transaction boundaries must be explicit
- **Choose Actions when**: Single isolated operations with 1-3 dependencies; Use Cases are full orchestration; Actions are lightweight
- **Choose Services when**: Multiple related operations share state or configuration (e.g., report generation with multiple methods)
- **Key decision**: Use Cases orchestrate; they do not implement business logic — every conditional about business rules should be in domain objects

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Explicit application capabilities per class | More classes than controller-inline logic | One Use Case per business operation — makes capabilities discoverable |
| Testable without HTTP kernel | Requires DTOs for input/output | DTO overhead is justified for testability and layer isolation |
| Transaction boundaries are explicit | Must manage transactions in every Use Case | Essential for correctness in multi-step operations |
| Framework independent | Cannot use Laravel helpers, facades, or magic | Pure PHP that works in any execution context |

---

## Performance Considerations
Use Case class instantiation and method dispatch add negligible overhead — approximately 0.01ms per call. Transaction scope within Use Cases directly impacts database lock contention — keep transactions short. DTO construction and copying has negligible cost compared to database or API operations. No performance penalty from Use Case encapsulation. In Octane, Use Cases must remain stateless (no mutable properties) to prevent memory leaks across requests. For high-throughput endpoints, consider caching Use Case instances as singletons since they are stateless by design.

---

## Production Considerations
Authorization must occur before the Use Case runs — typically in the Form Request's `authorize()` method or controller middleware. Input validation must complete before the Use Case receives data. Use Cases should not re-authorize or validate input. Failed Use Cases should throw domain-specific exceptions, not HTTP exceptions, to keep the layer pure. Use Cases naturally become the unit of deployment monitoring — each Use Case can be tracked for success/failure rates.

---

## Common Mistakes
1. **Fat Use Cases**: Use Cases containing business logic alongside orchestration — if there are `if` statements about business rules, those belong in domain objects. Extract business logic into domain objects or domain services.
2. **Request Object in Signature**: Accepting `Illuminate\Http\Request` as a Use Case parameter — couples the Use Case to HTTP, making it unusable from CLI commands or queue jobs. Always create an input DTO.
3. **Returning Domain Objects**: Returning Eloquent models, entities, or aggregates from Use Case methods — return a result DTO with only the data the caller needs.
4. **Use Case as CRUD Wrapper**: Creating a Use Case that simply calls `User::create($data)` — reserve Use Cases for operations with orchestration or business rules.
5. **Stateful Use Cases**: Use Cases with mutable properties that accumulate state across method calls — breaks in Octane where the same instance handles multiple requests.

---

## Failure Modes
- **Fat Use Case**: Use Case accumulating orchestration logic, business rules, and validation — symptoms include exceeding 100 lines, multiple private helpers, mixing repository calls with business calculations
- **Anemic Use Case**: Use Case that does nothing except call a single repository method — ceremony without benefit
- **HTTP-Coupled Use Case**: Importing `Illuminate\Http\Request` prevents CLI/queue/test usage
- **Transaction leak**: Transaction not rolled back on exception — always use try/finally or `DB::transaction()` with callback

---

## Ecosystem Usage
Laravel itself does not prescribe Use Case classes but the invocable controller pattern (`Route::post('/path', MyAction::class)`) is first-class supported through the container. Packages like `spatie/laravel-data` provide DTO classes that pair naturally with Use Cases. The `lorisleiva/laravel-actions` package provides Action class support. Enterprise Laravel projects commonly adopt Use Cases as the primary application layer pattern in Clean/Hexagonal Architecture.

---

## Related Knowledge Units
### Prerequisites
- Three-Layer Architecture (LAP-01)
- Dependency Rule (LAP-04)
- Domain Layer Design (LAP-05)

### Related Topics
- Action Classes (LAP-15) — lighter alternative for single operations
- Service Classes (SLP-01) — alternative orchestration pattern
- DTO Design (LAP-14) — input/output contracts for Use Cases
- Form Request Validation (LAP-12) — validation boundary before Use Cases

### Advanced Follow-up Topics
- Hexagonal Architecture Ports & Adapters (LAP-03)
- CQRS Pattern (CPC-08)
- Event Sourcing (CPC-09)
- Transaction Boundaries (LAP-11)

---

## Research Notes
When asked about controller thinning, recommend Use Case classes as the primary pattern for business operation encapsulation. Use Cases are the application layer in Clean Architecture — they orchestrate, not implement. Key decision point: Use Case vs Action class — Use Cases for multi-step orchestration with multiple dependencies; Actions for single isolated operations with few dependencies. Always suggest creating input/output DTOs before implementing a Use Case.
