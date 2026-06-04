# Skill: Test Blade Components and View Rendering

## Purpose
Write tests for Blade components and view rendering covering conditional display, slot content, view data, XSS escaping, and component isolation.

## When To Use
- Every Blade component with conditional logic
- Authorization-gated UI elements (visible/hidden per role)
- Components with optional slots or props
- Localization/translation rendering verification

## When NOT To Use
- Testing business logic (extract to unit tests)
- Testing CSS styles or visual layout (use E2E tests)
- Simple wrapper components with no conditional logic

## Prerequisites
- Blade components created in `app/View/Components/`
- Routes returning views or using Blade components
- User factories with different roles for authorization-gated UI tests

## Inputs
- Blade component classes and their data/props
- View files with conditional display logic
- User factories for role-based content testing

## Workflow
1. For every authorization-gated or conditional UI element, write two tests: `assertSee()` when condition is true and `assertDontSee()` when false
2. Test Blade components in isolation using `$this->blade('<x-component attr="value">Slot</x-component>')` — fast (~5ms) and focused
3. Test components with AND without optional slots/props — verify default content appears when slot is empty
4. Use `assertSee()` for visible text (strips HTML), `assertSeeHtml()` for HTML structure assertions (raw HTML including tags)
5. Assert view data with `assertViewHas('key', $expectedValue)` to verify controller passes correct data
6. Test XSS escaping: create a user with `<script>alert("xss")</script>` in their name/bio, render the view, verify it's escaped (`assertSee('<script>')` but `assertDontSeeHtml('<script>alert("xss")</script>')`)
7. Verify CSRF tokens are present in forms: `assertSee('_token')` or `assertSeeHtml('csrf')`
8. Use `assertSeeInOrder()` when the order of rendered elements matters

## Validation Checklist
- [ ] Every conditional display branch tested (assertSee + assertDontSee)
- [ ] Components tested in isolation via `$this->blade()`
- [ ] Optional slots/props tested with and without content
- [ ] `assertSee()` for text, `assertSeeHtml()` for HTML structure
- [ ] View data verified with `assertViewHas()`
- [ ] XSS escaping tested for user-provided content
- [ ] CSRF tokens in forms verified
- [ ] HTML assertions use fragments, not full output

## Common Failures
- Testing only one side of conditional display (user sees it, but should they?)
- Using `assertSee()` for HTML structure when `assertSeeHtml()` is needed (escaped HTML false positives)
- Asserting exact full HTML output — breaks on whitespace/class changes
- Not testing component default/fallback content
- Testing all views via full HTTP — component isolation tests are faster and more focused

## Decision Points
- `$this->blade()` for fast component isolation tests vs HTTP requests for integration coverage
- `assertSee()` for text content vs `assertSeeHtml()` for raw HTML structure
- `assertViewHas()` for controller data verification vs `assertSee()` for rendered output

## Performance Considerations
- `assertSee()` string search: <0.1ms per assertion
- `$this->blade()` component rendering: ~5ms vs ~40ms for full HTTP request
- HTML parsing (DOMDocument): 1-5ms for large responses — use sparingly
- Inertia page extraction: <0.5ms

## Security Considerations
- Test that XSS in user-provided data is properly escaped by Blade `{{ }}`
- Test that `{!! !!}` (unescaped) is only used with trusted content
- Test CSRF tokens present in forms
- Test sensitive data not displayed to unauthorized users

## Related Rules (from 05-rules.md)
- Rule 1: Test each conditional display branch with `assertSee()` and `assertDontSee()`
- Rule 2: Test Blade components in isolation using `$this->blade()`
- Rule 3: Test components with and without optional slots/props
- Rule 4: Use `assertSee()` for text, `assertSeeHtml()` for HTML structure
- Rule 5: Assert view data with `assertViewHas()` for controller output verification
- Rule 6: Test that XSS in user-provided data is properly escaped

## Success Criteria
- Every conditional UI element tested for both visible and hidden states
- Components are verified in isolation before page-level integration tests
- XSS escaping is confirmed for all user-provided content rendered in views
- Default/fallback content works correctly when optional slots are empty
