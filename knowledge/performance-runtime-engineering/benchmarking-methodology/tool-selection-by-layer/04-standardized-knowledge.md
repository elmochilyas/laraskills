# Standardized Knowledge: Tool Selection by Layer

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | Tool Selection by Layer |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Measure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Choose benchmarking tools by the layer you're testing: Protocol/application load testing (k6, JMeter, Gatling, Locust) for realistic user journeys with multi-step scenarios, variable think times, and assertions. Network edge/throughput (wrk, wrk2, Vegeta, hey) for raw throughput and latency on single endpoints. Browser (Lighthouse, Playwright) for frontend performance metrics (LCP, CLS, INP). Use the right tool for the right question.

## Core Concepts

- **k6**: JavaScript-scriptable load testing. Best for user-journey testing with stages, thresholds, checks, and custom metrics. Open source with cloud option.
- **wrk/wrk2**: Multi-threaded HTTP benchmarking. Best for raw throughput and latency. wrk2 adds constant-RPS mode to eliminate coordinated omission. Lua scripting for request customization.
- **Vegeta**: Go-based HTTP benchmarking with simple CLI. Best for ad-hoc throughput tests and CI integration. Constant-rate or targeted-RPS modes.
- **JMeter/Gatling**: Java-based tools for complex enterprise scenarios with assertions, correlation, and distributed load generation.
- **Browser Tools**: Lighthouse (performance audits), Playwright/Puppeteer (scripted browser tests, LCP/CLS measurement).

## When To Use

- k6 for production-representative user journey testing with CI integration
- wrk2 for accurate latency distribution measurement and saturation point discovery
- Vegeta for quick ad-hoc throughput tests and CI pipeline health checks
- JMeter/Gatling for enterprise compliance requirements with distributed load generators
- Lighthouse for frontend performance audits and Core Web Vitals measurement

## When NOT To Use

- Apache Bench (ab) for production benchmarking — it's single-threaded, closed-loop, and overestimates capacity by 30-50%
- wrk for latency measurement (use wrk2's constant-rate mode instead)
- Browser tools for server-side performance testing (they include rendering time)
- JMeter when simplicity and CI integration are priorities (k6 or Vegeta are better)

## Best Practices

- **Match tool to layer**: Protocol testing = k6. Throughput testing = wrk2. Frontend testing = Lighthouse. Mixing layers gives misleading results.
- **Use k6 for CI pipelines**: JavaScript scripting, threshold-based pass/fail, and cloud execution make k6 ideal for automated performance gates.
- **Default to wrk2 for latency**: The `--rate` flag enables open-loop mode, eliminating coordinated omission. wrk (without rate) is for throughput discovery only.
- **Lua scripting for wrk2**: Custom headers, authentication tokens, and request bodies enable production-realistic load patterns.
- **Treat browser metrics separately**: LCP, CLS, and INP measure frontend performance, not server capacity. Don't conflate with server benchmarks.

## Architecture Guidelines

- **Tool Taxonomy**: Protocol load (k6, JMeter, Gatling), network edge (wrk2, Vegeta, hey), browser (Lighthouse, Playwright). Each layer uses different metrics and methodologies.
- **k6 Architecture**: Go-based runtime executing JavaScript via Goja. Goroutine model handles virtual users. Metrics aggregated via HDR Histogram internally.
- **wrk2 Mechanics**: Fixed thread count ( -t ), each managing multiple connections via event loop. Lua scripting hooks into request/response/done callbacks per thread.
- **CI Integration Pattern**: k6 run → CSV/JSON output → compare against baseline → threshold-based pass/fail. Store historical results in bencher.dev or similar.

## Performance Considerations

- wrk2 for accurate latency distribution, k6 for complex scenarios, JMeter for enterprise testing
- Profiling tools (Xdebug, Blackfire) add 10-200% overhead — use sampling profilers for production
- Minimum 1000 samples per scenario for statistical significance
- Warm-up requires 1000-5000 requests before recording measurements

## Security Considerations

- Load testing tools generate traffic that may trigger security monitoring. Coordinate with security teams.
- k6 scripts may contain API keys or authentication tokens. Store secrets in environment variables, not in scripts.
- Distributed load testing (JMeter, k6 cloud) sends traffic from multiple IPs. Ensure this doesn't trigger abuse detection.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using Apache Bench for production benchmarking | Convenience, tool familiarity | 30-50% overestimated capacity, hidden tail latency | Use wrk2 (open-loop) or k6 for production-realistic results |
| Using browser tools for server benchmarking | Testing everything in one tool | Results conflate frontend and backend performance | Separate browser tests (LCP/CLS) from server benchmarks (RPS/latency) |
| k6 with no think times | Not simulating real user behavior | Unrealistic load, overestimates server capacity | Add sleep(thinkTime) between requests in k6 scripts |
| wrk for latency measurement | Not understanding coordinated omission | Systematically underreports tail latency by 30-60% | Use wrk2 with `--rate` flag for all latency benchmarks |

## Anti-Patterns

- **Using one tool for everything**: No single tool optimally measures all layers. Use k6 for journeys, wrk2 for throughput, Lighthouse for frontend.
- **Running benchmarks without understanding the tool's behavior**: wrk ≠ wrk2. ab ≠ hey. Each tool has different biases and measurement approaches.
- **Ignoring load generator capacity**: The load generator must be more powerful than the system under test. Underpowered generators create artificial bottlenecks.
- **Automating benchmarks without validation**: CI benchmarks degrade over time as code changes. Regularly validate that benchmarks still measure what you intend.

## Examples

```bash
# k6 for user-journey testing
k6 run script.js --out csv=results.csv --summary-export=summary.json

# wrk2 for latency (open-loop mode)
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api

# Vegeta for ad-hoc throughput
echo "GET http://target/api" | vegeta attack -rate=1000 -duration=30s | vegeta report

# Lighthouse for frontend
lighthouse http://target --output json --output-path report.json
```

## Related Topics

- wrk/wrk2 Usage and Lua Scripting
- k6 Scripting Thresholds and Stages
- Benchmarking Concepts
- CI Integration and Baseline Comparison

## AI Agent Notes

- Tool selection should follow a hierarchy: protocol/application testing (k6) > throughput/latency (wrk2) > frontend (Lighthouse).
- Apache Bench (ab) should never be used for production-representative benchmarks. It's suitable only for quick smoke tests.
- wrk2 and wrk are different tools. wrk2 adds `--rate` for open-loop mode. wrk is closed-loop.
- k6's Goja JavaScript runtime is not Node.js — not all npm packages are compatible. Keep scripts simple.

## Verification

- [ ] Tool selected matches the testing layer (protocol, network edge, or browser)
- [ ] wrk2 used for all latency benchmarks (not wrk or ab)
- [ ] k6 configured with think times for realistic user simulation
- [ ] Load generator capacity verified to exceed system under test
- [ ] Benchmark methodology documented with tool version and configuration
- [ ] CI integration configured for automated execution
