## Start with 128MB JIT buffer — increase only when monitoring shows need
---
Category: Configuration
---
Allocate 128MB JIT buffer initially. Monitor utilization weekly. Increase to 256MB only if utilization exceeds 80%.
---
Reason: 128MB is sufficient for most applications. Oversized buffers waste virtual memory address space. The buffer is pre-allocated at startup and cannot be resized without a PHP-FPM restart.
---
Bad Example:
```ini
; Oversized buffer without need
opcache.jit_buffer_size=1G ; Wastes address space
```

Good Example:
```ini
; Start conservative, grow based on data
opcache.jit_buffer_size=128M
```
---
Exceptions: Large codebases (>500K PHP LOC) or aggressive inlining (O=4,5) benefit from starting at 256MB.
---
Consequences Of Violation: Wasted virtual address space, potential memory pressure in containerized environments.

## Never resize JIT buffer without a PHP-FPM restart
---
Category: Reliability
---
Always plan PHP-FPM restarts during maintenance windows when changing jit_buffer_size. The buffer is allocated at JIT initialization.
---
Reason: The JIT buffer is a contiguous memory segment allocated at startup via mmap()/VirtualAlloc(). It cannot be resized at runtime. Changes require a full restart.
---
Bad Example:
```bash
# Changing buffer size without restart — no effect
echo "opcache.jit_buffer_size=256M" >> php.ini
# PHP-FPM continues with old buffer size
```

Good Example:
```bash
# Change and restart
echo "opcache.jit_buffer_size=256M" >> php.ini
systemctl restart php8.5-fpm
```
---
Exceptions: Blue-green deployments where one environment is always serving traffic.
---
Consequences Of Violation: Configuration change has no effect until next restart, misleading operators.

## Account for fragmentation when sizing the JIT buffer
---
Category: Performance
---
Estimate 20% fragmentation overhead in JIT buffer capacity, especially for Function JIT mode.
---
Reason: Native code segments of varying sizes create unusable gaps over time. Tracing JIT fragments 40-50% less than Function JIT. Buffer_free overestimates usable capacity due to these gaps.
---
Bad Example:
```ini
; Sizing based on buffer_free alone
; buffer_free=30MB, thinking 30MB is usable
; Fragmentation reduces usable space to ~22MB
```

Good Example:
```ini
; Estimating fragmentation overhead
opcache.jit_buffer_size=256M ; 128M expected usage + 20% fragmentation
```
---
Exceptions: PHP 8.4+ buffer compaction mitigates fragmentation in long-running processes.
---
Consequences Of Violation: Premature eviction of compiled code, recompilation overhead, diminished JIT benefit.
