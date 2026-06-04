# Skill: Document Endpoint Content

## Purpose
Write endpoint documentation with clear descriptions for parameters, request bodies, response schemas, and error cases, using annotations or attributes and human-readable explanations of behavior.

## When To Use
- Every API endpoint in documentation
- OpenAPI spec descriptions
- API reference documentation

## When NOT To Use
- Internal-only endpoints consumed by same-team services
- Prototype endpoints before documentation freeze

## Prerequisites
- API endpoint definitions
- Documentation tool setup

## Inputs
- Endpoint behavior specification
- Request/response schema definitions

## Workflow
1. Describe each endpoint with its purpose: what it does, when to use it, idempotency note
2. Document all parameters with type, format, required/optional, and example value
3. Document request body with schema per HTTP method — inferred from Form Request rules
4. Document response body with schema per success status code and per error type
5. Document all HTTP status codes returned: 200, 201, 204, 400, 401, 403, 404, 422, 429, 500
6. Add example request and response for happy path and at least one error case
7. Include authentication requirements per endpoint — which auth guard, which abilities
8. Note rate limits per endpoint — reference rate limiter configuration
9. Document deprecation status — version deprecated, sunset date, migration path
10. Use consistent language and format across all endpoint docs

## Validation Checklist
- [ ] Each endpoint has purpose description
- [ ] All parameters documented with type, format, and example
- [ ] Request body schema documented per endpoint
- [ ] Response body schema per success status code
- [ ] All possible HTTP status codes documented
- [ ] Example request and response for happy path
- [ ] Example error response for at least one error case
- [ ] Authentication requirements documented per endpoint
- [ ] Rate limits noted
- [ ] Deprecation status documented where applicable

## Common Failures
- Description too vague — "Creates a user" without explaining behavior (confirmation email? duplicates?)
- Missing parameter examples — developer must read schema to construct request
- No error examples — consumers learn about 422 format during integration
- Status codes missing — consumer doesn't know endpoint can return 409 Conflict
- Authentication requirements incomplete — unclear whether Bearer token or cookie needed
- Documentation language inconsistent — "ID" vs "Identifier" vs "id" in same doc

## Decision Points
- Verbose vs concise descriptions — verbose for complex, concise for CRUD
- One error example vs all — one per error code for spec completeness
- Example data — realistic but fake (use `example.com`, `test@example.com`, `John Doe`)

## Performance Considerations
- Documentation generation overhead is build-time only — no runtime impact
- Example responses in docs add to spec file size — keep examples concise (2-5 fields)
- Consider linking to paginated schemas instead of inlining for large response examples

## Security Considerations
- Example data must not contain real user information or secrets
- API keys/tokens in examples must be clearly fake (e.g. `sk_test_...`)
- Don't document internal-only endpoints in public documentation
- Error examples must not reveal schema internals in detail messages

## Related Rules
- Describe Every Endpoint With Explicit Purpose
- Document All Parameters With Type, Format, Example
- Document All HTTP Status Codes Per Endpoint
- Include Example Request and Response For Happy Path
- Include Error Response Examples For At Least 4xx Codes
- Document Authentication Requirements Per Endpoint

## Related Skills
- OpenAPI Spec Generation — for spec-based documentation
- Scramble Integration — for Laravel-native docs
- API Documentation Strategy — for overall documentation approach

## Success Criteria
- Every endpoint documented with purpose, parameters, and response schemas
- Example requests and responses for happy path and errors included
- All HTTP status codes listed per endpoint
- Authentication requirements clear per endpoint
- Documentation language consistent across all endpoints
- Deprecation status documented for deprecated endpoints
