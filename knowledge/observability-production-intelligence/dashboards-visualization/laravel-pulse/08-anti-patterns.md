# Anti-Pattern 1: Database Cache Driver Under Load

**Name:** Pulse with database cache in production

**Problem:** Using the database cache driver for Pulse in a production environment with >1K RPM traffic. Pulse records metric data by writing to the cache (database), and the dashboard reads from the same database. Write contention and read latency degrade both the application and the dashboard.

**Detection:** Pulse dashboard loads slowly (>2s). Database query logs show high volume on cache table. Application response times increase after Pulse deployment.

**Remediation:** Switch Pulse cache driver to Redis. Redis is designed for high-frequency read/write operations. Database cache driver is acceptable for low-traffic or development environments only.

**Prevention:** Use Redis cache driver for all production Pulse deployments. If Redis is not available, evaluate whether Pulse can adequately handle traffic levels before enabling.

# Anti-Pattern 2: Public Pulse Dashboard

**Name:** Unauthorized access to Pulse

**Problem:** Deploying Pulse to production without configuring authorization. The `/pulse` route is publicly accessible by default in local environment. In production, anyone with the URL can view application performance data, endpoint names, slow queries, and error details.

**Detection:** Pulse dashboard is accessible without authentication. URL is not restricted by middleware or gate.

**Remediation:** Add Pulse authorization callback in AppServiceProvider. Restrict access to authenticated users with admin role or specific permission.

**Prevention:** Configure Pulse authorization before deploying to production. Test that unauthenticated users receive 403.

# Anti-Pattern 3: Pulse as Only Observability

**Name:** Sole reliance on Pulse for observability

**Problem:** Using Pulse as the only observability tool. Pulse shows only the last hour of data. When an incident occurs at 3 AM and Pulse is not monitored, the incident is not detected. When post-incident analysis requires data from last week, Pulse cannot provide it.

**Detection:** No historical data available for post-incident analysis. Incidents are detected by user complaints, not monitoring tools.

**Remediation:** Add at least one long-term observability tool (Nightwatch, Grafana + Prometheus) alongside Pulse. Configure alerts for off-hours incident detection.

**Prevention:** Pulse is a real-time dashboard for active monitoring. Always pair with historical storage and alerting. Pulse covers "what's happening now?" — the other tools cover "what happened while we were asleep?"

# Anti-Pattern 4: No Ignore Patterns

**Name:** Health check noise in Pulse

**Problem:** Health check endpoints and monitoring probes appear as top slow requests or top errors in Pulse. Operators spend time investigating health check entries that are not representative of user experience.

**Detection:** Pulse cards show health check endpoints as top entries. Error rate includes 404s from monitoring probes scanning the application.

**Remediation:** Add `Pulse::ignore('/health*')` and similar patterns for all monitoring endpoints.

**Prevention:** Before deploying Pulse, identify all endpoints that should be excluded (health checks, metrics endpoints, monitoring probes). Configure ignore patterns in PulseServiceProvider.
