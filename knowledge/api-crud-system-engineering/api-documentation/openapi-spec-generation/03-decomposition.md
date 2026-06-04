# Decomposition: OpenAPI Spec Generation

## Topic Overview
Production of OpenAPI specification files — whether manually authored, auto-generated from code, or hybrid. Covers spec structure, schema definition, validation, versioning, and ecosystem tooling.

## Decomposition Strategy
This KU is atomic — it covers the OpenAPI specification format and its production lifecycle as a single unit. The manual vs generated distinction is a workflow decision within the KU, not a separate KU.

## Proposed Folder Structure
```
openapi-spec-generation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### OpenAPI Spec Generation
- **Purpose:** Create, validate, and maintain OpenAPI specification documents
- **Difficulty:** Foundation
- **Dependencies:** YAML/JSON Syntax, REST API Design

## Dependency Graph
Depends on: YAML/JSON Syntax, REST API Design. Serves as prerequisite for: SDK Generation from OpenAPI, Postman Collection Generation, Documentation CI Validation. Provides context for: Scramble Integration, Scribe Integration.

## Boundary Analysis
**In scope:** OpenAPI 3.0 and 3.1 spec structure, path item objects, schema definition with JSON Schema 2020-12, `$ref` and component references, security scheme definitions, spec validation tools (Redocly, swagger-cli), spec bundling, versioning strategies, multi-file vs single-file decisions, spec serving in production.
**Out of scope:** Auto-generation tool details (scramble-integration KU, scribe-integration KU), SDK codegen (sdk-generation-from-openapi KU), Postman collection specifics (postman-collection-generation KU), changelog generation (changelog-generation KU), breaking change detection (api-versioning subdomain).

## Future Expansion Opportunities
- OpenAPI Diff Tooling — Automated breaking change detection using spec comparison
- OpenAPI 4.0 (Moonwalk) — Migration guide when the next major version stabilizes
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization