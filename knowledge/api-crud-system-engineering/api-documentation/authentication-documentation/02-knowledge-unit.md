# Authentication Documentation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Authentication Documentation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Authentication documentation describes how API consumers authenticate requests, obtain credentials, and handle authentication errors. This covers authentication schemes (Bearer tokens, API keys, OAuth2 flows), token acquisition endpoints, credential management (rotation, revocation), and security requirements per endpoint.

In OpenAPI, authentication is documented under `components/securitySchemes` and applied globally or per-operation via `security`. Well-documented authentication reduces integration friction by providing clear, copy-pasteable steps for obtaining and using credentials. In Laravel APIs, authentication typically involves Sanctum tokens, Passport OAuth2 tokens, or API keys, each with different documentation requirements.

---

## Core Concepts

### Security Scheme Types
OpenAPI supports several security scheme types:

- **http** — HTTP authentication (Bearer, Basic, Digest)
- **apiKey** — API key in header, query, or cookie
- **oauth2** — OAuth2 flows (authorizationCode, implicit, clientCredentials, password)
- **openIdConnect** — OpenID Connect discovery URL

### Token-Based Authentication (Bearer)
The most common pattern for Laravel APIs:

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT  # or UUID for Sanctum
```

### API Key Authentication
For server-to-server integrations:

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

### OAuth2 Authentication
For third-party integrations requiring delegated access:

```yaml
components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://api.example.com/oauth/authorize
          tokenUrl: https://api.example.com/oauth/token
          scopes:
            read: Read resources
            write: Write resources
```

### Per-Operation Security
Different endpoints may require different authentication:

```yaml
paths:
  /users:
    get:
      security:
        - BearerAuth: []
  /health:
    get:
      security: []  # Public endpoint
```

---

## Mental Models

### Authentication as a Prerequisite
Authentication documentation answers "How do I prove who I am?" before the consumer tries any endpoint. Document steps in order: get credentials → use credentials → refresh credentials → handle auth failures.

### Credential Lifecycle Documentation
Document the full lifecycle: how to obtain credentials (register app, generate token), how to use them (Authorization header), how to manage them (rotate, revoke), and what happens when they expire.

### Security vs Endpoint Scope
Document which endpoints require authentication and which are public. Use OpenAPI's `security` field at the global or operation level. Clearly mark public endpoints.

---

## Internal Mechanics

### Sanctum Token Authentication
Sanctum generates plain UUID tokens stored in `personal_access_tokens` table:

```yaml
components:
  securitySchemes:
    Sanctum:
      type: http
      scheme: bearer
      description: Sanctum personal access token
```

Token acquisition:
```
POST /api/login
{ "email": "...", "password": "...", "device_name": "..." }
→ { "token": "1|abc123..." }
```

### Passport OAuth2
Passport implements full OAuth2 server:

```yaml
components:
  securitySchemes:
    Passport:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: /oauth/token
          scopes:
            create: Create resources
            read: Read resources
```

### API Key via Custom Middleware
API keys in headers or query parameters:

```
GET /api/users?api_key=abc123
// or
GET /api/users
X-API-Key: abc123
```

---

## Patterns

### Global Security + Per-Operation Override
Set global security for the whole API, override to `[]` for public endpoints:

```yaml
security:
  - BearerAuth: []
paths:
  /health:
    get:
      security: []
```

### Token Acquisition Endpoint Documentation
Document the login/token endpoint with full request and response schemas:

```yaml
/ping:
  get:
    security: []
    summary: Health check
    responses:
      '200':
        description: API is running

/auth/login:
  post:
    security: []
    summary: Obtain authentication token
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email: { type: string, format: email }
              password: { type: string, format: password }
              device_name: { type: string }
    responses:
      '200':
        description: Authentication successful
        content:
          application/json:
            schema:
              type: object
              properties:
                token: { type: string }
                user: { $ref: '#/components/schemas/User' }
```

### Scopes and Abilities Documentation
Document available token abilities/scopes:

```yaml
components:
  securitySchemes:
    Sanctum:
      type: http
      scheme: bearer
      description: |
        Sanctum personal access token with abilities.
        Available abilities: `user:read`, `user:write`, `post:read`, `post:write`, `*` (full access)
```

### Multiple Auth Methods
When both tokens and API keys are supported, document both:

```yaml
security:
  - BearerAuth: []
  - ApiKeyAuth: []
