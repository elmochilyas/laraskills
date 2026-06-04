# Rules — Dusk Selectors, Page Objects, Components

## Rule 1: Always Use `@dusk` Attributes for All Interactive Elements
| Field | Value |
|-------|-------|
| **Name** | Always Use `@dusk` Attributes for All Interactive Elements |
| **Category** | Selectors & Stability |
| **Rule** | Always add `@dusk="name"` attributes to all interactive elements in Blade templates that are accessed in Dusk tests. Never use CSS classes or IDs as primary selectors. |
| **Reason** | CSS classes are for styling, not test targeting. `@dusk` attributes create a stable API contract between templates and tests. Changing a CSS framework (Tailwind, Bootstrap, BEM) won't break tests. |
| **Bad Example** | `$browser->click('.btn-primary')->type('#email-input', 'test@test.com')` — CSS class or ID changes break the test. |
| **Good Example** | Blade: `<button @dusk="submit-btn">Submit</button>`; Test: `$browser->press('@submit-btn')`. |
| **Exceptions** | Third-party UI where you cannot add `@dusk` attributes. Use CSS selectors as fallback. |
| **Consequences Of Violation** | Brittle tests that break on CSS refactoring; high maintenance cost. |

## Rule 2: Use Page Objects for Pages with >3 Interactive Elements
| Field | Value |
|-------|-------|
| **Name** | Use Page Objects for Pages with >3 Interactive Elements |
| **Category** | Organization & Maintainability |
| **Rule** | Create a Dusk Page object (extending `Laravel\Dusk\Page`) for any page with more than 3 interactive elements. Store in `tests/Browser/Pages/`. |
| **Reason** | Page objects encapsulate selectors and interaction logic in one place, preventing duplication across tests. When the page structure changes, only the page object needs updating. |
| **Bad Example** | Writing CSS selectors and interaction code directly in 5 different test files for the same login page. |
| **Good Example** | `LoginPage` with `elements()` mapping and `login()` method; tests call `$browser->on(new LoginPage)->login(...)`. |
| **Exceptions** | Single-interaction pages (one button, one link) where page objects add unnecessary abstraction. |
| **Consequences Of Violation** | Selector duplication; high maintenance when selectors change; test logic mixed with selectors. |

## Rule 3: Use Components for Reusable UI Widgets
| Field | Value |
|-------|-------|
| **Name** | Use Components for Reusable UI Widgets |
| **Category** | Organization & Maintainability |
| **Rule** | Create Dusk Component objects (extending `Laravel\Dusk\Component`) for reusable UI widgets (modals, navbars, data tables, date pickers) that appear on multiple pages. Store in `tests/Browser/Components/`. |
| **Reason** | Components avoid duplicating selector logic across page objects and tests. A modal that appears on 5 pages should have one component definition, not 5 page objects with duplicated selectors. |
| **Bad Example** | Duplicating modal interaction code in 5 different page objects for a confirmation dialog. |
| **Good Example** | `ConfirmModal extends Component` with `elements()` and `confirm()` method; used via `$browser->within(new ConfirmModal, fn ($m) => $m->press('@confirm'))`. |
| **Exceptions** | Widgets used on a single page belong in the page object, not a separate component. |
| **Consequences Of Violation** | Duplicated selector logic; inconsistent interaction patterns across tests. |

## Rule 4: Use `within()` for Scoped Assertions
| Field | Value |
|-------|-------|
| **Name** | Use `within()` for Scoped Assertions |
| **Category** | Assertions & Accuracy |
| **Rule** | Use `$browser->within('@selector', fn ($scope) => ...)` to scope assertions to specific page sections. Never use top-level `assertSee()` when the expected text could match in the wrong section. |
| **Reason** | Top-level `assertSee()` searches the entire page. A sidebar, header, or footer may contain matching text, causing false-positive passes or misleading failures. Scoping ensures assertions only match within the intended section. |
| **Bad Example** | `$browser->assertSee('Filter')` — matches text in sidebar, main content, or footer; ambiguous intent. |
| **Good Example** | `$browser->within('@sidebar', fn ($s) => $s->assertSee('Filter'))` — clearly scopes assertion to sidebar. |
| **Exceptions** | Tests where the expected text is guaranteed to be unique on the page (e.g., page title). |
| **Consequences Of Violation** | False-positive test passes when text appears in unexpected page sections; tests don't verify the right content. |

## Rule 5: Limit Page Object Methods to Those Used by 2+ Tests
| Field | Value |
|-------|-------|
| **Name** | Limit Page Object Methods to Those Used by 2+ Tests |
| **Category** | Organization & Maintainability |
| **Rule** | Only add interaction methods to a page object when they are used by at least 2 tests. One-off interaction logic belongs in the test file, not the page object. |
| **Reason** | Page objects become unmaintainable "god classes" when they contain every possible interaction for the page. Keeping methods that serve single tests in the test file keeps page objects focused and maintainable. |
| **Bad Example** | `LoginPage` with 20 methods for every possible login variation, 18 of which are used by exactly one test. |
| **Good Example** | `LoginPage` with `login()`, `loginWithRemember()`, and `loginWithInvalidCredentials()` — all used by multiple tests. |
| **Exceptions** | Methods that serve as documentation for the page structure, even if used by only one test (justify with a comment). |
| **Consequences Of Violation** | Bloated page objects; high maintenance burden; difficult to navigate and understand. |

## Rule 6: Follow Selector Priority: `@dusk` > Page Object Named Elements > CSS > XPath
| Field | Value |
|-------|-------|
| **Name** | Follow Selector Priority: `@dusk` > Page Object Named Elements > CSS > XPath |
| **Category** | Selectors & Stability |
| **Rule** | Always prefer selectors in this priority order: `@dusk` attributes, then page object named elements from `elements()` array, then CSS selectors, then XPath. Use the most stable option available. |
| **Reason** | Higher-priority options are more stable and readable. `@dusk` attributes never change with styling. XPath is brittle, slow, and unreadable. |
| **Bad Example** | `$browser->element('//div[@class="content"]/ul/li[2]/a')` — XPath that breaks on any DOM structure change. |
| **Good Example** | `<a @dusk="user-link">Profile</a>` → `$browser->click('@user-link')`. |
| **Exceptions** | Third-party embedded widgets where you cannot control the DOM. Use CSS selectors. |
| **Consequences Of Violation** | Brittle, unreadable tests that fail on DOM changes. |

## Rule 7: Never Use Complex CSS Selector Chains in Test Files
| Field | Value |
|-------|-------|
| **Name** | Never Use Complex CSS Selector Chains in Test Files |
| **Category** | Selectors & Stability |
| **Rule** | Never write complex CSS selector chains (e.g., `div.content > ul > li:nth-child(2) > a`) directly in test files. Extract to `@dusk` attributes or page object element definitions. |
| **Reason** | Complex selector chains are tightly coupled to DOM structure, unreadable, and break on any HTML change. They make tests impossible to understand without cross-referencing the rendered page. |
| **Bad Example** | `$browser->click('div.user-list > ul.items > li:nth-child(3) > a.view')` — unreadable and brittle. |
| **Good Example** | Add `@dusk="view-user-3"` to the target element; test: `$browser->click('@view-user-3')`. |
| **Exceptions** | Dynamic element targeting where `@dusk` attributes cannot be added and the selector must be built at runtime. |
| **Consequences Of Violation** | Tests fail on DOM changes; time wasted debugging complex selectors. |
