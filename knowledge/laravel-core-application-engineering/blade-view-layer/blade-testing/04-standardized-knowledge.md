# Blade Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Blade Testing
- **Difficulty Level:** Intermediate
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Blade view testing verifies that templates render correctly with given data — variables displayed, conditionals branch correctly, loops iterate, and components render expected output. Laravel provides `assertSee()`, `assertDontSee()`, and `assertViewHas()` for testing views in isolation or as part of HTTP responses.

**Engineering value:** Catching presentation bugs before production. A template that renders an unescaped variable (XSS), an incorrect conditional branch, or a missing translation string is a presentation bug. View tests catch these without full browser testing.

---

## Core Concepts

### View Rendering in Tests
```php
public function test_user_name_is_displayed()
{
    $view = view('users.show', ['user' => User::factory()->make(['name' => 'John'])]);
    $content = $view->render();

    $this->assertStringContainsString('John', $content);
}
```

### HTTP Response Assertions
```php
public function test_show_displays_user()
{
    $user = User::factory()->create();
    $response = $this->get("/users/{$user->id}");

    $response->assertStatus(200);
    $response->assertSee($user->name);
}
```

### Component Testing
```php
public function test_alert_component_renders_message()
{
    $component = new Alert(type: 'success', message: 'Saved!');
    $rendered = $component->render()->call($component);

    $this->assertStringContainsString('alert-success', $rendered);
    $this->assertStringContainsString('Saved!', $rendered);
}
```

### The `blade()` Test Helper
```php
public function test_custom_directive()
{
    $rendered = $this->blade('@greet("World")');
    $rendered->assertSee('Hello, World!');
}
```

### Assertion Methods
| Method | Checks | Example |
|---|---|---|
| `assertSee('text')` | HTML contains text (unescaped) | `$response->assertSee('John')` |
| `assertSeeText('text')` | HTML contains text (stripped tags) | `$response->assertSeeText('John')` |
| `assertDontSee('text')` | HTML does NOT contain text | `$response->assertDontSee('secret')` |
| `assertSeeInOrder(['a', 'b'])` | Text appears in order | `$response->assertSeeInOrder(['Name', 'Email'])` |
| `assertViewHas('key')` | View has data variable | `$response->assertViewHas('user')` |
| `assertViewMissing('key')` | View does not have data | `$response->assertViewMissing('secret')` |

---

## When To Use

- **Conditional rendering verification** — admin sees admin panel; user doesn't
- **Loop correctness** — all items in collection are displayed
- **Component contracts** — components render with expected props and slots
- **Translation strings** — correct locale is rendered
- **Critical UI paths** — login form, checkout, error pages
- **Custom directive output** — directive compiles and produces expected PHP/HTML
- **Regression prevention** — after refactoring templates, verify key content still renders

---

## When NOT To Use

- **CSS/visual layout** — use Laravel Dusk or browser tests for visual regression
- **JavaScript behavior** — Blade tests are server-only; use Dusk for JS interaction
- **Framework mechanics** — don't test that `view()` returns a View instance (test your content)
- **Every possible data permutation** — test critical paths and boundary conditions, not every combination
- **Excessive structural assertions** — asserting on `<div>` classes and HTML structure creates brittle tests

---

## Best Practices (WHY)

**WHY assert on visible content, not HTML structure.** `$response->assertSee('Welcome, John!')` survives template refactoring. `$response->assertSee('<div class="greeting">', false)` breaks on any HTML change. Content assertions are stable; structural assertions are brittle.

**WHY assertSeeText over assertSee for text content.** `assertSeeText('Users')` strips HTML tags before checking, so it works regardless of whether the text is in an `<h1>`, `<p>`, or `<span>`. `assertSee('Users')` checks the raw HTML string including tags.

**WHY test conditional branches in pairs.** If you test that an admin sees the admin panel, also test that a non-admin does NOT see it. A single assertion only validates one branch — both branches need verification.

