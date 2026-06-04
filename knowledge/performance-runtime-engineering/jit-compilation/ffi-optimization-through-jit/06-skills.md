# Skill: Optimize FFI Calls Through JIT Compilation

## Purpose

Maximize PHP FFI (Foreign Function Interface) performance by ensuring JIT is enabled and configured to compile FFI call-heavy code paths.

## When To Use

- Using FFI to call C libraries from PHP
- Performance of FFI calls is a bottleneck in the application
- Running CPU-bound operations via FFI that would benefit from reduced call overhead

## When NOT To Use

- When FFI is not used in the application
- For I/O-bound code where FFI call overhead is negligible compared to I/O wait
- When JIT is not enabled (FFI calls benefit from JIT but do not require it)

## Prerequisites

- FFI extension enabled (`extension=ffi` in php.ini)
- JIT enabled with tracing mode (opcache.jit=1254) or higher
- Understanding of FFI calling conventions and data marshaling costs

## Inputs

- FFI function call frequency in hot paths
- Data types being marshaled between PHP and C
- Current JIT configuration and benchmark baseline

## Workflow (numbered steps)

1. Profile the FFI-heavy code path to measure total time spent in FFI calls vs PHP execution
2. Disable JIT (opcache.jit=0) and run a benchmark of the FFI-heavy path to establish baseline
3. Enable tracing JIT (opcache.jit=1254) and re-run the same benchmark
4. If FFI call overhead drops >10%, JIT is effectively inlining or optimizing the FFI call sequence
5. For maximum FFI optimization, enable function JIT (opcache.jit=1205) if FFI calls are made from many functions
6. Monitor JIT buffer utilization — FFI-heavy code may require larger buffer due to compiled C bindings
7. If buffer free space <20%, increase jit_buffer_size by 50%
8. Document the JIT configuration that provides the best FFI call performance

## Validation Checklist

- [ ] FFI call overhead measured as percentage of hot-path wall time
- [ ] Baseline benchmark with JIT disabled completed
- [ ] Benchmark with tracing JIT (1254) completed
- [ ] Benchmark with function JIT (1205) completed if applicable
- [ ] JIT buffer utilization monitored after configuration
- [ ] Optimal JIT mode for FFI workload selected and documented

## Common Failures

- **Assuming JIT always improves FFI**: JIT optimizes the PHP code surrounding FFI calls, not the C function execution itself
- **Ignoring data marshaling cost**: The PHP<->C data conversion can dominate FFI overhead regardless of JIT
- **Over-allocating JIT buffer for few FFI calls**: Only increase buffer if monitoring shows >80% utilization

## Decision Points

- If FFI calls are in tight loops (1000+ calls per request): JIT provides significant benefit through call overhead reduction
- If FFI calls are infrequent (<10 per request): JIT benefit is negligible — focus on reducing per-call marshaling overhead
- If FFI calls marshal complex data structures: optimize the marshaling layer first before JIT tuning

## Performance Considerations

- JIT reduces FFI call overhead by inlining the call sequence and eliminating interpreter dispatch
- Each FFI call without JIT involves: opcode dispatch, function resolution, marshaling setup, C function call, return value marshaling
- With JIT: the call sequence is compiled into tight native assembly, eliminating opcode dispatch overhead
- Actual speedup depends on FFI call frequency and the complexity of surrounding PHP code

## Security Considerations

- FFI allows PHP to call arbitrary C functions — only use FFI with trusted libraries
- JIT configuration does not change FFI's security model
- Compiled C libraries accessed via FFI should be kept up to date with security patches

## Related Rules (from 05-rules.md)

- Enable JIT Universally, Then Benchmark
- Monitor JIT Buffer Utilization
- Use Tracing JIT (1254) as Default

## Related Skills

- JIT Configuration for Production
- Bytecode vs Native Code Assessment
- Type Inference and Guard Elimination

## Success Criteria

- FFI call overhead measured and documented
- JIT configuration optimized for FFI-heavy workload
- Before/after benchmark shows improvement in FFI call performance
- JIT buffer utilization within acceptable range (<80%)
