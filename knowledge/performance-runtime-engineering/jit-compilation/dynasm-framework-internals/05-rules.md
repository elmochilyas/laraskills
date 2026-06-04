## Monitor guard failure rates — never ignore them
---
Category: Performance
---
Always check opcache_get_status()['jit'] for guard failure counts. High guard failure rates neutralize JIT benefit.
---
Reason: Each guard failure costs 1-5µs and prevents future JIT compilation of that code path. Cascade failures can negate JIT benefit for entire functions. Fix type declarations to reduce guard failures.
---
Bad Example:
```php
// No monitoring — guard failures go unnoticed
$jit = opcache_get_status(false)['jit'];
// Unknown guard failure count
```

Good Example:
```php
$jit = opcache_get_status(false)['jit'];
if ($jit['guard_failures'] > 1000) {
    // Investigate and fix type declarations
    // Common causes: mixed types, untyped properties, no return types
}
```
---
Exceptions: Applications where JIT benefit is already known to be minimal (I/O-bound).
---
Consequences Of Violation: JIT compiles code that always bails to interpreter, wasting buffer space and CPU on compilation.

## Never use JIT debug output in production
---
Category: Configuration
---
Restrict opcache.jit_debug=1 to development and staging environments only.
---
Reason: JIT debug output logs every compilation decision, creating significant performance overhead and log volume. It is useful for understanding JIT behavior but prohibitive in production.
---
Bad Example:
```ini
; Debug output in production
opcache.jit_debug=1
```

Good Example:
```ini
; Debug output only in development
; opcache.jit_debug=1
; Development: php -d opcache.jit_debug=1 script.php
```
---
Exceptions: Short-term debugging sessions on staging environments with no production traffic.
---
Consequences Of Violation: Performance overhead from debug logging, log volume explosion.
