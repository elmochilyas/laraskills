# ECC Standardized Knowledge — OpenAPI Spec Generation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | OpenAPI Spec Generation |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

OpenAPI Spec Generation produces an `openapi.yaml` or `openapi.json` file describing the complete API surface. The spec is the central artifact feeding documentation, SDK generation, contract testing, and API gateway configuration. OpenAPI 3.1 aligns with JSON Schema 2020-12 for rich type descriptions.

## Core Concepts

- **Document structure**: `openapi`, `info`, `servers`, `paths`, `components`, `tags`, `externalDocs`.
- **JSON Schema integration** (OpenAPI 3.1): Full JSON Schema 2020-12 for schemas — `$defs`, `$comment`, `unevaluatedProperties`, `prefixItems`.
- **Path item object**: Parameters, requestBody, responses, security, deprecated per operation.
- **Components**: Reusable schemas, responses, parameters, securitySchemes, headers.
- **Schema-first vs code-first**: Schema-first (design spec, then implement) vs code-first (implement, then generate spec).

## When To Use

- Every API with any external consumer
- APIs needing SDK generation, contract testing, or developer portal integration
- APIs with multiple consumers needing a formal contract
- CI/CD pipelines requiring documentation validation

## When NOT To Use

- Prototype/experimental APIs (spec adds overhead before design is settled)
- Internal-only APIs with documented code
- APIs documented exclusively through Postman collections (if no other OpenAPI tooling needed)

## Best Practices

- **All schemas in components**: Define every data model in `components/schemas` with `$ref` references. Avoid inline schemas.
- **Consistent error schema**: Single error response schema referenced across all operations.
- **Security scheme at global level**: Define in `components/securitySchemes`, apply globally, override per operation for public endpoints.
- **operationId convention**: `resource.action` — enables clean SDK method names.
- **Single file for small APIs, multi-file for large**: Bundle multi-file specs with Redocly CLI before deployment.
- **Version spec with API version**: `info.version` matches API version. Tag spec files with version in filename.
- **Validate in CI**: Every PR must pass spec validation and completeness checks.

## Architecture Guidelines

- Serve spec at well-known URL (`/openapi.yaml` or `/docs/openapi.yaml`) with CORS headers.
- Publish versioned specs alongside releases (`openapi-v2.yaml`).
- Use Scramble (code-first) for auto-generated specs or write manually (schema-first).
- Validate with `redocly lint` and `swagger-cli validate` in CI.
- Bundle multi-file specs before deployment to avoid broken `$ref` issues.

## Performance Considerations

- Spec validation for 100+ endpoints may take 5-30 seconds. Use incremental validation in editors.
- Spec file size can reach 1-5 MB. Use gzip for serving.
- Multi-file specs require bundling step before deployment.

## Security Considerations

- Spec exposes complete API surface. Protect if API is internal.
- Do not include production server URLs in specs committed to public repositories during development.
- Review auto-generated specs for accidental exposure of internal endpoints.

## Common Mistakes

- **Incorrect YAML indentation**: Tabs vs spaces. OpenAPI parsers reject. Use editor linting.
- **Missing required top-level fields**: `openapi`, `info`, `paths` are required.
- **Over-nesting `$ref` references**: Deep chains (>3 levels) are hard to debug and slow to resolve.
- **Unused components**: Spec bloat from copied schemas never referenced. Run dead-component detection.
- **Spec-code drift**: Spec describes endpoints that no longer exist. Contract testing and CI validation.

## Anti-Patterns

- **Including unused schemas**: Spec bloat and consumer confusion. Only define what paths reference.
- **No `operationId`**: SDK generation produces inconsistent method names. Always provide unique operationId.
- **Untyped `object` properties**: Codegen produces generic Map type. Define all object properties.

## Examples

- Components: `components/schemas/User: { type: object, properties: { id: { type: integer }, name: { type: string } } }`.
- Path: `/users/{id}: get: operationId: users.get, responses: { '200': { content: { application/json: { schema: { $ref: '#/components/schemas/User' } } } } }`.

## Related Topics

- **Prerequisites**: YAML/JSON syntax, REST API Design
- **Closely Related**: Scramble Integration, Scribe Integration, Endpoint Documentation Content
- **Advanced**: SDK Generation from OpenAPI, OpenAPI Diff and Breaking Change Detection, Contract Testing

## AI Agent Notes

When generating OpenAPI specs: use components/schemas with $ref for all data models, define consistent error schemas, use `resource.action` operationId pattern, validate in CI, serve with CORS, version the spec with the API version.

## Verification

Sources: OpenAPI 3.1 Specification, JSON Schema 2020-12, Redocly CLI docs, domain-analysis.md.
