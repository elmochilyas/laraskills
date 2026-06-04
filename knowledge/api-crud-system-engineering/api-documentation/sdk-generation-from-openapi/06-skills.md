# Skill: Generate SDKs from OpenAPI Specs

## Purpose
Automate generation of type-safe client SDKs from OpenAPI specs using codegen tools (OpenAPI Generator, Fern, Speakeasy) with consistent operationId conventions, component-based schemas, discriminated unions, error models, and CI-published packages.

## When To Use
- APIs with external consumers needing client libraries in multiple languages
- Public APIs with documented SLAs and versioning
- Teams supporting multiple consumer languages (JS, Python, PHP, Go, etc.)
- APIs where client-server type consistency is critical

## When NOT To Use
- Single-language consumers with well-maintained hand-written SDK
- Rapidly changing prototype APIs (spec not stable enough)
- Internal-only APIs consumed exclusively through server-to-server calls
- APIs with highly irregular patterns that codegen produces poor output for

## Prerequisites
- OpenAPI spec generated or maintained
- Understanding of target language(s)
- CI/CD pipeline for automated generation

## Inputs
- OpenAPI spec file with operationIds and component schemas
- Codegen tool configuration (language, output directory, options)
- Target language package manager credentials for publishing

## Workflow
1. Set `operationId` on every operation using `{resource}.{action}` convention (e.g., `users.list`, `users.get`)
2. Define all data models in `components/schemas` with `$ref` references — never use inline schemas
3. Use discriminated unions for `oneOf` schemas with discriminator property and mapping
4. Include error response models in `components/schemas` for typed error handling in generated SDKs
5. Define `properties` for every object-type property — avoid untyped `type: object` without properties
6. Configure codegen tool with per-language settings (custom templates, naming conventions)
7. Automate SDK generation in CI/CD: generate → test → publish on success
8. Never modify generated SDK code directly — use codegen extension points (custom templates, post-processing scripts)
9. Match SDK versions to API versions using OpenAPI spec version

## Validation Checklist
- [ ] Consistent `operationId` values on every operation (`{resource}.{action}`)
- [ ] All schemas defined in `components/schemas` with `$ref` references
- [ ] oneOf schemas include discriminator properties and mappings
- [ ] Error response models in components for typed error handling
- [ ] All object properties have explicit `properties` definitions
- [ ] Codegen configured with per-language settings
- [ ] SDK generation automated in CI/CD pipeline
- [ ] Generated SDKs tested before publishing
- [ ] SDK versions aligned with API versions

## Common Failures
- Missing operationId — SDK method names generated inconsistently from paths
- Inline schemas — codegen generates duplicate types for each endpoint
- Untyped objects — codegen produces Map/Dictionary with no structure
- Missing error models — SDKs have no typed error handling
- Direct modification of generated SDK code — lost on regeneration

## Decision Points
- Codegen tool: OpenAPI Generator (50+ languages), Fern (TypeScript-first DX), Speakeasy (SDK publishing focus)
- Publishing strategy: generated SDK in repo vs separate SDK repo vs CI-published package
- Generation timing: on every API release vs on spec change vs scheduled

## Performance Considerations
- Codegen build time for 100 endpoints, 5 languages: OpenAPI Generator 2-5 min, Fern 30-60s, Speakeasy 1-3 min
- Generated SDKs can be 5-50 MB per language
- Consider tree-shaking or modular generation for large APIs

## Security Considerations
- Review generated SDKs before publishing to public registries — may include base URLs, API key placeholders
- Do not include production secrets in spec examples used for SDK generation
- Ensure SDK does not expose internal-only endpoints through the spec

## Related Rules
- Always Provide Consistent operationId Values
- Define Every Schema In Components With $ref References
- Use Discriminated Unions For oneOf Schemas
- Include Error Response Models In The Spec
- Avoid Untyped Object Properties
- Automate SDK Generation And Testing In CI
- Never Modify Generated SDK Code Directly

## Related Skills
- Generate OpenAPI Spec
- Document Response Schemas
- Document Error Responses

## Success Criteria
- All operations have consistent `{resource}.{action}` operationIds
- All schemas are defined in components, never inline
- Polymorphic schemas use discriminated unions for type-safe codegen
- Generated SDKs include typed error handling models
- SDK generation, testing, and publishing are fully automated in CI
- SDK versions are aligned with API versions
- No generated files are directly modified by developers
