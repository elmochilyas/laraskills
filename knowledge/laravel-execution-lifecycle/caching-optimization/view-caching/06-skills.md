# Skill: Manage Blade View Compilation During Deployment

## Purpose
Clear stale compiled Blade templates and optionally pre-compile all views during deployment, ensuring users always see the latest template changes without compilation delay.

## When To Use
- Every deployment that modifies `.blade.php` template files
- Production warmup to pre-compile views before traffic hits (Laravel 9+)
- After switching themes or modifying layout inheritance

## When NOT To Use
- Deployments with no view template changes (backend-only changes)
- Local development — Blade auto-detects template changes via timestamps

## Prerequisites
- `storage/framework/views/` directory exists and is writable
- Blade template files in `resources/views/`
- Cache files excluded from version control (default `.gitignore`)

## Inputs
- Blade template files: `resources/views/**/*.blade.php`
- Compiled view directory: `storage/framework/views/`

## Workflow
1. Run `php artisan view:clear` as part of deployment if templates have changed
2. Run `php artisan view:cache` (Laravel 9+) to pre-compile all registered views
3. Verify compiled files exist in `storage/framework/views/`
4. Optionally clear specific compiled views by running `view:clear` again

## Validation Checklist
- [ ] `php artisan view:clear` runs successfully during deployment when templates change
- [ ] Compiled view files generated on first template access after cache clear
- [ ] Blade templates update correctly when source files change (timestamp invalidation)
- [ ] No business logic (DB queries, heavy computation) exists in Blade templates
- [ ] View inheritance limited to 3 levels or fewer
- [ ] View composers scoped to specific views, not global wildcard

## Common Failures
- Not clearing views on deploy — old compiled templates served, changes invisible
- Extremely deep view nesting — high I/O per request from cascading `require` calls
- Business logic in Blade templates — untestable, runs on every render
- Global view composers executing unnecessary queries on every page load
- Compiled view files accidentally committed to version control

## Decision Points
- **view:clear vs relying on timestamps**: Always run `view:clear` during deploys for safety; timestamp-based invalidation works but carries risk
- **view:cache (pre-compile) vs on-demand compilation**: Pre-compiling shifts 5-20ms compilation cost from first request to deploy time

## Performance Considerations
- Compilation cost: 5-20ms per view on first access depending on complexity
- Cached view: single `require` — negligible cost
- OpCache caches compiled view PHP files — zero parsing overhead on subsequent requests
- View inheritance: each `@extends` and `@include` is a separate `require` call
- Global view composers add query overhead to every page, even pages that don't use the data

## Security Considerations
- Compiled views are plain PHP files — ensure `storage/framework/views/` has proper permissions
- View paths are hashed — prevents enumeration via filename guessing
- `@csrf` and `@method` compile to secure PHP equivalents
- Compiled views should not be exposed via web server

## Related Rules
- Clear compiled views during every deployment
- Precompile views in production warmup
- Keep Blade templates free of business logic
- Limit view inheritance depth to 3 levels
- Use view composers only for views that need them

## Related Skills
- Execute Optimize in Deployment Sequence
- Warm Caches During CI/CD Deployment

## Success Criteria
- Template changes consistently reflected after every deployment
- First view access after deploy has zero compilation delay (pre-compiled)
- No business logic exists in Blade templates
- View nesting is shallow, maintainable, and performant
