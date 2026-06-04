# Decomposition: Scribe Integration

## Topic Overview
Scribe generates static HTML documentation, Postman collections, and OpenAPI specs from PHPDoc annotations and optional response call mode. Covers setup, annotation patterns, call vs extract mode, and CI integration.

## Decomposition Strategy
This KU is atomic — it covers a single tool (Scribe) with a well-defined annotation pipeline. The extract/call mode distinction is a configuration choice within the same tool, not a separate KU.

## Proposed Folder Structure
```
scribe-integration/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Scribe Integration
- **Purpose:** Generate API documentation using Scribe's annotation-driven approach
- **Difficulty:** Intermediate
- **Dependencies:** PHPDoc Annotations, Controller Method Design

## Dependency Graph
Depends on: PHPDoc Annotations, Controller Method Design. Serves as prerequisite for: Postman Collection Generation (Scribe's export), Endpoint Documentation Content. Related to: Scramble Integration (alternative tool).

## Boundary Analysis
**In scope:** Scribe installation, `scribe.php` configuration, `@group`, `@bodyParam`, `@response`, `@queryParam`, `@urlParam`, `@header` annotations, extract mode, call mode with database seeding, Postman collection export, OpenAPI export, HTML theme customization, CI generation pipeline, auth configuration for call mode.
**Out of scope:** OpenAPI spec manual authoring (openapi-spec-generation KU), Scramble as alternative (scramble-integration KU), Postman as primary tool (postman-collection-generation KU), changelog generation (changelog-generation KU), documentation CI validation (documentation-ci-validation KU).

## Future Expansion Opportunities
- Custom Scribe Strategies — Developer-written extraction and response strategies as potential sub-KU
- Scribe Output Theming — Advanced Blade customization of HTML output
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization