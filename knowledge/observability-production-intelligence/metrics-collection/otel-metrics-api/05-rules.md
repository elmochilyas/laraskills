# Rule 1: Match Instrument Type to Behavior

**Condition:** Selecting an OTel instrument for a numerical measurement.

**Action:** Use Counter for monotonic cumulative values (request count, bytes written). Use UpDownCounter for values that increase and decrease (queue depth, active connections). Use Histogram for distribution measurements (latency, payload size). Use ObservableGauge for externally-sampled values (memory usage, CPU load).

**Consequence:** Correct instrument type ensures accurate query semantics. Counter with `rate()` gives per-second rate. Histogram enables percentile calculations. Wrong instrument type produces misleading or broken queries.

# Rule 2: Limit Attribute Cardinality

**Condition:** Adding attributes to metric instruments.

**Action:** Keep unique attribute values below 100 per attribute key. Never use user IDs, email addresses, session tokens, or request IDs as metric attributes. Use attributes that represent categories (endpoint name, HTTP method, status code, service name, tenant).

**Consequence:** Low cardinality (<1000 total time series per metric) ensures Prometheus performance, fast dashboard queries, and reasonable storage costs. High cardinality (>10,000) degrades Prometheus performance and increases storage costs exponentially.

# Rule 3: Name Metrics Consistently

**Condition:** Defining metric names in OTel instruments.

**Action:** Follow OpenTelemetry semantic convention format: `{domain}.{name}.{unit}`. Examples: `http.server.request.duration`, `db.client.queries.count`. Use snake_case, lowercase, and dots for hierarchy.

**Consequence:** Consistent naming enables cross-service dashboards and PromQL queries. Inconsistent naming causes confusion when building alerts or dashboards across multiple services.

# Rule 4: Configure Meter Per Domain

**Condition:** Creating Meter instances in the application.

**Action:** Create separate Meter instances per business domain (`orders`, `users`, `payments`). Each Meter should have a name and version. Group related instruments under the same Meter.

**Consequence:** Domain-organized meters keep metric namespaces clean, prevent naming collisions, and make it clear which team owns which metrics.

# Rule 5: Configure Aggregation Temporality

**Condition:** Setting up MetricReader or MetricExporter.

**Action:** Use Delta aggregation temporality for Prometheus-compatible metric queries. Use Cumulative temporality when the query backend expects total values since process start (e.g., Datadog). Match the temporality to the query backend's expectations.

**Consequence:** Correct temporality ensures that `rate()`, `increase()`, and `avg_over_time()` return meaningful values. Wrong temporality produces incorrect query results.

# Rule 6: Set Appropriate Export Interval

**Condition:** Configuring MetricReader export interval.

**Action:** Set export interval based on alerting requirements: 15-30s for fast alerting (error rate spikes), 60s for standard metrics, 300s+ for trend-only metrics (capacity planning). Each concurrent MetricReader adds memory pressure.

**Consequence:** Shorter intervals increase CPU/memory but provide granular data for alerting. Longer intervals reduce resource usage but delay metric visibility.

# Rule 7: Sanitize Metric Attributes

**Condition:** Recording metric values with attributes.

**Action:** Review attribute values before recording. Strip PII (email, IP, user ID). Validate attribute values against allowed set. Reject or sanitize unexpected values.

**Consequence:** Sanitized attributes prevent data leaks in dashboards and alerts. Unsanitized attributes can expose customer data in observable systems.

# Rule 8: Test Metric Instrumentation

**Condition:** Deploying instrumented code to production.

**Action:** Verify metrics appear in the backend (Prometheus, Grafana) after deployment. Check that metric values are plausible (not zero, not negative for Counter). Validate cardinality in staging before production.

**Consequence:** Tested metrics ensure that observability investment pays off. Untested metrics may silently produce zero values or break on attribute changes.
