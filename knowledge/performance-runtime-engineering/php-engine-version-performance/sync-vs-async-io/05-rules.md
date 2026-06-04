## Match concurrency model to I/O profile before adopting async
---
Category: Performance
---
Always profile your I/O wait time before adopting async runtimes. Async benefit is proportional to I/O wait, not automatic.
---
Reason: With sub-1ms database queries, async overhead (coroutine scheduling, event loop) can make Swoole 10% slower than FPM. With 50ms+ queries, async yields 2-5x throughput. Measure before committing.
---
Bad Example:
```php
// Adopting Swoole without measuring I/O profile
// Sub-ms queries become slower due to coroutine overhead
```

Good Example:
```php
// Profile I/O wait first
$start = microtime(true);
DB::table('users')->get();
$ioWait = (microtime(true) - $start) * 1000; // ms
// Only adopt async if ioWait > 10ms
```
---
Exceptions: Greenfield projects where the I/O profile is well-understood from similar applications.
---
Consequences Of Violation: 10% slower performance with async than synchronous FPM, added complexity without benefit.

## Never use async runtimes for CPU-bound workloads
---
Category: Architecture
---
Avoid asynchronous runtimes when the workload is CPU-bound with minimal I/O wait. Async provides no benefit for pure computation.
---
Reason: Async runtimes optimize concurrent I/O wait, not CPU execution. CPU-bound workloads see no throughput gain but incur coroutine scheduling overhead and architectural complexity.
---
Bad Example:
```php
// Async runtime for image processing — no I/O to overlap
$image = Image::make($path)->resize(800, 600)->encode('jpg');
// 100% CPU, no I/O wait — no async benefit
```

Good Example:
```php
// Sync runtime for CPU-bound work
$image = Image::make($path)->resize(800, 600)->encode('jpg');
// FPM handles this efficiently
```
---
Exceptions: CPU-bound tasks that also involve I/O (reading/writing files) may benefit marginally.
---
Consequences Of Violation: Added complexity, coroutine overhead, zero throughput improvement.

## Never call blocking functions inside coroutines
---
Category: Performance
---
Avoid synchronous I/O functions inside async coroutine contexts. Blocking calls defeat the purpose of async concurrency.
---
Reason: Calling sleep(), file_get_contents() (without stream wrappers), or other blocking operations inside a coroutine blocks the entire event loop, freezing all other coroutines.
---
Bad Example:
```php
Co\run(function () {
    sleep(2); // Blocks the entire event loop!
    $data = file_get_contents('https://api.example.com'); // Sync HTTP
});
```

Good Example:
```php
Co\run(function () {
    Co::sleep(2); // Non-blocking, yields coroutine
    $data = Swoole\Coroutine\Http\Client::get('https://api.example.com');
});
```
---
Exceptions: CPU-bound operations (non-I/O blocking) are acceptable inside coroutines.
---
Consequences Of Violation: Event loop blockage, all concurrent requests delayed, zero async benefit.

## Verify io_uring kernel compatibility before enabling
---
Category: Reliability
---
Always check kernel version before enabling io_uring on Swoole 6.2+. Minimum required: Linux 5.19.
---
Reason: io_uring is a Linux kernel interface. On kernels below 5.19, io_uring operations may fail or cause crashes. Always verify compatibility at deployment time.
---
Bad Example:
```php
// Enabling io_uring on an older kernel without checking
// Swoole 6.2+ io_uring enabled
// Kernel 5.10 — crashes or silent failures
```

Good Example:
```php
$kernel = php_uname('r');
if (version_compare($kernel, '5.19', '>=')) {
    // Enable io_uring
} else {
    // Fall back to standard event loop
}
```
---
Exceptions: Non-Linux platforms (macOS, Windows) cannot use io_uring at all.
---
Consequences Of Violation: Application crashes, silent I/O failures, data corruption in production.

## Prefer auto-hooked runtimes when migrating synchronous code to async
---
Category: Maintainability
---
Use runtimes that auto-hook PDO, MySQLi, Redis, and cURL (like Swoole) when migrating existing synchronous code to async.
---
Reason: Auto-hooking transforms blocking calls into non-blocking coroutine-aware calls transparently. Most PHP code runs without modification, reducing migration risk and development time.
---
Bad Example:
```php
// Manual async wrapping — error-prone and tedious
$result = await(async_function('DB::query', $sql));
```

Good Example:
```php
// Swoole auto-hooks PDO — no code changes needed
$users = DB::table('users')->get(); // Transparently non-blocking
```
---
Exceptions: Custom stream wrappers, non-hooked extensions, and raw socket operations require manual wrapping.
---
Consequences Of Violation: Increased migration complexity, missed async opportunities, higher bug rate.
