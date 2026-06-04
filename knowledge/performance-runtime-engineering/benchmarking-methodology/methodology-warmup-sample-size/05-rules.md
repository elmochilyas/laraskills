## Calculate sample size for target percentile — never guess
---
Category: Methodology
---
Ensure minimum sample sizes: 1000+ for p95, 10,000+ for p99, 100,000+ for p99.9 confidence.
---
Reason: Statistical confidence depends on sample count. Insufficient samples produce unreliable percentile estimates. A p99 from 100 samples has >10% error margin, making pass/fail decisions meaningless.
---
Bad Example:
```bash
# 500 samples for p99 — unreliable
wrk2 -t2 -c16 -d10s http://app/endpoint
```

Good Example:
```bash
# 10,000+ samples for p99 confidence
wrk2 -t4 -c64 -d60s -R 2000 http://app/endpoint
```
---
Exceptions: Quick exploratory tests where precise measurements are not needed.
---
Consequences Of Violation: Unreliable percentile estimates, false pass/fail decisions in CI benchmarks.

## Run minimum 3 iterations per benchmark configuration
---
Category: Methodology
---
Never trust a single benchmark run. Run minimum 3 iterations and report median with standard deviation.
---
Reason: Normal variance between runs is 3-8% due to OS scheduling, CPU frequency scaling, and memory allocation patterns. A single run may show a 5% regression that is actually noise, or miss a real 5% regression.
---
Bad Example:
```bash
# Single run — 5% change could be noise
wrk2 -t4 -c64 -d60s http://app/endpoint
```

Good Example:
```bash
# 3 iterations, report median
for i in 1 2 3; do
    wrk2 -t4 -c64 -d60s --latency http://app/endpoint
done
```
---
Exceptions: Smoke tests where binary pass/fail (error rate) is the only question.
---
Consequences Of Violation: False positives/negatives in performance comparisons, wasted investigation time.

## Use identical datasets for all A/B comparisons
---
Category: Methodology
---
Always use the exact same dataset when comparing configurations. Different data = different performance characteristics.
---
Reason: Database size, cache state, and data distribution directly affect query performance and memory usage. Comparing Config A with dataset X against Config B with dataset Y is invalid — you cannot attribute differences to the configuration change.
---
Bad Example:
```bash
# Day 1 Config A with dataset X
# Day 2 Config B with dataset Y (grew 20%)
```

Good Example:
```bash
# Both configurations tested with snapshot of same dataset
# Load testing with fixed, production-representative data
```
---
Exceptions: Benchmarks specifically measuring performance at different data scales.
---
Consequences Of Violation: Invalid comparisons, wrong conclusions about which configuration is faster.

## Control CPU frequency and isolate the environment
---
Category: Methodology
---
Pin CPU frequency, disable turbo boost, and eliminate competing workloads during benchmarks.
---
Reason: CPU frequency scaling introduces uncontrolled variance (10-30% throughput differences). Competing workloads (cron, monitoring) add noise. Controlled environments produce reproducible results.
---
Bad Example:
```bash
# Turbo boost enabled, cron running — 20% variance between runs
```

Good Example:
```bash
# Pin CPU frequency
cpupower frequency-set -g performance
# Disable turbo
echo 1 > /sys/devices/system/cpu/intel_pstate/no_turbo
# Verify no competing workloads
top -bn1 | head -5
```
---
Exceptions: Benchmarks designed to measure performance under realistic production conditions (including variance).
---
Consequences Of Violation: 10-30% variance between runs, inability to detect real performance changes.
