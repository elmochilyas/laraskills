# Phase 5: Rules — Sanctum vs Passport Decision

> Generated from 04-standardized-knowledge.md

## Default to Sanctum for Any New Project
---
## Category
Architecture
---
## Rule
Always start every new Laravel API project with Sanctum as the default auth package. Only add Passport when third-party OAuth2 requirements are confirmed.
---
## Reason
Sanctum handles 90%+ of API auth use cases (SPA cookies, mobile tokens, simple scopes) with zero installation, one table, and minimal configuration. Passport introduces 5+ tables, key management, and OAuth2 complexity that is never needed unless third-party integrations require it.
---
## Bad Example
```php
composer require laravel/passport
// Passport installed "just in case" — adds complexity with no benefit
```

---
## Good Example
```php
// Sanctum is pre-installed in Laravel 11 — no action needed
// Only add Passport when a third-party OAuth2 requirement appears
```

---
## Exceptions
Projects where third-party OAuth2 integration is confirmed in the requirements specification.
---
## Consequences Of Violation
Unnecessary complexity, maintenance burden, and developer overhead from unused OAuth2 infrastructure.

---
## Use Hybrid Approach When Both First-Party and Third-Party Auth Are Needed
---
## Category
Architecture
---
## Rule
Always use Sanctum for first-party auth and Passport for third-party OAuth2 via separate auth guards and route groups when both consumer types exist.
---
## Reason
Forcing third-party OAuth2 consumers through Sanctum (no OAuth2 spec compliance) breaks standard OAuth2 clients. Forcing first-party apps through Passport adds unnecessary OAuth2 redirects. A hybrid approach optimizes for each consumer type.
---
## Bad Example
```php
// All consumers forced through Sanctum — third-party OAuth2 clients cannot integrate
```

---
## Good Example
```php
// First-party routes (Sanctum)
Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    // SPA, mobile, first-party integrations
});

// Third-party routes (Passport)
Route::middleware('auth:api')->prefix('api/v1/oauth')->group(function () {
    // External developer integrations with OAuth2
});
```

---
## Exceptions
APIs with only one consumer type — use the appropriate single solution.
---
## Consequences Of Violation
OAuth2 requirements force Sanctum workarounds; or first-party apps suffer OAuth2 complexity.

---
## Never Use Sanctum for OAuth2 Compliance
---
## Category
Framework Usage
---
## Rule
Never use Sanctum when OAuth2 specification compliance is a requirement.
---
## Reason
Sanctum does not implement OAuth2 grants (authorization code, client credentials, PKCE). External developers expecting standard OAuth2 flows cannot integrate with Sanctum using standard OAuth2 client libraries.
---
## Bad Example
```php
// External developers asking for OAuth2 — Sanctum does not support it
$token = $user->createToken('third-party-app', ['read']);
```

---
## Good Example
```php
// Passport for third-party OAuth2
Route::post('/oauth/token', [AccessTokenController::class, 'issueToken']);
```

---
## Exceptions
No common exceptions. OAuth2 compliance requires Passport or a third-party provider.
---
## Consequences Of Violation
External developers cannot integrate using standard OAuth2 libraries; custom auth adapter required.

---
## Never Use Passport for Simple Mobile API Authentication
---
## Category
Architecture
---
## Rule
Never use Passport when the only consumers are your own first-party mobile apps.
---
## Reason
Passport's OAuth2 authorization code flow adds unnecessary redirects, client registration, and token exchange steps for first-party apps. Sanctum's `createToken` pattern is simpler and equally secure.
---
## Bad Example
```php
// Passport for your own mobile app — complete overkill
$proxy = Request::create('/oauth/token', 'POST', [
    'grant_type' => 'password',
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
]);
```

---
## Good Example
```php
// Sanctum for your own mobile app
$token = $user->createToken('mobile-app', ['posts:read']);
return $token->plainTextToken;
```

---
## Exceptions
No common exceptions. First-party mobile apps do not need OAuth2.
---
## Consequences Of Violation
Unnecessary OAuth2 complexity; slower authentication flow; increased maintenance burden.

---
## Keep Passport Keys Outside Document Root and Out of Git
---
## Category
Security
---
## Rule
Always store Passport's `oauth-private.key` and `oauth-public.key` outside the document root and never commit them to version control.
---
## Reason
The private key signs all access tokens. If committed to version control, every developer with repo access (including former employees) can sign valid tokens. Storing outside document root prevents web-based exposure.
---
## Bad Example
```php
// storage/oauth-private.key — inside repo, may be committed
```

---
## Good Example
```php
// .env
PASSPORT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
// Or store outside project root: /etc/secrets/oauth-private.key
// .gitignore includes *.key
```

---
## Exceptions
No common exceptions. Passport keys are never committed to version control.
---
## Consequences Of Violation
Unauthorized token signing; any developer with repo access can forge access tokens.

---
## Understand Sanctum's Session Driver Requirement for SPA Mode
---
## Category
Framework Usage
---
## Rule
Always check that `SESSION_DRIVER=cookie` is set when planning Sanctum SPA cookie auth — API-only setups must use token mode instead.
---
## Reason
Sanctum SPA mode requires the cookie session driver to read session data from the encrypted cookie. API-only setups typically use Redis or database for sessions and must use Sanctum token auth instead.
---
## Bad Example
```php
// SESSION_DRIVER=redis — Sanctum SPA mode silently fails
// All requests appear unauthenticated
```

---
## Good Example
```php
// SPA mode: SESSION_DRIVER=cookie
// Token mode: Any session driver, but uses Bearer tokens instead
```

---
## Exceptions
No common exceptions. The session driver requirement is non-negotiable for SPA mode.
---
## Consequences Of Violation
Sanctum SPA authentication silently fails; hours of debugging to identify root cause.

---
## Index personal_access_tokens for Performance at Scale
---
## Category
Performance
---
## Rule
Always add database indexes on `personal_access_tokens.tokenable_id`, `tokenable_type`, and `token` columns.
---
## Reason
Sanctum looks up tokens by ID (via `ID|secret` format) and filters by `tokenable_type`. Without indexes, these queries become full table scans as the table grows.
---
## Bad Example
```php
// No indexes — full table scans at scale
```

---
## Good Example
```php
Schema::table('personal_access_tokens', function (Blueprint $table) {
    $table->index('tokenable_id');
    $table->index('tokenable_type');
    $table->index('token');
});
```

---
## Exceptions
Small-scale applications (<10K tokens) where indexes overhead outweighs query benefit.
---
## Consequences Of Violation
Degraded API response times as token table grows; database CPU saturation.

---
## Choose Based on Consumer Type, Not Developer Familiarity
---
## Category
Architecture
---
## Rule
Always choose Sanctum or Passport based on your API consumer types, not the development team's familiarity with one package.
---
## Reason
Sanctum for third-party OAuth2 consumers forces non-standard auth patterns. Passport for first-party apps adds unnecessary complexity. The consumer's needs must drive the choice, not the developer's comfort zone.
---
## Bad Example
```php
// "We know Passport, so use it" — even though only first-party mobile apps consume the API
```

---
## Good Example
```php
// Decision matrix:
// First-party SPA + mobile only → Sanctum
// Third-party OAuth2 required → Passport
// Both → Hybrid (Sanctum + Passport with separate guards)
```

---
## Exceptions
No common exceptions. Consumer requirements determine the auth package.
---
## Consequences Of Violation
Wrong auth paradigm for the use case; excessive complexity or missing OAuth2 compliance.
