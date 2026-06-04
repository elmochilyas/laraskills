# Resource Class Organization — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Resource classes (Laravel API Resources) transform Eloquent models into JSON responses. Version-specific resource organization ensures each API version can return different shapes, fields, and structures. Phase 2 covers directory structure, resource inheritance, conditional attributes, and field deprecation in resources.

## Core Concepts
- **Versioned Resource Path:** `App\Http\Resources\V1\UserResource`, `App\Http\Resources\V2\UserResource`.
- **Resource Inheritance:** V2 resource extends V1 resource, overriding changed fields only.
- **Conditional Fields:** `$this->when()` or `$this->whenHas()` for version-specific optional fields.
- **Resource Collections:** Separate `UserCollection` per version for paginated responses.

## Mental Models
- **Blueprint Layers:** Each version is a blueprint layer. V1 shows basic floor plan. V2 overlays electrical and plumbing. V3 adds furniture layout. Same structure, different detail level.
- **Camera Filters:** The resource is a camera filter applied to the model. V1 is black and white. V2 adds color. V3 adds HDR. Same subject, different rendering.

## Internal Mechanics
- API Resource `toArray($request)` method defines the shape. Override in version subclasses.
- `$this->merge()` combines parent resource fields with version-specific additions.
- `$this->when()` conditionally includes fields based on request parameters or model state.
- Resource pagination via `->collection()` respects the versioned collection class.

## Patterns
- Base resource with common fields; version resources override `toArray()`.
- Resource trait for field groups (e.g., timestamps, permissions).
- Conditional inclusion of deprecated fields via `$this->when(false)` (never included).
- Resource factory that resolves the correct versioned resource.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Resource inheritance | V{n} extends V{n-1} | Progressive enhancement |
| Resource location | `Resources\V1\` namespace | Clear version isolation |
| Conditional fields | At resource level vs controller level | Resource-level is self-contained |
| Collection handling | Separate collection class per version | Full control over pagination shape |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Inheritance | Reuse, single field truth | Divergent versions create override chains |
| Separate resources | Full control, no coupling | Duplication across versions |
| Conditional fields | Flexible responses | Complex resource logic |
| Resource factory | Centralized resolution | Extra abstraction layer |

## Performance Considerations
- Resource resolution is O(1) with factory caching.
- Inheritance chain resolution is PHP-compiled, no runtime cost.
- Conditional `when()` calls are evaluated only when included.
- Resource collections loop over models — N per page, O(n) cost.

## Production Considerations
- Test each version resource independently with resource-specific tests.
- Keep conditional field logic simple; complex conditions belong in controllers.
- Use `->additional()` for version-specific metadata (deprecation warnings, pagination links).
- Monitor response size growth across versions to detect field bloat.

## Common Mistakes
- Deep resource inheritance (V1 → V2 → V3 → V4) creating fragile override chains.
- Using `when` for fields that are always included — adds useless condition checks.
- Forgetting that removing a field from V2+ is a breaking change for V1 consumers.
- Mixing version-specific and shared resources in the same directory.

## Failure Modes
- **Field bleed:** V2 resource accidentally inherits V1-only deprecated field.
- **N+1 in resources:** Version-specific eager loading not updated, leading to N+1 queries in new version.
- **Resource mismatch:** Controller returns V1 resource for V2 endpoint.
- **Shape inconsistency:** Same endpoint returns different JSON shapes from different resource versions.

## Ecosystem Usage
- **Laravel Spark:** Uses versioned resource classes for billing and team APIs.
- **October CMS:** Plugin API resources organized by version in Resources directory.
- **Laravel API Boilerplate (archived):** Popular reference for versioned resource organization.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Form request organization
- Controller inheritance

### Advanced Follow-up Topics
- Response structure patterns
- Resource version negotiation

## Research Notes
### Source Analysis
Laravel's own API Resource documentation (2024) demonstrates resource inheritance. Taylor Otwell's "Laravel: Up & Running" (2023) includes a chapter on versioned resource organization.

### Key Insight
The biggest challenge in resource versioning is not creating the new version — it's remembering to update the old version's tests when the underlying model changes.

### Version-Specific Notes
Laravel 11 resources are identical to Laravel 10. `Illuminate\Http\Resources\Json\JsonResource` API unchanged.
