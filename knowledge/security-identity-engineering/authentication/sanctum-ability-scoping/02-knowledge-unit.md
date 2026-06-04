# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: Sanctum ability-based token scoping
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Sanctum token abilities are lightweight permission strings assigned at token creation time. They function like OAuth scopes but are simpler — strings like `"posts:read"`, `"posts:create"` checked via `$user->tokenCan($ability)`. Abilities are stored as JSON on the `personal_access_tokens.abilities` column and checked against the token, not the user's role/permission system. This means a user with a "read-only" token cannot perform write operations even if the user has full permissions. Abilities operate at the token level, orthogonal to Gates/Policies. They are only available for token-based auth, not SPA cookie auth.

---

# Core Concepts

- **Token Abilities vs User Permissions**: Abilities restrict what a specific token can do. User permissions (Gates/Policies) restrict what the user can do. A request satisfies both: the token must have the ability AND the user must have the permission.
- **Assignment**: `$user->createToken('token-name', ['posts:read', 'posts:list'])` — the second parameter is the abilities array.
- **Checking**: `$user->tokenCan('posts:read')` or `$request->user()->tokenCan('posts:read')`. Returns `true`/`false`.
- **Wildcard Abilities**: `$user->tokenCan('*')` checks if token has a `*` ability — shorthand for "all abilities."
- **Storage**: Abilities column is JSON — Sanctum casts it to an array. Querying via SQL JSON functions is possible for analytics.
- **No Abilities on SPA Auth**: If the request was authenticated via session cookie (not Bearer token), `tokenCan()` always returns `false` because there is no token.

---

# Mental Models

- **Keys on a Keychain**: Think of abilities as individual keys on a keychain. The keychain (token) can have different keys. Some keychains have a master key (`*`). You can give someone a keychain with only the "mailbox" key (limited ability) or the full set.
- **Permission AND Gate**: `tokenCan('edit')` AND `$user->can('edit', $post)` — both must pass. Abilities narrow what's possible; Gates check what's allowed.

---

# Internal Mechanics

- `ability` is an array string cast from JSON, stored in `personal_access_tokens.abilities`.
- `tokenCan()` reads the token from the current Sanctum guard's authenticated token, retrieves the abilities array, and checks `in_array($ability, $abilities) || in_array('*', $abilities)`.
- The token is stored on the authenticated user instance by Sanctum's guard after successful token validation. `tokenCan()` operates on this attached token object.
- Middleware: `abilities:read,write` and `ability:read,write` for route-level enforcement. `abilities` requires ALL specified abilities; `ability` requires ANY.

---

# Patterns

## Layered Scoping Pattern
- **Purpose**: Token scopes + user permissions + route middleware.
- **Implementation**: `auth:sanctum` → `abilities:read` → policy `view()` check.
- **Benefits**: Defense in depth — even with a valid token and authorized user, a third layer exists.

## Client-Specific Scopes Pattern
- **Purpose**: Mobile apps get limited tokens, web clients get full tokens.
- **Implementation**: After login, check the `device_type` or `client` header and pass different abilities to `createToken()`.
- **Benefits**: Prevents mobile clients from accessing admin-only endpoints without separate auth guards.

## Temporary Token Scopes Pattern
- **Purpose**: Short-lived tokens with restricted abilities.
- **Implementation**: Set `expires_at` and limit abilities to specific resources.
- **Benefits**: Guest checkout flows; password reset tokens.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Token abilities vs role permissions | Granular API access control | Use abilities for token-level restrictions; keep roles for user-level permissions |
| `abilities` middleware vs manual `tokenCan()` checks | Route-level enforcement vs conditional logic | `abilities` middleware for public routes; `tokenCan()` for complex logic (e.g., "can write but not delete") |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Simple string-based system | No hierarchy or inheritance | Cannot do `manage-posts` ability implying `posts:read, posts:write` without custom logic |
| Orthogonal to Gates/Policies | Developers forget to check both | Routes protected only by `tokenCan()` without Gate — user with "delete" ability but no "delete" permission can delete |
| Works without any authorization setup | No default or automatic assignment | Every token must explicitly list abilities; errors of omission grant too little or too much access |

---

# Performance Considerations

- `tokenCan()` is an in-memory array lookup — O(n) in ability count, negligible cost.
- JSON abilities column is not indexable for filtering. If you need to query "all tokens with X ability," consider a normalized abilities table or a search index.

---

# Production Considerations

- **Default Abilities**: If no abilities are passed to `createToken()`, the abilities column is an empty array `[]`. `tokenCan()` returns `false` for everything, making the token effectively useless.
- **SPA Cookie Auth**: When using SPA cookie auth (session), no token exists. `tokenCan()` returns `false`. Use `$user->can()` (Gates/Policies) instead.
- **Token UI**: If users create their own tokens (profile settings), provide a checklist of available abilities. Do not expose raw ability strings to end users.

---

# Common Mistakes

- **Checking `tokenCan()` on cookie-authenticated requests**: Always returns `false` because there's no token. Use `$user->can()` for session-based checks.
- **Not guarding any routes with abilities**: If you attach abilities but never check them, they serve no purpose.
- **Using token abilities as the sole authorization layer**: Bypass if an attacker creates a token with all abilities via the API. Always pair with Gates/Policies.

---

