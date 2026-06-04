# Domain Analysis: Security & Identity Engineering for Laravel

## Domain Overview

Security & Identity Engineering in Laravel encompasses the full lifecycle of authenticating users, authorizing actions, hardening applications against threats, managing secrets, and maintaining audit trails. Laravel provides a layered security model spanning the framework kernel (middleware, encryption, hashing), first-party packages (Sanctum, Passport, Fortify, Socialite, Passkeys), starter kits (Breeze, Jetstream), ecosystem packages (Spatie Permission, Spatie Activitylog), and enterprise integrations (SAML, OIDC, WebAuthn, vault systems). The domain is characterized by rapid evolution in 2025-2026, notably the introduction of first-party passkeys (April 2026), the deprecation of Breeze/Jetstream in favor of stack-specific Starter Kits (Laravel 12/13), and a convergence on a canonical stack: Fortify + Sanctum + Socialite + Passkeys + Spatie Permission.

## Domain Scope

This domain covers all aspects of securing a Laravel application from development through production operations. It includes authentication mechanisms (session-based, token-based, OAuth2, OIDC, SAML, passwordless), authorization models (RBAC, ABAC, ReBAC via Gates/Policies/Permissions), web vulnerability defense (CSRF, XSS, SQLi, mass assignment), transport and header security (CSP, HSTS, CORS), rate limiting and throttling, secrets lifecycle management, encryption at rest and in transit, audit logging, multi-tenancy security isolation, and session management. It excludes physical infrastructure security, network-layer DDoS mitigation beyond application-level rate limiting, and compliance frameworks (SOC2, HIPAA, GDPR) as implementation details.

## Major Subdomains

### 1. Authentication Systems
- **Session-Based Auth**: Laravel's built-in `Auth` facade, guards, providers; Fortify as headless backend; Breeze/Jetstream/Starter Kits as UI scaffolds
- **API Token Auth (Sanctum)**: Lightweight token auth for SPAs (cookie-based session) and mobile/third-party clients (Bearer tokens with SHA-256 hashed PATs); no OAuth2 support; ability-based token scoping
- **OAuth2 Server (Passport)**: Full OAuth2 server on `league/oauth2-server`; Authorization Code + PKCE, Client Credentials, Device Code grants; token scopes; key management; headless since v13.x
- **Social Login (Socialite)**: OAuth1/OAuth2 client for "Sign in with Google/GitHub/Apple/etc."; community provider ecosystem at socialiteproviders.com
- **Passwordless Auth (Passkeys/WebAuthn)**: First-party `laravel/passkeys` (April 2026); WebAuthn ceremonies; relying party configuration; `@laravel/passkeys` npm client; alternative: `spatie/laravel-passkeys`, `laragear/webauthn`, `xefi/laravel-passkey-api`
- **Enterprise SSO**: SAML 2.0 via `socialiteproviders/saml2`; OIDC via custom Socialite drivers (e.g., `jeffersongoncalves/laravel-oidc`); WorkOS integration for enterprise IdP; Keycloak provider
- **Multi-Factor Authentication (MFA)**: TOTP via Jetstream/Fortify; recovery codes; WebAuthn as second factor; `pragmarx/google2fa-laravel` ecosystem package

### 2. Authorization
- **Gates**: Closure-based authorization for non-model-specific actions; defined in `AppServiceProvider`; `Gate::before()` for super-admin bypass
- **Policies**: Class-based authorization organized per Eloquent model; auto-discovered by convention; `authorizeResource()` for resource controllers
- **Spatie laravel-permission**: Database-driven roles and permissions; trait-based (`HasRoles`); gate integration; team support; wildcard permissions; cache-aware; middleware (`role`, `permission`, `role_or_permission`)
- **RBAC**: Role-Based Access Control; hierarchical roles; separation-of-duty constraints; permission-aware not role-aware design principle
- **ABAC**: Attribute-Based Access Control; user/resource/environment attributes; policy decision points (PDP); Permit.io integration
- **ReBAC**: Relationship-Based Access Control; entity relationship evaluation; Google Zanzibar-inspired models

