# Anti-Patterns: Use Case Classes

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | 02-layered-architecture-patterns |
| **Knowledge Unit** | LAP-11-use-case-classes |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. Fat Use Case — Business Logic in Orchestration Layer
2. Request Object in Use Case Signature
3. Returning Domain Objects from Use Case
4. Use Case as CRUD Wrapper
5. Stateful Use Case
6. God Use Case — Multiple Business Operations in One Class
7. Transaction Scope Leakage
8. Silent Failure in Use Case

---

## Repository-Wide Anti-Patterns

- Using Facades inside Use Cases (couples to Laravel)
- No Tests for Use Cases (testing only through HTTP)
- Use Cases with Optional Dependencies

---

## Anti-Pattern 1: Fat Use Case — Business Logic in Orchestration Layer

### Category
Architecture | Maintainability

### Description
Use Case containing business rules, calculations, and conditional logic alongside orchestration code. The Use Case becomes the default location for all logic.

### Why It Happens
Developers default to putting logic in the most convenient class. Without strong domain modeling discipline, business rules accumulate in the Use Case.

### Warning Signs
- Use Case exceeds 100 lines
- Use Case has multiple private helper methods containing business logic
- Conditional statements about domain concepts (pricing tiers, status transitions)
- Business rule changes require modifying the Use Case
- Duplicated business logic across multiple Use Cases

### Why It Is Harmful
Business rules are trapped in the orchestration layer and cannot be reused across operations. Domain objects become anemic data bags. Testing business rules requires mocking Use Case dependencies.

### Real-World Consequences
A `CancelSubscription` Use Case contains refund calculation logic. When `ProcessRefund` needs the same logic, the developer copies it. Now there are two implementations of the same business rule. A tax regulation change requires updating both — one is missed, causing incorrect refunds for 3 months.

### Preferred Alternative
Extract business rules to domain objects and value objects. Use Cases orchestrate; domain objects implement.

### Refactoring Strategy
1. Identify business logic patterns in Use Cases
2. Extract calculations to Value Objects
3. Extract state-changing logic to Domain methods
4. Extract multi-domain coordination to Domain Services
5. Verify Use Case contains only orchestration and flow control
6. Write domain tests for extracted logic

### Detection Checklist
- [ ] Use Case has private helper methods
- [ ] Use Case contains mathematical calculations
- [ ] Business rule changes affect Use Case tests
- [ ] Same logic appears in multiple Use Cases

### Related Rules
Use Case Orchestrates, Domain Implements (05-rules.md)

---

## Anti-Pattern 2: Request Object in Use Case Signature

### Category
Architecture | Coupling

### Description
Use Case method accepts `Illuminate\Http\Request` or other HTTP-specific objects as parameters.

### Why It Happens
Developers take the path of least resistance — the Request object is already available in the controller.

### Warning Signs
- `use Illuminate\Http\Request;` in Use Case file
- Use Case calls `$request->input()`, `$request->user()`, or `$request->validate()`
- Use Case accesses session, cookies, or files from Request
- Use Case cannot be called from CLI without faking HTTP context

### Why It Is Harmful
The Use Case is permanently coupled to HTTP. It cannot be used from CLI commands, queue jobs, or tests without HTTP bootstrapping.

### Real-World Consequences
A `GenerateReport` Use Case accepts `Request` for convenience. Six months later, the team needs to generate the same report via a scheduled CLI command. The Use Case cannot be called without building a fake Request object — the developer creates a workaround that's brittle and untested.

### Preferred Alternative
Create an input DTO specific to the Use Case. The controller extracts data from the Request and passes it to the Use Case via the DTO.

### Refactoring Strategy
1. Create an input DTO with typed properties
2. Move Request data extraction to the controller
3. Change the Use Case method signature to accept the DTO
4. Remove HTTP imports from the Use Case
5. Update tests to pass DTOs directly

### Detection Checklist
- [ ] Use Case imports `Illuminate\Http\Request`
- [ ] Use Case has HTTP-specific type hints
- [ ] Use Case tests require HTTP kernel bootstrap

### Related Rules
No HTTP Imports in Use Case (05-rules.md)

---

## Anti-Pattern 3: Returning Domain Objects from Use Case

### Category
Architecture | Encapsulation

### Description
Use Case returns Eloquent models, entities, or aggregate roots directly to the caller.

### Why It Happens
It seems natural to return the object that was created or modified.

### Warning Signs
- Use Case return type is an Eloquent model or Entity class
- Caller accesses properties directly on the returned object
- Changes to the Domain object's structure affect multiple callers
- Caller receives more data than needed

### Why It Is Harmful
Domain objects expose internal structure. Serialization logic leaks to the presentation layer. Changes to domain objects cascade to controllers, views, and API responses.

### Real-World Consequences
A `CreateInvoice` Use Case returns the Invoice entity. The controller serializes it to JSON. When a domain change adds an internal `paymentProviderToken` property, the token is accidentally exposed in the API response.