**WHY use view unit tests for logic, HTTP tests for data flow.** Unit tests (`view('name', $data)->render()`) are faster and isolate the template. HTTP tests (`$this->get('/route')`) verify the full stack including middleware, controllers, and view data binding. Use unit tests for template logic; HTTP tests for data flow.

**WHY test component classes separately from their views.** A class-based component's `render()` method and constructor can be unit-tested without rendering the Blade template. This catches logic bugs faster. Test the view separately for rendering correctness.

**WHY avoid testing framework functionality.** `$this->assertInstanceOf(View::class, view('page'))` tests that Laravel's `view()` function works — not your code. Test your view CONTENT, not framework mechanisms.

---

## Architecture Guidelines

### View Unit Tests vs HTTP Integration Tests
| Concern | View Unit Test | HTTP Integration Test |
|---|---|---|
| Speed | Fast (<1ms) | Slower (50-200ms) |
| Isolation | View only | Full stack |
| Data setup | Direct factory/make | Same |
| Confidence | Medium (data format) | High (full request/response) |

### Testing Pyramid for Views
1. **Unit tests** (fastest) — test view model logic, component class methods, helper functions
2. **View tests** — render isolated views with assertions on rendered HTML
3. **HTTP tests** — test full controller-to-view flow with assertions on response
4. **Browser tests** (slowest, Dusk) — test interactive behavior, JS, visual layout

### What to Test per Component
- Constructor parameters correctly used in render
- Slots render content correctly
- Conditional display logic (if/else branches)
- Attribute merging behavior

---

## Performance

- View tests render the template per assertion context — 10 assertions may re-render 10 times
- Use `$this->blade()` helper (caches per test method) to avoid redundant renders
- HTTP tests are 50-200ms per request due to full framework boot — batch assertions within one request
- Pest tests have slightly lower overhead than PHPUnit for simple assertions

---

## Security

- Test that user input is correctly escaped: `$response->assertSee('&lt;script&gt;')` confirms XSS protection
- Test that sensitive data is NOT rendered: `$response->assertDontSee($user->internal_note)`
- Test that unauthorized users don't see privileged UI elements (admin links, edit buttons)
- `assertSee` checks the raw HTML — escaped data appears as `&lt;` not `<`; use `assertSeeText` for decoded content

---

## Common Mistakes

### 1. Testing framework behavior instead of custom logic
- **Description:** `$this->assertInstanceOf(View::class, view('page'))`
- **Cause:** Not distinguishing between "testing Laravel" and "testing my code"
- **Consequence:** Test passes trivially; provides no value; breaks on Laravel upgrades for no reason
- **Better:** Test your view CONTENT — what strings appear, what conditionals render

### 2. Hardcoding HTML structure in assertions
- **Description:** `$response->assertSee('<h1>Users</h1>', false)`
- **Cause:** Asserting on the exact HTML output
- **Consequence:** Test breaks on any minor HTML change (adding a class, changing tag)
- **Better:** `$response->assertSeeText('Users')` — asserts content, not structure

### 3. Over-asserting (testing everything)
- **Description:** 20 assertions per view checking every `<div>` and CSS class
- **Cause:** Trying to achieve 100% coverage of rendered HTML
- **Consequence:** Tests are brittle; every CSS change breaks tests; high maintenance cost
- **Better:** Test critical content paths — visible text, conditional branches, data presence

### 4. Not testing conditional branches
- **Description:** Only testing the "admin" condition, not the "non-admin" condition
- **Cause:** Writing tests that follow the happy path only
- **Consequence:** Missing the else branch — a template change could break the non-admin path silently
- **Better:** Always test both branches of every conditional

### 5. assertSee with HTML entities confusion
- **Description:** `$response->assertSee('<script>')` expecting to find escaped script tag
- **Cause:** Forgetting that Blade's `{{ }}` escapes HTML
- **Consequence:** Test fails because actual output is `&lt;script&gt;`
- **Better:** Use `assertSee('&lt;script&gt;')` or `assertSeeText('<script>')`

---

## Anti-Patterns

