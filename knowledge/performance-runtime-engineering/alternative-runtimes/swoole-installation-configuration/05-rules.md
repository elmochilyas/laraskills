## Install Swoole from PECL or official source, never from OS distribution packages
---
Category: Reliability
---
Install the Swoole extension via `pecl install swoole` or compile from the official GitHub source — avoid distribution packages from apt, yum, or other OS package managers.
---
Reason: OS distribution packages lag behind Swoole releases by months, missing critical bug fixes, performance improvements, and security patches. Swoole is actively developed with frequent releases that address coroutine edge cases, io_uring improvements, and PHP version compatibility. An outdated Swoole version can cause segfaults, memory corruption, or missing features that are indistinguishable from application bugs.
---
Bad Example:
```bash
# OS package — potentially months out of date
apt install php-swoole  # Version may be 9 months behind upstream
```

Good Example:
```bash
# PECL install — current version
pecl install swoole
```
---
Exceptions: When strict security compliance requires OS-vetted packages, use the official Swoole PPA or compile from a verified source tag.
---
Consequences Of Violation: Missing security patches, unresolved bugs, segfaults from outdated coroutine handling, wasted debugging time on already-fixed issues.

## Always set max_request between 1000-5000 for production Swoole deployments
---
Category: Reliability
---
Configure max_request in every production Swoole server with a value between 1000-5000, adjusted based on the application's memory growth characteristics.
---
Reason: Swoole workers persist across thousands of coroutine executions. Without max_request, Zend Memory Manager fragmentation grows worker RSS monotonically until OOM. The 1000-5000 range balances memory safety against spawn overhead — lower values (1000) for memory-intensive applications, higher values (5000) for stable, lightweight applications. The spawn overhead (~100ms) is negligible compared to the OOM risk it prevents.
---
Bad Example:
```php
// No worker recycling — unbounded memory growth
$server->set([
    'worker_num' => swoole_cpu_num(),
    // max_request not configured
]);
```

Good Example:
```php
// Worker recycling configured
$server->set([
    'worker_num' => swoole_cpu_num(),
    'max_request' => 2000,  // Recycle after 2000 coroutine executions
]);
```
---
Exceptions: Environments where worker lifetime is bounded by container auto-scaling (workers live <1 hour) may use higher values (5000+) or rely on instance lifecycle.
---
Consequences Of Violation: Monotonic RSS growth, worker memory exhaustion, OOM kills after hours of operation, gradual throughput degradation before crash.

## Set worker_num based on workload type and CPU count, never exceed CPU cores × 2
---
Category: Performance
---
Configure worker_num to swoole_cpu_num() for CPU-bound workloads and 1.5-2x swoole_cpu_num() for I/O-bound workloads — never exceed 2x CPU cores.
---
Reason: Each Swoole worker runs an independent event loop with thousands of coroutines. Beyond the optimal count, context switching overhead between worker OS processes degrades throughput. Swoole's coroutines already handle I/O concurrency within each worker, so additional workers add process contention without proportional throughput gain. Exceeding 2x CPU cores guarantees diminishing returns.
---
Bad Example:
```php
// Over-provisioned — context switching overhead dominates
$server->set([
    'worker_num' => 32,  // 8-core CPU — 4x over-provisioned
]);
```

Good Example:
```php
// Correctly provisioned for CPU-bound workload
$server->set([
    'worker_num' => swoole_cpu_num(),  // 8 for 8-core CPU
]);
```
---
Exceptions: Containers with CPU limits below the physical core count should use the effective CPU limit, not swoole_cpu_num().
---
Consequences Of Violation: Context switching overhead degrades throughput, increased latency variance, wasted memory from excess worker processes.

## Never mix Swoole and OpenSwoole in the same deployment
---
Category: Configuration
---
Standardize on either Swoole or OpenSwoole per deployment — never install both or assume API compatibility between them.
---
Reason: Swoole and OpenSwoole are separate projects with different class namespaces (`Swoole\Http\Server` vs `OpenSwoole\Http\Server`), different version numbering, and potentially diverging APIs. Mixing them causes fatal class conflicts at runtime. A project that starts with Swoole and switches to OpenSwoole must update all references across the entire codebase.
---
Bad Example:
```json
// Both installed — class conflicts at runtime
{
  "require": {
    "ext-swoole": "*",
    "ext-openswoole": "*"  // Fatal conflict
  }
}
```

Good Example:
```json
// One runtime per deployment
{
  "require": {
    "ext-swoole": "*"
  }
}
```
---
Exceptions: When migrating from one fork to the other, the migration branch must completely remove the old fork before adding the new one.
---
Consequences Of Violation: Fatal class conflicts at server startup, unable to resolve without codebase changes, deployment rollback required.

## Configure Swoole server settings via PHP code, not php.ini
---
Category: Configuration
---
Set all Swoole server parameters (worker_num, max_request, hook_flags) in the PHP server bootstrap script via $server->set(), not through php.ini directives.
---
Reason: Swoole configuration is code-driven. php.ini only controls the extension loading (`extension=swoole`) and basic settings. Server parameters passed to `$server->set()` are evaluated at server start and cannot be changed dynamically. Configuring in code ensures version-controlled, environment-specific settings that are part of the deployment artifact.
---
Bad Example:
```ini
; Attempting to configure Swoole via php.ini — ineffective
swoole.worker_num = 8  ; Not a valid php.ini directive
```

Good Example:
```php
// Configured in PHP bootstrap script
$server->set([
    'worker_num' => swoole_cpu_num(),
    'max_request' => 2000,
    'hook_flags' => SWOOLE_HOOK_ALL,
]);
```
---
Exceptions: `extension=swoole` in php.ini is the correct way to load the extension; only server parameters must be set in code.
---
Consequences Of Violation: Server settings silently ignored, Swoole uses defaults instead of intended configuration, unexpected behavior in production.
