# Skill: Implement a Deferred Provider

## Purpose

Mark a service provider as deferred so it is only instantiated and booted when one of its services is first requested from the container, eliminating bootstrap overhead on routes that don't use those services.

## When To Use

- A provider's services are used on less than ~30% of routes.
- The provider registers no boot-time artifacts (routes, event listeners, views, middleware).
- The provider's `register()` has no side effects that must run at startup.

## When NOT To Use

- The provider calls `loadRoutesFrom()`, `loadViewsFrom()`, or registers event listeners in `boot()`.
- The provider's services are needed on most requests (>70%).
- The provider has boot-time side effects (logging, file writes, cache writes) that must execute at application startup.

## Prerequisites

- Service Provider Fundamentals
- Service Container (bind, singleton)
- `DeferrableProvider` interface from `Illuminate\Contracts\Support\DeferrableProvider`

## Inputs

- Provider class name
- List of service identifiers (class names, interfaces, aliases) the provider registers
- Existing `register()` method implementation

## Workflow

1. Add `implements DeferrableProvider` to the provider class signature.
2. Implement the `provides()` method returning an array of every service identifier registered in `register()`.
3. Ensure `register()` only contains container bindings — no boot-time side effects.
4. Run `php artisan optimize` to rebuild the deferred manifest.
5. Verify the provider is listed as deferred via `php artisan about` or by inspecting `bootstrap/cache/services.php`.

## Validation Checklist

- [ ] Provider implements `DeferrableProvider` interface
- [ ] `provides()` returns every identifier registered in `register()` (classes, interfaces, aliases)
- [ ] `provides()` does NOT include identifiers only used in `boot()` (these are not bound in the container)
- [ ] Provider's `boot()` does NOT register routes, views, event listeners, or middleware
- [ ] Deferred manifest rebuilt after changes (`php artisan optimize`)
- [ ] Service resolves correctly from container after deferral

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Provider never loads; service silently unavailable | `provides()` missing or incomplete — check every binding is listed |
| Routes return 404 | Provider deferred but registers routes in `boot()` — split into eager + deferred |
| Stale manifest after deployment manifest not rebuilt | — run `php artisan optimize` in deploy script |
| Service works locally but not in production | Local development may auto-rebuild manifest; production depends on cached `services.php` |

## Decision Points

- **Eager vs Deferred**: Will the provider's services be used on >70% of requests? → Keep eager.
- **Can't Defer**: Does `boot()` register routes, views, events, or middleware? → Must remain eager, or split into eager (boot artifacts) + deferred (services).

## Performance Considerations

- Deferred providers add zero bootstrap time until their services are requested.
- First resolution of a deferred service is slightly slower (provider loads + registers + boots on demand).
- Manifest lookup is negligible (single file read, small array).
- A provider used on 10% of routes saves ~90% of its overhead.

## Security Considerations

- Stale manifest after code changes can cause silent resolution failures — always rebuild in deployment.
- Manifest file (`bootstrap/cache/services.php`) should not be writable by web server in production.
- Deferred provider loading occurs mid-request; if it throws, it produces a 500 on specific pages while other routes work.

## Related Rules

- Rule 1: Defer Rarely-Used Services to Optimize Bootstrap Time
- Rule 2: Always Implement `provides()` with Every Registered Service Identifier
- Rule 3: Never Defer Providers That Register Routes, Event Listeners, or Views in `boot()`
- Rule 4: Always Rebuild the Deferred Manifest After Code Changes
- Rule 5: Keep `provides()` in Exact Sync with `register()` Bindings
- Rule 6: Prefer a Deferred-First Policy for New Providers

## Related Skills

- Implement Eager Provider
- Enforce Provider Budget in CI
- Test Deferred Provider provides() Method

## Success Criteria

- Provider only loads when its services are resolved; `php artisan about` does not show it in the loaded provider list until a service is requested.
- All service identifiers in `register()` are resolvable after deferral.
- Manifest is correctly generated and survives deployment cache regeneration.
---

# Skill: Diagnose and Fix Deferred Manifest Issues

## Purpose

Identify and resolve problems caused by stale, missing, or incorrect deferred provider manifests, where services silently fail to resolve or outdated providers still load after code changes.

## When To Use

- Services fail to resolve after deploying code changes to deferred providers.
- A removed provider's services are still available after deployment.
- `php artisan optimize` reports errors related to manifest generation.
- Adding or removing packages that contain deferred providers.

## When NOT To Use

- Non-deferred provider issues (check `bootstrap/providers.php` first).
- Container binding resolution errors unrelated to manifest.

## Prerequisites

- Understanding of the deferred manifest (`bootstrap/cache/services.php`)
- Ability to run Artisan commands in the target environment

## Inputs

- List of changed providers
- Contents of `bootstrap/cache/services.php`
- Error message from container resolution failure

## Workflow

1. Run `php artisan about --json` and check if expected providers are listed.
2. Inspect `bootstrap/cache/services.php` — verify the `deferred` array maps expected service IDs to provider classes.
3. If a provider was added but is not in the manifest: run `php artisan optimize`.
4. If a provider was removed but is still in the manifest: delete `bootstrap/cache/services.php` and run `php artisan optimize`.
5. If a provider's `provides()` was modified: verify it returns the updated identifiers; run `php artisan optimize`.
6. Check the provider class implements `DeferrableProvider` and has a non-empty `provides()` method.
7. Verify the provider's `register()` bindings match `provides()` exactly.

## Validation Checklist

- [ ] `bootstrap/cache/services.php` exists and is valid PHP
- [ ] Manifest `deferred` array maps each service ID to correct provider class
- [ ] No stale entries for removed providers
- [ ] All new providers appear in the manifest
- [ ] Service resolves correctly after manifest rebuild
- [ ] Deployment script includes `php artisan optimize`

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Manifest references deleted provider class | Package removed without cache rebuild |
| New provider not in manifest | `composer install` or `php artisan optimize` not run after adding package |
| Service resolves to null | `provides()` omits the service identifier |
| Manifest file missing entirely | `bootstrap/cache/` not writable or `php artisan optimize` failed |

## Decision Points

- **Rebuild or Clear**: If existing manifest is partially correct → `php artisan optimize`. If manifest is corrupted or stale entries exist → delete file then `php artisan optimize`.
- **Deployment Automation**: Add `php artisan optimize` to deployment script, not just `artisan config:cache`.

## Performance Considerations

- Manifest rebuild is a deployment-time operation — negligible runtime impact.
- Missing manifest forces on-the-fly provider scanning, which is slower — always regenerate.
- Large manifests (100+ deferred providers) are still sub-millisecond reads.

## Security Considerations

- Manifest file should be read-only after deployment to prevent tampering.
- Stale manifest from a previous deployment can expose old service implementations.
- Validate manifest contents as part of deployment verification.

## Related Rules

- Rule 4: Always Rebuild the Deferred Manifest After Code Changes
- Rule 5: Keep `provides()` in Exact Sync with `register()` Bindings

## Related Skills

- Implement a Deferred Provider
- Audit and Enforce Provider Count in CI

## Success Criteria

- All deferred services resolve correctly after code changes.
- Manifest file accurately reflects current codebase (no stale, no missing entries).
- Deployment pipeline consistently regenerates manifest.
