# Anti-Pattern 1: Pushgateway for Web Servers

**Name:** Metrics via Pushgateway for HTTP services

**Problem:** Sending per-request metrics to Pushgateway instead of exposing a scrape endpoint. Pushgateway becomes a bottleneck, accumulates stale metrics from dead instances, and loses instance-level granularity.

**Detection:** Pushgateway has metrics from long-terminated instances. Pushgateway becomes a performance bottleneck. Prometheus scrape targets list is empty — all metrics come from Pushgateway.

**Remediation:** Expose a `/metrics` scrape endpoint for web server and long-lived worker processes. Use Pushgateway only for batch jobs or cron tasks.

**Prevention:** If the process serves HTTP requests or runs indefinitely, use scrape. If the process starts, completes work, and exits, use Pushgateway.

# Anti-Pattern 2: Unprotected /metrics Endpoint

**Name:** Public metrics endpoint

**Problem:** Exposing the Prometheus scrape endpoint on a public route without authentication. Internal operational data (request patterns, error rates, latency distributions) is accessible to anyone.

**Detection:** `GET /metrics` returns valid exposition format from outside the internal network. No authentication required.

**Remediation:** Move the metrics endpoint to a non-public route. Add HTTP basic auth or mTLS. Configure the web server to block external access.

**Prevention:** Metrics endpoints should always be treated as internal. Default whitelist approach: only allow known monitoring IPs or use internal DNS.

# Anti-Pattern 3: Direct Counter Queries

**Name:** Raw counter value display

**Problem:** Displaying raw counter values in dashboards without `rate()` or `increase()`. Dashboards show sudden drops on process restart, making it impossible to distinguish actual value changes from restarts.

**Detection:** Dashboard graphs show unexpected spikes to zero or negative values. Counter values are displayed as absolute cumulative numbers.

**Remediation:** Always wrap counter metrics in `rate()` or `increase()` in panel queries. Use `rate(metric[5m])` for per-second rate or `increase(metric[5m])` for per-interval increase.

**Prevention:** Never use a counter metric directly in a dashboard panel. Always use `rate()` or `increase()`. Add this to team dashboard review checklist.

# Anti-Pattern 4: No Label Strategy

**Name:** Ad-hoc metric labels

**Problem:** Adding metric labels without a convention or cardinality review. Different services use different label names for the same concept. Exposed metrics have dozens of dynamic labels.

**Detection:** Cross-service PromQL queries require label renaming. Metrics have >10 unique labels. Labels include user IDs or request IDs.

**Remediation:** Establish a label convention document. Review existing metrics for label compliance. Consolidate label names across services.

**Prevention:** Define labels per service in a shared convention: `service`, `env`, `method`, `status_code`, `endpoint`, `version`. Review metrics in CI for label cardinality.
