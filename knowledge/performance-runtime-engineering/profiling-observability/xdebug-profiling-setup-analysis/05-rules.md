## Never enable Xdebug profiling in production — 50-200% overhead alters the performance profile
---
Category: Configuration
---
Use Xdebug profiling only in development and staging environments — never enable `xdebug.mode=profile` on production servers.
---
Reason: Xdebug profiling instruments every function call, adding 50-200% overhead to request time. This fundamentally alters the application's performance characteristics: CPU-bound code paths appear relatively faster (because I/O wait is proportionally smaller), and memory allocation patterns change due to additional instrumentation overhead. A profile from Xdebug in production shows Xdebug's impact, not the application's performance. The 50-200% overhead also degrades user experience for any profiled request.
---
Bad Example:
```ini
; Xdebug profiling in production — 50-200% overhead
xdebug.mode=profile
```

Good Example:
```ini
; Xdebug profiling only in development
; xdebug.mode=profile  # Commented out in production
```
---
Exceptions: Staging environments with production-like traffic may use Xdebug for deep single-request analysis when the 50-200% overhead is acceptable.
---
Consequences Of Violation: Unreliable production performance data showing Xdebug's overhead, degraded user experience on profiled requests, incorrect optimization decisions.

## Use trigger-based Xdebug profiling — never always-on mode
---
Category: Configuration
```
Configure Xdebug for trigger-based profiling via `XDEBUG_PROFILE` cookie, GET parameter, or POST parameter — never use always-on profiling even in staging.
---
Reason: Always-on Xdebug profiling profiles every request, slowing down all traffic and generating cachegrind files for every request — even health checks, asset requests, and monitoring probes. Trigger-based profiling ensures only targeted requests are profiled, keeping overhead isolated to investigation sessions. In staging with continuous load testing, always-on mode can fill the disk with cachegrind files in minutes.
---
Bad Example:
```ini
; Always-on — profiles every request
xdebug.mode=profile
```

Good Example:
```ini
; Trigger-based — profile only when requested
xdebug.mode=profile
xdebug.start_with_request=trigger
```
---
Exceptions: Automated CI pipelines that profile specific commands may set the trigger via environment variable rather than HTTP trigger.
---
Consequences Of Violation: Disk filled with cachegrind files from all requests, performance degraded on every request, unnecessary I/O overhead from writing profiles.

## Configure unique cachegrind output filenames with PID to avoid overwriting
---
Category: Configuration
```
Set `xdebug.profiler_output_name=cachegrind.out.%p` to include the PID in each cachegrind filename — never use the default naming pattern that overwrites profiles from concurrent requests.
---
Reason: The default Xdebug profiler output name may not include sufficient uniqueness. When multiple PHP-FPM workers profile requests simultaneously (common under concurrent load or trigger-based profiling with multiple tabs), they overwrite each other's cachegrind files. Only the last profile survives. Including the PID (`%p`) or timestamp (`%t`) ensures each profile has a unique filename and no data is lost.
---
Bad Example:
```ini
; Default naming — concurrent requests overwrite each other
; xdebug.profiler_output_name not set — single filename reused
```

Good Example:
```ini
; PID-inclusive naming — each profile has unique filename
xdebug.profiler_output_name=cachegrind.out.%p
```
---
Exceptions: Single-request profiling in isolation (development, one curl at a time) may safely use the default naming.
---
Consequences Of Violation: Lost profiling data from concurrent requests, need to re-profile, missed diagnostic data from the overwritten profile.

## Use KCacheGrind source annotation to find the exact line causing the bottleneck
---
Category: Diagnostics
```
After identifying a hot function via the call tree, click the "Source" tab in KCacheGrind to see cost per line — identify the exact line where the most time is spent, then optimize that line.
---
Reason: A function may be identified as the hot path (high inclusive or exclusive time) but contain 50+ lines of code. Without line-level granularity, you know which function to optimize but not which line within it. Source annotation highlights the exact lines where CPU time or I/O wait accumulates, showing line numbers, execution counts, and time per line. This narrows the optimization target from an entire function to a single line or block.
---
Bad Example:
```text
# Function identified but no line-level data
# PDO::execute: 380ms — which query? Which line?
# Must trace through source code manually
```

Good Example:
```text
# Source annotation shows exact lines
# Line 45: $stmt = $pdo->prepare($sql); — 5ms
# Line 46: $stmt->execute($params); — 370ms
# Line 47: $stmt->fetchAll(); — 5ms
# Optimization target: line 46 — the actual query execution
```
---
Exceptions: Small, single-line functions identified as hot paths don't need source annotation to find the bottleneck.
---
Consequences Of Violation: Know which function is slow but not which line, waste time manually searching through source code for the bottleneck.

## Clean up cachegrind files after every investigation session
---
Category: Maintainability
```
Delete cachegrind files from the output directory after completing each profiling investigation — never leave them to accumulate.
---
Reason: Cachegrind files contain full function names, file paths, and call counts — internal application details that pose a security risk if exposed. They also accumulate on disk: 100KB-10MB per profile, multiplied by dozens of profiling sessions. Over months, this fills disk space and risks accidental exposure if the output directory is web-accessible or included in backups. Cleanup should be part of the profiling workflow, not an afterthought.
---
Bad Example:
```bash
# Profiles left behind after investigation
ls /tmp/profiling/  # 200 cachegrind files from 3 months of investigations
```

Good Example:
```bash
# Cleanup after investigation
rm /tmp/profiling/cachegrind.out.*  # Delete after use
```
---
Exceptions: Profiles stored for long-term comparison (before/after optimization validation) should be archived in secured storage, not left in the output directory.
---
Consequences Of Violation: Disk space consumed by accumulated profiles, risk of information disclosure from exposed cachegrind files, compliance issues from unmanaged data.