### 3. Security Hardening
- **CSRF Protection**: `VerifyCsrfToken` middleware; `@csrf` Blade directive; Sanctum SPA `/sanctum/csrf-cookie` endpoint; API route exclusion
- **XSS Prevention**: Blade `{{ }}` auto-escaping via `htmlspecialchars`; raw `{!! !!}` only for trusted content; Content-Security-Policy as fallback shield
- **SQL Injection Prevention**: Eloquent ORM and query builder PDO parameter binding; `whereRaw`/`selectRaw` with bindings; column name whitelisting for dynamic queries
- **Mass Assignment Protection**: `$fillable` whitelist; `$guarded` blacklist; `$request->validated()` over `$request->all()`; avoid `unguard()` and `forceFill()`
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; middleware-based implementation
- **CORS Configuration**: `config/cors.php`; restricted origins/methods/headers; credentials support for SPA cookies
- **Session Security**: `secure` (HTTPS-only), `http_only` (no JS access), `same_site` (Lax/Strict), `encrypt` session data; database/Redis driver over file
- **Password Security**: Bcrypt default hashing; password validation rules; `password.confirm` middleware for sensitive actions; rate-limited login attempts

### 4. Threat Mitigation
- **Rate Limiting**: `RateLimiter` facade; named limiters (`api`, `login`, etc.); `throttle` middleware; sliding window, fixed window, token bucket algorithms; plan-aware throttling for SaaS (e.g., `grazulex/laravel-api-throttle-smart`)
- **Input Validation**: Form Request validation; `$request->validated()`; rule objects; bail, nullable, sometimes modifiers; validated data over raw input
- **Output Escaping**: Blade auto-escaping; HTML sanitization for rich text; context-aware encoding
- **Encryption**: Laravel `Crypt` facade (AES-256-CBC/GCM); `eloquent-encryption` for column-level RSA encryption; `sealcraft` for envelope encryption (DEK/KEK) with AWS KMS, GCP Cloud KMS, Azure Key Vault, HashiCorp Vault Transit
- **Signed URLs**: `URL::signedRoute()`; `URL::temporarySignedRoute()`; `ValidateSignature` middleware; webhook verification
- **File Upload Security**: Validate MIME types and size; store outside web root; use private disks with signed URLs; scan uploaded content

### 5. Secrets Management
- **Environment Management**: `.env` files; `config/` caching; `APP_KEY` generation and rotation
- **Vault Integration**: HashiCorp Vault via `deepdigs/laravel-vault-suite`, `thetribeofdan/laravel_vault`; token mode and file mode; config mapping
- **Key Rotation**: `laravel-locksmith` for zero-downtime API key rotation; recipes for AWS IAM, Twilio; key pools for services without APIs; grace period dual-validity
- **Column-Level Encryption**: `eloquent-encryption` with RSA key rotation; `sealcraft` with DEK/KEK envelope encryption; KMS provider abstraction
- **Secrets Scanning**: Laravel-Shield CLI tool for detecting hardcoded secrets, weak keys, exposed `.env`; Shannon entropy detection

### 6. Audit Logging
- **Model Activity**: `spatie/laravel-activitylog`; automatic model event tracking; custom activity logging; causer/subject attribution
- **Comprehensive Auditing**: `BeakSoftware/laravel-audit-logging` (HMAC checksums, request tracing, retention policies); `dineshstack/laravel-audit` (field-level diffs, batch grouping, REST API, alert rules); `Williamug/audited` (admin UI, per-model timelines, auth event logging)
- **Immutable Audit Trails**: `graymattertechnology/laravel-audit-chain` (SHA-256 hash chain, GDPR/NIS2 compliance, cryptographic verification)
- **Multi-Tenant Audit**: `ahmed3bead/laravel-tenant-audit` (polymorphic actors, per-tenant isolation, custom events)
- **Log Integrity**: HMAC checksums; hash chains; database-level INSERT-only permissions; Eloquent immutability guards

### 7. Multi-Tenancy Security
- **Data Isolation Patterns**: Shared DB + `tenant_id` (row-level); shared DB + separate schemas; dedicated DB per tenant
- **Enforcement**: Global Eloquent scopes; `BelongsToTenant` trait; middleware-based tenant resolution; queue job tenant context serialization
- **Packages**: `stancl/tenancy` (gold standard, feature-rich); `spatie/laravel-multitenancy` (lightweight, bare-bones)
- **Cross-Tenant Leak Prevention**: CI test suites; composite unique indexes with `tenant_id`; UUID over incremental IDs; no implicit defaults
- **Super Admin Impersonation**: Session-based tenant switching; read-only mode enforcement

### 8. Additional Security Concerns
- **Dependency Security**: `composer audit` in CI; Dependabot configuration; regular dependency updates
- **Production Configuration**: `APP_DEBUG=false`; strong `APP_KEY`; environment-specific config caching; server header removal (`X-Powered-By`, `Server`)
- **Queue Security**: Tenant-aware jobs; dead-letter policies; retry limits; Horizon tagging per tenant
- **Container/Octane Safety**: Request-scoped state; tenant context cleanup in `finally` blocks; no static state leaking between requests

## Complete Knowledge Inventory

| # | Knowledge Element | Subdomain | Source Tier | Maturity | Criticality |
|---|---|---|---|---|---|
| 1 | Laravel Auth guards and providers architecture | Authentication | T1 | Stable | Critical |
| 2 | Fortify headless auth backend | Authentication | T1 | Stable | High |
| 3 | Sanctum SPA cookie auth vs token auth | Authentication | T1 | Stable | Critical |
| 4 | Sanctum ability-based token scoping | Authentication | T1 | Stable | High |
| 5 | Passport OAuth2 server (grants, scopes, keys) | Authentication | T1 | Mature | High |
| 6 | Passport vs Sanctum decision framework | Authentication | T1/T4 | Stable | Critical |
| 7 | Socialite OAuth1/OAuth2 client | Authentication | T1 | Stable | High |
| 8 | First-party Passkeys/WebAuthn (`laravel/passkeys`) | Authentication | T1 | Emerging (v0.2.x) | High |
| 9 | Spatie Passkeys Livewire components | Authentication | T2 | Stable | Medium |
| 10 | WebAuthn ceremonies (attestation, assertion) | Authentication | T1/T2 | Stable | High |
| 11 | SAML 2.0 SSO via SocialiteProviders | Authentication | T2/T4 | Stable | High |
| 12 | OIDC integration (jwks validation, nonce, discovery) | Authentication | T2/T4 | Emerging | High |
| 13 | WorkOS enterprise SSO / SCIM / directory sync | Authentication | T1/T3 | Stable | Medium |
| 14 | MFA/TOTP with Fortify | Authentication | T1 | Stable | High |
| 15 | Gates: closure-based authorization | Authorization | T1 | Stable | Critical |
| 16 | Policies: model-centric authorization classes | Authorization | T1 | Stable | Critical |
| 17 | Policy auto-discovery by naming convention | Authorization | T1 | Stable | High |
| 18 | Spatie laravel-permission (roles, permissions) | Authorization | T2 | Stable | Critical |
| 19 | RBAC design (hierarchical, constrained) | Authorization | T2/T4 | Stable | High |
| 20 | ABAC attribute-based authorization | Authorization | T2/T4 | Maturing | Medium |
| 21 | ReBAC relationship-based authorization | Authorization | T2/T4 | Maturing | Low |
| 22 | Super-admin bypass via `Gate::before()` | Authorization | T1 | Stable | High |
| 23 | Blade `@can`/`@cannot`/`@canany` directives | Authorization | T1 | Stable | High |
| 24 | CSRF token exchange and validation | Hardening | T1 | Stable | Critical |
| 25 | Blade auto-escaping and XSS prevention | Hardening | T1 | Stable | Critical |
| 26 | SQL injection via parameterized bindings | Hardening | T1 | Stable | Critical |
| 27 | Mass assignment `$fillable`/`$guarded` | Hardening | T1 | Stable | Critical |
| 28 | Security headers (HSTS, CSP, XFO, etc.) | Hardening | T1/T4 | Stable | High |
| 29 | CORS configuration for cross-origin requests | Hardening | T1 | Stable | High |
| 30 | Session configuration (secure, http_only, same_site) | Hardening | T1 | Stable | Critical |
| 31 | CSP nonce/script-src/style-src configuration | Hardening | T1/T4 | Stable | High |
| 32 | Rate limiter facade and throttle middleware | Threat Mitigation | T1 | Stable | High |
| 33 | Advanced rate limiting (sliding window, token bucket) | Threat Mitigation | T2/T4 | Maturing | Medium |
| 34 | Plan-aware throttling for SaaS APIs | Threat Mitigation | T2 | Maturing | Medium |
| 35 | Form Request validation rules and best practices | Threat Mitigation | T1 | Stable | Critical |
| 36 | Laravel Crypt facade (AES-256-CBC/GCM) | Threat Mitigation | T1 | Stable | High |
| 37 | Signed URLs and signed routes | Threat Mitigation | T1 | Stable | Medium |
| 38 | File upload validation and secure storage | Threat Mitigation | T1 | Stable | High |
| 39 | `.env` management and `APP_KEY` | Secrets | T1 | Stable | Critical |
| 40 | HashiCorp Vault integration packages | Secrets | T2 | Maturing | Medium |
| 41 | Zero-downtime key rotation (Locksmith) | Secrets | T2 | Maturing | Medium |
| 42 | Envelope encryption DEK/KEK (Sealcraft) | Secrets | T2 | Emerging | Medium |
| 43 | Column-level RSA encryption with key rotation | Secrets | T2 | Maturing | Medium |
| 44 | Secrets scanning and detection tools | Secrets | T2 | Maturing | Low |
| 45 | Spatie laravel-activitylog | Audit | T2 | Stable | High |
| 46 | Comprehensive audit logging (HMAC, diffs, alerts) | Audit | T2 | Maturing | Medium |
| 47 | Immutable audit hash chains (SHA-256) | Audit | T2 | Emerging | Medium |
| 48 | Multi-tenant audit logging | Audit | T2 | Maturing | Medium |
| 49 | Laravel Breeze auth scaffolding | Auth (UX) | T1 | Legacy | Medium |
| 50 | Laravel Jetstream (Fortify + Sanctum) | Auth (UX) | T1 | Legacy | Medium |
| 51 | Laravel Starter Kits (React, Vue, Svelte, Livewire) | Auth (UX) | T1 | Current (L12/13) | High |
| 52 | Shared-database multi-tenancy with global scopes | Multi-Tenant | T2/T4 | Stable | High |
| 53 | Database-per-tenant isolation pattern | Multi-Tenant | T2/T4 | Stable | High |
| 54 | Tenant-aware queues and job context | Multi-Tenant | T2/T4 | Stable | High |
| 55 | stancl/tenancy package architecture | Multi-Tenant | T2 | Stable | High |
| 56 | Dependency security (composer audit, Dependabot) | Hardening | T2/T4 | Stable | Medium |
| 57 | Server header removal and hardening | Hardening | T2/T4 | Stable | Medium |
| 58 | Enlightn static/dynamic security analysis | Hardening | T2 | Maturing | Medium |
| 59 | Laravel-Shield security scanning CLI | Hardening | T2 | Maturing | Low |
| 60 | Password validation rule objects (length, custom) | Authentication | T1 | Stable | High |

