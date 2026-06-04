# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Blade Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* View Unit Test vs HTTP Integration Test
* assertSee vs assertSeeText
* Single-Branch vs Paired Conditional Testing

---

# Architecture-Level Decision Trees

---

## Decision 1: View Unit Test vs HTTP Integration Test

---

## Decision Context

Whether to test a template's rendering behavior by rendering the view in isolation (`view()->render()`) or by sending an HTTP request through the full stack (`$this->get('/route')`).

---

## Decision Criteria

* Whether the test needs to verify template logic (conditionals, loops) or data flow (controller-to-view)
* Whether the template depends on middleware-modified data
* Test speed requirements

---

## Decision Tree

What is the purpose of this test?
↓
Verify template rendering logic (conditionals, loops, formatting)?
YES → View unit test: `view('name', $data)->render()` → fast (<1ms), isolates template from middleware/controllers
NO → Verify controller-to-view data flow?
    YES → Does the template depend on middleware-modified data (auth user, shared config)?
        YES → HTTP integration test required (middleware runs in full stack)
        NO → HTTP integration test acceptable but view unit test is faster
NO → Verify component contract (props, slots, attributes)?
    YES → View unit test via `$this->blade('<x-component />')` or render component directly
NO → Verify full request/response cycle (status code, redirect)?
    YES → HTTP integration test

---

## Rationale

View unit tests are faster (<1ms) and isolate the template from middleware, controllers, and route binding concerns. HTTP integration tests take 50-200ms but verify the full stack. Using the right tool avoids slow test suites for simple template logic and ensures data flow issues are caught at the integration level.

---

## Recommended Default

**Default:** View unit test via `view()->render()` for template logic; HTTP integration test via `$this->get()` for data flow
**Reason:** ~95% of template behavior can be verified with fast unit tests. Only data flow (whether the controller passes the right data) requires HTTP integration tests.

---

## Risks Of Wrong Choice

* HTTP test for template logic: Slow test suite for trivial conditional branches
* View unit test for data flow: Misses middleware interaction (auth, config sharing)
* View unit test for full page: Cannot verify status codes, redirects, or session state

---

## Related Rules

* Use View Unit Tests for Logic, HTTP Tests for Data Flow (05-rules.md)

---

## Related Skills

* Skill: Write Assertions for Blade View Rendering

---

## Decision 2: assertSee vs assertSeeText

---

## Decision Context

Which assertion method to use for verifying rendered view content — `assertSee` (checks raw HTML including tags) or `assertSeeText` (strips tags first).

---

## Decision Criteria

* Whether the expected text appears inside HTML tags
* Whether the test checks for escaped HTML entities (XSS verification)
* Whether the text should match regardless of surrounding markup

---

## Decision Tree

Are you testing that user input appears escaped (XSS protection)?
↓
YES → `assertSee('&lt;script&gt;')` — checks raw HTML for the escaped entity
NO → Are you checking for user-visible text that could be in `<h1>`, `<p>`, or `<span>`?
    YES → `assertSeeText('Welcome')` — strips tags, works regardless of HTML structure
    NO → Are you verifying that specific HTML markup or attribute exists?
        YES → `assertSee('<div class="alert">')` — structural assertion (use sparingly)
        NO → `assertSeeText()` is the safest default for user-visible content

---

## Rationale

`assertSeeText` strips HTML tags before comparing, so it works regardless of whether text is in a heading, paragraph, or span. `assertSee` checks the raw HTML string including tags. For XSS verification, you must use `assertSee` on the escaped entity because `assertSeeText` strips tags.

---

## Recommended Default

**Default:** `assertSeeText()` for user-visible content, `assertSee()` for XSS/escaped entity verification
**Reason:** `assertSeeText` survives template refactoring (changing `<h1>` to `<p>` doesn't break the test). `assertSee` is only needed for raw HTML checks.

---

## Risks Of Wrong Choice

* `assertSee` for text content: Test breaks when `<h1>` changes to `<p>` or CSS class changes
* `assertSeeText` for XSS: Passes even when `<script>` is not escaped (tags stripped before compare)
* Structural `assertSee('<div>')` everywhere: Brittle tests that break on every UI change

---

## Related Rules

* Assert on Visible Content, Not HTML Structure (05-rules.md)
* Verify XSS Escaping in View Tests (05-rules.md)

---

## Related Skills

* Skill: Write Assertions for Blade View Rendering

---

## Decision 3: Single-Branch vs Paired Conditional Testing

---

## Decision Context

Whether to test only one branch of a conditional display (e.g., admin sees panel) or both branches (admin sees panel + non-admin does NOT see panel).

---

## Decision Criteria

* Whether the conditional involves authorization or user-specific display logic
* Whether the conditional is a simple feature flag that applies equally to all users
* Whether sensitive data or privileged UI elements are involved

---

## Decision Tree

Does the conditional control access to sensitive/privileged UI (admin panel, edit button, delete link)?
↓
YES → Test BOTH branches:
    `assertSee('admin-panel')` for authorized user
    `assertDontSee('admin-panel')` for unauthorized user
NO → Does the conditional involve user-specific data (current user's profile, own posts)?
    YES → Test BOTH branches:
        `assertSee('Edit')` for the owner
        `assertDontSee('Edit')` for another user
NO → Is this a simple `@if($showBanner)` that is the same for all users?
    YES → Single branch testing may suffice (test the visible path)
NO → Does the conditional control display of sensitive data (internal notes, hidden fields)?
    YES → Test BOTH branches — `assertDontSee` is the only guard against data leakage

---

## Rationale

Testing only the happy path (admin sees admin panel) leaves the alternative branch (non-admin should NOT see admin panel) unverified. A template refactoring could accidentally expose admin UI to all users, and the single-branch test passes because it only checks the admin scenario.

---

## Recommended Default

**Default:** Paired tests for every conditional that involves authorization, user-specific data, or sensitive content
**Reason:** Paired assertions guarantee both paths work correctly. Security-critical conditionals MUST have both `assertSee` and `assertDontSee`.

---

## Risks Of Wrong Choice

* Single-branch for authorization: Security gaps — privileged content leaks without test failure
* Paired for trivial non-security conditionals: Unnecessary tests for `@if($showBanner)` that applies to all users

---

## Related Rules

* Test Both Branches of Every Conditional (05-rules.md)
* Always Test That Sensitive Data Is NOT Rendered (05-rules.md)

---

## Related Skills

* Skill: Write Assertions for Blade View Rendering
