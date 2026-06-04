# Anti-Patterns: Passport vs Sanctum Decision Framework

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Passport vs Sanctum Decision Framework |
| Audience | Architects, Developers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-PS-01 | Passport Overengineering | High | Very High | High |
| AP-PS-02 | Sanctum Scope Creep | High | Medium | High |
| AP-PS-03 | Preemptive Dual Setup | Medium | High | Medium |
| AP-PS-04 | Bearer Token localStorage for SPAs | Critical | High | Medium |
| AP-PS-05 | Password Grant Habit | Critical | High | Low |

---

## Repository-Wide Anti-Patterns

- **"More Enterprise = Better" Fallacy**: Assuming Passport is more "enterprise-ready" than Sanctum regardless of requirements
- **Copy-Paste Decision**: Repeating the same auth package choice across projects without re-evaluating requirements
- **Hidden Passport Dependency**: Passport listed in composer.json but only Sanctum guards are active — unused infrastructure

---

## 1. Passport Overengineering

### Category
Architecture · Maintainability

### Description
Installing and configuring Laravel Passport for first-party API authentication where Sanctum would be simpler and sufficient, adding unnecessary OAuth2 complexity.

### Why It Happens
The "more features = better" mentality. Developers assume Passport is the "full" auth solution while Sanctum is "lightweight" or "incomplete." Tutorials and legacy documentation sometimes recommend Passport as the default API auth. Teams may also have prior experience with OAuth2 and reach for familiar tools.

### Warning Signs
- Passport installed but the application has no third-party developers
- `config/auth.php` only uses Sanctum or `session` guards despite Passport being installed
- No OAuth2 client management UI or API exists
- Token creation uses `$user->createToken()` (Sanctum pattern) alongside Passport tables
- Hours spent configuring RSA keys, grant types, and scopes for first-party auth

### Why Harmful
Passport introduces ~7 database tables, RSA key management, client CRUD, grant type configuration, scope negotiation, and an OAuth2 authorization dialog — all unnecessary for first-party auth. This infrastructure must be maintained, secured, and upgraded. The OAuth2 authorization dialog forces users through an unnecessary consent screen. Setup time is hours vs minutes for Sanctum.

### Real-World Consequences
- Developer spends 3 hours setting up Passport for a simple mobile API that Sanctum could handle in 10 minutes
- Users see an OAuth2 "App wants permission to access your account" dialog for first-party login
- Weekly maintenance hours spent on Passport-specific tasks (key rotation, token pruning)
- Upgrade from Laravel 11 to 12 breaks Passport configuration — unnecessary migration work

### Preferred Alternative
Start with Sanctum for all API authentication. Only add Passport when third-party OAuth2 provider requirements are confirmed.

### Refactoring Strategy
1. Remove Passport dependency if no third-party OAuth2 clients exist
2. Migrate to Sanctum: `composer remove laravel/passport` and `composer require laravel/sanctum`
3. Replace Passport token creation with Sanctum's `$user->createToken()`
4. Update guards in `config/auth.php` to use Sanctum
5. Deploy and verify all API clients work with Sanctum tokens

### Detection Checklist
- [ ] Is Passport installed but no third-party OAuth2 clients exist?
- [ ] Count OAuth2 tables in database — are they empty or active?
- [ ] Do first-party users see an OAuth2 authorization consent screen?
- [ ] Is the OAuth2 client management UI implemented and used?

### Related Rules/Skills/Trees
- Default to Sanctum for API Authentication (05-rules.md)
- Use Sanctum for First-Party, Passport for Third-Party OAuth2 (05-rules.md)
- Sanctum vs Passport Package Selection decision tree (07-decision-trees.md)

---

## 2. Sanctum Scope Creep

### Category
Architecture · Maintainability

### Description
Using Sanctum beyond its capabilities — attempting to implement OAuth2-like delegated authorization, third-party client management, or complex scope negotiation on top of Sanctum's simple ability model.

### Why It Happens
Teams start with Sanctum (correctly) but the application grows to need third-party client access. Instead of migrating to Passport, they build custom OAuth2-like flows on top of Sanctum's token model, reinventing the wheel.

### Warning Signs
- Custom client management CRUD built on Sanctum tokens
- Manual scope/ability assignment with complex permission logic duplicated across projects
- Third-party applications use Sanctum tokens with shared secrets
- Custom authorization code generation and redemption logic
- "Sanctum + custom OAuth2 wrapper" pattern in the codebase

