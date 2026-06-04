# Standardized Knowledge: JIT Configuration for Production

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Configuration for Production |
| Difficulty | Intermediate |
| Lifecycle | Configure, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Production JIT configuration requires balancing compilation overhead against execution gains. The recommended starting point is opcache.jit=1254 with jit_buffer_size=128M. For CPU-bound workloads, increase to 1255 or 1235 with 256M buffer. For I/O-bound workloads, JIT provides minimal benefit but can remain enabled without harm.

## Core Concepts

- **php.ini Directives**: opcache.jit, opcache.jit_buffer_size, opcache.jit_debug, opcache.jit_bisect_limit
- **JIT Blacklist (PHP 8.5+)**: opcache_jit_blacklist() function to exclude specific functions from JIT compilation
- **Buffer Sizing**: 128MB default, 64MB minimum, 256MB for large applications. Too small causes compilation thrashing.
- **JIT + OpCache Interaction**: JIT reads opcodes from OpCache shared memory — OpCache must be enabled and properly configured first

## When To Use

- Configuring JIT for production deployment
- Setting up JIT for the first time
- Tuning JIT for specific workload patterns
- Benchmarking JIT benefit before/after configuration changes

## When NOT To Use

- Without OpCache enabled (JIT requires OpCache)
- For development environments (OpCache and JIT complicate debugging)
- For single-request scripts that don't benefit from compilation amortization

## Best Practices

- **Progressive enablement**: Enable OpCache first, then JIT. Start with 1254 and 128MB, benchmark before/after, then tune.
- **Monitor buffer utilization**: If jit_buffer_free < 20% of jit_buffer_size, increase buffer. Compilation thrashing destroys JIT benefit.
- **JIT blacklist problematic functions**: Use opcache_jit_blacklist() in PHP 8.5+ to exclude functions that cause guard failures or compilation issues.
- **Pre-warm JIT in long-running processes**: Execute representative requests after worker start to trigger JIT compilation of hot paths before accepting traffic.
- **Keep JIT enabled universally**: Even if I/O-bound web requests don't benefit, cron jobs, queue workers, and batch processing gain significant speedup.

## Architecture Guidelines

- **OpCache First**: JIT compiles opcodes from OpCache. If OpCache is misconfigured (cache full, low hit rate), JIT performance suffers. Fix OpCache before tuning JIT.
- **Buffer is Pre-Allocated**: The JIT buffer is a contiguous memory segment allocated at startup. It cannot be resized without PHP-FPM restart.
- **Compilation Persistence**: In PHP-FPM, each worker has its own JIT buffer. In long-running runtimes (Octane), the buffer persists across requests within the same worker.
- **JIT Blacklist Scope**: The blacklist is per-process. Functions that cause frequent guard failures or produce large compiled code are good candidates for exclusion.

## Performance Considerations

- OpCache provides 2-4x gain. JIT adds 0-95% on top depending on CPU-bound proportion
- JIT buffer is committed as virtual memory — ensure swap is configured if using 256MB+
- 128MB is sufficient for most applications. Monitor utilization.
- JIT compilation overhead: 50-500µs per hot function, amortized over thousands of calls

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Tuning JIT before OpCache | Not understanding dependency chain | Poor results, mistaken conclusion that JIT doesn't work | Fix OpCache first (memory, files, preloading) |
| Undersized buffer | Not monitoring utilization | Compilation thrashing, hot paths revert to interpreter | Monitor jit_buffer_free; increase if <20% |
| JIT disabled on queue workers | Forgetting to configure per-SAPI | Batch jobs miss optimization | Enable JIT globally in php.ini |
| No pre-warming in Octane | Assuming JIT compiles instantly | First 100+ requests on each worker are un-optimized | Warm JIT with representative requests after start |

## Anti-Patterns

- **Toggling JIT on/off per environment**: JIT configuration should be consistent. Enable universally and measure impact.
- **Assuming JIT replaces OpCache tuning**: JIT amplifies OpCache benefits but doesn't replace proper OpCache configuration.
- **Setting jit_buffer_size too large**: Wastes virtual memory (not physical until used, but address space pressure matters in 32-bit or containers).

## Examples

```ini
; php.ini — Production JIT configuration
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0

; JIT settings
opcache.jit=1254
opcache.jit_buffer_size=128M
```

## Related Topics

- JIT Buffer Sizing Guidelines
- JIT Mode Comparison
- JIT Hot Path Threshold Tuning
- JIT for Long-Running Processes

## AI Agent Notes

- Configure OpCache before JIT. OpCache provides the foundation JIT builds on.
- Start with 1254 and 128MB. Benchmark before and after. Increase buffer if >80% utilized.
- JIT is harmless on I/O-bound paths — enable universally.
- Pre-warm JIT in long-running processes (Octane, Swoole) to avoid cold-start latency.

## Verification

- [ ] OpCache configured before JIT
- [ ] JIT enabled with starting configuration (1254, 128MB)
- [ ] Buffer utilization monitored (jit_buffer_free > 20%)
- [ ] Before/after benchmark completed
- [ ] JIT blacklist reviewed (PHP 8.5+)
- [ ] Queue workers also have JIT enabled
- [ ] Pre-warming configured for long-running processes
