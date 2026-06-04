# ECC Standardized Knowledge — Response Schema Documentation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Response Schema Documentation |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Response Schema Documentation describes the structure, types, and semantics of data that API endpoints return to clients. In OpenAPI, this is under `responses` -> status code -> `content` -> `application/json` -> `schema`. The schema documents every property clients can expect, including nullable fields, nested relationships, pagination metadata, and links. Well-documented response schemas enable type-safe client code generation, accurate API client development, and reliable contract testing.

## Core Concepts

- **Response structure types**: Single resource, collection, paginated collection, empty (204 No Content), error response.
- **Property documentation per field**: Name, type, format, nullable, description, example, read-only, deprecated.
- **Relationship inclusion**: Nested resources via $ref. Document conditional inclusion mechanisms (sparse fields, includes).
- **Pagination metadata**: current_page, per_page, total, last_page, links (first, last, prev, next).
- **Read-only vs writable fields**: Server-generated fields (id, timestamps) marked readOnly. Distinguishes response-only from request-sendable fields.

## When To Use

- Every endpoint that returns data
- APIs consumed by external teams building client applications
- APIs powering generated SDKs (response models are SDK outputs)
- APIs requiring contract testing against documented schemas

## When NOT To Use

- Endpoints returning binary streams (file downloads) — document as `type: string, format: binary`
- Prototype endpoints with rapidly changing response shapes
- Internal-only utility endpoints

## Best Practices

- **Document every response field**: Include server-generated fields (id, timestamps). Consumers need to know all available data.
- **Explicit nullable documentation**: Every property that can be null should have nullable: true and description explaining when/why.
- **Mark read-only properties**: id, created_at, updated_at as readOnly: true. Signals consumer not to send these.
- **Response examples per status code**: 200 (success), 201 (created), 422 (validation error), 404 (not found).
- **Reusable pagination schema**: Define pagination metadata once in components, reference everywhere.
- **Validate schema against actual responses in CI**: Use contract tests (Dredd, Schemathesis, PHP assertions) to verify match.

## Architecture Guidelines

- Version response schemas: when response structure changes, create new Resource schemas. Old schemas remain in old API version docs.
- Auto-generate from API Resources (Scramble) for drift-free documentation.
- Document wrapper/unwrapped pattern explicitly: `{ data: { ... } }` vs bare resource.

## Performance Considerations

- Response schemas form largest portion of OpenAPI spec. 30 resources with nested relationships can add 15,000-20,000 lines.
- Use `$ref` aggressively to reduce duplication in spec files.

## Security Considerations

- Review response schemas for accidental exposure of internal fields (password hashes, pivot data, internal IDs).
- Document conditional field availability based on permissions/roles.
- Do not include production data in example values.

## Common Mistakes

- **Documenting only successful responses**: Consumers don't know error response shapes. Document at minimum a standard error component.
- **Forgetting read-only fields**: Server-generated fields excluded from docs. Consumers don't know they exist.
- **Inconsistent nesting with actual response**: API Resource returns different structure than documented. CI validation catches this.
- **Omitting nullable responses**: Relationships that sometimes return null documented as always present. Consumers don't handle null safely.
- **Pagination metadata inconsistency**: meta object keys differ from documented. Define reusable pagination schema.

## Anti-Patterns

- **No conditional field documentation**: When fields are included only for certain users or with certain parameters, document the conditions.
- **Example values that don't match schema**: Consumers trust examples; they must be valid per the schema.

## Examples

- Paginated response schema: `{ data: { $ref: '#/components/schemas/UserResource' }, meta: { type: object, properties: { current_page: { type: integer }, per_page: { type: integer }, total: { type: integer }, last_page: { type: integer } } } }`.
- Read-only property: `created_at: { type: string, format: date-time, readOnly: true }`.
- Nullable relationship: `profile_photo_url: { type: string, format: uri, nullable: true, description: "Null if user has not uploaded a photo." }`.

## Related Topics

- **Prerequisites**: Laravel API Resources, JSON Schema
- **Closely Related**: Request Body Schema Documentation, Error Response Documentation, Endpoint Documentation Content
- **Advanced**: Sparse Fieldset Documentation, Response Envelope Design, Pagination Metadata Design

## AI Agent Notes

When documenting response schemas: include every response field (including server-generated), mark nullable fields explicitly with conditions, use readOnly for id/timestamps, provide examples per status code, define reusable pagination schema, auto-generate from API Resources, validate against actual responses in CI.

## Verification

Sources: OpenAPI 3.1 Response Object specification, Laravel API Resources documentation, domain-analysis.md.
