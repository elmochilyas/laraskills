# Skill: Regenerate Services Cache After Provider Changes

## Purpose
Regenerate the deferred service provider manifest (`bootstrap/cache/services.php`) after any change to service providers, ensuring the cached provider list matches the deployed code and preventing `ClassNotFoundException` errors.

## When To Use
- After adding, removing, or reordering providers in `config/app.php`
- After `composer install` or `composer update` that adds/removes package providers
- After changing deferred provider status (implementing or removing `DeferrableProvider`)
- During every production deployment that may involve provider changes

## When NOT To Use
- Local development — run `optimize:clear` only, don't regenerate the manifest
- When troubleshooting provider registration — clear the cache to eliminate it as a variable
- When no provider-related changes occurred in the deployment

## Prerequisites
- Access to Artisan CLI
- `bootstrap/cache/` directory writable by deployment user
- All provider classes exist and are autoloadable

## Inputs
- `config/app.php` — provider list
- Provider classes in `app/Providers/` and vendor packages

## Workflow
1. After adding/removing providers or running `composer install`:
   - Run `php artisan optimize:clear` to delete the stale manifest
   - Run `php artisan optimize` to regenerate the manifest
2. Verify the manifest (`bootstrap/cache/services.php`) contains all expected providers
3. Check that no stale provider references remain
4. Verify deferred providers correctly implement `DeferrableProvider` and `provides()`
5. Confirm the manifest is not committed to version control

## Validation Checklist
- [ ] `bootstrap/cache/services.php` exists after regeneration
- [ ] All expected providers appear in the manifest (check file manually if needed)
- [ ] Manifest regenerated after any provider addition, removal, or reorder
- [ ] Manifest regenerated after any `composer install` or `composer update`
- [ ] `bootstrap/cache/services.php` is not committed to version control
- [ ] `php artisan optimize` output confirms manifest regeneration

## Common Failures
- Adding a provider without clearing cache — new provider never registered
- Removing a provider without clearing cache — `ClassNotFoundException` on bootstrap
- Assuming `optimize` always regenerates — permissions errors cause silent staleness
- Stale manifest after `composer install` — package providers silently missing
- Confusing deferred vs eager — thinking all providers equally benefit from caching
- Manually editing `services.php` — edits overwritten on next `optimize` run

## Decision Points
- **Deferred vs Eager**: Implement `DeferrableProvider` for services not needed on every request; keep eager for providers that register event listeners, middleware, or routes in `boot()`
- **Full optimize vs targeted clear**: Use full `optimize` for comprehensive regeneration; `php artisan optimize:clear` alone when troubleshooting

## Performance Considerations
- Without manifest: 15-40ms for provider scanning and deferred detection on every request
- With manifest: single `require` — <1ms
- Deferred providers: 100% of `register()`/`boot()` cost saved for services unused on a given request
- Manifest file size: 5-15KB for medium applications — negligible

## Security Considerations
- Manifest references provider class names — no sensitive data stored directly
- Stale manifests after package removal can expose functionality from uninstalled packages if classes still exist
- Ensure `bootstrap/cache/services.php` is writable during deploy, read-only after deployment
- Audit package providers for security concerns before production deployment

## Related Rules
- Clear cache after every service provider change
- Never edit `bootstrap/cache/services.php` manually
- Use deferred providers for infrequently used services
- Run optimize after every composer package change
- Monitor eager provider count for optimization opportunities
- Understand that optimize does not always regenerate the manifest

## Related Skills
- Execute Optimize in Deployment Sequence
- Execute Cache Invalidation Deployment

## Success Criteria
- All expected providers registered after every deployment
- No `ClassNotFoundException` from stale service manifest
- Deferred providers correctly skip `register()`/`boot()` until first resolution
- Provider count per request is monitored and optimized for performance
