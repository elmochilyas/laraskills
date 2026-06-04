# OpCache File Cache Secondary Storage — opcache.file_cache, Cold-Start Mitigation, PHP 8.5+ Enhancements

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache File Cache Secondary Storage — opcache.file_cache, Cold-Start Mitigation, PHP 8.5+ Enhancements |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

`opcache.file_cache` is a secondary cache that stores compiled opcodes on disk (in a file-backed cache directory). It is used when the shared memory cache is cold (after PHP-FPM restart) to avoid recompilation. In PHP 8.5+, `opcache.file_cache_only=1` and `file_cache_read_only=1` enable a disk-only mode that eliminates shared memory entirely — ideal for immutable container images where the file cache is prebuilt during the Docker build phase. The file cache reduces cold-start latency by 50–70% and enables faster container startup times.

## Core Concepts

- **opcache.file_cache**: Path to a directory where OpCache stores compiled opcodes as files. Each PHP file gets a corresponding file in the file cache directory.
- **opcache.file_cache_only=0 (default)**: Uses shared memory as primary cache, file cache as fallback. Files load from shared memory (fast), and the file cache provides persistence across restarts.
- **opcache.file_cache_only=1** (PHP 8.5+): Uses file cache ONLY — no shared memory. Files are compiled to disk and read from disk on every request. Eliminates shared memory overhead.
- **opcache.file_cache_read_only=1** (PHP 8.5+): File cache is read-only. Files are never written to the cache — only read. Requires the cache to be pre-populated. Ideal for immutable containers.
- **Cold-start scenario**: PHP-FPM restart → OpCache memory is empty → first request compiles all files → slow first response. File cache speeds this up by loading from disk instead of recompiling.
- **Cache file naming**: Each cached file is stored as `{cache_dir}/{file_path}.php.bin` with a directory structure mirroring the source. Cache validity is checked via file mtime.

## When To Use

- You are running containerized PHP applications and want fast cold starts.
- You want to reduce shared memory usage (file cache only mode uses zero shared memory).
- You are using immutable container images where the file cache can be prebuilt during Docker build.
- You experience cold-start latency after PHP-FPM restarts and want to mitigate it.
- You are running PHP 8.5+ and want the file-cache-only mode for simplified memory management.
- You are deploying in auto-scaling environments where containers start frequently.

## When NOT To Use

- You are running on bare metal or VMs with stable PHP-FPM — shared memory alone is sufficient.
- Your application changes files between requests (dynamically generated PHP files) — file cache would serve stale versions.
- You have limited disk I/O capacity — file cache reads from disk on every request (in file_cache_only mode).
- You are running PHP 8.4 or earlier — file cache features are more limited without PHP 8.5+ enhancements.
- Your container images change frequently — prebuilding the file cache adds build time.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Enable `opcache.file_cache` in containerized environments | File cache provides persistence across container restarts. Without it, every container restart triggers full recompilation. |
| Use `file_cache_only=1` in PHP 8.5+ for disk-only mode | Eliminates shared memory overhead entirely. Simplifies memory management in containers. |
| Use `file_cache_read_only=1` with prebuilt cache (PHP 8.5+) | Prebuild the file cache during Docker image build. Containers start with zero compilation. |
| Store file cache on a persistent volume in stateful deployments | If containers restart on the same host, the cached files persist. Prevents recompilation across restarts. |
| Ensure the file cache directory is not publicly accessible | Cache files are binary opcodes — not sensitive, but they reveal the file structure. |
| Monitor file cache hit rate | `opcache_get_status()['file_cache']` shows hits and misses. A high miss rate means the cache is not working effectively. |
| Combine with preloading for maximum cold-start reduction | Preloaded files are in shared memory. File cache provides fallback for non-preloaded files. |

## Architecture Guidelines

- **File cache write**: When a file is compiled (either lazily or via preloading), OpCache writes the opcodes to the file cache directory. The file path mirrors the source path.
- **File cache read**: On cache miss in shared memory (cold start), OpCache loads the compiled opcodes from the file cache instead of recompiling. This is ~5–10× faster than recompilation.
- **File cache in read-only mode**: `file_cache_read_only=1` means OpCache never writes to the cache directory. If a file is not in the cache, it is compiled normally (and not cached to disk). This is ideal for prebuilt caches in containers.
- **File cache validation**: When `validate_timestamps=1`, OpCache checks the source file's mtime against the cached file's mtime. If the source is newer, the cache is invalidated. When `validate_timestamps=0`, mtime checks are skipped.
- **Cache directory structure**: `/tmp/opcache/{sha1_of_path}/{file}.php.bin`. The directory structure flattens deeply nested paths using SHA-1 hashing to avoid filesystem path length limits.
- **File cache and shared memory together**: Default mode (`file_cache_only=0`): files are compiled once, stored in shared memory (primary) and file cache (secondary). After restart, shared memory is empty, but file cache is populated. First access reads from file cache, re-populating shared memory.

## Performance Considerations

- File cache read: ~50–200µs per file (disk seek + read + deserialize). Shared memory read: ~5–10µs (direct pointer access). File cache is slower but much faster than recompilation (5–50ms).
- Cold-start latency reduction: File cache reduces cold-start from ~500ms–5s (full recompilation) to ~100ms–1s (read from file cache). A 50–70% improvement.
- Disk space: File cache typically uses 200–500MB for a large framework application. Ensure adequate disk space in the cache directory.
- File cache in shared memory only mode: Adding file cache as a fallback adds no runtime overhead (only on cold start). Always enable it.
- Container image size: Prebuilding the file cache in a Docker image adds ~200–500MB to the image size. Balance this against cold-start time savings.

