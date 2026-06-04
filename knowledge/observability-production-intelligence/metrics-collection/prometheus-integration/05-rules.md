# Rule 1: Prefer Scrape Over Push

**Condition:** Choosing a metrics collection model for long-lived Laravel processes (web servers, queue workers with persistent connections).

**Action:** Export metrics via a scrape endpoint rather than Pushgateway. Expose a `/metrics` HTTP endpoint (either directly via Prometheus exporter or via OTel Collector scrape endpoint). Configure Prometheus `scrape_configs` to target the endpoint.

**Consequence:** Scrape-based collection provides automatic target health checks, stale metric detection, and parallel collection. Pushgateway creates a single point of failure and requires careful cleanup of stale metrics.

# Rule 2: Use OTel SDK as Primary Metrics API

**Condition:** Choosing an instrumentation library for new Laravel applications.

**Action:** Use the OpenTelemetry PHP SDK Metrics API for instrument generation. Export via OTLP to OpenTelemetry Collector. Configure Collector's Prometheus exporter for Prometheus scraping.

**Consequence:** Vendor-neutral instrumentation that can be consumed by any backend. One instrumentation codebase for Prometheus, Datadog, or other backends.

# Rule 3: Secure the Metrics Endpoint

**Condition:** Exposing a Prometheus scrape endpoint (direct or via Collector).

**Action:** Restrict the metrics endpoint to internal network access. Do not expose on public-facing routes. Use internal DNS for Prometheus target configuration. Add HTTP basic auth or mTLS if network-level isolation is not possible.

**Consequence:** Internal metrics (request rates, error counts, endpoint latency) remain confidential. Public exposure reveals application performance characteristics and business metrics.

# Rule 4: Limit Pushgateway to Short-Lived Jobs

**Condition:** Deciding whether to use Pushgateway for metric collection.

**Action:** Use Pushgateway exclusively for short-lived batch jobs (queue workers, cron tasks, CLI commands) that finish before the next Prometheus scrape interval. Push metrics on job completion, not per-request.

**Consequence:** Correct Pushgateway usage avoids stale metric accumulation and single-point-of-failure risks. Misuse creates operational headaches.

# Rule 5: Monitor Cardinality Growth in Staging

**Condition:** Deploying new metric instrumentation.

**Action:** Before deploying to production, verify in staging that each metric has the expected number of time series. Use Prometheus `count by (__name__)` queries or cardinality dashboards. Set cardinality alert thresholds.

**Consequence:** Early detection of cardinality explosions prevents production performance degradation.

# Rule 6: Label Metrics Consistently

**Condition:** Adding labels to Prometheus-exposed metrics.

**Action:** Use consistent label names across all services for the same concept: always `service`, `env`, `method`, `status_code`, not `service_name`, `environment`, `http_method`.

**Consequence:** Consistent label names enable cross-service PromQL queries and federation dashboards. Inconsistent labels require tedious PromQL `or` and label replacement in every query.

# Rule 7: Set Appropriate Scrape Interval

**Condition:** Configuring Prometheus scrape_jobs.

**Action:** Set scrape interval based on metric velocity: 15s for time-critical metrics (error rate, queue depth), 30-60s for standard metrics (request count, latency). Match the interval to the alert rule evaluation interval.

**Consequence:** Proper interval alignment prevents query-alias effects in PromQL (empty results because metrics haven't been scraped yet).

# Rule 8: Handle Counter Resets in Queries

**Condition:** Writing PromQL queries for counter-based metrics.

**Action:** Always use `rate()` or `increase()` for counter metrics in dashboard panels and alert rules. Avoid raw counter queries that display process restarts as misleading value drops.

**Consequence:** `rate()` normalizes counter resets and provides meaningful per-second rates. Raw counter queries confuse operators with sudden value drops on process restart.
