# ECC Anti-Patterns — Authentication Documentation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Authentication Documentation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Multiple Auth Methods Documented Without Guidance
2. Public Endpoints Not Marked as Unauthenticated
3. Token Abilities/Scopes Not Documented
4. Token Lifecycle Information Missing

---

## Repository-Wide Anti-Patterns



---

## Anti-Pattern 1: Multiple Auth Methods Documented Without Guidance

### Category
Documentation

### Description
Documenting multiple authentication methods (Bearer tokens, API keys, OAuth2) without recommending which one consumers should use, causing confusion and inconsistent integration patterns.

### Why It Happens
All security schemes are listed in components/securitySchemes, each equally documented. No preference or use case guidance is provided.

### Warning Signs
- Multiple security schemes defined without usage guidance
- Consumers use different auth methods inconsistently
- Support team frequently asked "which auth method should I use?"
- No recommendation section in auth documentation

### Why It Is Harmful
Consumers choose the wrong auth method for their use case. Some use API keys for browser-based apps (exposing secrets). Others use OAuth2 for simple mobile apps (unnecessary complexity). Inconsistent auth patterns increase support burden.

### Real-World Consequences
A mobile app developer reads the auth docs and sees both "API Key" and "Bearer Token" listed equally. They choose API keys because it looks simpler. The API key is embedded in the mobile app binary and extracted by an attacker.

### Preferred Alternative
Provide a decision guide: "SPA? Use token auth. Mobile app? Use token auth. Third-party? Use OAuth2." Document each method alongside its intended use case.

### Refactoring Strategy
1. Add use case recommendations to each security scheme description
2. Create an "Auth Quick Start" section with recommended approach
3. Document when NOT to use each auth method
4. Add decision table mapping consumer type to auth method

### Detection Checklist
- [ ] Check if auth methods include use case guidance
- [ ] Verify consumers can determine the correct auth method
- [ ] Confirm each method documents its limitations

### Related Rules
- (Auth documentation is covered by OpenAPI security scheme best practices from 04-standardized-knowledge.md)

### Related Skills
- (API documentation skills)

### Related Decision Trees
- (Auth method selection decisions)

---

## Anti-Pattern 2: Public Endpoints Not Marked as Unauthenticated

### Category
Documentation

### Description
Not overriding the global security scheme to `security: []` on public endpoints, causing consumers to believe every endpoint requires authentication.

### Why It Happens
The global security scheme is set once and applies to all operations. Developers don't realize they need to explicitly mark public endpoints.

### Warning Signs
- All endpoints show "Authorization: Bearer" in documentation
- Health check, status, and public endpoints require auth in examples
- No `security: []` override in any operation

### Why It Is Harmful
Consumers authenticate before calling public endpoints, wasting token requests and creating unnecessary auth errors. They may not integrate with the API at all if they assume all endpoints require auth.

### Real-World Consequences
A developer evaluates the API. The docs show every endpoint requires a Bearer token. They assume they must first implement login to test any endpoint. They choose a competitor's simpler API instead.

### Preferred Alternative
Set `security: []` on each public endpoint to explicitly override the global scheme.

### Refactoring Strategy
1. Identify all public endpoints
2. Add `security: []` to each operation
3. Add description noting "No authentication required"
4. Test that public endpoints are accessible without credentials

### Detection Checklist
- [ ] Check public endpoints for `security: []` in spec
- [ ] Verify health/status endpoints are documented as public
- [ ] Test public endpoints without auth credentials

### Related Rules
- Override Security To Empty Array For Public Endpoints (05-rules.md)

### Related Skills
- (API documentation skills)

### Related Decision Trees
- (Auth pattern decisions)

---

## Anti-Pattern 3: Token Abilities/Scopes Not Documented

### Category
Documentation

### Description
Documenting the authentication scheme without listing available token abilities or scopes, forcing consumers to guess which permissions to request.

### Why It Happens
The security scheme description is brief: "Bearer token authentication." The developer assumes consumers will "just know" which abilities exist.

### Warning Signs
- Security scheme description says only "Bearer token"
- No list of abilities like `posts:read`, `users:write`
- Consumers create tokens with `*` (all abilities) because they don't know specific ones
- Support team frequently explains ability options

### Why It Is Harmful
Consumers cannot create least-privilege tokens because they don't know which abilities exist. Most create over-privileged tokens (`*`), increasing breach impact. Others create tokens with too few abilities and get 403 errors.

### Real-World Consequences
A developer creates a token with `*` (all abilities) because the docs don't list specific abilities. The token is compromised. The attacker has full API access including delete operations, whereas only read access was needed.

### Preferred Alternative
List every available ability with a description of what it grants directly in the security scheme documentation.

### Refactoring Strategy
1. Aggregate all token abilities defined in the application
2. List them in the security scheme description
3. Include an example of least-privilege token creation
4. Document the role-to-ability mapping if applicable

### Detection Checklist
- [ ] Check security scheme description for ability list
- [ ] Verify consumers can determine which abilities to request
- [ ] Confirm least-privilege examples are provided

### Related Rules
- Document Every Token Ability With Description (05-rules.md)

### Related Skills
- (API documentation skills)

### Related Decision Trees
- (Ability design decisions)

---

## Anti-Pattern 4: Token Lifecycle Information Missing

### Category
Documentation

### Description
Documenting how to authenticate but not how long tokens last, how to refresh them, or what happens on expiration — generating the most common category of auth support tickets.

### Why It Happens
The auth flow documentation ends at "get token, use token." The eventual expiration is treated as a future concern.

### Warning Signs
- No mention of token TTL in auth docs
- No refresh token endpoint documentation
- Consumers report unexplained 401 errors months after integration
- Support team fields "my token expired" tickets daily

### Why It Is Harmful
Consumers experience unexpected 401 errors when tokens expire. They don't know about refresh mechanisms. The integration appears broken, triggering unnecessary debugging.

### Real-World Consequences
A mobile app issued a token with 30-day TTL. Three months later, all tokens expire simultaneously. The entire user base gets 401 errors. The developer spends 2 days debugging before discovering token expiration.

### Preferred Alternative
Document token TTL, refresh endpoint, and expected behavior on expiration in the security scheme description.

### Refactoring Strategy
1. Add token TTL to security scheme documentation
2. Document refresh endpoint with request/response examples
3. Describe what happens on expiration (401 + retry flow)
4. Add rate limits for auth endpoints to documentation

### Detection Checklist
- [ ] Check security scheme for token TTL information
- [ ] Verify refresh mechanism is documented
- [ ] Confirm expiration behavior is described

### Related Rules
- Include Token Lifecycle Documentation (05-rules.md)
- Document Rate Limits On Auth Endpoints (05-rules.md)

### Related Skills
- (Token lifecycle management skills)

### Related Decision Trees
- (Token expiration decisions)

---
