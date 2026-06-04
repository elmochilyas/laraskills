# ECC Anti-Patterns — Three-Layer Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | Three-layer architecture: Presentation, Business, Data |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Fat Controller
2. Service-in-Name-Only
3. Layer Bypass
4. Leaky Presentation Layer

---

## Repository-Wide Anti-Patterns

- Fat Controllers
- God Services
- Business Logic in Models
- N+1 Query Problem

---

## Anti-Pattern 1: Fat Controller

### Category
Architecture

### Description
Controllers containing business logic, data access code, and response formatting alongside HTTP orchestration. A single controller method handles validation, calculations, persistence, email sending, and response construction — mixing all three layers.

### Why It Happens
Quickest path from route to database. No service extraction convention. Time pressure.

### Warning Signs
- Controllers >200 lines
- Controllers contain `Model::where(...)`, `DB::table(...)`
- Business rules duplicated across controllers
- Controllers use `Mail::send()`, `Event::dispatch()` directly

### Preferred Alternative
Controllers should only validate input (Form Requests), call services, and return responses. Extract all business logic to Service classes.

### Refactoring Strategy
1. Group business logic sections in the controller
2. Create service classes for each group
3. Replace logic with service calls
4. Add architecture tests preventing new logic in controllers

### Related Rules
- R01: Keep Controllers Free of Business Logic Beyond HTTP Orchestration (LAP-01/05-rules.md)

### Related Skills
- Implement Three-Layer Architecture in Laravel (LAP-01/06-skills.md)

---

## Anti-Pattern 2: Layer Bypass

### Description
Calling the Data layer directly from the Presentation layer — Controllers calling `Model::find()` instead of delegating to Services. Bypasses business rules that should be enforced in the Business layer.

### Why It Happens
Perception that "it's just one query." No architecture tests prevent bypass. Time pressure.

### Warning Signs
- `Controller::find()`, `Controller::where()`, `Controller::create()` calls
- Business rules not applied because data accessed directly
- Duplicate query logic across controllers

### Preferred Alternative
Controllers must always delegate to services for data access. Enforce with architecture tests.

### Related Rules
- Layer enforcement architecture tests (LAP-01/05-rules.md)

---

## Anti-Pattern 3: Leaky Presentation Layer

### Description
Passing `Illuminate\Http\Request` objects to Service methods — leaking HTTP concerns into the Business layer. Services become coupled to HTTP, untestable without request mocking.

### Why It Happens
Convenience — passing the whole request is faster than extracting parameters.

### Warning Signs
- Service methods accept `Request $request` parameters
- Services use `$request->input()`, `$request->user()`
- Services cannot be tested without bootstrapping HTTP

### Preferred Alternative
Extract needed data in the Controller and pass primitives or DTOs to Service methods.

### Related Rules
- R03: Never Pass Request Objects to Service Methods (LAP-01/05-rules.md)
