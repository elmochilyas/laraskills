## Always profile CPU-bound proportion before assessing JIT benefit
---
Category: Performance
---
Never assume JIT benefit based on generic benchmarks. Profile your specific workload to measure CPU-bound vs I/O-bound proportion.
---
Reason: JIT benefit ranges from 0-5% for I/O-bound to 61-95% for CPU-bound workloads. The break-even is ~15% CPU-bound time. Only profiling your specific endpoints provides accurate data.
---
Bad Example:
```bash
# Assuming JIT helps because "PHPBench says 80% gain"
# Actual app is 90% I/O wait → 0-5% JIT gain
```

Good Example:
```bash
# Profile a representative request
blackfire curl http://app/api/endpoint
# Extract CPU-time ratio from profile
# If CPU > 30%, JIT will provide meaningful gains
```
---
Exceptions: Applications known to be 100% CPU-bound (image processing, scientific computing).
---
Consequences Of Violation: Incorrect expectations, wasted effort, potentially disabling JIT when it would have helped background workloads.

## Include background jobs in JIT benefit assessment
---
Category: Performance
---
Always measure JIT benefit for cron tasks, queue workers, and batch processing in addition to web endpoints.
---
Reason: Background jobs are often more CPU-bound than web requests. A web API may show 2% JIT gain while queue workers show 50%+ gain. Assessing only web traffic underestimates JIT value.
---
Bad Example:
```bash
# Only benchmarking web requests
wrk2 -t4 -c64 http://app/api/endpoint
# 2% JIT gain → "JIT isn't worth it"
```

Good Example:
```bash
# Also benchmark background workloads
php -d opcache.jit=0 artisan report:generate
php -d opcache.jit=1254 artisan report:generate
# 50% gain on report generation → JIT is worth it
```
---
Exceptions: Applications with zero background processing (rare).
---
Consequences Of Violation: Missing 50%+ performance gains on background processing, incorrect "JIT not worth it" conclusion.

## Use sampling profilers for CPU-time measurement, never Xdebug
---
Category: Performance
---
Always use sampling profilers (Blackfire, Tideways, SPX) when measuring CPU-bound proportion for JIT assessment. Never use Xdebug.
---
Reason: Xdebug adds 50-200% overhead, distorting CPU-time measurement. Sampling profilers add <5% overhead and provide accurate CPU vs I/O time ratios.
---
Bad Example:
```bash
# Xdebug distorts the measurement
php -d xdebug.mode=profile artisan report:generate
# CPU time appears inflated due to Xdebug overhead
```

Good Example:
```bash
# Blackfire provides accurate CPU-time measurement
blackfire run artisan report:generate
```
---
Exceptions: Development environments where absolute accuracy is not required.
---
Consequences Of Violation: Distorted CPU-time ratio, incorrect JIT benefit assessment, wrong configuration decisions.