## Knowledge Classification

| Category | Count | Examples |
|---|---|---|
| **Stable/Mature** | 38 | Sanctum token auth, Gates/Policies, CSRF, Eloquent SQLi protection, Spatie Permission, Socialite, Fortify, Blade auto-escaping, RateLimiter facade, session config, Form Requests, password hashing |
| **Maturing** | 12 | ABAC/ReBAC patterns, Plan-aware throttling, Vault integration packages, Column-level encryption, Audit packages with diff/alert/batch, Multi-tenant job patterns |
| **Emerging** | 10 | First-party Passkeys (v0.2.x), OIDC Socialite driver, Envelope encryption (Sealcraft), Immutable audit chains, Laravel Starter Kits (L12/13), Hash chain verification, DEK rotation commands, KMS provider abstraction |

## Dependency Map

```
Security & Identity Engineering
├── Authentication Layer
│   ├── Laravel Auth (guards, providers, Middleware)
│   │   └── Eloquent User Provider
│   ├── Fortify (headless auth backend)
│   │   └── Actions pipeline (authenticateThrough)
│   ├── Sanctum (SPA cookie + API tokens)
│   │   └── Cookie-based session auth
│   ├── Passport (OAuth2 server)
│   │   └── league/oauth2-server
│   │   └── RSA key pairs (passport:keys)
│   ├── Socialite (OAuth/OIDC client)
│   │   └── SocialiteProviders community
│   ├── Passkeys (WebAuthn)
│   │   └── @laravel/passkeys (npm)
│   │   └── web-auth/webauthn-lib
│   └── Starter Kits (Breeze/Jetstream/Starter Kits)
│       └── Fortify + Sanctum (default stack)
│
├── Authorization Layer
│   ├── Gates (closure-based)
│   ├── Policies (model-centric classes)
│   │   └── Auto-discovery convention
│   ├── Spatie laravel-permission
│   │   ├── HasRoles trait
│   │   ├── Database-driven roles/permissions
│   │   └── Cache invalidation
│   └── External PDP (Permit.io)
│       └── RBAC/ABAC/ReBAC enforcement
│
├── Hardening Layer
│   ├── Middleware Stack
│   │   ├── VerifyCsrfToken
│   │   ├── Security Headers middleware
│   │   ├── CORS middleware
│   │   └── Rate Limiting (throttle)
│   ├── Eloquent Protection
│   │   ├── $fillable/$guarded
│   │   └── Parameterized queries
│   ├── Blade Security
│   │   ├── Auto-escaping {{ }}
│   │   └── Raw output {!! !!} (restricted)
│   ├── Session Configuration
│   │   ├── secure, http_only, same_site
│   │   └── Encrypt session data
│   └── Production Config
│       ├── APP_DEBUG=false
│       ├── Strong APP_KEY
│       └── composer audit
│
├── Secrets & Crypto Layer
│   ├── Laravel Crypt (AES-256)
│   │   └── APP_KEY as encryption key
│   ├── HashiCorp Vault integration
│   │   └── Token mode / File mode
│   ├── Key Rotation (Locksmith)
│   │   ├── Recipe pattern
│   │   └── Grace period dual-validity
│   └── Envelope Encryption (Sealcraft)
│       ├── DEK/KEK pattern
│       └── Cloud KMS providers
│
├── Audit Layer
│   ├── Model Activity Logging
│   │   └── Traits (spatie, custom)
│   ├── Request Tracing
│   │   ├── reference_id linking
│   │   └── IP/User-Agent capture
│   ├── Integrity Verification
│   │   ├── HMAC checksums
│   │   └── SHA-256 hash chains
│   └── Retention & Pruning
│       └── Scheduled cleanup commands
│
└── Multi-Tenancy Security
    ├── Tenant Resolution Middleware
    ├── Global Scopes (BelongsToTenant)
    ├── Queue Context Serialization
    └── Isolation Testing
```

