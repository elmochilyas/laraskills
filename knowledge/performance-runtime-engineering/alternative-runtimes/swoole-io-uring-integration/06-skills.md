# Skill: Leverage Swoole's io_uring Integration for Async Filesystem I/O

## Purpose

Enable and configure Swoole's io_uring support (Linux 5.1+) for asynchronous filesystem operations, reducing I/O wait time for file-heavy workloads.

## When To Use

- Running Swoole 5.0+ on Linux 5.1+
- Application performs significant filesystem I/O (file reads, uploads, logs)
- Profiling shows filesystem I/O wait as a bottleneck
- High-throughput file processing (image resizing, PDF generation)

## When NOT To Use

- Without Swoole 5.0+ (io_uring requires Swoole 5.0+)
- On Linux <5.1 (io_uring not available)
- When filesystem I/O is not a significant bottleneck
- For network or database I/O (io_uring is for filesystem operations; network I/O uses Swoole's event loop)

## Prerequisites

- Swoole 5.0+ compiled with io_uring support
- Linux kernel 5.1+
- Understanding of io_uring (Linux async I/O interface)

## Inputs

- Swoole version and build configuration
- Linux kernel version
- Filesystem I/O profile (read/write volume, file sizes)

## Workflow (numbered steps)

1. Verify kernel version: `uname -r` must be >= 5.1
2. Verify Swoole build includes io_uring: `php -i | grep "io_uring"` should show "io_uring support => enabled"
3. If not enabled, recompile Swoole with `--enable-swoole-io_uring` flag
4. Enable io_uring in Swoole configuration: `swoole.use_io_uring=On` in php.ini
5. Configure io_uring queue depth: `swoole.io_uring_entries=1024` (or higher for heavy I/O)
6. io_uring auto-hooks filesystem operations: `file_get_contents()`, `fread()`, `fwrite()`, `file_put_contents()`
7. Verify: benchmark filesystem I/O with and without io_uring — measure throughput improvement
8. Monitor io_uring statistics via `swoole_io_uring_status()` for queue depth and completion rates
9. If io_uring submission queue fills up, increase `io_uring_entries`
10. Document the io_uring configuration and expected improvement

## Validation Checklist

- [ ] Kernel version >= 5.1 confirmed
- [ ] Swoole compiled with io_uring support
- [ ] swoole.use_io_uring=On configured
- [ ] io_uring_entries set appropriately
- [ ] Filesystem I/O benchmark completed
- [ ] Throughput improvement measured
- [ ] io_uring statistics monitored
- [ ] Configuration documented

## Common Failures

- **Assuming io_uring is always beneficial**: For small file operations (<4KB), io_uring overhead (submission/completion) may exceed the savings
- **Not increasing io_uring_entries for heavy I/O**: Default 1024 entries may fill quickly under load
- **Not recompiling Swoole if io_uring is missing**: The feature must be explicitly enabled at build time
- **Expecting io_uring to help with network I/O**: Network I/O uses Swoole's event loop, not io_uring

## Decision Points

- Heavy filesystem reads (>100MB/s): io_uring provides significant benefit
- Many small file operations (<4KB each): benchmark — io_uring overhead may negate benefit
- Mixed filesystem and network I/O: enable io_uring for filesystem benefit (no impact on network)
- Docker with limited io_uring support: check Docker version and kernel settings

## Performance Considerations

- io_uring reduces filesystem I/O latency by 30-70% for large operations
- Submission queue (SQ) / completion queue (CQ): user-space ring buffers, no syscall overhead per I/O
- io_uring polling mode: further reduces latency for high-IOPS workloads
- SQ entries: 1024 default — increase to 4096+ for high concurrency
- Memory: io_uring uses pinned memory for buffers — account for this in memory budget

## Security Considerations

- io_uring requires specific Linux capabilities (CAP_IPC_LOCK for memory pinning)
- Containers may need `securityContext.capabilities.add: ["IPC_LOCK"]` in Kubernetes
- io_uring is a kernel feature — keep kernel updated for security patches
- No application-level security changes needed

## Related Rules (from 05-rules.md)

- Enable io_uring for File-Heavy Swoole Workloads
- Verify Kernel Version Before Enabling io_uring
- Increase io_uring_entries for High-Concurrency Workloads

## Related Skills

- Swoole Architecture and Coroutine Model
- Swoole Installation and Configuration
- Sync vs Async I/O Assessment

## Success Criteria

- io_uring support verified for kernel and Swoole
- io_uring enabled and configured
- Filesystem I/O benchmark shows measurable improvement
- io_uring statistics monitored for saturation
- Configuration documented
