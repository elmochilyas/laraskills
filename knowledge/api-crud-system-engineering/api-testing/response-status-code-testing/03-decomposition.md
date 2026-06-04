# Decomposition: Response Status Code Testing

## Boundary Analysis
This KU covers HTTP status code assertions — the integer status code returned for each condition. It excludes the response body (covered by response-shape-testing, error-response-shape-testing) and headers. The boundary is "the HTTP status line, nothing else."

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Status code testing is a single concept: "assert the correct HTTP status code for a given condition." Splitting by status code family (2xx, 4xx, 5xx) would scatter the same assertion pattern across multiple KUs.

## Dependency Graph
- **Depends on:** HTTP Status Code Semantics
- **Depends on:** feature-test-structure (assertion chaining)
- **Referenced by:** All failure-mode KUs (status is the primary assertion)
- **Referenced by:** contract-testing-with-openapi (status codes in API specs)

## Follow-up Opportunities
- Custom status code constants and conventions
- Status code deprecation handling in CI
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization