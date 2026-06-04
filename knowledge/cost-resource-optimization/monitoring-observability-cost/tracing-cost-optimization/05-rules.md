# Tracing Cost Optimization — Rules

## R1: Use Head-Based Sampling with 1-10% Rate — 100% for Errors

**Category**: Sampling Strategy

**Rule**: ALWAYS use head-based trace sampling with a 1-10% rate for healthy requests and 100% for error requests. NEVER trace 100% of requests at scale (>100 req/s).

**Reason**: Tracing every request at 1000 req/s with 50 spans per request generates 50M spans/day. At Datadog's $0.70/million spans, that's $1,050/month just for traces. Sampling at 1% reduces span volume to 500K spans/day = $10.50/month. The debugging value lost from sampling healthy requests is negligible — 99% of incident-relevant data comes from error and slow traces, which should be 100% captured via priority sampling.

**Bad Example**: A Laravel API with 500 req/s traces 100% of requests. Each request generates 50 spans (HTTP → controller → 5 DB queries → 3 cache calls → 2 HTTP external calls → response). Daily span volume: 2.16B. Monthly tracing cost (X-Ray at $0.0000005/span): ~$1,080/month. Only error traces (2% of total) provide debugging value.

**Good Example**: Head-based sampling at 5% for healthy requests. Tail-based sampling at 100% for errors and slow requests (>1s). Daily span volume: 108M. Monthly cost: ~$54/month. Error traces: 100% captured. Healthy traces: statistically representative.

**Exceptions**: Low-traffic services (<10 req/s) can trace at 100% — the cost is negligible (<$5/month). Only add sampling when traffic exceeds 100 req/s.

**Consequences Of Violation**: Tracing costs dominate the observability bill, often exceeding compute costs. A "we need all the data" mindset leads to $5,000-15,000+/month in tracing costs for high-traffic apps.

---

## R2: Filter Health Check and Internal Monitoring Traces

**Category**: Trace Filtering

**Rule**: ALWAYS exclude health check endpoints (`/health`, `/up`, `/ping`) and internal monitoring traffic from tracing. NEVER trace endpoints that have zero debugging value.

**Reason**: Health checks are 20-50% of all requests in load-balanced environments. ELB health checks hit every instance every 10-30 seconds. With auto scaling groups of 10 instances, that's 20-60 health check requests/min = 28,800-86,400/day with zero debugging value. Tracing them doubles the effective trace volume without any benefit. Filtering them reduces trace cost by 20-50%.

**Bad Example**: A load-balanced Laravel app receives 200 req/s user traffic + 100 req/s health checks = 300 total req/s. 100% traced. Monthly spans: 300 req/s x 50 spans x 86,400 x 30 = 38.9B spans = $778/month (Datadog pricing). 33% of cost ($257/month) comes from health check traces.

**Good Example**: Health check filter: exclude `/health` endpoint from tracing. Traced traffic: 200 req/s. Monthly spans: 25.9B = $519/month. Savings: $257/month. Health checks still function normally — they just don't generate trace data.

**Exceptions**: During a health check-related incident (instances incorrectly marked unhealthy), temporarily disable the filter to debug. Re-enable after resolution.

**Consequences Of Violation**: Paying 20-50% more for tracing than necessary. Health check traces provide zero debugging value but significantly inflate span volume.

---

## R3: Aggregate Low-Value Spans (Cache GET/SET, Config Reads)

**Category**: Span Reduction

**Rule**: ALWAYS aggregate low-value spans like individual cache operations and config lookups into a single "Cache operations" or "Config operations" span. NEVER create individual spans for every internal operation.

**Reason**: A typical Laravel request makes 5-15 cache calls (session read/write, cache GET for config, route cache, view cache). Each of these becomes a separate span if instrumented individually. Aggregating them into a single span per request reduces span count by 30-50% with no loss of meaningful signal — if cache is slow, the aggregated span duration reveals it, and you don't need individual spans to see "which cache call" is slow because all cache calls use the same Redis endpoint.

