## Match benchmarking tool to the testing layer: k6 for user journeys, wrk2 for throughput, Lighthouse for frontend
---
Category: Testing
---|---
Select k6 for multi-step user-journey testing with think times and assertions, wrk2 for raw throughput and latency distribution measurement, and Lighthouse for frontend Core Web Vitals — never use a single tool for all layers.
---
Reason: Each layer requires different measurement approaches and produces different metrics. k6 simulates realistic user behavior with variable think times, conditional logic, and multi-step flows. wrk2 saturates network throughput with simple, stateless requests. Lighthouse measures browser-rendering metrics (LCP, CLS, INP) that are invisible to server-side tools. Using the wrong tool for a layer produces systematically misleading results — for example, wrk2 cannot detect a slow JavaScript bundle that causes poor LCP.
---
Bad Example:
```bash
# Using wrk2 for everything — misses user-journey and frontend issues
wrk2 http://app/login  # Measures throughput, not login flow experience
```

Good Example:
```bash
# Layer-appropriate tools
k6 run login-journey.js       # User journey: login → dashboard → logout
wrk2 -R 2000 http://app/api   # Throughput: raw API capacity
lighthouse http://app          # Frontend: LCP, CLS, INP
```
---
Exceptions: Simple API-only applications with no frontend may skip browser-level tools.
---
Consequences Of Violation: Misleading performance conclusions at each layer — hidden user-journey issues, inaccurate throughput measurements, or frontend regressions undetected.

## Default to wrk2 for all latency benchmarks — never use wrk (without --rate) for latency measurement
---
Category: Testing
---
Use wrk2 with the `--rate` flag for every latency measurement benchmark — reserve wrk (without --rate) exclusively for maximum throughput discovery.
---
Reason: wrk is a closed-loop tool that sends the next request immediately after receiving a response. When the system slows down, wrk sends fewer requests — it hides the queuing delay by measuring fewer samples during congestion. wrk2's `--rate` flag maintains a constant request rate regardless of response time, capturing accurate latency distribution including queuing delay. Using wrk for latency systematically underreports tail latency by 30-60%.
---
Bad Example:
```bash
# wrk for latency — underestimates tail latency
wrk -t4 -c64 -d30s --latency http://target/api
```

Good Example:
```bash
# wrk2 for latency — accurate
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api
```
---
Exceptions: When the goal is to find the maximum throughput the system can handle (not latency), wrk's closed-loop mode is appropriate.
---
Consequences Of Violation: Artificially low latency measurements, hidden tail latency, system appears faster than it actually is under load.

## Never use Apache Bench (ab) for production-representative benchmarks
---
Category: Testing
---
Reserve Apache Bench for quick local smoke tests only — exclude it from all CI pipelines and production benchmarking toolchains.
---
Reason: ab is single-threaded, closed-loop, and lacks configurable timing parameters. It cannot saturate modern multi-core servers, systematically overestimates capacity by 30-50%, and its latency measurements suffer from coordinated omission. These limitations are architectural — they cannot be fixed with configuration. Any performance decision based on ab results is unreliable.
---
Bad Example:
```bash
# ab in CI pipeline — unreliable results
ab -c 100 -n 10000 http://target/api
```

Good Example:
```bash
# wrk2 or k6 in CI pipeline
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api
```
---
Exceptions: Quick local validation that the server is responding before running proper benchmarks.
---
Consequences Of Violation: Systematically overestimated capacity and underestimated latency in CI gates, unreliable performance regression detection.

## Include realistic think times in k6 user-journey scripts
---
Category: Testing
```
Add `sleep(thinkTime)` between requests in k6 scripts to simulate real user behavior — never send requests back-to-back without pauses.
---
Reason: Real users pause between actions — reading content, filling forms, deciding what to do next. Back-to-back requests in k6 generate unrealistic load that overestimates server capacity by 2-5x because real users never generate continuous maximum throughput. Without think times, load tests measure synthetic throughput, not the capacity to handle real user traffic patterns.
---
Bad Example:
```javascript
// No think times — unrealistic load
http.get('/products');
http.get('/cart');  // Immediately after — users never do this
```

Good Example:
```javascript
// Realistic think times
http.get('/products');
sleep(Math.random() * 3 + 1);  // 1-4 second think time
http.get('/cart');
```
---
Exceptions: Background API-to-API communication (no user involved) should not include think times.
---
Consequences Of Violation: Overestimated server capacity by 2-5x, under-provisioned infrastructure, production performance degradation under real user traffic.
