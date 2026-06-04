## Choose FrankenPHP when operational simplicity is the top priority; choose RoadRunner when plugin ecosystem and process isolation matter more
---
Category: Architecture
---
Select FrankenPHP for teams that value single-binary deployment, automatic HTTPS, and minimal ops overhead. Select RoadRunner for teams that need gRPC, WebSocket, queue plugins, or stronger process isolation and cannot use ZTS-compiled PHP.
---
Reason: FrankenPHP's single binary (Caddy + PHP via CGO) replaces Nginx, PHP-FPM, and certbot with one process and one deployment artifact. RoadRunner's hybrid Go + PHP workers model requires two binaries but offers a richer plugin ecosystem and standard PHP without ZTS compilation. The wrong choice creates operational friction or missing feature gaps.
---
Bad Example:
```bash
# Choosing FrankenPHP for a gRPC-heavy microservice
# FrankenPHP lacks native gRPC support — requires Caddy module development
```

Good Example:
```bash
# Choosing RoadRunner for gRPC-heavy workload
# Built-in gRPC plugin — no additional development needed
```
---
Exceptions: Teams with strong devops capabilities can use either runtime; the choice then depends on specific feature requirements (HTTP/3, automatic HTTPS vs gRPC, WebSocket).
---
Consequences Of Violation: Missing critical features, extended development timelines to build missing plugin functionality, or excessive operational complexity for simple deployment scenarios.

## Test all PHP extensions for ZTS compatibility before committing to FrankenPHP
---
Category: Testing
---
Verify every PHP extension used by the application works correctly with ZTS (Zend Thread Safety) before migrating to FrankenPHP, and include ZTS validation in the CI/CD pipeline.
---
Reason: FrankenPHP requires ZTS-compiled PHP because it uses threads for concurrency. Many PHP extensions are not thread-safe — they use global state, static buffers, or non-reentrant C libraries that segfault under concurrent thread access. An extension that works perfectly with PHP-FPM (non-ZTS) can crash the entire FrankenPHP process when accessed from multiple threads simultaneously.
---
Bad Example:
```bash
# Deploying FrankenPHP without ZTS testing
# Extension that worked in FPM (non-ZTS) causes segfaults under thread concurrency
# Entire FrankenPHP process crashes, 502 errors for all users
```

Good Example:
```bash
# ZTS validation in CI
# All extensions tested under concurrent thread load
# Non-ZTS-safe extensions identified and replaced before migration
```
---
Exceptions: Applications using only pure-PHP dependencies with no native extensions may skip per-extension ZTS testing, though platform-level ZTS validation is still recommended.
---
Consequences Of Violation: Production segfaults, full process crashes under concurrent load, emergency rollback to FPM, team loses confidence in the runtime.

## Benchmark both runtimes with your specific application workload before selecting
---
Category: Testing
---
Run application-specific benchmarks comparing FrankenPHP and RoadRunner under your actual traffic patterns, I/O profiles, and data sizes — do not rely on published benchmark comparisons.
---
Reason: Published benchmarks show FrankenPHP at 3-5x vs RoadRunner at 1.4-2.1x over FPM, but these gaps narrow or reverse depending on the specific application. A Laravel application with many database queries may favor RoadRunner's goroutine scheduler. A static-site-heavy application may favor FrankenPHP's thread model. Only application-specific benchmarks reveal the true comparison for your workload.
---
Bad Example:
```bash
# Selecting based on published benchmark (3-5x vs 1.4-2.1x)
# "FrankenPHP is faster" — but your application's profile favors RoadRunner
```

Good Example:
```bash
# Application-specific benchmark
# FrankenPHP: 1800 RPS, RoadRunner: 1950 RPS — RoadRunner wins for this workload
# Selection based on actual data, not generic benchmarks
```
---
Exceptions: When operational simplicity (not throughput) is the primary decision driver, benchmarking is secondary to the ops overhead comparison.
---
Consequences Of Violation: Selecting the slower runtime for your specific workload, disappointing production performance, wasted migration effort.

## Maintain a parallel FPM deployment for rollback during runtime migration
---
Category: Reliability
---
Keep a fully functional PHP-FPM deployment running alongside the alternative runtime during migration, with the ability to switch traffic within minutes.
---
Reason: Runtime migrations can fail in unpredictable ways — extension incompatibilities, memory leaks that only surface after hours, performance regressions under specific traffic patterns. Without a rollback path, a failed runtime migration becomes a production incident. A parallel FPM deployment with shared data and session state enables instant rollback with zero downtime.
---
Bad Example:
```bash
# FPM decommissioned before runtime is validated
# Runtime OOM after 6 hours — no rollback path
# Emergency rebuild of FPM infrastructure takes hours
```

Good Example:
```bash
# Parallel FPM deployment ready for rollback
# Runtime issue detected — traffic switched to FPM in 2 minutes
# Root cause analysis proceeds without production pressure
```
---
Exceptions: Greenfield applications with no existing FPM deployment do not need a parallel FPM stack.
---
Consequences Of Violation: Extended production outages during runtime issues, emergency infrastructure rebuild under pressure, team reverts to FPM with data loss or extended downtime.
