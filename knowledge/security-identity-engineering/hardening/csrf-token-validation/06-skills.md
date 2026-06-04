# Skill: Configure CSRF Token Validation for All State-Changing Routes

## Purpose
Ensure CSRF protection is active on all state-changing routes, with token exclusion only for documented, intentional exceptions (e.g., webhook endpoints).

## When To Use
- Every web application with browser-based clients
- Routes accepting POST, PUT, PATCH, DELETE from browser forms
- Protecting against cross-site request forgery attacks

## When NOT To Use
- Stateless API routes using token-based auth (Bearer tokens, API keys)
- Webhook endpoints receiving requests from external services (add to `$except`)
- GET/HEAD routes (read-only, no CSRF needed)

## Prerequisites
- Laravel's `VerifyCsrfToken` middleware in HTTP kernel
- CSRF token in forms: `@csrf` Blade directive

## Workflow
1. Verify `VerifyCsrfToken` middleware is in the `web` middleware group
2. Add `@csrf` to all Blade forms sending POST, PUT, PATCH, DELETE
3. For SPAs using Sanctum cookie auth: call `/sanctum/csrf-cookie` before mutating requests
4. Exclude only webhook routes from CSRF in `app/Http/Middleware/VerifyCsrfToken.php`
5. Never exclude routes without documented justification
6. Use XSRF-TOKEN cookie (set by Sanctum) for SPA JavaScript requests
7. Test CSRF-protected routes: verify 419 on missing token, 200 on valid token

## Validation Checklist
- [ ] `VerifyCsrfToken` middleware in `web` middleware group
- [ ] `@csrf` in all Blade POST/PUT/PATCH/DELETE forms
- [ ] SPA calls `/sanctum/csrf-cookie` before mutating requests
- [ ] Webhook routes in `$except` with documented justification
- [ ] No routes excluded without clear documentation
- [ ] CSRF excluded routes tested for alternative protection (signature, IP allowlist)
