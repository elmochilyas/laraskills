## Always configure opcache.file_cache in containerized environments
---
Category: Performance
---
Set opcache.file_cache with a persistent volume path in all containerized PHP deployments.
---
Reason: In containers, shared memory is lost on restart. Without file cache, each container cold-start recompiles all files, causing 2-5s first-request latency. File cache persists compiled opcodes across restarts, reducing cold-start to near zero.
---
Bad Example:
```dockerfile
# No file cache in container — 2-5s cold start on every restart
```

Good Example:
```ini
; php.ini for containers
opcache.file_cache=/var/www/.opcache-cache
opcache.file_cache_consistency_check=0
```
---
Exceptions: Bare-metal/VM deployments where PHP-FPM restarts are rare.
---
Consequences Of Violation: 2-5s cold-start latency after every container restart, poor auto-scaling experience.

## Pre-warm OpCache file cache in CI/CD build step
---
Category: Performance
---
Compile all PHP files during CI/CD build and populate the file cache directory so containers start fully warm.
---
Reason: Even with file cache, first access in a new container triggers lazy compilation. CI/CD pre-warming compiles all files during build, ensuring zero cold-start compilation when containers start.
---
Bad Example:
```bash
# No pre-warming — each new container compiles on first access
docker build -t app .
```

Good Example:
```dockerfile
# Dockerfile — pre-warm during build
RUN php -d opcache.file_cache=/var/www/.opcache-cache \
       -d opcache.file_cache_only=1 \
       artisan optimize:all
```
---
Exceptions: Very small applications where file count is <1000 and compilation is fast.
---
Consequences Of Violation: First-request latency for each new container, inconsistent performance during scale-up events.

## Set file_cache_consistency_check=0 in production
---
Category: Performance
---
Always disable opcache.file_cache_consistency_check in production to avoid integrity check overhead.
---
Reason: File cache consistency checks validate integrity on every read, adding overhead. In production, the file cache is written once and read many times — integrity checks provide no benefit after initial verification.
---
Bad Example:
```ini
; Consistency check enabled — unnecessary overhead
opcache.file_cache_consistency_check=1
```

Good Example:
```ini
; Disabled for maximum throughput
opcache.file_cache_consistency_check=0
```
---
Exceptions: Environments where file cache corruption is a known risk (shared filesystems, NFS).
---
Consequences Of Violation: 5-15% higher latency from integrity checks on every cache read.
