# Skill: Configure Middleware in Bootstrap

## Purpose
Set up all middleware configuration (global stack, groups, aliases, priority, replacements) in `bootstrap/app.php` using the Laravel 11+ `Middleware` configuration object.

## When To Use
- Setting up a new Laravel 11+ project
- Migrating middleware configuration from `App\Http\Kernel` to `bootstrap/app.php`
- Adding, removing, or replacing middleware in any category
- Registering custom middleware aliases and groups

## When NOT To Use
- Laravel <11 projects (use kernel properties)
- Package middleware registration (use service providers)
- Hybrid configuration (mixing kernel and bootstrap approaches)

## Prerequisites
- Laravel 11+ project
- `bootstrap/app.php` file exists with `Application::configure()` chain
- `use Illuminate\Foundation\Configuration\Middleware;` import

## Inputs
- Middleware classes to add to global stack
- Group definitions (web, api, custom)
- Alias mappings (string -> FQCN)
- Priority list entries
- Middleware replacements (old class -> new class)
- Middleware removals

## Workflow
1. Open `bootstrap/app.php` and confirm `use Illuminate\Foundation\Configuration\Middleware;` is imported
2. Locate the `->withMiddleware(function (Middleware $middleware) { ... })` call in the builder chain
3. Add global middleware with `$middleware->append(...)` or `$middleware->prepend(...)`
4. Modify groups with `$middleware->web(append: [...])`, `$middleware->api(prepend: [...])`, or `$middleware->group('custom', [...])`
5. Register aliases with `$middleware->alias('name', \Class::class)`
6. Set priority with `$middleware->priority([...])` preserving default ordering
7. Replace defaults with `$middleware->replace(OldClass::class, NewClass::class)`
8. Remove middleware with `$middleware->remove(SomeClass::class)`
9. Run `php artisan route:list -v` to verify configuration
10. Run `php artisan optimize` to cache the configuration

## Validation Checklist
- [ ] `use` statement for `Middleware` class is present
- [ ] `->withMiddleware()` callback is properly indented in the builder chain
- [ ] Global middleware added correctly (append vs prepend as needed)
- [ ] Group modifications use group-specific methods, not global append
- [ ] Aliases registered with FQCN, not another alias string
- [ ] Priority list preserves default entries
- [ ] `replace()` used instead of `remove()` + `append()` where applicable
- [ ] Configuration verified with `route:list -v`
- [ ] Configuration cached with `php artisan optimize`

## Common Failures
- Editing `App\Http\Kernel` instead of `bootstrap/app.php` in Laravel 11 (silent no-op)
- Forgetting `use` statement for `Middleware` class (runtime error)
- Mixing concerns inside `withMiddleware()` (routing, exceptions)
- Using global `append()` when group-specific method is appropriate
- Not re-caching after changes

## Decision Points
- Laravel 11+ or <11? -> Determines bootstrap vs kernel approach
- Replace a middleware or remove it entirely? -> `replace()` vs `remove()`
- Does this apply to all routes or specific groups? -> Global vs group method

## Performance Considerations
- Configuration is processed once during application bootstrap
- `php artisan optimize` caches configuration (zero per-request overhead)
- Invokable middleware has same performance as class middleware

## Security Considerations
- Kernel-based configuration is ignored in Laravel 11 (old config silently ineffective)
- `replace()` silently does nothing if target middleware is not in the active stack
- Missing `use` import causes fatal error during application boot

## Related Rules
- Always Use `withMiddleware()` for Laravel 11+ Middleware Configuration
- Use `replace()` Instead of `remove()` + `append()` for Swapping
- Keep `withMiddleware()` Focused Exclusively on Middleware Concerns
- Re-Cache Configuration After Any `bootstrap/app.php` Changes
- Use Group-Specific Methods Instead of Global `append()`/`prepend()`

## Related Skills
- Configure Global Middleware Stack
- Register and Use Middleware Aliases
- Create and Manage Middleware Groups
- Configure Middleware Priority

## Success Criteria
- All middleware configuration is in `bootstrap/app.php` (not kernel)
- Global, group, alias, and priority configuration are present and correct
- Configuration survives `php artisan optimize` caching
- `route:list -v` shows the expected resolved middleware stack