### Preferred Alternative
Return a result DTO with only the data the caller needs.

### Refactoring Strategy
1. Create a result DTO with the required fields
2. Extract data from the Domain object in the Use Case
3. Change return type to the result DTO
4. Update tests to assert on DTO properties
5. Add a Transformer if the caller needs a different representation

### Detection Checklist
- [ ] Use Case returns Eloquent model or Entity
- [ ] Use Case return type is a Domain class
- [ ] Controller accesses properties directly on the return value

### Related Rules
Return DTO or Void (05-rules.md)

---

## Anti-Pattern 4: Use Case as CRUD Wrapper

### Category
Architecture | Over-engineering

### Description
Use Case that does nothing except call a single repository method or Eloquent operation with no orchestration.

### Why It Happens
Strict adherence to pattern without evaluating whether the operation warrants it.

### Warning Signs
- Use Case body is a single method call
- Use Case has zero or one dependency
- Use Case adds no business value beyond the database operation
- Removing the Use Case and calling the repository directly produces identical behavior

### Why It Is Harmful
Architectural ceremony without benefit. Increases maintenance surface area. Dilutes attention from Use Cases that provide real value.

### Real-World Consequences
A team creates Use Cases for every CRUD operation — `CreateUser`, `ReadUser`, `UpdateUser`, `DeleteUser`. These 4 files contain nothing but delegation. When a real business operation like `ProcessRefund` is needed, the team resists because "Use Cases are too much overhead."

### Preferred Alternative
Reserve Use Cases for operations that involve orchestration, business rules, or multiple domain objects. Simple CRUD belongs in controllers or repositories.

### Refactoring Strategy
1. Identify CRUD-only Use Cases
2. Move the operation to the controller or repository
3. Delete the Use Case class and DTOs
4. Update routes to point directly to controller methods

### Detection Checklist
- [ ] Use Case method is a single line delegating to a repository
- [ ] Use Case has no conditional logic or orchestration
- [ ] Use Case tests simply verify delegation

### Related Rules
Use Case Orchestrates, Domain Implements (05-rules.md)

---

## Anti-Pattern 5: Stateful Use Case

### Category
Reliability | Octane Compatibility

### Description
Use Case with mutable properties that accumulate state between method calls.

### Why It Happens
Developers treat Use Cases like services, storing intermediate results in properties.

### Warning Signs
- Use Case has non-constructor properties
- Properties are set in the public method and used later
- The same Use Case instance produces different results on repeated calls
- Octane workers show memory growth after processing requests through this Use Case

### Why It Is Harmful
In long-running processes (Octane, Swoole), the same Use Case instance handles multiple requests. Mutable state from one request leaks to the next, causing data corruption.

### Real-World Consequences
An Octane worker processes a `CreateInvoice` request, then a `CancelSubscription` request. The `CreateInvoice` Use Case stored `$this->total` during the first request. The second request reads the stale `$this->total` value and uses it in calculations.

### Preferred Alternative
All state must be local to the public method. Use local variables, not properties.

### Refactoring Strategy
1. Identify mutable properties in Use Case classes
2. Convert to local variables inside the public method
3. Pass data between steps via local variables or DTOs
4. Make the class `readonly` to enforce immutability at compile time
5. Test with repeated calls on the same instance

### Detection Checklist
- [ ] Use Case has non-constructor properties
- [ ] Properties are assigned in the public method
- [ ] Use Case is not declared `readonly`
- [ ] Octane memory growth observed

### Related Rules
Inject Ports via Constructor (05-rules.md)

---

## Anti-Pattern 6: God Use Case — Multiple Business Operations in One Class

### Category
Architecture | Maintainability

### Description
A single Use Case class that handles multiple related business operations (Create, Cancel, Refund all in one class).

### Why It Happens
Developer groups related operations to reduce file count.

### Warning Signs
- Use Case has multiple public methods
- Class name is generic like `OrderOperations` or `InvoiceActions`
- Private methods are shared across multiple public methods
- Changes to one operation risk breaking another

### Why It Is Harmful
Violates single responsibility. Shared private methods create hidden coupling between operations. Testing one operation requires understanding all operations.

### Real-World Consequences
`OrderProcessing` Use Case has `create()`, `cancel()`, and `refund()` methods. A change to the shared `validateStock()` private method for `create()` inadvertently changes behavior for `cancel()`. Orders are cancelled when stock validation fails — a subtle bug that takes weeks to find.

### Preferred Alternative
One class per business operation. Extract shared logic to dedicated services or domain objects.

### Refactoring Strategy
1. List all public methods in the God class
2. Create separate Use Case classes for each method
3. Extract shared private methods to domain objects or services
4. Copy shared logic to each Use Case or inject as a dependency
5. Delete the original God class
6. Update routing to reference individual classes

### Detection Checklist
- [ ] Use Case class has multiple public methods
- [ ] Class name describes a domain area, not a specific operation
- [ ] Private methods are shared across operations

### Related Rules
Use Case Has Single Public Method (05-rules.md)
