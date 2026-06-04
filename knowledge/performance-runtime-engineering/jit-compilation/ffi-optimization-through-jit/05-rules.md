## Enable JIT for all FFI-heavy code paths
---
Category: Performance
---
Always enable JIT when using FFI in performance-critical code. Without JIT, FFI overhead is prohibitive for hot paths.
---
Reason: JIT reduces FFI call overhead from 200-500ns to 30-50ns per call (4-10x reduction). Without JIT, FFI in hot loops creates significant performance penalties.
---
Bad Example:
```php
// FFI without JIT in a hot loop — 200-500ns per call
for ($i = 0; $i < 10000; $i++) {
    $ffi->process($data[$i]); // 500ns overhead each call
}
```

Good Example:
```php
// JIT enabled (opcache.jit=1254)
for ($i = 0; $i < 10000; $i++) {
    $ffi->process($data[$i]); // 30-50ns overhead with JIT inlining
}
```
---
Exceptions: Occasional FFI calls outside hot paths where overhead is negligible.
---
Consequences Of Violation: 4-10x slower FFI than possible, incorrect conclusion that "FFI is too slow."

## Preload FFI headers for maximum performance
---
Category: Performance
---
Always preload FFI C headers using FFI::load() in the OpCache preload script to avoid runtime parsing overhead.
---
Reason: Parsing C header files at runtime adds overhead on every request with FFI calls. Preloading eliminates this by compiling headers once at startup.
---
Bad Example:
```php
// Runtime header parsing — overhead on every request
public function process() {
    $ffi = FFI::cdef('int process_data(void *data, size_t len);');
    $ffi->process(...);
}
```

Good Example:
```php
// In preload.php
FFI::load(__DIR__ . '/ffi/process.h');

// In application code — header already parsed
$ffi->process(...);
```
---
Exceptions: Dynamically generated FFI signatures that cannot be known at preload time.
---
Consequences Of Violation: Runtime header parsing overhead, slower cold-start latency for FFI endpoints.

## Never use FFI in security-critical code paths
---
Category: Security
---
Avoid FFI in authentication, encryption, input validation, or any security-sensitive operation.
---
Reason: FFI bypasses PHP's memory safety guarantees. Memory corruption in C code can lead to arbitrary code execution. Only use FFI with trusted, well-tested C libraries.
---
Bad Example:
```php
// FFI for authentication — memory safety risk
$ffi->authenticate($username, $password);
```

Good Example:
```php
// PHP-native for security-critical operations
Hash::check($password, $hash); // Safe, well-tested PHP code
```
---
Exceptions: None. Security-critical code should never use FFI.
---
Consequences Of Violation: Memory corruption vulnerabilities, arbitrary code execution risk.
