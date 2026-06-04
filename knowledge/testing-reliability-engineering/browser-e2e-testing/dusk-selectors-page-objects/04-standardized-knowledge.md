# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Browser & E2E Testing |
| Knowledge Unit | Dusk Selectors, Page Objects, Components |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Dusk fundamentals, HTML/DOM structure, CSS selectors |
| Related KUs | Dusk waiting strategies, Component testing, Pest Playwright |
| Source | domain-analysis.md K013 |

# Overview

Dusk selectors, page objects, and components provide structured access to DOM elements in browser tests, encapsulating selector logic and interaction patterns. The `@dusk` attribute selector convention provides CSS-independent element references; page objects organize selectors and interaction methods per page; components represent reusable UI elements. Without these abstractions, Dusk tests become brittle, unreadable, and tightly coupled to DOM structure.

# Core Concepts

- **`@dusk` attribute selector**: Add `@dusk="name"` to HTML elements. Use `$browser->@name` or `$browser->element('@name')` to reference elements. Independent of CSS classes or IDs.
- **Page objects**: Classes extending `Laravel\Dusk\Page`. Define `url()`, `elements()` (selector map), and interaction methods.
- **`elements()` method**: Returns an associative array of `name => selector`. Selectors can be `@dusk` references, CSS selectors, or XPath.
- **Component objects**: Classes extending `Laravel\Dusk\Component`. Represent reusable UI pieces (navbars, modals, forms). Used via `$browser->within()`.
- **`within()`**: Scopes browser interactions to a component's root element.
- **`whenAvailable()`**: Waits for an async-rendered element to appear and scopes interactions within it.

# When To Use

- For any page with multiple interactive elements (forms, tables, navigation)
- When tests need stable selectors that survive CSS refactoring
- For reusable UI widgets (modals, date pickers, data tables) that appear on multiple pages
- For teams with >20 Dusk tests — page objects dramatically reduce maintenance cost
- When onboarding new team members — page objects document page structure

# When NOT To Use

- For single-interaction tests (one click, one assertion) — direct selectors are simpler
- When testing third-party UI where you cannot add `@dusk` attributes (use CSS selectors as fallback)
- As an over-engineering exercise — if a page object only has one method and one selector, it may not be worth the abstraction
- With XPath unless absolutely necessary (CSS selectors are faster and more readable)

# Best Practices (WHY)

- **Always use `@dusk` for interactive elements**: CSS is for styling, not test targeting. `@dusk` attributes create a stable API contract between Blade templates and tests. Changing a CSS framework (Tailwind, Bootstrap, BEM) won't break tests.
- **Page objects for full pages, components for widgets**: Page = full page URL. Component = reusable widget. Different lifecycle and scoping rules. Mixing them leads to confusion about what `url()` should return.
- **Limit page object methods to those used by 2+ tests**: One-off interaction logic belongs in the test file, not the page object. Page objects become god classes when they contain every possible interaction.
- **Use `within()` for scoping assertions**: `$browser->within('@sidebar', fn ($s) => $s->assertSee('Filter'))` prevents assertions matching text in the wrong page section.
- **Prefer `whenAvailable()` over manual `waitFor()`**: `whenAvailable()` combines waiting and scoping in a single call, reducing the chance of timing-related failures.

# Architecture Guidelines

- **Selector priority**: `@dusk` attributes > named elements from page objects > CSS selectors > XPath. Always prefer the most stable option.
- **Placement**: Store page objects in `tests/Browser/Pages/` and components in `tests/Browser/Components/`.
- **Naming convention**: Use semantic, purpose-revealing names. `@submit-btn` is better than `@btn-1` or `@green-button`.
- **Dynamic selectors**: Use CSS selectors for elements that cannot have `@dusk` attributes (third-party widgets, dynamically injected HTML from external services).

# Performance Considerations

- `@dusk` selector resolution: <1ms per query (CSS attribute selector).
- Page object method calls: Negligible overhead.
- Component `within()` scoping: Adds ~5-10ms (DOM query for root element).
- `whenAvailable()`: Polls every 250ms until timeout (default 5s). Use explicit wait times for slow elements.

