# ECC Anti-Patterns — Sanctum vs Passport Decision

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Sanctum vs Passport Decision |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Passport for First-Party Mobile or SPA Auth
2. Sanctum for Third-Party OAuth2 Compliance
3. Choosing Based on Developer Familiarity Instead of Consumer Needs
4. Both Packages Without Clear Route Separation

---

## Repository-Wide Anti-Patterns

- Overengineering

---

## Anti-Pattern 1: Passport for First-Party Mobile or SPA Auth

### Category
Architecture

### Description
Installing and configuring Passport (full OAuth2 server) when all API consumers are first-party mobile apps or SPAs that need simple token or cookie auth, adding unnecessary OAuth2 complexity.

### Why It Happens
Developers choose Passport because it's "more powerful" or "more professional," or because they're familiar with it from past projects. The actual consumer requirements are not evaluated.

### Warning Signs
- Passport installed with 5+ database tables for a single mobile app
- OAuth2 authorization code redirect flow for login, when a simple token endpoint would suffice
- Client ID and client secret management for first-party apps
- No third-party developers exist or are planned
- `/oauth/authorize` redirect for SPA login

### Why It Is Harmful
Passport introduces OAuth2 authorization code flow, client registration, key management, and redirects — none of which are needed for first-party apps. Auth flow complexity increases 10x. Maintenance burden includes key rotation, token type management, and multiple database tables.

### Real-World Consequences
A mobile app user must go through an OAuth2 browser redirect to log in. The redirect flow breaks in WebView. Developers spend 2 weeks configuring Passport when Sanctum's `createToken()` would have worked in 10 minutes.

### Preferred Alternative
Use Sanctum for first-party mobile and SPA authentication. Only introduce Passport when third-party OAuth2 requirements are confirmed.

### Refactoring Strategy
1. Evaluate actual consumer types — are there third-party OAuth2 requirements?
2. If not, remove Passport and migrate to Sanctum
3. First-party SPA: use Sanctum SPA cookie auth
4. First-party mobile: use Sanctum token auth with `createToken()`
5. Document the selection rationale

### Detection Checklist
- [ ] List all current and planned API consumer types
- [ ] Check for OAuth2-specific requirements (authorization code grant, PKCE)
- [ ] Evaluate if OAuth2 complexity is justified

### Related Rules
- Default to Sanctum for Any New Project (05-rules.md)
- Never Use Passport for Simple Mobile API Authentication (05-rules.md)

### Related Skills
- Implement Sanctum vs Passport Decision (06-skills.md)

### Related Decision Trees
- Auth Package Selection — Sanctum vs Passport vs Hybrid (07-decision-trees.md)

---

## Anti-Pattern 2: Sanctum for Third-Party OAuth2 Compliance

### Category
Framework Usage

### Description
Using Sanctum when third-party developers need to integrate using standard OAuth2 flows, forcing them to use non-standard authentication that is incompatible with OAuth2 client libraries.

### Why It Happens
Sanctum is the default and works well for first-party apps. Its lack of OAuth2 support is discovered too late — when third-party developers request standard OAuth2 integration.

### Warning Signs
- Third-party developers asking for OAuth2 client credentials or authorization code flow
- External developers complaining about non-standard auth implementation
- Documentation for external integration requires custom auth code
- Sanctum tokens issued to third-party applications directly
- No support for standard OAuth2 grants (authorization code, client credentials)

### Why It Is Harmful
External developers cannot use standard OAuth2 client libraries (Passport.js, league/oauth2-client, etc.). Each integration requires custom authentication code. Developer experience is poor, reducing API adoption.

### Real-World Consequences
A third-party developer wants to integrate with your API using an OAuth2 client library that works with every other API. Your Sanctum-based API requires them to manually manage token creation and refresh. They choose a competitor's API instead.

### Preferred Alternative
Use Passport for third-party OAuth2 endpoints. Use a hybrid approach: Sanctum for first-party, Passport for third-party, with separate route groups and auth guards.

### Refactoring Strategy
1. Install Passport alongside Sanctum (hybrid approach)
2. Create separate route groups for third-party OAuth2 endpoints
3. Use `auth:api` (Passport) guard for OAuth2 routes, `auth:sanctum` for first-party
4. Document OAuth2 flows for external developers
5. Keep existing Sanctum consumers on their current auth

### Detection Checklist
- [ ] Check if third-party OAuth2 integration is listed as a requirement
- [ ] Verify whether Sanctum can meet OAuth2 compliance needs (it cannot)
- [ ] Evaluate hybrid approach cost vs benefits