### Why Harmful
Sanctum is designed for first-party authentication — simple token creation with ability strings. Building OAuth2 delegation on top of it requires implementing authorization codes, refresh tokens, client credentials, scope negotiation, and token revocation — essentially rebuilding Passport poorly. The result is a custom, untested, non-standard OAuth2 implementation that is harder to maintain than using Passport directly.

### Real-World Consequences
- Custom "OAuth2" implementation has security bugs — missing PKCE, no token revocation
- Third-party developers confused by non-standard auth flow
- Maintenance burden of custom auth code exceeds what Passport would require
- Security audit requires complete rewrite of custom auth system

### Preferred Alternative
Use Sanctum for first-party auth and Passport for third-party OAuth2. Keep a clean separation.

### Refactoring Strategy
1. Install Passport alongside Sanctum
2. Configure separate guards: Sanctum for first-party, Passport for third-party
3. Migrate third-party clients to use Passport's Authorization Code + PKCE flow
4. Remove custom OAuth2 wrapper code
5. Update documentation for third-party developers

### Detection Checklist
- [ ] Are there custom client management, authorization code, or token exchange endpoints?
- [ ] Do third-party developers use a non-standard auth flow?
- [ ] Is there a custom implementation of OAuth2 grant types on top of Sanctum?
- [ ] Code review: any `createToken` calls with complex ability management?

### Related Rules/Skills/Trees
- Use Sanctum for First-Party, Passport for Third-Party OAuth2 (05-rules.md)
- Implement OAuth2-like flows on top of Sanctum (anti-pattern)
- Dual Setup vs Single Package decision tree (07-decision-trees.md)

---

## 3. Preemptive Dual Setup

### Category
Architecture · Maintainability

### Description
Installing both Sanctum and Passport simultaneously "just in case" third-party OAuth2 is needed later, adding unnecessary infrastructure and complexity.

### Why It Happens
Architects want to "future-proof" the authentication system. Installing both packages feels like covering all bases. The cost of adding Passport later (composer require, migration, config) seems higher than installing it upfront.

### Warning Signs
- Both `laravel/sanctum` and `laravel/passport` in `composer.json`
- Only Sanctum guards are actively used; Passport is configured but unused
- Passport tables exist but contain no client or token records
- CI/CD pipeline runs Passport key generation but keys are never used
- Developer confusion about which package to use for new features

### Why Harmful
Dual setup adds maintenance burden for unused infrastructure: RSA key management, Passport migrations, OAuth2 configuration, unused database tables, and CI/CD steps for key generation. Developers must understand both systems. Security surface increases (unused endpoints, potential misconfiguration). The "just in case" complexity is realized immediately, while the "case" never comes for most projects.

### Real-World Consequences
- Two token systems to maintain — confusion about which to use
- Unused Passport tables in database — wasted storage, potential security concern
- Developer accidentally uses Passport guard when Sanctum was appropriate — OAuth2 dialog shown
- `composer update` brings Passport breaking changes — remediation for unused dependency

### Preferred Alternative
Start with Sanctum only. Add Passport only when third-party OAuth2 requirements are confirmed.

### Refactoring Strategy
1. Evaluate actual third-party OAuth2 requirements — are they confirmed or speculative?
2. If speculative, remove Passport: `composer remove laravel/passport`
3. Drop unused Passport tables via migration
4. Remove Passport configuration and service provider registration
5. Revisit decision when/if OAuth2 requirements materialize

### Detection Checklist
- [ ] Are both Sanctum and Passport installed?
- [ ] Are both guard types actively used in route middleware?
- [ ] Count Passport client records — do any third-party clients exist?
- [ ] Is there a timeline or requirement for third-party OAuth2?

### Related Rules/Skills/Trees
- Avoid Dual Setup Unless Third-Party OAuth2 Is Confirmed (05-rules.md)
- Default to Sanctum for API Authentication (05-rules.md)
- Dual Setup vs Single Package decision tree (07-decision-trees.md)

---

## 4. Bearer Token localStorage for SPAs

### Category
Security · Critical

### Description
Storing Sanctum Bearer tokens in `localStorage` or `sessionStorage` for same-domain browser applications instead of using Sanctum's cookie-based SPA auth.

### Why It Happens
Bearer tokens are conceptually simpler — store the token, send it as an `Authorization` header. The SPA cookie auth setup requires additional configuration (CORS, Sanctum middleware, CSRF token endpoint). Developers may not understand the XSS implications of `localStorage` token storage.

### Warning Signs
- SPA stores API token in `localStorage` after login
- No call to `/sanctum/csrf-cookie` during login flow
- API requests use `Authorization: Bearer` header from browser apps on the same domain
- Frontend code accesses `localStorage.getItem('api_token')` for API calls

### Why Harmful
Tokens stored in `localStorage` or `sessionStorage` are accessible to any JavaScript executing on the page. An XSS vulnerability — even a minor one — can extract tokens and gain persistent API access. Sanctum's cookie-based SPA mode uses `httpOnly` session cookies that are not accessible to JavaScript, preventing XSS-based token theft.

### Real-World Consequences
- Stored XSS in a comment field reads `localStorage` and sends API tokens to attacker
- Third-party script compromised (analytics, chat widget) exfiltrates bearer tokens from storage
- Penetration test finds "XSS leads to persistent API access" — critical finding
- CSP (Content Security Policy) cannot protect `localStorage` — tokens are always accessible

### Preferred Alternative
Use Sanctum's cookie-based SPA authentication for same-domain or subdomain browser applications.

### Refactoring Strategy
1. Configure Sanctum SPA mode: set `stateful` domains in `config/sanctum.php`
2. Configure CORS for SPA origin in `config/cors.php`
3. Implement CSRF token initialization: `GET /sanctum/csrf-cookie` before login
4. Remove token storage from `localStorage` — rely on `httpOnly` session cookies
5. Remove Bearer token header from API client configuration

### Detection Checklist
- [ ] Check SPA code for `localStorage.setItem('*token*')` or similar
- [ ] Is the /sanctum/csrf-cookie endpoint called during login?
- [ ] Does the SPA send `Authorization: Bearer` headers for API calls?
- [ ] Are Sanctum stateful domains configured in config?

### Related Rules/Skills/Trees
- Use Sanctum Cookie Auth for Same-Domain SPAs (05-rules.md)
- Configure SPA Routes With Sanctum, Not Passport (05-rules.md)
- Sanctum Auth Mode: SPA Cookie vs Bearer Token decision tree (07-decision-trees.md)

---

## 5. Password Grant Habit

### Category
Security · Framework Usage

### Description
Using the OAuth2 Password Grant flow (credentials sent to client) in Sanctum or Passport, exposing user credentials to client applications unnecessarily.

### Why It Happens
The Password Grant is the simplest mental model — send username+password, get a token back. Many tutorials and legacy code examples demonstrate this pattern. Teams may carry the Password Grant habit from previous OAuth2 experience.

### Warning Signs
- API endpoint that accepts email+password and returns a token (in either Sanctum or Passport)
- Passport Password Grant enabled in configuration
- Sanctum token creation endpoint that forwards user credentials
- Mobile or SPA client handles plaintext passwords to exchange for tokens
- Login flow collects credentials on client and sends them to authorization server

### Why Harmful
The Password Grant requires the client application to handle plaintext credentials. If the client logs, stores, or leaks these credentials, the user's password is compromised. The Password Grant does not support MFA. It is deprecated in the OAuth2 specification. In Sanctum, the Password Grant pattern adds unnecessary credential handling — Sanctum's direct token creation (`$user->createToken()`) is the correct approach.

### Real-World Consequences
- Mobile app logs API responses including password — credentials stored on device
- Third-party client receives user credentials instead of a scoped token
- User cannot use MFA because Password Grant bypasses the challenge
- Security audit marks Password Grant as deprecated/high-severity finding
- OAuth2 compliance certification fails due to Password Grant usage

### Preferred Alternative
In Sanctum, authenticate via the standard login form and create tokens server-side. In Passport, use Authorization Code + PKCE.

### Refactoring Strategy
1. In Sanctum: authenticate via login form session, then create token server-side
2. In Passport: disable Password Grant, implement Authorization Code + PKCE
3. Update client applications to use the correct flow
4. Remove any client-side password handling code that forwards credentials
5. Never store or log user credentials in client applications

### Detection Checklist
- [ ] Search for `grant_type=password` in API requests
- [ ] Does any endpoint accept email+password and return a token directly?
- [ ] Can the client application access plaintext user passwords?
- [ ] Is Sanctum's `createToken()` called after password-based login or directly?

### Related Rules/Skills/Trees
- Never Use Password Grant in Sanctum or Passport (05-rules.md)
- Use PKCE for Public Clients (SPAs and Mobile Apps) (05-rules.md)
- Sanctum Auth Mode: SPA Cookie vs Bearer Token decision tree (07-decision-trees.md)
