# ku-04: View Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **KU:** ku-04-view-caching
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Blade view caching compiles `.blade.php` templates into plain PHP files stored in `storage/framework/views/`. Each compiled view is a cached PHP script that is `require`d at runtime, eliminating Blade parsing and compilation overhead. The cache is automatic and transparent — Blade checks file modification timestamps to determine if recompilation is needed.

## Core Concepts
- **Compilation**: Blade templates are compiled to plain PHP on first use. The compiled file contains `echo` statements, control structures, and `$__env->make()` calls for `@include` directives.
- **Cache location**: `storage/framework/views/*.php` — the filename is an MD5 hash of the template path.
- **Auto-detection**: Blade checks `filemtime()` of the source template against the compiled file's timestamp. If the source is newer, the view is recompiled.
- **View clear**: `php artisan view:clear` deletes all compiled view files, forcing recompilation on next access.
- **No manual caching command**: Unlike config/route/event caching, view caching is automatic and always active. There is no `view:cache` command.

## When To Use
- View caching is ALWAYS active — no manual enablement needed.
- Use `view:clear` during deployment if template files have changed.
- Use `view:cache` in some versions of Laravel to pre-compile all views (not available in all versions).

## When NOT To Use
- View caching cannot be disabled — it's built into Blade's compilation pipeline.
- In development, timestamps ensure views are always current — no action needed.
- Do not manually delete compiled views unless you also clear the cache via `view:clear` (handles stale files).

## Best Practices (WHY)
- **Let Blade handle caching automatically**: The timestamp-based cache invalidation is reliable and low-overhead.
- **Use view:clear in deployment**: Run `php artisan view:clear` as part of deployment to ensure stale compiled views are not served.
- **Minimize view inheritance depth**: Each `@extends` and `@include` is a separate compiled file — deep nesting increases file count and I/O.
- **Use view caching for optimization**: Compiled views are plain PHP with OpCache benefits — no runtime parsing overhead.

## Architecture Guidelines
- Store views in `resources/views/` organized by controller/feature.
- Use Blade components and slots for reusable UI patterns — each component compiles independently.
- Avoid heavy logic in Blade templates — heavy computation should be done in the controller or view composers.
- Compiled view files should not be committed to version control (they're in the default `.gitignore`).

## Performance
- Compilation cost: ~5-20ms per view on first access (depending on template complexity).
- Cached view: a single `require` of the compiled PHP file — negligible cost.
- OpCache caches the compiled view PHP file — zero parsing overhead on subsequent requests.
- View inheritance: `@extends('layout')` compiles to `$__env->make('layout', ...)` — the parent layout compiles independently.

## Security
- Compiled views are plain PHP files — ensure `storage/framework/views/` has proper permissions to prevent unauthorized access.
- View paths are not exposed in compiled files — the hash filename prevents enumeration.
- `@csrf` and `@method` compile to the same secure PHP as manual form helpers.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Not clearing views on deploy | Old compiled views served for unchanged templates | View compiled version is newer than template | Changes not reflected after deploy | Include view:clear in deploy script |
| Committing compiled views | `storage/framework/views/*.php` in version control | Missing .gitignore rule | Conflicts across environments | Ensure .gitignore excludes this directory |
| Extremely deep view nesting | 10+ levels of @extends/@include | Poor template architecture | High I/O per request (many require calls) | Flatten view structure; use components |
| Over-relying on view composers | Heavy DB queries in view composers | Convenience for injecting data | Every view render pays the query cost | Pass data from controller; cache results |

## Anti-Patterns
- **Business logic in Blade templates**: Queries, calculations, or complex conditionals in `.blade.php` files.
- **Bypassing Blade compilation**: Using raw PHP tags (`<?php`) in Blade templates — breaks the compilation abstraction.
- **View composer overuse**: Registering global view composers that run for every view, even those that don't need them.

## Examples
```bash
# Clear compiled views during deployment
php artisan view:clear

# Pre-compile all views (Laravel 9+)
php artisan view:cache
```

## Related Topics
- Service Caching Meta (ku-05) — how view caching interacts with the services manifest
- Cache Invalidation (ku-08) — clearing views as part of deployment
- Optimize Command (ku-09) — `optimize:clear` includes `view:clear`
- OpCache Autoloader (ku-07) — OpCache optimizes compiled view PHP files

## AI Agent Notes
- Blade engine at `Illuminate\View\Engines\CompilerEngine` checks `filemtime()` for cache validity.
- Compiled view path: `storage/framework/views/<md5_hash>.php`.
- `view:cache` (Laravel 9+) pre-compiles all registered views — useful for production warmup.
- The `optimize:clear` command includes `view:clear`.

## Verification
- [ ] `storage/framework/views/` exists and is writable
- [ ] Compiled view files are generated on first template access
- [ ] `php artisan view:clear` succeeds without errors
- [ ] Views update correctly when templates change (timestamp invalidation works)
- [ ] No business logic exists in Blade templates
