# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Browser & E2E Testing
**Knowledge Unit:** Dusk Selectors, Page Objects, Components
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Use `@dusk` Attributes for All Interactive Elements
- [ ] Apply rule: Use Page Objects for Pages with >3 Interactive Elements
- [ ] Apply rule: Use Components for Reusable UI Widgets
- [ ] Apply rule: Use `within()` for Scoped Assertions
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Every interactive element has a `@dusk` selector in the view
- [ ] Page Objects exist for pages used in 2+ tests
- [ ] Page Object `url()` returns the correct route
- [ ] Page Object `elements()` returns all key selectors
- [ ] Component classes exist for reusable UI elements
- [ ] Avoid: Mistake
- [ ] Avoid: Using CSS classes as primary selectors
- [ ] Avoid: Page objects with too many methods

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Selector priority**: `@dusk` attributes > named elements from page objects > CSS selectors > XPath. Always prefer the most stable option.
- **Placement**: Store page objects in `tests/Browser/Pages/` and components in `tests/Browser/Components/`.
- **Naming convention**: Use semantic, purpose-revealing names. `@submit-btn` is better than `@btn-1` or `@green-button`.
- **Dynamic selectors**: Use CSS selectors for elements that cannot have `@dusk` attributes (third-party widgets, dynamically injected HTML from external services).

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Use `@dusk` Attributes for All Interactive Elements
- [ ] Follow rule: Use Page Objects for Pages with >3 Interactive Elements
- [ ] Follow rule: Use Components for Reusable UI Widgets
- [ ] Follow rule: Use `within()` for Scoped Assertions
- [ ] Follow rule: Limit Page Object Methods to Those Used by 2+ Tests
- [ ] Follow rule: Follow Selector Priority: `@dusk` > Page Object Named Elements > CSS > XPath
- [ ] - [ ] Every interactive element has a `@dusk` selector in the view
- [ ] - [ ] Page Objects exist for pages used in 2+ tests
- [ ] - [ ] Page Object `url()` returns the correct route
- [ ] - [ ] Page Object `elements()` returns all key selectors

# Performance Checklist
- `@dusk` selector resolution: <1ms per query (CSS attribute selector).
- Page object method calls: Negligible overhead.
- Component `within()` scoping: Adds ~5-10ms (DOM query for root element).
- `whenAvailable()`: Polls every 250ms until timeout (default 5s). Use explicit wait times for slow elements.

# Security Checklist
- `@dusk` attributes are visible in rendered HTML. Avoid exposing sensitive information through attribute values (e.g., don't use `@dusk="user-1-secret-token"`).
- `@dusk` attributes appear in production HTML if not stripped. Consider stripping them in production builds for cleaner HTML output.

# Reliability Checklist
- [ ] Ensure: Dusk selectors, page objects, and components provide structured access to DOM el...
- [ ] Verify: Always Use `@dusk` Attributes for All Interactive Elements
- [ ] Verify: Use Page Objects for Pages with >3 Interactive Elements
- [ ] Verify: Use Components for Reusable UI Widgets
- [ ] Verify: Use `within()` for Scoped Assertions

# Testing Checklist
- [ ] Every interactive element has a `@dusk` selector in the view
- [ ] Page Objects exist for pages used in 2+ tests
- [ ] Page Object `url()` returns the correct route
- [ ] Page Object `elements()` returns all key selectors
- [ ] Component classes exist for reusable UI elements
- [ ] Tests reference `@dusk` selectors, not CSS classes or XPath
- [ ] Avoid: Mistake
- [ ] Avoid: Using CSS classes as primary selectors
- [ ] Avoid: Page objects with too many methods

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Use `@dusk` Attributes for All Interactive Elements
- [ ] Apply: Use Page Objects for Pages with >3 Interactive Elements
- [ ] Apply: Use Components for Reusable UI Widgets
- [ ] Apply: Use `within()` for Scoped Assertions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using CSS classes as primary selectors
- [ ] Avoid mistake: Page objects with too many methods
- [ ] Avoid mistake: Not using within() for component scoping
- [ ] Avoid mistake: Complex selector chains in tests

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
- Always Use `@dusk` Attributes for All Interactive Elements
- Use Page Objects for Pages with >3 Interactive Elements
- Use Components for Reusable UI Widgets
- Use `within()` for Scoped Assertions
- Limit Page Object Methods to Those Used by 2+ Tests
- Follow Selector Priority: `@dusk` > Page Object Named Elements > CSS > XPath
- Never Use Complex CSS Selector Chains in Test Files
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Use Dusk Selectors and Page Objects


