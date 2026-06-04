# Rule 1: Use Redis Cache Driver for Pulse

**Condition:** Configuring Pulse for production use.

**Action:** Set the application's cache driver to `redis` for Pulse production deployments. Pulse records and reads metric data from the cache store. Redis provides low-latency reads and writes suitable for real-time dashboard data.

**Consequence:** Redis-backed Pulse renders the dashboard in <50ms and handles high-frequency metric recording without contention. Database-backed Pulse degrades under load because recording and dashboard read from the same database.

# Rule 2: Configure Authorization for Production

**Condition:** Deploying Pulse to production.

**Action:** Add a Pulse authorization gate or middleware that restricts access to authenticated users with specific permissions. Use `Pulse::user()` in `AppServiceProvider` to define the authorization callback.

**Consequence:** Authorized Pulse prevents unauthorized access to application performance data (slow endpoints, error details, query information). Without authorization, `GET /pulse` is publicly accessible.

# Rule 3: Customize Dashboard Cards

**Condition:** Setting up the Pulse dashboard.

**Action:** Remove cards for features the application does not use (Horizon, Octane, etc.). Add custom cards for application-specific metrics. Arrange cards logically: system-level first, then application-specific.

**Consequence:** Customized dashboard shows only relevant data. Operators are not distracted by empty or irrelevant cards.

# Rule 4: Set ignore Patterns for Noisy Endpoints

**Condition:** Pulse dashboard shows excessive entries from health checks or polling endpoints.

**Action:** Configure `Pulse::ignore()` for high-frequency but low-value endpoints. Health check endpoints, websocket heartbeat endpoints, and monitoring probes should be ignored.

**Consequence:** Ignoring noisy endpoints keeps Pulse focused on user-facing traffic. Without ignore patterns, Pulse cards are dominated by health check requests that are not representative of user experience.

# Rule 5: Use Pulse Alongside Long-Term Solutions

**Condition:** Building a complete observability strategy.

**Action:** Use Pulse for real-time visibility (last hour). Use Nightwatch or Grafana for historical trends and long-term retention. Pulse is not a replacement for either.

**Consequence:** Complementing Pulse with long-term solutions provides both immediate visibility and historical analysis. Operators use Pulse for "what's happening now?" and Grafana for "what happened last week?"

# Rule 6: Monitor Pulse Storage

**Condition:** Pulse is running in production.

**Action:** Monitor cache store memory/space usage attributable to Pulse entries. For Redis-backed Pulse, monitor used_memory. For database-backed cache, monitor table size. Set alerts at 70% capacity.

**Consequence:** Storage monitoring prevents Pulse from degrading cache performance. Without monitoring, Pulse entries can fill the cache and evict other important cached data.

# Rule 7: Test Pulse in Staging First

**Condition:** Deploying Pulse to a new environment.

**Action:** Deploy Pulse to staging and verify: dashboard loads, all cards show data, recording does not increase request latency, cache store handles the additional load.

**Consequence:** Staging validation catches cache driver issues, authorization misconfiguration, or unexpected overhead before production deployment.

# Rule 8: Do Not Rely on Pulse for Alerting

**Condition:** Setting up production alerting.

**Action:** Use dedicated alerting tools (Grafana Alerting, Prometheus Alertmanager, Nightwatch alerts) for production notifications. Pulse does not provide alerting capabilities.

**Consequence:** Alerting tools provide notification when error rate spikes or latency increases during off-hours. Pulse is a dashboard for when someone is actively monitoring.
