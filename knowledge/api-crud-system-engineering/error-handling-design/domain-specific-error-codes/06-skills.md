# Skill: Design Domain-Specific Error Codes

## Purpose
Define and implement domain-specific error codes that categorize errors by domain, subdomain, and specific error — providing machine-readable identifiers for programmatic error handling by API consumers.

## When To Use
- APIs where clients need programmatic error identification
- When different error types require different client recovery logic
- For organizing errors across multiple business domains

## When NOT To Use
- Simple APIs where HTTP status codes alone are sufficient
- Internal services with single consumer handling errors manually
- Prototypes before error taxonomy is formalized

## Prerequisites
- Error type taxonomy
- Error code namespace design

## Inputs
- Error scenarios per domain
- Error code format specification

## Workflow
1. Define error code format — `DOMAIN.SUBDOMAIN_SPECIFIC_ERROR` (e.g., `USER.AUTH_TOKEN_EXPIRED`)
2. Create one error code per distinct error scenario — never reuse codes
3. Group codes by domain and subdomain for logical organization
4. Document each error code with trigger scenario, HTTP status, and client recovery action
5. Implement error code as constants or backed enum — `ErrorCodes::USER_AUTH_TOKEN_EXPIRED`
6. Map each exception to its error code in the exception handler
7. Include error code in every error response envelope
8. Maintain error code registry — single source of truth for all codes

## Validation Checklist
- [ ] Error code format defined and consistent
- [ ] One error code per distinct error scenario
- [ ] Codes grouped by domain and subdomain
- [ ] Each error code documented with trigger and recovery
- [ ] Error codes implemented as constants or enum
- [ ] Exception-to-code mapping in handler
- [ ] Error code included in all error responses

## Common Failures
- Generic error codes that don't distinguish specific errors — useless for programmatic handling
- Reusing same code for different scenarios — client cannot differentiate
- No documentation — developers don't know which code to use
- Codes not included in responses — defeats purpose

## Decision Points
- Dotted vs underscore notation — `USER.AUTH.TOKEN_EXPIRED` vs `USER.AUTH_TOKEN_EXPIRED`
- Enum vs constant class — enum for exhaustiveness, constants for simple
- Granularity level — one per exception class vs one per distinct scenario

## Performance Considerations
- Error code lookup is O(1) — constant or enum resolution
- String serialization of code negligible (<0.001ms)

## Security Considerations
- Error codes must not leak internal system information
- Codes for auth errors must not distinguish user existence
- Ensure codes don't reveal implementation details through naming

## Related Rules
- Define Error Code Format Consistently
- Create One Code Per Distinct Error Scenario
- Group Codes by Domain and Subdomain
- Document Each Error Code with Trigger and Recovery
- Map Exceptions to Error Codes in Handler
- Include Error Code in All Responses

## Related Skills
- Error Code Namespace Design — code format and organization
- Error Type Taxonomy — categorizing error types
- Exception-to-Code Mapping — connecting exceptions to codes
- Standardized Error Envelope — including codes in responses

## Success Criteria
- Every distinct error has a unique machine-readable code
- Error codes are organized by domain and documented
- Clients can programmatically handle errors by code
- No error codes leak internal system details
- Exception-to-code mapping is complete and tested