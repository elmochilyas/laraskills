# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | CSP Nonce/Script-Src/Style-Src Configuration |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Content-Security-Policy (CSP) nonces are one-time tokens that allow specific inline scripts and styles to execute while blocking all others. A cryptographically random nonce is generated per request, attached to the CSP header (`script-src 'nonce-abc123'`), and applied to inline `<script>` and `<style>` tags. CSP nonces are the recommended way to allow inline scripts without using `'unsafe-inline'`. Laravel's `@vite()` directive can automatically include nonces on built assets. The `spatie/laravel-csp` package simplifies CSP nonce management.

---

## Core Concepts

- **Nonce**: A cryptographically random, single-use token generated per HTTP request. Embedded in both the CSP header and the HTML tag.
- **`script-src`**: CSP directive controlling allowed script sources. `'nonce-abc123'` allows scripts with that nonce.
- **`style-src`**: CSP directive controlling allowed style sources. Same nonce pattern applies.
- **`'unsafe-inline'`**: Allows all inline scripts/styles — defeats CSP protection for inline content. Nonces replace this.
- **`strict-dynamic`**: Allows scripts loaded by a nonced script to also execute — useful for JavaScript module loading.
- **Per-Request Nonce**: Nonce must be unique per request. Never reuse nonces across requests.

---

## When To Use

- Applications using inline scripts or styles (most applications)
- Moving from CSP `'unsafe-inline'` to strict CSP
- Applications using JavaScript module loaders or dynamic script injection
- High-security applications requiring strict CSP enforcement

## When NOT To Use

- Applications with no inline scripts or styles (rare — most apps have some inline code)
- Simple static sites with no JavaScript (CSP with hashes is simpler)
- During CSP Report-Only mode with `'unsafe-inline'` (temporary testing)

---

## Best Practices

- **Never Reuse Nonces**: Generate a new cryptographic nonce per request. Reusing nonces defeats the purpose.
- **Use `strict-dynamic`**: Allows scripts loaded by nonced scripts to execute. Simplifies third-party script management.
- **Combine with Hashes**: For static inline scripts/styles, use hashes instead of nonces (nonces are per-request).
- **Laravel Integration**: Use `spatie/laravel-csp` for convenient nonce generation and view injection.
- **Graduate from Report-Only**: Start with `Content-Security-Policy-Report-Only` to monitor violations, then switch to enforced.

---

## Architecture Guidelines

- Generate nonce at the start of each request (middleware)
- Pass nonce to views via a shared variable or service provider
- Attach nonce to CSP header: `Content-Security-Policy: script-src 'nonce-{nonce}';`
- Attach nonce to HTML tags: `<script nonce="{{ $nonce }}">`
- For Vite: `@vite()` with `useNonce()` method in `vite.config.js`
- For Spatie CSP: configure policies and nonce generation in `config/csp.php`

---

## Performance Considerations

- Nonce generation: `random_bytes(32)` — <0.01ms per request — negligible
- Nonce injection: pass to views as shared variable — no overhead
- CSP header size increases slightly with nonce (negligible)
- No database or network overhead

---

## Security Considerations

- **Nonce Uniqueness**: If a nonce is reused across requests, an attacker can craft a script tag with the captured nonce.
- **Nonce Generation**: Must use cryptographically secure random bytes — `random_bytes()` or `Str::random()`.
- **Strict CSP**: Nonces paired with `strict-dynamic` provide strong protection against XSS even with inline scripts.
- **Nonce in Cache**: If HTML is cached, the nonce should be served dynamically (e.g., ESI, hX-Requested-With, or uncached portion of the page).

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Static/reused nonce | Hardcoding nonce string | Anyone can craft a script tag with that nonce | Generate new random nonce per request |
| Using `'unsafe-inline'` with nonces | Redundant configuration | Weakens CSP — unsafe-inline overrides nonce protection | Remove unsafe-inline when using nonces |
| Nonce in cached HTML | Caching full pages | Nonce is stale; scripts may not execute | Use ESI, edge-side includes, or nonce placeholder |
| Not using `strict-dynamic` | Missing CSP feature | Module-loaded scripts without nonce are blocked | Add `strict-dynamic` to script-src |
| Nonce not attached to all script tags | Only external scripts have nonces | Inline scripts blocked (no nonce on tag) | Attach nonce to every script and style tag |

---

## Anti-Patterns

- **`'unsafe-inline'` + `'nonce-...'`**: unsafe-inline overrides nonce — remove unsafe-inline
- **Same nonce for all requests**: Nonce is a one-time use token — must be unique per request
- **Nonce in static HTML files**: Nonces must be dynamically injected per request

---

## Examples

**CSP nonce middleware:**
```php
// app/Http/Middleware/CspNonce.php
public function handle(Request $request, Closure $next): Response
{
    $nonce = base64_encode(random_bytes(32));
    $request->attributes->set('csp_nonce', $nonce);
    
    $response = $next($request);
    
    $response->headers->set('Content-Security-Policy',
        "script-src 'nonce-{$nonce}' 'strict-dynamic';" .
        "style-src 'nonce-{$nonce}';"
    );
    
    return $response;
}
```

**Blade template with nonce:**
```blade
<script nonce="{{ $nonce }}">
    console.log('This inline script is allowed by CSP nonce');
</script>

<style nonce="{{ $nonce }}">
    .highlight { color: red; }
</style>
```

**Spatie CSP package configuration:**
```php
// config/csp.php
return [
    'nonce' => [
        'enabled' => true,
        'length' => 32,
    ],
    'policies' => [
        'base' => [
            'script-src' => [
                "'nonce'",
                "'strict-dynamic'",
            ],
            'style-src' => [
                "'nonce'",
            ],
        ],
    ],
];
```

---

## Related Topics

- Security headers (HSTS, CSP, XFO, etc.)
- Blade XSS prevention
- Vite asset handling

---

## AI Agent Notes

- CSP nonces are the best way to allow inline scripts under strict CSP. Check if the project uses `'unsafe-inline'` — recommend migrating to nonces.
- Nonce generation per request is critical — verify with code review.
- For static inline scripts, hashes are more performant than nonces (no per-request generation).

---

## Verification

- [ ] CSP nonce generated per request (cryptographically random)
- [ ] Nonce attached to all inline `<script>` and `<style>` tags
- [ ] `'unsafe-inline'` removed from script-src when using nonces
- [ ] `strict-dynamic` included for module loading
- [ ] Nonce not reused across requests (verified via testing)
- [ ] Cached HTML pages handle nonces correctly (dynamic injection)
- [ ] CSP in enforced mode (not Report-Only) once nonces are working
- [ ] Reporting endpoint configured for CSP violations
