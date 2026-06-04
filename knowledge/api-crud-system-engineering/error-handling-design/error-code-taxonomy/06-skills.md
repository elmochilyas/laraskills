# Skill: Design API Error Code Taxonomy

## Purpose
Design application-specific error codes for all API error types: validation errors, authentication failures, not-found, conflict, rate limiting, server errors — each with consistent code prefix and numeric suffix.

## When To Use
- API error envelope design
- Error code standardization across endpoints
- Client-side error handling logic

## When NOT To Use
- Non-API error handling (web, CLI)
- Errors without client-facing impact

## Prerequisites
- Standardized error envelope
- Error type enumeration

## Inputs
- Error category list
- Error code format specification

## Workflow
1. Define error code format: `CATEGORY_CODE` where CATEGORY is uppercase prefix and CODE is 3-digit numeric: `VALIDATION_001`
2. Define categories: `VALIDATION_`, `AUTH_`, `AUTHORIZATION_`, `NOT_FOUND_`, `CONFLICT_`, `RATE_LIMIT_`, `SERVER_`
3. Assign codes per error type within each category — sequential 001, 002
4. Validation errors: `VALIDATION_001` for required field, `VALIDATION_002` for format error
5. Auth errors: `AUTH_001` for unauthenticated, `AUTH_002` for token expired
6. Resource errors: `NOT_FOUND_001` for model not found, `NOT_FOUND_002` for route not found
7. Conflict errors: `CONFLICT_001` for duplicate resource, `CONFLICT_002` for stale data
8. Rate limit: `RATE_LIMIT_001` for tier limit exceeded, `RATE_LIMIT_002` for burst limit
9. Document error code taxonomy in API documentation with human-readable descriptions
10. Never reuse or repurpose error codes — deprecate instead

## Validation Checklist
- [ ] Error code format defined: `CATEGORY_CODE`
- [ ] Categories defined for all error types
- [ ] Each error type has unique code
- [ ] Validation, auth, authorization, not-found, conflict, rate-limit, server categories covered
- [ ] Codes sequential within categories
- [ ] Error codes returned in error envelope
- [ ] Error code taxonomy documented with descriptions
- [ ] Codes never reused — deprecated when removed
- [ ] Client can differentiate error types by code prefix
- [ ] Tests verify correct error code per scenario

## Common Failures
- Error codes too generic — `ERROR_001` doesn't distinguish between 401 and 404
- Error codes reused — old `VALIDATION_001` repurposed for different error
- No category prefix — numeric only, cannot determine type from code
- Codes not documented — clients can't map codes to handling logic
- Too many codes — 100 error codes for 10 error types
- Same error code returned for different scenarios — not actionable

## Decision Points
- Code granularity — per error type vs per scenario (VALIDATION_001 for every validation vs per-field)
- Category naming — `AUTH_` vs `AUTHENTICATION_` vs `SECURITY_`
- Numeric range — sequential per category vs semantic (1xx validation, 2xx auth)

## Performance Considerations
- Error code string comparison is O(n) on code length — negligible
- Code taxonomy is metadata only — no runtime lookup overhead
- Large code sets (>200) may need hierarchical scheme

## Security Considerations
- Error codes must not reveal internal system details
- 404 errors should use same code regardless of missing resource type — prevents enumeration
- Auth error codes generic — not revealing whether user exists
- Rate limit codes must not expose limit configuration details

## Related Rules
- Use `CATEGORY_CODE` Error Code Format
- Assign Unique Codes Per Error Type
- Document Error Code Taxonomy
- Never Reuse Or Repurpose Error Codes
- Test Correct Error Code Per Scenario

## Related Skills
- Standardized Error Envelope — for error envelope design
- Exception Rendering — for error code integration in exceptions
- Validation Error Testing — for verifying validation error codes

## Success Criteria
- Every API error returns a unique, meaningful error code
- Clients can determine error category from code prefix
- Error code taxonomy documented and discoverable
- No error codes reused across different error types
- Error codes stable — adding new codes doesn't change existing ones
- Error codes tested in integration tests
