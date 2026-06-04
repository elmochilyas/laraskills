# Skill: Map Exceptions to Error Codes

## Purpose
Create a centralized mapping from every exception class to its corresponding error code in the global exception handler, enabling consistent error code resolution across the entire application.

## When To Use
- When implementing standardized error responses
- When every exception must produce a consistent error code
- As part of error handling system setup

## When NOT To Use
- When all exceptions use a single generic error code
- For trivial applications where HTTP status suffices

## Prerequisites
- Error code taxonomy defined
- Exception handler configuration

## Inputs
- Exception class list
- Error code taxonomy entries

## Workflow
1. Register `renderable` callbacks in `App\Exceptions\Handler::register()` for each exception type
2. Map framework exceptions first — `AuthenticationException`, `AuthorizationException`, `ModelNotFoundException`, `ValidationException`, `ThrottleRequestsException`
3. Map custom domain exceptions — each domain exception maps to its error code
4. Use ordered callbacks — most specific exceptions first, generic fallback last
5. Return consistent error envelope from every callback
6. Include error code, HTTP status, and contextual detail
7. Test each mapping end-to-end — trigger exception, verify error code in response
8. Maintain mapping registry — document which exception maps to which code

## Validation Checklist
- [ ] Framework exceptions mapped to error codes
- [ ] Custom domain exceptions mapped
- [ ] Callbacks ordered most-specific first
- [ ] Error envelope returned from every callback
- [ ] Error code included in response
- [ ] Each mapping tested end-to-end
- [ ] Mapping registry maintained

## Common Failures
- Missing mappings — exceptions fall through to generic handler
- Wrong order — generic catch-all runs before specific mapping
- Duplicate mappings — two callbacks handling same exception (last wins)
- No fallback — unhandled exceptions produce framework HTML error page
- Mapping not tested — works in dev but breaks in production

## Decision Points
- `renderable` vs `$this->render()` method — `renderable` for exception-specific, `render()` for global override
- Ordered callbacks vs match statement — callbacks for handler, match for service
- Specific mapping vs pattern matching — specific for known, pattern for similar types

## Performance Considerations
- Exception handling is not performance-sensitive path
- Callback resolution adds ~0.001ms per registration
- Match statement resolution O(1) — negligible

## Security Considerations
- Fallback mapping must never expose exception internals in production
- Ensure auth exception mapping doesn't leak user existence info
- Server error mapping must use generic 500 message in production

## Related Rules
- Register Renderable Callbacks for Each Exception Type
- Map Framework Exceptions First
- Map Custom Domain Exceptions
- Use Ordered Callbacks (Specific → Generic)
- Return Consistent Error Envelope
- Test Each Mapping End-to-End

## Related Skills
- Error Code Namespace Design — namespace for mapped codes
- Domain-Specific Error Codes — codes for domain exceptions
- Standardized Error Envelope — response format from mappings
- Error Response Testing — verifying mappings

## Success Criteria
- Every framework exception produces correct error code
- Every custom domain exception maps to its domain code
- Unhandled exceptions fall through to safe generic handler
- Mappings are tested end-to-end
- Mapping registry documents all exception-to-code relationships