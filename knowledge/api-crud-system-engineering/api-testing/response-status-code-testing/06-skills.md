# Skill: Test Response Status Codes

## Purpose
Write feature tests asserting every endpoint returns the correct HTTP status code under every condition — success, error, edge cases — using convenience methods, asserting status first in every chain, and mapping every condition to its expected code.

## When To Use
- Every API test — status code is the first assertion in every chain
- Regression testing after middleware or exception handler changes
- Contract verification across API versions

## When NOT To Use
- Testing response body content
- Testing header values
- Testing the HTTP protocol itself

## Prerequisites
- Feature test structure (PHPUnit/PestPHP)
- HTTP status code semantics (RFC 7231)

## Inputs
- List of endpoints with expected status codes per condition
- Error condition triggers (invalid input, missing auth, etc.)

## Workflow
1. Assert status first in every test chain — saves response parsing if status is wrong
2. Use convenience methods: `assertOk()` (200), `assertCreated()` (201), `assertNoContent()` (204), `assertNotFound()` (404), `assertForbidden()` (403), `assertUnauthorized()` (401)
3. Map every endpoint condition to its canonical code: GET→200, POST→201, PUT/PATCH→200, DELETE→204
4. Test error codes: 401 (unauth), 403 (forbidden), 404 (not found), 422 (validation), 429 (rate limit), 500 (server error)
5. Assert 204 for all delete endpoints — most frequently misimplemented CRUD code
6. Distinguish 401 (unauthenticated) from 403 (forbidden) — mixing them breaks client retry logic
7. Use PestPHP datasets to parameterize status code tests across multiple endpoints

## Validation Checklist
- [ ] Status is the first assertion in every test chain
- [ ] Convenience methods used over `assertStatus($code)` for readability
- [ ] Canonical CRUD codes used: GET=200, POST=201, PUT/PATCH=200, DELETE=204
- [ ] 401/403 correctly distinguished
- [ ] 204 asserted for delete endpoints
- [ ] Every endpoint condition maps to expected status code
- [ ] Edge status codes tested (201 store, 204 delete)

## Common Failures
- Returning 200 instead of 201 for resource creation
- Returning 200 instead of 204 for resource deletion
- 401/403 confusion (unauthenticated vs unauthorized)
- 500 for validation errors (uncaught ValidationException)
- Asserting status after body assertions (confusing failure cascade)

## Decision Points
- Convenience method vs `assertStatus()` — prefer convenience for readability
- Per-endpoint tests vs dataset-parameterized status tests
- Error status testing: per-endpoint vs global exception handler tests

## Performance Considerations
- Status code assertions are the cheapest type — single integer check
- Always assert status first; if wrong, skip further assertions
- Group status assertions by endpoint to minimize kernel boots

## Security Considerations
- 5xx responses must not expose stack traces or internal details
- 4xx responses must use standardized codes to prevent information leakage
- Wrong status codes (500 instead of 404) may expose unhandled exceptions

## Related Rules
- Assert Status First In Every Test Chain
- Use Canonical CRUD Status Codes
- Don't Confuse 401 With 403
- Map Every Condition To Expected Status
- Assert 204 For Delete

## Related Skills
- Test Authentication Failures
- Test Authorization Failures
- Test Validation Failures
- Test Not Found Responses

## Success Criteria
- Every endpoint has correct status code tested for all conditions
- Status asserted first in every chain — no confusing failure cascade
- 401/403 correctly distinguished across all tests
- 204 asserted on all delete endpoints
- Convenience methods used throughout for readability
