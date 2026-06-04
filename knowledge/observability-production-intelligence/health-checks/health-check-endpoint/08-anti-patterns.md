# Anti-Pattern 1: Database Queries in Liveness Probe

**Name:** Liveness probe dependency cascading

**Problem:** Including database connectivity checks in the Kubernetes liveness probe. When the database is slow or unreachable, the liveness probe fails, causing the orchestrator to restart the container. The database is still unavailable for the new container, creating a restart loop.

**Detection:** Pods restart in a loop during database outages. Liveness probe logs show database timeout or connection refused errors.

**Remediation:** Move database checks to the readiness probe. Liveness should only check process responsiveness (PHP-FPM ping, HTTP 200). Update Kubernetes probe configuration.

**Prevention:** Liveness probes check "is the application process alive?" — not "are all dependencies available?" If the answer requires a database call, it belongs in readiness, not liveness.

# Anti-Pattern 2: Authenticated Health Endpoint

**Name:** Health check behind auth middleware

**Problem:** Placing the health endpoint behind Laravel authentication middleware. Load balancers and orchestrators call the health endpoint without bearer tokens, sessions, or API keys. The endpoint returns 401 or 302 (login redirect), and the orchestrator marks the instance as unhealthy.

**Detection:** Orchestrator logs show health check returning 401. All instances appear unhealthy. Traffic routing breaks.

**Remediation:** Move health endpoint outside authenticated route groups. Apply a `skipAuth` middleware to health routes. Test without authentication tokens.

**Prevention:** Health endpoints should be in a dedicated route group with no global auth middleware. Always verify health endpoint returns 200 without any auth header.

# Anti-Pattern 3: Health Check That Writes State

**Name:** Read-write health check

**Problem:** Health check writes a timestamp, increments a counter, or creates a test record. During high load, the health check is called frequently (every 10-30 seconds per pod), creating write contention on the database or cache.

**Detection:** Database shows high write volume from health check calls. Connection pool exhaustion during incidents partially caused by health check writes.

**Remediation:** Remove all write operations from health check logic. Health checks should only read status, never modify it.

**Prevention:** Health checks are read-only operations. If the check modifies any state, it is not a health check — it is a maintenance task that should run on a schedule.

# Anti-Pattern 4: Monolithic Health Response

**Name:** All-or-nothing health status

**Problem:** Returning a single `{"status": "ok"}` or `{"status": "error"}` response with no component-level detail. When the health endpoint fails, operators have no information about which dependency caused the failure.

**Detection:** Health endpoint returns HTTP 503 with no body or a generic error message. Operators must SSH into the instance or check logs to understand the cause.

**Remediation:** Expand health response to include component-level status: `{"status": "degraded", "components": {"database": "healthy", "cache": "unhealthy"}}`.

**Prevention:** Design health response structure upfront with component-level detail. Each component check independently reports its status.
