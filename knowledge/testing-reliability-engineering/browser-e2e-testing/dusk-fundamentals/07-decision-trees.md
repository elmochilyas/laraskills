# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Browser & E2E Testing
**Knowledge Unit:** Laravel Dusk Fundamentals
**Generated:** 2026-06-03

---

# Decision Inventory

1. Dusk vs Pest Playwright for browser testing
2. waitFor() vs pause() timing strategy
3. @dusk selectors vs CSS class selectors
4. How many browser tests vs feature tests

---

# Architecture-Level Decision Trees

---

## Decision Name: Dusk vs Pest Playwright for Browser Testing

---

## Decision Context

Choose between Laravel Dusk and Pest Playwright for browser-based E2E testing.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

New project (2026+)?
↓
YES → Use Pest Playwright (recommended — faster, cross-browser, more modern)
NO → Existing project with Dusk tests?
↓
YES → Team has bandwidth to migrate?
↓
YES → Gradually migrate to Pest Playwright
NO → Stay with Dusk (fully supported, stable)

↓
Need cross-browser testing (Chromium, Firefox, WebKit)?
↓
YES → Pest Playwright (native cross-browser)
NO → Dusk is sufficient (Chromium-only)

---

## Rationale

Pest Playwright is faster, cross-browser, and more modern. Dusk remains fully supported for existing projects. Migration is not urgent.

---

## Recommended Default

**Default:** Pest Playwright for new projects; Dusk for existing Dusk suites
**Reason:** Playwright is the 2026+ standard; Dusk works fine for maintenance.

---

## Risks Of Wrong Choice

Starting new project with Dusk misses Playwright benefits. Forced migration of stable Dusk tests wastes time.

---

## Related Rules

Rule 3: Limit Dusk tests to critical user flows only

---

## Related Skills

Write Laravel Dusk Browser Tests

---

## Decision Name: waitFor() vs pause() Timing Strategy

---

## Decision Context

Choose how to wait for elements or conditions in browser tests.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Waiting for a specific element, text, or URL?
↓
YES → Use `waitFor()` / `waitForText()` / `waitForLocation()` (adaptive polling)
NO → Need a fixed delay for some purpose?
↓
Should use conditional wait — `pause()` is never the right choice
↓
Debugging a test during development?
Use `pause()` temporarily for debugging; remove before committing

---

## Rationale

`waitFor()` polls every 250ms and returns immediately when the condition is met. `pause()` adds a fixed delay — too short causes flaky failures, too long wastes time.

---

## Recommended Default

**Default:** Always use `waitFor()` variant over `pause()`
**Reason:** Adaptive timing prevents both flaky failures and unnecessary delays.

---

## Risks Of Wrong Choice

`pause()` with too-short timeout causes flaky CI failures. Too-long timeout wastes 3-10 seconds per test.

---

## Related Rules

Rule 1: Never use `pause()` for waiting in Dusk tests

---

## Related Skills

Write Laravel Dusk Browser Tests

---

## Decision Name: @dusk Selectors vs CSS Class Selectors

---

## Decision Context

Choose how to target elements in Dusk tests.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Element is in your Blade/HTML templates (you control the markup)?
↓
YES → Add `@dusk="element-name"` attribute and use `@element-name` in tests
NO → Element is in third-party UI or library markup?
↓
YES → Fall back to CSS selectors (wrap in `whenAvailable()` if dynamic)
NO → Prefer `@dusk` selectors (document them for the team)

---

## Rationale

CSS classes and IDs change during refactoring. `@dusk` attributes create a stable API contract between templates and tests, independent of styling changes.

---

## Recommended Default

**Default:** Always use `@dusk` selectors for elements you control
**Reason:** Tests don't break during CSS refactoring (Tailwind upgrades, design system changes).

---

## Risks Of Wrong Choice

CSS selectors break when classes change. Updating selectors across test files wastes time during every UI refactor.

---

## Related Rules

Rule 2: Always use `@dusk` attribute selectors for element targeting

---

## Related Skills

Write Laravel Dusk Browser Tests
