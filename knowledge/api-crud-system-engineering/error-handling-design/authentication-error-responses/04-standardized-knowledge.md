# Authentication Error Responses

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-authentication-error-responses |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

All authentication failures — missing, expired, malformed, or invalid credentials — return a consistent 401 response shape with the standard error envelope plus a `WWW-Authenticate` header describing the expected auth scheme. This allows clients to programmatically determine the auth method and re-authenticate.

## Core Concepts

- **HTTP 401 Unauthorized**: Status for all authentication failures (missing or invalid credentials).
- **WWW-Authenticate Header**: Required in 401 responses; informs the client which auth scheme is accepted.
- **Distinct Error Codes**: `USER.AUTH_UNAUTHENTICATED` (generic), `USER.AUTH_TOKEN_EXPIRED` (specific), `USER.AUTH_TOKEN_INVALID` (malformed).
- **No Detail Leak**: Never reveal why authentication failed in a way that aids attackers.
- **Guard-Aware Mapping**: Different guard configurations map to specific error codes.

## When To Use

- For any API that requires authentication (Sanctum, Passport, custom guards)
- When building mobile apps that need to distinguish expired vs invalid tokens for refresh logic
- For third-party APIs where clients need programmatic auth error handling
- When implementing SPA cookie authentication or token-based auth

## When NOT To Use

- For public APIs with no authentication requirements
- For internal services behind a service mesh that handles authentication at the gateway
- When using a single monolithic app with session-based auth and no API consumers

## Best Practices (WHY)

- **Always include WWW-Authenticate**: Required by HTTP spec (RFC 7235); helps automated clients.
- **Distinguish expired vs invalid tokens**: Expired → client can silently refresh; Invalid → client must redirect to login.
- **Use guard-aware codes**: Different guards (Sanctum, Passport, custom) get distinct error codes.
- **Use generic messages**: "Authentication required." — never reveal whether a user exists or not.
- **Log auth failures with IP and user agent**: Monitor for credential stuffing and bot attacks.
- **Rate-limit auth failures per IP**: Prevent brute force and credential stuffing.
- **Never log the credential value itself**.

## Architecture Guidelines

- Map `AuthenticationException` in the handler with guard-aware code selection.
- Include `WWW-Authenticate: Bearer realm="api"` header in all 401 responses.
- Generate distinct codes: generic (unauth), expired token, invalid token.
- Support multiple auth methods by listing all schemes in `WWW-Authenticate`.
- Ensure 401 is never confused with 403 (403 = authenticated but denied).

## Performance Considerations

- Negligible — auth failure path is not performance-sensitive.
- Token parsing overhead is not part of error response generation (it already happened before the exception).

## Security Considerations

- Never reveal whether an email/username exists in auth error messages.
- Never log credentials or tokens in plaintext.
- Do not differentiate "user not found" from "wrong password" — use identical generic messages.
- Include rate limiting on auth endpoints to prevent enumeration.
- Ensure WWW-Authenticate header does not leak configuration details.
- Log auth failures with full context but exclude credential values.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Returning 403 for missing auth | 403 means authenticated but not allowed | Confusing auth with authorization | Client thinks they're authenticated | Use 401 for missing/invalid credentials |
| Missing WWW-Authenticate header | No auth scheme communicated | Not required by default Laravel | Breaks HTTP standards compliance | Always include WWW-Authenticate |
| Leaking user existence | "User not found" vs "Invalid password" | Overly helpful error messages | User enumeration vulnerability | Use identical message for all auth failures |
| Stack traces in 401 responses | Exception details exposed | No handler customization | Information disclosure | Always return safe envelope for 401 |
| Generic code for all failures | Single code for expired, invalid, missing | No error code design | Client cannot implement refresh logic | Use distinct codes per failure type |

## Anti-Patterns

- **Returning 200 with `authenticated: false`**: Breaks HTTP semantics; defeats caching and automated handling.
- **Returning 401 with HTML body**: API routes must always return JSON, even for auth errors.
- **Same code for all guards**: Web auth and API auth errors should be distinguishable.
- **Exposing token validation details in error messages**: "Token signature invalid" reveals algorithm.

## Examples

```php
public function renderAuthenticationError(AuthenticationException $e, Request $request): JsonResponse
{
    $code = $e->guards() === ['sanctum']
        ? ErrorCodes::USER_AUTH_TOKEN_EXPIRED
        : ErrorCodes::USER_AUTH_UNAUTHENTICATED;

    return response()->json(
        new ErrorEnvelope($code, 'Authentication required.', 401),
        401,
        ['WWW-Authenticate' => 'Bearer realm="api"']
    );
}
```

## Related Topics

- Authorization Error Responses (401 vs 403 distinction)
- Standardized Error Envelope (the envelope used in auth error responses)
- Exception-to-Code Mapping (mapping AuthenticationException)
- Sanctum Token Authentication
- API Rate Limiting by Authentication Tier

## AI Agent Notes

- Always include `WWW-Authenticate` header in 401 responses.
- Use guard-specific error codes to distinguish expired from invalid tokens.
- Never generate code that reveals whether a specific user exists in auth responses.
- When adding a new auth guard, add its error code mapping to the handler.
- Ensure 401 responses never contain stack traces or exception internals.

## Verification

- [ ] All 401 responses include `WWW-Authenticate` header
- [ ] Guard-aware error codes are used (expired vs invalid vs unauth)
- [ ] Auth error messages are generic — no user existence hints
- [ ] No stack traces or file paths appear in 401 responses
- [ ] All auth guards have corresponding error handler mappings
- [ ] Auth failure rate limiting is configured per IP
- [ ] Integration tests verify 401 response shape for all auth scenarios
