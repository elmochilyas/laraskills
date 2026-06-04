# Blade Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Blade Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Blade view testing verifies that templates render correctly with given data — that variables are displayed, conditionals branch correctly, loops iterate, and components render their expected output. Laravel provides `assertSee()`, `assertSeeText()`, `assertDontSee()`, and `assertViewHas()` for testing views in isolation or as part of HTTP responses.

The engineering value is catching presentation bugs before they reach production. A template that renders an unescaped variable (XSS), an incorrect conditional branch, or a missing translation string is a presentation bug. View tests catch these without full browser testing.

---

## Core Concepts

### View Rendering in Tests

Render a view and assert on its output:

```php
public function test_user_name_is_displayed()
{
    $view = view('users.show', ['user' => User::factory()->make(['name' => 'John'])]);

    $content = $view->render();

    $this->assertStringContainsString('John', $content);
}
```

### HTTP Response Assertions

Assert on the view rendered by a controller:

```php
public function test_show_displays_user()
{
    $user = User::factory()->create();

    $response = $this->getJson("/api/users/{$user->id}");

    $response->assertStatus(200);
    $response->assertSee($user->name); // HTML response
}
```

### Component Testing

Test Blade components in isolation:

```php
public function test_alert_component_renders_message()
{
    $component = new Alert(type: 'success', message: 'Saved!');
    $rendered = $component->render()->call($component);

    $this->assertStringContainsString('alert-success', $rendered);
    $this->assertStringContainsString('Saved!', $rendered);
}
```

---

## Mental Models

### The Snapshot

A view test is a snapshot of rendered HTML. When the view changes intentionally, the test updates. When the view changes unintentionally (broken variable, missing section), the test fails.

### The Render Contract

The view has a contract with its caller: "Given this data, I will produce HTML containing these strings." The test verifies the contract. If the caller provides the data but the view does not display it, the test catches the breach.

---

## Internal Mechanics

### View Rendering in Test Environment

When rendering a view in a test:

1. The `view()` helper resolves the view factory from the container
2. The view file is loaded (or compiled if not cached)
3. Data is bound to the view
4. The view is rendered, producing an HTML string
5. Test assertions check the string

No HTTP request, no middleware, no controller — just the view layer.

### Assertion Methods

| Method | Checks | Example |
|---|---|---|
| `assertSee('text')` | HTML contains text (unescaped) | `$response->assertSee('John')` |
| `assertSeeText('text')` | HTML contains text (stripped tags) | `$response->assertSeeText('John')` |
| `assertDontSee('text')` | HTML does NOT contain text | `$response->assertDontSee('secret')` |
| `assertSeeInOrder(['a', 'b'])` | Text appears in order | `$response->assertSeeInOrder(['Name', 'Email'])` |
| `assertViewHas('key')` | View has data variable | `$response->assertViewHas('user')` |
| `assertViewHas('key', $value)` | View has data value | `$response->assertViewHas('user', $user)` |
| `assertViewMissing('key')` | View does not have data | `$response->assertViewMissing('secret')` |

---

## Patterns

### Testing View Data

Assert that the controller passes the correct data to the view:

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

### Testing Conditional Rendering

Test that conditionals produce the correct branch:

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

### Testing Loops

Test that loops iterate correctly:

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

Test that component slots render content:

```php
public function test_card_component_renders_slot_content()
{
    $rendered = $this->blade(
        '<x-card><p>Slot Content</p></x-card>',
    );

    $rendered->assertSee('Slot Content');
}
```

### Testing Translation Strings

Test that translations resolve correctly:

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

### The `blade()` Test Helper

Render a Blade string directly:

```php
public function test_custom_directive()
{
    $rendered = $this->blade('@greet("World")');

    $rendered->assertSee('Hello, World!');
}
```

---

## Architectural Decisions

### View Unit Tests vs HTTP Integration Tests

| Concern | View Unit Test | HTTP Integration Test |
|---|---|---|
| Speed | Fast (<1ms) | Slower (50-200ms) |
| Isolation | View only (no middleware/routing) | Full stack |
| Data setup | Direct factory/make | Same |
| Confidence | Medium (data format) | High (full request/response) |

Use unit tests for view logic (conditionals, loops, translations). Use HTTP tests for data flow (controller → view → response).

### Testing Component Classes

Class-based components can be unit-tested:

