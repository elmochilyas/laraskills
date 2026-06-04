## Set OPcache Memory to 128MB Minimum
---
## Performance
---
Always set `opcache.memory_consumption` to at least 128MB for Laravel production; never accept the PHP default of 64MB.
---
Laravel framework + vendor + app code requires 80-120MB of compiled script cache; 64MB forces evictions and recompilation, wasting 10-30% CPU on repeated parsing.
---
memory_consumption=128, max_accelerated_files=10000, validate_timestamps=0.
---
Leaving opcache.memory_consumption at the PHP default of 64MB.
---
Extremely small Laravel apps with fewer than 50 PHP files total; 128MB is harmless regardless.
---
10-30% CPU waste from OPcache evictions, unnecessary server scaling cost.
---
## Set max_accelerated_files to 10000
---
## Performance
---
Always set `opcache.max_accelerated_files` to at least 10000 for Laravel; never use the default of 2000 or 4000.
---
Laravel projects have 2000-8000 PHP files across vendor + app + config; exceeding the limit silently bypasses OPcache for uncached files, causing recompilation on every request.
---
opcache.max_accelerated_files = 10000 in php.ini.
---
Default max_accelerated_files = 2000 with a Laravel project containing 5000 PHP files.
---
Minimal Laravel apps with <1500 PHP files; verify with `opcache_get_status()`.
---
PHP files silently recompiled on every request, negating OPcache benefit, 50%+ CPU waste.
---
## Disable validate_timestamps in Production
---
## Performance
---
Always set `opcache.validate_timestamps = 0` in production environments; never leave it enabled.
---
File modification time checking on every request adds a stat() syscall per PHP file, wasting CPU; in production, files only change on deploy, which should explicitly clear the cache.
---
Production: validate_timestamps=0. Deploy script: runs opcache_reset().
---
Production: validate_timestamps=1, revalidate_freq=2, stat() on every PHP file per request.
---
Development environments where files change frequently without server restart.
---
Wasted CPU on stat() syscalls per PHP file per request, unnecessary performance penalty.
---
## Enable JIT for CPU-Bound Workloads
---
## Performance
---
Enable `opcache.jit = tracing` with `jit_buffer_size = 100M` when the Laravel app has CPU-bound code paths (PDF generation, image processing, complex calculations).
---
JIT compiles hot PHP functions to machine code, providing 20-30% CPU improvement for CPU-bound loops and numeric operations; wasted for I/O-bound apps.
---
opcache.jit=tracing, opcache.jit_buffer_size=100M.
---
Enabling JIT on an I/O-bound API that spends 90% of time waiting for database queries.
---
I/O-bound Laravel apps where database/cache/HTTP wait dominates execution time.
---
Wasted memory for JIT buffer with no measurable performance improvement.
---
## Enable OPcache for CLI Workers
---
## Performance
---
Always set `opcache.enable_cli = 1` in PHP CLI configuration for queue workers and scheduled task runners.
---
Queue workers boot the Laravel framework once and handle many jobs; OPcache reduces initial boot overhead and JIT compilation persists across jobs.
---
opcache.enable_cli = 1 in php-cli.ini.
---
Running queue workers with CLI OPcache disabled, recompiling on every worker start.
---
Short-lived one-off CLI commands like `php artisan tinker`.
---
Slower worker boot times, higher CPU usage for queue processing.
---
## Clear OPcache on Deploy
---
## Reliability
---
Always include `opcache_reset()` or equivalent in deployment scripts to clear the compiled script cache.
---
Without clearing, the server serves stale compiled code from memory even after PHP files are updated; changes don't take effect until cache expires or FPM restarts.
---
Deploy script: `php -r 'opcache_reset();'` or use `artisan opcache:clear` package.
---
Deploying new PHP files without clearing OPcache, expecting changes to apply immediately.
---
Blue-green deployments where new instances boot with fresh cache.
---
Stale code served in production, deployment rollback confusion, debugging time wasted.
