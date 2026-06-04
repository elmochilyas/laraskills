# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** Authentication & Authorization Testing
**Generated:** 2026-06-03

---

# Decision Inventory

1. actingAs() vs actual login POST
2. Session guard vs Sanctum guard selection
3. 404 vs 403 for unauthorized resources
4. Role-based vs ownership-based authorization priority

---

# Architecture-Level Decision Trees

---

## Decision Name: actingAs() vs Actual Login POST

---

## Decision Context

Choose whether to use `actingAs()` to simulate auth or execute a real login HTTP request.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Test is verifying authorization (can user access resource)?
↓
YES → Use `actingAs($user)` (fast, focused, bypasses login)
NO → Test is verifying authentication mechanism (login flow)?
↓
YES → Use actual `$this->post('/login', [...])` (verifies password, CSRF, lockout)
NO → Use `actingAs()` (general auth setup)

---

## Rationale

`actingAs()` sets user in session without password verification (<1ms). Login flow tests must go through actual authentication to verify password hashing, CSRF protection, and brute force lockout.

---

## Recommended Default

**Default:** `actingAs()` for authorization tests; actual POST for login mechanism tests
**Reason:** Keeps authorization tests fast while ensuring authentication security is thoroughly tested.

---

## Risks Of Wrong Choice

Using `actingAs()` for login flow misses CSRF, lockout, and password bugs. Using real login for every authorization test adds 10-15ms per test unnecessarily.

---

## Related Rules

Rule 2: Use `actingAs()` for authorization tests, actual POST for login flow tests

---

## Related Skills

Test Authentication and Authorization Boundaries

---

## Decision Name: Session Guard vs Sanctum Guard Selection

---

## Decision Context

Choose between `actingAs()` (session) and `actingAsSanctum()` (token) for authentication in tests.

---

## Decision Criteria

* architectural

---

## Decision Tree

Route uses `auth:sanctum` middleware?
↓
YES → Use `$this->actingAsSanctum($user)` (API token auth)
NO → Route uses `auth` middleware (session-based)?
↓
YES → Use `$this->actingAs($user)` (session auth)
NO → Determine auth guard; match test helper to guard

---

## Rationale

Sanctum and session authentication use different guard mechanisms. Using `actingAs()` on a Sanctum-guarded route results in the user appearing unauthenticated — all requests receive 401.

---

## Recommended Default

**Default:** `actingAs()` for web routes; `actingAsSanctum()` for API routes
**Reason:** Guard mismatch is a common and hard-to-debug failure. Match the helper to the middleware.

---

## Risks Of Wrong Choice

Guard mismatch: authenticated tests fail with 401. Tests pass only when session sharing accidentally works.

---

## Related Rules

Rule 5: Use `actingAsSanctum()` for Sanctum-guarded API routes

---

## Related Skills

Test Authentication and Authorization Boundaries

---

## Decision Name: 404 vs 403 for Unauthorized Resources

---

## Decision Context

Choose whether unauthorized access to a resource returns 403 (forbidden) or 404 (not found).

---

## Decision Criteria

* security

---

## Decision Tree

Resource existence should not be discoverable by unauthorized users?
↓
YES → Return 404 for both "not found" and "not authorized" (prevents enumeration)
NO → Return 403 explicitly (clearer error but reveals resource existence)

↓
Application handles sensitive data (PII, financial, medical)?
↓
YES → Use 404 (opaque — prevents resource enumeration attacks)
NO → 403 is acceptable (transparent — easier to debug)

---

## Rationale

Returning 403 reveals that a resource exists but the user lacks permission. This enables resource enumeration attacks. Returning 404 for both cases prevents attackers from discovering valid resource IDs.

---

## Recommended Default

**Default:** 404 for unauthorized resource access (opaque, prevents enumeration)
**Reason:** Security best practice — don't reveal whether a resource exists to unauthorized users.

---

## Risks Of Wrong Choice

403 reveals resource existence, allowing attackers to enumerate valid resource IDs via trial and error.

---

## Related Rules

Rule 7: Test that error responses do not reveal whether a resource exists

---

## Related Skills

Test Authentication and Authorization Boundaries