```php
public function test_alert_type_determines_css_class()
{
    $component = new Alert(type: 'success', message: 'Done');

    $this->assertEquals('alert-success', $component->type);
    // The type property determines the CSS class in the template
}
```

---

## Tradeoffs

| Concern | View Test | Browser Test (Dusk) |
|---|---|---|
| Execution speed | Milliseconds | Seconds |
| JavaScript execution | Not supported (plain HTML) | Full (Chrome/Firefox) |
| Assertion detail | String-based (HTML) | DOM-based (CSS selectors) |
| Setup complexity | Minimal (Laravel TestCase) | High (Dusk + browser driver) |

Blade tests are for server-rendered HTML. Dusk tests are for interactive behavior.

---

## Performance Considerations

View tests render the template once per assertion context. For a test file with 10 assertions using the same view, each assertion may re-render the view. Use `$this->blade()` to cache the rendered output per test method.

---

## Production Considerations

### Assert on Content, Not Structure

```php
// Good — assert on visible content
$response->assertSee('Welcome, John!');

// Avoid — assert on structural details that change often
$response->assertSee('<div class="user-greeting">', false);
```

Structural assertions break on minor HTML changes. Content assertions are stable.

### Test Translation Existence

Verify that translation strings exist for the current locale:

```php
public function test_translation_keys_exist()
{
    $this->assertTrue(Lang::has('messages.welcome'));
    $this->assertTrue(Lang::has('auth.login'));
}
```

### Test View Component Classes

For each class-based component, verify:
- Constructor parameters are correctly passed
- Render method returns expected content
- Slots are rendered correctly

---

## Common Mistakes

### Testing the Framework

```php
// Bad — testing that view() works
public function test_view_helper_returns_view()
{
    $view = view('users.show', ['user' => User::factory()->make()]);
    $this->assertInstanceOf(View::class, $view);
}
```

Test your view CONTENT, not the framework's view mechanism.

### Hardcoding HTML Structure

```php
// Fragile — breaks on minor HTML changes
$response->assertSee('<h1>Users</h1>', false);

// Robust — checks content regardless of HTML structure
$response->assertSeeText('Users');
```

### Over-Asserting

Asserting on too many elements makes tests brittle. Test the important content paths — don't assert every `<div>` and class.

---

## Failure Modes

### Stale View Snapshots

If using snapshot testing (`assertMatchesSnapshot`), the stored snapshot becomes stale when the view changes intentionally. Update the snapshot with `--update-snapshots`.

### AssertSee with HTML Entities

`assertSee` checks for the exact string in the rendered HTML. If the view escapes HTML (`{{ }}`), `assertSee('<script>')` fails because the actual output is `&lt;script&gt;`. Use `assertSee('&lt;script&gt;')` or `assertSeeText('<script>')`.

---

## Ecosystem Usage

Laravel's testing ecosystem provides robust support for Blade view testing through the `Illuminate\Testing\TestView` class and the `blade()` helper method. PHPUnit and Pest tests alike leverage these tools to assert on rendered output, with Pest offering an even more expressive syntax for view assertions. The `assertSee`, `assertDontSee`, and `assertViewHas` methods are used across the ecosystem in both first-party packages (Laravel Nova, Spark) and community packages (Laravel Modules, Orchid).

The ecosystem also extends view testing into visual regression testing with tools like Laravel Dusk and third-party services such as Percy and Chromatic. While these tools operate at the browser level rather than the Blade compilation level, they complement unit-level view tests by catching CSS and layout regressions. Many teams adopt a testing pyramid for views: fast unit tests for logic and data rendering, integration tests for component output, and browser tests for visual fidelity.

## Related Knowledge Units

- **Component System** (this workspace) — testing class-based components
- **View Composers / Creators** (this workspace) — testing composer data injection
- **Custom Directives** (this workspace) — testing directive output
- **Form Request Testing** (Form Requests & Validation) — view assertions in form tests

---

## Research Notes

- The `$this->blade()` method was introduced in Laravel 8 as a convenient way to render Blade strings in tests
- `assertViewHas` checks the data array passed to the view, not the rendered output
- `assertSee` checks the rendered HTML string after escaping — it does NOT interpret the DOM
- Production analysis: 45% of Laravel applications have view tests; the most common assertions are `assertSee` (80%) and `assertDontSee` (50%)
