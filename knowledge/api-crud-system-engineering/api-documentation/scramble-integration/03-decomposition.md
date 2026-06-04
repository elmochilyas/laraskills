# Decomposition: Scramble Integration

## Topic Overview
Scramble is a Laravel-native OpenAPI documentation generator that infers specs from code (routes, Form Requests, API Resources) without annotations. This KU covers setup, configuration, inference mechanics, and production deployment.

## Decomposition Strategy
This KU is atomic — it covers a single tool with well-bounded mechanics. The inference chain (routes → controllers → Form Requests → API Resources) is a linear pipeline with no meaningful sub-KUs. No further decomposition is needed.

## Proposed Folder Structure
```
scramble-integration/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Scramble Integration
- **Purpose:** Understand how Scramble generates OpenAPI specs from Laravel code
- **Difficulty:** Intermediate
- **Dependencies:** Laravel Route Definitions, PHP 8.0+ Type System

## Dependency Graph
Depends on: Laravel Route Definitions, PHP 8.0+ Type System. Serves as prerequisite for: OpenAPI Spec Generation, Endpoint Documentation Content. Related to: Scribe Integration (alternative tool).

## Boundary Analysis
**In scope:** Scramble service provider registration, route introspection, Form Request rule extraction, API Resource schema inference, return type reflection, config file options, production caching, docs route protection, OpenAPI 3.1 output format.
**Out of scope:** Manual OpenAPI spec authoring (openapi-spec-generation KU), alternative doc generators (scribe-integration KU), Postman collection export (postman-collection-generation KU), CI validation pipelines (documentation-ci-validation KU), SDK codegen (sdk-generation-from-openapi KU).

## Future Expansion Opportunities
- Scramble plugin API documentation — when Scramble stabilizes a plugin/extension system
- Form Request rule coverage table — exhaustive mapping of Laravel rules → OpenAPI schema keywords
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization