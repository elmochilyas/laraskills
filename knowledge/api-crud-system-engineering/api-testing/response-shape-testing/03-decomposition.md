# Decomposition: Response Shape Testing

## Boundary Analysis
This KU covers structural JSON assertions using `assertJsonStructure` — key presence, nesting, wildcards, and optional type constraints. It excludes value assertions (`assertJson`, `assertExactJson`), status code assertions, and error-specific shapes. The boundary is "the skeleton of the response, not the values."

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Response shape is a single concern: "does the JSON have the expected keys and nesting?" Splitting by endpoint type (collection vs single) would create overlapping content.

## Dependency Graph
- **Depends on:** happy-path-testing (shape assertions added to happy path tests)
- **Depends on:** feature-test-structure (test method organization)
- **Referenced by:** pagination-response-testing (pagination shape specifics)
- **Referenced by:** error-response-shape-testing (error response structure)
- **Referenced by:** contract-testing-with-openapi (shape tests validate the spec)

## Follow-up Opportunities
- Auto-generating shape tests from OpenAPI schemas
- Shape diffing between API versions
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization