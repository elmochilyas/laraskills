## Use wrk2 with the --rate flag for all latency benchmarks — never use wrk for latency measurement
---
Category: Testing
---
Always include the `--rate` flag with wrk2 to enable constant-RPS (open-loop) mode for any benchmark that reports latency — reserve wrk exclusively for maximum throughput discovery.
---
Reason: wrk2's `--rate` flag implements a Poisson process timer that sends requests at a constant rate regardless of server response time. This eliminates coordinated omission — the systematic bias where closed-loop tools stop measuring when the system is slow. wrk (without --rate) is closed-loop and underreports tail latency by 30-60%. The cost is negligible (~1% CPU overhead for the timer) for dramatically more accurate latency data.
---
Bad Example:
```bash
# wrk (closed-loop) — invalid for latency
wrk -t4 -c64 -d30s --latency http://target/api
```

Good Example:
```bash
# wrk2 (open-loop) — accurate for latency
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api
```
---
Exceptions: When discovering the maximum throughput the system can achieve (not measuring latency), wrk's closed-loop mode is the correct tool.
---
Consequences Of Violation: Systematically underreported tail latency by 30-60%, hidden queuing delay, misleading benchmark conclusions.

## Match wrk thread count to load generator CPU cores
---
Category: Testing
---
Set the `-t` flag in wrk/wrk2 to match the number of CPU cores on the load generator machine — never use more threads than cores.
---
Reason: wrk threads are OS threads that use epoll/kqueue event loops to manage connections. More threads than CPU cores causes context switching overhead on the load generator, reducing its ability to generate load. If the load generator cannot saturate the target system, the benchmark measures the load generator's limits, not the target system's capacity. Match threads to cores for maximum throughput from the load generator.
---
Bad Example:
```bash
# Too many threads — load generator self-saturates
wrk2 -t32 -c256 -d60s http://target  # 32 threads on 8-core generator
```

Good Example:
```bash
# Threads match cores
wrk2 -t8 -c256 -d60s -R 2000 http://target  # 8 threads on 8-core generator
```
---
Exceptions: When the load generator is significantly more powerful than the target system, fewer threads may suffice.
---
Consequences Of Violation: Load generator becomes bottleneck before target system, benchmark measures generator limits, not server capacity.

## Follow the benchmark progression: low rate → increase → saturation → max throughput
---
Category: Testing
---
Benchmark systematically: start at a low rate to establish baseline latency, increase the rate until latency doubles (saturation point), then run closed-loop max throughput — never test at a single rate.
---
Reason: A single-rate benchmark provides limited information — it doesn't show what happens at higher concurrency or where the saturation point is. The progression reveals the full performance curve: baseline latency (no queuing), saturation point (where latency starts increasing), and maximum throughput (absolute capacity). This data is essential for capacity planning — knowing the saturation point tells you where to set traffic limits.
---
Bad Example:
```bash
# Single rate — limited insight
wrk2 -R 2000 http://target  # Is 2000 the saturation point? Unknown.
```

Good Example:
```bash
# Full progression
wrk2 -R 500 --latency http://target  # Baseline latency at low rate
wrk2 -R 2000 --latency http://target  # Is latency doubled? Saturation found.
wrk -t4 -c256 -d30s http://target  # Max throughput
```
---
Exceptions: Quick regression checks against a known baseline may use a single rate near the expected saturation point.
---
Consequences Of Violation: Incomplete performance picture, unknown saturation point, capacity planning based on insufficient data.

## Always use the --latency flag and save HDR histogram output
---
Category: Testing
---
Include the `--latency` flag in every wrk/wrk2 benchmark run and save the HDR histogram output for post-processing and cross-benchmark comparison.
---
Reason: The terminal output from wrk2 shows summary statistics (p50, p75, p90, p99, p99.9, max) but the HDR histogram file contains the complete latency distribution at high precision. The summary loses information — two benchmarks with the same p99 can have different p99.9. The HDR histogram enables precise percentile analysis, merging multiple runs, and visualization tools that reveal details invisible in summary output.
---
Bad Example:
```bash
# No latency flag — no HDR histogram saved
wrk2 -R 2000 http://target/api  # Can't compute custom percentiles
```

Good Example:
```bash
# Latency flag and histogram saved
wrk2 -R 2000 --latency http://target/api | tee result.txt
# result.txt contains HDR histogram + summary
```
---
Exceptions: Quick ad-hoc tests for a single hypothesis may skip the histogram to reduce output processing.
---
Consequences Of Violation: Cannot compute custom percentiles, no cross-benchmark comparison capability, lost precision in latency analysis.

## Keep Lua callbacks simple — avoid blocking I/O in request(), response(), or done() hooks
---
Category: Performance
```
Write Lua scripts that only prepare request data or read response status — never perform file I/O, DNS lookups, or network calls inside wrk Lua callbacks.
---
Reason: wrk Lua callbacks run in the event loop thread. Any blocking operation (file read, DNS lookup, socket connect) stalls the entire thread, preventing it from sending or receiving requests. A single blocking Lua callback can reduce throughput by 50% or more. If you need complex logic, prepare data in setup() (which runs once per thread) and use request() only to select from precomputed data.
---
Bad Example:
```lua
-- Blocking in request() — stalls the thread
request = function()
    local token = io.open("/tmp/token.txt"):read("*all")  -- Blocks!
    return wrk.format("GET", "/api", {["X-Auth"] = token})
end
```

Good Example:
```lua
-- Precomputed in setup(), non-blocking in request()
setup = function(thread)
    thread.tokens = {"token1", "token2", "token3"}
end
request = function()
    local token = wrk.thread.tokens[math.random(#wrk.thread.tokens)]
    return wrk.format("GET", "/api", {["X-Auth"] = token})
end
```
---
Exceptions: Simple string concatenation or arithmetic in request() callbacks is acceptable — only avoid I/O.
---
Consequences Of Violation: Thread stalls from blocking Lua callbacks, 50%+ throughput reduction, inaccurate benchmark results reflecting Lua overhead rather than target performance.
