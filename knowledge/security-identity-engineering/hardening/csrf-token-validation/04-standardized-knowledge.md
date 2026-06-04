# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | CSRF Token Exchange and Validation |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Cross-Site Request Forgery (CSRF) protection in Laravel uses a token-based validation system. The `VerifyCsrfToken` middleware automatically checks for a CSRF token on all state-changing requests (POST, PUT, PATCH, DELETE). In Blade, the `@csrf` directive generates a hidden input with the token. For SPAs using Sanctum, the `/sanctum/csrf-cookie` endpoint sets an `XSRF-TOKEN` cookie that Axios automatically sends back. CSRF tokens are tied to the user session and expire when the session expires. API routes in `api.php` are excluded from CSRF protection by default (they use token-based auth instead).

---

## Core Concepts

- **CSRF Attack**: An attacker tricks an authenticated user into submitting a state-changing request to your application from another site.
- **CSRF Token**: A random value stored in the session. Validated against a token submitted with each state-changing request.
- **`@csrf` Directive**: Blade directive that creates a hidden `_token` input field with the CSRF token value.
- **`VerifyCsrfToken` Middleware**: Included in the `web` middleware group. Validates `_token` parameter or `X-CSRF-TOKEN`/`X-XSRF-TOKEN` header.
- **API Route Exclusion**: Routes in `routes/api.php` are excluded from CSRF protection — they use token-based authentication (Bearer tokens) which is inherently CSRF-resistant.

---

## When To Use

- Every web route with state-changing operations (POST, PUT, PATCH, DELETE)
- Forms rendered with Blade (`@csrf`)
- SPA cookie-based authentication (Sanctum)

## When NOT To Use

- API routes using token-based auth (Bearer tokens are not subject to CSRF)
- Routes that only perform GET/HEAD operations (read-only)
- Stateless API endpoints (no session — CSRF requires session)

---

## Best Practices

- **Always Use `@csrf` in Forms**: Every Blade form with POST/PUT/PATCH/DELETE must include `@csrf`.
- **SPA CSRF Flow**: Call `/sanctum/csrf-cookie` before making login requests. Axios sends the `XSRF-TOKEN` automatically.
- **API Exceptions Are Safe**: Routes in `routes/api.php` are excluded from CSRF by design — do not add CSRF middleware to them.
- **Never Disable Globally**: Only exclude specific routes from CSRF when absolutely necessary (webhook handlers, external services). Document each exclusion.

---

## Architecture Guidelines

- CSRF middleware in `web` middleware group (default — do not remove)
- `@csrf` in every Blade form — never skip it
- SPA: Sanctum's `/sanctum/csrf-cookie` + Axios `withCredentials: true`
- CSRF token is regenerated on session regeneration (login/logout)
- Exclude non-standard routes in `VerifyCsrfToken::$except` array — document each

---

## Performance Considerations

- CSRF validation is a session comparison — ~0.1ms per request
- No database queries — purely session-based
- Token generation happens once per session creation

---

## Security Considerations

- **Session Dependency**: CSRF protection depends on the session. Stateless API routes cannot use CSRF (use tokens instead).
- **Token in Cookie (Sanctum)**: The `XSRF-TOKEN` cookie is readable by JavaScript — necessary for Axios to auto-send it. The session cookie (`laravel_session`) remains `httpOnly`.
- **Same-Site Cookies**: `same_site=lax` in session config provides additional CSRF protection for same-domain forms.
- **CSRF on API Routes**: Do NOT add CSRF to API routes — they use token auth. Adding CSRF breaks API clients that don't send the token.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forgetting `@csrf` in forms | Copying form without token | All POST requests fail with 419 | Use `@csrf` in every form |
| Adding CSRF to API routes | Assuming consistency | API clients get 419 errors | API routes are stateless — use token auth |
| Excluding CSRF on all routes | Debugging convenience | No CSRF protection on web routes | Only exclude specific routes; document |
| Not calling `/sanctum/csrf-cookie` | SPA without Sanctum setup | Login requests fail with 419 | Call CSRF cookie endpoint before login |

---

## Anti-Patterns

- **Disabling CSRF globally**: Leaves your application vulnerable to CSRF attacks
- **Requiring CSRF token on API endpoints**: Breaks third-party API clients
- **CSRF token in GET URLs**: Tokens can leak via referrer headers, server logs, and browser history

---

## Examples

**Blade form with CSRF:**
```blade
<form method="POST" action="/posts">
    @csrf
    <input name="title" />
    <button type="submit">Create</button>
</form>
```

**SPA Axios setup (Sanctum):**
```javascript
// First: get CSRF cookie
await axios.get('/sanctum/csrf-cookie');
// Then: login — Axios sends XSRF-TOKEN from cookie
await axios.post('/login', { email, password });
```

**Excluding routes from CSRF:**
```php
// app/Http/Middleware/VerifyCsrfToken.php
protected $except = [
    'webhook/stripe',
    'webhook/sendgrid',
];
```

---

## Related Topics

- Session configuration (secure, http_only, same_site)
- Sanctum SPA vs Token auth
- CORS configuration
- Mass assignment protection

---

## AI Agent Notes

- CSRF is the most common cause of 419 errors in Laravel. First debugging step: check `@csrf` in forms and Sanctum CSRF cookie for SPAs.
- Check the `VerifyCsrfToken::$except` array — too many exclusions indicate a security concern.
- If API routes have CSRF issues, the client is misconfigured (not sending Bearer token) — don't add CSRF to API routes.

---

## Verification

- [ ] All Blade forms include `@csrf`
- [ ] SPA authentication calls `/sanctum/csrf-cookie` before login
- [ ] `VerifyCsrfToken` middleware in web group (not removed)
- [ ] Route exceptions in `$except` array are minimal and documented
- [ ] API routes do not have CSRF middleware
- [ ] Sanctum SPA configured with `withCredentials: true`
- [ ] Session cookie configured with `same_site=lax` or `strict`
- [ ] CSRF token regenerated on login/logout
