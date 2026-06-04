# View Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
Blade view caching compiles `.blade.php` templates into plain PHP files stored in `storage/framework/views/`. Each compiled view is a cached PHP script that is `require`d at runtime, eliminating Blade parsing and compilation overhead. Unlike config, route, and event caching, view caching is automatic and transparent — Blade checks file modification timestamps to determine if recompilation is needed. There is no `view:cache` equivalent in all Laravel versions.

## Core Concepts

### Compilation
Blade templates are compiled to plain PHP on first use. The compiled file contains `echo` statements, control structures, and `$__env->make()` calls for `@include` directives.

### Cache Location
`storage/framework/views/*.php` — the filename is an MD5 hash of the template path.

### Auto-Detection
Blade checks `filemtime()` of the source template against the compiled file's timestamp. If the source is newer, the view is recompiled.

### View Clear
`php artisan view:clear` deletes all compiled view files, forcing recompilation on next access.

### No Manual Cache Command
Unlike config/route/event caching, view caching is automatic and always active. There is no `view:cache` command in all versions.

## Mental Models

### The Kitchen Prep
Blade templates are raw ingredients (`.blade.php`). View caching is the kitchen prepping ingredients — chopping, measuring, and organizing — before the chef starts cooking. Each dish uses pre-prepped ingredients for faster service.

### The Translator
Think of Blade as a translator between template syntax and PHP. View caching is the translator who remembers translations — once a sentence is translated, it's stored for instant recall. No need to re-translate on every request.

### The Blueprint
Each `.blade.php` file is an architectural blueprint. View caching builds the physical structure from the blueprint. Subsequent requests walk into the existing building instead of rebuilding from scratch.

## Internal Mechanics

### Compilation Process
```php
// Illuminate\View\Engines\CompilerEngine
// On first render:
// 1. Check if compiled file exists
// 2. Check if filemtime(view) > filemtime(compiled)
// 3. If stale or missing: compile
// 4. Require the compiled file

public function get($path, array $data = [])
{
    if ($this->isExpired($path)) {
        $this->compiler->compile($path);
    }
    return $this->compiler->getCompiledPath($path);
}
```

### Compiled File Example
```php
// Source: welcome.blade.php
// Compiled: storage/framework/views/a1b2c3d4.php
<?php $__env->startSection('content'); ?>
<h1>Welcome</h1>
<p><?php echo e($user->name); ?></p>
<?php $__env->stopSection(); ?>
```

### Timestamp Check
```php
// BladeCompiler checks if recompilation is needed
public function isExpired($path)
{
    $compiled = $this->getCompiledPath($path);
    if (! file_exists($compiled)) {
        return true;
    }
    return filemtime($path) >= filemtime($compiled);
}
```

### View Inheritance Compilation
`@extends('layout')` compiles to `$__env->make('layout', ...)`. The parent layout compiles independently — each template file produces one compiled PHP file.

## Patterns

### Automatic Compilation Pattern
Blade compiles views on first access automatically. No manual cache commands needed — the timestamp-based invalidation handles everything.

### View Clearing in Deploy Pattern
Run `php artisan view:clear` during deployment to ensure stale compiled views from the old code are not served.

### Component Compilation Pattern
Each Blade component compiles independently. `@include('components.button')` produces a separate compiled file from the parent view.

## Architectural Decisions

### Why timestamp-based invalidation vs manual cache?
Timestamp-based invalidation works automatically in development (changes are reflected immediately) and production (compiled once, cached forever). Manual caching would require developers to remember to clear views on every change.

### Why MD5 hash filenames?
MD5 hashing produces a unique, consistent filename based on the template path. No collisions, no directory traversal risk, and no need to store a filename mapping.

### Why storage/framework/views/ not bootstrap/cache/?
View files can be numerous (potentially hundreds) and are larger than config/route caches. `storage/framework/` is designed for application-generated files; `bootstrap/cache/` is for bootstrap-time artifacts.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Automatic compilation — zero configuration | First view access pays compile cost (5-20ms) | Cold start latency on first unique view |
| Timestamp-based invalidation is reliable | filemtime() is a stat() call per view | Adds I/O overhead on view resolution |
| Compiled views are plain PHP (OpCache compatible) | Deep view nesting increases file count | Each @extends/@include is a separate compiled file |
| No manual cache to maintain | view:clear needed in deployment scripts | One more step in deployment pipeline |

## Performance Considerations

- **Compilation cost:** ~5-20ms per view on first access (depends on template complexity).
- **Cached view:** a single `require` of the compiled PHP file — negligible cost.
- **OpCache benefit:** OpCache caches the compiled view PHP file — zero parsing overhead on subsequent requests.
- **View inheritance:** Each `@extends` and `@include` is a separate compiled file — deep nesting increases file count and I/O.
- **view:cache command:** In Laravel 9+, `view:cache` pre-compiles all registered views — useful for production warmup.

## Production Considerations

- **Include view:clear in deploy:** Run `php artisan view:clear` as part of deployment to prevent serving stale views.
- **Minimize view inheritance depth:** Deeply nested layouts and includes increase compiled file count and I/O.
- **OpCache for compiled views:** Compiled views are plain PHP — OpCache caches them like any other PHP file.
- **Warm views after deploy:** Consider `php artisan view:cache` (if available) to pre-compile views before traffic hits.
- **Monitor storage/framework/views/:** Ensure sufficient disk space — compiled views accumulate over time.

## Common Mistakes

- **Not clearing views on deploy:** Old compiled views served for unchanged templates — changes not reflected.
- **Extremely deep view nesting:** 10+ levels of `@extends`/`@include` — high I/O per request from many require calls.
- **Business logic in Blade:** Queries, calculations, or complex conditionals in templates — breaks the compilation abstraction.
- **View composer overuse:** Registering global view composers that run for every view, even those that don't need them.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| View not updating | Changes to .blade.php not reflected | Timestamps not updated (e.g., Git checkout) | Run view:clear |
| Compilation error | PHP error on view render | Syntax error in Blade template | Fix template syntax and re-render |
| Disk full | Unable to write compiled views | Compiled view accumulation | Periodic view:clear or cron cleanup |
| Permission denied | Compiled view not writable | Wrong filesystem permissions | Set correct permissions on storage/framework/views |

## Ecosystem Usage

- **Laravel Nova:** Uses Blade components extensively — each component compiles independently. Nova's views are pre-compiled before deployment.
- **Laravel Spark:** Breeze and Jetstream use Blade components — view caching handles compilation transparently.
- **Laravel Telescope:** Uses its own Blade templates for the dashboard — standard view caching applies.
- **Spatie packages:** Package views are published to `resources/views/vendor/` — compiled like any other view.

## Related Knowledge Units

### Related Topics
- [Service Caching Meta (ku-05)](../services-cache/02-knowledge-unit.md) — how view caching interacts with the services manifest.
- [Cache Invalidation (ku-08)](../cache-invalidation-deployment/02-knowledge-unit.md) — clearing views as part of deployment.
- [OpCache Autoloader (ku-07)](../ku-07-opcache-autoloader/02-knowledge-unit.md) — OpCache optimizes compiled view PHP files.

## Research Notes
- Blade engine at `Illuminate\View\Engines\CompilerEngine` checks `filemtime()` for cache validity.
- Compiled view path: `storage/framework/views/<md5_hash>.php`.
- `view:cache` (Laravel 9+) pre-compiles all registered views — useful for production warmup.
- The `optimize:clear` command includes `view:clear`.
