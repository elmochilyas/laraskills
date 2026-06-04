# OpCache Purpose and Mechanics - How Opcode Caching Eliminates Re-Compilation

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Purpose and Mechanics - How Opcode Caching Eliminates Re-Compilation |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

PHP OpCache eliminates the lex/parse/compile phases (60-80% of a PHP request's CPU time for uncached files) by storing compiled opcodes in shared memory. With OpCache enabled and properly configured, PHP serves files from memory with zero compilation overhead - resulting in 2-4x throughput improvement over uncached operation. It is the single highest-ROI optimization for any PHP application.

## Core Concepts

- Without OpCache: Every request -> read file from disk -> lex to tokens -> parse to AST -> compile to opcodes -> execute. Disk I/O + CPU for compilation on every request.
- With OpCache: First request -> compile and store in shared memory. Subsequent requests -> fetch opcodes from shared memory -> execute. Only file stat() overhead remains (eliminated by validate_timestamps=0).
- Shared memory: OpCache stores compiled files in SysV IPC shared memory accessible by all PHP-FPM workers. No inter-process duplication.
- OpCache phases: Cache population (lazy, on first access) -> cache hit -> cache eviction (when full) -> cache full detection -> reset.

## When To Use

- Every PHP application in production should have OpCache enabled.
- You want 2-4x throughput improvement with zero code changes.
- You are deploying to shared hosting, VMs, or containers.

## When NOT To Use

- Development environments where file changes must be immediately visible without cache reset.
- Running PHP 5.5 or earlier (OpCache was introduced in PHP 5.5).

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Enable OpCache as the first optimization | Largest single performance gain with zero code changes. |
| Set validate_timestamps=0 in production | Eliminates stat() syscall per file per request (200-2000 syscalls saved per request). |
| Size memory_consumption appropriately | 128MB default is too small for Laravel/Symfony. Start at 256MB. |

## Architecture Guidelines

- Shared memory layout: opcache_memory header (locking, statistics), hash table mapping file paths to cached entries, op_array structures (compiled opcodes per function/class), interned strings table.
- Cache entries are lazily populated on first file access.
- Eviction uses two-phase approach: mark entries as wasted, then compact on restart.
- opcache_huge_pages maps shared memory via 2MB huge pages for reduced TLB pressure.

## Performance Considerations

- Default OpCache: ~1.5-2x throughput. With optimized settings: ~2-4x throughput.
- 60-80% of uncached request CPU time is compilation.
- validate_timestamps=0 saves ~1-3% additional throughput.
- Preloading compounds with OpCache for further cold-start reduction.

## Security Considerations

- No direct security implications from OpCache itself.
- Shared memory must not be accessible to untrusted processes on multi-tenant systems.
- The opcache.blacklist can prevent specific files from being cached (e.g., configuration files with secrets).

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Not enabling OpCache | 10-15% of production PHP deployments have OpCache disabled. | 2-4x less throughput. | Always enable OpCache in production. |

## Anti-Patterns

- Enabling OpCache in development with validate_timestamps=1: Causes confusion when changes don't appear.
- Zero optimization of OpCache settings: Defaults are conservative; always tune for your application.

## Examples

```ini
# Minimum viable production php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=32
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
```

## Related Topics

- OpCache Memory Sizing
- Max Accelerated Files Calculation
- Production Hardening Settings

## AI Agent Notes

- OpCache is the highest-ROI PHP optimization. Always recommend it first.
- Default settings are suitable for small apps only. Modern frameworks need 256MB+ memory and 20000+ files.
- Check opcache_get_status() before diagnosing other performance issues.

## Verification

- [ ] Enable opcache.enable=1 in php.ini.
- [ ] Verify OpCache is active via phpinfo() or opcache_get_status().
- [ ] Set memory_consumption to 256MB+ for framework applications.
- [ ] Set max_accelerated_files to 1.5x your total PHP file count.
- [ ] Set validate_timestamps=0 in production.
- [ ] Monitor hit rate >99% after cache warms up.