# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** View & Blade Component Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Test each conditional display branch with `assertSee()` and `assertDontSee()`
- [ ] Apply rule: Test Blade components in isolation using `$this->blade()`
- [ ] Apply rule: Test components with and without optional slots/props
- [ ] Apply rule: Use `assertSee()` for text, `assertSeeHtml()` for HTML structure
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Every conditional display branch tested (assertSee + assertDontSee)
- [ ] Components tested in isolation via `$this->blade()`
- [ ] Optional slots/props tested with and without content
- [ ] `assertSee()` for text, `assertSeeHtml()` for HTML structure
- [ ] View data verified with `assertViewHas()`
- [ ] Avoid: Mistake
- [ ] Avoid: Using `assertSee()` on dynamic data
- [ ] Avoid: Not testing conditional display

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`assertSee()` vs `assertSeeHtml()`**: Use `assertSee()` for text content (strips HTML). Use `assertSeeHtml()` for asserting HTML tags exist.
- **Isolated component tests vs full HTTP tests**: Component tests are fast (~5ms). HTTP tests catch integration issues (~40ms). Use both.
- **Inertia vs Blade testing**: Inertia uses `assertInertia()` for props/component. Blade uses `assertSee()` and `assertViewHas()`. Different assertion toolkits.
- **View data vs rendered output**: Test view data (`assertViewHas()`) when you care about controller output. Test rendered output when you care about display logic.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Test each conditional display branch with `assertSee()` and `assertDontSee()`
- [ ] Follow rule: Test Blade components in isolation using `$this->blade()`
- [ ] Follow rule: Test components with and without optional slots/props
- [ ] Follow rule: Use `assertSee()` for text, `assertSeeHtml()` for HTML structure
- [ ] Follow rule: Assert view data with `assertViewHas()` for controller output verification
- [ ] Follow rule: Test that XSS in user-provided data is properly escaped
- [ ] - [ ] Every conditional display branch tested (assertSee + assertDontSee)
- [ ] - [ ] Components tested in isolation via `$this->blade()`
- [ ] - [ ] Optional slots/props tested with and without content
- [ ] - [ ] `assertSee()` for text, `assertSeeHtml()` for HTML structure

# Performance Checklist
- `assertSee()` is a simple string search: <0.1ms per assertion.
- HTML parsing (DOMDocument): 1-5ms for large responses. Use sparingly.
- Component rendering via `$this->blade()`: ~5ms vs ~40ms for full HTTP request.
- Inertia page extraction: <0.5ms.

# Security Checklist
- Test that XSS in user-provided data is properly escaped in views.
- Test that CSRF tokens are present in forms.
- Test that sensitive data (roles, permissions, PII) is not displayed to unauthorized users.
- Test that error messages don't leak sensitive information.

# Reliability Checklist
- [ ] Ensure: View and Blade component testing verifies that templates render correct output, ...
- [ ] Verify: Test each conditional display branch with `assertSee()` and `assertDontSee()`
- [ ] Verify: Test Blade components in isolation using `$this->blade()`
- [ ] Verify: Test components with and without optional slots/props
- [ ] Verify: Use `assertSee()` for text, `assertSeeHtml()` for HTML structure

# Testing Checklist
- [ ] Every conditional display branch tested (assertSee + assertDontSee)
- [ ] Components tested in isolation via `$this->blade()`
- [ ] Optional slots/props tested with and without content
- [ ] `assertSee()` for text, `assertSeeHtml()` for HTML structure
- [ ] View data verified with `assertViewHas()`
- [ ] XSS escaping tested for user-provided content
- [ ] Avoid: Mistake
- [ ] Avoid: Using `assertSee()` on dynamic data
- [ ] Avoid: Not testing conditional display

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Test each conditional display branch with `assertSee()` and `assertDontSee()`
- [ ] Apply: Test Blade components in isolation using `$this->blade()`
- [ ] Apply: Test components with and without optional slots/props
- [ ] Apply: Use `assertSee()` for text, `assertSeeHtml()` for HTML structure

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using `assertSee()` on dynamic data
- [ ] Avoid mistake: Not testing conditional display
- [ ] Avoid mistake: Asserting exact HTML output
- [ ] Avoid mistake: Not testing fallback/default content

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
## Rules
- Test each conditional display branch with `assertSee()` and `assertDontSee()`
- Test Blade components in isolation using `$this->blade()`
- Test components with and without optional slots/props
- Use `assertSee()` for text, `assertSeeHtml()` for HTML structure
- Assert view data with `assertViewHas()` for controller output verification
- Test that XSS in user-provided data is properly escaped
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Blade Components and View Rendering