- **Snapshot testing for view HTML.** `$response->assertMatchesSnapshot()` stores the full HTML — every intentional change requires snapshot updates, and the diff is hard to review.
- **Testing every template in the application.** Focus on templates with conditionals, loops, and user-specific data. Static pages (About, Contact) rarely change and don't need tests.
- **View tests that depend on database state.** Use `make()` instead of `create()` when possible to avoid database dependencies in view unit tests.
- **Asserting on translated strings by their key.** `$response->assertSee('messages.welcome')` — assert on the translated VALUE, not the translation key.
- **Testing CSS classes for styling correctness.** Class names like `btn-primary` or `text-lg` change with UI updates. Test functional content, not visual styling.

---

## Examples

### Testing View Data Existence
```php
public function test_index_passes_users_to_view()
{
    $users = User::factory()->count(3)->create();
    $response = $this->get('/users');

    $response->assertViewHas('users');
    $response->assertViewHas('users', function ($viewUsers) use ($users) {
        return $viewUsers->count() === 3;
    });
}
```

### Testing Conditional Branches
```php
public function test_admin_sees_admin_panel()
{
    $admin = User::factory()->admin()->create();
    $response = $this->actingAs($admin)->get('/dashboard');
    $response->assertSee('admin-panel');
}

public function test_user_does_not_see_admin_panel()
{
    $user = User::factory()->create();
    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertDontSee('admin-panel');
}
```

### Testing Loop Iteration
```php
public function test_users_are_listed()
{
    $users = User::factory()->count(3)->create();
    $response = $this->get('/users');

    foreach ($users as $user) {
        $response->assertSee($user->name);
    }
}
```

### Testing Component Slots
```php
public function test_card_component_renders_slot_content()
{
    $rendered = $this->blade(
        '<x-card><p>Slot Content</p></x-card>',
    );
    $rendered->assertSee('Slot Content');
}
```

### Testing Translation Output
```php
public function test_welcome_message_is_translated()
{
    App::setLocale('es');

    $view = view('welcome');
    $content = $view->render();

    $this->assertStringContainsString('Bienvenido', $content);
    $this->assertStringNotContainsString('Welcome', $content);
}
```

### Testing Custom Directive
```php
public function test_money_directive_formats_correctly()
{
    $rendered = $this->blade('@appMoney(1999)');
    $rendered->assertSee('19.99');
}
```

---

## Related Topics

- **Component System** — testing class-based components
- **View Composers / Creators** — testing composer data injection
- **Custom Directives** — testing directive output with blade() helper
- **Form Request Testing** (Form Requests and Validation) — view assertions in form tests
- **Localization in Views** — testing translation output per locale

---

## AI Agent Notes

- `$this->blade()` method was introduced in Laravel 8 for rendering Blade strings in tests
- `assertViewHas` checks the data array passed to the view, not the rendered output
- `assertSee` checks rendered HTML string AFTER escaping — it does NOT interpret the DOM
- ~45% of Laravel applications have view tests; `assertSee` (80%) and `assertDontSee` (50%) are most common
- TestView class (`Illuminate\Testing\TestView`) provides `assertSee`, `assertSeeInOrder`, `assertSeeText`
- Pest offers more expressive view assertions: `$this->blade('<x-alert />')->assertSee('...')`
- Third-party: `spatie/laravel-html` testing, `pestphp/pest` with `->assertSee()` support

---

## Verification

- [ ] Critical conditional branches (admin/user, authed/guest) are tested in both directions
- [ ] Loop rendering is verified — all expected items appear in the output
- [ ] Component contracts are tested — props, slots, and attributes render correctly
- [ ] Translation output is tested for supported locales
- [ ] XSS protection is verified — user input appears escaped in rendered HTML
- [ ] No tests assert on HTML structure (tags, classes) — all assert on visible content
- [ ] View unit tests are fast (<1ms each) and don't depend on HTTP or database unnecessarily
- [ ] Custom directives are tested with the `blade()` helper
- [ ] `assertDontSee` is used to confirm sensitive data is NOT exposed