# Security Considerations

- `@dusk` attributes are visible in rendered HTML. Avoid exposing sensitive information through attribute values (e.g., don't use `@dusk="user-1-secret-token"`).
- `@dusk` attributes appear in production HTML if not stripped. Consider stripping them in production builds for cleaner HTML output.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using CSS classes as primary selectors | CSS classes are already on elements | CSS refactoring (Tailwind, BEM changes) breaks tests | Use @dusk attributes. CSS is for styling, not test targeting |
| Page objects with too many methods | Adding every possible interaction | Page objects become god classes; tests are hard to follow | Only add methods used by 2+ tests |
| Not using within() for component scoping | Using top-level assertSee() | "See" assertions may match text in the wrong section | $browser->within('@sidebar', fn ($sidebar) => ...) |
| Complex selector chains in tests | `div.content > ul > li:nth-child(2) > a` | DOM changes break the test; unreadable | Add @dusk to the target element or use page object |
| Not using page objects for complex pages | Writing selectors in test files | High maintenance; test logic mixed with selectors | Create a page object for each page with >3 interactions |

# Anti-Patterns

- **In-line CSS selectors throughout tests**: Writing `$browser->click('.btn.btn-primary.form-submit')` instead of using a page object or `@dusk` attribute.
- **Tester-as-DOM-crawler**: Tests that traverse DOM structure (`children()`, `parent()`, `siblings()`) instead of targeting elements directly.
- **Page objects for every trivial interaction**: Creating page objects for pages that have only a single link or text element.
- **Mixing component and page object patterns**: Using a component where a page object is more appropriate, or vice versa.

# Examples

```php
// Blade template with @dusk attribute
<button @dusk("submit-btn") type="submit">Submit</button>

// Dusk test using @dusk selector
$browser->press('@submit-btn')
    ->waitForText('Success')
    ->assertSee('Form submitted');

// Page object
class LoginPage extends Page
{
    public function url() { return '/login'; }

    public function elements()
    {
        return [
            '@email' => 'input[name="email"]',
            '@password' => 'input[name="password"]',
            '@submit' => 'button[type="submit"]',
        ];
    }

    public function login(Browser $browser, $email, $password)
    {
        $browser->type('@email', $email)
            ->type('@password', $password)
            ->press('@submit');
    }
}

// Using page object in test
$browser->on(new LoginPage)
    ->login('user@example.com', 'password')
    ->waitForLocation('/dashboard');

// Component for modal
$browser->within(new ConfirmModal, function ($modal) {
    $modal->assertSee('Are you sure?')
        ->press('@confirm');
});
```

# Related Topics

- **Prerequisites**: Dusk fundamentals, HTML/DOM structure, CSS selectors
- **Related**: Dusk waiting strategies, Component testing, Pest Playwright
- **Advanced**: Custom Dusk macros, Multi-page workflow testing, Visual regression selectors

# AI Agent Notes

- When writing a new Dusk test, first check if the page has an existing page object. If it does, use it. If not, consider creating one if the page has more than 3 interactive elements.
- When you see a Dusk test with CSS class selectors (`.btn-primary`, `.form-control`), flag it for replacement with `@dusk` attributes. These are the most common source of Dusk test breakage during CSS refactoring.
- If a component (modal, date picker, data table) appears on multiple pages, create a component class. This avoids duplicating selector logic across page objects.

# Verification

- [ ] All interactive elements accessed in Dusk tests have `@dusk` attributes
- [ ] Page objects exist for pages with >3 interactions
- [ ] Component objects exist for reusable UI widgets used in multiple tests
- [ ] `within()` is used for scoped assertions, not top-level `assertSee()`
- [ ] Page object methods are used by 2+ tests (or are justified as documentation)
- [ ] No complex CSS selector chains in test files
- [ ] `@dusk` attribute naming follows a consistent project convention
