# Skill: Write k6 Scripts with Stages, Thresholds, and Checks for CI

## Purpose
Create k6 load test scripts with realistic traffic ramps (stages), automated pass/fail conditions (thresholds), per-request assertions (checks), and custom metrics — enabling user-journey simulation with CI integration for performance regression detection.

## When To Use
- User-journey load testing with multiple steps (login → browse → checkout)
- CI pipeline performance gates with threshold-based pass/fail
- Mixed-workload testing with different user types
- Production-representative load patterns with think times

## When NOT To Use
- Simple throughput/latency benchmarks (use wrk2)
- Protocols not supported by k6
- Ad-hoc quick checks (use Vegeta or hey)

## Prerequisites
- k6 installed (local or cloud)
- Target application running in staging environment
- Defined SLOs for threshold configuration

## Inputs
- User journey steps (endpoints, order, think times)
- Target VU count and traffic ramp profile
- SLO thresholds (p95 latency, error rate)
- Environment variables for configuration

## Workflow

### 1. Define User Journey Steps
- Map the real user flow: entry → browse → action → exit
- Add think times between steps: `sleep(Math.random() * 3 + 1)` — 1-4 seconds
- Without think times: load is unrealistic, overestimates capacity by 2-5x
- Use different think times for different user types (browsing vs purchasing)

### 2. Configure Stages for Realistic Traffic Ramps
- Use stages: ramp-up, steady-state, ramp-down
- Avoid instant max load — it misses queuing dynamics
- Example: `stages: [{ duration: '2m', target: 100 }, { duration: '5m', target: 100 }, { duration: '2m', target: 0 }]`
- Ramp-up reveals at what concurrency level latency degrades

### 3. Define CI Thresholds
- Set pass/fail thresholds for automated CI gates:
```javascript
thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
}
```
- Thresholds make k6 CI-native — exit code reflects pass/fail
- Account for normal variance — don't set thresholds too tight

### 4. Add Per-Request Checks
- Validate response status and content: `check(res, { 'status is 200': (r) => r.status === 200 })`
- Checks run regardless of threshold criteria
- Help identify functional issues during load tests

### 5. Use Custom Metrics
- Track application-specific measurements: `const myTrend = new Trend('response_size');`
- Add custom rate, counter, or gauge metrics
- Include in threshold expressions for CI gating

### 6. Export Results for Analysis
- Use `k6 run script.js --out csv=results.csv --summary-export=summary.json`
- Store results for baseline comparison
- Integrate with bencher.dev or similar for trend analysis

### 7. Use Environment Variables
- Never hardcode target URLs or secrets
- Use `__ENV.TARGET_URL` for flexibility across environments
- Store API keys and tokens in CI secrets

## Validation Checklist
- [ ] Think times included (sleep between requests)
- [ ] Multiple stages configured (ramp-up, steady, ramp-down)
- [ ] CI thresholds defined (p95, p99, error rate)
- [ ] Checks validate response status and content
- [ ] Custom metrics added for application-specific tracking
- [ ] Results exported for baseline comparison
- [ ] Environment variables used for configuration

## Related Rules
- Use stages for realistic ramps (`05-rules.md:1`)
- Define SLO thresholds in scripts (`05-rules.md:34`)

## Related Skills
- CI Integration and Baseline Comparison
- Tool Selection by Layer
- Coordinated Omission
- SLO Definition and Error Budgets

## Success Criteria
- k6 script models realistic user journey with think times
- Stages configure ramp-up, steady-state, and ramp-down
- Thresholds automate CI pass/fail decisions
- Checks validate response correctness under load
- Results exported for historical comparison
- Environment variables enable cross-environment execution
