# Standardized Knowledge: Coordinated Omission

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | Coordinated Omission — Closed-Loop vs Open-Loop Models |
| Difficulty | Intermediate |
| Lifecycle | Measure, Evaluate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Coordinated omission is a benchmark bias where the tool stops measuring latency during overload. Closed-loop tools (wrk, ab, hey) wait for a response before sending the next request — when the server slows down, the tool naturally slows down too, omitting the queuing delay from latency measurements. Open-loop tools (wrk2 with `--rate`, k6 with constant RPS) send requests at a fixed rate regardless of response time, capturing true latency under load.

## Core Concepts

- **Closed-Loop**: Tool waits for response before sending next request. During overload, tool sends fewer requests. Measured throughput drops but latency stays apparently low. Underestimates real latency by 30-60%.
- **Open-Loop**: Tool sends requests at a fixed rate (e.g., 1000 RPS). If the server can only handle 800 RPS, remaining 200 requests accumulate queue delay. Measured latency accurately reflects user experience.
- **Example**: 1000 RPS target, server handles 800 RPS at 50ms. Closed-loop: reports 800 RPS at 50ms. Open-loop: reports 800 RPS at 50ms + 20% of requests at 500ms (queued). Only open-loop shows true user impact.
- **wrk2 Mitigation**: `wrk2 --rate 1000` sends requests at exactly 1000 RPS. Queue buildup is reflected in latency distribution.

## When To Use

- All latency benchmarks where tail latency accuracy is important
- Capacity testing to find the true saturation point of a system
- CI benchmark gates that must detect regressions reliably
- Comparing two configurations where accurate latency measurements are essential

## When NOT To Use

- Maximum throughput discovery (wrk closed-loop is appropriate for finding peak RPS)
- Quick smoke tests where approximate results are acceptable
- When the tool being used does not support open-loop mode (use a different tool)

## Best Practices

- **Always use open-loop for latency benchmarks**: wrk2 with `--rate`, k6 with constant arrival rate, or Vegeta with `-rate` flag. Closed-loop latency numbers are systematically misleading.
- **Use closed-loop only for throughput discovery**: wrk (without `--rate`) finds maximum throughput. Then use wrk2 to measure latency at that rate.
- **Report both throughput and the rate at which it was measured**: A system may handle 2000 RPS at 50ms p50 under open-loop but only 1500 RPS under closed-loop. Report the methodology.
- **Gradually increase rate**: Start below expected capacity, increase until p99 latency doubles (saturation point). Report the entire curve, not just one point.

## Architecture Guidelines

- **Closed-Loop Mechanics**: wrk creates N connections and reuses them. After sending a request, the thread blocks until a response arrives. During server slowdown, connections wait longer, automatically reducing request rate.
- **Open-Loop Mechanics**: wrk2 creates N connections and sends requests at a fixed rate using a Poisson process timer. If all connections are busy, new requests enter a queue. Queue delay is measured in the response latency.
- **Real-World Analogy**: Closed-loop = toll booth with one car. The booth waits until the car passes before letting the next one through. Open-loop = toll booth with cars arriving at a fixed rate regardless of how fast the previous car passed.
- **Impact on Percentiles**: Closed-loop can underreport p99 by 30-60% under saturation. A system that appears to have 100ms p99 under closed-loop may have 500ms p99 under open-loop.

## Performance Considerations

- Coordinated omission is the most common benchmarking error — include queuing time in latency measurements
- Under 50% utilization, closed-loop and open-loop give similar results. Above 70%, divergence grows rapidly.
- Most published benchmarks using ab, wrk (without rate), or hey are affected by coordinated omission.
- Always verify critical latency numbers with an open-loop tool before making decisions.

## Security Considerations

- Open-loop testing can generate traffic spikes that overwhelm a system. Ramp up rates gradually to avoid unintended self-inflicted DoS.
- Fixed-rate open-loop testing at high rates may trigger rate limiting or DDoS protection. Coordinate with operations teams.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Trusting ab/wrk latency numbers | Not understanding coordinated omission | Latency underestimated by 30-60%, wrong capacity decisions | Verify tail latency with open-loop tool (wrk2) |
| Using wrk for all benchmarks | Convenience, wrk familiarity | Throughput numbers are valid but latency numbers are not | Use wrk2 for latency, wrk for max throughput only |
| Not distinguishing closed vs open in reports | Methodology not documented | Readers cannot evaluate result validity | Explicitly state whether closed-loop or open-loop was used |
| Comparing latency from different loop types | Direct comparison of incompatible methodologies | False conclusions about which system is faster | Only compare latency within the same loop type |

## Anti-Patterns

- **Publishing latency numbers without disclosing loop type**: Any latency measurement without methodology disclosure is untrustworthy. Always document closed vs open loop.
- **Exclusively using closed-loop tools**: Latency benchmarks must use open-loop. Closed-loop latency data is systematically biased.
- **Assuming coordinated omission doesn't affect your results**: It affects all closed-loop benchmarks above ~50% utilization. Test and verify with open-loop.
- **Setting latency SLOs based on closed-loop benchmarks**: You'll miss targets in production because real user traffic is open-loop. Always validate SLOs with open-loop data.

## Examples

```bash
# WRONG — closed-loop latency measurement (biased)
wrk -t4 -c64 -d30s http://target/api

# CORRECT — open-loop latency measurement (accurate)
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api

# Progressive load test
for rate in 500 1000 1500 2000 2500; do
    wrk2 -t4 -c64 -d30s -R $rate --latency http://target/api
done
```

## Related Topics

- wrk/wrk2 Usage and Lua Scripting
- Benchmarking Concepts
- HDR Histogram Analysis
- Metrics Definition and Interpretation

## AI Agent Notes

- Coordinated omission is the single most impactful benchmarking error. Default to open-loop tools.
- wrk2 (with `--rate`) is the recommended tool for accurate latency measurement. wrk is for max throughput only.
- The difference between closed-loop and open-loop latency is negligible below 50% utilization but grows rapidly above 70%.
- If a benchmark doesn't specify its loop type, assume closed-loop and treat latency numbers with skepticism.

## Verification

- [ ] Open-loop tool used for all latency benchmarks (wrk2 with `--rate`, k6 constant arrival rate)
- [ ] Closed-loop tool used only for maximum throughput discovery
- [ ] Loop type explicitly documented in all benchmark reports
- [ ] Latency measurements verified with open-loop before capacity decisions
- [ ] Saturation point identified by gradually increasing rate until p99 doubles
- [ ] Benchmark methodology disclosed in all published results