## Security Considerations

- File cache directory permissions: The cache directory must be writable by the web server user. Ensure it is not publicly accessible via the web root.
- Cache poisoning: If an attacker can write to the file cache directory, they could inject malicious opcodes. The directory should be protected by filesystem permissions.
- Container isolation: In multi-tenant container environments, each container should have its own file cache directory. Shared file cache across tenants could leak information about file structure.
- Read-only cache security: `file_cache_read_only=1` is more secure because OpCache never writes to the cache directory — eliminating the write permission attack vector.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Enabling file cache without enough disk space | File cache fills the disk, causing errors. | Not checking disk space requirements. | Cache writes fail, PHP may error. | Ensure cache directory has 500MB+ free space. |
| Using file_cache_only=1 without prebuilt cache | On first cold start, every request must compile all files. | Enabling without pre-populating. | First request is slower than shared memory mode. | Prebuild the file cache or use shared memory + file cache fallback. |
| Storing file cache in a web-accessible directory | Cache files are accessible via HTTP. | Putting cache in `public/` or `storage/app/public/`. | Anyone can download binary opcodes. | Use `/tmp/opcache` or `/var/cache/opcache/`. |
| Forgetting to clear file cache after code changes | Old cached files serve stale opcodes. | `opcache_reset()` clears shared memory but not file cache. | Stale code serves even after reset. | Delete the file cache directory during deployment or use `file_cache_read_only=1` with versioned paths. |
| Not prebuilding file cache in Docker images | Container starts cold every time. | Not using Dockerfile build-time caching for OpCache. | Each container instance pays the cold-start cost once. | Run warm-up script in Dockerfile after `COPY`. |

## Anti-Patterns

- **File cache on network storage (NFS)**: File cache reads benefit from local disk speed. Network file systems add latency and variability. Use local SSD or tmpfs.
- **File cache on tmpfs without prebuilding**: If file cache is on tmpfs, it's empty on every container restart unless prebuilt. Use a persistent volume or prebuild.
- **Allocating both large shared memory and file cache**: With `file_cache_only=1`, you don't need large `memory_consumption`. Don't double-allocate.
- **Ignoring file cache in CI/CD**: Include OpCache warm-up and file cache prebuilding in CI/CD pipeline. Automated testing should verify the cache is valid.

## Examples

```ini
; PHP 8.5+ — file cache only (no shared memory)
opcache.file_cache=/tmp/opcache
opcache.file_cache_only=1
opcache.file_cache_read_only=1
opcache.validate_timestamps=0

; Standard — shared memory + file cache fallback
opcache.file_cache=/tmp/opcache
opcache.file_cache_only=0
opcache.validate_timestamps=0
```

```dockerfile
# Dockerfile — prebuild OpCache file cache
COPY . /var/www/html
# Warm up and build file cache
RUN php -d opcache.file_cache=/tmp/opcache \
       -d opcache.file_cache_only=1 \
       -r "
    \$it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator('/var/www/html')
    );
    foreach (\$it as \$file) {
        if (\$file->getExtension() === 'php') {
            opcache_compile_file(\$file->getPathname());
        }
    }
"
```

```php
// Monitor file cache status
$status = opcache_get_status(false);
if (isset($status['file_cache'])) {
    $fc = $status['file_cache'];
    echo "File cache hits: {$fc['hits']}";
    echo "File cache misses: {$fc['misses']}";
    echo "Hit rate: " . round($fc['hits'] / max($fc['hits'] + $fc['misses'], 1) * 100, 1) . '%';
}
```

## Related Topics

- OpCache Preloading and Warmup
- OpCache Memory Consumption
- OpCache Lifecycle and Invalidation
- Deployment Cache Invalidation
- Containerized PHP Deployment

## AI Agent Notes

- PHP 8.5's file_cache_only and file_cache_read_only are game-changing for containerized PHP. They eliminate shared memory complexity and enable read-only root filesystem deployments.
- The Docker build-time cache warmup pattern (prebuilding file cache in Dockerfile) is the gold standard for container cold-start performance. Zero compilation on container start.
- File cache is secondary — it helps only on cold start. For steady-state performance, shared memory is faster. But in auto-scaling environments where containers start frequently, cold-start optimization matters more than peak performance.
- Disk I/O considerations: If your containers run on fast SSDs (NVMe), file cache overhead is minimal. On burstable or network storage, shared memory is preferred.

## Verification

- [ ] Enable `opcache.file_cache` and configure the cache directory.
- [ ] Restart PHP-FPM and verify cache files are written to the directory.
- [ ] Benchmark cold-start time: measure first request latency with and without file cache.
- [ ] Verify file cache hit rate: should be >95% after initial warmup.
- [ ] Test `opcache.file_cache_read_only=1` (PHP 8.5+): verify OpCache does not write to the directory.
- [ ] Prebuild file cache in Docker image: verify container starts with zero compilation.
- [ ] Verify cache directory permissions are secure (not web-accessible).
- [ ] Document the file cache configuration and deployment procedure.
