## Rule: Use `Blade::if()` for Custom Conditionals, Not `Blade::directive()`

---

## Category

Framework Usage

---

## Rule

Register custom conditionals with `Blade::if()` instead of `Blade::directive()`. Use `Blade::directive()` only for non-conditional transformations like formatting macros.

---

## Reason

`Blade::if()` automatically generates the full `@if`/`@else`/`@endif` directive structure with proper scoping. Using `Blade::directive()` for conditionals requires manually implementing the else/endif logic and returning raw PHP control structures — this is error-prone, harder to read, and introduces scoping bugs that `Blade::if()` handles automatically.

---

## Bad Example

```php
// Manual conditional — error-prone
Blade::directive('admin', function () {
    return "<?php if (auth()->check() && auth()->user()->isAdmin()): ?>";
});
Blade::directive('endadmin', function () {
    return "<?php endif; ?>";
});
```

---

## Good Example

```php
// Blade::if handles @admin, @elseadmin, @endadmin automatically
Blade::if('admin', fn(): bool => auth()->user()?->isAdmin() ?? false);
```

---

## Exceptions

When you need a conditional that accepts parameters and evaluates them as PHP expressions (more complex than `Blade::if` supports), use `Blade::directive()` with careful implementation.

---

## Consequences Of Violation

Maintenance risks: Fragile conditional directives with scoping bugs. Reliability risks: Unclosed if blocks or incorrect nesting in compiled output.

---

## Rule: Prefix All Custom Directive Names

---

## Category

Maintainability

---

## Rule

Prefix every custom directive with your application abbreviation (e.g., `@appMoney`, `@appDate`, `@appTruncate`). Never use unprefixed names like `@money`, `@date`, or `@truncate`.

---

## Reason

Laravel may add built-in directives with the same name in future releases. An unprefixed `@money` could conflict with a future Laravel `@money` directive, causing `InvalidArgumentException` or unexpected behavior. Prefixing ensures your custom directives never collide with framework evolution and makes it obvious which directives are application-specific versus built-in.

---

## Bad Example

```php
Blade::directive('money', fn(string $exp) => "<?php echo number_format({$exp}/100, 2); ?>");
// @money — may conflict with future Laravel versions
```

---

## Good Example

```php
Blade::directive('appMoney', fn(string $exp) => "<?php echo number_format({$exp}/100, 2); ?>");
// @appMoney — clearly application-specific, no collision risk
```

---

## Exceptions

When building a reusable package that deliberately wants to expose short directive names, prefixing may be omitted, but the package must document the directive names and accept collision risk.

---

## Consequences Of Violation

Maintenance risks: Laravel upgrades break templates with unprefixed directives. Reliability risks: Silent override or runtime errors after framework updates.

---

## Rule: Keep Directive Logic Simple — No Business Logic

---

## Category

Architecture

---

## Rule

Custom directives must compile to simple PHP expressions. Never place database queries, API calls, business rules, or complex computation inside the directive callback.

---

## Reason

Directive callbacks run at compile time — their output is cached PHP code that is hard to debug because developers read the directive source, not the compiled output. Complex logic in a directive is untestable in isolation, invisible to standard profiling tools, and behaves differently than expected because the compiled PHP is what actually executes. Business logic belongs in services, helpers, or components — not in directives.

---

## Bad Example

```php
Blade::directive('popularPosts', function () {
    return "<?php echo view('partials.popular-posts', [
        'posts' => \App\Models\Post::popular()->limit(5)->get()
    ])->render(); ?>";
});
// Database query hidden inside a directive — untestable
```

---

## Good Example

```php
// Simple formatting directive — testable at integration level
Blade::directive('appMoney', fn(string $exp) => "<?php echo number_format({$exp}/100, 2); ?>");

// Complex logic stays in a component or view composer
// <x-popular-posts /> instead of @popularPosts
```

---

## Exceptions

Caching logic inside `Blade::if()` closures (e.g., `cache()->remember()`) is acceptable to avoid repeated expensive checks on every render, as long as the underlying data retrieval is delegate to a service.

---

## Consequences Of Violation

Maintenance risks: Hidden queries inside directives are missed during optimization reviews. Performance risks: Database queries execute on every template render without visibility in query logs. Testing risks: Logic inside directives cannot be unit-tested.

---

## Rule: Register All Custom Directives in a Dedicated Service Provider

---

## Category

Code Organization

---

## Rule

Centralize all `Blade::directive()` and `Blade::if()` registrations in a single `BladeServiceProvider`. Do not scatter registrations across multiple providers or the `AppServiceProvider`.

---

## Reason

Scattered registrations make custom directives impossible to discover — a developer joining the project has no single place to find what `@appMoney` does or whether it exists. A dedicated `BladeServiceProvider` provides a discoverable, documented, centralized registry of all application-specific Blade extensions.

---

## Bad Example

```php
// AppServiceProvider — mixed with service container bindings
class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Blade::if('admin', fn() => auth()->user()?->isAdmin());
        // ... and 50 other service container bindings
    }
}
```

---

## Good Example

