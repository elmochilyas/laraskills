# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** Blade auto-escaping and XSS prevention
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No {!! !!} Audit**: Codebase has never been grepped for raw output usage
- [ ] Prevent anti-pattern: No HTML Sanitizer**: Rich text stored without HTMLPurifier or DOMPurify
- [ ] Prevent anti-pattern: Blade XSS Tunneling**: Escaped content passed through `{!! !!}` in parent templates
- [ ] User-provided content rendered with `{{ }}` (auto-escaped)
- [ ] `{!! !!}` only used for trusted HTML, never user input
- [ ] HTML sanitization applied for rich text content
- [ ] CSP configured with strict script-src as secondary defense
- [ ] JSON passed to JavaScript via `@json`, not manual string interpolation
- [ ] Avoid: Mistake
- [ ] Avoid: Using `{!! !!}` without sanitization
- [ ] Avoid: Forgetting to escape in JavaScript context

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- `{{ }}` is the default Blade output syntax â€” always use it unless you have a specific reason not to
- `{!! !!}` usage should be limited and audited â€” grep for `{!!` in the codebase
- Rich text rendering: sanitize with HTMLPurifier or similar, then output with `{!! !!}`
- JavaScript embedding: `@json()` for data, `{{ }}` for strings in JS contexts (remember to use quotes)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] User-provided content rendered with `{{ }}` (auto-escaped)
- [ ] - [ ] `{!! !!}` only used for trusted HTML, never user input
- [ ] - [ ] HTML sanitization applied for rich text content
- [ ] - [ ] CSP configured with strict script-src as secondary defense

# Performance Checklist
- `htmlspecialchars()` is fast â€” ~0.001ms per call
- HTML sanitization (HTMLPurifier) is slow â€” ~10-50ms per render. Cache sanitized output
- CSP parsing: browser-side â€” no server impact

# Security Checklist
- **XSS is the Most Common Web Vulnerability**: Blade's auto-escaping prevents the majority of XSS attacks automatically.
- **`{!! !!}` is the #1 XSS Vector**: Every `{!! !!}` usage is a potential XSS vulnerability if the content is not sanitized.
- **Context Matters**: HTML escaping does not protect against JavaScript context attacks. Use `@json()` for JS, URL encoding for URLs.
- **CSP Mitigation**: Even with proper escaping, CSP prevents exploitation if an escaping bypass is discovered.

# Reliability Checklist
- [ ] Ensure: Blade's `{{ $var }}` syntax automatically escapes output using PHP's `htmlspecia...

# Testing Checklist
- [ ] User-provided content rendered with `{{ }}` (auto-escaped)
- [ ] `{!! !!}` only used for trusted HTML, never user input
- [ ] HTML sanitization applied for rich text content
- [ ] CSP configured with strict script-src as secondary defense
- [ ] JSON passed to JavaScript via `@json`, not manual string interpolation
- [ ] Avoid: Mistake
- [ ] Avoid: Using `{!! !!}` without sanitization
- [ ] Avoid: Forgetting to escape in JavaScript context

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No {!! !!} Audit**: Codebase has never been grepped for raw output usage
- [ ] Prevent: No HTML Sanitizer**: Rich text stored without HTMLPurifier or DOMPurify
- [ ] Prevent: Blade XSS Tunneling**: Escaped content passed through `{!! !!}` in parent templates
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using `{!! !!}` without sanitization
- [ ] Avoid mistake: Forgetting to escape in JavaScript context
- [ ] Avoid mistake: Not escaping in HTML attributes
- [ ] Avoid mistake: Relying solely on CSP

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
- No {!! !!} Audit**: Codebase has never been grepped for raw output usage
- No HTML Sanitizer**: Rich text stored without HTMLPurifier or DOMPurify
- Blade XSS Tunneling**: Escaped content passed through `{!! !!}` in parent templates
## Skills
- Prevent XSS in Blade Templates with Proper Escaping


