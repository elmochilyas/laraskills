# Standardized Knowledge: Synchronous vs Asynchronous I/O

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Synchronous vs Asynchronous I/O |
| Difficulty | Foundation |
| Lifecycle | Understand, Architect |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP traditionally uses **synchronous (blocking) I/O** — when a database query or HTTP request is made, the PHP process sleeps until the operation completes. Asynchronous I/O (non-blocking with event notification) allows a single process to interleave multiple operations, dramatically improving throughput during I/O wait. This distinction determines the effectiveness of threading, coroutines, and alternative runtimes.

## Core Concepts

- **Synchronous I/O**: Process issues call -> kernel suspends process -> I/O completes -> process resumes. Simple but wastes CPU cycles during wait.
- **Asynchronous I/O**: Process issues call -> kernel returns immediately -> process polls or uses event notification (epoll/kqueue/io_uring) for completion. Complex but maximizes CPU utilization during I/O.
- **PHP-FPM is synchronous**: Each worker blocks during I/O. More workers needed to maintain throughput during slow I/O.
- **Swoole coroutines auto-hook**: Synchronous PHP functions (PDO, MySQLi, Redis, cURL) become non-blocking transparently via coroutine scheduling.
- **io_uring** (Swoole 6.2+): Linux kernel interface for true async I/O with submission/completion queues, reducing syscall overhead.

## When To Use

- Synchronous: Simple applications, low-concurrency environments, teams without async expertise.
- Asynchronous: High-concurrency applications, database-heavy APIs, HTTP gateway services, file processing.
- Coroutine-based async (Swoole): When I/O wait time is significant (>10ms per operation).
- io_uring: Linux 5.19+ kernels, maximum I/O throughput requirements.

## When NOT To Use

- Async for CPU-bound workloads (no I/O to wait on)
- Async with sub-1ms I/O operations (coroutine overhead exceeds benefit)
- Sync for high-concurrency I/O-heavy workloads (worker pool exhaustion)
- io_uring on kernels < 5.19 (not supported)

## Best Practices (WHY)

- **Match concurrency model to I/O profile**: Async benefit is proportional to I/O wait time. Measure I/O wait before adopting async.
- **Profile before committing**: With sub-1ms database queries, async overhead (coroutine scheduling, event loop) can make Swoole 10% slower than FPM.
- **Use io_uring for maximum throughput**: With 50ms+ database queries, async yields 2-5x throughput improvements over synchronous FPM.
- **Understand auto-hooking**: Swoole automatically hooks PDO, MySQLi, Redis, and cURL — most PHP code runs without modification.

## Architecture Guidelines

- **Synchronous (FPM)**: Simple, blocking. Each worker handles one request at a time. More workers needed for I/O wait.
- **Asynchronous (Swoole)**: Non-blocking within coroutines. Single worker handles many concurrent requests during I/O wait.
- **io_uring**: Kernel-level async I/O with submission queue (SQ) and completion queue (CQ). Reduces syscall overhead by batching.

## Performance

- Async I/O benefit is proportional to I/O wait time
- With sub-1ms database queries: async overhead can make Swoole 10% slower than FPM
- With 50ms+ database queries: async yields 2-5x throughput improvements
- io_uring reduces syscall overhead by batching I/O operations
- Coroutine scheduling: ~10-100ns per switch vs process context switch at ~1-5us

## Security

- Asynchronous I/O introduces complexity in error handling — uncaught exceptions in coroutines may be silent
- Connection pooling in async runtimes requires careful handling of authentication context
- io_uring operates at kernel level — verify kernel version compatibility
- Coroutine state can persist unexpectedly if not properly managed

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using async for CPU-bound work | Assuming async always helps | No benefit, added complexity | Profile first; async helps I/O only |
| Expecting async gains with fast queries | Not understanding I/O profile | Swoole 10% slower than FPM | Only use async when I/O wait is significant |
| Blocking in coroutines | Calling sync functions in Swoole | Coroutine blocking defeats async purpose | Ensure all I/O is auto-hooked or wrapped |
| Ignoring io_uring compatibility | Assuming modern kernel | Crash on kernels < 5.19 | Check kernel version before enabling |

## Anti-Patterns

- **Using synchronous I/O everywhere**: For high-concurrency I/O-heavy workloads, synchronous FPM wastes resources. Use async runtimes for these workloads.
- **Assuming async is always faster**: Async has overhead (event loop, coroutine scheduling). It only pays off when I/O wait exceeds this overhead.
- **Blocking in async context**: Calling sleep(), file_get_contents() (without stream wrappers), or other blocking operations inside a coroutine defeats the purpose.

## Examples

```php
<?php
// Synchronous (PHP-FPM) — blocks until complete
$users = DB::table('users')->where('status', 'active')->get();
// Process blocks here waiting for database

// Asynchronous (Swoole) — non-blocking via coroutines
Co\run(function () {
    $users = DB::table('users')->where('status', 'active')->get();
    // Coroutine yields during database wait; other coroutines run
});

// io_uring with Swoole 6.2+ — kernel-level async I/O
// Transparent to PHP code; configured at the Swoole level
```

## Related Topics

- Concurrency Models
- Swoole Architecture and Coroutine Model
- Sync vs Async PHP Runtimes
- Programming Concepts

## AI Agent Notes

- Synchronous I/O blocks the process — PHP-FPM needs more workers to handle I/O wait.
- Asynchronous I/O allows a single process to handle many concurrent I/O operations.
- Async benefit is proportional to I/O wait time. Measure before adopting.
- Swoole auto-hooks PDO, MySQLi, Redis, cURL — most code runs without modification.
- io_uring (Linux 5.19+) provides kernel-level async I/O with reduced syscall overhead.

## Verification

- [ ] I/O profile measured (average wait time per database/HTTP call)
- [ ] Concurrency model matched to I/O profile
- [ ] If using async: all I/O operations are non-blocking or auto-hooked
- [ ] Kernel version checked for io_uring compatibility (if applicable)
- [ ] Benchmark confirms async benefit before production deployment
- [ ] Error handling verified for async context
