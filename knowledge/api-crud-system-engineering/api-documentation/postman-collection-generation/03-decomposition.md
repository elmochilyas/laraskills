# Decomposition: Postman Collection Generation

## Topic Overview
Producing Postman-compatible JSON collection files from OpenAPI specs or documentation generators. Covers collection structure, environment separation, auth configuration, and scripting.

## Decomposition Strategy
This KU is atomic � it covers the single Postman artifact and its generation pipeline. Environment files and test scripts are features within the collection, not separate KUs.

## Proposed Folder Structure
```
postman-collection-generation/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
```

## Knowledge Unit Inventory

### Postman Collection Generation
- **Purpose:** Generate and maintain Postman collections from OpenAPI specs or doc generators
- **Difficulty:** Intermediate
- **Dependencies:** OpenAPI Spec Generation, API Endpoint Design

## Dependency Graph
Depends on: OpenAPI Spec Generation, API Endpoint Design. Related to: Scribe Integration (direct export), Documentation CI Validation (Newman in CI).

## Boundary Analysis
**In scope:** Postman Collection v2.1 format, OpenAPI to Postman conversion (import, openapi-to-postman, Scribe export), environment variable separation, collection folder structure, pre-request scripts for auth, test scripts for response validation, Newman CI execution, collection versioning, JSON environment files, collection publishing (Run in Postman button).
**Out of scope:** OpenAPI spec authoring (openapi-spec-generation KU), static HTML documentation (scribe-integration KU), SDK codegen (sdk-generation-from-openapi KU), Postman as an API testing framework (api-testing subdomain).

## Future Expansion Opportunities
- Newman CI Pipeline � Deep integration of Postman collection testing in deployment workflows
- Postman Mock Servers � Running mock servers from collections for frontend development
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization