# Skill: Configure Secondary OpCache File Cache for Containerized Deployments

## Purpose

Enable `opcache.file_cache` to persist compiled opcodes to disk, reducing cold-start latency in containerized environments where shared memory is reset on container restart.

## When To Use

- Containerized PHP deployments (Docker, Kubernetes)
- Environments where shared memory is not persistent
- Reducing cold-start latency after container restarts or scaling events
- As a fallback when shared memory is exhausted

## When NOT To Use

- For traditional server deployments where shared memory is sufficient
- When disk I/O is severely constrained (SD cards, network volumes)
- Without first configuring primary shared memory OpCache
- When the file cache directory would be publicly accessible

## Prerequisites

- OpCache enabled and configured with shared memory
- Writeable directory for file cache storage
- Understanding that file cache is a secondary cache (shared memory is always checked first)

## Inputs

- File cache directory path (must not be publicly accessible)
- Container filesystem type (ephemeral, persistent volume)
- Deployment frequency and cold-start tolerance

## Workflow (numbered steps)

1. Choose a directory for the file cache outside the web root: `/var/opcache-file-cache`
2. Create the directory: `mkdir -p /var/opcache-file-cache && chown www-data:www-data /var/opcache-file-cache`
3. Set `opcache.file_cache=/var/opcache-file-cache` in php.ini
4. For containers: use a writable directory within the container (e.g., `/tmp/opcache-file-cache`)
5. For persistent optimization: mount a volume for the file cache to survive container restarts
6. Enable `opcache.file_cache_only=0` (default) — file cache is secondary to shared memory
7. Restart PHP-FPM to apply the configuration
8. Verify the file cache is populated: check the directory for `.php.bin` files
9. Benchmark cold-start latency with and without file cache
10. Document the file cache configuration

## Validation Checklist

- [ ] File cache directory created and writeable by PHP-FPM
- [ ] opcache.file_cache configured in php.ini
- [ ] File cache directory not publicly accessible
- [ ] File cache files (.php.bin) confirmed present after warm-up
- [ ] Container: directory survives restarts if using persistent volume
- [ ] Cold-start latency measured (should be 50-70% lower with file cache)
- [ ] Shared memory still configured as primary cache

## Common Failures

- **Making file cache directory public**: Compiled opcodes in a public directory expose application internals
- **Using file_cache_only=1 without understanding**: Disables shared memory entirely — degrades performance
- **Not cleaning file cache on code changes**: Stale opcodes in file cache serve until the file's mtime changes
- **File cache on ephemeral storage**: Container restarts lose the file cache if not using a persistent volume

## Decision Points

- If cold-start latency is acceptable (<2s): file cache is optional
- If cold-start latency >5s after deployment: file cache provides significant benefit
- For containers with persistent volume: file cache survives restarts and provides instant recovery
- For containers without persistent volume: file cache only helps within the same container's lifetime

## Performance Considerations

- File cache reduces cold-start latency by 50-70% in containers
- File cache is ~30% slower than shared memory but much faster than recompilation
- File cache files are specific to PHP version — invalidated on PHP upgrade
- Disk I/O for file cache reads: ~1-5µs per file vs 0.1µs for shared memory

## Security Considerations

- File cache directory must not be publicly accessible (outside web root)
- File cache contains compiled opcodes that may reveal application structure
- In multi-tenant environments, ensure file cache is isolated per application
- File permissions on the cache directory must restrict access to the PHP-FPM user only

## Related Rules (from 05-rules.md)

- Enable File Cache for Container Deployments
- Never Expose File Cache Directory Publicly
- Prefer Shared Memory Over File Cache

## Related Skills

- OpCache Overview and Configuration
- Containerized Deployment Cache Strategies
- Preloading Reduces Cold-Start Latency

## Success Criteria

- File cache configured and populated
- Cold-start latency reduced by 50-70%
- File cache directory secured (not publicly accessible)
- Shared memory remains the primary cache
- Configuration documented with rationale
