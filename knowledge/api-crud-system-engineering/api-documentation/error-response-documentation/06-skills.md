# Skill: Document Error Responses

## Purpose
Document all possible error responses per endpoint using reusable OpenAPI components with machine-readable error codes, scenario-based examples, and validated schemas covering 400, 401, 403, 404, 422, 429, and 500 status codes.

## When To Use
- Every endpoint documentation (all possible error status codes)
- Public APIs consumed by external developers
- APIs where error handling is non-trivial
- Documentation for contract testing reference

## When NOT To Use
- Internal APIs where consumer knows error shapes from code
- Endpoints with truly no possible errors (theoretically none — always document at least 500)

## Prerequisites
- HTTP status code semantics
- Standardized error envelope design
- OpenAPI spec structure

## Inputs
- List of error status codes per endpoint
- Error response schema definition
- Example error payloads per scenario

## Workflow
1. Define base error response schema in `components/schemas/ErrorResponse` with `message`, `code`, `errors` properties
2. Define reusable response objects in `components/responses/` (Unauthorized, ValidationError, NotFound, RateLimited, ServerError)
3. Document at minimum 400, 401, 403, 404, 422, 429, and 500 on every endpoint via `$ref` to reusable components
4. Include a `code` property with an enum of machine-readable strings in every error response
5. Provide multiple response examples per error status code showing different failure scenarios
6. Document `Retry-After` header format in 429 rate limit responses
7. Validate error response schemas with contract tests covering error paths

## Validation Checklist
- [ ] Reusable error response components defined in `components/responses/`
- [ ] Base `ErrorResponse` schema with message, code, errors properties
- [ ] Every endpoint documents minimum error status codes (401, 403, 404, 422, 429, 500)
- [ ] Machine-readable error code enum documented
- [ ] Multiple scenario-based examples per error status
- [ ] Retry-After header documented for 429 responses
- [ ] Error response schemas verified by contract tests

## Common Failures
- Documenting only success responses — error handling code cannot be developed from docs
- Vague error messages — consumers cannot determine the cause
- Inconsistent error shape across endpoints — prevents generic error handler code
- Missing rate limit documentation — consumers discover limits only when hitting 429
- Error schema does not match actual response — contract tests should catch this

## Decision Points
- Error shape: RFC 9457 Problem Details vs custom envelope
- Code namespace design: domain-specific vs flat error codes
- Example strategy: inline examples vs external example files

## Performance Considerations
- Error documentation has no runtime impact
- Spec size increases with error examples — use `$ref` to keep manageable

## Security Considerations
- Error messages in documentation must not leak internal details — use generic examples
- Debug/stack trace info shown only in development — document this behavior
- Error code patterns should not reveal internal system structure

## Related Rules
- Define Reusable Error Response Components
- Document All Error Status Codes On Every Endpoint
- Include Machine-Readable Error Codes
- Provide Scenario-Based Error Examples
- Document Retry-After Header In Rate Limit Errors
- Validate Error Response Schemas With Contract Tests

## Related Skills
- Design Error Response Envelope
- Document Response Schemas
- Validate Documentation in CI

## Success Criteria
- Every endpoint documents all applicable error status codes via reusable $refs
- Error shape is consistent across all endpoints
- Machine-readable error codes enable programmatic error handling
- Scenario-based examples show different failure modes
- Retry-After format is documented for rate-limited endpoints
- Contract tests verify error schemas match actual responses
