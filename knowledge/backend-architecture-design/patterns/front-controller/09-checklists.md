# Front Controller pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Front Controller
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand HTTP request lifecycle and middleware
- [ ] Know Laravel's `public/index.php` bootstrap process
- [ ] Familiar with routing and controller resolution

## Implementation Checklist
- [ ] All HTTP requests enter through `public/index.php`
- [ ] Common pre-processing (routing, auth, logging) centralized in front controller
- [ ] Middleware configured with correct order (global vs route middleware)
- [ ] Cross-cutting concerns handled at controller/front-controller level
- [ ] Route caching configured for production

## Verification Checklist
- [ ] No requests bypass the front controller
- [ ] No business logic added to `index.php`
- [ ] Middleware order produces expected behavior
- [ ] Route caching works correctly
- [ ] Static file serving bypasses front controller (web server handles directly)

## Security Checklist
- [ ] Security middleware (auth, CSRF, rate limiting) applied at front controller level
- [ ] Input validation at application boundaries
- [ ] All routes registered through proper routing mechanism

## Performance Checklist
- [ ] Laravel bootstrap (index.php → kernel → router) ~20-50ms per request
- [ ] Octane amortizes bootstrap cost (boot once, handle many requests)
- [ ] Route caching reduces route registration overhead
- [ ] Static file serving bypasses PHP entirely

## Production Readiness Checklist
- [ ] Bootstrap performance acceptable for traffic volume
- [ ] Octane considered for high-traffic applications
- [ ] Middleware stack optimized (remove unused middleware)
- [ ] Route caching enabled in production

## Common Mistakes to Avoid
- [ ] Adding logic to `index.php` (not testable, bypasses framework lifecycle)
- [ ] Bypassing front controller (routes not registered, middleware not applied)
- [ ] Duplicating front controller logic in page controllers (inconsistent behavior)
- [ ] Not understanding middleware order (global vs route middleware)
