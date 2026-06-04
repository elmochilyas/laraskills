# Skill: Add Custom Middleware to the Priority Array at the Correct Position

## Purpose

Insert custom middleware into the priority array so that it executes before or after specific framework middleware, ensuring correct execution order relative to session, CSRF, auth, and other priority middleware.

## When To Use

When a custom middleware must execute at a specific position relative to framework middleware (e.g., before Authenticate, after StartSession) and registration order alone is insufficient.

## When NOT To Use

When the middleware's position relative to framework middleware does not matter — it will run after all priority middleware as non-priority.

## Prerequisites

- Understanding of the SortedMiddleware algorithm
- Knowledge of the default priority chain
- Laravel 12+ (for `prependToPriorityList`/`appendToPriorityList`) or Laravel 11 (for full priority override)

## Inputs

- Custom middleware class (FQCN)
- Target framework middleware to position before or after
- Reasoning for the required position

## Workflow

1. Determine which framework middleware the custom middleware must run before or after
2. In Laravel 12+, use targeted priority insertion:
   - Before: `$middleware->prependToPriorityList(before: Authenticate::class, prepend: CustomMiddleware::class)`
   - After: `$middleware->appendToPriorityList(after: StartSession::class, prepend: CustomMiddleware::class)`
3. In Laravel 11, include the custom middleware in the full priority array at the correct position:
   - Copy the default priority array from `vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php`
   - Insert the custom middleware at the correct position
   - Ensure ALL framework middleware from the default array is included
4. Add a comment explaining WHY the middleware must run at this position
5. Use exact FQCNs — never use aliases in the priority array

## Validation Checklist

- [ ] Custom middleware position relative to framework middleware is correct (before/after)
- [ ] Exact FQCNs used — no aliases or shortened class names
- [ ] Comment explains why the middleware must run at this position
- [ ] In Laravel 11 full override, all default framework middleware is included
- [ ] `prependToPriorityList`/`appendToPriorityList` used in Laravel 12+ instead of full override

## Common Failures

- Adding middleware to the group array expecting it to run before auth — but it's not in priority, so it runs after all priority middleware
- Using aliases in priority array — string comparison against resolved FQCNs fails silently
- Omitting framework middleware in Laravel 11 full override — omitted middleware runs as non-priority at the end
- Not documenting the positioning reason — future developers cannot determine why it's placed there

## Decision Points

- If the middleware does not need to run before/after any specific framework middleware, skip priority placement — it runs after all priority middleware
- If the middleware enriches the request before auth (tenant resolution, locale), it must be placed before Authenticate
- If the middleware depends on the session, it must be placed after StartSession

## Performance Considerations

Adding items to the priority array adds O(n*m) comparisons during pipeline construction. For 50 priority items and 15 middleware, this is ~750 string comparisons (~0.002ms).

## Security Considerations

Priority ensures security-critical middleware runs in the correct order: Session before CSRF, CSRF before Auth, Auth before Authorize, Authorize before SubstituteBindings. Breaking this order creates security vulnerabilities.

## Related Rules

- Add Custom Middleware to the Priority Array When Position Matters (middleware-ordering-priority:5)
- Do Not Override the Entire Priority Array Without Including All Framework Middleware (middleware-ordering-priority:5)
- Use Exact FQCNs in the Priority Array (middleware-ordering-priority:5)
- Document Why Each Custom Middleware Is Placed at Its Priority Position (middleware-ordering-priority:5)

## Related Skills

- Review Priority Array After Laravel Version Upgrade

## Success Criteria

Custom middleware executes at the correct position in the pipeline. Priority addition is accompanied by a comment explaining the positioning rationale. Laravel 12+ uses targeted insertion methods. FQCNs are used exclusively.

---

# Skill: Review the Priority Array After a Major Laravel Version Upgrade

## Purpose

Compare the application's overridden priority array against the new framework default after an upgrade, adding any new framework middleware at the correct position to maintain correct execution order.

## When To Use

After upgrading to a new major Laravel version (e.g., 11→12), before deploying the upgraded application to production.

## When NOT To Use

Applications that do not override the priority array (using `prependToPriorityList`/`appendToPriorityList` only in Laravel 12+) do not need a full review. Verify that referenced middleware class names still exist.

## Prerequisites

- Access to the new framework's default priority array
- List of the application's priority array entries

## Inputs

- New Laravel version default priority array
- Application's priority array (bootstrap/app.php or Kernel.php)

## Workflow

1. Locate the new default priority array in `vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php`
2. Compare against the application's overridden priority array
3. Identify any new framework middleware added in the new version that is missing from the application's override
4. Add missing middleware at the correct position in the application's priority array
5. If any middleware class names changed, update the FQCNs in the application's override
6. Run the full test suite, especially middleware-related tests
7. Update documentation with the new version's priority configuration

## Validation Checklist

- [ ] New framework middleware from the default priority array is included in the application's override
- [ ] No stale middleware from old versions remains in the priority array
- [ ] FQCNs match the new version's class names
- [ ] Test suite passes, including middleware ordering tests
- [ ] Documentation is updated

## Common Failures

- New security middleware added by the framework runs as non-priority (at the end) because it's missing from the override
- Renamed middleware classes cause the priority match to fail silently
- The application's override was not reviewed and still uses Laravel 11 middleware names after upgrading to Laravel 12

## Decision Points

- If the application uses `prependToPriorityList`/`appendToPriorityList` (Laravel 12+), verify the `before`/`after` target middleware still exists with the same FQCN in the new version
- If the application uses a full priority override, add new framework middleware at the correct position

## Performance Considerations

No direct performance impact. Missing middleware in the wrong position may cause subtle bugs that waste debugging time.

## Security Considerations

New security middleware added to the default priority array in a new Laravel version may be critical. If it runs as non-priority (at the end), it may not protect the application as intended.

## Related Rules

- Review the Priority Array on Every Major Laravel Upgrade (middleware-ordering-priority:5)

## Related Skills

- Add Custom Middleware to the Priority Array at the Correct Position

## Success Criteria

The application's priority array includes all new framework middleware from the upgraded version. All class names are updated. Tests pass. Documentation reflects the new version's configuration.
