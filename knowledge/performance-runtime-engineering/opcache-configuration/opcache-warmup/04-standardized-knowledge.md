# OpCache Warmup — Preloading Strategies, Cache Warming, Cold-Start Latency Mitigation

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Warmup — Preloading Strategies, Cache Warming, Cold-Start Latency Mitigation |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

OpCache warmup is the process of populating the opcode cache before user traffic arrives, preventing the latency spike that occurs when the first request compiles all PHP files. Two primary mechanisms exist: **preloading** (load files into shared memory at PHP-FPM startup) and **cache warming** (send synthetic requests to trigger lazy compilation). Preloading eliminates cold-start autoloading entirely for preloaded files but increases startup time and baseline memory. Cache warming spreads the compilation cost over a controlled warm-up phase rather than exposing real users to slow first requests.

## Core Concepts

- **Preloading**: `opcache.preload` directive specifies a PHP script that is executed at PHP-FPM startup. The script uses `opcache_compile_file()` or `require` to load files into OpCache's shared memory. Preloaded files never trigger autoloading — they are always available.
- **Preloading script**: A PHP file (typically `preload.php` in the project root) that lists which files to preload. Uses `opcache_compile_file()` for compilation without execution, or `require` for compilation + execution.
- **opcache_compile_file()**: Compiles a PHP file into opcodes without executing it. Used in preloading scripts to add files to the cache without running them.
- **Cache warming**: After deployment or cache reset, send requests to all critical endpoints (or use a script that iterates PHP files) to populate the OpCache gradually.
- **Cold-start latency**: The time between PHP-FPM start (or cache reset) and stable operation at full throughput. During this period, each request triggers lazy compilation of its required files.
- **Preload user**: `opcache.preload_user` specifies the system user that can execute the preload script. Prevents privilege escalation.
- **Lazy compilation**: The default behavior — files are compiled on first access. This spreads compilation cost across the first N requests.

## When To Use

- You want to eliminate cold-start latency for framework classes (Laravel, Symfony, WordPress).
- You are running containerized PHP applications and want to minimize startup time.
- You have high-traffic APIs where even 1–3ms of autoloading time per request matters.
- You deploy frequently and want to minimize the warm-up window after each deployment.
- You run multiple PHP-FPM workers and want to avoid redundant compilation across workers.

## When NOT To Use

- Your application has slow response times (>500ms) — cold-start latency is a small fraction of total time.
- You don't have control over `opcache.preload` configuration (shared hosting).
- Your preload script contains errors that could crash PHP-FPM at startup.
- You deploy rarely and can tolerate the cold-start window.
- Your server has limited memory — preloading increases baseline memory consumption.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use `opcache_compile_file()` in preload scripts, not `require` | `require` compiles AND executes the file, potentially executing code with side effects at startup. `opcache_compile_file()` only compiles. |
| Preload framework classes, not application-specific files | Framework classes are stable and used on nearly every request. Application files change frequently and may need cache invalidation. |
| Set `opcache.preload_user` to the web server user | Prevents privilege escalation — only the specified user can execute the preload script. |
| Warm critical endpoints after cache reset (no preloading) | If you can't use preloading, hit all critical API endpoints after deployment to populate the cache before user traffic. |
| Preload in containers for faster cold-start | In containerized environments, preloading happens once per container start. The cost is amortized over the container's lifetime. |
| Monitor preload memory consumption | Preloaded files consume OpCache memory. Monitor `opcache_get_status()` to ensure preload + normal cache fits within `memory_consumption`. |
| Test preload script in isolation | Run `php preload.php` manually to verify no errors. A failing preload script can prevent PHP-FPM from starting. |
| Use `opcache.file_cache` alongside preloading | Combined, preloading ensures code is in shared memory, and file cache provides fast restarts for workers that don't have shared memory. |

## Architecture Guidelines

- **Preload execution flow**: PHP-FPM starts → reads `opcache.preload` directive → executes the preload script → script calls `opcache_compile_file()` for each file → files are compiled and stored in shared memory → PHP-FPM workers can now use these files without autoloading.
- **Preload and shared memory**: Preloaded files live in OpCache's shared memory. They are accessible by all workers. No per-worker duplication.
- **Preload and validate_timestamps**: Preloaded files are NOT affected by `validate_timestamps`. Once preloaded, they remain in cache until PHP-FPM restart. Changing a preloaded file requires restarting PHP-FPM, not just `opcache_reset()`.
- **Cache warming with curl**: After deployment, iterate over site URLs via curl or a specialized warm-up script. Each request compiles the files needed for that endpoint. This warms the cache without preloading.
- **Incremental caching**: If you split warming across requests (e.g., one request per endpoint), each request pays the compilation cost for new files. The total warm-up time is the sum of per-request compilation costs.
- **Warm-up health check**: After warm-up, verify the OpCache hit rate is >99%. If not, some files may still need compilation — increase the warm-up scope.

## Performance Considerations

- Preloading benefit: 1–3ms saved per request for preloaded classes. For API endpoints <50ms, this is 2–6% of total time.
- Preloading cost: 500ms–5s increased PHP-FPM startup time. Baseline memory increases by ~10–30MB depending on the number of preloaded files.
- Cache warming cost: warm-up phase takes 5–60 seconds depending on the number of endpoints and compilation speed.
- Startup time impact: Preloading adds to PHP-FPM startup time. In auto-scaling environments with frequent container starts, startup time matters.
- Preloading for fast APIs (<100ms): The 1–3ms savings is ~1–3% of total response time — meaningful for high-throughput APIs.
- Preloading for slow apps (>1s): The 1–3ms savings is <1% — negligible. Focus optimization elsewhere.

## Security Considerations

- **Preload script execution**: The preload script executes with PHP-FPM's startup privileges. Any code in the preload script runs at startup. Only preload trusted code.
- **opcache.preload_user**: Restricts which system user can execute the preload script. Set this to the web server user (`www-data`, `nobody`) to prevent other users from loading malicious preload scripts.
- **Preload + dynamic class generation**: If your application generates dynamic classes (e.g., Doctrine proxies, compiled templates), ensure they are included in the preload script or regenerated after deployment.
- **Preload and stale code**: Preloaded files persist until PHP-FPM restart. If a security patch changes a preloaded file, the old code remains in memory until restart. Plan for this.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Using `require` instead of `opcache_compile_file()` in preload | `require` executes the file, potentially running code with side effects. | Not knowing the difference between compilation and execution. | Preloaded code executes at startup, potentially causing errors or unwanted state. | Use `opcache_compile_file()` for compilation without execution. |
| Preloading all application files | Preloading thousands of files that change frequently. | Assuming more preloading is always better. | Long startup, high baseline memory, and frequent invalidation needed. | Preload only stable framework classes. |
| Not testing preload script before deployment | Preload script error prevents PHP-FPM from starting. | Deploying without testing the preload path. | PHP-FPM fails to start → site is down. | Run `php preload.php` manually to verify no errors. |
| Forgetting preload requires PHP-FPM restart | `opcache_reset()` does not clear preloaded files. | Confusing preloaded files with lazily-cached files. | Code changes don't take effect despite `opcache_reset()`. | Always restart PHP-FPM when preloading script changes. |
| Preloading without enough memory_consumption | Preloaded files consume OpCache memory from the same pool. | Setting memory_consumption for regular cache only. | Cache full → eviction → preload benefit lost. | Increase `memory_consumption` to accommodate preloaded files. |

## Anti-Patterns

- **Preloading in development**: Preloading adds startup time and makes it harder to test code changes. Use only in production/staging.
- **Warming via GET requests to all possible URLs**: If your app has 1000+ routes, this is slow and may create unintended side effects. Use a script that `opcache_compile_file()` for all PHP files instead.
- **Assuming preloading eliminates all compilation**: Preloading only caches the listed files. Files not in the preload script are still compiled lazily. Your warm-up strategy must handle both.
- **Preloading user data or request-specific code**: Preload framework classes and stable infrastructure, not transient business logic.

## Examples

```php
// preload.php — Laravel example
// Compile framework files without executing them
$files = [
    __DIR__ . '/vendor/laravel/framework/src/Illuminate/Foundation/Application.php',
    __DIR__ . '/vendor/laravel/framework/src/Illuminate/Container/Container.php',
    // Add all stable framework files...
];

foreach ($files as $file) {
    if (file_exists($file)) {
        opcache_compile_file($file);
    }
}
```

```ini
; php.ini — preloading configuration
opcache.preload=/var/www/html/preload.php
opcache.preload_user=www-data
```

```bash
# Cache warming script
#!/bin/bash
ENDPOINTS=(
    "https://example.com/api/health"
    "https://example.com/api/users"
    "https://example.com/"
)
for endpoint in "${ENDPOINTS[@]}"; do
    curl -s -o /dev/null -w "%{http_code}" "$endpoint"
done
echo "Cache warmed"
```

## Related Topics

- OpCache Lifecycle and Invalidation
- OpCache File Cache Secondary Storage
- Deployment Cache Invalidation Strategies
- Preloading Script Design Patterns
- OpCache Monitoring and Hit Rate Analysis

## AI Agent Notes

- Preloading is a niche optimization — it benefits fast APIs (<100ms) significantly but yields <1% improvement for apps with 1s+ response times. Always measure autoloading cost before implementing.
- The preloading + `validate_timestamps=0` + `opcache.file_cache` combination is the gold standard for containerized PHP deployments. Minimal cold-start latency, maximum throughput.
- A common failure mode: preloading too many files causes PHP-FPM to fail at startup with a memory error. Test preloading in staging with a memory limit.
- For Laravel Octane, preloading is compounded: preloaded files benefit all workers. The startup cost is paid once, but the memory savings per worker are significant.

## Verification

- [ ] Create and configure the preload script.
- [ ] Run `php preload.php` manually to verify no errors.
- [ ] Restart PHP-FPM and verify preloaded files appear in `opcache_get_status()`.
- [ ] Verify `opcache.preload_user` matches the web server user.
- [ ] Benchmark response time before and after preloading.
- [ ] Verify preload does not consume excessive OpCache memory.
- [ ] Document the preloading strategy and warm-up procedure.
