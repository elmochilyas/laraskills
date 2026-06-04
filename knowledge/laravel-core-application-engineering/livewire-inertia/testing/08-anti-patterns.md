# Inertia Testing — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Testing |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Using assertJson or assertSee Instead of assertInertia
2. Testing Shared Data on Every Page Instead of a Dedicated Test
3. Brittle Assertions Without etc()
4. No Authorization Tests for Protected Routes
5. No Client-Side Component Tests

---

## Repository-Wide Anti-Patterns

- **One giant test for everything**: A single 100-line test checking every prop — hard to debug.
- **Testing Inertia internals**: Asserting on `X-Inertia` headers or raw JSON instead of using `assertInertia()`.
- **Skipping E2E entirely**: Server + client unit tests miss integration bugs.
- **Missing sensitive data absence tests**: Not using `missing()` to verify sensitive props are absent for unauthorized users.

---

## Anti-Pattern 1: Using assertJson or assertSee Instead of assertInertia

### Category

Testing

### Description

Using generic JSON assertions (`assertJson`, `assertExactJson`) or HTML assertions (`assertSee`) to test Inertia responses instead of the dedicated `assertInertia()` fluent API.

### Why It Happens

Developers familiar with traditional Laravel testing patterns default to `assertJson()` and `assertSee()`. They may not know about `assertInertia()` or may find the JSON structure easier to inspect with raw assertions.

### Warning Signs

- `$response->assertJson([...])` used for Inertia routes
- `$response->assertSee('...')` used expecting Inertia HTML
- Tests breaking on Inertia version upgrades (JSON format changes)
- Fragile tests that check the entire nested JSON structure

### Why Harmful

`assertInertia()` validates the complete Inertia protocol — the `X-Inertia` header, correct JSON structure, component name, and props. Raw `assertJson()` or `assertSee()` tests are brittle, miss protocol-level issues, and break on non-essential Inertia version changes.

### Consequences

- Tests break on Inertia version upgrades (JSON format changes)
- Protocol-level issues (missing headers, wrong component) go undetected
- False positives from incomplete assertions
- Brittle tests that fail on irrelevant structural changes

### Alternative

Always use `$response->assertInertia(fn ($page) => $page->component('Name')->has('prop'))` for Inertia routes. Reserve `assertJson()` for API endpoints and `assertSee()` for Blade views.

### Refactoring Strategy

1. Search for `assertJson` and `assertSee` in test files for Inertia-rendered routes
2. Replace with `assertInertia()` fluent assertions
3. Use `component()` for component name, `has()`/`where()` for prop shape
4. Append `etc()` for resilience

### Detection Checklist

- [ ] No `assertJson()` used for Inertia route tests
- [ ] No `assertSee()` used for Inertia route tests
- [ ] Every Inertia route test uses `assertInertia()` with fluent chain
- [ ] Protocol-level assertions (component name, props) are covered

### Related Rules

- Use assertInertia for Server Tests (05-rules.md)

### Related Skills

- Write Server-Side Tests for Inertia Pages (06-skills.md)

### Related Decision Trees

- assertInertia() vs assertJson() for Inertia Responses (07-decision-trees.md)

---

## Anti-Pattern 2: Testing Shared Data on Every Page Instead of a Dedicated Test

### Category

Testing

### Description

Repeating the same auth/flash/app shared data assertions in every page test instead of validating them once in a dedicated `SharedDataTest`.

### Why It Happens

When writing a page test, it's natural to assert the response includes the expected data — including shared data. Over time, the shared data assertions are copied to every page test. Developers don't realize the maintenance burden until a shared data change breaks dozens of tests.

### Warning Signs

- Every page test includes `->where('auth.user.id', ...)` and `->where('app.name', ...)`
- Changing shared data (adding a field, renaming a key) breaks 20+ tests
- Shared data assertions are scattered across multiple test files
- Page tests are longer than necessary due to shared data boilerplate

### Why Harmful

