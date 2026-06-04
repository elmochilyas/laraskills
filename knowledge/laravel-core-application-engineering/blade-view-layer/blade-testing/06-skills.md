# Skill: Write Assertions for Blade View Rendering

## Purpose

Verify that Blade templates render correct content — variables display, conditionals branch correctly, loops iterate, and components produce expected output — without relying on full browser tests.

## When To Use

- Testing conditional rendering (admin sees admin panel, user does not)
- Verifying loop correctness (all items in a collection appear)
- Testing component contracts (props, slots, attribute merging)
- Verifying translation strings render correctly per locale
- Preventing regressions after template refactoring

## When NOT To Use

- CSS/visual layout verification (use Laravel Dusk)
- JavaScript behavior verification (use Dusk for JS interaction)
- Framework mechanics testing (do not test that `view()` returns a View instance)
- Every possible data permutation (test critical paths and boundary conditions)
- Excessive structural assertions on HTML tags and CSS classes

## Prerequisites

- Laravel test environment (PHPUnit or Pest)
- View file to test
- Factory or model data for the view's input

## Inputs

- Blade view path
- Data array (models, collections, primitives)
- Expected output strings

## Workflow

1. Identify critical conditional branches in the template (admin/user, authed/guest, feature flags)
2. Write one test asserting the content IS visible when the condition is true using `assertSee` or `assertSeeText`
3. Write a second test asserting the content IS NOT visible when the condition is false using `assertDontSee`
4. For loop rendering, create a collection with known items and assert each item's content appears in the output
5. For components, use `$this->blade('<x-component prop="value">Slot</x-component>')` and assert on rendered content
6. For translation output, set locale with `App::setLocale('es')` and assert on the translated value (not the key)
7. Verify XSS protection by passing `<script>` as input and asserting `&lt;script&gt;` appears in raw output
8. Use `assertDontSee` to confirm sensitive data (internal notes, hidden fields) is not rendered

## Validation Checklist

- [ ] Every conditional branch is tested in both directions (assertSee + assertDontSee)
- [ ] Loop rendering verified — all expected items appear in output
- [ ] Component props, slots, and attributes render correctly via `$this->blade()`
- [ ] Translation output tested per supported locale on the value, not the key
- [ ] XSS escaping verified — user input appears as escaped HTML entities
- [ ] No assertions on HTML tags, CSS classes, or raw HTML structure
- [ ] `assertDontSee` confirms sensitive data is absent from rendered output
- [ ] View unit tests are fast (<1ms) and avoid unnecessary database or HTTP dependencies

## Common Failures

- **Only testing happy path:** Tests pass for admin but non-admin path is broken. Always test both branches.
- **Asserting on HTML structure:** `assertSee('<h1>Title</h1>', false)` breaks on tag changes. Use `assertSeeText('Title')`.
- **Missing translation tests:** Tests assert on keys like `messages.welcome` instead of the rendered value, missing broken translation files.
- **XSS test using assertSeeText:** `assertSeeText` strips tags, so `<script>` passes even when escaped. Use `assertSee` on `&lt;script&gt;`.
- **Hardcoded HTML entities confusion:** `assertSee('<script>')` fails because actual output is `&lt;script&gt;`. Assert on the entity.

## Decision Points

- View unit test vs HTTP integration test: Use `view('name', $data)->render()` for fast, isolated template logic tests. Use `$this->get('/route')` for full controller-to-view data flow testing.
- `assertSee` vs `assertSeeText`: Use `assertSee` for raw HTML checks (XSS escaping). Use `assertSeeText` for user-visible text (strips tags first).

## Performance Considerations

- View unit tests render the template per assertion — batch assertions within a single rendered string
- HTTP tests take 50-200ms per request due to full framework boot
- Use `$this->blade()` helper (caches compiler per test method) to avoid redundant renders
- Prefer `make()` over `create()` to avoid database writes in view unit tests

## Security Considerations

- Test that user input is escaped: `$response->assertSee('&lt;script&gt;')`
- Test that sensitive data is NOT rendered: `$response->assertDontSee($user->internal_note)`
- Test that unauthorized users don't see privileged UI elements (admin links, edit buttons)
- `assertSee` checks raw HTML — escaped data appears as `&lt;` not `<`

## Related Rules

- blade-testing/05-rules.md: Assert on Visible Content, Not HTML Structure
- blade-testing/05-rules.md: Test Both Branches of Every Conditional
- blade-testing/05-rules.md: Use View Unit Tests for Logic, HTTP Tests for Data Flow
- blade-testing/05-rules.md: Always Test That Sensitive Data Is NOT Rendered
- blade-testing/05-rules.md: Test Translation Output, Not Translation Keys
- blade-testing/05-rules.md: Verify XSS Escaping in View Tests
- blade-testing/05-rules.md: Prefer `$this->blade()` Helper for Directive and Component Tests

## Related Skills

- Component System: Create and Use Blade Components
- Custom Directives: Register Custom Blade Directives
- Localization in Views: Implement Multi-Language Translation in Views
- View Composers and Creators: Implement View Composers for Shared Data

## Success Criteria

- All critical conditional branches are tested in both directions
- Components, directives, and translated strings are verified with `$this->blade()`
- XSS escaping is confirmed by positive assertion on HTML entities
- Sensitive data is verified absent via `assertDontSee`
- No test asserts on HTML structure — all assertions target visible content
