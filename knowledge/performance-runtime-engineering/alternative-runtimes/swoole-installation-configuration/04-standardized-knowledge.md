# Standardized Knowledge: Swoole Installation and Configuration

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | Swoole Installation and Configuration |
| Difficulty | Intermediate |
| Lifecycle | Implement, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Swoole is installed as a PHP extension (`ext-swoole` / `ext-openswoole`) and configured via PHP code at server start. Key parameters include `worker_num` (worker processes, typically CPU cores), `max_request` (worker recycling, 1000-5000), and `task_worker_num` (synchronous task processing). Configuration is done in the server startup script, not php.ini.

## Core Concepts

- **Installation**: `pecl install swoole` or compile from source with `--enable-swoole`. OpenSwoole is a community fork maintained separately with different version numbering.
- **worker_num**: Number of worker processes. Set to CPU cores for most workloads. `swoole_cpu_num()` returns the optimal value.
- **max_request**: Workers recycled after handling this many requests. Prevents memory drift. Set 1000-5000 depending on application memory behavior.
- **task_worker_num**: Separate worker pool for synchronous tasks (database writes, file operations). Isolates blocking I/O from coroutine event loop.

## When To Use

- Setting up a new Swoole-based application server for production
- Migrating from PHP-FPM to a coroutine-based runtime for high-latency I/O workloads
- Configuring worker pools for Laravel Octane with Swoole driver
- Tuning Swoole worker recycling to balance memory safety and performance

## When NOT To Use

- Already using RoadRunner or FrankenPHP — Swoole requires PHP extension installation and ZTS compilation
- Environments where PHP extensions cannot be installed (shared hosting, restricted CI/CD)
- Applications with blocking I/O libraries that cannot be made coroutine-safe
- Teams without experience debugging C extension issues or segfaults

## Best Practices

- **Install from PECL or official source**: Avoid distribution packages that may lag behind critical bug fixes and performance improvements.
- **Set worker_num based on workload**: `worker_num = swoole_cpu_num()` for CPU-bound workloads; 1.5-2x for I/O-bound. Avoid exceeding CPU cores × 2.
- **Configure max_request = 1000-5000**: Lower values (1000) for memory-intensive applications; higher (5000) for stable, lightweight applications.
- **Use task_worker_num = 2-4 for blocking operations**: Isolate database writes and external API calls to prevent coroutine event loop blocking.
- **Enable SWOOLE_HOOK_ALL**: Maximize non-blocking coverage. Test all third-party libraries for compatibility.

## Architecture Guidelines

- **Configuration via Code**: Swoole is configured in the PHP server script, not php.ini. Settings like `worker_num`, `max_request`, and `hook_flags` are passed to `$server->set()`.
- **OpenSwoole Differences**: The community fork uses different class namespaces (`OpenSwoole\Http\Server` instead of `Swoole\Http\Server`). API compatibility is not guaranteed.
- **io_uring Enablement**: Swoole 6.2+ auto-detects io_uring support on Linux 5.19+. No manual configuration needed, but verify kernel version in deployment scripts.
- **PHP Version Compatibility**: Check Swoole release notes for PHP version support. Swoole 6.x supports PHP 8.1-8.4.

## Performance Considerations

- Each worker process runs an independent event loop with thousands of coroutines.
- `worker_num` = CPU cores is optimal for CPU-bound; more for I/O-bound scenarios.
- Swoole 6.2 io_uring support provides 2-5x improvement for file-heavy operations.
- `max_request` recycling trades ~100ms spawn cost per worker cycle against memory leak prevention.

## Security Considerations

- Compile Swoole from trusted sources to avoid extension-level backdoors.
- OpenSwoole fork has separate security advisory channels — monitor both projects for CVE announcements.
- Task workers should not share database credentials with coroutine workers without proper isolation.
- Swoole's `$server->stats()` endpoint should be restricted to internal networks in production.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| worker_num too high (> CPU cores × 2) | Assuming more workers = more throughput | Context switching overhead degrades performance | Set worker_num = swoole_cpu_num() for CPU-bound; 1.5-2x for I/O-bound |
| Omitting max_request | Not configuring worker recycling | Memory drift causes OOM after hours of operation | Always set max_request between 1000-5000 |
| Installing via OS package manager | Convenience preference | Outdated version with known bugs or missing optimizations | Install via PECL or compile from official source |
| Mixed Swoole/OpenSwoole in same deployment | Unclear fork distinction | Fatal class conflicts at runtime | Standardize on one fork per deployment |

## Anti-Patterns

- **Installing Swoole on PHP-FPM servers**: Swoole replaces FPM's process model, not supplements it. Use Swoole workers instead of FPM.
- **Using Swoole without OpCache**: Even with persistent workers, OpCache reduces per-request compilation overhead.
- **Configuring via php.ini directives**: Swoole server settings are set via PHP code. php.ini only affects Swoole extension loading (`extension=swoole`).
- **Running Swoole in development without hot-reload**: Use Swoole's `--watch` or Laravel Octane watcher to avoid restarting the server for every code change.

## Examples

```php
// Basic Swoole server configuration
$server = new Swoole\Http\Server('0.0.0.0', 9501);
$server->set([
    'worker_num' => swoole_cpu_num(), // 8 for 8-core CPU
    'max_request' => 2000,
    'task_worker_num' => 4,
    'hook_flags' => SWOOLE_HOOK_ALL,
]);
$server->on('request', function ($req, $res) {
    $res->end('Hello World');
});
$server->start();
```

## Related Topics

- Swoole Architecture and Coroutine Model
- Swoole io_uring Integration
- Laravel Octane Driver Selection
- PHP-FPM Worker Management

## AI Agent Notes

- Swoole configuration is code-driven, not ini-driven. All server settings are in the PHP bootstrap script.
- OpenSwoole is API-incompatible with Swoole. If the user mentions OpenSwoole, use `OpenSwoole\Http\Server` namespace.
- `swoole_cpu_num()` returns the number of CPU cores. This is the recommended starting point for worker_num.
- Kernel version check (`uname -r`) should be included in deployment scripts when using io_uring features.

## Verification

- [ ] Swoole extension loaded (`php -m | grep swoole`)
- [ ] worker_num matches CPU-bound or I/O-bound workload profile
- [ ] max_request configured (1000-5000)
- [ ] task_worker_num configured if using blocking operations
- [ ] SWOOLE_HOOK_ALL enabled
- [ ] 24-hour soak test completed without memory growth
- [ ] Deployment script includes kernel version check for io_uring support