Shared data appears on every page so it is tested many times. Repeating shared data assertions on every page test creates brittle duplication — any change to shared data requires updating dozens of test files. This discourages refactoring shared data and makes the test suite fragile.

### Consequences

- Changing shared data breaks every page test — high maintenance burden
- Test files are cluttered with repeated shared data boilerplate
- Developers hesitate to refactor shared data because of the test impact
- Shared data changes require updating 20+ files instead of 1

### Alternative

Create one `SharedDataTest` class that validates all shared data keys and values. Individual page tests should only assert page-specific props.

### Refactoring Strategy

1. Create `tests/Feature/SharedDataTest.php` with assertions for auth, flash, and app config
2. Remove shared data assertions from all page tests
3. Keep only page-specific prop assertions in page tests
4. Run the full suite to verify shared data is covered once

### Detection Checklist

- [ ] A dedicated `SharedDataTest` exists and validates all shared keys
- [ ] No shared data assertions (auth, flash, app) in individual page tests
- [ ] Changing shared data updates only one test file
- [ ] Page tests focus on page-specific props only

### Related Rules

- Isolate Shared Data Tests (05-rules.md)

### Related Skills

- Write Server-Side Tests for Inertia Pages (06-skills.md)

### Related Decision Trees

- HTTP Integration Test vs Unit Test for Inertia Pages (07-decision-trees.md)

---

## Anti-Pattern 3: Brittle Assertions Without etc()

### Category

Testing

### Description

Failing to call `->etc()` at the end of `assertInertia` fluent chains, causing tests to break whenever a new prop is added to a page.

### Why It Happens

Developers may not know about the `etc()` method or may not realize that without it, the assertion performs a strict match against all response props.

### Warning Signs

