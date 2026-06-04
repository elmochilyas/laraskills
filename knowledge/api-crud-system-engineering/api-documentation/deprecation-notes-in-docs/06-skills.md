# Skill: Document Deprecation Notes

## Purpose
Mark deprecated endpoints, parameters, and response fields in OpenAPI specs using the `deprecated: true` flag with structured notices including replacement, deprecation version, and removal date.

## When To Use
- Endpoints being phased out in favor of newer alternatives
- Response fields being replaced
- API versions entering deprecation lifecycle
- Parameters no longer recommended

## When NOT To Use
- Features that still work as designed and are not being removed
- Internally deprecated implementation details not exposed to consumers
- Features removed immediately without deprecation period (emergency security removals)

## Prerequisites
- API versioning strategy
- Changelog generation process
- Understanding of HTTP Deprecation and Sunset headers

## Inputs
- List of deprecated endpoints/fields/parameters
- Replacement endpoint/field details
- Deprecation version and removal date
- Migration guide content

## Workflow
1. Set `deprecated: true` flag on every deprecated operation or schema property in OpenAPI spec
2. Write structured deprecation notice in `description` field with four elements: what is deprecated, what replaces it, deprecation version, removal date
3. Add `Deprecation: true`, `Sunset: <RFC 1123 date>`, and `Link: <url>; rel="deprecation"` HTTP headers to deprecated endpoint responses
4. Log every request to deprecated endpoints with consumer identification
5. Proactively notify affected consumers before the removal date
6. Never remove a deprecated endpoint before the stated sunset date — honor the published timeline
7. At sunset date, return 410 Gone instead of removing without notice

## Validation Checklist
- [ ] `deprecated: true` flag set on deprecated operations and schema properties
- [ ] Structured notice in description: what, replacement, version, removal date
- [ ] Deprecation and Sunset headers in API responses from deprecated endpoints
- [ ] Migration link header present
- [ ] Deprecated endpoint usage logged with consumer identification
- [ ] Consumer notification process active before removal date
- [ ] Endpoint returns 410 Gone on sunset date (not removed silently)

## Common Failures
- No replacement indicated — consumers have no migration path
- Vague timeline — consumers cannot plan migrations
- No migration instructions — consumers must reverse-engineer migration path
- Forgetting to remove after sunset — endpoint works past removal date
- Premature removal — endpoint removed before sunset date, breaking consumer schedules

## Decision Points
- Deprecation level: soft (no removal date) vs hard (removal date set) vs sunset (removed)
- Header placement: middleware vs controller-level vs service-level
- Consumer notification method: email vs dashboard alert vs contact form

## Performance Considerations
- Deprecation headers add minimal overhead to response size
- Logging deprecated requests adds storage cost for deprecated endpoint analytics
- No significant runtime performance impact

## Security Considerations
- Deprecated endpoints may have known security issues — document replacement clearly
- Sunset old auth mechanisms with migration path documented
- Review deprecated endpoint access logs for unauthorized usage patterns

## Related Rules
- Always Set The OpenAPI `deprecated: true` Flag
- Include Structured Deprecation Notice In Description
- Send Deprecation And Sunset Headers In Responses
- Log Deprecated Endpoint Usage And Notify Consumers
- Never Remove A Deprecated Endpoint Before The Stated Sunset Date

## Related Skills
- Generate API Changelogs
- Document API Versions
- Implement Deprecation Headers

## Success Criteria
- All deprecated endpoints have `deprecated: true` flag in OpenAPI spec
- Consumers see replacement endpoint, version, and removal date in docs
- Deprecation/Sunset/headers returned from deprecated endpoints at runtime
- Deprecated usage is logged and consumers are notified before removal
- Removal date is honored — no premature removal
- After sunset, 410 Gone is returned
