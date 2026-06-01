# Authentication Foundations

## Objective

Define the fundamental architecture, principles, and patterns for authentication in Laravel applications. This document establishes the foundation that all other authentication skill documents build upon.

## Core Philosophy

Authentication is the first line of defense. Every authentication decision must balance security, usability, and performance. Default to secure, opt into convenience.

## Architecture Standards

### Authentication Layer Architecture

```
┌──────────────────────────────┐
│   Presentation Layer         │  — Controllers, Middleware, Blade, Inertia
├──────────────────────────────┤
│   Authentication Layer       │  — Guards, Providers, AuthManager
├──────────────────────────────┤
│   Identity Layer             │  — User model, identity attributes, roles
├──────────────────────────────┤
│   Credential Storage Layer   │  — Hashed passwords, tokens, sessions
├──────────────────────────────┤
│   Persistence Layer          │  — Database, Redis, external IdP
└──────────────────────────────┘
```

### Identity Lifecycle States

```
Registration → Verification → Active → Suspended → Archived → Purged
                  ↓                            ↑
            Re-verification              Reactivation
```

Each state transition must be:
- Explicit (not automatic)
- Logged (audit trail)
- Notified (email/event)
- Reversible (except purge)

### Session Authentication Standards

- Use `database` or `redis` session driver in production — never `file`
- Regenerate session ID on login, logout, and privilege escalation
- Set session lifetime to 120 minutes maximum
- Implement absolute session timeout (max lifetime, regardless of activity)
- Use `Session::regenerate(true)` to delete old session data

```php
// App\Http\Middleware\SessionSecurity.php
class SessionSecurity
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($user = $request->user()) {
            $maxLifetime = now()->subMinutes(config('auth.session_absolute_timeout', 480));
            if ($user->last_login_at && $user->last_login_at->lessThan($maxLifetime)) {
                Auth::logout();
                $request->session()->invalidate();
                return redirect('/login')->with('message', 'Session expired. Please log in again.');
            }
        }
        return $next($request);
    }
}
```

### Stateful vs Stateless Authentication

| Aspect | Stateful (Web) | Stateless (API) |
|--------|---------------|-----------------|
| Storage | Server session | Token/JWT |
| State | In-memory/Redis | Self-contained |
| Scale | Sticky sessions or shared Redis | Horizontally scalable |
| CSRF | Required | Token-based (Bearer) |
| Expiry | Session timeout | Token TTL |
| Revocation | Destroy session | Token blacklist or short TTL |

**Rule:** Web first-party apps use stateful auth. APIs and SPAs use stateless token auth. Never mix both on the same guard.

### Token Authentication Standards

- Token length minimum 64 characters (entropy >= 256 bits)
- Store tokens as SHA-256 hashes — never plaintext
- Implement token rotation on every refresh
- Maximum token lifetime: 1 hour for access tokens, 7 days for refresh tokens
- Support token revocation per user, per device, per token ID

```php
// Token storage schema
Schema::create('personal_access_tokens', function (Blueprint $table) {
    $table->id();
    $table->morphs('tokenable');
    $table->string('name');
    $table->string('token', 64)->unique(); // SHA-256 hash
    $table->text('abilities')->nullable();
    $table->timestamp('last_used_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
});
```

### API Authentication Standards

- All API routes must be authenticated by default
- Public endpoints must be explicitly whitelisted
- Rate limit all endpoints (authenticated: 60/min, unauthenticated: 10/min)
- Return consistent error responses (`401` for unauthenticated, `403` for unauthorized)
- Never expose authentication details in error messages

## Security Boundaries

### Trust Boundaries

```
Internet ──[TLS]──> Load Balancer ──[TLS]──> Application ──> Database
   │                    │                       │                │
   │              TLS termination           Auth checks    Encrypted at rest
   │              Rate limiting             Input validation
   │              IP filtering              CSRF protection
```

- Terminate TLS at the load balancer or reverse proxy
- Re-encrypt traffic between load balancer and application in production
- All authentication cookies must be `Secure`, `HttpOnly`, `SameSite=Strict`
- CORS must be restricted to specific origins, never `*` with credentials

### Authentication Architecture Patterns

#### Pattern 1: First-Party Web App (Laravel + Blade/Inertia)
```
Browser → Session Cookie → Web Middleware → Auth::user()
```
- Use Laravel's built-in session authentication
- CSRF protection via `@csrf` and `VerifyCsrfToken`
- Login throttling via `RateLimiter`

#### Pattern 2: First-Party SPA (Laravel + Vue/React)
```
SPA → Sanctum Cookie → SPA Middleware → Auth::user()
```
- Sanctum SPA authentication with cookie-based session
- CSRF via `sanctum/csrf-cookie` endpoint
- CORS configured for frontend origin

#### Pattern 3: Third-Party API Consumer
```
Client → Bearer Token → api Middleware → Token → Auth::user()
```
- Sanctum personal access tokens or Passport
- Token scopes/abilities for fine-grained access
- Rate limiting per token

#### Pattern 4: Microservice-to-Microservice
```
Service A → Client Credentials → OAuth2 Server → Access Token → Service B
```
- Passport client credentials grant
- Service accounts with limited scopes
- Mutual TLS where possible

#### Pattern 5: External Identity Provider
```
User → Login → Redirect → IdP (Okta/Azure/Keycloak) → Callback → Session
```
- Socialite or SAML for external auth
- OIDC for modern identity federation
- Account linking with existing local users

## Authentication Anti-Patterns

| Anti-Pattern | Why It's Wrong | Solution |
|-------------|---------------|----------|
| Storing passwords in plaintext | Irreversible security breach | Always hash with `Hash::make()` or bcrypt/argon2id |
| Rolling your own crypto | Almost certainly broken | Use Laravel's built-in Hash, Crypt, or standard libraries |
| Session in files on multi-server | Sessions lost on different servers | Use Redis or database sessions |
| Unlimited login attempts | Brute force vulnerability | Rate limit with exponential backoff |
| No CSRF on web forms | Cross-site request forgery | Always use `@csrf` or `VerifyCsrfToken` |
| Exposing auth details in errors | Information leakage | Return generic "Invalid credentials" messages |
| Token in URL parameters | Leak via logs, referrers, bookmarks | Always use Authorization header or secure cookies |
| Perpetual tokens | No way to revoke if stolen | Always set expiration, implement rotation |
| Mixing auth mechanisms on one route | Confusion, security gaps | One guard per route group, explicit middleware |

## Best Practices

1. **Defense in depth** — Never rely on a single security control
2. **Least privilege** — Grant minimum access required for each operation
3. **Fail secure** — Default deny, explicit allow
4. **Complete mediation** — Verify authorization on every request, not just at login
5. **Psychological acceptability** — Make secure path the easiest path
6. **Open design** — Security must not rely on obscurity
7. **Separation of duties** — Require multiple actors for sensitive operations
8. **Economy of mechanism** — Keep auth logic simple and auditable

## AI Coding Agent Rules

1. Always authenticate before authorizing — never skip auth checks
2. Every auth mechanism must have a defined failure mode
3. Never hardcode secrets, keys, or credentials
4. All auth event flows must be logged for audit
5. Session management must handle concurrent sessions explicitly
6. Token operations must include creation, validation, refresh, and revocation
7. Auth middleware must be applied at the route group level, never inline
8. Auth configuration must use environment variables with secure defaults
9. Identity state transitions must be explicit state machine operations
10. Every auth endpoint must have rate limiting applied

## Production Checklist

- [ ] Session driver is `database` or `redis` in production
- [ ] Session cookies are `Secure`, `HttpOnly`, `SameSite=Strict`
- [ ] Login attempts are rate limited
- [ ] Password hashing uses bcrypt (default) or argon2id
- [ ] All API routes have auth middleware by default
- [ ] CORS is restricted to specific origins
- [ ] CSRF protection is enabled on all web routes
- [ ] Token hashing (SHA-256) is enabled for stored tokens
- [ ] Session absolute timeout is configured
- [ ] Auth error messages do not leak user existence
- [ ] All auth state transitions are logged
- [ ] Rate limiters are defined for login, registration, and API
