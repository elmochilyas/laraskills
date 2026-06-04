# OpCache File Cache and Container Cold-Start Mitigation

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache File Cache and Container Cold-Start Mitigation |
| Difficulty | Advanced |
| Last Updated | 2026-06-02 |

## Overview

OpCache file cache (opcache.file_cache) persists compiled opcodes to disk, enabling cache reuse across PHP-FPM restarts and container deployments. With opcache.file_cache_only (PHP 8.5+), OpCache can serve exclusively from the file cache without shared memory - critical for containerized environments where shared memory is ephemeral and cold-starts must be minimized.

## Core Concepts

- file_cache path: Directory where compiled opcodes are stored as individual files. Shared between deployments if persistent volume mounted.
- file_cache_only (PHP 8.5+): Run OpCache without shared memory. Eliminates cold-start entirely. 10-20% slower than memory but avoids cold-start.
- Container cold-start problem: In Kubernetes/Docker, shared memory is lost on container restart. OpCache recompiles all files.
- file_cache_consistency_check: Validates file cache integrity. Set to 0 in production for speed.

## When To Use

- Running PHP in containerized environments (Docker, Kubernetes).
- Minimizing cold-start latency after container restarts.
- Auto-scaling environments where new containers start frequently.

## When NOT To Use

- Bare-metal or VM deployments where PHP-FPM restarts are rare.
- When maximum throughput is critical (file cache is 10-20% slower).
- When no persistent storage is available for the file cache directory.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use hybrid mode (file_cache_only=0) | Shared memory for speed, file cache for cold-start recovery. |
| Pre-warm file cache in CI/CD | Containers start with warm cache, eliminating cold-start latency. |
| Set file_cache_consistency_check=0 in production | Avoid integrity checks on every read for maximum speed. |

## Architecture Guidelines

- Hybrid mode: OpCache reads from shared memory (fast) and writes to file cache (for restart recovery).
- File cache only mode (PHP 8.5+): No shared memory. All reads from disk.
- File cache format may differ between PHP versions - rebuild after PHP upgrades.
- File cache is not shared across workers.

## Performance Considerations

- Shared memory: ~50ns per opcode read. File cache: ~500ns-2us per opcode read.
- Tradeoff: 10-20% reduced throughput for zero cold-start latency.
- CI/CD pre-warm: Compile all PHP files during build step.
- Container cold-start without file cache: 2-5s first request delay.

## Security Considerations

- File cache writes compiled opcodes to disk. Directory must not be publicly accessible.
- Use appropriate filesystem permissions on the file cache directory.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Not using file cache in containers | Each container cold-start recompiles all files. | First requests are 2-5s slow. | Always configure opcache.file_cache in containers. |
| Setting file_cache_only=1 without measurement | Can reduce throughput by 10-20%. | Unexpected performance drop. | Benchmark both modes before choosing. |

## Anti-Patterns

- Using file cache on ephemeral storage: Cache is lost on restart, defeating purpose.
- Mixing file cache across different PHP versions: Format incompatibility causes corruption.

## Examples

```ini
# Production php.ini for containers
opcache.file_cache=/var/www/.opcache-cache
opcache.file_cache_only=0
opcache.file_cache_consistency_check=0
```

## Related Topics

- Containerized Deployment Cache Strategies
- Preloading Script Design Patterns
- OpCache Memory Sizing

## AI Agent Notes

- File cache is the primary solution for container cold-start. Always recommend it for containerized deployments.
- The 10-20% throughput penalty is usually worth it in auto-scaling environments.
- Pre-warm file cache in CI/CD for maximum benefit.
- PHP 8.5's file_cache_only makes immutable container images practical for OpCache.

## Verification

- [ ] Configure opcache.file_cache path in php.ini.
- [ ] Verify file cache directory exists and is writable.
- [ ] Set file_cache_consistency_check=0 in production.
- [ ] Benchmark cold-start time with and without file cache.
- [ ] Mount file cache on persistent volume.