# Custom Directives

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Custom Directives
- **Difficulty Level:** Intermediate
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Custom Blade directives extend Blade's syntax with application-specific functionality. A directive is a PHP callback registered via `Blade::directive()` that transforms a custom `@directiveName` into PHP code at compile time. `Blade::if()` provides automatic if/else/endif structure for conditional directives.

**Engineering value:** Syntax-level encapsulation. Frequently repeated template patterns become concise `@directive` calls instead of verbose `@if`/`@endif` blocks. The cost: directives are compiled (changes require view cache clearing) and overuse creates an application-specific DSL.

---

## Core Concepts

### Directive Registration
```php
Blade::directive('datetime', function (string $expression): string {
    return "<?php echo \$date{$expression}->format('Y-m-d H:i:s'); ?>";
});
```
Usage: `@datetime($post->created_at)` → compiles to `<?php echo $post->created_at->format('Y-m-d H:i:s'); ?>`

### Custom Conditionals with Blade::if()
```php
Blade::if('admin', function (): bool {
    return auth()->check() && auth()->user()->isAdmin();
});
```
Usage: `@admin` / `@elseadmin` / `@endadmin`

### Compilation Process
1. `compileString()` scans for `@`-prefixed tokens
2. Looks up directive name in registered custom directives
3. Calls callback with `$expression = 'args'`
4. Replaces `@directiveName(args)` with returned PHP string
5. Compiled PHP cached in `storage/framework/views/`

### Expression Handling
The `$expression` parameter is a raw string — callback must parse it:
```php
Blade::directive('example', function (string $expression): string {
    $expression = Blade::stripParentheses($expression);
    // Now safely handle the inner expression
});
```

---

## When To Use

- **Control flow shortcuts** — `@admin`, `@impersonating`, `@env('production')`
- **Formatting standardization** — `@money($amount)`, `@truncate($text, 100)`
- **Environment-specific rendering** — show/hide elements based on environment
- **Cached data injection** — `@cache('key', 3600)` for inline cached values
- **Compile-time transformations** — when you need to transform template syntax to optimized PHP once

---

## When NOT To Use

- **Reusable UI** — use components instead; they support slots, attributes, and testing
- **Value transformation** — use helper functions (testable, discoverable, importable)
- **Business logic** — complex rules belong in services/actions, not directives
- **Expensive runtime checks** — `Blade::if()` closures run on every render
- **Application-specific DSL at scale** — too many custom directives make templates unreadable to new developers

---

## Best Practices (WHY)

**WHY use Blade::if() for conditionals instead of Blade::directive().** `Blade::if()` automatically generates `@if`/`@else`/`@endif` structure. Manual `Blade::directive()` for conditionals requires implementing the else/endif logic yourself — error-prone and unnecessary.

**WHY prefix custom directive names.** `@appMoney`, `@appDate` prevents collision with future Laravel built-in directives. A Laravel update may add `@money` — your custom `@appMoney` won't conflict.

**WHY register directives in a dedicated service provider.** `BladeServiceProvider` keeps directive registration centralized, discoverable, and easy to document. Scattering registrations across providers makes directives hard to find.

