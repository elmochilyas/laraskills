---
## Rule Name

Enable File Cache in Containerized Environments

## Category

Performance

## Rule

Always enable `opcache.file_cache` in containerized PHP deployments.

## Reason

Container restarts destroy shared memory. Without file cache, every container restart triggers full recompilation of all PHP files. File cache provides persistent opcode storage on disk, reducing cold-start time by 50–70%.

## Bad Example

```ini
; Container without file cache — full recompilation on every restart
opcache.file_cache=
```

## Good Example

```ini
; Container with file cache
opcache.file_cache=/tmp/opcache
opcache.validate_timestamps=0
```

## Exceptions

Bare-metal or VM deployments where PHP-FPM restarts are rare and cold-start latency is acceptable.

## Consequences Of Violation

500ms–5s cold-start latency on every container restart, wasted CPU on recompilation, slower autoscaling response.

---

## Rule Name

Prebuild File Cache During Docker Image Build

## Category

Performance

## Rule

Always prebuild the OpCache file cache during Docker image build for zero-compilation container startup in PHP 8.5+.

## Reason

Prebuilding the file cache in the Dockerfile ensures that containers start with zero compilation — all opcodes are already compiled and stored on disk. Combined with `file_cache_read_only=1`, this eliminates both recompilation and cache write overhead.

## Bad Example

```dockerfile
# No cache prebuilding — every container starts cold
COPY . /var/www/html
```

## Good Example

```dockerfile
# Prebuild file cache during image build
COPY . /var/www/html
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

## Exceptions

Frequently-changing container images where the build-time cost of rebuilding the file cache exceeds the cold-start savings.

## Consequences Of Violation

Every container instance pays the cold-start compilation cost once, slower autoscaling, increased startup latency.

---

## Rule Name

Use file_cache_only=1 with PHP 8.5+ to Eliminate Shared Memory

## Category

Architecture

## Rule

Set `opcache.file_cache_only=1` in PHP 8.5+ environments to eliminate shared memory overhead and simplify memory management.

## Reason

File-cache-only mode removes the need to allocate shared memory for OpCache, reducing memory pressure and eliminating shared memory configuration complexity. Opcodes are read from disk on every request with minimal overhead on fast SSDs.

## Bad Example

```ini
; PHP 8.5 — still using shared memory when file cache only would suffice
opcache.memory_consumption=256
opcache.file_cache=/tmp/opcache
```

## Good Example

```ini
; PHP 8.5+ — file cache only, zero shared memory
opcache.file_cache=/tmp/opcache
opcache.file_cache_only=1
opcache.file_cache_read_only=1
opcache.validate_timestamps=0
```

## Exceptions

Environments without fast local SSD storage where disk I/O latency is prohibitive.

## Consequences Of Violation

Unnecessary shared memory allocation, additional memory pressure in container environments.

---

## Rule Name

Store File Cache on Local SSD, Not Network Storage

## Category

Performance

## Rule

Always store the OpCache file cache on local SSD storage. Never use network filesystems (NFS, EFS) for the file cache.

## Reason

File cache reads happen on every file access in file-cache-only mode, and on cold starts in mixed mode. Network storage adds latency and variability that defeats the purpose of caching. Local SSD provides the fastest and most consistent read performance.

## Bad Example

```ini
; File cache on network storage — adds latency and variability
opcache.file_cache=/mnt/nfs/opcache
```

## Good Example

```ini
; File cache on local SSD
opcache.file_cache=/tmp/opcache
```

## Exceptions

Stateful deployments where containers restart frequently on the same host and a persistent volume is required to retain the cache across restarts (use EBS/gcePersistentDisk, not NFS).

## Consequences Of Violation

Increased cold-start latency from slow file cache reads, inconsistent performance, network-dependent startup time.

---

## Rule Name

Secure the File Cache Directory

## Category

Security

## Rule

Always store the OpCache file cache directory outside the web root and restrict access to the web server user.

## Reason

Cache files are binary opcodes that reveal the application's file structure and code paths. An attacker with access to the cache directory could analyze the application's architecture or, in a writable cache, inject malicious opcodes.

## Bad Example

```ini
; File cache in web-accessible directory
opcache.file_cache=/var/www/html/storage/cache/opcache
```

## Good Example

```ini
; File cache outside web root, restricted to web server user
opcache.file_cache=/var/cache/opcache
```

## Exceptions

No common exceptions. Cache directories must never be publicly accessible.

## Consequences Of Violation

Exposure of application file structure, potential cache poisoning attack vector.

---

## Rule Name

Use file_cache_read_only=1 for Enhanced Security

## Category

Security

## Rule

Always use `opcache.file_cache_read_only=1` in PHP 8.5+ when the file cache is prebuilt, to eliminate the write permission attack vector.

## Reason

Read-only mode means OpCache never writes to the cache directory after startup. This eliminates the possibility of an attacker injecting malicious opcodes through a writable cache directory, and also prevents accidental cache corruption.

## Bad Example

```ini
; Read-write mode — OpCache can write to cache directory
opcache.file_cache=/tmp/opcache
opcache.file_cache_only=1
```

## Good Example

```ini
; Read-only mode with prebuilt cache — no writes
opcache.file_cache=/tmp/opcache
opcache.file_cache_only=1
opcache.file_cache_read_only=1
```

## Exceptions

Environments where the file cache is not prebuilt and must be populated dynamically (cold-start scenario).

## Consequences Of Violation

Potential cache poisoning vulnerability, write permissions required on cache directory.

---

## Rule Name

Delete File Cache Directory During Code Deployments

## Category

Reliability

## Rule

Always delete the OpCache file cache directory as part of the deployment process when code changes.

## Reason

`opcache_reset()` clears shared memory but does NOT clear the file cache. If the file cache contains stale opcodes, workers that load from file cache (rather than shared memory) will serve old code even after `opcache_reset()`.

## Bad Example

```bash
# Deployment — calls opcache_reset() but file cache persists
php -r 'opcache_reset();'
# Workers that restart and load from file cache get stale opcodes
```

## Good Example

```bash
# Deployment — clear shared memory AND file cache
php -r 'opcache_reset();'
rm -rf /tmp/opcache
# Or with read-only mode, the prebuilt cache in the container image is replaced
```

## Exceptions

Environments using `file_cache_read_only=1` with a prebuilt cache that is replaced as part of the container image.

## Consequences Of Violation

Stale code serving from file cache after deployment, inconsistent behavior across workers.
