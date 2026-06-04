## Preload only framework core classes, not the entire application
---
Category: Performance
---
Preload framework core classes (Illuminate, Symfony components) and leave application-specific classes for lazy loading.
---
Reason: Preloading consumes OpCache memory permanently. A full Laravel preload (~800 classes) adds 40-80MB OpCache consumption. Framework core classes benefit all requests; application classes may be rarely used.
---
Bad Example:
```php
// Preloading everything — wastes memory
$files = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator(app_path())
);
foreach ($files as $file) { opcache_compile_file($file); }
```

Good Example:
```php
// Preload only framework core
$classes = [
    Illuminate\Support\Str::class,
    Illuminate\Support\Collection::class,
    // Core framework classes only
];
```
---
Exceptions: Fast APIs (<20ms) where every microsecond of autoloading matters and memory is abundant.
---
Consequences Of Violation: 40-80MB additional OpCache memory consumption, memory pressure on other cached files.

## Measure before/after when implementing preloading
---
Category: Performance
---
Always benchmark first-request latency with and without preloading before committing to it.
---
Reason: Preloading benefit is proportional to API speed. Fast APIs (<50ms) see 10-16ms savings = 20-50% improvement. Slow APIs (>500ms) see 10ms savings = 2% improvement. The memory cost may not be justified.
---
Bad Example:
```php
// Implementing preloading without measuring first
// Memory cost: 40MB, benefit: unknown
```

Good Example:
```php
// Measure bootstrap time first
$start = microtime(true);
// Make a request
$bootstrapTime = (microtime(true) - $start) * 1000;
// Only preload if bootstrapTime > 10ms AND memory budget allows
```
---
Exceptions: Containerized environments where startup cost is paid once per container lifetime.
---
Consequences Of Violation: Wasted memory on preloading that provides negligible benefit for slow endpoints.

## Never preload rarely-used classes
---
Category: Performance
---
Avoid preloading classes used only in admin panels, CLI commands, or infrequent code paths.
---
Reason: Preloaded classes consume OpCache memory for the entire process lifetime. Classes used rarely (admin, cron, report generation) occupy memory without providing per-request benefit. Let them load lazily.
---
Bad Example:
```php
// Preloading admin-only classes
opcache_compile_file('app/Admin/Reports/MonthlyReportGenerator.php');
// Used once per month, occupies memory 24/7
```

Good Example:
```php
// Preload classes used on every request
opcache_compile_file('app/Http/Middleware/Authenticate.php');
```
---
Exceptions: Applications where all requests follow the same code path (single-purpose API).
---
Consequences Of Violation: Wasted OpCache memory, increased cache pressure, potentially evicting more important files.
