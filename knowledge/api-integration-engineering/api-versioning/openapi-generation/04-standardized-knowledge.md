# ECC Standardized Knowledge — OpenAPI Specification Generation

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-versioning |
| Knowledge Unit ID | ku-25 |
| Knowledge Unit | OpenAPI Specification Generation |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K007, K010, K011 |

## Overview (Engineering Value)
OpenAPI (Swagger) specifications provide machine-readable API documentation that enables automatic client SDK generation, interactive API explorers, and contract-first development. Laravel packages like `darkaonline/l5-swagger` and `scrutinizer/eye` generate specs from annotations or PHP 8 attributes, ensuring documentation stays synchronized with implementation.

## Core Concepts
- **OpenAPI Spec**: YAML/JSON file describing endpoints, schemas, parameters, auth
- **Annotations/Attributes**: PHP 8 attributes on controllers documenting endpoints
- **Schema Definitions**: Request/response DTOs with type definitions
- **Automatic Generation**: Generate spec from code annotations
- **Swagger UI**: Interactive browser-based API explorer
- **Contract Testing**: Verify API responses match spec

## When To Use
- Any public API needing consumer documentation
- Teams wanting auto-generated API client SDKs
- Contract-first development workflows
- API governance and compliance requirements

## When NOT To Use
- Internal-only APIs with single consumer
- Rapidly changing endpoints (spec maintenance overhead)
- When generated spec is never consumed

## Best Practices
- Use PHP 8 attributes for controller documentation
- Define reusable schemas for DTOs
- Include example values in schema definitions
- Version the OpenAPI spec alongside the API
- Validate generated spec against OpenAPI schema
- Integrate spec generation into CI pipeline

## Architecture Guidelines
- Spec generation config per API version
- DTO annotations in Data classes
- Group endpoints by tags for Swagger UI organization
- Security schemes defined globally (Bearer, API key)
- Custom attribute classes for reusable documentation patterns

## Performance Considerations
- Spec generation adds ~100-500ms during generation (not per-request)
- Swagger UI asset loading ~5-10ms per page load
- Generated spec file caching eliminates runtime overhead
- CI spec validation adds ~1s to pipeline

## Common Mistakes
- Outdated spec not matching actual API behavior
- Missing error response schemas (incomplete spec)
- Hardcoded example values not matching production data shapes
- Not versioning the spec separately
- Spec generation dependency on production database data

## Related Topics
- **Prerequisites**: REST API design, JSON schema
- **Closely Related**: API route versioning, client SDK generation
- **Advanced**: Contract testing, OpenAPI generators
- **Cross-Domain**: API documentation, developer experience

## Verification
- [ ] PHP 8 attributes used for endpoint documentation
- [ ] Reusable schemas defined for DTOs
- [ ] Spec validated against OpenAPI schema
- [ ] Spec versioned with API
- [ ] CI pipeline validates spec on PR
- [ ] Swagger UI accessible in non-production environments
