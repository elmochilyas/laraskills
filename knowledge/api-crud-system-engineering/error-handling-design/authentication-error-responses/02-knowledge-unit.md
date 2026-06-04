# Authentication Error Responses

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
All authentication failures — missing, expired, malformed, or invalid credentials — return a consistent 401 response shape with the standard error envelope plus a `WWW-Authenticate` header describing the expected auth scheme. This allows clients to programmatically determine the auth method and re-authenticate.

## Core Concepts
- **HTTP 401 Unauthorized**: Status for all authentication failures.
- **WWW-Authenticate Header**: Required in 401 responses; informs the client which auth scheme is accepted (Bearer, Basic, Digest).
- **Error Codes**: `USER.AUTH_UNAUTHENTICATED` (generic), `USER.AUTH_TOKEN_EXPIRED` (specific), `USER.AUTH_TOKEN_INVALID` (malformed).
- **No Detail Leak**: Never reveal why authentication failed in a way that aids attackers ("user exists but wrong password").

## Mental Models
401 is the bouncer at the door saying "I don't know who you are." WWW-Authenticate is the bouncer pointing to the sign that says "Show your ID." The error code tells your agent (client) what kind of ID to show.

## Internal Mechanics
1. Request arrives without/invalid credentials.
2. Laravel `AuthenticationException` is thrown.
3. Handler catches it, resolves the guard context and error code.
4. Response is built with the envelope and `WWW-Authenticate` header.

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

## Patterns
- **Guard-Aware Codes**: Map different guard configurations to specific error codes.
- **Token-Expired vs Invalid**: Distinguish expired tokens (client can refresh) from invalid tokens (client must re-login).
- **Multi-Auth Scheme Headers**: If multiple auth methods are supported, list all in `WWW-Authenticate`.
- **No Password Hint**: Error message is always generic: "Authentication required." or "Invalid or expired token."

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| WWW-Authenticate | Always included | Required by HTTP spec; helps automated clients |
| Distinct codes | Expired vs invalid vs missing | Enables client branching (refresh vs re-login) |
| Message | Generic, no hint | Security: don't leak whether user exists |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Single code | One code for all auth failures | Multiple distinguished codes | Multiple — enables client refresh logic |
| Header content | Only scheme | Scheme + realm + error | Scheme + realm only — error in body instead |
| Message detail | "Invalid credentials" | "Bad token" | "Authentication required" — most generic |

## Performance Considerations
- Negligible — auth failure path is not performance-sensitive.
- Token parsing overhead is not part of error response generation (it already happened).

## Production Considerations
- Log all authentication failures with IP, user agent, and guard name.
- Rate-limit auth failures per IP (prevent credential stuffing).
- Never log the credential value itself.
- Monitor for auth failure spikes (bot attack indicator).

## Common Mistakes
- Returning 403 instead of 401 for missing authentication (403 means "identified but not allowed").
- Omitting `WWW-Authenticate` header — breaks HTTP standards compliance.
- Leaking whether email exists ("User not found" vs "Invalid password").
- Including stack traces or exception messages in 401 responses.

## Failure Modes
- **Token Reflection**: Client cannot distinguish expired vs invalid token. Mitigation: use distinct error codes.
- **Missing Guard Handler**: A new guard added without updating auth error handling. Mitigation: CI checks that all guards have handler mappings.
- **Credential Leak in Logs**: Auth credentials accidentally logged. Mitigation: middleware sanitises log context for auth endpoints.

## Ecosystem Usage
- **Laravel Sanctum**: `AuthenticationException` for expired/invalid tokens.
- **Laravel Passport**: OAuth exceptions with `WWW-Authenticate: Bearer`.
- **Stripe**: 401 with `error.type: authentication_error`.
- **OpenAPI**: `401` response documented with `WWW-Authenticate` header schema.

## Related Knowledge Units
### Prerequisites
- KU-02 Standardized Error Envelope
- KU-05 Exception-to-Code Mapping

### Related Topics
- KU-08 Authorization Error Responses (401 vs 403 distinction)
- Laravel Sanctum / Passport configuration

### Advanced Follow-up Topics
- Multi-factor auth error states (requires additional verification).

## Research Notes
### Source Analysis
HTTP 401 semantics per RFC 7235 require `WWW-Authenticate`. Laravel's default handler strips it; this KU ensures it is always present. Pattern follows Stripe and GitHub API auth error conventions.

### Key Insight
Distinguishing expired vs invalid tokens is the single most valuable distinction for mobile clients. A client that receives "token expired" can silently refresh; a client that receives "token invalid" must redirect to login.

### Version-Specific Notes
- Laravel 10+ `AuthenticationException` carries the guard name — use it for per-guard error codes.
- Sanctum 3.x returns distinct exceptions for expired vs invalid tokens.
