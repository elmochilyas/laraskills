## Verify Linux kernel version (5.19+) in deployment scripts for Swoole io_uring support
---
Category: Configuration
---
Include a kernel version check (`uname -r`) in Swoole deployment scripts and log the result for monitoring — do not assume io_uring is available.
---
Reason: Swoole automatically enables io_uring on Linux 5.19+ kernels and silently falls back to epoll/aio on older kernels. Without a kernel version check, teams may believe they are getting io_uring's 2-5x file I/O improvement when they are actually running on the epoll fallback. The fallback is graceful and functional but provides no io_uring benefit — a silently missing optimization.
---
Bad Example:
```bash
# No kernel check — io_uring status unknown
# Deployed to Linux 5.15 — io_uring not available, but no one knows
```

Good Example:
```bash
# Kernel version checked and logged
uname -r  # 6.2.0-1015-aws — io_uring fully supported
# Logged to deployment output for easy verification
```
---
Exceptions: Environments where file I/O is not a performance factor (<5% of request time) may skip the version check as io_uring provides minimal benefit.
---
Consequences Of Violation: Silently missing io_uring optimization, file-heavy operations slower than expected, team assumes io_uring benefits when none exist.

## Focus io_uring evaluation on filesystem-heavy workloads, not network I/O
---
Category: Performance
---
Benchmark io_uring's impact on filesystem operations (file reads, writes, uploads, log streaming) where it provides 2-5x improvement; do not expect significant gains for network I/O.
---
Reason: io_uring's primary benefit is reducing syscall overhead for filesystem operations through submission/completion queue pairs in shared memory. For network I/O (database queries, HTTP requests), epoll already provides efficient event notification — io_uring improves network throughput by only 5-15%. Expecting 2-5x network improvement leads to disappointment and misdirected optimization effort.
---
Bad Example:
```bash
# Benchmarking network I/O — small improvement expected
# "io_uring only gave 8% improvement for HTTP requests — not worth it"
```

Good Example:
```bash
# Benchmarking file-heavy workload — significant improvement
# "io_uring gave 3x improvement for image upload processing"
```
---
Exceptions: Applications with sendfile-heavy workloads (large file downloads) may see meaningful network I/O benefit from io_uring.
---
Consequences Of Violation: Disappointing benchmark results, incorrect conclusion that io_uring "doesn't help," underutilized optimization for file-heavy operations.

## Never disable the epoll fallback in Swoole's io_uring configuration
---
Category: Reliability
---
Allow Swoole to automatically fall back to epoll/aio when io_uring is unavailable — never patch or configure Swoole to require io_uring.
---
Reason: Forcing io_uring on kernels that don't support it causes segfaults, event loop failures, and complete server crashes. The epoll fallback is stable, well-tested, and provides equivalent functionality (though with higher syscall overhead). Swoole's auto-detection correctly handles the fallback — overriding it creates an unnecessary crash risk.
---
Bad Example:
```php
// Attempting to force io_uring — crash risk on unsupported kernels
// No configuration to force io_uring exists; this would require binary patching
```

Good Example:
```php
// Let Swoole auto-detect io_uring — safe on all kernels
$server->set([
    'hook_flags' => SWOOLE_HOOK_ALL,  // Auto-detects io_uring availability
]);
```
---
Exceptions: None. Never force io_uring on unsupported kernels.
---
Consequences Of Violation: Server crashes on kernels without io_uring, event loop failures, complete service unavailability until the configuration is corrected.

## Verify container seccomp profiles allow io_uring syscalls in Kubernetes deployments
---
Category: Security
---
Check that container runtime seccomp profiles permit io_uring-related syscalls (io_uring_setup, io_uring_enter, io_uring_register) in staging before deploying Swoole with io_uring to production.
---
Reason: Some container runtimes and Kubernetes security policies use seccomp profiles that block io_uring syscalls, which are newer and may not be on the default allowlist. If blocked, Swoole's io_uring init fails and it falls back to epoll — but the fallback may have edge cases or performance characteristics that differ from expectations. Verification in staging prevents surprises in production.
---
Bad Example:
```bash
# io_uring not tested under container seccomp
# Production seccomp profile blocks io_uring — silent fallback to epoll
# Team expects io_uring performance but gets epoll
```

Good Example:
```bash
# io_uring verified in staging with production seccomp profile
# io_uring_setup syscall allowed — confirmed working
```
---
Exceptions: When the container runtime uses a permissive seccomp profile (default Docker, privileged containers), verification is less critical but recommended.
---
Consequences Of Violation: Silent io_uring fallback in production, missing 2-5x file I/O improvement, incorrect performance baseline for capacity planning.