# Failure Modes

- **Empty abilities array**: A token created with `[]` abilities (default) has zero access via `tokenCan()`. The user authenticates but every `tokenCan()` check returns `false`. This looks like a permission error but is actually a token scoping issue.
- **Wildcard confusion**: `*` checks exact string match `'*'`, not glob-style `posts:*`. If you check `tokenCan('posts:read')` and the ability is `*`, it matches. If you check `tokenCan('posts:read')` and the ability is `posts:*` it does NOT match.

---

# Related Knowledge Units

- Prerequisites: Sanctum SPA vs Token auth, Token creation and management
- Related: Gates and Policies authorization, Route middleware
- Advanced Follow-up: Custom ability resolution with hierarchical scopes, Ability-based rate limiting per token

## Ecosystem Usage
- **Laravel Sanctum**: Token-based API authentication with ability scoping; integrates via HasApiTokens trait and AuthManager guard registration using iaRequest(). Sanctum provides a dual SPA/token resolution path.
- **Laravel Passport**: Full OAuth2 server implementation using league/oauth2-server; provides Passport guards, token validation middleware, and scope-based authorization. Used for third-party API access delegation.
- **Laravel Fortify**: Headless authentication backend implementing register, login, password reset, email verification, and two-factor authentication. Designed for integration with Vue/React SPAs via API routes.
- **Laravel Jetstream**: Application starter kit combining Fortify, Livewire/Inertia, teams, and Sanctum/Telescope integration. Provides pre-built authentication views.
- **Laravel Breeze**: Minimal authentication scaffolding using Blade or Inertia/Vue/React; provides a lighter alternative to Jetstream with simple authentication views.
- **Spatie Laravel Passkeys**: Adds WebAuthn/passkey support using Laravel's authentication system; registers passkeys as an additional authentication factor compatible with Sanctum and session guards.
- **Socialite**: OAuth1/OAuth2 social login provider for Laravel; supports 20+ providers (Google, GitHub, Facebook, etc.) and allows custom provider implementations via Socialite::extend().
- **WorkOS**: Enterprise SSO integration using SAML and OIDC protocols; provides a Laravel-specific package for directory sync and SSO authentication flows.

## Research Notes
- Sanctum's dual-path resolution (session cookie first, Bearer token fallback) is unique in the PHP ecosystem — most libraries choose one authentication mode exclusively. This dual mode introduces subtle behavior differences: SPA auth supports ability checking, token auth does not.
- Passport 12+ dropped support for password grants in favor of the Authorization Code Grant with PKCE, aligning with OAuth2 Security Best Current Practices (BCP) and deprecating the resource owner password flow.
- Fortify's action-based architecture (actions for login, register, password reset, etc.) allows complete customization of authentication behavior without forking framework code — each action can be overridden via Fortify::loginView() or custom action classes.
- WebAuthn and passkey support in Laravel (via spatie/laravel-passkeys and community packages) relies on PHP's gmp or cmath extensions for cryptographic operations — servers without these extensions cannot validate WebAuthn assertions.
- OIDC integration in Laravel uses Socialite as the primary abstraction for provider interaction, but production SSO systems should use league/oauth2-client directly for better control over provider configuration and token handling.
- SAML SSO for Laravel (via community packages like lightsaml/lightsaml) requires XML signature verification using PHP's openssl extension — the assertion processing pipeline handles XML security, signature verification, and session mapping.
- The uth.guards.providers architecture decouples authentication method from user storage — this enables LDAP, OIDC, SAML, and database-backed authentication to coexist within a single application.
- MFA TOTP (via pragmarx/google2fa-laravel or Fortify's built-in 2FA) generates time-based one-time passwords using HMAC-SHA1 with 30-second windows — the recovery codes provide backup access when the authenticator device is lost.

## Internal Mechanics
- **AuthManager Resolution**: Auth::guard('web') → AuthManager->guard('web') → checks if guard is already resolved in $this->guards array → if not, calls esolve('web') → reads config/auth.php for guard config → factory method (createSessionDriver, createTokenDriver, or custom via extend()) → resolves the provider by name → returns guard instance.
- **SessionGuard Login**: ttempt() fires Attempting event → calls provider etrieveByCredentials() → calls provider alidateCredentials() via Hash::check() → if successful, calls login() → regenerates session ID → fires Login event → updates emember_token if requested. The authenticated user is stored in session by identifier.
- **SessionGuard per-request resolution**: StartSession middleware reads session ID from cookie → hydrates session → uth middleware calls guard->user() → SessionGuard retrieves user ID from session → calls provider->retrieveById(). No password check per request.
- **Sanctum dual-path resolution**: For SPA requests (cookie-based), Sanctum uses the StartSession middleware's session state; for token requests (Bearer), Sanctum uses a RequestGuard closure that reads the token from the Authorization header and validates it against the personal_access_tokens table.
- **Fortify action pipeline**: Each authentication action (login, register, password reset) is a Laravel action class implementing __invoke(). Fortify dispatches through a middleware pipeline before each action, with default middleware handling rate limiting, validation, and authentication.
- **Passport token validation**: Passport registers a custom guard that intercepts the Authorization header, decodes the JWT via league/oauth2-server, validates the token signature, expiry, and scopes, then resolves the authenticated user from the token's sub claim.
