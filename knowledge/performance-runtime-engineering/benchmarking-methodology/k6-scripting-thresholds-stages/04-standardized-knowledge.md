# Standardized Knowledge: k6 Scripting — Stages, Thresholds, Checks

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | k6 Scripting — Stages, Thresholds, Checks |
| Difficulty | Intermediate |
| Lifecycle | Implement, Measure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

k6 is a JavaScript-based load testing tool. Scripts define stages (ramp-up/down patterns), thresholds (pass/fail conditions for CI), checks (assertions per request), and custom metrics (Trend, Counter, Rate, Gauge). k6 excels at user-journey simulation with multi-step scenarios, think times, and variable paths.

## Core Concepts

- **Stages**: Configure ramp-up, steady-state, and ramp-down patterns. Example: `stages: [{ duration: '2m', target: 100 }, { duration: '5m', target: 100 }, { duration: '2m', target: 0 }]`.
- **Thresholds**: Pass/fail conditions for CI. Example: `thresholds: { http_req_duration: ['p(95)<500', 'p(99)<1500'], http_req_failed: ['rate<0.01'] }`.
- **Checks**: Per-request assertions. Example: `check(res, { 'status is 200': (r) => r.status === 200 })`. Run regardless of threshold criteria.
- **Custom Metrics**: `const myTrend = new Trend('response_size'); myTrend.add(res.body.length);` — track any measurement.
- **Scenarios**: Mix multiple user types (browsing, checkout, admin) in a single test with independent VUs, stages, and thresholds.

## When To Use

- User-journey load testing with multiple steps (login → browse → add to cart → checkout)
- CI pipeline performance gates with threshold-based pass/fail
- Mixed-workload testing with different user types in the same test
- Production-representative load patterns with think times and variable paths

## When NOT To Use

- Simple throughput/latency benchmarks (use wrk2 for faster results)
- Protocols not supported by k6 (use JMeter for custom protocol testing)
- Environments where JavaScript scripting is not viable
- Ad-hoc quick checks (use Vegeta or hey for simplicity)

## Best Practices

- **Add think times**: Use `sleep(thinkTime)` between requests to simulate real user behavior. Without think times, load is unrealistic and overestimates server capacity.
- **Define thresholds for CI gates**: Set p95 < 500ms and error rate < 1% as minimum pass criteria. Tighten thresholds as performance improves.
- **Use scenarios for mixed workloads**: Define separate scenarios for different user types (browsers, buyers, admins) with independent VU counts.
- **Export results for analysis**: `k6 run script.js --out csv=results.csv --summary-export=summary.json` for post-processing and baseline comparison.
- **Run locally first**: Validate script behavior with low VU count before running at production scale in k6 Cloud.

## Architecture Guidelines

- **k6 Execution Model**: Go-based runtime executing JavaScript via Goja (pure Go JS engine). Virtual users (VUs) are goroutines. Each VU runs the default function in a loop. Stages control VU count over time.
- **Metrics Pipeline**: k6 collects HTTP metrics (http_req_duration, http_req_failed) and custom metrics. Data flows through stats.MinMax aggregators to HDR Histogram for percentile calculation.
- **Threshold Evaluation**: Thresholds are evaluated at test end (or periodically in cloud mode). All threshold conditions must be met for a passing test. Failed thresholds exit with non-zero code.
- **Scenarios vs Stages**: Scenarios are more flexible (independent VU scheduling, different executor types). Stages are simpler (linear ramp-up/down). Use scenarios for complex tests.

## Performance Considerations

- k6's Goja JS engine is slower than Node.js for complex JavaScript. Keep scripts simple.
- k6 can saturate a single machine at 30,000+ RPS. For higher loads, use distributed execution (k6 Cloud).
- Memory usage scales with VU count and script complexity. ~10MB per VU for typical scripts.

## Security Considerations

- k6 scripts should not contain hardcoded secrets. Use environment variables for API keys, tokens, and passwords.
- k6 Cloud execution sends traffic from multiple regions. Ensure target systems accept traffic from these sources.
- Thresholds that fail on authentication errors may indicate auth token expiry rather than performance regression.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| No think times | Not simulating real user behavior | Unrealistic load, overestimates server capacity | Add sleep(thinkTime) between requests |
| Thresholds too tight for normal variance | Not accounting for environment noise | Flaky CI that fails on noise | Set thresholds 3-5x baseline to account for variance |
| Complex JavaScript slowing down k6 | Overusing npm-like patterns | k6 Goja engine struggles with complex JS | Keep scripts simple — k6 is not Node.js |
| One scenario for all user types | Simplifying test design | Doesn't represent production traffic mix | Use multiple scenarios for different user behaviors |

## Anti-Patterns

- **Hardcoding target URLs in scripts**: Use environment variables (`__ENV.TARGET_URL`) for flexibility across environments.
- **No thresholds in CI**: Without thresholds, k6 reports data but doesn't gate deployments. Thresholds are the primary CI integration mechanism.
- **Ignoring checks that always pass**: If all checks pass trivially, they're not testing anything useful. Design checks that validate real behavior.
- **Running without `--out` for persistence**: Without output files, results are lost after the test. Always persist to CSV, JSON, or cloud.

## Examples

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const myRate = new Rate('success_rate');

export let options = {
    stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1500'],
        http_req_failed: ['rate<0.01'],
        'success_rate': ['rate>0.99'],
    },
};

export default function () {
    let res = http.get(__ENV.TARGET_URL + '/api/endpoint');
    check(res, { 'status is 200': (r) => r.status === 200 });
    myRate.add(res.status === 200);
    sleep(1);
}
```

## Related Topics

- Tool Selection by Layer
- CI Integration and Baseline Comparison
- Coordinated Omission
- Benchmarking Concepts

## AI Agent Notes

- k6 uses Goja, a pure Go JS runtime, not Node.js. Not all npm packages are compatible.
- Stages control VU count. Scenarios control stage-like behavior with more flexibility.
- Thresholds make k6 CI-native — the exit code reflects pass/fail, enabling deployment gating.
- Always add think times. Without them, the load pattern is unrealistic and inflates capacity estimates.

## Verification

- [ ] Script includes think times (sleep) between requests
- [ ] Thresholds defined for CI pass/fail (p95, p99, error rate)
- [ ] Checks validate response status and content
- [ ] Multiple stages configured (ramp-up, steady, ramp-down)
- [ ] Environment variables used for configurable parameters
- [ ] Output export configured (CSV, JSON, or cloud)
- [ ] Script validated locally before production-scale execution
