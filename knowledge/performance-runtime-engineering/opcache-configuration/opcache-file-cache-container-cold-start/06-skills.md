# Skill: Reduce Container Cold-Start Latency with OpCache File Cache

## Purpose

Minimize cold-start latency in containerized PHP deployments by leveraging OpCache file cache persistence.

## When To Use

- Containerized PHP deployments on Kubernetes, Docker Swarm, or ECS
- Cold-start latency after container restart exceeds acceptable threshold
- Auto-scaling events create new containers that need fast OpCache warm-up

## When NOT To Use

- For traditional server deployments (shared memory is already persistent)
- When containers restart infrequently and cold-start impact is acceptable
- When disk I/O performance is severely constrained

## Prerequisites

- OpCache enabled and configured with shared memory
- Container with writable filesystem
- Understanding of container lifecycle and scaling events

## Inputs

- Current cold-start latency (first request after container start)
- Container restart frequency
- Auto-scaling configuration (min/max replicas, scale-up speed)
- Ephemeral vs persistent storage configuration

## Workflow (numbered steps)

1. Measure current cold-start latency: time the first 10 requests after container start vs steady-state
2. Enable OpCache file cache: `opcache.file_cache=/tmp/opcache-file-cache` in php.ini
3. For persistent optimization: mount a volume at the file cache path to survive container restarts
4. For ephemeral storage: file cache speeds warm-up within the same container's lifetime but not across restarts
5. Create a warm-up script that executes critical endpoint requests (see OpCache Warm-Up skill)
6. Add the warm-up script to the container startup lifecycle (postStart hook, init container, or startup probe)
7. Configure container health check to verify OpCache is populated before accepting traffic
8. For blue-green or rolling deployments: warm new containers before adding them to the load balancer
9. Measure cold-start latency after file cache implementation — target 50-70% reduction
10. Document the configuration and expected improvement

## Validation Checklist

- [ ] Cold-start latency measured before optimization
- [ ] opcache.file_cache configured in container image
- [ ] Persistent volume mounted for file cache (if desired)
- [ ] Container startup includes warm-up script
- [ ] Health check verifies OpCache population
- [ ] Cold-start latency measured after optimization
- [ ] Deployment pipeline includes warm-up for blue-green/rolling

## Common Failures

- **File cache on ephemeral storage**: Container restart loses the cache — only helps within the same container's lifetime
- **No warm-up script**: File cache only helps if files have been accessed and cached previously
- **Not mounting persistent volume**: Each new container starts with empty file cache — minimal benefit for auto-scaling
- **File cache directory in web root**: Compiled opcodes become publicly accessible

## Decision Points

- If persistent volume available: file cache survives restarts — maximum benefit
- If ephemeral storage only: file cache helps within-container but not across restarts
- If auto-scaling adds containers frequently: persistent volume with file cache is essential
- If containers restart rarely (<1/week): file cache benefit may not justify complexity

## Performance Considerations

- File cache reduces cold-start latency by 50-70% compared to shared memory alone
- File cache reads are ~1-5µs per file vs 0.1µs for shared memory — still much faster than compilation (10-100ms per file)
- File cache files are ~8-15KB per cached PHP file — 20K files = 200-300MB on disk
- File cache is only used when shared memory misses — warm shared memory is always faster

## Security Considerations

- File cache directory must not be publicly accessible (outside web root)
- Mount persistent volumes with appropriate permissions (readable by PHP-FPM user only)
- In multi-tenant containers, isolate file cache per application
- File cache files contain compiled opcodes — treat as application-internal data

## Related Rules (from 05-rules.md)

- Enable File Cache for Container Deployments
- Never Expose File Cache Directory Publicly
- Prefer Shared Memory Over File Cache

## Related Skills

- OpCache Warmup Implementation
- Containerized Deployment Cache Strategies
- Blue-Green Deployment with OpCache

## Success Criteria

- Cold-start latency reduced by 50-70%
- File cache configured with appropriate storage (persistent or ephemeral)
- Container startup includes warm-up and health check
- File cache directory secured
- Configuration documented
