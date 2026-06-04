# Skill: Use Helpers in Controllers and Views (Injection in Services)

## Purpose
Apply the correct access pattern (helpers vs constructor injection) based on class role, using helpers in HTTP-layer code and injection in business logic.

## When To Use
- Writing controller methods and Blade views
- Creating action classes, service classes, or domain objects
- Reviewing code for helper function misuse
- Establishing team conventions for helper usage

## When NOT To Use
- When a class role is ambiguous (default to constructor injection)
- For `dd()` or `dump()` calls (must never appear in committed code)
- For `env()` calls outside config files (will break in production)

## Prerequisites
- Understanding of helper function categories (container-resolving vs pure utility)
- Knowledge of which helpers are container-resolving (`app()`, `resolve()`, `cache()`, `session()`)
- Familiarity with class role classification

## Inputs
- Class being written or reviewed
- List of helper functions used
- Class role (controller, service, action, view, event listener)

## Workflow
1. Identify the class role:
   - **Controller**: may use helpers and facades freely
   - **View/Blade**: may use helpers (no injection mechanism available)
   - **Service, Action, Domain Object**: must use constructor injection
   - **Event Listener**: either is acceptable (thin enough for helpers)
   - **Route Closure**: helpers acceptable (injection setup disproportionate)
2. For each helper call in the class:
   a. If it's a pure utility helper (`collect()`, `str()`, `data_get()`), it is safe anywhere
   b. If it's a container-resolving helper (`app()`, `cache()`, `session()`), it is only acceptable in controllers, views, closures, and event listeners
   c. If it's `env()`, flag as an error — must only appear in config files
3. For business logic classes: convert all container-resolving helper calls to constructor injection
4. Ensure no `dd()` or `dump()` calls exist in production code

## Validation Checklist
- [ ] Controllers may use helpers (including container-resolving) for framework services
- [ ] Services, actions, and domain objects use constructor injection exclusively
- [ ] All `env()` calls are inside `config/` files only
- [ ] No `dd()` or `dump()` calls exist in committed code
- [ ] Pure utility helpers are used freely regardless of class role
- [ ] Event listeners and route callbacks may use helpers pragmatically
- [ ] Custom helpers follow `function_exists()` guards

## Common Failures
- Using `app()` in a service method — creates hidden dependency that cannot be mocked
- Using `env()` in a controller — returns `null` after `config:cache`
- Leaving `dd()` in committed code — crashes production requests
- Defining custom helpers without `function_exists()` guard — causes PHP fatal errors

## Related Rules
- Use Helpers in Controllers and Views, Injection in Services (05-rules.md)
- Never Use env() Outside Config Files (05-rules.md)
- Wrap Custom Helpers in function_exists() Guard (05-rules.md)
- Prefix Custom Helpers to Reduce Collision Risk (05-rules.md)
- Autoload Custom Helpers via Composer files Directive (05-rules.md)
- Keep Custom Helpers Lightweight and Side-Effect-Free (05-rules.md)
- Never Leave dd() or dump() in Production Code (05-rules.md)

## Related Skills
- Skill: Create Custom Helpers
- Skill: Choose Between Facades and Constructor Injection
- Skill: Bind and Resolve Services in Container

## Success Criteria
- Helpers are used in controllers and views as appropriate
- Business logic classes use constructor injection for all dependencies
- No `env()` calls exist outside config files
- No debug helper calls exist in committed code

---

# Skill: Create Custom Helpers

## Purpose
Create, register, and document custom global helper functions following Laravel conventions with proper `function_exists()` guards, application-specific prefixes, and Composer autoloading.

## When To Use
- A utility operation is repeated across multiple controllers or views
- The operation is a pure transformation (no container dependencies)
- The operation does not belong to a specific service or action class
- A simple wrapper around repeated framework calls (e.g., `user()`, `format_currency()`)

## When NOT To Use
- For business logic, database queries, or service orchestration (use service classes)
- For operations that need to be mocked or tested in isolation (use injected services)
- When the operation is only used in one class (keep it in that class)
- When the helper would need container dependencies (use injection instead)

## Prerequisites
- At least two use cases demonstrating the need for a helper (avoid premature abstraction)
- Understanding of `function_exists()` guard requirement
- Access to modify `composer.json`

## Inputs
- Helper function name (with application prefix)
- Function signature (parameters and return type)
- Implementation logic

## Workflow
1. Create `app/helpers.php` file (if it does not exist)
2. Define the helper function wrapped in `function_exists()` guard:

```php
if (! function_exists('app_format_currency')) {
    function app_format_currency(float $amount, string $currency = 'USD'): string
    {
        return number_format($amount, 2).' '.$currency;
    }
}
```

3. Register the file in `composer.json` under `autoload.files`:

```json
{
    "autoload": {
        "files": ["app/helpers.php"]
    }
}
```

4. Run `composer dump-autoload` to regenerate the autoloader
5. Use the helper in controllers, views, and Blade templates
6. Update `.env.example` if the helper introduces new environment variable requirements

## Validation Checklist
- [ ] Helper is wrapped in `if (! function_exists('name'))` guard
- [ ] Helper name includes an application-specific prefix (e.g., `app_`, `acme_`)
- [ ] Helper is registered in `composer.json` `autoload.files` array
- [ ] `composer dump-autoload` has been run and succeeds
- [ ] Helper is lightweight and side-effect-free (no database queries, no API calls)
- [ ] Helper has a return type declaration
- [ ] Helper is documented with PHPDoc (at minimum: param and return types)
- [ ] No business logic exists in the helper function body

## Common Failures
- Missing `function_exists()` guard — causes fatal error on framework update
- Using generic name without prefix — collides with future Laravel or package helpers
- Including business logic — helper becomes untestable and cannot be mocked
- Not updating `composer.json` — helper class not found at runtime
- Not running `composer dump-autoload` — helper unavailable after deployment

## Related Rules
- Wrap Custom Helpers in function_exists() Guard (05-rules.md)
- Prefix Custom Helpers to Reduce Collision Risk (05-rules.md)
- Autoload Custom Helpers via Composer files Directive (05-rules.md)
- Keep Custom Helpers Lightweight and Side-Effect-Free (05-rules.md)

## Related Skills
- Skill: Use Helpers in Controllers and Views

## Success Criteria
- Custom helper is correctly defined with `function_exists()` guard
- Helper is registered in `composer.json` and autoloads correctly
- Helper is lightweight, side-effect-free, and used appropriately
- No collisions occur with framework or package helper names
