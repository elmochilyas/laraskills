## Always use worker mode for FrankenPHP production deployments
---
Category: Configuration
---
Enable worker mode with the `--workers` flag in FrankenPHP production. Standard mode provides no performance gain over PHP-FPM.
---
Reason: Worker mode boots PHP once per thread and handles requests persistently, providing 3-5x throughput vs PHP-FPM. Standard mode boots PHP per request, eliminating the performance advantage.
---
Bad Example:
```caddy
# Standard mode — no performance gain
frankenphp php-server
```

Good Example:
```caddy
# Worker mode required for production
frankenphp php-server --workers
```
---
Exceptions: Development environments where worker mode complicates debugging.
---
Consequences Of Violation: Zero performance improvement over PHP-FPM despite FrankenPHP adoption.

## Verify ZTS compilation before deploying FrankenPHP
---
Category: Configuration
---
Always verify PHP is compiled with --enable-zts before deploying FrankenPHP. Non-ZTS PHP causes thread safety errors under concurrent load.
---
Reason: FrankenPHP uses thread-based concurrency. Without ZTS (Zend Thread Safety), global state corruption and segmentation faults occur when multiple threads execute PHP simultaneously.
---
Bad Example:
```bash
php -i | grep "Thread Safety" # → "disabled"
# Deploying FrankenPHP — crashes under load
```

Good Example:
```bash
php -i | grep "Thread Safety" # → "enabled"
# Safe to deploy FrankenPHP
```
---
Exceptions: Single-thread FrankenPHP deployments (no concurrent requests).
---
Consequences Of Violation: Random segmentation faults, data corruption under concurrent load.

## Set GOMEMLIMIT in FrankenPHP container deployments
---
Category: Reliability
---
Configure GOMEMLIMIT to 80% of container memory limit in all FrankenPHP container deployments.
---
Reason: FrankenPHP embeds a Go runtime (Caddy) alongside PHP. Go's memory manager does not return memory to the OS aggressively. Without GOMEMLIMIT, the Go heap can grow unbounded, causing OOM kills.
---
Bad Example:
```dockerfile
# No GOMEMLIMIT — Go heap grows unbounded
ENV GOMEMLIMIT=""
```

Good Example:
```dockerfile
# GOMEMLIMIT at 80% of container limit
ENV GOMEMLIMIT=800MiB # For 1GB container limit
```
---
Exceptions: Bare-metal deployments with swap configured and memory monitoring.
---
Consequences Of Violation: OOM kills from uncontrolled Go heap growth.

## Use debian-slim over Alpine for FrankenPHP production images
---
Category: Performance
---
Choose debian-slim (glibc) base images over Alpine (musl) for FrankenPHP production deployments.
---
Reason: glibc-based images outperform musl-based (Alpine) by 10-20% for PHP workloads in FrankenPHP due to the memory allocator performance difference. The smaller Alpine image size does not justify the throughput penalty.
---
Bad Example:
```dockerfile
FROM dunglas/frankenphp:latest-alpine
```

Good Example:
```dockerfile
FROM dunglas/frankenphp:latest # debian-slim based
```
---
Exceptions: Environments where image size is the absolute constraint and 10-20% performance loss is acceptable.
---
Consequences Of Violation: 10-20% throughput loss compared to glibc-based images.
