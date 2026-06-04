# ECC Anti-Patterns — DTO Construction Patterns

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | DTO Construction Patterns |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Kitchen Sink Factory (Single `from()` Method for All Sources)
2. The Magic Spread (Using `...$data` Without Explicit Mapping)
3. Constructing From Unvalidated Request Data
4. Lazy Loading in fromModel Factories
5. Factory in the Service (Service Constructs Its Own DTO)

---

## Repository-Wide Anti-Patterns

- Mixed Sources in One Factory (Checking Parameter Types)
- No Collection Factory (Manual Array Mapping in Callers)
- Factory Methods With Side Effects (Database Calls During Construction)
- Builder Pattern for Fewer Than 5 Properties (Ceremony Over Benefit)
- Missing Type Hints on Factory Parameters

---

## Anti-Pattern 1: The Kitchen Sink Factory

### Category
Maintainability | Design

### Description
A single `from()` method that accepts multiple source types, dispatching internally based on parameter inspection — `from($source)` where `$source` could be a Request, Model, or raw array.

### Why It Happens
Developers want one construction API for all sources. The single method checks `instanceof` or similar dispatch internally.

### Warning Signs
- Single `from()` method with `if ($source instanceof Request)` branching
- Adding a new source type requires modifying the existing factory method
- Callers cannot tell from the method signature which sources are supported
- Type errors at runtime when an unsupported source type is passed

### Preferred Alternative
Provide dedicated named factory methods per source type: `fromRequest()`, `fromModel()`, `fromArray()`. Each method has a clear signature and implementation.

### Related Rules
- Rule: Use Per-Source Named Factory Methods

---

## Anti-Pattern 2: The Magic Spread

### Category
Reliability | Security

### Description
Using `new self(...$data)` everywhere with no explicit key mapping, spreading unknown array keys into the DTO constructor.

### Why It Happens
The spread operator is concise and seems like "less code." Developers assume array keys will always match parameter names.

### Warning Signs
- `new Dto(...$data)` or `new self(...$data)` in factory methods
- Renaming a DTO property breaks factory methods silently (extra key causes error, missing key causes uninitialized property)
- Extra keys in `$data` cause runtime `\Error` (unknown named parameter)
- No explicit mapping between source keys and DTO parameters

### Preferred Alternative
Use explicit manual mapping in factory methods. The safety is worth the verbosity for production code. Reserve spread for internal-only or test contexts.

### Related Rules
- Rule: Use Explicit Key Mapping Over Spread in Factories

---

## Anti-Pattern 3: Constructing From Unvalidated Request Data

### Category
Security | Architecture

### Description
Calling `new Dto(...$request->all())` or `Dto::from($request->all())` without first routing through FormRequest's `validated()`.

### Why It Happens
Developers skip FormRequest creation and pass raw request data directly to the DTO, thinking the DTO's own validation will catch bad data.

### Warning Signs
- `$request->all()` or `$request->input()` passed directly to DTO factory
- DTO receives fields the user should not control (is_admin, role_id)
- No FormRequest exists for the endpoint — validation happens in the DTO or not at all
- Mass-assignment vulnerabilities reach the service layer because unvalidated data was in the DTO

### Preferred Alternative
Always construct DTOs from FormRequest's `validated()` data. Use `$request->validated()` as the source, which strips unvalidated fields.

### Related Rules
- Rule: Always Construct DTOs From Validated Data

---

## Anti-Pattern 4: Lazy Loading in fromModel Factories

### Category
Performance | Reliability

### Description
A `fromModel(User $user)` factory that accesses Eloquent relations that have not been eager-loaded, triggering N+1 queries.

### Why It Happens
Factory methods access relations as needed (`$user->profile->bio`), assuming the caller has already loaded them. When the caller forgets, the factory triggers a query.

### Warning Signs
- `fromModel()` accesses `$model->relation` without `$model->relation()->get()`
- Profiling shows duplicate queries originating from the DTO factory
- N+1 problems appear when DTOs are constructed in loops
- A warning or comment says "make sure to eager-load before calling this"

### Preferred Alternative
Eager-load all required relations before passing the model to `fromModel()`. Document required relations in docblock `@param`. Alternatively, accept an array of pre-loaded data instead of a model.

### Related Rules
- Rule: Eager-Load Relations Before Passing to fromModel

---

## Anti-Pattern 5: Factory in the Service

### Category
Architecture | Maintainability

### Description
A service method that constructs its own DTO from raw input (array, request, or CLI arguments) instead of receiving a pre-constructed DTO.

### Why It Happens
Developers treat the service as an "all-in-one" class that validates, constructs, and processes data. They do not separate DTO creation from DTO consumption.

### Warning Signs
- Service method accepts `array $input` and calls `new Dto(...$input)` internally
- Service depends on HTTP or CLI infrastructure to construct its input
- Testing the service requires assembling the correct input array and understanding internal DTO construction
- The DTO construction logic is duplicated across multiple service methods

### Preferred Alternative
Services receive a ready-made DTO as a parameter. The controller or entry point constructs the DTO and passes it to the service.

### Related Rules
- Rule: Services Receive Ready-Made DTOs, Not Raw Input