### Related Rules
- Never Use Sanctum for OAuth2 Compliance (05-rules.md)
- Use Hybrid Approach When Both First-Party and Third-Party Auth Are Needed (05-rules.md)

### Related Skills
- Implement Sanctum vs Passport Decision (06-skills.md)

### Related Decision Trees
- Auth Package Selection — Sanctum vs Passport vs Hybrid (07-decision-trees.md)

---

## Anti-Pattern 3: Choosing Based on Developer Familiarity Instead of Consumer Needs

### Category
Architecture

### Description
Selecting Sanctum or Passport based on the development team's experience rather than the API consumer's requirements, resulting in a poor fit between auth mechanism and use case.

### Why It Happens
The natural tendency is to use tools the team already knows. "We know Passport, so use it" or "Sanctum is simpler, so we'll make it work for OAuth2."

### Warning Signs
- Auth package chosen before consumer types were documented
- Team familiarity cited as primary reason in architecture decision record
- Known limitations accepted as "we'll work around it"
- No documented evaluation of consumer requirements
- Workarounds proliferate to make the chosen package fit the actual need

### Why It Is Harmful
The wrong auth package creates ongoing friction. Passport for simple first-party auth means unnecessary OAuth2 complexity and slower API development. Sanctum for OAuth2 means custom workarounds that don't integrate with standard tools.

### Real-World Consequences
A team chooses Passport "just in case" for a simple mobile API. Every new endpoint requires OAuth2 scope management. The mobile developer struggles with OAuth2 redirects. The API launch is delayed by 3 weeks.

### Preferred Alternative
Document consumer types and auth requirements first, then choose the package. Sanctum for first-party, Passport for third-party OAuth2.

### Refactoring Strategy
1. Document all current and planned consumer types
2. Map consumer types to required auth mechanisms
3. Choose the auth package that matches the requirements
4. Document the decision rationale for future reference
5. Only deviate from standard choice if requirements justify it

### Detection Checklist
- [ ] Review architecture decision records for auth package rationale
- [ ] Verify consumer types were evaluated before choosing the package
- [ ] Identify workarounds that indicate wrong package choice

### Related Rules
- Choose Based on Consumer Type, Not Developer Familiarity (05-rules.md)

### Related Skills
- Implement Sanctum vs Passport Decision (06-skills.md)

### Related Decision Trees
- Auth Package Selection — Sanctum vs Passport vs Hybrid (07-decision-trees.md)

---

## Anti-Pattern 4: Both Packages Without Clear Route Separation

### Category
Code Organization

### Description
Installing both Sanctum and Passport but mixing them on the same routes or without clear guard separation, causing auth confusion, middleware conflicts, and debugging complexity.

### Why It Happens
When moving from Sanctum to hybrid, developers apply both middlewares to the same route group or don't clearly document which routes use which guard.

### Warning Signs
- Routes have both `auth:sanctum` and `auth:api` middleware
- Auth guard configuration shared between Sanctum and Passport
- No clear route prefix separation for different auth types
- Developers unsure which guard to use for new endpoints
- Token types confused in audit logs

### Why It Is Harmful
Mixing auth guards on the same routes creates unpredictable behavior — which guard takes precedence depends on middleware ordering. Debugging auth failures becomes harder because the failure could be from either system. Adding new endpoints requires understanding both auth systems.

### Real-World Consequences
A route has both middleware applied. Sanctum guard runs first and resolves the user. Passport guard runs second and overwrites the user with `null`. The route returns 401 despite a valid Sanctum token. Debugging reveals the middleware ordering issue after hours.

### Preferred Alternative
Use separate route groups with distinct prefixes and clear guard assignments. Sanctum for `/api/v1/`, Passport for `/api/v1/oauth/`. Document which guard each group uses.

### Refactoring Strategy
1. Create separate route groups for Sanctum and Passport
2. Assign the appropriate guard to each group
3. Use different route prefixes or middleware groups
4. Document the separation in API documentation
5. Add tests verifying each auth mechanism on its respective routes

### Detection Checklist
- [ ] Check route files for multiple auth middleware on same routes
- [ ] Verify auth guard assignment clarity in route groups
- [ ] Test both auth mechanisms independently

### Related Rules
- Use Hybrid Approach When Both First-Party and Third-Party Auth Are Needed (05-rules.md)

### Related Skills
- Implement Sanctum vs Passport Decision (06-skills.md)

### Related Decision Trees
- Deployment Approach for Mixed Consumer Types (07-decision-trees.md)

---
