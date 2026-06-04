# Standardized Knowledge: wrk/wrk2 Usage and Lua Scripting

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | wrk/wrk2 Usage and Lua Scripting |
| Difficulty | Intermediate |
| Lifecycle | Implement, Measure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

wrk fires requests using multiple threads and connections. wrk2 adds `--rate` for constant-RPS mode, eliminating coordinated omission. Lua scripting enables custom request generation (headers, body, authentication tokens, CSRF tokens). Output includes latency percentiles, throughput, and error counts.

## Core Concepts

- **wrk Basic**: `wrk -t4 -c100 -d30s http://localhost:8080` — 4 threads, 100 connections, 30 seconds. Threads manage connections via event loop. Connections maintain keep-alive for maximum throughput.
- **wrk2 Constant Rate**: `wrk2 -t4 -c100 -d30s -R 1000 http://localhost:8080` — targets 1000 RPS. If the server cannot handle the target rate, wrk2 accurately reports the failing latency distribution rather than hiding failures like closed-loop tools.
- **Lua Scripting**: `wrk -s script.lua http://localhost:8080`. Scripts define `request()`, `response()`, `setup()`, `done()` functions. Enables authentication tokens, per-thread request bodies, response validation, and custom latency buckets.
- **HDR Histogram**: wrk outputs latency distribution as an HDR histogram file with `--latency` flag. Import into HdrHistogram tools for precise percentile analysis.

## When To Use

- Raw throughput testing and capacity discovery
- Accurate latency distribution measurement (wrk2 only)
- Quick ad-hoc benchmarks with Lua customization for request headers/bodies
- CI pipeline performance checks where simplicity matters

## When NOT To Use

- Complex user-journey testing with multiple steps (use k6 instead)
- Testing with authentication tokens that expire frequently (Lua scripting helps but is limited)
- When distributed load generation is needed (use k6 Cloud or JMeter)
- Protocol testing beyond HTTP/HTTPS

## Best Practices

- **Use wrk2 for all latency benchmarks**: Always include `--rate` flag for open-loop mode. wrk (without rate) is for throughput discovery only.
- **Benchmark progression**: 1) wrk2 low rate to establish baseline latency. 2) Increase rate until latency increases 2x (saturation point). 3) wrk for max throughput. 4) Compare p50/p95 at each rate.
- **Lua for request customization**: Use Lua scripts to add authentication headers, CSRF tokens, or request body variations. Keep scripts simple for performance.
- **Save HDR histograms**: Use `--latency` flag and pipe output to file. HDR histograms enable precise p99.9 analysis and cross-benchmark comparison.
- **Match thread count to CPU cores**: wrk threads should match or be slightly below load generator CPU cores. Too many threads cause scheduling overhead.

## Architecture Guidelines

- **wrk Mechanics**: Fixed thread count (-t). Each thread manages multiple connections via epoll/kqueue event loop. Lua scripting hooks into request(), response(), and done() callbacks within each thread's state.
- **wrk2 Timer**: wrk2 adds a constant-rate timer using a Poisson process to space requests. This enables open-loop mode. The timer is per-thread, synchronized at start.
- **Connection Management**: wrk creates N connections (-c) and reuses them with keep-alive. Connection count determines concurrency. Thread count determines how many connections each thread manages.
- **Lua Scripting Scope**: `setup()` runs once per thread. `request()` runs before each request. `response()` runs after each response. `done()` runs when the thread finishes, receiving summary statistics.

## Performance Considerations

- wrk2 for accurate latency distribution, k6 for complex scenarios, JMeter for enterprise testing
- wrk can saturate a single machine at 50,000+ RPS for simple endpoints
- Lua scripting adds minimal overhead for simple customizations (<1% reduction in throughput)
- wrk2's Poisson timer adds ~1% CPU overhead compared to wrk's simpler scheduling

## Security Considerations

- Lua scripts may contain authentication tokens. Use environment variables or external files for secrets.
- wrk/wrk2 traffic may trigger rate limiting or WAF rules. Coordinate with security teams.
- Benchmark results from wrk/wrk2 should be treated as confidential capacity information.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using wrk (closed-loop) for latency measurement | Not knowing wrk2 exists | Systematic underestimation of tail latency | Use wrk2 with `--rate` flag for all latency benchmarks |
| Too many threads on load generator | Assuming more threads = more throughput | Thread contention reduces throughput | Match threads to load generator CPU cores |
| Ignoring HDR histogram output | Not using `--latency` flag | Only see aggregate percentiles, miss detailed distribution | Always use `--latency` and save histogram output |
| Lua scripting that blocks | Doing I/O in Lua callbacks | Thread stalls reduce throughput | Keep Lua callbacks simple — no blocking operations |

## Anti-Patterns

- **Using wrk for all benchmarks**: wrk throughput numbers are valid. wrk latency numbers are not. Use wrk2 for latency.
- **Benchmarking without warm-up**: wrk/wrk2 results without warm-up are dominated by cold-state effects. Run 30s warm-up before recorded test.
- **Single rate benchmark**: Testing at one rate gives limited information. Test at multiple rates to find the saturation curve.
- **Ignoring the difference between wrk and wrk2**: They are different tools with different flags and output formats. wrk flags may not work in wrk2 and vice versa.

## Examples

```bash
# Step 1: Baseline latency at low rate
wrk2 -t4 -c64 -d30s -R 500 --latency http://target/api/endpoint

# Step 2: Find saturation point
wrk2 -t4 -c64 -d30s -R 2000 --latency http://target/api/endpoint

# Step 3: Maximum throughput (closed-loop)
wrk -t4 -c256 -d30s --latency http://target/api/endpoint

# Lua scripting example (script.lua)
# request = function() return wrk.format("GET", "/api/endpoint", { "X-Auth: token" }) end
wrk -t4 -c64 -d30s -s script.lua --latency http://target
```

## Related Topics

- Tool Selection by Layer
- Coordinated Omission
- HDR Histogram Analysis
- Benchmarking Concepts

## AI Agent Notes

- wrk and wrk2 are different tools with different maintainers. wrk2 is a fork that adds `--rate` for open-loop mode.
- wrk (without --rate) is closed-loop — valid for max throughput, invalid for latency.
- wrk2 with `--rate` is open-loop — valid for both throughput and accurate latency measurement.
- HDR histogram output (`--latency`) provides far more detail than the terminal summary. Always save it.

## Verification

- [ ] wrk2 used for all latency benchmarks (with `--rate` flag)
- [ ] wrk used only for maximum throughput discovery
- [ ] Thread count matches load generator CPU cores
- [ ] Warm-up phase completed before recorded test
- [ ] HDR histogram saved for post-processing (`--latency` flag)
- [ ] Lua scripts tested and validated
- [ ] Multiple rates tested to find saturation curve
