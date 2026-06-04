# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | View & Blade Component Testing |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Blade templating, HTTP test helpers, Laravel localization |
| Related KUs | Component design, Authorization testing, Inertia testing |
| Source | domain-analysis.md K026 |

# Overview

View and Blade component testing verifies that templates render correct output, component slots are populated, dynamic data is displayed, and conditional content is shown/hidden appropriately. Laravel provides `assertSee()`, `assertSeeInOrder()`, `assertDontSee()`, and `assertViewHas()` for response content assertions, plus Blade component testing utilities. View tests catch rendering regressions that logic-level tests miss — especially for conditional display, authorization-driven UI elements, and localization.

# Core Concepts

- **`assertSee($text)`**: Asserts the given text appears anywhere in the response HTML.
- **`assertSeeInOrder($texts)`**: Asserts texts appear in order in the response.
- **`assertDontSee($text)`**: Asserts text does not appear in the response.
- **`assertViewHas($key, $value)`**: Asserts a specific variable was passed to the view.
- **`assertViewHasAll($data)`**: Asserts multiple view variables exist.
- **`blade()` rendering**: `$this->blade('component-name', $data)` renders a Blade component directly for isolated testing.
- **Component assertions**: `$component->assertSee('text')` on rendered component instances.
- **Inertia testing**: `assertInertia()` for Inertia.js page assertions (component name, props).

# When To Use

- For every Blade component in the application
- For conditional content (authorization-gated UI elements)
- For localization/translation rendering
- For form rendering (CSRF tokens, method spoofing)
- For view data contracts (verify controller passes correct data)

# When NOT To Use

- For testing business logic (extract to unit tests)
- For testing CSS styles or visual layout (use E2E tests)
- When `assertViewHas()` is used instead of testing rendered output (use both strategically)
- For components that are simple wrappers with no conditional logic

# Best Practices (WHY)

- **Test each conditional branch**: For authorization-gated elements, test both `assertSee()` (authorized) and `assertDontSee()` (unauthorized). Missing one side means display bugs for specific user roles.
- **Test component slots and props in isolation**: `$this->blade('<x-alert type="error">Message</x-alert>')->assertSee('Message')` is fast and focused. Test components individually before page-level tests.
- **Use `assertSee()` for text, `assertSeeHtml()` for structure**: `assertSee()` strips HTML tags, checking visible text. `assertSeeHtml()` checks raw HTML. Use the right tool for the right assertion.
- **Test fallback/default content**: Components with optional slots should be tested both with and without slot content. Default content may be broken.
- **Don't assert exact full HTML output**: Whitespace changes, class reordering, and minor HTML tweaks break exact-match tests. Assert specific text or HTML fragments.

# Architecture Guidelines

- **`assertSee()` vs `assertSeeHtml()`**: Use `assertSee()` for text content (strips HTML). Use `assertSeeHtml()` for asserting HTML tags exist.
- **Isolated component tests vs full HTTP tests**: Component tests are fast (~5ms). HTTP tests catch integration issues (~40ms). Use both.
- **Inertia vs Blade testing**: Inertia uses `assertInertia()` for props/component. Blade uses `assertSee()` and `assertViewHas()`. Different assertion toolkits.
- **View data vs rendered output**: Test view data (`assertViewHas()`) when you care about controller output. Test rendered output when you care about display logic.

# Performance Considerations

- `assertSee()` is a simple string search: <0.1ms per assertion.
- HTML parsing (DOMDocument): 1-5ms for large responses. Use sparingly.
- Component rendering via `$this->blade()`: ~5ms vs ~40ms for full HTTP request.
- Inertia page extraction: <0.5ms.

# Security Considerations

- Test that XSS in user-provided data is properly escaped in views.
- Test that CSRF tokens are present in forms.
- Test that sensitive data (roles, permissions, PII) is not displayed to unauthorized users.
- Test that error messages don't leak sensitive information.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using `assertSee()` on dynamic data | Data changes per test run | Test passes inconsistently | Assert static text or use `assertSeeRegex()` |
| Not testing conditional display | Focus on happy path rendering | Auth-gated UI elements show to wrong users | Test each conditional branch: `assertSee()` for authorized, `assertDontSee()` for unauthorized |
| Asserting exact HTML output | Matching full rendered strings | Whitespace/class changes break tests | Assert specific text or HTML fragments |
| Not testing fallback/default content | Only test with provided slots/props | Default slot content may be broken | Test component with and without optional slots/props |

# Anti-Patterns

- **Exact HTML matching**: Using `assertSeeHtml()` on the full rendered output. Tests become brittle on every HTML change.
- **No authorization-gated UI tests**: Only testing that the page loads, not what different roles see. Missing display bugs for unauthorized users.
- **Testing all views via full HTTP**: Every view test goes through the full HTTP stack. Component isolation tests are faster and more focused.
- **Ignoring view composers**: Testing views via `$this->blade()` when view composers add critical data. Use HTTP tests when view composers are involved.

# Examples

```php
// Basic content assertion
public function test_dashboard_shows_welcome_message()
{
    $this->actingAs(User::factory()->create())
        ->get('/dashboard')
        ->assertSee('Welcome back!');
}

// Conditional content for authorized users
public function test_admin_sees_admin_panel_link()
{
    $this->actingAs(User::factory()->admin()->create())
        ->get('/dashboard')
        ->assertSee('Admin Panel');
}

public function test_regular_user_does_not_see_admin_panel()
{
    $this->actingAs(User::factory()->create())
        ->get('/dashboard')
        ->assertDontSee('Admin Panel');
}

// Isolated component test
public function test_alert_component_renders_correctly()
{
    $rendered = $this->blade(
        '<x-alert type="error" :dismissible="true">Something went wrong</x-alert>'
    );

    $rendered->assertSee('Something went wrong');
    $rendered->assertSeeHtml('role="alert"');
}

// View data assertion
public function test_dashboard_receives_user_count()
{
    User::factory(5)->create();

    $this->actingAs(User::factory()->create())
        ->get('/dashboard')
        ->assertViewHas('userCount', 6);
}

// Component with and without slot
public function test_card_component_default_content()
{
    $this->blade('<x-card/>')
        ->assertSee('No content provided');
}

public function test_card_component_with_slot()
{
    $this->blade('<x-card>Custom content</x-card>')
        ->assertSee('Custom content')
        ->assertDontSee('No content provided');
}
```

# Related Topics

- **Prerequisites**: Blade templating, HTTP test helpers, Laravel localization
- **Related**: Component design, Authorization testing, Inertia testing
- **Advanced**: Custom Blade directive testing, View composer testing, Accessibility assertion integration

# AI Agent Notes

- For authorization-gated UI, always test both sides: the user who should see the element and the user who should not. This is the most common view testing gap.
- Use `$this->blade()` for fast component isolation tests and HTTP tests for integration coverage. Both are valuable.
- Be careful with HTML escaping: `assertSee('<script>')` will match the escaped `&lt;script&gt;` text. Use `assertSeeHtml()` for unescaped HTML.
- View composer data is only available via HTTP tests, not `$this->blade()`.

# Verification

- [ ] Every Blade component with conditional logic has both `assertSee()` and `assertDontSee()` tests
- [ ] View data contracts are verified with `assertViewHas()`
- [ ] Components are tested in isolation via `$this->blade()`
- [ ] Components with optional slots are tested with and without slot content
- [ ] Localized strings are tested for at least the default locale
- [ ] XSS escaping is verified for user-provided content
- [ ] CSRF tokens in forms are verified
- [ ] HTML structure assertions use fragments, not full output
- [ ] View composer-dependent content is tested via HTTP tests
