# Skill: Register and Use Middleware Aliases

## Purpose
Create concise, memorable string aliases for middleware classes that improve route definition readability and decouple routes from class locations.

## When To Use
- Creating new custom middleware classes
- Defining route files where middleware is referenced frequently
- Registering middleware provided by packages or external sources

## When NOT To Use
- For middleware used only once where the full class name is equally short
- For inline closure middleware (cannot be aliased)
- When over-abstracting (creating aliases for every middleware regardless of usage)

## Prerequisites
- Laravel 11+ project with `bootstrap/app.php` (or `App\Http\Kernel` for <11)
- Custom middleware class(es) already created
- Route files that will reference the aliases

## Inputs
- Middleware class FQCN (e.g., `\App\Http\Middleware\CheckRole::class`)
- Desired alias name (e.g., `'role'`)
- Parameterized usage pattern (e.g., `'role:admin,editor'`)

## Workflow
1. Open `bootstrap/app.php` and locate the `->withMiddleware()` callback
2. Add alias with `$middleware->alias('role', \App\Http\Middleware\CheckRole::class)`
3. Follow Laravel naming: lowercase, single word or hyphenated (`'verify-tenant'` not `'VerifyTenant'`)
4. Verify no collision with existing aliases (`auth`, `guest`, `throttle`, `verified`, `can`, `signed`, `bindings`)
5. Use the alias in route definitions: `->middleware('role:admin,editor')`
6. Run `php artisan route:list -v` to verify alias resolves to the correct class
7. Run `php artisan optimize` if using route caching

## Validation Checklist
- [ ] Alias name is lowercase, hyphenated if multi-word
- [ ] Alias does not collide with framework defaults
- [ ] Alias maps directly to FQCN, not to another alias
- [ ] Route using the alias resolves correctly (verify with `route:list -v`)
- [ ] Route cache updated after alias changes
- [ ] Parameterized syntax works with colon delimiter

## Common Failures
- Mapping alias to another alias instead of FQCN (resolution fails)
- Using aliases in `withoutMiddleware()` expecting class-name match (alias string != resolved class)
- Forgetting to re-cache routes after adding/changing aliases
- Alias collision with package middleware (silent override)

## Decision Points
- Is the middleware used in multiple route definitions? -> Yes makes alias worthwhile
- Does the alias name clearly convey the middleware's purpose? -> Avoid cryptic names

## Performance Considerations
- Alias resolution is a simple array lookup (~0.001ms)
- Route caching serializes resolved class names (no per-request alias lookup)
- Parameter parsing is a simple string split (negligible overhead)

## Security Considerations
- Undefined alias throws `InvalidArgumentException` (prevents silent bypass)
- Alias collision silently overrides previous registration (last wins)
- Route cache may reference stale class names if aliases change without re-caching

## Related Rules
- Register Custom Aliases for All Application Middleware
- Follow Laravel's Aliasing Convention -- Lowercase, Hyphenated
- Never Register Custom Aliases That Collide with Framework Defaults
- Re-Cache Routes After Adding or Changing Aliases
- Use the Full Class Name When Registering Aliases -- Never Another Alias

## Related Skills
- Configure Middleware in Bootstrap
- Assign Route Middleware Correctly
- Configure Middleware Parameters

## Success Criteria
- All custom middleware used in route files has a registered alias
- Route definitions use short, readable alias strings instead of FQCNs
- No alias collisions exist
- Route caching works correctly with all aliases
