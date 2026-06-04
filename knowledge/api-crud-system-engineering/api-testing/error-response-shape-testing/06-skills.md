# Skill: Test Error Response Shape

## Purpose
Write feature tests asserting every error response (4xx and 5xx) follows a consistent JSON structure — testing at the exception handler level, covering each error status code, verifying debug/production modes, asserting absence of sensitive data, and validating custom error fields.

## When To Use
- Every endpoint that can return error responses
- API contracts specifying error response structure
- Client SDKs parsing error responses programmatically
- Post-deployment validation of error shape consistency

## When NOT To Use
- The specific conditions that trigger errors (covered by auth-failure, validation-failure, not-found KUs)
- Success response shape (covered by response-shape-testing)
- Error message content localization

## Prerequisites
- Laravel Exception Handler
- Response shape testing

## Inputs
- Expected error shape per status code (401, 403, 404, 422, 429, 500)
- Custom error fields configuration (trace_id, code, etc.)
- Sensitive data patterns to exclude

## Workflow
1. Test at handler level, not per-endpoint — error shape is controlled by a single file; one test per error status code covers all endpoints
2. Test each error status code shape: 401 `{"message": "Unauthenticated."}`, 403 `{"message": "This action is unauthorized."}`, 404 `{"message": "Not Found."}`, 422 `{"message": "The given data was invalid.", "errors": {...}}`, 429 `{"message": "Too Many Attempts."}`, 500 `{"message": "Server Error"}`
3. Test both debug (`APP_DEBUG=true`) and production (`APP_DEBUG=false`) error shapes — debug includes stack traces; production strips them
4. Assert absence of sensitive data in error responses: `assertJsonMissing(['file', 'line', 'trace', 'exception'])`
5. When adding custom error fields (trace_id, code, documentation_url), assert their presence and consistency across all error types
6. Use datasets to iterate all error status codes for compact coverage
7. Test that 422 error shape includes the `errors` dictionary key (structurally different from other error shapes)

## Validation Checklist
- [ ] Handler-level tests not per-endpoint
- [ ] Each error status (401, 403, 404, 422, 429, 500) has a dedicated shape test
- [ ] Both debug and production error shapes tested
- [ ] Sensitive data absent in production error responses (stack traces, SQL queries)
- [ ] Custom error fields consistent across all error types
- [ ] 422 shape includes `errors` key

## Common Failures
- Custom error shapes only applied to some exception types — others fall through to defaults
- Including `exception` and `file` keys in production error responses (debug info leak)
- Making 422 structurally different from 401 (inconsistent top-level keys)
- Per-endpoint error shape testing instead of handler-level coverage
- Forgetting to test 500 error shape (unguarded, may expose stack traces)

## Decision Points
- Handler-level vs per-endpoint: always prefer handler-level for consistency coverage
- Debug mode testing: include or skip based on project policy
- Custom fields: how many (trace_id, code, status, documentation_url) — balance consistency with simplicity

## Performance Considerations
- Error shape tests are cheap — trigger errors with malformed requests
- Run in dedicated test suite validating the exception handler globally
- No complex setup required

## Security Considerations
- Never include stack traces, SQL queries, or internal IDs in production error messages
- `APP_DEBUG=false` must strip all debug information from error responses
- Test that sensitive data (user emails, tokens, internal IDs) does not appear in error messages
- Log full exception details server-side but return only safe subset

## Related Rules
- Test Handler-Level Consistency, Not Per-Endpoint
- Test Each Error Status Code Shape
- Test Both Debug And Production Error Shapes
- Assert Absence Of Sensitive Data
- Test Custom Error Fields Are Always Present

## Related Skills
- Test Response Status Codes
- Test Response Headers
- Test Authentication Failures
- Test Authorization Failures

## Success Criteria
- Handler-level tests cover all error status codes
- Debug and production error shapes verified independently
- Sensitive data stripped from production error responses
- Custom error fields consistent across all error types
- Error shape documented and matches OpenAPI spec
