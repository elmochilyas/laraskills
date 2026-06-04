# ECC Anti-Patterns — When NOT to Use DTOs

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | When NOT to Use DTOs |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Dogmatic DTO (DTO for Every Controller Action)
2. The Premature Abstraction (DTOs Created Before Any Service Code)
3. The Echo Chamber DTO (Mirroring FormRequest With No Transformation)
4. DTOs for API Responses (Using DTOs Instead of API Resources)
5. DTO Churn (Constant Restructuring in Rapidly Changing Code)

---

## Repository-Wide Anti-Patterns

- Team Convention Requiring DTOs for Every Operation Regardless of Complexity
- DTOs for Simple CRUD (Controller → Model Pass-Through)
- DTOs With Same Fields as FormRequest Validated Data
- DTOs Created Before Any Consumer Exists
- DTOs That Add Cost but No Measurable Value

---

## Anti-Pattern 1: The Dogmatic DTO

### Category
Architecture | Maintainability

### Description
A team convention that every controller action must have a DTO, regardless of complexity — even for simple CRUD where data flows directly from FormRequest to model.

### Why It Happens
Teams adopt DTOs as a "best practice" without understanding the 2-3 layer threshold. The rule becomes dogma rather than an engineering decision.

### Warning Signs
- A DTO exists for a controller that delegates to a single service method with no additional callers
- The DTO has the same fields as the FormRequest's validated array with no transformation
- Service method immediately converts the DTO back to an array or spreads it into model creation
- Removing the DTO and passing `$request->validated()` directly requires no other changes

### Preferred Alternative
Apply the 2-3 layer threshold: create a DTO only when data crosses 2-3+ application layers. For simple CRUD, `$request->validated()` is sufficient.

### Related Rules
- Rule: Apply the 2-3 Layer Threshold Before Adding a DTO

---

## Anti-Pattern 2: The Premature Abstraction

### Category
Architecture | Maintainability

### Description
Creating DTOs for every entity before any service code exists, resulting in unused DTOs that need restructuring when the service layer is built.

### Why It Happens
Teams plan DTOs upfront during project initialization, creating classes for entities they expect to need based on the database schema.

### Warning Signs
- Project directory has 20+ DTO files but only 2-3 are actually used in services
- DTO properties reflect database columns exactly — no domain concept transformation
- First service method immediately creates a different DTO shape because the pre-created DTO doesn't fit
- Half the DTOs have no `fromArray()` factory because no code constructs them yet

### Preferred Alternative
Start without DTOs. Let DTOs emerge from service needs — create them when a second entry point appears or when a field-related bug occurs.

### Related Rules
- Rule: Let DTOs Emerge From Service Needs, Not Entity Structure

---

## Anti-Pattern 3: The Echo Chamber DTO

### Category
Design | Maintainability

### Description
A DTO whose properties exactly mirror the FormRequest's validated keys with no transformation, renaming, or type conversion.

### Why It Happens
Developers create DTOs as a mandatory step without evaluating whether the DTO adds value. The DTO becomes a ceremony-only abstraction.

### Warning Signs
- DTO field names are identical to HTTP form field names
- No type conversion happens in the factory method
- DTO is used by exactly one method in one service
- Removing the DTO and passing `$request->validated()` directly produces identical behavior

### Preferred Alternative
Either transform field names, flatten nested structures, or convert types. If no transformation is needed, skip the DTO and use validated data directly.

### Related Rules
- Rule: DTO Must Transform or Add Value Beyond FormRequest

---

## Anti-Pattern 4: DTOs for API Responses

### Category
Architecture

### Description
Using a DTO's `toArray()` method for HTTP response formatting instead of Laravel's API Resources (`JsonResource` / `ResourceCollection`).

### Why It Happens
DTOs already have `toArray()` methods, making them tempting to use directly in `response()->json()`. Developers skip API Resources because DTOs seem sufficient.

### Warning Signs
- Controller returns `response()->json($dto->toArray())` instead of `new UserResource($dto)`
- DTO `toArray()` contains HTTP-specific concerns (links, meta, pagination)
- No `JsonResource` subclasses exist — all response formatting is via DTO `toArray()`
- Pagination metadata is awkwardly added after `toArray()` in the controller

### Preferred Alternative
Use API Resources for HTTP response formatting. DTOs handle inter-layer data transport. Resources handle response shaping, conditional loading, and pagination.

### Related Rules
- Rule: Use API Resources for Responses, Not DTOs

---

## Anti-Pattern 5: DTO Churn

### Category
Maintainability

### Description
Constant DTO restructuring in rapidly changing code (startup, MVP, prototype) where business requirements change weekly.

### Why It Happens
Adding or renaming a DTO property requires changes to: the DTO class, the factory method, all tests, and every consumer. In a fast-moving codebase, this overhead multiplies.

### Warning Signs
- DTO files are modified in every sprint to add/rename/remove fields
- Each field change cascades through 5+ files (DTO, factory, test, service, consumer)
- Developers spend more time updating DTOs than writing business logic
- Team considers dropping DTOs after the prototype phase

### Preferred Alternative
Use arrays in the prototype/MVP phase. Migrate to DTOs when the data shape stabilizes and the codebase needs the type safety contract. DTOs protect against change — they don't accelerate it.

### Related Rules
- Rule: Defer DTOs Until Data Shape Stabilizes
