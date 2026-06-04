# Decomposition: Authorization Failure Testing

## Boundary Analysis
This KU covers 403 Forbidden assertions for authenticated users lacking permissions — role-based, ownership-based, and policy-gated denials. It explicitly excludes authentication failure (401), which is covered separately. The boundary is "identity known, permission denied."

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Authorization failure testing is a single security concern. Splitting by enforcement mechanism (policies vs gates vs roles) would create overlap — all result in 403.

## Dependency Graph
- **Depends on:** authentication-failure-testing (distinguishes 401 from 403)
- **Depends on:** feature-test-structure (multi-user test setup patterns)
- **Depends on:** test-data-factory-design (factory states for roles/permissions)
- **Referenced by:** layer-isolation-in-tests (policy unit testing vs feature testing)

## Follow-up Opportunities
- Policy-less authorization patterns (enum-based permissions)
- Authorization matrix testing (every role x every endpoint)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization