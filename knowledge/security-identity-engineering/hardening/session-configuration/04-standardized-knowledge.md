# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | Session Configuration (secure, http_only, same_site) |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Session configuration in Laravel's `config/session.php` controls the security properties of session cookies. Three critical settings: **`secure`** (HTTPS-only cookie), **`http_only`** (inaccessible to JavaScript), and **`same_site`** (cross-origin request behavior). Additional settings: **`encrypt`** (encrypt session data), driver selection (`database`, `redis`, `file`), and **`lifetime`** (session expiry). Proper session configuration prevents session hijacking, session fixation, and XSS-based session theft.

---

## Core Concepts

- **`secure`**: When `true`, the session cookie is only sent over HTTPS. Prevents session cookie interception on unencrypted connections.
- **`http_only`**: When `true`, JavaScript cannot access the cookie (`document.cookie`). Prevents XSS-based session theft.
- **`same_site`**: `lax` (default) — cookie sent for top-level navigation GET requests. `strict` — cookie not sent for cross-origin requests. `none` — cookie sent for all requests (requires `secure=true`).
- **`encrypt`**: When `true`, session data is encrypted using Laravel's encryption (requires APP_KEY).
- **`driver`**: `file` (default, not for production), `database` (scales), `redis` (fast, distributed), `cookie` (session in cookie), `dynamodb`.

---

## When To Use

- Every Laravel application — these settings are mandatory for production
- HTTPS-only applications: `secure = true`
- Any application with user sessions: `http_only = true` (always)
- SPAs with Sanctum cookie auth: `same_site = lax` or `none` (with `secure = true`)

## When NOT To Use

- `same_site = none` without HTTPS (browsers reject `none` without `secure`)
- `http_only = false` — only if you absolutely need JS access to session cookie (almost never)
- `driver = file` in production — file sessions don't scale across multiple web servers

---

## Best Practices

- **Production Session Driver**: Use `redis` for high-performance distributed setups, `database` for moderate scale, never `file` for multi-server deployments.
- **HTTPS Only**: Set `secure = true` in production. Sessions should never be sent over unencrypted connections.
- **Always `http_only = true`**: Prevents XSS-based session theft. There is almost never a legitimate reason to set this to `false`.
- **Regenerate Session ID on Login**: `session()->regenerate()` prevents session fixation. Laravel does this in Fortify and Starter Kits — verify for custom auth.

---

## Architecture Guidelines

- Session driver: `redis` for production (fast, shared across servers). `database` as fallback.
- `secure`: `true` in production. `false` in local dev (no HTTPS).
- `http_only`: `true` always. No exceptions unless explicitly justified.
- `same_site`: `lax` for most applications. `none` for Sanctum SPA subdomain auth (requires `secure=true`).
- `encrypt`: `false` by default. Enable for high-security applications (adds encryption overhead).
- Session ID regenerated after login (`session()->regenerate()`)

---

## Performance Considerations

- File sessions: single-server only, slow under concurrency
- Database sessions: moderate performance, scales horizontally
- Redis sessions: fastest, ideal for distributed deployments
- Encrypted sessions: adds ~0.1-0.5ms encryption/decryption per request
- Session GC (garbage collection): `php artisan session:gc` or automatic via config

---

## Security Considerations

- **Session Hijacking**: `http_only = true` prevents XSS-based theft. `secure = true` prevents network interception. `same_site` prevents CSRF-based session exploitation.
- **Session Fixation**: `session()->regenerate()` after login prevents fixation. Verify this is called.
- **Session Lifetime**: Set appropriately — too long increases hijacking window, too short frustrates users. 120 minutes is default.
- **Session ID Entropy**: Laravel's session IDs are cryptographically random — no additional entropy needed.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| `secure = false` in production | Forgetting to configure | Session cookie sent over HTTP — intercepted | Set `secure = true` in production `.env` |
| `http_only = false` | Debugging convenience | XSS can steal session cookie | Always `http_only = true` |
| `same_site = none` without `secure` | Copying Sanctum config without HTTPS | Browser rejects cookie (modern browsers require secure for none) | Set `secure = true` when using `same_site = none` |
| File driver in production | Default config unchanged | Sessions lost when load balancer distributes requests | Use Redis or database driver |
| Not regenerating session after login | Missing `session()->regenerate()` | Session fixation vulnerability | Always regenerate after login |

---

## Anti-Patterns

- **`http_only = false` for "convenience"**: JS should never need access to the session cookie
- **`driver = file` on multi-server**: Sessions are lost between requests
- **Not setting `secure = true` on HTTPS-only applications**: Sessions leak on HTTP redirects
- **`same_site = none` without `secure`**: Modern browsers reject this combination

---

## Examples

**Production session config:**
```php
// config/session.php
'driver' => env('SESSION_DRIVER', 'redis'),
'lifetime' => env('SESSION_LIFETIME', 120),
'expire_on_close' => env('SESSION_EXPIRE_ON_CLOSE', false),
'encrypt' => env('SESSION_ENCRYPT', false),
'http_only' => true,
'same_site' => env('SESSION_SAME_SITE', 'lax'),
```

**.env:**
```dotenv
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_SAME_SITE=lax
# For Sanctum SPA subdomain auth:
# SANCTUM_STATEFUL_DOMAINS=sub.example.com
# SESSION_DOMAIN=.example.com
# SESSION_SAME_SITE=none
```

**Session regeneration after login:**
```php
if (Auth::attempt($credentials)) {
    $request->session()->regenerate();
    return redirect()->intended('dashboard');
}
```

---

## Related Topics

- Sanctum SPA vs Token auth (session requirements)
- CSRF protection (session dependency)
- Security headers (HSTS, CSP)
- Authentication middleware

---

## AI Agent Notes

- Session configuration is a common security gap — check `config/session.php` for production-appropriate settings.
- `http_only = true` is mandatory. If it's `false`, flag it immediately.
- File session driver in production is the most common scaling mistake — recommend Redis or database.

---

## Verification

- [ ] `http_only` set to `true`
- [ ] `secure` set to `true` in production (`.env` or config)
- [ ] `same_site` configured appropriately (`lax` for most, `none` for Sanctum SPA subdomain)
- [ ] Session driver is NOT `file` in production
- [ ] Session regenerated after login (`session()->regenerate()`)
- [ ] Session lifetime appropriate (not too long)
- [ ] `SESSION_DOMAIN` configured for Sanctum SPA subdomain auth (if applicable)
- [ ] Encrypted sessions considered for high-security requirements
- [ ] Session GC configured (automatic or scheduled)
