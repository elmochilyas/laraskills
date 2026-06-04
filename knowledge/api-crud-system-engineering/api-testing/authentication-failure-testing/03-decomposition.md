# Decomposition: Authentication Failure Testing

## Boundary Analysis
This KU covers rejection of unauthenticated requests — 401 responses for missing, expired, malformed, or wrong-guard tokens. It explicitly excludes authorization (403 Forbidden) which is a separate KU. The boundary is "identity verification failure," not "permission denial."

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Auth-failure testing is a single concern: "assert unauthenticated requests are rejected." Splitting by token type (missing vs expired vs malformed) doesn't justify separate KUs because the assertion pattern is identical.

## Dependency Graph
- **Depends on:** feature-test-structure (test class organization)
- **Depends on:** Laravel Sanctum/Passport authentication mechanics
- **Referenced by:** authorization-failure-testing (distinguishing authN from authZ failures)
- **Referenced by:** error-response-shape-testing (consistent error formatting)

## Follow-up Opportunities
- Multi-guard authentication testing patterns
- Token revocation lifecycle end-to-end testing
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization