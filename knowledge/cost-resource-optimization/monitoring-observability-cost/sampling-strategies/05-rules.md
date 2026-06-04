# Sampling Strategies — Rules

## R1: Always Sample Healthy Requests, Never Errors

**Category**: Priority Sampling

**Rule**: ALWAYS sample healthy (2xx/3xx) requests at 1-5% rate. NEVER sample error (4xx/5xx) requests — retain them at 100%.

**Reason**: Errors represent 1-5% of traffic but provide 90% of debugging value. Sampling errors means missing incident signals — a critical error that occurs in the sampled-out portion will not appear in traces. Healthy requests represent 95%+ of traffic and provide negligible individual debugging value — their value is in aggregate statistics (p50/p95 latency, volume trends). Retaining 100% of errors and 1-5% of healthy requests reduces trace volume by 90-95% while preserving all debugging signal.

**Bad Example**: A team implements 5% random sampling across all requests (healthy + errors). A payment gateway failure affects 0.5% of requests — these are rare. With 5% sampling, only 1 in 20 error occurrences is captured. The team has only 2 trace samples of the failure — insufficient to diagnose root cause. Investigation takes 3 days.

**Good Example**: Priority sampling: 100% of 4xx/5xx traces retained, 100% of traces >500ms retained, 5% of healthy traces retained. The payment gateway failure appears in every occurrence — 50 traces showing the exact error pattern. Diagnosis: 30 minutes.

**Exceptions**: For apps with <10 req/s, errors are so rare that the cost of 100% sampling is negligible. Keep all traces.

**Consequences Of Violation**: Incidents are invisible in monitoring data. The most critical debugging information (errors) is sampled out, delaying incident response by hours or days.

---

## R2: Use Consistent Sample Rate Across All Services in a Trace

**Category**: Trace Consistency

**Rule**: ALWAYS coordinate sampling decisions across all services involved in a trace using trace ID hash-based deterministic sampling. NEVER set independent sample rates per service.

**Reason**: A distributed trace spans multiple services (web → queue → worker → external API). If the web service samples a trace at 10% but the queue service samples independently at 1%, only 0.1% of traces are complete across both services. Incomplete traces (missing spans) are useless for debugging — you can't see the full request flow. Trace ID hash-based sampling ensures all services make the same sampling decision for the same trace ID.

**Bad Example**: Web service samples at 10%. Queue worker samples at 5%. A trace sampled by the web service (trace ID: abc123) is sent to the queue worker, which independently decides not to sample it (different random decision). The trace in Datadog shows the HTTP request but not the queue processing. Incomplete trace, zero debugging value.

**Good Example**: Both services use deterministic sampling: if hash(trace_id) % 100 < 10, sample. For trace ID abc123, hash = 7, both services sample. The complete trace shows HTTP request → queue → worker → database. Full visibility into the request flow.

**Exceptions**: Single-service Laravel apps (no queue workers, no external service calls) don't need coordinated sampling — head-based sampling at the app level is sufficient.

**Consequences Of Violation**: The majority of traces are incomplete — missing key spans. Teams debug with incomplete data, leading to incorrect root cause analysis and extended MTTR.

---

## R3: Implement Dynamic Sampling — Adjust Rate with Traffic Volume

**Category**: Adaptive Rate

**Rule**: ALWAYS adjust the sample rate inversely with traffic volume. Use a higher sample rate at low traffic (e.g., 10% at 10 req/s) and a lower rate at high traffic (e.g., 1% at 1000 req/s). NEVER use a static sample rate across all traffic levels.

**Reason**: Statistical significance depends on the number of samples, not the sample percentage. 10 samples per second provides the same statistical power regardless of whether that's 10% of 100 req/s or 1% of 1000 req/s. A static 1% rate at 10 req/s gives only 0.1 samples/second — insufficient for percentile calculations. Dynamic sampling maintains consistent statistical power while keeping data volume stable.

**Bad Example**: Static 5% sampling rate on a service with 50x traffic variation (10 req/s at night, 500 req/s at peak). At night: 0.5 samples/sec (too few). At peak: 25 samples/sec (unnecessary volume). Data quality is poor at low traffic, excessive cost at high traffic.

**Good Example**: Dynamic sampling targets 10 samples/second. At 10 req/s: sample at 100%. At 100 req/s: sample at 10%. At 1000 req/s: sample at 1%. Constant data quality, constant data volume, cost proportional to value (more samples per second at higher traffic is wasteful).

**Exceptions**: For apps with very stable traffic patterns (<2x variation), a static rate is acceptable. Use dynamic sampling when traffic varies by 5x or more.

**Consequences Of Violation**: Either poor data quality during low traffic (too few samples) or excessive cost during high traffic (too many samples). Both undermine the value proposition of sampling.

---

## R4: Use Pre-Aggregation for Metrics — Don't Emit Per-Request Metrics

**Category**: Metric Sampling

**Rule**: ALWAYS compute percentiles and counts in application code and emit aggregated metrics. NEVER emit one metric data point per request or per event.

**Reason**: Emitting per-request metrics creates high cardinality — each request generates a new data point with potentially unique dimension values. This multiplies metric costs linearly with traffic. Pre-aggregating into percentile buckets (p50, p95, p99, count, sum) reduces the metric emission rate from N per second to 1 per minute regardless of traffic volume. The aggregated metrics provide the same trend visibility at a fraction of the cost.

**Bad Example**: A middleware emits `request.duration` with dimensions `endpoint` and `status_code` on every request. At 500 req/s with 50 endpoints, this creates 25,000 metric data points per second. Monthly metric cost: $500-1,000+ from cardinality explosion.

**Good Example**: Every 60 seconds, the application computes p50, p95, p99, count, and sum for each endpoint group. Emit 5 metrics x 10 endpoint groups = 50 data points per minute. Monthly metric cost: $15-30/month. 96% cost reduction with equivalent signal.

**Exceptions**: Real-time alerting on individual slow requests (e.g., alert if ANY single request exceeds 10 seconds) needs per-request data. But this is better handled by log-based alerting than custom metrics.

**Consequences Of Violation**: Metric costs scale with traffic, making them unpredictable. A service that doubles traffic doubles its metric bill.

---

## R5: Test Sampling Coverage Quarterly — Simulate Error Scenarios

**Category**: Validation

**Rule**: ALWAYS test sampling configuration quarterly by simulating error scenarios and verifying they appear in traces. NEVER assume sampling configuration is correct without validation.

**Reason**: Sampling configurations can drift over time — agent updates may change default rates, configuration files may be overwritten, new services may be deployed with default (no sampling) settings. Quarterly validation by injecting known errors and confirming they appear in traces ensures coverage is working as designed. Without testing, a broken sampling configuration could silently cause 0% error trace capture.

**Bad Example**: A team configures 100% error trace sampling. After an agent upgrade, the sampling configuration file is overwritten with defaults — 1% random sampling (including errors). A production incident generates 500 error responses, but only 5 traces are captured. The team has insufficient data to diagnose the root cause. The broken sampling goes unnoticed for 3 months.

**Good Example**: The team simulates an error scenario quarterly: send a request that returns a 500 error, then verify in the trace explorer that the error trace is captured at 100%. The quarterly test after the agent upgrade catches the broken configuration immediately. Fix time: 15 minutes. No incidents missed.

**Exceptions**: For stable, rarely-changed monitoring configurations with locked-down CI/CD deployment, reduce testing to bi-annual. For frequently-updated environments, test monthly.

**Consequences Of Violation**: Broken sampling goes undetected for weeks or months. During that period, zero error traces are captured. Incident post-mortems have no trace data, making root cause analysis significantly harder.
