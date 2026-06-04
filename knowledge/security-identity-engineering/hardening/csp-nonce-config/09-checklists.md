# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** CSP nonce/script-src/style-src configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Nonce Generated in Partial Views**: Multiple nonces per request, inconsistent
- [ ] Prevent anti-pattern: No CSP Reporting Endpoint**: Violations undetected in both Report-Only and enforce mode
- [ ] Prevent anti-pattern: Nonce Applied to All Directives**: Nonce used in `img-src` or `font-src` which don't support it
- [ ] Nonce generated per request (not cached or reused)
- [ ] Nonce shared with Blade views
- [ ] Inline scripts include `nonce="{{ $nonce }}"` attribute
- [ ] CSP header uses `'nonce-{value}'` for script-src
- [ ] `'unsafe-inline'` not used alongside nonces
- [ ] Avoid: Mistake
- [ ] Avoid: Static/reused nonce
- [ ] Avoid: Using `'unsafe-inline'` with nonces

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Generate nonce at the start of each request (middleware)
- Pass nonce to views via a shared variable or service provider
- Attach nonce to CSP header: `Content-Security-Policy: script-src 'nonce-{nonce}';`
- Attach nonce to HTML tags: `<script nonce="{{ $nonce }}">`
- For Vite: `@vite()` with `useNonce()` method in `vite.config.js`
- For Spatie CSP: configure policies and nonce generation in `config/csp.php`

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Nonce generated per request (not cached or reused)
- [ ] - [ ] Nonce shared with Blade views
- [ ] - [ ] Inline scripts include `nonce="{{ $nonce }}"` attribute
- [ ] - [ ] CSP header uses `'nonce-{value}'` for script-src

# Performance Checklist
- Nonce generation: `random_bytes(32)` â€” <0.01ms per request â€” negligible
- Nonce injection: pass to views as shared variable â€” no overhead
- CSP header size increases slightly with nonce (negligible)
- No database or network overhead

# Security Checklist
- **Nonce Uniqueness**: If a nonce is reused across requests, an attacker can craft a script tag with the captured nonce.
- **Nonce Generation**: Must use cryptographically secure random bytes â€” `random_bytes()` or `Str::random()`.
- **Strict CSP**: Nonces paired with `strict-dynamic` provide strong protection against XSS even with inline scripts.
- **Nonce in Cache**: If HTML is cached, the nonce should be served dynamically (e.g., ESI, hX-Requested-With, or uncached portion of the page).

# Reliability Checklist
- [ ] Ensure: Content-Security-Policy (CSP) nonces are one-time tokens that allow specific inl...

# Testing Checklist
- [ ] Nonce generated per request (not cached or reused)
- [ ] Nonce shared with Blade views
- [ ] Inline scripts include `nonce="{{ $nonce }}"` attribute
- [ ] CSP header uses `'nonce-{value}'` for script-src
- [ ] `'unsafe-inline'` not used alongside nonces
- [ ] Vite/Livewire/Alpine.js inline scripts nonced correctly
- [ ] Avoid: Mistake
- [ ] Avoid: Static/reused nonce
- [ ] Avoid: Using `'unsafe-inline'` with nonces

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Nonce Generated in Partial Views**: Multiple nonces per request, inconsistent
- [ ] Prevent: No CSP Reporting Endpoint**: Violations undetected in both Report-Only and enforce mode
- [ ] Prevent: Nonce Applied to All Directives**: Nonce used in `img-src` or `font-src` which don't support it
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Static/reused nonce
- [ ] Avoid mistake: Using `'unsafe-inline'` with nonces
- [ ] Avoid mistake: Nonce in cached HTML
- [ ] Avoid mistake: Not using `strict-dynamic`

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- Nonce Generated in Partial Views**: Multiple nonces per request, inconsistent
- No CSP Reporting Endpoint**: Violations undetected in both Report-Only and enforce mode
- Nonce Applied to All Directives**: Nonce used in `img-src` or `font-src` which don't support it
## Skills
- Configure CSP Nonces for Inline Script and Style Allowlisting


