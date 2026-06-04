# Skill: Identify and Mitigate Reference Counting Bottlenecks

## Purpose

Diagnose when refcount operations are a measurable CPU cost and apply targeted optimizations (immutability, data structure changes, inlining) to reduce refcount churn in hot paths.

## When To Use

- Profiling shows `zend_refcount_*` functions consuming > 2% CPU
- Hot loops iterating > 10,000 times with complex data transformations
- Serialization-heavy workloads (JSON encode/decode of large datasets)
- Array pipeline operations with multiple mapping/filtering steps

## When NOT To Use

- Typical CRUD requests with < 1000 allocations
- Code paths where profiler does not show refcount operations
- Performance optimization passes for routers, middleware, or other single-execution code

## Prerequisites

- Sampling profiler output (Xdebug, Blackfire, Tideways, or Xenon)
- Understanding of PHP memory model (zval structure, refcount lifecycle)
- PHP 8.1+ for readonly class support

## Inputs

- Flame graph showing memory-related functions
- Loop iteration counts and data sizes
- Current data structure usage (arrays, objects, SplFixedArray)
- Call frequency for hot-path functions

## Workflow (numbered steps)

1. Profile the application with representative traffic. Identify functions where `zend_refcount_inc` or `zend_refcount_del` appear in the flame graph.
2. Examine the surrounding code: is this in a hot loop, data transformation pipeline, or serialization path?
3. Calculate the refcount impact: multiply iterations × refcount ops per iteration × 5ns. If the total is < 1ms per request, move on — the bottleneck is elsewhere.
4. For hot-path DTOs: convert to `readonly class` with typed public properties. This eliminates write barriers entirely.
5. For array-heavy transformations: switch to SplFixedArray for fixed-size collections. Use in-place modification (`&$var`) instead of creating new arrays.
6. For serialization: use `serialize()` / `json_encode()` on single large structures rather than multiple small ones — reduces per-element refcount overhead.
7. For function call overhead: inline hot-loop logic or use a generator pipeline that processes one item at a time.
8. Benchmark before/after each change. Use micro-benchmarking (`hrtime()`) on the specific hot path to measure refcount reduction.
9. Document the refcount optimization decisions (what was changed, why, and the measured impact) for future maintainers.

## Validation Checklist

- [ ] Profiler confirmed refcount operations as a measurable cost (> 2% CPU)
- [ ] Hot DTOs converted to `readonly class` where applicable
- [ ] Fixed-size numeric collections use SplFixedArray
- [ ] Hot-loop function calls inlined or minimized
- [ ] Before/after benchmarks show measurable improvement
- [ ] Readability and maintainability trade-offs documented

## Common Failures

- **Optimizing the cold path**: Applying refcount optimizations to code called once per request. The 0.1ms saved is invisible to the user but adds technical debt.
- **By-ref overuse**: Passing everything by reference to "save refcount ops." This introduces mutation bugs that are hard to trace.
- **SplFixedArray for dynamic data**: Using SplFixedArray where the size is unknown or changes frequently. `setSize()` reallocates the entire array — slower than plain array resizing.
- **Not re-profiling**: Applying an optimization and declaring success without measuring. The refcount bottleneck may have shifted, not disappeared.

## Decision Points

- Refcount cost < 2% of CPU → No action — the cost is acceptable
- Refcount cost 2-5% of CPU → Apply readonly properties; switch hot-path collections to SplFixedArray
- Refcount cost > 5% of CPU → Full optimization effort: readonly classes, SplFixedArray, inlining, pass-by-reference where safe
- Readonly property applied → Verify write barrier eliminated via flame graph comparison
- SplFixedArray applied → Verify no array-specific functions needed that would force conversion back

## Performance Considerations

- Readonly property write barrier removal: ~2ns saved per write. For a DTO with 10 properties accessed in a 10k loop, that is 200µs.
- SplFixedArray refcount savings: scales with array size. For a 100k-element array, ~30-50% memory reduction and proportional refcount reduction.
- Inlining hot functions: eliminates ~10ns per call/return pair. For 100k iterations, that is 1ms — notable only if the function body does trivial work.
- Pass-by-reference on arrays: eliminates O(n) copy-on-write separation when the array is large and modified. The savings grow with array size.

## Security Considerations

- By-ref parameter mutation can cause cross-request state leaks in Octane if shared state is inadvertently modified. Document the mutability contract clearly.
- Readonly properties prevent mutation, which is also a security property — data cannot be tampered with after object creation.
- SplFixedArray does not benefit from PHP's array operator overloading. Code must handle edge cases like out-of-bounds access explicitly.

## Related Rules (from 05-rules.md)

- Profile refcount overhead before optimizing
- Use readonly typed properties to eliminate write barriers
- Prefer SplFixedArray over plain arrays for fixed-size indexed collections
- Minimize function calls in hot loops to reduce refcount churn

## Related Skills

- PHP Memory Model Optimization
- Copy-on-Write Mechanics
- Array Memory Overhead
- Zval Structure Reference Counting

## Success Criteria

- Refcount operations reduced below 1% of CPU on optimized hot paths
- Readonly class conversion applied to all hot-path DTOs
- SplFixedArray used for all fixed-size numeric collections
- Before/after benchmarks document improvement
