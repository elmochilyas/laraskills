# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Inertia Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* HTTP Integration Test vs Unit Test for Inertia Pages
* assertInertia() vs assertJson() for Inertia Responses
* Server-Side Prop Testing vs Client-Side Component Testing

---

# Architecture-Level Decision Trees

---

## Decision 1: HTTP Integration Test vs Unit Test for Inertia Pages

---

## Decision Context

Whether to test Inertia page responses via HTTP integration tests (sending requests to routes) or unit tests (testing controller methods in isolation).

---

## Decision Criteria

* Whether the test needs to verify the full Inertia response (component, props, headers)
* Whether the test needs to verify middleware behavior (auth, shared data)
* Whether the controller method is simple enough to unit test
* Whether the test team prefers black-box or white-box testing

---

## Decision Tree

Does the test need to verify the Inertia response (correct component, correct props)?
↓
YES → Use HTTP integration test — `$response->assertInertia()` validates the full response
NO → Is the controller method pure data logic with no Inertia-specific behavior?
    YES → Unit test the controller — test data fetching without HTTP
    NO → Does the test need to verify middleware behavior (authentication, shared data injection)?
        YES → HTTP integration test — middleware only runs in HTTP context
        NO → Unit test the controller — simpler, faster

---

## Rationale

HTTP integration tests with `assertInertia()` validate the complete Inertia response — component name, props, shared data, and headers. Unit-testing controllers alone doesn't verify that `Inertia::render()` was called correctly. Integration tests are the standard for Inertia page testing.

---

## Recommended Default

**Default:** HTTP integration tests with `assertInertia()` for all Inertia page responses.
**Reason:** Integration tests verify the full stack — route, middleware, controller, Inertia response. Unit tests miss Inertia-specific behavior and middleware interactions.

---

## Risks Of Wrong Choice

* Unit test controller only: Doesn't verify Inertia::render() was called — false confidence
* Integration test for every edge case: Slow — full HTTP request for each prop variant
* No test for Inertia response: "Controller returns data" tested but Inertia response never verified — component might not receive props

---

## Related Rules

* Use assertInertia for Server Tests

---

## Related Skills

* Write Server-Side Tests for Inertia Pages

---

---

## Decision 2: assertInertia() vs assertJson() for Inertia Responses

---

## Decision Context

Whether to use `assertInertia()` (Inertia-specific assertions) or `assertJson()` (generic JSON assertions) for testing Inertia responses.

---

## Decision Criteria

* Whether the test needs to validate Inertia-specific structure (component name, page props)
* Whether the test should be resilient to Inertia version JSON format changes
* Whether the test is part of a contract test between server and client
* Whether the team standardizes on `assertInertia()` or uses generic assertions

---

## Decision Tree

Does the test need to verify the component name (which page component is rendered)?
↓
YES → Use `assertInertia()` — `$page->component('Name')` is Inertia-specific
NO → Does the test need to verify prop types and values in the Inertia response?
    YES → Use `assertInertia()` — `$page->where('key', value)` is Inertia-aware
    NO → Is the test verifying a non-Inertia response (API endpoint)?
        YES → Use `assertJson()` — not an Inertia route
        NO → Use `assertInertia()` — standard for Inertia routes

---

## Rationale

`assertInertia()` validates the Inertia protocol — correct `X-Inertia` header, proper JSON structure, component name, and props. `assertJson()` tests only the raw JSON shape, which is brittle and doesn't verify Inertia protocol compliance.

---

## Recommended Default

**Default:** Always use `assertInertia()` for Inertia routes. Reserve `assertJson()` for non-Inertia API endpoints.
**Reason:** `assertInertia()` provides Inertia-specific assertions that catch protocol-level issues. `assertJson()` is too low-level and breaks on Inertia version changes.

---

## Risks Of Wrong Choice

* `assertJson()` for Inertia: Brittle — breaks on Inertia JSON format changes
* `assertInertia()` for API endpoint: Fails — no Inertia headers on API responses
* No assertion on props: Component name verified but props never checked — missing prop goes undetected
* `assertSee()` on Inertia response: Inertia returns JSON, not HTML — `assertSee()` fails

---

## Related Rules

* Use assertInertia for Server Tests

---

## Related Skills

* Write Server-Side Tests for Inertia Pages

---

---

## Decision 3: Server-Side Prop Testing vs Client-Side Component Testing

---

## Decision Context

Whether to test Inertia page correctness on the server side (PHP assertions on props) or the client side (JS component tests with mocked props).

---

## Decision Criteria

* Whether the test should verify the server sends the right data
* Whether the test should verify the client renders the data correctly
* Whether the team has expertise in both PHP and JS testing
* Whether the application is contract-tested (server and client developed independently)

---

## Decision Tree

Does the test need to verify that the server sends the correct data (prop values, prop shapes)?
↓
YES → Use server-side testing — `assertInertia()` with `where()` and `has()` assertions
NO → Does the test need to verify that the client renders the data correctly (UI output)?
    YES → Use client-side testing — Vitest/Jest with mocked Inertia props
    NO → Does the test need to verify end-to-end behavior (user flows)?
        YES → Use E2E testing (Playwright, Cypress) — covers both server and client
        NO → No testing needed for this concern
NO → Does the team practice contract testing (server and client developed separately)?
    YES → Both — server tests assert prop shape, client tests assert render from that shape
    NO → Server-side testing — sufficient for most applications

---

## Rationale

Server-side testing verifies the data contract (correct props, correct values). Client-side testing verifies the rendering contract (correct UI from given props). For most applications, server-side testing catches the majority of Inertia bugs. Client-side testing adds value for complex client-side rendering logic.

---

## Recommended Default

**Default:** Server-side testing with `assertInertia()` for all Inertia routes. Add client-side component testing for pages with complex rendering logic.
**Reason:** Server-side tests catch prop mismatches, missing data, and authorization issues. Client-side tests catch rendering bugs. Most pages don't need both.

---

## Risks Of Wrong Choice

* No client-side testing with complex rendering: Props are correct but component renders incorrectly — UI bug
* Client-side testing without server-side: Component renders fine but prop missing from server — runtime error
* Both for simple pages: Redundant — same validation in two test suites
* No E2E testing for critical flows: Integration between server and client never validated end-to-end

---

## Related Rules

* Server-Side for Data Contract, Client-Side for Rendering

---

## Related Skills

* Write Server-Side Tests for Inertia Pages