```php
class BladeServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Blade::if('admin', fn(): bool => auth()->user()?->isAdmin() ?? false);
        Blade::if('impersonating', fn(): bool => session()->has('impersonator_id'));
        Blade::directive('appMoney', fn(string $exp) => "<?php echo number_format({$exp}/100, 2); ?>");
        Blade::directive('appTruncate', function (string $exp) {
            [$text, $length] = explode(',', Blade::stripParentheses($exp), 2);
            return "<?php echo Str::limit({$text}, {$length}); ?>";
        });
    }
}
```

---

## Exceptions

Packages distributing Blade directives must register them in the package's own service provider. Application code should not modify package providers.

---

## Consequences Of Violation

Maintenance risks: Developers cannot find where directives are registered; duplicate registrations cause conflicts. Scalability risks: As the team grows, directive discovery becomes a recurring question.

---

## Rule: Run `php artisan view:clear` After Every Directive Change

---

## Category

Maintainability

---

## Rule

Clear the compiled view cache with `php artisan view:clear` after modifying, adding, or removing any custom Blade directive. Verify that changes take effect by rendering an affected view.

---

## Reason

Directives compile to PHP at compile time and are cached in `storage/framework/views/`. Changing the directive callback does not automatically invalidate already-compiled views. Without clearing the cache, developers see the previous directive behavior and may incorrectly conclude their changes did not work.

---

## Bad Example

```php
// Changed directive logic
Blade::directive('appMoney', fn(string $exp) => "<?php echo number_format({$exp}/100, 3); ?>");
// Developer expects 3 decimal places, but cached views still show 2
```

---

## Good Example

```php
// After changing directive:
// 1. Run: php artisan view:clear
// 2. Visit a page that uses @appMoney
// 3. Verify 3 decimal places appear
```

---

## Exceptions

In development environments with `APP_DEBUG=true`, Blade may automatically recompile on file changes. However, directive callbacks are PHP code, not template files — manual cache clearing is still the safest approach.

---

## Consequences Of Violation

Reliability risks: Stale directive behavior persists in production; developers think a bug is not fixed. Maintenance risks: Time wasted debugging "changes not taking effect."

---

## Rule: Document Every Custom Directive

---

## Category

Maintainability

---

## Rule

Document every custom directive with a docblock specifying its name, parameters, return behavior, and a usage example. Place the documentation in the `BladeServiceProvider` or a project-level Blade documentation file.

---

## Reason

Custom directives create an application-specific DSL that new team members cannot guess. Without documentation, `@appTruncate($text, 100)` is a mystery — is it character limit, word limit, or something else? Documentation ensures that directive semantics are discoverable and that developers use the directive correctly.

---

## Bad Example

```php
// No documentation — developer must read compiled PHP to understand
Blade::directive('appTruncate', function (string $exp) {
    [$text, $length] = explode(',', Blade::stripParentheses($exp), 2);
    return "<?php echo Str::limit({$text}, {$length}); ?>";
});
```

---

## Good Example

```php
/**
 * Truncates text to a specified character length.
 * Usage: @appTruncate($text, 100)
 * Output: Truncated text with "..." appended if truncated
 * Example: @appTruncate($post->body, 50)
 */
Blade::directive('appTruncate', function (string $exp) {
    [$text, $length] = explode(',', Blade::stripParentheses($exp), 2);
    return "<?php echo Str::limit({$text}, {$length}); ?>";
});
```

---

## Exceptions

Self-documenting directives like `@admin` (whose purpose is obvious from the name) may use minimal documentation. The guideline applies most strongly to parameterized formatting directives.

---

## Consequences Of Violation

Maintenance risks: Directives are misused or avoided because their behavior is unclear. Scalability risks: Knowledge about directive semantics exists only in the heads of the developers who wrote them.

---

## Rule: Do Not Create Directives for Reusable UI

---

## Category

Architecture

---

## Rule

Use Blade components for reusable UI patterns. Do not use custom directives to render UI elements that include HTML, slots, or attributes.

---

## Reason

Directives compile to PHP expressions — they cannot accept slot content, process attributes, or encapsulate HTML structure. Components provide slots, attribute bags, dependency injection, and testability. A directive that returns HTML is a component pretending to be a directive, with worse ergonomics and no slot support.

---

## Bad Example

```php
// Directive returning HTML — should be a component
Blade::directive('alert', function (string $exp) {
    [$type, $message] = explode(',', Blade::stripParentheses($exp), 2);
    return "<?php echo \"<div class='alert alert-{$type}'>\" . e($message) . \"</div>\"; ?>";
});
```

---

## Good Example

```blade
{{-- components/alert.blade.php --}}
<div {{ $attributes->merge(['class' => 'alert alert-' . ($type ?? 'info')]) }}>
    {{ $slot ?? $message }}
</div>
```

```blade
{{-- Usage: <x-alert type="success">Saved!</x-alert> --}}
```

---

## Exceptions

Directives that generate non-HTML output (JSON config, meta tags with minimal structure) may be acceptable, but if the output contains any HTML beyond a single tag, use a component.

---

## Consequences Of Violation

Maintenance risks: Directive-based UI cannot use slots, attributes, or be tested. Scalability risks: HTML-heavy directives create a hard-to-maintain hybrid template system.