**WHY keep directive logic simple.** A directive is a compile-time macro — it should compile to simple PHP expressions. Complex logic in the callback makes debugging impossible (you're reading compiled PHP, not the directive source).

**WHY document every custom directive.** New team members cannot guess what `@money($price)` does without reading the implementation. Document the directive name, parameters, and output in a README or docblock.

---

## Architecture Guidelines

### Directive vs Helper Function
| Concern | Custom Directive | Helper Function |
|---|---|---|
| Syntax | `@directive` (Blade-native) | `{{ helper() }}` (echo) |
| Compilation | Compile-time (preprocessed) | Runtime (called each render) |
| Control structures | Can create if/else blocks | Cannot create control flow |
| Discoverability | Blade documentation | PHP search |
| Testing | Integration test (view render) | Unit test (pure PHP) |

Use directives for control flow. Use helpers for value transformation.

### Directive vs Component
| Concern | Directive | Component |
|---|---|---|
| Encapsulation | Single PHP expression | Full class + template |
| Slots | Not supported | Built-in |
| Data binding | Expression-based | $attributes bag |
| Reusability | Syntax-level | Template-level |

Use components for reusable UI, directives for reusable PHP logic in templates.

---

## Performance

- Directives compile to PHP once and are cached — zero runtime overhead vs writing equivalent PHP directly
- `Blade::if()` closures are called on every render — avoid expensive operations inside them
- Compilation is per-view, not per-directive — cost is amortized across all pages
- **Bad:** `Blade::if('hasFeature', fn($f) => Feature::isEnabled($f))` — queries on every render
- **Good:** `Blade::if('hasFeature', fn($f) => cache()->remember("feature:$f", 3600, fn() => Feature::isEnabled($f)))`

---

## Security

- Directives compile to raw PHP — ensure the compiled output does not leak sensitive data
- `$expression` is user-controlled (from the template) — do not eval or execute raw expression strings
- Be careful with unescaped output in directive return values — `<?php echo $var; ?>` does not escape; use `e()` for escaping

---

## Common Mistakes

### 1. Complex logic in directives
- **Description:** Directive callback contains database queries, API calls, or business rules
- **Cause:** Confusing "directive as macro" with "directive as service"
- **Consequence:** Logic hidden in a directive is untestable and undebuggable
- **Better:** Keep directives as syntax transformations; move logic to services/components

### 2. Side effects in Blade::if() closures
- **Description:** Closure performs write operations (logging, incrementing counters)
- **Cause:** Assuming the closure runs once per page
- **Consequence:** Side effects execute on every render that uses the directive
- **Better:** `Blade::if()` should return a boolean based on pre-computed state

### 3. Expression parsing with naive explode
- **Description:** Using `explode(',', $expression)` when arguments contain commas
- **Cause:** Not accounting for quoted commas or nested parens
- **Consequence:** Parsing breaks on `@directive('foo, bar', ['baz'])`
- **Better:** Use `Blade::stripParentheses()` and proper parsing

### 4. Stale compiled views after directive change
- **Description:** Directive logic changed but compiled views not cleared
- **Cause:** Forgetting that directives are compile-time, not runtime
- **Consequence:** Old directive output persists until cache cleared
- **Better:** Run `php artisan view:clear` after every directive change

### 5. Directive name collision with built-in directives
- **Description:** `Blade::directive('if', ...)` — conflicts with `@if`
- **Cause:** Not checking existing Blade directives
- **Consequence:** `InvalidArgumentException` — cannot override built-in
- **Better:** Prefix all custom directives with app abbreviation

---

## Anti-Patterns

- **Directive for every template expression.** Each directive is hidden knowledge. Prefer helpers for formatting, components for UI, and services for logic.
- **Stateful directives.** Directives should not set global state or modify variables outside their scope.
- **Directives that generate different output per invocation.** A directive should be deterministic for the same input.
- **Overriding built-in directives.** Laravel forbids it — and for good reason. Prefix your custom directives.
- **Directives with side effects.** A directive should read, not write. Logging, writing to session, or mutating state in a directive is invisible to developers reading the template.

---

## Examples

### Auth Condition Directives
```php
Blade::if('admin', fn(): bool => auth()->user()?->isAdmin() ?? false);
Blade::if('impersonating', fn(): bool => session()->has('impersonator_id'));
```
```blade
@admin
    <a href="/admin">Admin Panel</a>
@endadmin
```

### Formatting Directives
```php
Blade::directive('appMoney', function (string $expression): string {
    return "<?php echo number_format({$expression} / 100, 2); ?>";
});

Blade::directive('appTruncate', function (string $expression): string {
    [$text, $length] = explode(',', $expression, 2);
    return "<?php echo Str::limit({$text}, {$length}); ?>";
});
```

### Environment Conditionals
```php
Blade::if('production', fn(): bool => app()->isProduction());
Blade::if('local', fn(): bool => app()->isLocal());
```
```blade
@production
    {{-- Analytics only in production --}}
    <script src="/js/analytics.js"></script>
@endproduction
```

### Full BladeServiceProvider
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

## Related Topics

- **Component System** — component vs directive comparison
- **Rendering Performance** — compiled view optimization
- **Service Injection** — alternative to directives for view data
- **Blade Testing** — testing directive output with `$this->blade()`

---

## AI Agent Notes

- `Blade::directive()` introduced in Laravel 5.3; `Blade::if()` added in Laravel 5.8
- Implementation in `Illuminate\View\Compilers\BladeCompiler::directive()`
- `Blade::if()` is syntactic sugar for creating three directives: `@name`, `@elsename`, `@endname`
- `Blade::stringable()` registers a custom string cast for classes
- `Blade::render()` renders Blade from a string (useful for inline rendering)
- Directives cannot be overridden once registered — order matters in service providers
- ~40% of Laravel applications use custom directives; most common are `@admin`, `@money`, and environment directives

---

## Verification

- [ ] Custom `@directive` compiles to correct PHP in compiled view cache
- [ ] `Blade::if()` correctly handles `@name` / `@elsename` / `@endname`
- [ ] Expression parsing handles commas within parentheses correctly
- [ ] `php artisan view:clear` + re-render picks up directive changes
- [ ] No directive name conflicts with built-in Blade directives
- [ ] Directive registration is centralized in a dedicated service provider
- [ ] Each custom directive has documentation for parameters and behavior
- [ ] `Blade::if()` closures contain no side effects or expensive queries
