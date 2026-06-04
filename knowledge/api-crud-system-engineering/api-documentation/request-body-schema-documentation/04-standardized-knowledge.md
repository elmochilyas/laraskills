# ECC Standardized Knowledge — Request Body Schema Documentation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Request Body Schema Documentation |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Request Body Schema Documentation describes the structure, constraints, and semantics of data that clients send to API endpoints. In OpenAPI, this is represented under `requestBody` -> `content` -> `application/json` -> `schema`. The schema defines required/optional properties, types, formats, validation constraints, and examples. Well-documented request bodies reduce integration errors by making the precise data contract visible to consumers.

## Core Concepts

- **Schema components per property**: Name, type, format, required/optional, nullable, constraints (minLength, maxLength, minimum, maximum, pattern, enum), description, example, default.
- **Nested object schemas**: Each nesting level must be documented explicitly. Flat bodies are simpler to document; nested bodies model domain relationships better.
- **Array constraints**: Item type/shape, minItems, maxItems, uniqueItems.
- **Polymorphic bodies**: oneOf/anyOf/allOf for varying request shapes. Document each variant with distinguishing fields.
- **Validation rule mapping**: Scramble translates Laravel validation rules to JSON Schema automatically.

## When To Use

- Every POST, PUT, PATCH endpoint that accepts a request body
- APIs with complex nested payload structures
- APIs consumed by external teams needing precise data contracts
- APIs powering generated SDKs (SDK quality depends on schema completeness)

## When NOT To Use

- GET/DELETE endpoints without request bodies
- Prototype endpoints where payload structure is rapidly changing
- Internal endpoints with single consumer that reads code directly

## Best Practices

- **Mirror validation rules**: The schema should be a machine-readable version of the server's validation. Every required rule becomes a required property; every max:255 becomes maxLength: 255.
- **Define reusable schemas in components**: Reference via `$ref` in request bodies. Use inline schemas only for one-off structures.
- **Document from consumer perspective**: "What do I need to send?" rather than "What does the server validate?"
- **Include complete request body examples**: Not just per-property examples. Show the full payload structure.
- **Consistent nullable handling**: Use `type: [string, null]` (OpenAPI 3.1) or `nullable: true` (OpenAPI 3.0) consistently.
- **Document enum values with descriptions**: Each enum value should explain what it represents.

## Architecture Guidelines

- Version request schemas: when API version changes request structure, create new schema component (CreateUserRequestV2) rather than modifying existing one.
- Auto-generate from Form Requests (Scramble) to eliminate drift between validation and documentation.
- Use contract tests to verify documented schema accepts/rejects same payloads as actual validation.

## Performance Considerations

- Each request schema adds to OpenAPI spec size. 50 request schemas with nested structures can add 5,000-10,000 lines.
- Bundle and compress spec for production serving.

## Security Considerations

- Review request schemas for sensitive field exposure (passwords, tokens) in example values.
- Do not include internal validation implementation details in descriptions.
- Ensure nullable fields do not bypass required validation through documentation ambiguity.

## Common Mistakes

- **Documenting only top-level fields**: Nested object schemas omitted. Consumers send incomplete payloads.
- **Missing required fields flag**: Field assumed obviously required. Consumers omit it and get 422 errors.
- **Constraints without descriptions**: maxLength documented but field purpose unclear. Consumers don't know what to send.
- **Example mismatch with schema**: Example violates schema constraints. Consumers mix up example and constraint.
- **Schema too permissive**: Missing maxLength/pattern constraints. Consumers send valid-by-doc but rejected-by-server payloads.

## Anti-Patterns

- **Inline schemas everywhere**: Duplicated definitions across endpoints. Always use components/schemas with $ref.
- **No example payloads**: Consumers must guess the request structure. Always provide at least one example.

## Examples

- Scramble rule mapping: `required|email|max:255` -> `{ type: string, format: email, maxLength: 255, required: true }`.
- Reusable schema with $ref: `requestBody.content.application/json.schema: { $ref: '#/components/schemas/CreateUserRequest' }`.
- Nested object: `address: { type: object, properties: { street: { type: string }, city: { type: string } } }`.

## Related Topics

- **Prerequisites**: JSON Schema Basics, Laravel Form Request Design
- **Closely Related**: Response Schema Documentation, Error Response Documentation, Endpoint Documentation Content
- **Advanced**: Polymorphic Request Schemas, Request Body Versioning

## AI Agent Notes

When documenting request bodies: mirror validation rules exactly, document every nesting level, always mark required fields explicitly, include complete examples, document each enum value, use component schemas for reusability, validate examples against schema in CI.

## Verification

Sources: JSON Schema Validation (json-schema.org), OpenAPI 3.1 Request Body Object specification, Scramble docs, domain-analysis.md.
