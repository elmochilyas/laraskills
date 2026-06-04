# Decomposition: SDK Generation from OpenAPI

## Topic Overview
Automatically producing client libraries (SDKs) in multiple programming languages from an OpenAPI specification. Covers codegen tools, pipeline setup, spec requirements, and SDK publishing.

## Decomposition Strategy
This KU is atomic � it covers the single concept of SDK generation from OpenAPI specs. Each codegen tool is a configuration variant, not a separate KU.

## Proposed Folder Structure
```
sdk-generation-from-openapi/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
```

## Knowledge Unit Inventory

### SDK Generation from OpenAPI
- **Purpose:** Automatically generate client SDKs from OpenAPI specs for consumer integration
- **Difficulty:** Advanced
- **Dependencies:** OpenAPI Spec Generation, API Endpoint Documentation

## Dependency Graph
Depends on: OpenAPI Spec Generation, API Endpoint Documentation. Consumes from: Response Schema Documentation (models), Authentication Documentation (auth config), Endpoint Documentation Content (operationId). Related to: Documentation CI Validation (SDK generation pipeline).

## Boundary Analysis
**In scope:** Codegen tools (OpenAPI Generator, Fern, Speakeasy), generated SDK components (client, models, methods, errors), operationId to method name mapping, schema to type mapping, discriminated unions for oneOf, inline vs component schemas impact, SDK CI/CD pipeline, SDK publishing (npm, Packagist, PyPI), SDK testing, SDK versioning, spec quality requirements for SDK generation, custom codegen templates, post-generation scripts.
**Out of scope:** OpenAPI spec authoring details (openapi-spec-generation KU), Postman collection generation (postman-collection-generation KU), documentation HTML/UI generation (scribe-integration KU), authentication implementation (api-authentication-authorization subdomain).

## Future Expansion Opportunities
- Custom Codegen Templates � Writing idiomatic templates for OpenAPI Generator
- SDK Testing Framework � Automating integration tests for generated SDKs
- Multi-Language SDK Publishing � Managing releases across npm, Packagist, PyPI, RubyGems
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization