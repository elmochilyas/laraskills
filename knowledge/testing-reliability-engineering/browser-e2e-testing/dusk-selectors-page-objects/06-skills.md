# Skill: Use Dusk Selectors and Page Objects

## Purpose
Create stable, maintainable Dusk tests by using `@dusk` attribute selectors for element targeting and the Page Object pattern to encapsulate page-specific logic.

## When To Use
- When writing any Dusk test to ensure stable element selection
- When multiple tests interact with the same page or component
- When page structure changes frequently and tests should be resilient
- When you want to reduce duplication of selector strings across tests
- When testing complex pages with many interactive elements

## When NOT To Use
- For one-off test scenarios that don't reuse selectors
- When the page has no reusable query methods or navigation
- For very simple pages with 1-2 interactions
- When the Page Object abstraction adds more overhead than it saves

## Prerequisites
- Dusk installed and configured
- Understanding of HTML attributes and CSS selectors
- Knowledge of Dusk's `Browser` class and its methods

## Inputs
- HTML elements that need stable test selectors
- Page URL and expected route name
- Reusable interactions on the page (login, search, submit)
- Component-level selectors for repeatable UI elements

## Workflow
1. Add `@dusk` attributes to HTML elements in Blade views: `<button dusk="login-button">Login</button>`
2. Reference them in tests: `$browser->click('@login-button')`
3. Create Page Object classes extending `Dusk\Page`: define `url()`, `assertion()`, and `elements()` methods
4. Add page-specific helper methods: `public function login($email, $password) { $this->type('@email', $email)->type('@password', $password)->click('@login-btn'); }`
5. For reusable components, create Component classes: `$browser->within(new NavigationBar, fn ($navbar) => $navbar->click('@profile'))`
6. Reference components from Page Objects: `$this->component(NavigationBar::class)->click('@logout')`

## Validation Checklist
- [ ] Every interactive element has a `@dusk` selector in the view
- [ ] Page Objects exist for pages used in 2+ tests
- [ ] Page Object `url()` returns the correct route
- [ ] Page Object `elements()` returns all key selectors
- [ ] Component classes exist for reusable UI elements
- [ ] Tests reference `@dusk` selectors, not CSS classes or XPath
- [ ] Page Object helper methods encapsulate multi-step interactions

## Common Failures
- Using CSS class names as selectors — brittle when styles are refactored
- Not creating Page Objects — selector strings duplicated across tests
- Page Objects with too many responsibilities (one page, one Page Object)
- Not updating Page Objects when the view changes — tests break silently
- Using `@dusk` on elements that don't need test interaction (over-annotation)

## Decision Points
- `@dusk` selector vs CSS selector — always prefer `@dusk` for elements you control
- Page Object vs inline — Page Object for reusable pages, inline for one-off scenarios
- Component vs Page Object method — Component for truly reusable UI pieces, Page Object for page-specific interactions

## Performance Considerations
- `@dusk` selectors are resolved by attribute — same performance as CSS class selectors
- Page Object method calls add minimal overhead (<0.1ms)
- Component resolution is cached per test
- No performance penalty for proper abstraction

## Security Considerations
- Page Objects for authentication pages should not expose credentials in helpers
- Ensure form submission helpers don't bypass CSRF tokens
- Test that protected pages redirect unauthenticated users
- Verify that error states are reachable via Page Object methods

## Related Rules
- [Rule: Use `@dusk` Selectors for All Interactive Elements](./05-rules.md)
- [Rule: Create Page Objects for Reusable Pages](./05-rules.md)
- [Rule: Keep Page Objects Focused on One Page](./05-rules.md)

## Related Skills
- Dusk Fundamentals
- Dusk Waiting Strategies
- Pest Playwright E2E Testing

## Success Criteria
- [ ] All views with Dusk tests have `@dusk` attributes on interactive elements
- [ ] Page Objects exist for all pages tested in 2+ test files
- [ ] No test uses raw CSS selectors or XPath for elements with `@dusk` attributes
- [ ] Component classes exist for reusable UI patterns
- [ ] Adding a new test for an existing page requires no selector discovery
