# Skill: Generate OpenAPI Documentation from Versioned Laravel APIs

## Purpose
Generate OpenAPI/Swagger specifications from versioned Laravel API routes using annotations or attributes, with version-specific documentation.

## When To Use
- Documenting versioned APIs for consumers
- Generating API clients from OpenAPI specs
- Maintaining up-to-date API documentation
- Any Laravel REST API consumed by external developers

## When NOT To Use
- Internal-only APIs (doc generation may be overkill)
- Prototype/exploratory APIs

## Prerequisites
- API versioning in place
- `composer require darkaonline/l5-swagger` or similar

## Workflow
1. Install OpenAPI generation package
2. Add `#[OA\Info]`, `#[OA\Schema]`, `#[OA\Get]`, etc. attributes or annotations
3. Document version-specific request/response schemas per version
4. Use `@OA\Tag` to group endpoints by version
5. Generate spec: `php artisan l5-swagger:generate`
6. Serve docs at `/api/documentation` with version selector
7. Generate per-version specs for separate consumption
8. Validate generated spec with swagger-validator

## Validation Checklist
- [ ] OpenAPI package installed
- [ ] Attributes/annotations added to all versioned endpoints
- [ ] Request/response schemas documented per version
- [ ] Endpoints grouped by version via tags
- [ ] Spec generates without errors
- [ ] Spec validated with swagger-validator
- [ ] Docs accessible at `/api/documentation`