## Missing Knowledge Risk Analysis

| Gap | Risk Level | Impact | Mitigation Strategy |
|---|---|---|---|
| OIDC Socialite driver maturity (single contributor) | High | Production OIDC connections may lack long-term maintenance support | Monitor package activity; prepare fallback to direct OIDC library integration; contribute to package |
| First-party Passkeys still v0.2.x (pre-1.0) | Medium | Breaking API changes in minor versions could require migration work | Pin exact version; follow changelog; standardize on documented Actions API rather than internals |
| ABAC/ReBAC reference implementations for Laravel | Medium | No canonical Laravel ABAC pattern; heavy dependence on Permit.io SaaS | Build internal ABAC evaluation service; define attribute context contracts; avoid vendor lock-in |
| Laravel Starter Kits documentation fragmentation | Low-Medium | Documentation split across L11.x, L12.x, L13.x docs; deprecated Breeze/Jetstream patterns persist in search results | Reference current L13 docs; ignore pre-L12 kit instructions |
| Zero-downtime key rotation with Passport JWT keys | Medium | No first-party rotation command; manual key regeneration risks token invalidation | Build custom rotation artisan command; implement key version identifiers in tokens; stage key overlap window |
| Immutable audit hash chain community adoption | Low-Medium | Single package (`audit-chain`) with limited adoption; no industry standard for Laravel hash chains | Evaluate maturity before critical compliance use; build fallback HMAC-only audit trail |
| Socialite SAML2 provider compatibility matrix | Medium | IdP-specific variations (Azure AD vs Okta vs Keycloak) require per-IdP testing | Maintain IdP-specific test fixtures; document known compatibility issues per IdP |
| Cross-tenant data leak detection tooling | High | No automated tooling to verify tenant isolation at database level | Mandate cross-tenant CI test fixtures for every model; implement periodic scan against staging tenant data |
| Secret scanning integration in CI pipelines | Low | Multiple tools exist but no community standard for Laravel CI secret scanning | Standardize on Laravel-Shield with CI integration; document configuration for GitHub Actions/GitLab CI |
| Passport + Sanctum dual-guard operational patterns | Low | Documentation exists but configuration complexity is under-documented | Maintain internal reference architecture for dual-guard setup; document token table separation |

## Research Findings

### Recommendations
- Default to Sanctum for all first-party authentication; reserve Passport exclusively for OAuth2 provider requirements. The ecosystem consensus is clear: Sanctum covers 80%+ of use cases with significantly less complexity.
- Adopt Spatie laravel-permission from day one, even for projects with simple role hierarchies. The cost of retrofitting permission structures exceeds the trivial setup cost.
- Implement passkeys (`laravel/passkeys`) as an additive authentication method alongside password auth, not as a replacement. Maintain password fallback for non-WebAuthn-capable devices.
- Use Laravel 13 Starter Kits (React/Vue/Svelte/Livewire) over Breeze or Jetstream for new projects. The legacy kits are deprecated and the new kits ship the canonical Fortify + Sanctum + Passkeys stack.
- Build security headers as a global middleware on day one. CSP should start in Report-Only mode and graduate to enforced mode.
- For multi-tenancy, start with shared database + `tenant_id` + global Eloquent scope. Migrate to schema-per-tenant or database-per-tenant only when regulatory requirements or scale demands it.

### Common Patterns
- **Canonical Auth Stack (2026)**: Fortify (backend) + Sanctum (API/SPA tokens) + Socialite (OAuth clients) + Passkeys (passwordless) + Spatie Permission (roles)
- **Defense in Depth**: CSRF tokens + Blade escaping + CSP headers + parameterized queries + rate limiting + validated input = layered protection
- **Permission-Centric Authorization**: Check permissions, not roles. `$user->can('edit articles')`, never `$user->hasRole('editor')`. Roles group permissions; code checks permissions.
- **Action Pattern (Fortify/Jetstream)**: Customization through invokable action classes rather than controller overrides; `App\Actions\Fortify\*` for auth behavior modification
- **Tenant Context in Queues**: Every job must carry `tenant_id` in its payload and re-bind tenant context at the start of `handle()`. Missing this is the most common cross-tenant leak.

### Known Tradeoffs
- **Sanctum vs Passport**: Simplicity vs OAuth2 compliance. Sanctum cannot do delegated authorization; Passport introduces client management, grants, scopes, and key infrastructure overhead.
- **Shared DB vs Separate DB Multi-Tenancy**: Operational simplicity vs data isolation. Shared DB at risk of cross-tenant leak via scope bypass; separate DB at risk of schema drift and migration complexity.
- **First-Party Passkeys vs Spatie Passkeys**: `laravel/passkeys` is stack-agnostic and Fortify-integrated but pre-1.0; `spatie/laravel-passkeys` ships Livewire components and is battle-tested in production (Mailcoach).
- **Fortify Abstraction vs Published Controllers (Breeze)**: Fortify provides cleaner upgrade path and feature toggles; Breeze provides full code ownership and debuggability at cost of manual updates.
- **Global Scope Isolation vs Row-Level Security**: Eloquent scopes are bypassable via `->withoutGlobalScopes()` and direct DB queries; PostgreSQL RLS provides database-enforced isolation but adds complexity.

### Common Misconceptions
- "Passport is more enterprise/complete than Sanctum" → Sanctum is the correct default for first-party auth; Passport is only needed when your app is an OAuth2 provider
- "Blade `@can` directives are sufficient for security" → Server-side `Gate::authorize()` is mandatory; Blade directives are UX-only and bypassable by direct URL navigation
- "Multi-tenancy is just a database decision" → Also affects auth, queues, cache, storage, logging, and deployment
- "Token-based auth is always more secure than session auth" → Sanctum's cookie-based SPA auth provides CSRF protection and XSS leakage prevention that Bearer tokens lack in browser contexts
- "CSP solo protects against XSS" → CSP is a fallback layer; proper output escaping (`{{ }}`) is the primary XSS defense
- "`$guarded = []` + validated input is safe" → `$fillable` whitelist is always safer; validated input can include unexpected fields if validation rules miss them

## Future Expansion Opportunities

1. **Declarative Authorization DSL**: Growing ecosystem interest in Laravel-native policy definition languages similar to Open Policy Agent (OPA) or Casbin; could evolve into a first-party attribute-based authorization system
2. **AI-Security Integration**: LLM-powered security analysis for Laravel apps (automated pentesting, vulnerability detection); prompt injection defense patterns for AI-augmented applications
3. **Zero Trust Architecture Patterns**: Expanding beyond perimeter-based security to per-request verification, continuous authentication, and device posture assessment within Laravel
4. **FIDO2/Passkeys as Primary Auth**: As `laravel/passkeys` reaches v1.0 maturity, the ecosystem will shift toward passwordless-first authentication with passwords as fallback only
5. **Distributed Identity Federation**: Cross-service identity propagation for microservice architectures; Passport as IdP for internal service mesh
6. **Cryptographic Audit Verification**: Automated verification of audit log integrity; SIEM integration for Laravel audit streams; real-time anomaly detection on audit events
7. **Compliance Automation**: Regulatory compliance (SOC2, HIPAA, GDPR) controls as code within Laravel; automated evidence collection for audit trails
8. **Edge/Worker Security**: Octane-safe security state management; serverless Laravel security patterns (Laravel Vapor); edge-computed authentication

## Sources Consulted

### Tier 1: Official Laravel Documentation & Source
- Laravel 13.x Authentication Docs: https://laravel.com/docs/13.x/authentication
- Laravel 13.x Authorization Docs: https://laravel.com/docs/13.x/authorization
- Laravel 13.x Sanctum Docs: https://laravel.com/docs/13.x/sanctum
- Laravel 13.x Passport Docs: https://laravel.com/docs/13.x/passport
- Laravel 13.x Rate Limiting Docs: https://laravel.com/docs/13.x/rate-limiting
- Laravel 11.x Starter Kits Docs: https://laravel.com/docs/11.x/starter-kits
- Laravel Jetstream Documentation: https://jetstream.laravel.com/
- Laravel Passkeys GitHub: https://github.com/laravel/passkeys-server
- @laravel/passkeys npm package: https://www.npmjs.com/package/@laravel/passkeys
- Laravel Fortify concept overview (Jetstream docs)
- Spatie laravel-permission docs: https://spatie.be/docs/laravel-permission/v7

### Tier 2: Ecosystem Packages & Security Resources
- Spatie laravel-permission GitHub: https://github.com/spatie/laravel-permission
- Spatie laravel-activitylog GitHub: https://github.com/spatie/laravel-activitylog
- Spatie laravel-passkeys GitHub: https://github.com/spatie/laravel-passkeys
- Laragear WebAuthn GitHub: https://github.com/Laragear/WebAuthn
- Laravel-Locksmith (key rotation): https://github.com/brainlet-ali/laravel-locksmith
- Laravel Vault Suite: https://packagist.org/packages/deepdigs/laravel-vault-suite
- Sealcraft (envelope encryption): https://packagist.org/packages/crumbls/sealcraft
- EloquentEncryption (column encryption): https://github.com/RichardStyles/EloquentEncryption
- OWASP Laravel Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Laravel_Cheat_Sheet.html
- WorkOS Laravel Authentication Guide 2026

### Tier 3: Starter Kits, Commercial & OSS Security Tools
- Laravel Breeze vs Jetstream comparison (Twilio, SoftwareThug, multiple sources)
- Laravel Starter Kit 2026 decision guide (LaraCopilot)
- Laravel-Shield security scanner: https://github.com/Mana007777/Laravel-Shield
- Permit.io Laravel authorization guide
- Enlightn mass assignment analysis documentation
- ZeriFlow Laravel Security Best Practices 2026
- StackShield Laravel hardening guide

### Tier 4: Community Discussions & Standards
- GitHub Discussion #42945: Using both Sanctum and Passport together
- Sanctum vs Passport 2026 comparisons (various blog posts)
- RBAC deep dive (Wendell Adriel)
- Laravel Policies vs Gates 2026 guides (multiple author analyses)
- Multi-tenancy architecture guides (Codeboxr, Kenodo, Fantomu, Curotec, Hasan Sidawi)
- OIDC Socialite driver: https://github.com/jeffersongoncalves/laravel-oidc
- SAML2 Socialite provider: https://github.com/SocialiteProviders/Saml2
- SocialiteProviders Keycloak: https://github.com/SocialiteProviders/Keycloak
- AegisIDP (Laravel-based Identity Provider): https://github.com/md-riaz/AegisIDP
- Audit logging packages (BeakSoftware, dineshstack, williamug, graymattertechnology)
- tenant-audit (multi-tenant audit): https://github.com/ahmed3bead/laravel-tenant-audit
- Laravel API throttle smart (plan-aware): https://github.com/Grazulex/laravel-api-throttle-smart
- Laravel Rate Limiter advanced: https://github.com/philiprehberger/laravel-rate-limiter

## Versioning

This domain analysis was produced in Phase 1 of the knowledge engineering workflow. It represents a broad survey of the Security & Identity Engineering domain for Laravel as of mid-2026. Next phases will narrow to specific subdomains for deep knowledge extraction and rule generation.
