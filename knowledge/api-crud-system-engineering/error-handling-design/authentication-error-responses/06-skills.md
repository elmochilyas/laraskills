# Skill: Design Authentication Error Responses

## Purpose
Return consistent 401 error responses with standard envelope, `WWW-Authenticate` header, guard-aware error codes, and generic messages that never reveal user existence.

## When To Use
- Any API that requires authentication (Sanctum, Passport, custom guards)
- When building mobile apps that need to distinguish expired vs invalid tokens
- For third-party APIs where clients need programmatic auth error handling

## When NOT To Use
- Public APIs with no authentication requirements
- Internal services behind service mesh handling auth at gateway
- Single monolithic app with session-based auth and no API consumers

## Prerequisites
- Authentication guard configuration
- Error envelope specification

## Inputs
- Auth guard configurations
- Error code taxonomy entries

## Workflow
1. Register explicit `renderable` callback for `AuthenticationException` in exception handler
2. Always include `WWW-Authenticate: Bearer realm="api"` header in 401 responses
3. Use guard-aware error codes — distinguish expired vs invalid vs missing tokens
4. Use generic messages for all auth failures — never differentiate "user not found" from "wrong password"
5. Never expose stack traces or exception internals in 401 responses
6. Guard `renderable` with `$request->expectsJson()` — return null for web requests
7. Apply per-IP rate limiting on authentication endpoints
8. Log auth failures with IP, user agent, guard — never log credential values

## Validation Checklist
- [ ] All 401 responses include `WWW-Authenticate` header
- [ ] Guard-aware error codes used (expired vs invalid vs unauth)
- [ ] Auth error messages generic — no user existence hints
- [ ] No stack traces or file paths in 401 responses
- [ ] All auth guards have handler mappings
- [ ] Auth failure rate limiting per IP
- [ ] Auth failures logged with context excluding credentials

## Common Failures
- Returning 403 for missing auth — 403 means authenticated but not permitted
- Missing WWW-Authenticate header — breaks HTTP standards
- Leaking user existence — "User not found" vs "Wrong password"
- Same error code for all failures — client cannot implement refresh logic

## Decision Points
- Expired vs invalid token codes — expired for refreshable, invalid for re-login
- Guard-specific vs generic codes — guard-specific for multi-guard apps, generic for single guard
- Per-IP vs per-user rate limiting — per-IP for unauthenticated, per-user for authenticated

## Performance Considerations
- Auth failure path is not performance-sensitive — negligible impact
- Token parsing already happened before exception — no additional cost

## Security Considerations
- Never reveal whether email/username exists in auth error messages
- Never log credentials or tokens in plaintext
- Do not differentiate "user not found" from "wrong password"
- WWW-Authenticate header must not leak configuration details

## Related Rules
- Always Include WWW-Authenticate Header on 401
- Return 401 for Missing Credentials, Never 403
- Use Guard-Aware Error Codes for Auth Failures
- Never Reveal User Existence in Auth Error Messages
- Never Expose Stack Traces in 401 Responses
- Distinguish Expired vs Invalid Token Error Codes

## Related Skills
- Authorization Error Responses — 401 vs 403 distinction
- Standardized Error Envelope — the envelope used in auth responses
- Exception-to-Code Mapping — mapping AuthenticationException

## Success Criteria
- All 401 responses include WWW-Authenticate header
- Expired vs invalid tokens produce different error codes
- Auth messages are generic — no enumeration vulnerability
- Stack traces never appear in auth responses
- Rate limiting prevents brute force on auth endpoints