```

---

## Architectural Decisions

### Single vs Multiple Auth Schemes
Single auth scheme (Bearer token only) is simpler for consumers. Multiple auth schemes (Bearer + API key + OAuth2) serve different use cases but increase documentation complexity. Decision: Start with one scheme; add alternatives only when needed.

### Global vs Per-Endpoint Auth
Most endpoints require authentication, with a few public exceptions. Use global security with per-operation overrides. This minimizes repetition and makes public endpoints stand out.

### Token Format Documentation
Document whether tokens are JWTs (containing encoded claims) or opaque UUIDs (requiring lookup). JWT consumers can decode tokens client-side; opaque token consumers cannot.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear auth docs reduce support tickets | Auth documentation changes with security updates | Version auth docs with API versions |
| Scopes/abilities enable fine-grained access | More auth schemes to document | Use single scheme when possible |
| OAuth2 provides industry-standard flows | Complex to document and implement | Sanctum is simpler for first-party clients |
| Multiple auth options for different clients | Documentation must cover all options | Prioritize primary auth scheme in docs |

---

## Performance Considerations

### N/A
Authentication documentation has no runtime impact.

---

## Production Considerations

### Token Expiration Documentation
Clearly document token lifetimes:
- How long are tokens valid?
- When do they expire?
- How to refresh tokens?
- What happens after expiration?

### Credential Rotation Policy
Document how consumers rotate credentials. Include:
- How to generate new tokens
- How to revoke compromised tokens
- Grace period for token rotation

### Rate Limiting on Auth Endpoints
Document rate limits on login/token endpoints. These are typically lower than API rate limits to prevent brute force attacks.

---

## Common Mistakes

### Not Documenting Public Endpoints
Why it happens: Authentication is additive; developers set global auth and forget exceptions. Why it's harmful: Consumers don't know which endpoints they can call without auth. Better approach: Explicitly document `security: []` for every public endpoint.

### Missing Token Acquisition Example
Why it happens: The login endpoint is documented in the code but omitted from generated docs. Why it's harmful: Consumers don't know how to get a token. Better approach: Always document the auth flow step-by-step.

### Vague Scope/Ability Documentation
Why it happens: Scopes are listed but not described. Why it's harmful: Consumers create tokens with too many or too few abilities. Better approach: Document what each scope allows.

### Inconsistent Auth Requirement Within Resource
Why it happens: Most `/users` endpoints require auth but one does not. Why it's harmful: Consumers assume all endpoints in the group have the same auth requirement. Better approach: Check and document auth per-operation.

---

## Failure Modes

### Missing Auth Documentation for New Scheme
A new authentication method is deployed but not documented. Failure mode: Consumers cannot discover the new auth method. Mitigation: Add auth scheme documentation validation to CI.

### Wrong Security Requirement Annotation
An endpoint is documented as public but actually requires authentication. Failure mode: Consumers send unauthenticated requests and get 401 errors. Mitigation: Validate documented security against actual middleware in contract tests.

### OAuth2 Flow Documentation Error
The documented authorization URL is wrong. Failure mode: Consumer's OAuth flow fails at the redirect step. Mitigation: Test OAuth flow URLs documented in spec against actual server behavior.

---

## Ecosystem Usage

### GitHub API Auth
GitHub documents three authentication methods: Basic Auth (username + password or token), OAuth2 tokens, and GitHub App installations. Each method has clear documentation with token acquisition steps and scope descriptions.

### Stripe API Auth
Stripe uses API keys passed via `Authorization: Bearer sk_live_...`. The documentation clearly shows where to find API keys in the dashboard, how to rotate them, and the difference between publishable and secret keys.

### Twitter API Auth
Twitter documents OAuth 1.0a (user context) and OAuth 2.0 (app-only) flows. Each flow has step-by-step acquisition instructions, scope tables, and example requests.

---

## Related Knowledge Units

### Prerequisites
- Laravel Sanctum Token Auth — Token generation and validation
- HTTP Authentication Headers — Authorization header format

### Related Topics
- Endpoint Documentation Content — Where authentication documentation fits per endpoint
- Token Ability Design — Scope and ability system design
- API Security Headers — Additional security header documentation

### Advanced Follow-up Topics
- OAuth2 Flow Documentation — Detailed OAuth2 flow documentation patterns
- Multi-Tenant Authentication Documentation — Auth documentation for tenant-isolated APIs
- Token Revocation Documentation — Documenting the credential revocation process

---

## Research Notes

### Source Analysis
- OpenAPI 3.1 Security Scheme Object: https://spec.openapis.org/oas/v3.1.0#security-scheme-object
- Laravel Sanctum Documentation: https://laravel.com/docs/sanctum — Token-based auth for APIs and SPAs

### Key Insight
Authentication documentation is the first thing a new consumer reads. If it is unclear, incomplete, or wrong, the consumer's entire integration experience is negative. Invest disproportionately in auth documentation quality.

### Version-Specific Notes
- Sanctum v3.x (Laravel 11): Token abilities via `tokenCan()`, token expiration via `expires_at`
- Sanctum v2.x (Laravel 9-10): Abilities via `abilities` method, no native expiration
- Laravel 11: `php artisan install:api` sets up Sanctum and API routing
