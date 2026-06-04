# Skill: Design Not Found Error Responses

## Purpose
Return consistent 404 error responses for missing resources — distinguishing resource type via error codes, providing context without exposing existence of related resources.

## When To Use
- Resources that can be requested by ID or slug
- Nested resources where parent may not exist
- When distinguishing "not found" by resource type helps debugging

## When NOT To Use
- For resources that are intentionally hidden (use 403/404 ambiguity)
- When all 404s should be identical for security (hidden resources)
- For endpoints that never reference specific resources

## Prerequisites
- Error code taxonomy
- Exception handler configuration

## Inputs
- Resource type list
- 404 scenarios per resource

## Workflow
1. Map `ModelNotFoundException` in exception handler with resource-type-aware error code
2. Return 404 with error code identifying resource type — `RESOURCE.NOT_FOUND`, `USER.NOT_FOUND`, `ORDER.NOT_FOUND`
3. Never include the lookup value (ID, slug) in the error detail for hidden resources
4. Use generic message — "Resource not found." — without specifying what was looked up when hiding
5. For public resources, include resource type in detail — "Order not found."
6. Log 404 occurrences with lookup value and route for debugging
7. Test 404 responses per resource type

## Validation Checklist
- [ ] 404 returned for missing resources, never other status
- [ ] Resource type included in error code
- [ ] No stack traces in 404 responses
- [ ] Hidden resources don't expose lookup value
- [ ] 404 responses logged with lookup context
- [ ] 404 tested per resource type

## Common Failures
- Returning 500 instead of 404 when model not found
- Generic error code across all resource types
- Including lookup value in response — information disclosure for IDs
- No error code — client can't distinguish "user not found" from "order not found"

## Decision Points
- Public vs hidden resource — public provides type, hidden uses generic 404
- Include vs exclude lookup value — include for authenticated, exclude for public
- Resource type in code vs message — code for machine, message for human

## Performance Considerations
- 404 response generation is not performance-sensitive
- Route model binding adds minimal overhead

## Security Considerations
- For hidden resources, never distinguish "exists but not accessible" from "doesn't exist"
- Never expose resource IDs or slugs in 404 detail for hidden resources
- Ensure 404 for hidden resources is identical regardless of whether resource exists

## Related Rules
- Return 404 for Missing Resources
- Include Resource Type in Error Code
- Never Include Lookup Value for Hidden Resources
- Use Generic Message for Hidden Resources
- Log 404 Occurrences for Debugging

## Related Skills
- Authentication Error Responses — 401 for auth vs 404 for hidden
- Authorization Error Responses — 403 for known but denied
- Standardized Error Envelope — envelope for 404 responses

## Success Criteria
- All missing resources return 404 with identifiable resource type
- Hidden resources return identical 404 regardless of existence
- No sensitive data exposed in 404 responses
- 404 occurrences are logged for debugging
- Each resource type has distinct error code