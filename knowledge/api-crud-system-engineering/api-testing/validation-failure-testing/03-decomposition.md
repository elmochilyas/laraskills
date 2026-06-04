# Decomposition: Validation Failure Testing

## Boundary Analysis
This KU covers 422 responses triggered by invalid input — required fields, format rules, unique constraints, nested validation, and custom rules. It excludes other 4xx errors (401, 403, 404) and excludes form-request unit testing (separate KU). The boundary is "input rejected by validation rules."

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
A single KU for validation failure testing is appropriate — splitting by rule type (required vs format vs unique) would create redundant method section overlap (all share 422 assertion pattern).

## Dependency Graph
- **Depends on:** feature-test-structure (sending request bodies with various payloads)
- **Depends on:** error-response-shape-testing (422 response structure)
- **Referenced by:** form-request-unit-testing (contrasting integration vs isolation approach)
- **Referenced by:** contract-testing-with-openapi (error schemas in API specs)

## Follow-up Opportunities
- FormRequest auto-testing from rules() reflection
- Property-based validation testing (random invalid inputs)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization