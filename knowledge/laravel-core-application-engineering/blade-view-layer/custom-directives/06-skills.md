# Skill: Register Custom Blade Directives

## Purpose

Extend Blade's syntax with application-specific `@directive` calls for reusable template patterns like formatting, authentication checks, and environment conditionals.

## When To Use

- Control flow shortcuts — `@admin`, `@impersonating`, `@env('production')`
- Formatting standardization — `@appMoney($amount)`, `@appTruncate($text, 100)`
- Environment-specific rendering — show/hide elements based on environment
- Compile-time transformations where output should be optimized PHP once

## When NOT To Use

- Reusable UI with HTML, slots, or attributes (use Blade components)
- Value transformation that needs unit testing (use helper functions)
- Business logic (belongs in services/actions)
- Expensive runtime checks inside `Blade::if()` closures
- Application-specific DSL at scale (too many directives make templates unreadable)

## Prerequisites

- Laravel application with Blade view compiler
- Service provider (preferably a dedicated `BladeServiceProvider`)
- Understanding of compile-time vs runtime execution

## Inputs

- Directive name (prefixed with app abbreviation)
- Callback function returning PHP code string
- (Optional) `Blade::if()` closure returning boolean
- Template file using the new directive

## Workflow

1. Create a dedicated `BladeServiceProvider` (or use existing) that extends `ServiceProvider`
2. Register formatting directives with `Blade::directive('appName', fn($exp) => "<?php echo ... ?>")`, prefixing the name with an app abbreviation
3. Register conditional directives with `Blade::if('name', fn(): bool => ...)` which auto-generates `@name` / `@elsename` / `@endname`
4. Use `Blade::stripParentheses($expression)` before parsing directive arguments
5. Document every directive with a docblock specifying name, parameters, output, and usage example
6. Run `php artisan view:clear` after adding or modifying directives to invalidate compiled view cache
7. Test directive output using `$this->blade('@appName(args)')->assertSee('expected')`

## Validation Checklist

- [ ] Custom `@directive` compiles to correct PHP in compiled view cache
- [ ] `Blade::if()` correctly handles `@name` / `@elsename` / `@endname`
- [ ] Expression parsing handles commas within quoted arguments and nested parentheses
- [ ] `php artisan view:clear` + re-render picks up directive changes
- [ ] No directive name conflicts with built-in Blade directives
- [ ] Directive registration is centralized in a dedicated service provider
- [ ] Each custom directive has documentation for parameters and behavior
- [ ] `Blade::if()` closures contain no side effects or expensive database queries

## Common Failures

- **Stale compiled views after directive change:** Compiled view cache still contains old directive PHP. Run `php artisan view:clear` after every change.
- **Directive name collision with Laravel built-in:** `@money` conflicts with a future Laravel directive. Always prefix with app abbreviation like `@appMoney`.
- **Complex logic in directive callback:** Database queries or business rules in the callback are untestable and invisible. Keep directives as simple syntax transformations.
- **Expression parsing with naive explode:** Using `explode(',', $expression)` breaks on arguments containing commas. Use `Blade::stripParentheses()` and proper parsing.
- **Unescaped output in directive:** Directive returns `<?php echo $var; ?>` which does not escape. Use `e()` for escaping.

## Decision Points

- `Blade::if()` vs `Blade::directive()`: Use `Blade::if()` for conditionals (auto-generates if/else/endif). Use `Blade::directive()` for formatting macros and non-conditional transformations.
- Directive vs component: Use directives for PHP logic transformations in templates. Use components for reusable UI with HTML, slots, and attributes.

## Performance Considerations

- Directives compile to PHP once and are cached — zero runtime overhead vs writing equivalent PHP directly
- `Blade::if()` closures are called on every render — avoid expensive operations inside them
- Compilation is per-view, not per-directive — cost amortized across all pages

## Security Considerations

- Directives compile to raw PHP — ensure compiled output does not leak sensitive data
- `$expression` is user-controlled (from the template) — do not eval or execute raw expression strings
- Use `e()` for escaping in directive return values when outputting user data

## Related Rules

- custom-directives/05-rules.md: Use `Blade::if()` for Custom Conditionals, Not `Blade::directive()`
- custom-directives/05-rules.md: Prefix All Custom Directive Names
- custom-directives/05-rules.md: Keep Directive Logic Simple — No Business Logic
- custom-directives/05-rules.md: Register All Custom Directives in a Dedicated Service Provider
- custom-directives/05-rules.md: Run `php artisan view:clear` After Every Directive Change
- custom-directives/05-rules.md: Document Every Custom Directive
- custom-directives/05-rules.md: Do Not Create Directives for Reusable UI

## Related Skills

- Component System: Create and Use Blade Components
- Blade Testing: Write Assertions for Blade View Rendering
- Service Injection: Use @inject for Non-Entity Read-Only Services
- Rendering Performance: Profile and Optimize Slow View Rendering

## Success Criteria

- Custom `@directive` compiles to correct PHP and renders expected output
- `Blade::if()` conditionals work with `@name`, `@elsename`, `@endname`
- All directives are prefixed to avoid collision with Laravel built-ins
- View cache is cleared after every directive change
- Every directive is documented with parameters and usage example
