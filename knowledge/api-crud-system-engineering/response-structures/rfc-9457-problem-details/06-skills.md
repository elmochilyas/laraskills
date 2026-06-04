# Skill: Implement RFC 9457 Problem Details

## Purpose
Implement RFC 9457 Problem Details for HTTP API error responses: `type`, `title`, `status`, `detail`, `instance` fields in a standardized JSON error object for machine-readable error information.

## When To Use
- HTTP API error responses
- Standardized error format adoption
- Public APIs requiring RFC compliance

## When NOT To Use
- Simple error envelope already established
- Internal APIs with existing error format

## Prerequisites
- Error response structure
- RFC 9457 specification understanding

## Inputs
- Problem type definitions (URLs)
- Error-to-problem mapping

## Workflow
1. Define problem type URIs: `/problems/validation-error`, `/problems/not-found`
2. Include required fields: `type` (URI), `title` (short description), `status` (HTTP status)
3. Include optional fields: `detail` (specific explanation), `instance` (specific occurrence URI)
4. Set `type` to absolute URL with human-readable documentation
5. Use consistent `title` per error type — not per occurrence
6. Use `detail` for occurrence-specific information
7. Use `instance` pointing to the specific request URI
8. Extend with extension members for application-specific data (validation errors per field)
9. Return `Content-Type: application/problem+json`
10. Test problem details format for all error types

## Validation Checklist
- [ ] Problem type URIs defined per error category
- [ ] `type`, `title`, `status` required fields present
- [ ] `detail` and `instance` optional fields included
- [ ] `type` absolute URL with documentation
- [ ] Consistent `title` per error type
- [ ] `Content-Type: application/problem+json`
- [ ] Application-specific extension members
- [ ] Tested for all error types

## Related Skills
- Standardized Error Envelope
- Error Code Taxonomy
- Exception Rendering
