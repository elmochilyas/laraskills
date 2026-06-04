# Skill: Design Conflict Error Responses

## Purpose
Return consistent 409 error responses for resource conflicts — duplicate entries, stale data (optimistic locking), state transition violations — with descriptive detail identifying the specific conflict source.

## When To Use
- Resources with unique constraint violations (duplicate email, slug)
- Optimistic locking conflicts (stale version, outdated timestamp)
- State transition violations (cannot cancel already-shipped order)
- Concurrent update conflicts

## When NOT To Use
- Validation errors (use 422 instead)
- Authorization failures (use 403 instead)
- Resource not found (use 404 instead)
- Rate limiting (use 429 instead)

## Prerequisites
- Error code taxonomy
- Standard error envelope

## Inputs
- Conflict scenarios per resource
- Optimistic locking configuration

## Workflow
1. Map conflict exceptions in exception handler — `UniqueConstraintViolationException`, custom domain exceptions
2. Return 409 with error code identifying the conflict type — duplicate, stale, or state violation
3. Include the conflicting field or resource identifier in the detail
4. For optimistic locking conflicts, include the expected and actual version values
5. Use distinct error codes per conflict type — `RESOURCE.DUPLICATE_ENTRY`, `RESOURCE.STALE_VERSION`
6. Log conflicts with full context for debugging
7. Test each conflict scenario returns correct 409 with identifiable error code

## Validation Checklist
- [ ] 409 returned for conflict errors, not 422 or 500
- [ ] Domain-specific error codes per conflict type
- [ ] Conflicting field or resource identified in detail
- [ ] Optimistic locking includes version values
- [ ] No stack traces in 409 responses
- [ ] Conflict scenarios tested per resource

## Common Failures
- Returning 422 for conflicts — validation errors are different from conflicts
- Generic conflict message — doesn't identify the source of conflict
- No detail for optimistic locking — client cannot retry with correct data
- Not logging conflicts — cannot diagnose concurrent access patterns

## Decision Points
- Conflict vs validation — conflict for state-based, validation for input-based errors
- Duplicate vs stale vs state violation — each gets distinct error code
- Include resolved data in response — include for retry-able, exclude for security

## Performance Considerations
- Conflict response generation is not performance-sensitive
- Optimistic locking check adds minimal overhead (~0.01ms)

## Security Considerations
- Don't reveal whether the conflicting resource belongs to another user
- Include only the conflicting field name, not the conflicting value
- Log conflicts with full context for debugging concurrent access issues

## Related Rules
- Return 409 for Conflict Errors
- Use Domain-Specific Conflict Error Codes
- Include Conflicting Field in Error Detail
- Log Conflicts with Full Context
- Test Each Conflict Scenario

## Related Skills
- Validation Error Shape Design — 422 vs 409 distinction
- Standardized Error Envelope — the envelope for conflict responses
- Domain-Specific Error Codes — conflict code taxonomy

## Success Criteria
- All conflict scenarios return 409 with identifiable error code
- Conflicting field is identified in error detail
- Optimistic locking includes version values for retry
- No sensitive data leaked in conflict responses
- Conflict scenarios are tested per resource