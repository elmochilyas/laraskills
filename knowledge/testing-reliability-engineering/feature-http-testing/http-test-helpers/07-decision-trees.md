# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** HTTP Test Helpers
**Generated:** 2026-06-03

---

# Decision Inventory

1. get()/post() vs getJson()/postJson()
2. Feature test vs isolated controller test
3. Full middleware pipeline vs withoutMiddleware()
4. Named routes vs hardcoded URLs

---

# Architecture-Level Decision Trees

---

## Decision Name: get()/post() vs getJson()/postJson()

---

## Decision Context

Choose the correct HTTP test helper based on the route's expected content type.

---

## Decision Criteria

* architectural

---

## Decision Tree

Route returns JSON response (API route)?
↓
YES → Use `$this->getJson()` / `$this->postJson()`
NO → Route returns HTML/Blade response (web route)?
↓
YES → Use `$this->get()` / `$this->post()`

↓
Unsure of content type?
↓
Check route definition: API routes use `api.php` and typically return JSON
↓
When in doubt, use JSON variant (JSON helpers work for both; non-JSON breaks on validation errors)

---

## Rationale

JSON variants set proper `Accept: application/json` and `Content-Type: application/json` headers, triggering Laravel's JSON error formatting. Non-JSON helpers may return HTML error pages instead of JSON on validation errors.

---

## Recommended Default

**Default:** `getJson()`/`postJson()` for API routes; `get()`/`post()` for web routes
**Reason:** Prevents HTML error pages from breaking JSON response assertions.

---

## Risks Of Wrong Choice

Using `get()` for API routes returns HTML error pages on validation failures. `assertJson()` fails with confusing HTML parsing errors.

---

## Related Rules

Rule 4: Use `getJson()`/`postJson()` for API routes and `get()`/`post()` for web routes

---

## Related Skills

Write Feature Tests with HTTP Helpers

---

## Decision Name: Full Middleware Pipeline vs withoutMiddleware()

---

## Decision Context

Choose whether to test with the full middleware pipeline or bypass middleware.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Test is a feature test (end-to-end through routing)?
↓
YES → Keep ALL middleware active — never use `withoutMiddleware()`
NO → Test is an isolated controller unit test?
↓
YES → Can use `withoutMiddleware()` (middleware tested separately)

↓
Rate limiting or CSRF interfering with test scenario?
↓
Selectively disable ONLY the specific middleware: `$this->withoutMiddleware(ThrottleRequests::class)`
Never disable all middleware

---

## Rationale

Feature tests must verify the full request pipeline. Bypassing middleware defeats the purpose of feature testing — auth, CSRF, and throttle vulnerabilities go undetected.

---

## Recommended Default

**Default:** Always test with full middleware pipeline in feature tests
**Reason:** Auth, CSRF, and rate limiting are critical security boundaries that must be verified.

---

## Risks Of Wrong Choice

Tests pass without CSRF protection, auth checks, or rate limits. Vulnerabilities reach production.

---

## Related Rules

Rule 2: Never use `withoutMiddleware()` in feature tests
Rule 6: Don't use `withoutCSRF()` — include CSRF tokens or test with middleware active

---

## Related Skills

Write Feature Tests with HTTP Helpers

---

## Decision Name: Named Routes vs Hardcoded URLs

---

## Decision Context

Choose how to reference route URLs in HTTP test assertions.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Route has a named route definition?
↓
YES → Use `route('posts.show', $post)` — always preferred
NO → Route is unnamed?
↓
YES → Add a route name (refactor first) or use URL as last resort

---

## Rationale

Named routes survive URL structure changes. Hardcoded URLs break when route definitions change (prefixes, parameter names, route restructuring). Named routes are the single source of truth for URL structure.

---

## Recommended Default

**Default:** Always use `route('name', $param)` in HTTP tests
**Reason:** Tests don't break when URL structure changes. Enables route refactoring without test maintenance.

---

## Risks Of Wrong Choice

Hardcoded URLs break on route structure changes. Routes are refactored less frequently, accruing technical debt.

---

## Related Rules

Rule 1: Always use named routes in HTTP tests

---

## Related Skills

Write Feature Tests with HTTP Helpers
