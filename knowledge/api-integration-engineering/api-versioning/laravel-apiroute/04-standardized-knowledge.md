# ECC Standardized Knowledge — Laravel API Route Versioning

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-versioning |
| Knowledge Unit ID | ku-24 |
| Knowledge Unit | Laravel API Route Versioning |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K007, K016 |

## Overview (Engineering Value)
API versioning allows evolving your API contract without breaking existing consumers. Laravel supports URL-prefix versioning (`/api/v1/`, `/api/v2/`), header versioning (`Accept: application/vnd.app.v1+json`), and query parameter versioning (`?version=1`). Each approach has tradeoffs in routing simplicity, cache-friendliness, and consumer experience.

## Core Concepts
- **URI Versioning**: `/api/v1/users`, `/api/v2/users` — most common, simplest
- **Header Versioning**: `Accept: application/vnd.app.v1+json` — cleaner URLs
- **Query Versioning**: `/api/users?version=1` — simplest but pollutes URLs
- **Route Group**: `Route::prefix('v1')` for version-scoped routes
- **Fallback/Default**: Default version when none specified
- **Version Negotiation**: Middleware to extract version from header/query

## When To Use
- Public-facing APIs with external consumers
- APIs with breaking changes expected
- Multi-tenant or enterprise API platforms

## When NOT To Use
- Internal-only APIs with single consumer
- Rapid prototyping phase (versioning adds overhead)
- When backward compatibility is maintained via other means (HATEOAS)

## Best Practices
- Prefer URI versioning for simplicity and visibility
- Support minimum versions for a defined period
- Version at the route level, not individual endpoints
- Maintain backward compatibility within a version
- Document deprecation timeline per version
- Use versioned namespaces for controllers

## Architecture Guidelines
- Route files per version: `routes/api/v1.php`, `routes/api/v2.php`
- Controller namespaces: `App\Http\Controllers\Api\V1\`, `App\Http\Controllers\Api\V2\`
- Versioned request/response DTOs per version
- Shared service layer between versions (only controllers differ)
- Version middleware for header-based versioning

## Performance Considerations
- URI versioning: no overhead (different routes)
- Header versioning: middleware adds ~0.5ms
- Multiple route files: slight increase in route registration time
- Versioned DTOs: memory proportional to active versions

## Common Mistakes
- Versioning at parameter level (fragmented, hard to maintain)
- No deprecation timeline for old versions
- Breaking changes within same version
- Versioning entire application instead of individual API
- Forgetting to version error responses and pagination formats

## Related Topics
- **Prerequisites**: Laravel routing, REST API design
- **Closely Related**: OpenAPI generation, deprecation headers
- **Advanced**: Semantic versioning for APIs, HATEOAS
- **Cross-Domain**: API design, consumer management

## Verification
- [ ] Versioning strategy chosen and documented
- [ ] Route files organized by version
- [ ] Controller namespaces per version
- [ ] Shared service layer between versions
- [ ] Deprecation timeline documented
- [ ] Error responses versioned consistently
