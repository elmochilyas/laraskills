# Skill: Manage Facade Aliases for Global Service Access

## Purpose
Register and manage facade aliases in `config/app.php` to provide convenient global access to services, while avoiding alias collisions and understanding console-specific limitations.

## When To Use
- Registering custom facades for packages or application services
- Adding new aliases to the `config/app.php` `aliases` array
- Auditing existing aliases for collisions and unused entries
- Debugging "class not found" errors when using aliases in console commands

## When NOT To Use
- For business logic classes that should use constructor injection — prefer explicit dependency injection
- In console commands where facades can be explicitly imported with `use` statements
- When alias collisions are possible between multiple packages — use longer, prefixed names
- For services used only in injectable contexts (controllers, services, jobs)

## Prerequisites
- Understanding of the `RegisterFacades` bootstrapper and its position in the boot sequence
- Knowledge of the `AliasLoader` mechanism and lazy class aliasing
- Familiarity with the 6th step of the boot sequence (RegisterFacades)

## Inputs
- List of facade classes that need aliases
- Current `config/app.php` `aliases` array
- Knowledge of which facades are used in Blade templates or non-injectable contexts

## Workflow
1. Review the existing `aliases` array in `config/app.php` for collisions and unused entries
2. For each new facade, add an entry: `'ShortName' => App\Facades\ServiceFacade::class`
3. Ensure the alias name does not collide with existing framework or package aliases
4. Remove aliases for facades that are never used in Blade templates or non-injectable contexts
5. For code in injectable contexts, use explicit `use Illuminate\Support\Facades\Cache` imports instead of aliases
6. For all Artisan command code, add explicit `use` statements — never rely on aliases in console commands
7. For packages, use vendor-prefixed aliases to prevent collisions (e.g., `'AcmeAnalytics'` instead of `'Analytics'`)
8. Verify aliases work after `php artisan config:cache`

## Validation Checklist
- [ ] Every alias in `config/app.php` points to a valid, existing facade class
- [ ] No alias collisions exist between application, framework, and package aliases
- [ ] Console commands import facades explicitly with `use` statements
- [ ] Business logic classes use constructor injection, not facade aliases
- [ ] Custom aliases are registered in `config/app.php`, not dynamically in providers
- [ ] Alias registration works correctly after `php artisan config:cache`
- [ ] Unused aliases have been removed from the array

## Common Failures
- Alias collision — two packages register the same alias; one silently overrides the other without warning
- Console commands using aliases — `RegisterFacades` bootstrapper is omitted in Console kernel, causing "class not found" errors
- Dynamic alias registration in providers — lost after `config:cache` because only `config/app.php` aliases are preserved
- Using aliases for non-facade classes — confuses the purpose of the alias system and makes code harder to understand

## Decision Points
- Use the `aliases` array for Blade templates and quick-access framework services; use `use` imports for all other code
- If a package alias collides with an application alias, either rename the application alias or disable the package's auto-discovery for that alias
- Keep the aliases array minimal — only include aliases that are genuinely used in non-injectable contexts

## Performance Considerations
- Alias registration is negligible (~0.5-2µs per alias via `class_alias()`)
- Aliases are loaded lazily — unused aliases add zero cost
- Console kernel skips alias registration entirely, saving ~5-15ms on console boot
- Each unused alias in the array adds unnecessary noise but negligible runtime cost

## Security Considerations
- Alias collisions silently mask one facade with another — audit aliases when adding packages
- In shared hosting or multi-tenant apps, alias collisions between packages can lead to unexpected behavior
- Facade aliases provide global access — ensure they don't bypass authorization controls
- After `config:cache`, dynamic aliases are lost — security-critical aliases must be in `config/app.php`

## Related Rules
- Facade Aliases Registration Rule 1: Register Aliases in config/app.php, Not Dynamically
- Facade Aliases Registration Rule 5: Know That Console Boot Skips RegisterFacades
- Facade Aliases Registration Rule 6: Keep the Aliases Array Minimal

## Related Skills
- Write Context-Aware Boot Code for Console vs HTTP (console-vs-http-boot-differences)
- Configure Contextual Bindings for Specialized Injection (ku-04-contextual-binding-timing)

## Success Criteria
- All facade aliases resolve correctly and uniquely in HTTP context
- Console commands never fail with "class not found" from alias usage
- Business logic classes use constructor injection instead of aliases
- The `aliases` array contains only aliases used in Blade templates or non-injectable contexts
- No alias collisions exist after package installations
