# Standardized Knowledge: Containerized Deployment Cache Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | Containerized Deployment Cache Strategies |
| Difficulty | Intermediate |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Containerized PHP deployments use immutable infrastructure — each deployment builds a new container image with application code baked in. OpCache must be warmed after container start. Strategies: OpCache file cache on persistent volumes (pre-warm in CI, reuse across container restarts), preloading (compiled at container start), or readiness probe warm-up (delay traffic until endpoints respond). The file cache approach eliminates cold-start latency entirely.

## Core Concepts

- **Immutable Image**: Container image built with all PHP code. No code changes at runtime. OpCache file cache path points to an ephemeral volume (lost on restart) or persistent volume (survives restart).
- **OpCache File Cache for Containers**: `opcache.file_cache=/tmp/opcache` with `opcache.file_cache_only=1` (PHP 8.5+). Ephemeral volume = rebuilt per start (slow). Persistent volume = survives restarts (fast).
- **CI/CD Pre-Warming**: In CI build step, run a script that compiles all PHP files and writes OpCache file cache. Include file cache directory in the container image. Container starts with fully warm disk-based OpCache.
- **Readiness Probe**: Kubernetes liveness/readiness probes hit a health endpoint. Multiple failed probes delay traffic until OpCache populates. Simple approach but extends deployment time.

## When To Use

- All PHP deployments in container environments (Docker, Kubernetes, ECS)
- CI/CD pipelines where every deployment builds a new image
- Auto-scaling environments where new containers start frequently
- Performance-critical services where cold-start latency is unacceptable

## When NOT To Use

- Bare-metal or VM deployments (use shared memory OpCache instead)
- Development environments where image builds are frequent
- Containers with very short lifespan (batch jobs lasting seconds)
- Environments where image size is extremely constrained

## Best Practices

- **Pre-warm file cache in CI build**: Run a PHP script during image build that compiles all files and writes OpCache file cache. Include the cache directory in the image. Container starts fully warm.
- **Use persistent volumes for file cache**: If containers restart on the same node, a hostPath or PVC preserves the file cache across restarts, eliminating re-warm time.
- **Preloading for critical classes**: Even with file cache, preloading reduces first-request latency. Configure preloading in the container php.ini.
- **Readiness probe with warm-up**: If pre-warming is not possible, configure Kubernetes readiness probes to delay traffic until OpCache is populated.
- **Monitor OpCache hit rate post-start**: Verify that OpCache is effectively warm after container start. Low hit rate indicates warm-up failure.

## Architecture Guidelines

- **File Cache vs Shared Memory**: In containers, shared memory OpCache (default mode) is lost on restart because the shared memory segment is process-scoped. File cache persists across restarts within the same node.
- **Image Layer Caching**: OpCache file cache can be a separate Docker layer. If code doesn't change, the file cache layer is cached, speeding up subsequent builds.
- **Readiness Probe Design**: The health endpoint should return 503 (not ready) until OpCache hit rate reaches 95%+. Kubernetes won't route traffic until the probe succeeds.
- **Ephemeral vs Persistent**: Ephemeral volumes (emptyDir) are lost on pod reschedule. Persistent volumes (hostPath, PVC) survive reschedule within the same node. Persistent is better for multi-container lifecycles.

## Performance Considerations

- CI pre-warm adds 5-30s to image build time (depending on file count)
- Ready-to-serve time: <1s (pre-warmed) vs 5-30s (cold start)
- File cache on persistent volume: near-zero warm-up on restart
- Readiness probe delay: 30-60s of health check intervals before traffic flows

## Security Considerations

- OpCache file cache in container image increases image size by 50-200MB. Consider security scanning of pre-compiled files.
- Persistent volumes across containers may expose old code if not properly invalidated.
- Container images with baked-in OpCache should be scanned for malicious opcodes during CI.
- Runtime modification of pre-warmed file cache should be prevented (read-only filesystem).

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using shared memory OpCache in containers without warming | Default configuration | First request after restart compiles all files slowly | Use file cache or readiness probe warm-up |
| Not pre-warming in CI | Extra build step complexity | Each container starts cold | Add pre-warm step to Dockerfile or CI pipeline |
| Exposing health probe before OpCache warm | Incorrect probe design | Users see slow responses on new pods | Configure readiness probe to wait for OpCache warm |
| No file cache on persistent volume | Not implementing volume mounts | Cache lost on every pod restart | Mount hostPath or PVC for file cache |

## Anti-Patterns

- **Building OpCache on first request in production**: The first user to hit a new container pays the compilation cost. Always pre-warm.
- **Storing OpCache in container layers without invalidation**: If the file cache is in the image, old code persists even if you deploy a new image. Ensure cache directory is cleaned or versioned.
- **Relying solely on readiness probes for warm-up**: Probes extend deployment time and may still serve slow responses. Combine with pre-warming.
- **Using file_cache_only without shared memory**: PHP 8.5+ file_cache_only works without shared memory, but without shared memory, there's no OpCache in RAM. Evaluate the tradeoff.

## Examples

```dockerfile
# Dockerfile with OpCache pre-warm
FROM dunglas/frankenphp:latest-debian
COPY . /app
# Pre-warm OpCache file cache during build
RUN php -d opcache.file_cache=/tmp/opcache \
       -d opcache.file_cache_only=1 \
       /app/artisan opcache:warm
# Include file cache in image
RUN cp -r /tmp/opcache /app/opcache-cache

# php.ini for container
opcache.file_cache=/app/opcache-cache
opcache.file_cache_only=0
opcache.validate_timestamps=0
opcache.preload=/app/preload.php
```

## Related Topics

- OpCache File Cache
- Zero-Downtime Deployment OpCache
- FrankenPHP Container Memory Management
- CI/CD Cache Invalidation Steps

## AI Agent Notes

- Shared memory OpCache is lost on container restart. File cache is the solution for containerized PHP.
- Pre-warming file cache during CI build eliminates cold-start latency entirely.
- Kubernetes readiness probes should verify OpCache hit rate, not just HTTP 200.
- Persistent volumes preserve OpCache across container restarts within the same node.
- PHP 8.5+ opcache.file_cache_only enables OpCache without shared memory — useful for containers.

## Verification

- [ ] OpCache file cache configured for container environment
- [ ] CI/CD pipeline includes OpCache pre-warm step
- [ ] Kubernetes readiness probe verifies OpCache hit rate
- [ ] File cache path configured for persistence (hostPath or PVC)
- [ ] Image size increase from file cache evaluated and accepted
- [ ] OpCache hit rate monitored after container start
- [ ] File cache invalidation strategy implemented for new deployments
