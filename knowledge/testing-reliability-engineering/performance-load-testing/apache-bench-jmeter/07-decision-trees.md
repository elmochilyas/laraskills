# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Performance & Load Testing
## Knowledge Unit: Apache Bench and JMeter

---

### Tree 1: Apache Bench vs JMeter — Which to Use

```mermaid
flowchart TD
    A[Choose external load testing tool] --> B{Test complexity?}
    B -->|Single endpoint, simple benchmark| C[Use Apache Bench — quick CLI, no setup]
    B -->|Multi-step user flow| D[Use JMeter — thread groups, assertions, listeners]
    B -->|CI performance gate| E{How complex?}
    E -->|Simple RPS threshold| F[Apache Bench in bash script — parse output]
    E -->|Multiple scenarios| G[JMeter CLI — non-GUI execution]
    C --> H[ab -n 1000 -c 10 -k https://staging.example.com/api]
    D --> I[Develop in GUI, execute via: jmeter -n -t plan.jmx]
    A --> J{Need distributed<br>testing?}
    J -->|Yes| K[JMeter distributed mode — multiple agents]
    J -->|No| L[Single machine either tool works]
```

**Key decision points:**
- **Complexity**: `ab` for simple benchmarks (single URL). JMeter for complex flows (login → browse → checkout).
- **CI integration**: `ab` fits in bash scripts with grep/awk parsing. JMeter requires CLI execution setup.
- **Distributed**: `ab` is single-machine only. JMeter supports distributed agents.

---

### Tree 2: What Metrics to Measure and How to Interpret

```mermaid
flowchart TD
    A[Measure and interpret results] --> B{Metric type?}
    B -->|Throughput (RPS)| C[Requests Per Second — capacity indicator]
    B -->|Latency| D{Which percentile?}
    D -->|P50 (median)| E[Typical user experience — most users see this]
    D -->|P95| F[95th percentile — slower users' experience]
    D -->|P99| G[99th percentile — worst-case users — critical metric]
    D -->|Average| H[Avoid — hides tail latency]
    C --> I[Compare RPS against baseline — regression if >20% drop]
    E --> J[Target: <200ms for APIs, <2s for pages]
    F --> K[Target: <500ms at P95]
    G --> L[Target: <2s at P99 — 1% of users should not time out]
    A --> M{Error rate?}
    M -->|>0%| N[Any errors under load indicate a problem — investigate]
    M -->|0%| O[Application handles load correctly]
```

**Key decision points:**
- **Percentiles over averages**: Average hides tail latency. P99 determines worst-case user experience.
- **RPS for capacity**: Track RPS over time. A 20%+ drop indicates a regression.
- **Error rate**: Any errors under load are bugs. Must be 0%.

---

### Tree 3: Warm-Up Strategy

```mermaid
flowchart TD
    A[Plan warm-up] --> B{Environment?}
    B -->|Staging| C[Send 100+ warm-up requests before measurement]
    B -->|Local development| D[Optional — cold results acceptable for quick checks]
    C --> E[Warm-up: ab -n 100 -c 10 https://staging.example.com/]
    E --> F[Then measure: ab -n 1000 -c 10 -k https://staging.example.com/]
    A --> G{What needs warming?}
    G -->|PHP opcache| H[Warm — first requests trigger cache compilation]
    G -->|Route/service cache| I[php artisan optimize before warm-up]
    G -->|Database query cache| J[Warm — query cache builds during warm-up requests]
    G -->|View/Blade cache| K[Warm — compiled views cached after first render]
    A --> L{Cold-start interest?}
    L -->|Yes — serverless testing| M[Skip warm-up — measure cold performance intentionally]
    L -->|No — standard test| N[Always warm up — production servers run warm]
```

**Key decision points:**
- **Always warm up on staging**: Production servers operate in warm state. Cold metrics are irrelevant for capacity planning.
- **What to warm**: PHP opcache, route cache, query cache, and view cache all need warming.
- **Cold-start tests**: Only relevant for serverless or auto-scaling scenarios where instances are frequently recycled.

---

### Tree 4: Concurrency and PHP-FPM Configuration Testing

```mermaid
flowchart TD
    A[Test concurrency handling] --> B{Current pm.max_children<br>setting?}
    B -->|Don't know| C[Check PHP-FPM pool config: grep pm.max_children /etc/php/*/fpm/pool.d/www.conf]
    B -->|Known value| D{Is it sufficient for<br>test concurrency?}
    D -->|Yes — > test concurrency| E[Test at target concurrency]
    D -->|No — too low| F[Need to increase or run lower concurrency test]
    A --> G{Run ab with increasing<br>concurrency}
    G --> H[ab -n 1000 -c 5 -k → ab -n 1000 -c 25 -k → ab -n 1000 -c 50 -k]
    H --> I{Monitor error rate<br>at each level}
    I -->|Errors at high concurrency| J[Connection refused = php-fpm pool exhausted]
    I -->|No errors| K[Good — pm.max_children is sufficient]
    J --> L{pm.max_children can be<br>increased?}
    L -->|Yes — enough RAM| M[Increase pm.max_children; retest]
    L -->|No — memory constrained| N[Consider: queue-based processing, horizontal scaling, or optimization]
```

**Key decision points:**
- **PHP-FPM bottleneck**: `pm.max_children` is the most common concurrency limit. `ab` reveals exhaustion immediately.
- **Connection refused = pool full**: Error rate spikes at high concurrency indicate PHP-FPM pool exhaustion.
- **Memory budget**: Each PHP-FPM child uses ~20-50MB. `pm.max_children × memory_per_child ≤ available RAM`.