- Adding a new prop to a controller breaks the existing test for that page
- Tests fail with "Unexpected prop 'new_prop'" errors
- Developers must update tests whenever they add new data to a page
- CI fails on unrelated changes (adding a feature breaks another page's test)

### Why Harmful

Without `etc()`, every assertion chain is a strict match — adding a new prop to a controller breaks every existing test for that page. This makes the test suite brittle and discourages developers from adding new data to pages, as it requires updating multiple tests.

### Consequences

- Every prop addition breaks existing tests — discourages refactoring
- Developers spend time updating passing tests instead of writing new ones
- Test suite becomes a maintenance burden rather than a safety net
- CI failures on unrelated changes erode trust in the test suite

### Alternative

Always append `->etc()` at the end of `assertInertia` fluent chains. Use `whereAll()` or explicit assertions for the props that matter, and let `etc()` allow additional props.

### Refactoring Strategy

1. Add `->etc()` to the end of every `assertInertia` chain that doesn't have it
2. Verify that tests still pass after adding `etc()`
3. Establish a code review rule: every `assertInertia` chain must end with `->etc()`

### Detection Checklist

- [ ] Every `assertInertia` chain ends with `->etc()`
- [ ] Adding a new prop to a controller doesn't break existing tests
- [ ] Tests only assert on props that are critical for the page's functionality
- [ ] No test breaks on unrelated feature additions

### Related Rules

- Use etc() for Resilient Prop Assertions (05-rules.md)

### Related Skills

- Write Server-Side Tests for Inertia Pages (06-skills.md)

### Related Decision Trees

- Server-Side Prop Testing vs Client-Side Component Testing (07-decision-trees.md)

---

## Anti-Pattern 4: No Authorization Tests for Protected Routes

### Category

Testing

### Description

Only testing the "happy path" (authenticated user sees the page) without testing unauthenticated (redirect) or unauthorized (restricted props) scenarios.

### Why It Happens

Happy-path testing is the default. Developers write one test per route — the one that passes. Authorization scenarios require additional setup (different user roles, guest state) and separate test methods.

### Warning Signs

- Protected Inertia routes only have a single test for the authenticated success case
- No test exists for guest redirect on protected routes
- No test verifies that admin-only props are absent for regular users
- Authorization bugs make it to production because they were never tested

### Why Harmful

Inertia controllers are the security boundary — the page component is just a view. If the controller does not check authorization, sensitive data is sent to the client. Without authorization tests, there is no guarantee that the controller's authorization logic executes correctly. A missing `$this->authorize()` call goes undetected until a data leak incident.

### Consequences

- Unauthorized access to sensitive data undetected by tests
- Authorization regressions deployed to production
- Routes with missing auth checks are invisible to code review
- Security incidents from data exposure

### Alternative

For every protected Inertia route, write three test scenarios: unauthenticated (redirect to login), authenticated without permission (403 or restricted props), and authorized access (correct component and props).

### Refactoring Strategy

1. For each protected route, identify the authorization scenarios
2. Add tests for guest redirect: `$this->get('/protected')->assertRedirect('/login')`
3. Add tests for unauthorized access if role-based: `$this->actingAs(nonAdmin)->get('/admin')->assertStatus(403)`
4. Verify that sensitive data is absent for unauthorized users with `->missing('admin_prop')`

### Detection Checklist

- [ ] Every protected route has a guest redirect test
- [ ] Every role-protected route has unauthorized access tests
- [ ] Sensitive data absence is tested with `->missing()` for unauthorized users
- [ ] Authorization tests fail if the controller's authorization check is removed
- [ ] Public routes don't have unnecessary authorization tests

### Related Rules

- Test Every Authorization State (05-rules.md)

### Related Skills

- Write Server-Side Tests for Inertia Pages (06-skills.md)

### Related Decision Trees

- HTTP Integration Test vs Unit Test for Inertia Pages (07-decision-trees.md)

---

## Anti-Pattern 5: No Client-Side Component Tests

### Category

Testing

### Description

Only testing the server side of Inertia applications (controllers return correct props) without testing that client-side page components render those props correctly.

### Why It Happens

Server-side testing is the natural first step — it's in PHP, which Laravel developers know. Client-side testing requires a different toolchain (Vitest, Jest, Testing Library) and mocking Inertia hooks. This feels like "bonus" work.

### Warning Signs

- Only PHP tests exist in the repository — no `__tests__` or `*.test.tsx` files
- UI rendering bugs surface only in production or manual testing
- Components with conditional rendering (loading states, error states) are never tested
- Prop shape changes from the server don't have corresponding client-side test updates

### Why Harmful

Server-side tests only verify that the correct data is sent to the client. They do not verify that the page component renders the data correctly. A component may have a rendering bug, a missing conditional branch, or an incorrect JS expression that produces wrong output even with correct props.

### Consequences

- UI rendering bugs reach production — not caught by PHP tests
- Conditional rendering branches (loading, empty, error states) never validated
- Component refactoring without tests introduces visual bugs
- Server tests pass but the UI is broken — false confidence

### Alternative

Add client-side component tests for all page components using Vitest/Jest with mocked Inertia hooks. Mock `usePage`, `useForm`, and `router` from `@inertiajs/react` to provide controlled prop values.

### Refactoring Strategy

1. Set up Vitest or Jest with React/Vue testing utilities
2. Create mock helpers for Inertia hooks (`usePage`, `useForm`, `router`)
3. Write tests for each page component rendering the main success state
4. Add tests for loading, empty, and error states where applicable
5. Run both server and client tests in CI

### Detection Checklist

- [ ] Client-side test framework is configured (Vitest/Jest + Testing Library)
- [ ] Every page component has a test rendering the main state
- [ ] Conditional rendering branches (loading, empty, error) have tests
- [ ] Inertia hooks are mocked, not called in production code during tests
- [ ] Both server and client test suites pass in CI

### Related Rules

- Mock Inertia Hooks for Client Tests (05-rules.md)

### Related Skills

- Write Server-Side Tests for Inertia Pages (06-skills.md)

### Related Decision Trees

- Server-Side Prop Testing vs Client-Side Component Testing (07-decision-trees.md)