**Bad Example**: A Laravel request generates 1 HTTP span + 1 controller span + 8 DB spans + 5 cache GET spans + 3 cache SET spans + 2 config lookup spans = 20 spans total. Span count is dominated by low-value cache and config operations.

**Good Example**: The same request: 1 HTTP span + 1 controller span + 8 DB spans + 1 "Cache operations" span (aggregates 8 cache calls, shows total duration) + 1 "Config" span. Total: 12 spans instead of 20 (40% reduction). If cache is slow, the aggregated span shows "Cache operations: 150ms" and you know to investigate Redis.

**Exceptions**: For specific debugging sessions where you need per-call cache granularity, temporarily disable aggregation. Re-enable after debugging.

**Consequences Of Violation**: Span volume is 30-50% higher than necessary. For a high-traffic app, this translates to $200-500+/month in unnecessary tracing costs.

---

## R4: Set Trace Budget Alerts — Tracing Cost Should <10% of Observability Spend

**Category**: Cost Governance

**Rule**: ALWAYS set a budget alert for tracing costs specifically (not just total observability). Target tracing cost at <10% of total observability spend.

**Reason**: Tracing is typically the most expensive observability component on a per-data-unit basis — spans are smaller than logs but far more numerous. Without a specific budget, tracing can silently exceed the combined cost of all other observability components. A dedicated budget alert (e.g., "X-Ray traces > $200/month") catches tracing-specific anomalies (accidental 100% sampling, missing health check filter) before they compound.

**Bad Example**: The team has a total observability budget of $1,000/month. Tracing costs silently grow from $200 to $700/month over 3 months (new services added without sampling). Total observability: $1,500/month. The team knows costs are rising but doesn't realize tracing is the sole driver — they optimize logs and metrics while tracing continues growing.

**Good Example**: Tracing budget: $100/month (10% of $1,000 total). When tracing hits $100, the alert fires. The team discovers a new service is tracing at 100% and fixes it. Tracing returns to $80/month. Total observability: $980/month.

**Exceptions**: For apps with very low tracing volume (<10M spans/month), tracing cost is negligible and a separate budget may not be needed. Implement the alert when tracing exceeds $50/month.

**Consequences Of Violation**: Tracing costs grow unbounded, consuming an ever-larger share of the observability budget. The team optimizes the wrong components because they don't have component-level cost visibility.

---

## R5: Use OpenTelemetry for Vendor-Neutral Tracing

**Category**: Vendor Lock-in Prevention

**Rule**: ALWAYS use OpenTelemetry SDK for distributed tracing instrumentation. NEVER hardcode vendor-specific tracing SDKs (X-Ray SDK, Datadog APM library, New Relic agent).

**Reason**: OpenTelemetry is the industry standard for observability instrumentation — it provides vendor-neutral APIs that work with X-Ray, Datadog, New Relic, Grafana, and any OTel-compatible backend. If you hardcode a vendor-specific SDK, changing vendors (e.g., moving from Datadog to New Relic for cost reasons) requires code changes, re-deployment, and re-testing across all services. With OTel, switching backends is a configuration change — point the OTel collector to a new endpoint and restart.

**Bad Example**: A Laravel app uses the AWS X-Ray SDK for tracing. 6 months later, the team wants to switch to Datadog for unified observability. They must: (a) remove all X-Ray SDK calls, (b) install Datadog tracing library, (c) update all middleware, (d) retest tracing in all environments. Migration time: 2 weeks of engineering.

**Good Example**: The app uses OpenTelemetry PHP SDK for tracing. The OTel collector is configured to export to X-Ray. To switch to Datadog: change the OTel collector exporter to Datadog, restart the collector. Migration time: 1 hour. Zero code changes.

**Exceptions**: For single-vendor shops that will never change observability platforms, vendor-specific SDKs may have better Laravel integration and performance. But OTel's ecosystem support is rapidly closing the gap.

**Consequences Of Violation**: Significant migration cost when changing observability vendors — 2-4 weeks of engineering time. This "vendor lock-in tax" makes teams stick with expensive tools longer than they should, costing far more than the OTel migration would have.
