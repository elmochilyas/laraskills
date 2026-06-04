# Decomposition: Error Response Shape Testing

## Boundary Analysis
This KU covers the structural consistency of error responses across all endpoints — message key, errors key, debug information control, and custom error shapes. It excludes the triggers of specific errors (covered by auth-failure, validation-failure, etc.) and focuses on the format of the error response, not the condition that produces it.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Error shape consistency is a single concern enforced by one file (the exception handler). Splitting by HTTP status code would duplicate the same shape-consistency assertion.

## Dependency Graph
- **Depends on:** Laravel Exception Handling (Handler configuration)
- **Depends on:** response-shape-testing (general structure assertion patterns)
- **Referenced by:** validation-failure-testing (422-specific shape)
- **Referenced by:** not-found-testing (404-specific shape)
- **Referenced by:** contract-testing-with-openapi (error schemas)

## Follow-up Opportunities
- JSON:API error shape conformance testing
- Error code taxonomy and machine-readable error responses
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization