# Standardized Knowledge: FFI Optimization Through JIT

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | FFI Optimization Through JIT |
| Difficulty | Advanced |
| Lifecycle | Evaluate, Implement |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP's Foreign Function Interface (FFI) allows calling C functions directly from PHP code. With JIT enabled, FFI call overhead is significantly reduced because the JIT compiler can inline FFI function calls and optimize the calling convention, eliminating the per-call marshaling overhead that makes FFI slow without JIT.

## Core Concepts

- **FFI without JIT**: Each FFI call requires type marshaling, argument conversion, and callback dispatch — ~200-500ns overhead per call.
- **FFI with JIT**: JIT can inline FFI functions, pre-compute argument layouts, and eliminate runtime marshaling — ~30-50ns overhead per call (4-10x reduction).
- **FFI Call Guard Elimination**: When JIT can statically determine C function signatures, it eliminates signature validation guards.
- **Use Cases**: Image processing (libpng, libjpeg), scientific computing (BLAS, LAPACK), system calls, hardware interaction.

## When To Use

- Performance-critical code paths that need native library integration
- Replacing C extensions with FFI for better maintainability
- Scientific computing, image processing, or numerical analysis in PHP
- System-level operations where FFI provides access to native APIs

## When NOT To Use

- Simple FFI calls where performance isn't critical (overhead is already low)
- FFI calls with dynamic/unknown function signatures (JIT can't optimize)
- Libraries that already have PHP extensions (extensions are faster than FFI + JIT)
- Security-sensitive FFI (unsafe by nature — minimize usage)

## Best Practices

- **Enable JIT for FFI-heavy code**: Without JIT, FFI performance is acceptable for occasional calls but prohibitive for hot loops. JIT transforms FFI into a viable option.
- **Minimize FFI calls in hot paths**: Even with JIT, each FFI call has overhead. Batch operations where possible to reduce call count.
- **Use typed FFI declarations**: Full type declarations enable JIT guard elimination. Incomplete type information forces marshaling overhead.
- **Combine with preloading**: Preload FFI C headers at startup to avoid runtime parsing overhead. Use FFI::load() in preload scripts.
- **Profile FFI + JIT performance**: Benchmark FFI operations with and without JIT to quantify the benefit for your specific use case.

## Architecture Guidelines

- **Performance Spectrum**: Native C extension (fastest) > FFI + JIT (3-5x slower than C) > FFI without JIT (10-20x slower than C) > Pure PHP (50-100x slower than C for compute-heavy operations).
- **FFI Safety**: FFI is inherently unsafe — memory corruption in C code can crash PHP. Use FFI sparingly and wrap in defensive PHP code.
- **JIT Inlining**: When JIT inlines an FFI call, it eliminates the call overhead entirely. The C function body executes directly, with argument passing handled by native register conventions.
- **Marshaling Cost Breakdown**: Type validation (40%), argument conversion (30%), call dispatch (20%), cleanup (10%). JIT eliminates type validation and argument conversion in optimized paths.

## Performance Considerations

- JIT + FFI enables PHP for performance-sensitive tasks previously requiring C extensions
- FFI + JIT is ~3-5x slower than native C but 10-50x faster than pure PHP for compute-heavy operations
- PHP 8.4 FFI improvements with JIT: reduced cache misses from better code locality
- Each FFI call without JIT: ~200-500ns overhead. With JIT: ~30-50ns overhead

## Security Considerations

- FFI bypasses PHP's memory safety guarantees. Memory corruption in C code can lead to arbitrary code execution.
- Only use FFI with trusted, well-tested C libraries. Never pass unsanitized user input to FFI calls.
- FFI functions run with PHP process privileges. Isolate FFI-heavy code in separate workers if possible.
- PHP 8.4+ improved FFI security with better argument validation. Keep PHP updated.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using FFI without JIT in hot paths | Not understanding overhead | 4-10x slowdown vs expected performance | Enable JIT for FFI-heavy workloads |
| Incomplete FFI type declarations | Convenience | JIT cannot eliminate guards, marshaling overhead remains | Always provide full type declarations |
| FFI for simple operations | Over-engineering | More complex than needed | Use PHP native functions or install extension |
| Not preloading FFI headers | Performance oversight | Runtime parsing overhead on every request | Preload FFI headers in opcache.preload |

## Anti-Patterns

- **FFI in security-critical code**: FFI bypasses PHP's safety mechanisms. Avoid for authentication, encryption, or input processing.
- **Replacing working C extensions with FFI**: C extensions are faster and better integrated. Only use FFI when no extension exists.
- **FFI inside tight loops without JIT**: Each call pays marshaling overhead. Use JIT or batch operations.

## Examples

```php
<?php
// FFI without JIT — ~200-500ns per call
$ffi = FFI::cdef('int printf(const char *format, ...);');
$ffi->printf("Hello %s\n", "world");

// FFI with JIT enabled — ~30-50ns per call
// opcache.jit=1254 handles this automatically
```

## Related Topics

- JIT Configuration for Production
- Type Inference and Guard Elimination
- JIT Workload Benefit Assessment
- Preloading Configuration

## AI Agent Notes

- JIT reduces FFI call overhead by 4-10x (from 200-500ns to 30-50ns).
- Without JIT, FFI is slow for hot paths. With JIT, it's viable for performance-critical code.
- Full type declarations enable JIT guard elimination for FFI calls.
- FFI + JIT is ~3-5x slower than native C but 10-50x faster than pure PHP.
- Preload FFI headers and enable JIT for maximum FFI performance.

## Verification

- [ ] JIT enabled for FFI-heavy workloads
- [ ] FFI type declarations complete (no incomplete signatures)
- [ ] FFI headers preloaded via opcache.preload
- [ ] FFI + JIT benchmarked against pure PHP and C extension alternatives
- [ ] FFI usage minimized to necessary call sites
- [ ] Security review completed for FFI code paths
