# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Browser & E2E Testing
Knowledge Unit: Dusk Selectors, Page Objects, Components
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Dusk selectors, page objects, and components provide structured access to DOM elements in browser tests, encapsulating selector logic and interaction patterns. The `@dusk` attribute selector convention provides CSS-independent element references; page objects organize selectors and interaction methods per page; components represent reusable UI elements. Without these abstractions, Dusk tests become brittle, unreadable, and tightly coupled to DOM structure.

# Core Concepts
- **`@dusk` attribute selector**: Add `@dusk="name"` to HTML elements. Use `$browser->@name` or `$browser->element('@name')` to reference elements. Independent of CSS classes or IDs.
- **Page objects**: Classes extending `Laravel\Dusk\Page`. Define `url()`, `elements()` (selector map), and interaction methods.
- **`elements()` method**: Returns an associative array of `name => selector`. Selectors can be `@dusk` references, CSS selectors, or XPath.
- **Component objects**: Classes extending `Laravel\Dusk\Component`. Represent reusable UI pieces (navbars, modals, forms). Used via `$browser->within()`.
- **`within()`**: Scopes browser interactions to a component's root element.
- **Selector priority**: `@dusk` attributes ? named elements from page objects ? CSS selectors ? XPath. Prefer first.
- **`$browser->with('@modal')->assertSee('Confirm')`**: Scopes assertion to within a specific element.

# Mental Models
- **`@dusk` as stable API for tests**: The `@dusk` attribute is an API contract between Blade templates and tests. It should change only when the element's semantic purpose changes, not when styling changes.
- **Page object as page model**: A page object models what the page is and does, not how it's implemented. Tests talk in business terms: `$browser->on(new LoginPage)->loginAs($user)`.
- **Component as reusable widget**: A modal, date picker, or data table appears on multiple pages. Component objects encapsulate its selectors once.
- **Selector layer decoupling**: Blade templates ? `@dusk` attributes ? page objects ? tests. Changes at each layer only affect the adjacent layer.

# Internal Mechanics
- **`@dusk` resolution**: Dusk registers a custom directive. `@dusk("submit")` renders as `dusk="submit"`. Dusk's macro resolver converts `$browser->@submit` to `[dusk="submit"]` CSS selector.
- **Page object registration**: `$browser->on(new Page)` sets the page. Subsequent `elements()` lookups use the page's selector map. `url()` defines the expected current URL.
- **Component `selector()`**: Each component defines a root element selector. `$browser->within(new Modal)` finds the root element and scopes all child interactions.
- **Dynamic selectors**: `$browser->whenAvailable('@modal', fn ($modal) => ...)` waits for an element to become available (for async-rendered content).
- **`assertPresent()`/`assertMissing()`**: Checks DOM presence without visibility. For visibility checks, use `assertVisible()`/`assertNotVisible()`.

# Patterns
- **Pattern: `@dusk` attribute on interactive elements**
  - Purpose: Stable selectors for buttons, inputs, links
  - Benefits: CSS/structure changes don't break tests
  - Tradeoffs: Requires Blade template updates for new elements
  - Implementation: `<button @dusk("submit-btn")>Submit</button>` ? `$browser->press('@submit-btn')`

- **Pattern: Page class with assertion helpers**
  - Purpose: Encapsulate page-specific assertions
  - Benefits: Tests read as business language; selectors centralized
  - Tradeoffs: More classes; test logic is in two places
  - Implementation: `class LoginPage extends Page { public function assertLoggedIn($browser) { $browser->assertSee('Dashboard'); } }`

- **Pattern: Component for modal interactions**
  - Purpose: Encapsulate modal open/close/confirm logic
  - Benefits: Consistent modal testing across tests
  - Tradeoffs: Component creation overhead for simple modals
  - Implementation: `$browser->within(new ConfirmModal, fn ($modal) => $modal->press('@confirm'))`

- **Pattern: Dynamic content waiting**
  - Purpose: Wait for async-loaded content before interaction
  - Benefits: Reliable testing of JavaScript-heavy interfaces
  - Tradeoffs: Longer test execution time
  - Implementation: `$browser->waitForText('Loading complete')->whenAvailable('@results', fn ($results) => $results->assertSee('Item'))`

