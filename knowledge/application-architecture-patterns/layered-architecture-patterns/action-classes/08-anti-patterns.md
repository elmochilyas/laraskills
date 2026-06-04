# Anti-Patterns: Action Classes

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | 02-layered-architecture-patterns |
| **Knowledge Unit** | LAP-15-action-classes |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. God Action — Single Action Accumulating Multiple Responsibilities
2. Stateful Action — Mutable Properties in Action Classes
3. Action with HTTP Dependency — Request Object in __invoke()
4. Trivial Action — Ceremony Without Business Value
5. Oversized Action — Exceeded Action Boundaries
6. Void Action — No Return Value Hiding Failure
7. Action as Service — Multiple Public Methods Accumulated
8. Domain Action — Placing Actions in the Domain Layer

---

## Repository-Wide Anti-Patterns

- Mixing Action naming conventions (some `*Action`, some `*Handler`, some `*Command`)
- Actions without tests (only covered by HTTP integration tests)
- Actions with side effects that are not documented

---

## Anti-Pattern 1: God Action — Single Action Accumulating Multiple Responsibilities

### Category
Architecture | Maintainability

### Description
An Action class that handles multiple related but distinct operations through conditional logic.

### Why It Happens
As requirements grow, developers add more responsibility to the existing Action rather than creating new ones.

### Warning Signs
- Action name contains "and" (`ValidateAndApplyCoupon`)
- `__invoke()` has `if/else` chains based on input type
- Action has multiple private helper methods
- Action exceeds 50 lines
- Changes to one scenario break another

### Why It Is Harmful
The Action is no longer single-purpose. Testing requires covering every conditional branch. Changes have cascading risk.

### Preferred Alternative
One Action per distinct operation. Split by business operation, not by convenience.

### Refactoring Strategy
1. List every distinct operation the Action performs
2. Create separate Action classes for each
3. Extract shared logic to injected services
4. Update routes to point to new Actions
5. Delete the God Action

### Detection Checklist
- [ ] Action name uses "and" or implies multiple operations
- [ ] `__invoke()` has branching on operation type
- [ ] Action has many private methods
- [ ] Action exceeds 50 lines

---

## Anti-Pattern 2: Stateful Action — Mutable Properties in Action Classes

### Category
Reliability | Octane Compatibility

### Description
Action class with mutable properties that accumulate state between invocations.

### Why It Happens
Developers use properties for intermediate results because it seems convenient.

### Warning Signs
- Action has non-constructor properties
- Properties are assigned inside `__invoke()`
- Same Action instance produces different results on repeated calls
- Octane workers show memory growth or data corruption

### Why It Is Harmful
In long-running processes (Octane, Swoole), the same Action instance handles multiple requests. Mutable state from one request leaks to the next.

### Preferred Alternative
All state must be local to `__invoke()`. Use local variables, not properties.

### Refactoring Strategy
1. Identify mutable properties
2. Convert to local variables
3. If state must persist across calls, extract to a dedicated service class
4. Make Action `readonly` to enforce at compile time
5. Test by calling `__invoke()` multiple times on the same instance

### Detection Checklist
- [ ] Action has non-constructor properties
- [ ] Properties assigned inside `__invoke()`
- [ ] Action not declared `readonly`

---

## Anti-Pattern 3: Action with HTTP Dependency — Request Object in __invoke()

### Category
Architecture | Coupling

### Description
Action `__invoke()` accepting `Illuminate\Http\Request` as a parameter.

### Why It Happens
Direct route binding passes the Request automatically. Developers use it for convenience.

### Warning Signs
- `__invoke(Request $request)` signature
- Action calls `$request->input()`, `$request->user()`, or `$request->validate()`
- Action cannot be called from CLI or queue without faking HTTP

### Why It Is Harmful
The Action is permanently coupled to HTTP. It cannot be reused in CLI commands, queue jobs, or tests.

### Preferred Alternative
Accept primitives or a DTO. Extract Request data in the route closure or controller.

### Refactoring Strategy
1. Create a DTO or use primitive parameters
2. Move Request data extraction to the route or caller
3. Change `__invoke()` signature
4. Remove HTTP imports
5. Update tests to pass data directly

### Detection Checklist
- [ ] `Illuminate\Http\Request` imported in Action file
- [ ] Action calls methods on Request object
- [ ] Action tests require HTTP kernel

---

## Anti-Pattern 4: Trivial Action — Ceremony Without Business Value

### Category
Architecture | Over-engineering

### Description
An Action class that merely wraps a single method call with no additional logic.

### Why It Happens
Developers apply the Action pattern too aggressively, creating classes for trivial operations.

### Warning Signs
- Action body is a single delegation line
- Action has zero or one dependency
- Action adds no business value beyond the delegated method
- Removing the Action produces identical behavior

### Why It Is Harmful
Architectural ceremony without benefit. Increases file count and cognitive load without providing value.

### Preferred Alternative
Use inline closures or direct method calls for trivial operations.

### Refactoring Strategy
1. Identify trivial Actions
2. Replace with inline closure or direct delegation
3. Delete the Action class
4. Update routes if Action was route-bound

### Detection Checklist
- [ ] Action body is single delegation
- [ ] Action has 0-1 dependencies
- [ ] Tests simply verify delegation occurred

---

## Anti-Pattern 5: Oversized Action — Exceeded Action Boundaries

### Category
Architecture | Complexity

### Description
An Action that has grown beyond the Action pattern's intended scope but hasn't been promoted to Use Case.

### Why It Happens
Teams start with Actions by convention but don't recognize when an operation has outgrown the pattern.

### Warning Signs
- Action has 4+ constructor dependencies
- Action has multiple private helper methods
- Action manages transaction boundaries
- `__invoke()` exceeds 30 lines

### Why It Is Harmful
The Action lacks the architectural support that a Use Case provides (DTOs, explicit transaction management, port injection).

### Preferred Alternative
Promote to a Use Case with proper DTOs, transaction management, and port injection.

### Refactoring Strategy
1. Create input/output DTOs
2. Move transaction management to the Use Case method
3. Split helper methods into injected services or domain objects
4. Replace Action with Use Case
5. Update callers

### Detection Checklist
- [ ] Action has 4+ constructor parameters
- [ ] Action manages transactions
- [ ] Action has private helper methods
- [ ] Action exceeds 30 lines
