# ECC Standardized Knowledge — SDK Generation from OpenAPI

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | SDK Generation from OpenAPI |
| Difficulty | Advanced |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

SDK Generation from OpenAPI automatically produces client libraries in multiple programming languages from an OpenAPI specification. Tools like OpenAPI Generator, Fern, and Speakeasy consume the spec and produce type-safe HTTP clients with request/response models, authentication handling, and documentation. SDK generation eliminates manual client library maintenance, ensures client-server type consistency, and accelerates consumer integration.

## Core Concepts

- **Codegen pipeline**: OpenAPI spec -> Codegen tool -> Language-specific client library (API client, models, methods, error types, docs).
- **Codegen tools**: OpenAPI Generator (50+ languages, broadest coverage), Fern (10+ languages, TypeScript-first, excellent DX), Speakeasy (10+ languages, SDK publishing/versioning focus).
- **Schema-to-type mapping**: OpenAPI features map to language constructs — object with properties -> class with typed fields, enum -> enum/union, oneOf -> union type, operationId -> method name, tags -> namespace.
- **Spec quality drives SDK quality**: Missing properties, oneOf without discriminators, untyped object schemas produce unusable SDKs. Schema completeness directly affects output.

## When To Use

- APIs with external consumers needing client libraries in multiple languages
- Public APIs with documented SLAs and versioning
- Teams supporting multiple consumer languages (JS, Python, PHP, Go, etc.)
- APIs where client-server type consistency is critical

## When NOT To Use

- Single-language consumers with well-maintained hand-written SDK
- Rapidly changing prototype APIs (spec not stable enough for SDK generation)
- Internal-only APIs consumed exclusively through server-to-server calls
- APIs with highly irregular patterns that codegen produces poor output for

## Best Practices

- **Always provide operationId**: Use `resource.action` convention. Without it, codegen generates inconsistent method names from paths.
- **All schemas in components**: Define every data model in `components/schemas` with $ref. Avoid inline schemas — codegen may handle them poorly or generate duplicate types.
- **Use discriminated unions for oneOf**: Include discriminator property so codegen generates proper union types.
- **Define error models**: Success-only schemas produce SDKs with no typed error handling. Define error response schemas in components.
- **Consistent schema definitions**: Every property should have explicit type. Untyped `object` produces generic Map/Dictionary.
- **Match SDK versions to API versions**: SDK v2.1.0 corresponds to API v2.1.0. Use OpenAPI spec version to drive SDK version.

## Architecture Guidelines

- Automate SDK generation and publishing in CI/CD pipeline (generate -> test -> publish to npm/Packagist/PyPI).
- Test generated SDKs against actual API before publishing. Run integration tests using generated clients.
- Provide SDK usage examples in OpenAPI spec's `externalDocs`.
- Maintain per-language config files for codegen tool (each language may need different settings).
- When spec changes produce breaking SDK changes, notify consumers before publishing new SDK version.

## Performance Considerations

- Codegen build time (100 endpoints, 5 languages): OpenAPI Generator 2-5 min, Fern 30-60s, Speakeasy 1-3 min.
- Generated SDKs can be large (5-50 MB per language) due to generated code and dependencies.
- Consider tree-shaking or modular SDK generation for large APIs.

## Security Considerations

- Generated SDKs include base URLs, API key placeholders, and authentication configuration. Review generated code before publishing to public registries.
- Do not include production secrets or tokens in spec examples used for SDK generation.
- Ensure SDK does not expose internal-only endpoints through spec.

## Common Mistakes

- **Missing operationId**: SDK method names generated from paths, producing inconsistent or unreadable names like `apiUsersIdGet`.
- **Inline schemas**: Codegen generates duplicate types for each endpoint using inline schema. Define in components with $ref.
- **Untyped objects**: Property typed as `object` without properties. Codegen generates generic Map/Map<string, any> with no structure.
- **Missing error models**: SDKs have no typed error handling. Consumers parse errors from generic exceptions.
- **Spec-incompatible codegen**: Spec uses oneOf patterns or circular $ref that codegen cannot handle. Validate spec against codegen capabilities.

## Anti-Patterns

- **Direct modification of generated SDK code**: Regeneration overwrites manual changes. Use codegen extension points (custom templates, post-generation scripts).
- **No SDK testing before publishing**: Generated client may have bugs in URL construction, serialization, or auth. Always integration-test.

## Examples

- OpenAPI Generator: `openapi-generator generate -i openapi.yaml -g php -o ./sdk/php`.
- Speakeasy: `speakeasy generate -s openapi.yaml -l php -o ./sdk`.
- Fern: `fern generate --group sdk`.
- operationId pattern: `operationId: users.list -> client.users.list()`, `operationId: users.get -> client.users.get(id)`.

## Related Topics

- **Prerequisites**: OpenAPI Spec Generation, API Endpoint Documentation
- **Closely Related**: Response Schema Documentation, Authentication Documentation, Endpoint Documentation Content
- **Advanced**: Custom Codegen Templates, SDK Testing Strategies, SDK Version Management

## AI Agent Notes

When generating SDKs from OpenAPI: always provide consistent operationId values, define all schemas in components with $ref, use discriminated unions for oneOf, include error response models, avoid inline schemas and untyped objects, automate generation and testing in CI, version SDKs with API versions, test generated SDKs before publishing, never modify generated code directly.

## Verification

Sources: OpenAPI Generator (openapi-generator.tech), Fern (buildwithfern.com), Speakeasy (speakeasy.com), domain-analysis.md.
