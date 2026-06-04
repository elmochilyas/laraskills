# Skill: Design Error Type Taxonomy

## Purpose
Classify API errors into a structured taxonomy by type (validation, auth, authorization, not found, conflict, rate limit, server error) and severity (client error vs server error) for consistent handling and client communication.

## When To Use
- When designing the error handling system for a new API
- When standardizing error formats across multiple microservices
- When error codes need systematic categorization

## When NOT To Use
- Simple APIs where HTTP status codes alone are sufficient
- Internal services with no external consumers requiring categorization

## Prerequisites
- HTTP status code semantics (4xx vs 5xx)
- Common error scenario identification

## Inputs
- Error scenario list per endpoint
- HTTP status code mapping

## Workflow
1. Define top-level error types — validation, authentication, authorization, not found, conflict, rate limit, server error, domain error
2. Map each type to its HTTP status code — validation→422, auth→401, authorization→403, not found→404, conflict→409, rate limit→429, server→500
3. Classify each error scenario into exactly one type — no ambiguity
4. Distinguish client errors (4xx) from server errors (5xx) — client errors are the consumer's responsibility
5. Define severity per type — 4xx are expected and handled, 5xx are unexpected and escalated
6. Document taxonomy with examples of each type
7. Map each custom exception class to its taxonomy type
8. Use taxonomy to determine error handling behavior — logging, reporting, retry logic

## Validation Checklist
- [ ] Error types defined and mutually exclusive
- [ ] Each type mapped to correct HTTP status code
- [ ] Each error scenario classified into exactly one type
- [ ] Client vs server error distinction documented
- [ ] Severity per type defined
- [ ] Exceptions mapped to taxonomy types
- [ ] Taxonomy determines handling behavior

## Common Failures
- Overlapping types — error could be classified into multiple categories
- Missing types — domain errors that don't fit standard categories
- Inconsistent status code mapping — 422 for validation but also for conflicts
- No severity distinction — treating all errors the same

## Decision Points
- Standard types vs custom domain types — standard for common, custom for domain-specific
- 4xx vs 5xx classification — 4xx for consumer-correctable, 5xx for system failures
- Retryable vs non-retryable — 429 retryable, 422 not retryable

## Performance Considerations
- Taxonomy has no runtime performance impact
- Classification is design-time decision, not runtime operation

## Security Considerations
- 5xx errors must never expose implementation details
- 4xx errors should guide consumers without revealing system internals
- Auth error type must not distinguish user existence

## Related Rules
- Define Top-Level Error Types
- Map Each Type to Correct HTTP Status
- Classify Each Error Into Exactly One Type
- Distinguish Client vs Server Errors
- Document Taxonomy with Examples
- Map Exceptions to Taxonomy Types

## Related Skills
- Error Code Namespace Design — namespace matching taxonomy
- Domain-Specific Error Codes — codes within taxonomy
- Exception-to-Code Mapping — connecting exceptions to taxonomy
- Standardized Error Envelope — type included in response

## Success Criteria
- Every error scenario maps to exactly one taxonomy type
- Taxonomy is documented with examples
- HTTP status codes are consistent per type
- Client and server errors are clearly distinguished
- Exception-to-taxonomy mapping is complete