# Rule 1: Keep Liveness Probe Dependency-Free

**Condition:** Implementing Kubernetes liveness probe configuration.

**Action:** Configure the liveness probe to check only process responsiveness — a simple HTTP ping to the PHP process. Do not include database, cache, or external service checks in the liveness probe.

**Consequence:** Dependency-free liveness prevents unnecessary container restarts. If the database is slow, the process is still alive and should not be restarted — only readiness should return unhealthy.

# Rule 2: Include Dependency Checks in Readiness

**Condition:** Implementing Kubernetes readiness probe configuration.

**Action:** Configure the readiness probe to check database connectivity, cache availability, queue connection, and other critical dependencies. Return 503 if any critical dependency is unavailable.

**Consequence:** Readiness probe ensures traffic is only routed to instances that can serve requests. An instance with a dead database returns 503 and the orchestrator stops routing traffic to it.

# Rule 3: Return Component-Level Health

**Condition:** Designing the health endpoint response format.

**Action:** Return a JSON structure with component-level status. Each component (database, cache, queue, storage) has its own status: healthy, degraded, or unhealthy. Include a human-readable message per component.

**Consequence:** Component-level health enables operators to quickly identify which dependency is failing without parsing logs. Automation tools can act on component-specific status.

# Rule 4: Cache Health Results

**Condition:** Health endpoint is called frequently (every 10-30 seconds by orchestrator).

**Action:** Cache component check results for 5-10 seconds. Use Laravel cache with short TTL. Each check caches its result keyed by check name.

**Consequence:** Caching prevents dependency hammering. Without caching, 100 pods each checking every 15 seconds generates 400 database queries per minute for the health endpoint alone.

# Rule 5: Do Not Authenticate Health Routes

**Condition:** Registering the health endpoint route.

**Action:** Place the health endpoint outside authenticated route groups. Use a dedicated middleware that skips auth checks. The endpoint must respond to unauthenticated requests from load balancers and orchestrators.

**Consequence:** Unauthenticated health routes ensure orchestrators can check health without bearer tokens. Authenticated health routes cause orchestrators to mark instances as unhealthy.

# Rule 6: Use Startup Probe for Slow-Starting Apps

**Condition:** Application takes >10 seconds to start (migrations, warmup, cache rebuild).

**Action:** Configure a Kubernetes startup probe with a longer initial delay (60-120s) that checks the same endpoint as readiness. Once startup succeeds, liveness and readiness take over.

**Consequence:** Startup probe prevents unnecessary restarts during slow initialization. Without it, liveness probe fails during startup and the orchestrator kills the container before it finishes initializing.

# Rule 7: Health Checks Must Be Read-Only

**Condition:** Writing health check logic.

**Action:** Do not write to any system during health checks. No database inserts, cache writes, file writes, or queue pushes. Health checks should only query status.

**Consequence:** Read-only health checks are safe under any load. Health checks that modify state can cause write contention, trigger side effects, or accumulate garbage data.

# Rule 8: Set Realistic Check Timeouts

**Condition:** Configuring dependency check timeouts within health checks.

**Action:** Set timeouts that match production latency patterns: database 2s, cache 1s, queue 2s, external API 5s. Short timeouts (<500ms) cause false failures under normal load.

**Consequence:** Realistic timeouts prevent false-positive health failures. Overly aggressive timeouts cause the orchestrator to mark instances as unhealthy during routine latency spikes.
