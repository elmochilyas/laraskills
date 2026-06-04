# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: View & Blade Component Testing
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
View and Blade component testing verifies that templates render correct output, component slots are populated, dynamic data is displayed, and conditional content is shown/hidden appropriately. Laravel provides `assertSee()`, `assertSeeInOrder()`, `assertDontSee()`, and `assertViewHas()` for response content assertions, plus Blade component testing utilities. View tests catch rendering regressions that logic-level tests miss—especially for conditional display, authorization-driven UI elements, and localization.

# Core Concepts
- **`assertSee($text)`**: Asserts the given text appears anywhere in the response HTML.
- **`assertSeeInOrder($texts)`**: Asserts texts appear in order in the response.
- **`assertDontSee($text)`**: Asserts text does not appear in the response.
- **`assertViewHas($key, $value)`**: Asserts a specific variable was passed to the view.
- **`assertViewHasAll($data)`**: Asserts multiple view variables exist.
- **`blade()` rendering**: `$this->blade('component-name', $data)` renders a Blade component directly for isolated testing.
- **Component assertions**: `$component->assertSee('text')` on rendered component instances.
- **Inertia testing**: `assertInertia()` for Inertia.js page assertions (component name, props).

# Mental Models
- **View = output contract**: The view determines what the user sees. Tests verify the output contract—what text, data, and structure the user receives.
- **HTML structure vs text content**: `assertSee()` checks text content. For HTML structure (tags, attributes), use `assertSeeHtml()` or parse with DOMDocument.
- **Component as testable unit**: Blade components are self-contained rendering units. Test them in isolation before testing them in page context.
- **View data = controller output contract**: `assertViewHas()` verifies the controller passed the correct data to the view, independent of rendering.

# Internal Mechanics
- **`assertSee()` implementation**: Uses PHP `strpos()` on the response content (after stripping HTML tags for `assertSee()` but not for `assertSeeHtml()`). Case-insensitive by default.
- **`assertViewHas()`**: Extracts view data from the `TestResponse`'s `$response->getOriginalContent()->getData()`. Works with both Blade and Inertia responses.
- **`blade()` rendering**: Creates a `View` instance via `view()->make()` or `Blade::render()`. The rendered string is returned for assertion.
- **Component rendering**: `$this->component(Alert::class, ['type' => 'error'])` renders the component via `Blade::renderComponent()`.
- **Inertia response parsing**: `assertInertia()` accesses `$response->getOriginalContent()->getData()['page']` to extract Inertia page data.

# Patterns
- **Pattern: Conditional content testing**
  - Purpose: Verify authorized/unauthorized users see correct UI elements
  - Benefits: Catches authorization display bugs
  - Tradeoffs: Requires auth setup per test
  - Implementation: `$this->actingAs($admin)->get('/dashboard')->assertSee('Admin Panel')` and guest version with `assertDontSee()`

- **Pattern: Component slot and prop testing**
  - Purpose: Test component renders content correctly with different slot/prop combinations
  - Benefits: Isolated component tests are fast and focused
  - Tradeoffs: Tests may not catch parent context issues
  - Implementation: `$this->blade('<x-alert type="error">Message</x-alert>')->assertSee('Message')->assertSeeHtml('role="alert"')`

- **Pattern: Localization string rendering**
  - Purpose: Verify translated strings appear in views
  - Benefits: Catches missing translation keys and wrong locale
  - Tradeoffs: Must test each locale
  - Implementation: `$this->withSession(['locale' => 'fr'])->get('/')->assertSee(__('messages.welcome'))`

- **Pattern: Form CSRF and method spoofing**
  - Purpose: Verify forms include CSRF token and method fields
  - Benefits: Prevents form submission failures
  - Tradeoffs: CSRF is usually global; test once
  - Implementation: `assertSee('@csrf')` or `assertSeeHtml('method="POST"')`

# Architectural Decisions
- **`assertSee()` vs `assertSeeHtml()`**: Use `assertSee()` for text content (strips HTML). Use `assertSeeHtml()` for asserting HTML tags exist.
- **Isolated component tests vs full HTTP tests**: Component tests are fast and focused. HTTP tests catch integration issues. Use both.
- **Inertia vs Blade testing**: Inertia uses `assertInertia()` to check props and component name. Blade uses `assertSee()` and `assertViewHas()`. Different assertion toolkits.
- **View data vs rendered output**: Test view data when you care about controller output. Test rendered output when you care about display logic.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| `assertSee()` is simple and fast | Cannot verify HTML structure | Use `assertSeeHtml()` or DOM parsing for structure |
| Isolated component tests are fast | May miss parent context issues | Combine with feature tests for critical components |
| Inertia prop assertions are precise | Only test data, not rendered DOM | Add browser/E2E tests for visual rendering |
| Localization assertions catch missing keys | Must test each locale | Focus on default locale + one secondary |

# Performance Considerations
- `assertSee()` is a simple string search. <0.1ms per assertion.
- HTML parsing (DOMDocument) for structure assertions adds 1-5ms for large responses. Use sparingly.
- Component rendering via `$this->blade()` is faster than full HTTP request (~5ms vs ~40ms).
- Inertia page extraction is negligible (<0.5ms).

# Production Considerations
- **Accessibility**: View tests should include basic accessibility assertions (alt text on images, labels on inputs, role attributes).
- **Empty states**: Test views with empty collections display appropriate "no data" messages.
- **Error states**: Test views with error bags display error messages correctly.
- **Pagination links**: Test that pagination controls appear when there are more items than the per-page limit.

# Common Mistakes
- **Mistake: Using `assertSee()` on dynamic data**
  - Why: Data that changes per test run (timestamps, random strings)
  - Why harmful: Test passes inconsistently
  - Better: Assert static text or use regex with `assertSeeRegex()`

- **Mistake: Not testing conditional display**
  - Why: Focus on happy path rendering
  - Why harmful: Auth-gated UI elements show to wrong users
  - Better: Test each conditional branch: `assertSee()` for authorized, `assertDontSee()` for unauthorized

- **Mistake: Asserting exact HTML output**
  - Why: Matching full rendered strings
  - Why harmful: Whitespace changes, class reordering, minor HTML tweaks break tests
  - Better: Assert specific text or HTML fragments, not full output

- **Mistake: Not testing fallback/default content**
  - Why: Only test with provided slots/props
  - Why harmful: Default slot content or fallback text may be broken
  - Better: Test component with and without optional slots/props

# Failure Modes
- **HTML escaping**: `assertSee('<script>')` sees the escaped `&lt;script&gt;` text. Use `assertSeeHtml('<script>')` for unescaped HTML. Understanding this difference is critical.
- **Whitespace in assertions**: Multi-line text with whitespace may not match `assertSeeInOrder()`. Use `assertSee()` for individual strings.
- **View composer data**: Data added by view composers is only available when the view is rendered via HTTP, not via `$this->blade()`. Use HTTP tests when view composers are involved.
- **Inertia SSR differences**: Inertia server-side rendering may produce different HTML than client-side. Test both.

# Ecosystem Usage
- **Laravel core**: Laravel's test suite uses `assertSee()`, `assertViewHas()`, and component assertions extensively.
- **Laravel Breeze**: Breeze's authentication views are tested with `assertSee()` for login/register forms.
- **Laravel Jetstream**: Team management views tested with conditional content assertions for different roles.
- **Laravel Nova**: Nova's custom fields and components use isolated component rendering tests.
- **LiveWire**: `livewire:test()` provides component-level testing with `assertSee()` built in.

# Related Knowledge Units
- **Prerequisites**: Blade templating, HTTP test helpers, Laravel localization
- **Related Topics**: Component design, Authorization testing, Inertia testing
- **Advanced Follow-up**: Custom Blade directive testing, View composer testing, Accessibility assertion integration

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server — requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
