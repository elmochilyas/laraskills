# ECC Standardized Knowledge — Authentication Documentation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Authentication Documentation |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Authentication documentation describes how consumers authenticate requests, obtain credentials, and handle auth errors. In OpenAPI, this is defined under `components/securitySchemes` and applied globally or per-operation. Clear auth documentation reduces integration friction — it is the first thing a new consumer reads and determines the entire integration experience.

## Core Concepts

- **Security scheme types**: `http` (Bearer, Basic), `apiKey` (header/query/cookie), `oauth2` (flows), `openIdConnect`.
- **Token auth (Bearer)**: Most common for Sanctum. Define as `type: http, scheme: bearer`.
- **API key auth**: `type: apiKey, in: header, name: X-API-Key`.
- **OAuth2 auth**: `type: oauth2` with flows (authorizationCode, clientCredentials, password).
- **Per-operation security**: Global + override per endpoint for public routes. `security: []` for public.
- **Scopes/abilities documentation**: List available token abilities with descriptions.

## When To Use

- Every API that requires authentication
- APIs with public endpoints (document which are public)
- APIs supporting multiple auth methods (Bearer + API key)
- APIs with token scopes/abilities that consumers must choose

## When NOT To Use

- Fully public APIs with no authentication
- Internal APIs documented only for internal team
- APIs where auth is handled entirely by API Gateway (document gateway auth separately)

## Best Practices

- **Global security with per-operation override**: Set global `security: [BearerAuth: []]`, override to empty array for public endpoints.
- **Token acquisition endpoint documented**: Include login endpoint with full request/response schemas.
- **Scopes and abilities documented**: List every ability with description of what it grants.
- **Token lifetime and rotation documented**: How long tokens live, how to refresh, what happens on expiration.
- **Rate limits on auth endpoints documented**: Login endpoints typically have lower limits.
- **OAuth2 flows with PKCE**: Document the exact authorization URL, token URL, redirect URIs, and scopes.

## Architecture Guidelines

- Define security schemes in `components/securitySchemes` and reference globally.
- For Sanctum: use `type: http, scheme: bearer` with description of ability system.
- For Passport: use `type: oauth2` with the relevant flow configuration.
- For API keys: use `type: apiKey, in: header, name: X-API-Key`.
- Document the credential lifecycle: obtain → use → manage → revoke.

## Performance Considerations

- Authentication documentation has no runtime impact.
- Spec size increases proportionally with security scheme complexity.

## Security Considerations

- Do not document actual tokens or secrets in examples. Use placeholders.
- OAuth2 documentation must use the correct production URLs for authorization endpoints.
- Token format documentation: clarify whether tokens are JWTs (decodeable) or opaque (need lookup).
- Document rate limiting on auth endpoints to prevent brute force.

## Common Mistakes

- **Not documenting public endpoints**: Consumers don't know which endpoints work without auth.
- **Missing token acquisition example**: Consumers don't know how to get a token.
- **Vague scope/ability documentation**: Consumers create tokens with wrong permissions.
- **Inconsistent auth within a resource**: Some endpoints require auth, others don't — not documented.
- **Wrong security annotation**: Endpoint documented as public but actually requires auth.

## Anti-Patterns

- **Multiple auth methods documented without guidance**: Consumers confused about which to use. Provide recommendation.
- **No public endpoint documentation**: Consumers treat all endpoints as authenticated, causing unnecessary support requests.

## Examples

- Sanctum: `components/securitySchemes: Sanctum: { type: http, scheme: bearer, description: "Sanctum token with abilities: user:read, user:write" }`.
- Global: `security: [Sanctum: []]`. Public endpoint: `/health: get: security: []`.

## Related Topics

- **Prerequisites**: Sanctum Token Auth, HTTP Auth Headers
- **Closely Related**: Endpoint Documentation Content, Token Ability Design, API Security Headers
- **Advanced**: OAuth2 flow documentation, multi-tenant auth documentation

## AI Agent Notes

When generating auth documentation: define security schemes in components, use global security with per-endpoint overrides for public routes, document token acquisition endpoint, list all abilities with descriptions, include token lifetime info.

## Verification

Sources: OpenAPI 3.1 Security Scheme Object spec, Stripe API auth docs, GitHub API auth docs, domain-analysis.md.
