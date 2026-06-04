# Skill: Configure Containerized PHP with Pre-Warmed OpCache File Cache

## Purpose
Build container images with OpCache file cache pre-warmed during CI/CD build, mount persistent volumes for the file cache across container restarts, configure Kubernetes readiness probes to verify OpCache hit rate >95% before routing traffic, and invalidate/version the file cache on each new deployment — eliminating cold-start latency in containerized PHP deployments (ready-to-serve in <1s instead of 5-30s).

## When To Use
- All PHP deployments in container environments (Docker, Kubernetes, ECS)
- CI/CD pipelines where every deployment builds a new image
- Auto-scaling environments where new containers start frequently
- Performance-critical services where cold-start latency is unacceptable

## When NOT To Use
- Bare-metal or VM deployments (use shared memory OpCache)
- Development environments where image builds are frequent
- Containers with very short lifespan (batch jobs under 10 seconds)

## Prerequisites
- Container runtime (Docker, containerd)
- Kubernetes cluster (for readiness probe)
- CI/CD pipeline with container image build step
- PHP 8.1+ for OpCache file cache support

## Inputs
- Dockerfile or container image definition
- Kubernetes deployment manifest
- Listing of all PHP files in the application

## Workflow

### 1. Configure OpCache File Cache for Containers
- Set `opcache.file_cache=/app/opcache-cache` in php.ini
- Set `opcache.file_cache_only=0` (use shared memory + file cache)
- Or use `opcache.file_cache_only=1` (PHP 8.5+) for file-cache-only mode
- Set `opcache.validate_timestamps=0`

### 2. Pre-Warm File Cache During CI/CD Image Build
- Add Dockerfile RUN step: compile all PHP files and write file cache
- Example: `php -d opcache.file_cache=/tmp/opcache -d opcache.file_cache_only=1 artisan opcache:warm`
- Copy cache directory into the image: `cp -r /tmp/opcache /app/opcache-cache`
- Container starts with fully warm disk-based OpCache — ready in <1s

### 3. Mount Persistent Volume for File Cache
- Use hostPath or PVC for the OpCache file cache directory
- Mount at `/app/opcache-cache` in the container
- Survives container restarts within the same node
- Eliminates re-warm time on restart

### 4. Configure Readiness Probe with OpCache Hit Rate
- Health endpoint returns 503 until OpCache hit rate >95%
- Kubernetes readiness probe checks this endpoint
- Traffic is NOT routed to the pod until OpCache is confirmed warm
- Combine pre-warming (fast start) + readiness probe (safety net)

### 5. Clean or Version File Cache on Each Deployment
- When code changes, old file cache contains stale bytecode
- In CI build: rebuild fresh cache for the new code version
- Delete old cache: `rm -rf /app/opcache-cache && cp -r /tmp/opcache /app/opcache-cache`
- Never use the same file cache across different code versions

## Validation Checklist
- [ ] OpCache file cache configured in container php.ini
- [ ] CI/CD pipeline includes pre-warm step in Dockerfile
- [ ] Persistent volume mounted for file cache (hostPath or PVC)
- [ ] Readiness probe verifies OpCache hit rate >95%
- [ ] File cache cleaned/versioned on each deployment
- [ ] Ready-to-serve time measured and confirmed <1s
- [ ] Image size increase from file cache evaluated

## Related Rules
- Pre-warm file cache in CI build (`05-rules.md:5`)
- Use persistent volumes for file cache (`05-rules.md:37`)
- Readiness probe verifies OpCache hit rate (`05-rules.md:77`)
- Never rely on shared memory alone (`05-rules.md:126`)
- Clean/version file cache per deployment (`05-rules.md:157`)

## Related Skills
- Zero-Downtime Deployment OpCache
- OpCache Reset Strategies
- Blue-Green Deployment OpCache
- FrankenPHP Container Memory Management

## Success Criteria
- Container starts with pre-warmed OpCache (<1s ready-to-serve)
- Persistent volume preserves file cache across restarts
- Kubernetes readiness probe prevents cold pods from receiving traffic
- File cache rebuilt on every deployment to prevent bytecode/source mismatch
- Image size impact of file cache evaluated and accepted
