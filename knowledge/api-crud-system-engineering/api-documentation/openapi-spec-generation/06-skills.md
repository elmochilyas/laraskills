# Skill: Implement OpenAPI Specification Generation

## Purpose
Generate OpenAPI/Swagger specs from code annotations, route definitions, and Form Request rules using automated spec generation tooling, with manual overrides for descriptions and custom response schemas.

## When To Use
- Documenting API endpoints via OpenAPI spec
- Generating client SDKs from spec
- Maintaining API contract documentation

## When NOT To Use
- Static hand-written documentation only
- Non-API endpoints (web, CLI)

## Prerequisites
- OpenAPI spec generation tool (Scribe, Scramble, or manual)
- Route and Form Request definitions

## Inputs
- Route definitions
- Form Request rules
- Custom response schemas

## Workflow
1. Choose generation approach: automated (Scribe/Scramble) for live docs, manual for full control
2. Configure tool to scan routes and extract request/response schemas from code
3. Override generated descriptions with human-readable endpoint and parameter documentation
4. Add custom response schemas for non-standard endpoints — 4xx errors, custom status codes
5. Define security schemes in spec — Bearer token, cookie, API key
6. Add tags for endpoint grouping — resource-based tags for organization
7. Include server information: base URLs, versioning, environments
8. Generate spec output (JSON/YAML) and serve via docs endpoint or static file
9. Validate generated spec with open-source validators — catch schema errors
10. Integrate spec generation into CI — ensure spec stays in sync with code

## Validation Checklist
- [ ] API spec generation tool configured
- [ ] Endpoint descriptions overridden with human-readable text
- [ ] Request schemas extracted from Form Request rules
- [ ] Custom response schemas for 4xx/5xx responses
- [ ] Security schemes defined (Bearer token, cookie, API key)
- [ ] Tags applied for logical grouping
- [ ] Server information (URLs, versioning) included
- [ ] Spec generated in JSON/YAML format
- [ ] Spec validated against OpenAPI schema
- [ ] Spec generation integrated into CI pipeline

## Common Failures
- Generated spec missing descriptions — parameter names without explanations
- Security schemes not defined — endpoints show "no auth" in docs
- Request schemas out of sync with Form Request rules — manual spec maintenance
- Response schemas empty or generic — no example responses
- Spec generation not in CI — spec drifts from code
- OpenAPI version mismatch — 3.0 vs 3.1 differences

## Decision Points
- Automation tool — Scramble (Laravel-native, zero config), Scribe (mature, more features), manual
- Spec delivery — hosted docs endpoint vs downloadable file vs dedicated docs UI (Swagger UI)
- Annotation vs code-based — annotations for custom metadata, code-based for less maintenance

## Performance Considerations
- Spec generation should be CI step, not runtime — never generate per-request
- Generated spec file size grows with endpoint count — consider multi-file spec for large APIs
- Validation step adds CI time (~2-5s) — worth the contract verification

## Security Considerations
- Never include internal/non-public endpoints in public spec
- Security schemes in spec should match actual middleware — no missing auth documented
- Don't expose schema details that aid enumeration (exact ID types, hash algorithms)
- Spec response examples must not contain real data or secrets

## Related Rules
- Use Automated Spec Generation Tooling
- Override Generated Descriptions With Human-Readable Text
- Define Security Schemes In Spec
- Validate Generated Spec Against OpenAPI Schema
- Integrate Spec Generation Into CI Pipeline
- Include Server Information In Spec

## Related Skills
- Endpoint Documentation Content — for endpoint-level docs
- OpenAPI Schema Design — for schema-level decisions
- API Documentation Strategy — for overall documentation approach

## Success Criteria
- OpenAPI spec generated from code with accurate request/response schemas
- Endpoint descriptions are human-readable and informative
- Security schemes documented matching actual middleware
- Spec validated and passing schema checks
- Spec stays in sync with code via CI integration
- Consumer can generate client code from spec without manual fixes
