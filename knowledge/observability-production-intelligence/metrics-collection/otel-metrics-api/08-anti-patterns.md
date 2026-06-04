# Anti-Pattern 1: Wrong Instrument Type

**Name:** Counter for non-monotonic values

**Problem:** Using Counter for queue depth, active connections, or other values that can decrease. Counter assumes monotonic increase; decreases create negative increments that are silently ignored by some backends.

**Detection:** Metric has `rate()` that occasionally drops to zero or negative values. Backend logs show "negative counter increment" warnings.

**Remediation:** Replace Counter with UpDownCounter for values that can increase and decrease. Replace with ObservableGauge for externally-sampled values.

**Prevention:** When choosing an instrument, ask: "Can this value ever go down?" If yes, use UpDownCounter or ObservableGauge.

# Anti-Pattern 2: High Cardinality Attributes

**Name:** User IDs as metric labels

**Problem:** Adding unique identifiers (user_id, session_id, request_id, email) as metric attributes. Each unique value creates a separate time series. With 10,000 users, a single metric creates 10,000+ time series.

**Detection:** Prometheus storage grows rapidly. Dashboard queries become slow. Metric has thousands of unique label combinations.

**Remediation:** Remove high-cardinality attributes from metrics. Move per-user data to application databases or logs.

**Prevention:** Review attribute uniqueness before adding. If an attribute can have >100 unique values, exclude it from metrics.

# Anti-Pattern 3: Metrics Instead of Logs

**Name:** Adding Log-Context to Metrics

**Problem:** Adding request-level details (URL path, query parameters, user agent) as metric attributes to preserve debugging context. This creates thousands of time series and defeats the purpose of metrics as aggregated data.

**Detection:** Metric cardinality exceeds 10,000. Attributes include request IDs or full endpoint paths with parameters.

**Remediation:** Remove request-specific attributes from metrics. Add structured logging for debugging. Add distributed tracing for request flows.

**Prevention:** If the data point is useful by itself (not aggregated), it's a log or span, not a metric. Metrics are for counting and measuring distributions — not for recording individual events with full context.

# Anti-Pattern 4: No Temporality Strategy

**Name:** Mismatched aggregation temporality

**Problem:** Using Cumulative temporality when the query expects rate (Delta), or vice versa. Prometheus `rate()` on cumulative metrics works but produces warnings. Delta temporality on cumulative queries misses resets.

**Detection:** Grafana graphs show unexpected spikes or drops. Queries using `rate()` return confusing results.

**Remediation:** Configure Delta temporality for MetricReader if the query backend expects rates. Configure Cumulative if the backend expects totals.

**Prevention:** Understand the query backend's expectation before configuring temporality. Prometheus natively handles both but Delta is cleaner for rate queries.

# Anti-Pattern 5: Unprotected Business Metrics

**Name:** Public metrics endpoint

**Problem:** Exposing revenue counts, user growth, or order processing rates on a public `/metrics` endpoint without authentication. Competitors or malicious actors can access business-sensitive data.

**Detection:** Metrics endpoint is accessible from the public internet or unauthenticated.

**Remediation:** Move metrics endpoint to internal network. Add HTTP basic auth. Restrict to admin-only routes.

**Prevention:** Always require authentication or network-level access control for metrics endpoints. Review metric data for business sensitivity before exposing.
