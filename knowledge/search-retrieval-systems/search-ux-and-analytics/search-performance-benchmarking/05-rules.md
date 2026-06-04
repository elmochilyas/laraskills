---
## Rule Name
Use Realistic Data for Benchmarks

## Category
Testing

## Rule
Always benchmark with production-scale data and query distributions, not synthetic data.

## Reason
Synthetic benchmarks don't reflect real-world performance. Index size, vector distribution, and query patterns significantly affect latency and throughput.

## Bad Example
```bash
# Benchmarking with 1000 records — production has 1M
# Results are meaningless
```

## Good Example
```bash
# Production data dump or realistic synthetic data at target scale
php artisan benchmark:search --records=1000000 --queries=10000
```

## Exceptions
Pre-production applications with no existing production data.

## Consequences Of Violation
Misleading benchmark results leading to wrong capacity planning and performance expectations.

---
## Rule Name
Measure P95 and P99 Latency

## Category
Testing

## Rule
Always measure P95 and P99 latency in benchmarks, not just average.

## Reason
Average latency hides tail latency that directly affects user experience. A system with 20ms average but 500ms P99 provides poor UX.

## Bad Example
```php
$avg = array_sum($latencies) / count($latencies);  // Hides tails
```

## Good Example
```php
sort($latencies);
$p50 = $latencies[(int)(count($latencies) * 0.5)];
$p95 = $latencies[(int)(count($latencies) * 0.95)];
$p99 = $latencies[(int)(count($latencies) * 0.99)];
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Deploying a system that appears fast in benchmarks but has unacceptable tail latency for users.

---
## Rule Name
Benchmark at Expected Concurrency

## Category
Testing

## Rule
Always benchmark search performance at the expected production concurrency level, not single-threaded.

## Reason
Single-threaded latency doesn't reflect real usage. Database connection pooling, queue backlogs, and resource contention only appear under concurrent load.

## Bad Example
```bash
# Single-threaded benchmark — misses contention issues
ab -n 1000 -c 1 http://localhost/search
```

## Good Example
```bash
# Concurrent load at expected concurrency
# Expected: 50 concurrent users
k6 run --vus 50 --duration 60s benchmark.js
```

## Exceptions
No common exceptions.

## Consequences Of Violation
System passes single-threaded benchmarks but fails under production load.