# Architectural Decisions
- **Page objects for pages, components for widgets**: Page = full page URL. Component = reusable UI widget. Different lifecycle and scoping.
- **`@dusk` vs `data-testid`**: Both serve the same purpose. Laravel convention uses `dusk` attribute name. `data-testid` is the broader web convention.
- **CSS selectors as fallback**: Use CSS selectors when `@dusk` is not available (third-party packages, legacy code). Prefer `@dusk` for new code.
- **XPath for complex DOM traversal**: XPath is powerful but fragile. Use only when CSS selectors are insufficient (e.g., finding elements by text content).

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| `@dusk` selectors are stable | Requires Blade template changes | Worth it for test reliability |
| Page objects abstract page structure | Page creation overhead | Reusable across tests; high ROI |
| Components encapsulate widget logic | Component hierarchy can get complex | Limit to 1 level of nesting |
| Dynamic content waiting is reliable | Slower tests | Acceptable for E2E tests |

# Performance Considerations
- `@dusk` selector resolution: <1ms per query (CSS selector).
- Page object method calls: Negligible overhead.
- Component `within()` scoping: Adds ~5-10ms (DOM query for root element).
- `waitFor()`/`waitForText()`: Polls every 250ms until timeout (default 5s). Use explicit wait times for slow elements.
- `whenAvailable()`: Same polling mechanism. Use with async content.

# Production Considerations
- **`@dusk` attribute maintenance**: Add `@dusk` to all interactive elements during development. Review during code review.
- **Selector convention documentation**: Document `@dusk` naming conventions in project README. Consistent naming (`@submit-btn`, `@email-input`) improves maintainability.
- **Page object reuse**: Shared page objects across test files reduce duplication. Store in `tests/Browser/Pages/`.
- **Component registration**: Register components globally or per-test. Global registration can lead to name collisions.

# Common Mistakes
- **Mistake: Using CSS classes as primary selectors**
  - Why: CSS classes are already on elements
  - Why harmful: CSS refactoring (Tailwind, BEM changes) breaks tests
  - Better: Use `@dusk` attributes. CSS is for styling, not test targeting.

- **Mistake: Page objects with too many methods**
  - Why: Adding every possible interaction to page object
  - Why harmful: Page objects become god classes; tests are hard to follow
  - Better: Only add methods used by 2+ tests. Test-specific interactions stay in test files.

- **Mistake: Not using `within()` for component scoping**
  - Why: Using top-level `$browser->assertSee()` instead of scoping
  - Why harmful: "See" assertions may match text in the wrong section (navbar vs content)
  - Better: `$browser->within('@sidebar', fn ($sidebar) => $sidebar->assertSee('Filter'))`

- **Mistake: Complex selector chains in tests**
  - Why: `$browser->with('div.content > ul > li:nth-child(2) > a')->click()`
  - Why harmful: DOM changes break the test; unreadable
  - Better: Add `@dusk` to the target element or use page object

# Failure Modes
- **`@dusk` attribute missing**: Element not found. Dusk throws `ElementNotFoundException`. Check that `@dusk` attribute exists in rendered HTML.
- **Stale page object**: Page URL changed but page object `url()` not updated. `assertPathIs()` fails. Update page object.
- **Component root not found**: Component `selector()` doesn't match any element. Update selector.
- **Dynamic element timing**: Element rendered after Dusk query. Use `waitFor()` before accessing.

# Ecosystem Usage
- **Laravel core**: `laravel/dusk` package includes base `Page` and `Component` classes. Documentation demonstrates selector and page object patterns.
- **Laravel Jetstream**: Jetstream's Dusk tests use page objects for team management, API token pages, and profile pages.
- **Laravel Nova**: Nova's test suite extensively uses `@dusk` selectors and page objects for resource management flows.
- **Vue/LiveWire/Laravel**: Frontend frameworks work well with `@dusk` selectors. The `dusk` attribute is preserved through Vue/LiveWire rendering.

# Related Knowledge Units
- **Prerequisites**: Dusk fundamentals, HTML/DOM structure, CSS selectors
- **Related Topics**: Dusk waiting strategies, Component testing, Pest Playwright
- **Advanced Follow-up**: Custom Dusk macros, Multi-page workflow testing, Visual regression selectors

# Research Notes
- Laravel Dusk remains the primary browser testing tool for Laravel as of 2026, with Pest's Playwright integration emerging as a modern alternative for teams already using Pest
- Browser testing best practices emphasize waiting strategies over fixed sleep() calls — Dusk's waitFor* methods and Playwright's auto-waiting reduce flakiness significantly
- CI/CD browser testing requires Chrome/Chromium installation; headless mode is the default in CI environments; GitHub Actions provides chromium via shivammathur/setup-php extension
- Page Object Model pattern reduces test maintenance by centralizing selector definitions and interaction methods; teams maintaining >20 browser tests should adopt this pattern
- Mobile viewport testing is increasingly important; responsive design regressions are a common source of undetected bugs in Laravel applications
