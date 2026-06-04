# ECC Anti-Patterns — Resource vs DTO Decision

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Resource vs DTO Decision |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Passing Resources as Arguments to Services
2. Using DTOs as Response Formatters (Missing HTTP Features)
3. Using Resources as Internal Data Carriers
4. Forcing Both Patterns on Every Endpoint (No Discrimination)

---

## Repository-Wide Anti-Patterns

- Fat Controllers (no DTO, no Resource — raw arrays)
- Overengineering (DTO + Resource for simple CRUD endpoints)
- Business Logic in Models (if neither pattern is applied)

---

## Anti-Pattern 1: Passing Resources as Arguments to Services

### Category
Architecture

### Description
Services receive a `JsonResource` instance as a method argument, coupling the service layer to HTTP.

### Why It Happens
The developer has the resource instance available and passes it to the service for convenience.

### Warning Signs
- Service method signature includes `JsonResource`, `JsonResponse`, or `Request`
- Service cannot be called from CLI or queue without constructing a fake Resource
- Service accesses `$resource->resource` to get the underlying model

### Preferred Alternative
Services receive typed DTOs, Eloquent models, or primitives. Resources are created after the service returns.

### Related Rules
- Rule: Never Pass Resources as Arguments to Services

---

## Anti-Pattern 2: Forcing Both Patterns on Every Endpoint

### Category
Design | Maintainability

### Description
Creating both a DTO and a Resource for every single endpoint regardless of complexity, adding ceremony without value.

### Why It Happens
"Best practices" dogma. The team has a rule: every endpoint must have a FormRequest, DTO, Service, and Resource — even for simple CRUD.

### Warning Signs
- Simple `User::create()` endpoint creates 4 files (FormRequest, DTO, Service, Resource)
- DTO and Resource contain identical fields
- No service layer exists for most endpoints — the DTO is unused

### Preferred Alternative
Apply the decision matrix: has a service layer? Multiple clients? Conditional response fields? Use both only when the complexity justifies it.

### Related Rules
- Rule: Use the Decision Matrix for New Endpoints
