# Preloading Script Design Patterns - opcache_compile_file() vs include, Conditional Declarations

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | Preloading Script Design Patterns - opcache_compile_file() vs include, Conditional Declarations |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

OpCache preloading loads PHP files into shared memory before any request is served, eliminating lazy compilation on first access. The preloading script can use opcache_compile_file() (compiles without executing) or require_once (compiles and executes). Preloading provides greatest benefit for fast APIs (<100ms) where autoloading time (10-16ms) is significant.

## Core Concepts

- Preloading vs caching: Preloading loads files at PHP-FPM startup. Regular OpCache caches files lazily on first access. Preloading also pre-executes class declarations so they skip autoloading.
- opcache_compile_file(): Only compiles to opcodes. Classes/functions defined are NOT available to subsequent requests. Used for utility-only files.
- require_once/include: Compiles AND executes. Class/function definitions become globally available without autoloading.
- opcache.preload_user: Required when running as non-root. Must match the PHP-FPM user.

## When To Use

- Framework-heavy applications with large bootstrap overhead (Laravel, Symfony).
- Fast API endpoints where autoloading is a significant percentage of response time.
- Containerized environments where startup happens once per container.

## When NOT To Use

- Applications where bootstrap is a small percentage of total request time (>500ms requests).
- Development environments where class changes must be immediately visible.
- Applications with very few classes (<100).

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Preload framework core, not all classes | Preloading everything wastes memory. Leave rare-path classes for lazy loading. |
| Use require_once for classes, opcache_compile_file for utilities | Classes need execution to be available; utilities only need compilation. |
| Set opcache.preload_user to PHP-FPM user | Required when running as non-root to avoid permission errors. |

## Architecture Guidelines

- Preloading reduces cold-start latency by 10-16ms (autoloading time).
- Higher baseline memory: Preloaded classes consume OpCache memory permanently.
- Preloading is ideal for containerized environments.

## Performance Considerations

- Preloading reduces cold-start by 10-16ms.
- For APIs with 20ms response: 10ms savings = 50% improvement.
- For apps with 1s response: 10ms = 1% improvement.
- Preloaded classes use memory even if never used.

## Security Considerations

- Preload script runs with high privileges during PHP-FPM startup.
- Ensure preload script does not contain sensitive logic.
- Validate preload script inputs if dynamic.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Preloading everything | Loading all application classes wastes memory and increases startup time. | Memory waste with no benefit for rarely-used classes. | Preload framework core and commonly-used classes only. |

## Anti-Patterns

- Preloading classes that are only used in admin/cron paths: Wastes memory per worker.
- Using opcache_compile_file() for class files: Classes are compiled but not available to autoloader.

## Examples

```php
// preload.php - Laravel preloading script
require_once __DIR__ . '/vendor/autoload.php';

// Preload framework core
$classes = [
    Illuminate\Support\Str::class,
    Illuminate\Support\Collection::class,
    // ... core classes only
];

foreach ($classes as $class) {
    if (!class_exists($class) && !interface_exists($class) && !trait_exists($class)) {
        continue;
    }
    $reflection = new ReflectionClass($class);
    if ($reflection->isUserDefined()) {
        opcache_compile_file($reflection->getFileName());
    }
}
```

## Related Topics

- OpCache Memory Sizing
- Preloading Reduces Cold Start Latency
- Inheritance Cache Deep Dive

## AI Agent Notes

- Preloading has diminishing returns for slow applications. Fix I/O bottlenecks first.
- For Laravel apps, preload Illuminate core classes. App-specific classes can be lazy-loaded.
- Preloading + inheritance cache (PHP 8.1+) compound for maximum benefit.
- Always restart PHP-FPM when preloading script changes.

## Verification

- [ ] Create preloading script with framework core classes.
- [ ] Configure opcache.preload in php.ini.
- [ ] Set opcache.preload_user to PHP-FPM user.
- [ ] Test with php -f preload.php to verify no errors.
- [ ] Benchmark cold-start latency with and without preloading.