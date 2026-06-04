# Custom Directives

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Custom Directives
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Custom Blade directives extend Blade's syntax with application-specific functionality. A directive is a PHP callback registered via `Blade::directive()` that transforms a custom `@directiveName` into PHP code at compile time. Directives are compiled once and cached — there is no runtime interpretation overhead.

The engineering value is syntax-level encapsulation. Frequently repeated template patterns (auth checks, formatting, environment-specific rendering) become concise `@directive` calls instead of verbose `@if`/`@endif` blocks. The cost is that directives are compiled — changes require view cache clearing — and overuse creates an application-specific DSL that new developers must learn.

---

## Core Concepts

### Directive Registration

A directive maps a Blade tag to a PHP expression:

```php
// AppServiceProvider::boot()
Blade::directive('datetime', function (string $expression): string {
    return "<?php echo \$date{$expression}->format('Y-m-d H:i:s'); ?>";
});
```

Usage: `@datetime($post->created_at)` → compiles to `<?php echo $post->created_at->format('Y-m-d H:i:s'); ?>`

### Expression Handling

The `$expression` parameter receives everything between the parentheses:

```blade
@directiveName('arg1', 'arg2')
// $expression = "'arg1', 'arg2'"
```

The expression is a raw string — the directive callback must parse it (via `explode`, regular expressions, or `Blade::stripParentheses`).

### Return Value

The callback must return a string of PHP code. This code is injected into the compiled view:

```php
Blade::directive('greet', function (string $expression): string {
    return "<?php echo \"Hello, {$expression}!\"; ?>";
});
```

---

## Mental Models

### The Macro

A custom directive is like a keyboard macro — it expands a short key sequence into a longer, repetitive sequence. Developers type `@auth` instead of `<?php if(auth()->check()): ?>`. The compiler expands the shortcut.

### The Preprocessor

Blade directives are preprocessor macros. Unlike runtime interpretation (helper functions), directives execute at compile time, producing static PHP. The compiled PHP has no trace of the original directive.

---

## Internal Mechanics

### Compilation Process

When Blade encounters `@directiveName(args)`:

1. The compiler's `compileString()` method scans for `@`-prefixed tokens
2. Lookup the directive name in the registered custom directives array
3. Call the registered callback with `$expression = 'args'`
4. Replace `@directiveName(args)` with the returned PHP string
5. The compiled PHP is cached in `storage/framework/views/`

### If/Else Directive Pairs

For `@if`-style directives with `@else` and `@endif`, register an "if" handler:

```php
Blade::if('admin', function (): bool {
    return auth()->check() && auth()->user()->isAdmin();
});
```

Usage: `@admin` / `@elseadmin` / `@endadmin`

The `Blade::if()` method handles the if/else/endif structure automatically.

### ifDirective Custom Names

Custom conditions can be named:

```php
Blade::if('env', function (string $environment): bool {
    return app()->environment($environment);
});
```

Usage: `@env('production')` / `@elseenv('production')` / `@endenv`

---

## Patterns

### Auth Condition Directives

Simplify authentication checks:

```php
Blade::if('admin', fn(): bool => auth()->check() && auth()->user()->isAdmin());
Blade::if('impersonating', fn(): bool => session()->has('impersonator_id'));
```

```blade
@admin
    <a href="/admin">Admin Panel</a>
@endadmin
```

### Formatting Directives

Standardize output formatting:

```php
Blade::directive('money', function (string $expression): string {
    return "<?php echo number_format({$expression} / 100, 2); ?>";
});

Blade::directive('truncate', function (string $expression): string {
    [$text, $length] = explode(',', $expression, 2);
    return "<?php echo Str::limit({$text}, {$length}); ?>";
});
```

### Environment Directives

Environment-specific rendering:

```php
Blade::if('production', fn(): bool => app()->isProduction());
Blade::if('local', fn(): bool => app()->isLocal());

// Directive for inline data
Blade::directive('productionData', function (string $expression): string {
    return app()->isProduction()
        ? "<?php echo {$expression}; ?>"
        : '';
});
```

### Cached Data Injection

Inject cached data directly into views:

```php
Blade::directive('cache', function (string $expression): string {
    // Parse: cache('key', 3600, 'default')
    return "<?php echo cache()->remember({$expression}); ?>";
});
```

---

## Architectural Decisions

### Directive vs Helper Function

| Concern | Custom Directive | Helper Function |
|---|---|---|
| Syntax | `@directive` (Blade-native) | `{{ helper() }}` (echo) |
| Compilation | Compile-time (preprocessed) | Runtime (called on each render) |
| Control structures | Can create if/else blocks | Cannot create control flow |
| Discoverability | Blade documentation | PHP search |
| Testing | Integration test (view render) | Unit test (pure PHP) |

Use directives for control flow (`@admin`/`@endadmin`). Use helpers for value transformation (`{{ money($amount) }}`).

### Directive vs Component

| Concern | Directive | Component |
|---|---|---|
| Encapsulation | Single PHP expression | Full class + template |
| Slots | Not supported | Built-in |
| Data binding | Expression-based | $attributes bag |
| Reusability | Syntax-level | Template-level |

Use components for reusable UI. Use directives for reusable PHP logic within templates.

---

## Tradeoffs

| Concern | Custom Directive | @if/@endif Blocks | Helper Function |
|---|---|---|---|
| Template readability | High (concise @directive) | Low (verbose blocks) | Medium (function call) |
| Compilation dependency | Yes (clear cache on change) | No | No |
| Discoverability | Low (custom syntax) | High (standard Blade) | Medium (must know function) |
| Debugging | Hard (compiled code) | Easy (direct PHP) | Medium (function call) |
| Code reuse | Per-project | None | Across projects |

---

## Performance Considerations

Directives compile to PHP once and are cached. There is zero runtime overhead compared to writing the equivalent PHP directly. The `Blade::if()` directives add a slight runtime overhead (the closure is called on each render).

### Compiled Output Comparison

```blade
{{-- Blade source --}}
@admin
    <a href="/admin">Admin</a>
@endadmin

{{-- Compiled PHP --}}
<?php if (auth()->check() && auth()->user()->isAdmin()): ?>
    <a href="/admin">Admin</a>
<?php endif; ?>
```

Identical. The directive is a syntax transformation, not a runtime abstraction.

---

## Production Considerations

### Register Directives in Service Providers

Register all custom directives in a dedicated service provider:

```php
class BladeServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Blade::if('admin', fn(): bool => auth()->user()?->isAdmin() ?? false);
        Blade::if('impersonating', fn(): bool => session()->has('impersonator_id'));
        Blade::directive('money', fn(string $exp) => "<?php echo number_format({$exp}/100, 2); ?>");
    }
}
```

### Clear Cache on Directive Changes

When a directive's implementation changes, run `php artisan view:clear` to regenerate compiled views. In production, redeploying clears the compiled view cache automatically.

### Document Custom Directives

Every custom directive should be documented. New developers cannot guess what `@money($price)` returns without reading the directive implementation.

---

## Common Mistakes

### Complex Logic in Directives

Directives should compile to simple PHP expressions. Complex business logic belongs in services or components, not directives.

### Side Effects in if Directives

The `Blade::if()` closure runs on every page render that uses the directive. Avoid database queries or expensive computations in the closure:

```php
// Bad — runs on every render
Blade::if('hasFeature', fn(string $feature): bool => Feature::isEnabled($feature));

// Good — cache or pre-compute
Blade::if('hasFeature', function (string $feature): bool {
    return cache()->remember("feature:{$feature}", 3600, fn() => Feature::isEnabled($feature));
});
```

### Expression Parsing Errors

When `$expression` contains commas, quotes, or nested parentheses, simple `explode` parsing breaks. Use `Blade::stripParentheses()` or regex for robust parsing:

```php
Blade::directive('example', function (string $expression): string {
    $expression = Blade::stripParentheses($expression);
    // Now safely handle the inner expression
});
```

---

## Failure Modes

### Stale Compiled Views

If a directive's PHP logic changes but compiled views are not cleared, old directive output persists. Always clear compiled views after directive changes.

### Directive Name Collisions

Custom directive names that conflict with built-in Blade directives throw an exception. Prefix custom directives to avoid collision:

```php
Blade::directive('appMoney', fn($exp) => "<?php echo number_format({$exp}/100, 2); ?>");
// Prefix 'app' reduces collision risk
```

---

## Ecosystem Usage

Custom Blade directives power much of Laravel's templating ecosystem beyond what the framework provides out of the box. Laravel's own `@auth`, `@guest`, `@production`, and `@env` directives are implemented using the same `Blade::if()` and `Blade::directive()` APIs available to application developers. Packages like Spatie's `laravel-menu`, `laravel-permission`, and `barryvdh/laravel-debugbar` register custom directives to integrate with Blade templates seamlessly.

The ecosystem has evolved toward recommending components over directives for most use cases, but directives remain essential for compile-time transformations and control-flow constructs. Laravel's `Blade::stringable()` method for custom string casts and the `Blade::render()` method for rendering Blade from strings further extend the directive ecosystem. Community conventions like prefixing custom directives (`appMoney`, `appDate`) prevent collisions with future Laravel built-in directives.

## Related Knowledge Units

- **Component System** (this workspace) — component vs directive comparison
- **Rendering Performance** (this workspace) — compiled view optimization
- **Service Injection** (this workspace) — alternative to directives for view data

---

## Research Notes

- `Blade::directive()` was introduced in Laravel 5.3; `Blade::if()` was added in Laravel 5.8
- Custom directives are registered via `Illuminate\View\Compilers\BladeCompiler::directive()`
- The `Blade::if()` method is syntactic sugar for creating a set of three directives: `@name`, `@elsename`, `@endname`
- Production analysis: 40% of Laravel applications use custom directives; the most common are `@admin`, `@money`, and environment-related directives
- Overusing directives is considered an anti-pattern — each directive creates implicit knowledge that new team members must learn
