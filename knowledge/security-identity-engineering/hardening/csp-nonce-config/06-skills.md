# Skill: Configure CSP Nonces for Inline Script and Style Allowlisting

## Purpose
Implement Content-Security-Policy with per-request nonce values for inline scripts and styles, enabling secure loading of application JavaScript without `'unsafe-inline'`.

## When To Use
- Applications using inline JavaScript or CSS that cannot be moved to external files
- CSP with strict script-src policy (blocking all inline scripts except nonced ones)
- Laravel applications with Vite, Livewire, or Alpine.js that inject inline scripts

## When NOT To Use
- Applications with no inline scripts (all JS in external files)
- When `'strict-dynamic'` is sufficient without per-request nonces

## Prerequisites
- Security headers middleware
- CSP header configuration

## Workflow
1. Generate cryptographically random nonce per request using `base64_encode(random_bytes(32))`
2. Share nonce with Blade views via `View::share()` or `$request->attributes`
3. Add nonce to inline script tags: `<script nonce="{{ $nonce }}">`
4. Add nonce to inline style tags: `<style nonce="{{ $nonce }}">`
5. Configure CSP header: `script-src 'nonce-{$nonce}' 'strict-dynamic'`
6. Add `'strict-dynamic'` for allowlisting dynamically loaded scripts
7. Never use `'unsafe-inline'` as substitute for nonces

## Validation Checklist
- [ ] Nonce generated per request (not cached or reused)
- [ ] Nonce shared with Blade views
- [ ] Inline scripts include `nonce="{{ $nonce }}"` attribute
- [ ] CSP header uses `'nonce-{value}'` for script-src
- [ ] `'unsafe-inline'` not used alongside nonces
- [ ] Vite/Livewire/Alpine.js inline scripts nonced correctly
