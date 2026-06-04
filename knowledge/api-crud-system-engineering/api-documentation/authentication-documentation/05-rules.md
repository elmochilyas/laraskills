# Phase 5: Rules — Authentication Documentation

## Define Security Schemes In Components
---
## Category
Code Organization
---
## Rule
Define all security schemes in `components/securitySchemes` and reference them globally via the root-level `security` array.
---
## Reason
Inline security definitions scattered across operations prevent reuse, make global changes tedious, and confuse consumers who see inconsistent scheme definitions. Centralized definitions ensure a single source of truth.
---
## Bad Example
```yaml
paths:
  /users:
    get:
      security:
        - BearerAuth: []
      # BearerAuth defined only here; other operations redefine inline
```
---
## Good Example
```yaml
components:
  securitySchemes:
    Sanctum:
      type: http
      scheme: bearer
      description: Sanctum token with user:read, user:write abilities
security:
  - Sanctum: []
```
---
## Exceptions
No common exceptions. This applies to every API that requires authentication.
---
## Consequences Of Violation
Inconsistent security documentation across endpoints; consumers cannot determine the correct auth method for the whole API.
---

## Override Security To Empty Array For Public Endpoints
---
## Category
Design
---
## Rule
Set `security: []` on public endpoints to explicitly override the global security scheme.
---
## Reason
Without explicit overrides, consumers cannot distinguish authenticated from public endpoints. The global security scheme applies to all operations by default, hiding which routes are accessible without credentials.
---
## Bad Example
```yaml
# /health endpoint inherits global Sanctum auth
# Consumer assumes every endpoint needs a token
```
---
## Good Example
```yaml
paths:
  /health:
    get:
      security: []  # Explicitly public
      summary: Health check
  /users:
    get:
      summary: List users (inherits global Sanctum auth)
```
---
## Exceptions
APIs where every single endpoint requires authentication with zero public endpoints.
---
## Consequences Of Violation
Consumers authenticate for endpoints that don't require it; unnecessary friction for health checks, status pages, and public resources.
---

## Document Every Token Ability With Description
---
## Category
Documentation
---
## Rule
List all available token abilities/scopes in the security scheme description with a clear explanation of what each grants.
---
## Reason
Undocumented abilities force consumers to guess which permissions to request or create overly permissive tokens. Well-documented abilities enable least-privilege token creation.
---
## Bad Example
```yaml
Sanctum:
  type: http
  scheme: bearer
  description: Sanctum token with abilities
# No list of what abilities exist or what they allow
```
---
## Good Example
```yaml
Sanctum:
  type: http
  scheme: bearer
  description: |
    Sanctum token. Available abilities:
    - `user:read` — View user profiles
    - `user:write` — Create and update users
    - `posts:read` — View posts
    - `posts:write` — Create, update, delete posts
```
---
## Exceptions
APIs using OAuth2 where scopes are defined in the authorization server configuration and linked externally.
---
## Consequences Of Violation
Consumers create tokens with insufficient or excessive permissions; either integrations break or security is compromised.
---

## Include Token Lifecycle Documentation
---
## Category
Documentation
---
## Rule
Document token expiration duration, refresh mechanism, and what happens when a token expires for every authentication method.
---
## Reason
Without lifecycle information, consumers don't know when tokens expire, how to refresh them, or why they suddenly get 401 responses. This generates the most common category of auth-related support tickets.
---
## Bad Example
```yaml
# No token lifetime, refresh, or expiration behavior documented
```
---
## Good Example
```yaml
components:
  securitySchemes:
    Sanctum:
      type: http
      scheme: bearer
      description: |
        Tokens expire after 24 hours.
        Refresh: POST /api/auth/refresh with current token in Authorization header.
        On expiration: 401 Unauthorized — request a new token via login.
```
---
## Exceptions
Stateless JWTs with no refresh mechanism; document the JWT expiry and re-login requirement instead.
---
## Consequences Of Violation
Consumers experience unexplained 401 errors; support team handles repeated "my token stopped working" inquiries.
---

## Use Placeholder Values In Authentication Examples
---
## Category
Security
---
## Rule
Always use generic placeholder values (`<your-api-key>`, `<token>`) in authentication examples. Never include real or example tokens.
---
## Reason
Example tokens committed to documentation or specs become security liabilities. Consumers copy-paste example tokens, which may be valid credentials or get committed to source control as "example" values.
---
## Bad Example
```yaml
headers:
  Authorization: "Bearer sk_test_4eC39HqLyjWDarjtT1zdp7dc"
```
---
## Good Example
```yaml
headers:
  Authorization: "Bearer <your-api-token>"
```
---
## Exceptions
No common exceptions. Never commit real or semi-real token values.
---
## Consequences Of Violation
Exposed credentials in documentation; security audit failures; unauthorized access if tokens are real.
---

## Document Rate Limits On Auth Endpoints
---
## Category
Security
---
## Rule
Explicitly document rate limits for authentication endpoints (`/login`, `/register`, `/refresh`) in the endpoint description and error response documentation.
---
## Reason
Auth endpoints typically have stricter rate limits than the rest of the API to prevent brute-force attacks. Undocumented rate limits cause consumers to hit 429 errors without understanding why, generating support requests or triggering accidental lockouts.
---
## Bad Example
```yaml
paths:
  /auth/login:
    post:
      summary: Login
      # No mention of rate limits or throttling
```
---
## Good Example
```yaml
paths:
  /auth/login:
    post:
      summary: Login
      description: Rate limited to 5 requests per minute per IP address.
      responses:
        '429':
          $ref: '#/components/responses/TooManyRequests'
```
---
## Exceptions
APIs where auth and resource endpoints share identical rate limits; document the shared limit globally.
---
## Consequences Of Violation
Consumers build integrations that exceed rate limits; brute-force protections appear arbitrary; support volume increases.
---
