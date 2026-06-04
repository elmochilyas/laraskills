## Rule: Assert on Visible Content, Not HTML Structure

---

## Category

Testing

---

## Rule

Write view test assertions against visible text content using `assertSeeText` and `assertDontSee`, not against raw HTML structure such as tag names, CSS classes, or specific markup patterns.

---

## Reason

Content-focused assertions survive template refactoring — changing a `<div>` to a `<section>` or altering CSS classes does not break the test. Structural assertions (`assertSee('<h1>Title</h1>', false)`) break on any HTML change, creating brittle tests that fail for the wrong reasons and discourage template refactoring.

---

## Bad Example

```php
public function test_shows_user_name()
{
    $response = $this->get('/users/1');
    $response->assertSee('<h1>John</h1>', false); // Breaks if tag changes
}
```

---

## Good Example

```php
public function test_shows_user_name()
{
    $response = $this->get('/users/1');
    $response->assertSeeText('John'); // Works regardless of HTML structure
}
```

---

## Exceptions

When testing component attribute merging behavior (e.g., verifying that `$attributes->merge(['class' => 'btn'])` produces the correct final class), structural assertions on the attribute value are acceptable.

---

## Consequences Of Violation

Maintenance risks: Tests break on every UI change; high false-positive rate; developers stop trusting or maintaining view tests.

---

## Rule: Test Both Branches of Every Conditional

---

## Category

Testing

---

## Rule

For every conditional display branch in a template, write two tests: one asserting the content IS visible when the condition is true, and one asserting it IS NOT visible when the condition is false.

---

## Reason

Testing only the happy path (e.g., admin sees admin panel) leaves the alternative branch (e.g., non-admin should NOT see admin panel) unverified. A template refactoring could accidentally expose admin UI to all users, and the single-branch test passes because it only checks the admin scenario. Paired assertions guarantee both paths work correctly.

---

## Bad Example

```php
public function test_admin_sees_admin_panel()
{
    $admin = User::factory()->admin()->create();
    $response = $this->actingAs($admin)->get('/dashboard');
    $response->assertSee('admin-panel');
}
// Missing: test that non-admin does NOT see admin-panel
```

---

## Good Example

```php
public function test_admin_sees_admin_panel()
{
    $admin = User::factory()->admin()->create();
    $response = $this->actingAs($admin)->get('/dashboard');
    $response->assertSee('admin-panel');
}

public function test_non_admin_does_not_see_admin_panel()
{
    $user = User::factory()->create();
    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertDontSee('admin-panel');
}
```

---

## Exceptions

When the conditional does not involve authorization or user-specific display logic (e.g., a simple `@if($showBanner)` that is always true for every user), single-branch testing may suffice.

---

## Consequences Of Violation

Security risks: Unauthorized content may leak without any test catching it. Maintenance risks: Template changes that accidentally expose privileged content go undetected.

---

## Rule: Use View Unit Tests for Logic, HTTP Tests for Data Flow

---

## Category

Testing

---

## Rule

Test template rendering logic (conditionals, loops, formatting) with unit tests that render views directly via `view('name', $data)->render()`. Use HTTP integration tests (`$this->get('/route')`) to verify the full controller-to-view data flow.

---

## Reason

View unit tests are fast (under 1ms) and isolate the template from middleware, controllers, and route binding concerns. HTTP tests are slower (50-200ms) but verify the full stack. Using the right tool avoids slow test suites for simple template logic and ensures data flow issues are caught at the integration level.

---

## Bad Example

```php
// HTTP test for simple template logic — slow and unnecessary
public function test_name_is_displayed()
{
    $response = $this->get('/users');
    $response->assertSeeText('John');
}
```

---

## Good Example

```php
// Fast unit test for template logic
public function test_name_is_displayed()
{
    $user = User::factory()->make(['name' => 'John']);
    $rendered = view('users.show', compact('user'))->render();
    $this->assertStringContainsString('John', $rendered);
}

// HTTP test only for data flow
public function test_index_passes_users_to_view()
{
    User::factory()->count(3)->create();
    $response = $this->get('/users');
    $response->assertViewHas('users');
}
```

---

## Exceptions

When the template rendering depends on middleware-modified data (e.g., `$sharedData` set by a middleware), HTTP tests are necessary because the view unit test cannot replicate middleware behavior.

---

## Consequences Of Violation

Performance risks: Slow test suites due to unnecessary HTTP boots. Maintenance risks: Tests fail for reasons unrelated to template changes, making debugging harder.

---

## Rule: Always Test That Sensitive Data Is NOT Rendered

---

## Category

Security

---

## Rule

Explicitly assert that sensitive data (internal notes, hidden fields, private user information) is absent from the rendered view output using `assertDontSee`.

---

## Reason

Asserting that sensitive data IS rendered only verifies the happy path. Without a negative assertion, a template change that accidentally exposes `$user->internalNote` or `$user->password` goes undetected until a security incident. Negative assertions are the only automated guard against data leakage in views.

---

## Bad Example

```php
public function test_shows_user_profile()
{
    $user = User::factory()->make(['name' => 'John']);
    $response = $this->get("/users/{$user->id}");
    $response->assertSeeText('John');
    // Missing: assertDontSee for internal notes, emails, etc.
}
```

---

## Good Example

```php
public function test_shows_user_profile()
{
    $user = User::factory()->make([
        'name' => 'John',
        'internal_note' => 'VIP customer',
    ]);
    $response = $this->get("/users/{$user->id}");
    $response->assertSeeText('John');
    $response->assertDontSee('VIP customer');
}
```

---

## Exceptions

When a view explicitly and intentionally renders the sensitive data (e.g., an admin detail page that shows `internal_note` to authorized admins), the negative assertion should only apply to unauthorized roles.

---

## Consequences Of Violation

Security risks: Undetected data leakage in templates; sensitive information exposed to users. Compliance risks: GDPR, HIPAA, or PCI violations from exposed PII.

---

## Rule: Test Translation Output, Not Translation Keys

---

## Category

Testing

---

## Rule

Assert on the translated VALUE in view tests, not the translation key. Set the locale explicitly and assert that the expected localized string appears in the rendered output.

---

## Reason

Asserting on the translation key (`$response->assertSee('messages.welcome')`) validates that the template calls `__()` but does not verify that the translation system produces correct output. A missing translation file would still pass the test because the key itself appears in the output. Asserting on the rendered value catches missing translations, incorrect placeholders, and locale-specific pluralization bugs.

---

## Bad Example

```php
public function test_welcome_message()
{
    $response = $this->get('/');
    $response->assertSee('messages.welcome'); // Passes even if translation is broken
}
```

---

## Good Example

```php
public function test_welcome_message_in_spanish()
{
    App::setLocale('es');
    $response = $this->get('/');
    $response->assertSeeText('Bienvenido');
}

public function test_welcome_message_in_english()
{
    App::setLocale('en');
    $response = $this->get('/');
    $response->assertSeeText('Welcome');
}
```

---

## Exceptions

When testing only that a translation key exists in the translation file (via `Lang::has('key')`), not the rendered view output, asserting on the key is acceptable.

---

## Consequences Of Violation

Reliability risks: Broken translations reach production unnoticed. Maintenance risks: Missing translation files or incorrect placeholder substitutions are not caught by test suite.

---

## Rule: Verify XSS Escaping in View Tests

---

## Category

Security

---

## Rule

Test that user-supplied data containing HTML or JavaScript is escaped in the rendered view. Assert that `<script>` appears as `&lt;script&gt;` in the raw HTML output.

---

## Reason

Blade's `{{ }}` escapes HTML automatically, but a template may inadvertently use `{!! !!}` or forget to escape a variable. A view test that passes raw user input and asserts the escaped output is the only automated way to verify XSS protection. Using `assertSeeText` for this is incorrect because it strips tags before comparing — use `assertSee` on the escaped entity.

---

## Bad Example

```php
public function test_user_input_is_escaped()
{
    $user = User::factory()->make(['name' => '<script>alert("xss")</script>']);
    $rendered = view('users.show', compact('user'))->render();
    $this->assertStringNotContainsString('<script>', $rendered);
    // May pass even if partially escaped; use positive assertion on entity
}
```

---

## Good Example

```php
public function test_user_input_is_escaped()
{
    $user = User::factory()->make(['name' => '<script>alert("xss")</script>']);
    $rendered = view('users.show', compact('user'))->render();
    $this->assertStringContainsString('&lt;script&gt;', $rendered);
}
```

---

## Exceptions

Views that deliberately render trusted HTML (e.g., Markdown content from a WYSIWYG editor that is sanitized server-side) should use `assertSee` on the rendered HTML, not the escaped entity.

---

## Consequences Of Violation

Security risks: XSS vulnerabilities reach production; user data executes as JavaScript in other users' browsers. Compliance risks: OWASP Top 10 violation (A03: Injection).

---

## Rule: Do Not Test Framework Behavior

---

## Category

Testing

---

## Rule

Never write assertions that verify Laravel framework mechanics, such as that `view()` returns a `View` instance, that a component class exists, or that the Blade compiler works.

---

## Reason

Framework behavior is already tested by the Laravel core. Writing such tests provides zero value for your application, wastes test execution time, and creates false confidence. Tests should verify YOUR logic — conditional branches, data formatting, and display contracts — not the framework's ability to compile Blade templates.

---

## Bad Example

```php
public function test_view_returns_view_instance()
{
    $this->assertInstanceOf(View::class, view('home'));
}

public function test_component_class_exists()
{
    $this->assertTrue(class_exists(Alert::class));
}
```

---

## Good Example

```php
public function test_home_page_shows_welcome_message()
{
    $response = $this->get('/');
    $response->assertSeeText('Welcome');
}
```

---

## Exceptions

When developing a custom Blade extension or Laravel package that extends framework behavior, testing the integration with Blade's compiler is necessary. In application code, it never is.

---

## Consequences Of Violation

Maintenance risks: Tests break on Laravel version upgrades with no meaningful signal. Waste: Test suite runs slower for zero verification value.

---

## Rule: Prefer `$this->blade()` Helper for Directive and Component Tests

---

## Category

Testing

---

## Rule

Use Laravel's `$this->blade()` test helper to render custom directives and components in isolation, rather than routing through an HTTP request.

---

## Reason

The `$this->blade()` method renders a Blade string directly within the test environment, caching the compiler instance per test method. It is faster than HTTP tests, eliminates the need for full-stack setup, and provides a `TestView` with assertion methods (`assertSee`, `assertSeeText`, `assertDontSee`) for concise, readable assertions.

---

## Bad Example

```php
public function test_money_directive()
{
    $response = $this->get('/test-money'); // Needs a route
    $response->assertSeeText('19.99');
}
```

---

## Good Example

```php
public function test_money_directive_formats_correctly()
{
    $rendered = $this->blade('@appMoney(1999)');
    $rendered->assertSee('19.99');
}
```

---

## Exceptions

When testing component behavior that depends on HTTP context (session, request data, route parameters), use HTTP integration tests instead of `$this->blade()`.

---

## Consequences Of Violation

Performance risks: Slower test suite due to unnecessary HTTP stack boots. Maintenance risks: Tests are harder to read and require route definitions for simple component assertions.
