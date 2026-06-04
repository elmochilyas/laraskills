## Use k6 stages to model realistic traffic ramps
---
Category: Methodology
---
Model traffic patterns using k6 stages (ramp-up, steady-state, ramp-down) instead of instant max load.
---
Reason: Instant max-load benchmarks miss queuing dynamics that develop during traffic ramps. Using stages reveals at what concurrency level latency degrades and helps identify saturation points that instant-load tests hide.
---
Bad Example:
```javascript
// Instant max load — misses queuing dynamics
export let options = {
    vus: 100,
    duration: '60s',
};
```

Good Example:
```javascript
// Realistic traffic ramp
export let options = {
    stages: [
        { duration: '30s', target: 50 },   // Ramp up
        { duration: '60s', target: 100 },  // Steady state
        { duration: '30s', target: 0 },    // Ramp down
    ],
};
```
---
Exceptions: Throughput-only benchmarks seeking maximum RPS.
---
Consequences Of Violation: Missing saturation behavior, deploying with insufficient headroom for traffic spikes.

## Always define SLO thresholds in k6 scripts
---
Category: Methodology
---
Include threshold assertions in every k6 script to automatically fail benchmarks that violate SLOs.
---
Reason: Manual analysis of benchmark results is slow and error-prone. k6 thresholds automatically fail CI pipeline steps when performance regressions occur (e.g., p95 > 200ms or error rate > 1%). This enables automated performance gating in deployment pipelines.
---
Bad Example:
```javascript
// No thresholds — manual analysis required
```

Good Example:
```javascript
export let options = {
    thresholds: {
        http_req_duration: ['p(95)<200', 'p(99)<500'],
        http_req_failed: ['rate<0.01'],
    },
};
```
---
Exceptions: Exploratory benchmarks without defined SLOs.
---
Consequences Of Violation: Performance regressions pass CI undetected, manual analysis bottleneck.
