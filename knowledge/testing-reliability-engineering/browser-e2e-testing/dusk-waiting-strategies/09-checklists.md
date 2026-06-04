# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Browser & E2E Testing
**Knowledge Unit:** Dusk Waiting Strategies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Prefer `waitFor()` Over `pause()`
- [ ] Apply rule: Always Perform the Trigger Action Before Waiting
- [ ] Apply rule: Set Default Wait Timeout to 5 Seconds
- [ ] Apply rule: Never Add `pause()` After `waitFor()`
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] No `pause()` calls in test code
- [ ] `waitFor()` uses reasonable timeouts (5-10s default, 15s for slow pages)
- [ ] `waitForText()` is used for text-based waiting instead of element waiting
- [ ] `waitForLocation()` is used after navigation actions
- [ ] `waitUntil()` is used for custom JavaScript conditions
- [ ] Avoid: Mistake
- [ ] Avoid: Using `pause()` as default waiting
- [ ] Avoid: Waiting too long by default

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Wait time configuration**: Set global timeout in `DuskTestCase` constructor to 5 seconds. Override per-wait for specific needs.
- **CI vs local timeouts**: CI runners may be slower. Use `$browser->waitFor('@element', 10)` in CI-specific configuration.
- **LiveWire-specific waiting**: Livewire updates DOM asynchronously. Use `waitForText()` after `->click()` or `->type()` that triggers Livewire updates.
- **Polling behavior**: Dusk polls every 250ms. Understanding this helps debug wait timing issues.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Prefer `waitFor()` Over `pause()`
- [ ] Follow rule: Always Perform the Trigger Action Before Waiting
- [ ] Follow rule: Set Default Wait Timeout to 5 Seconds
- [ ] Follow rule: Never Add `pause()` After `waitFor()`
- [ ] Follow rule: Use `waitForLocation()` for URL Change Assertions
- [ ] Follow rule: Use `whenAvailable()` for Async Modals and Dialogs
- [ ] - [ ] No `pause()` calls in test code
- [ ] - [ ] `waitFor()` uses reasonable timeouts (5-10s default, 15s for slow pages)
- [ ] - [ ] `waitForText()` is used for text-based waiting instead of element waiting
- [ ] - [ ] `waitForLocation()` is used after navigation actions

# Performance Checklist
- `waitFor()` polling: 250ms interval. First poll returns immediately if element exists. Average overhead <125ms.
- `waitForText()`: Full page source scan each poll. For large DOM, adds ~5-10ms per poll.
- `pause()`: Always blocks for the full duration. A 3-second pause wastes ~2.9s on average.
- `whenAvailable()`: Adds one `waitFor()` plus callback execution. Similar overhead to manual `waitFor()` + interaction.
- Implicit page load wait: Waits for `document.readyState === 'complete'`. Can take seconds for JS-heavy SPAs.

# Security Checklist
- No direct security implications. Waiting strategies don't affect application security posture.
- Long timeouts on slow CI pages could mask performance degradation that might have security implications (DoS via slow responses).

# Reliability Checklist
- [ ] Ensure: Dusk waiting strategies control how browser tests handle time-dependent page sta...
- [ ] Verify: Always Prefer `waitFor()` Over `pause()`
- [ ] Verify: Always Perform the Trigger Action Before Waiting
- [ ] Verify: Set Default Wait Timeout to 5 Seconds
- [ ] Verify: Never Add `pause()` After `waitFor()`

# Testing Checklist
- [ ] No `pause()` calls in test code
- [ ] `waitFor()` uses reasonable timeouts (5-10s default, 15s for slow pages)
- [ ] `waitForText()` is used for text-based waiting instead of element waiting
- [ ] `waitForLocation()` is used after navigation actions
- [ ] `waitUntil()` is used for custom JavaScript conditions
- [ ] `whenAvailable()` is used for iframes and modals
- [ ] Avoid: Mistake
- [ ] Avoid: Using `pause()` as default waiting
- [ ] Avoid: Waiting too long by default

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Prefer `waitFor()` Over `pause()`
- [ ] Apply: Always Perform the Trigger Action Before Waiting
- [ ] Apply: Set Default Wait Timeout to 5 Seconds
- [ ] Apply: Never Add `pause()` After `waitFor()`

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using `pause()` as default waiting
- [ ] Avoid mistake: Waiting too long by default
- [ ] Avoid mistake: Waiting for elements that don't exist yet
- [ ] Avoid mistake: Using pause() after waitFor()

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
- Always Prefer `waitFor()` Over `pause()`
- Always Perform the Trigger Action Before Waiting
- Set Default Wait Timeout to 5 Seconds
- Never Add `pause()` After `waitFor()`
- Use `waitForLocation()` for URL Change Assertions
- Use `whenAvailable()` for Async Modals and Dialogs
- Use `waitUntilMissing()` for Loading Indicators
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Implement Waiting Strategies in Dusk


