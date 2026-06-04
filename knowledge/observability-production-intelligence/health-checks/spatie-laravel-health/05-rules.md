# Rule 1: Separate Endpoint Checks from Scheduled Checks

**Condition:** Configuring Spatie Laravel Health checks.

**Action:** Configure fast checks (database ping, Redis ping) for the endpoint and slow/comprehensive checks (full integration tests, S3 connectivity) for scheduled execution. Use the `checks` method in `HealthServiceProvider` to register checks, then use `->onEndpoint()` and `->onSchedule()` to assign execution contexts.

**Consequence:** Endpoint remains fast (<500ms) for orchestrator probes. Comprehensive checks run in the background without affecting request time.

# Rule 2: Enable Result Store with Pruning

**Condition:** Using Spatie Laravel Health result store.

**Action:** Enable the result store with Eloquent driver. Configure pruning to keep only the last 7 days of results. Use Laravel's model pruning or a scheduled task to clean up old records.

**Consequence:** Result store provides historical analysis for troubleshooting. Pruning prevents unbounded table growth.

# Rule 3: Use Stopped Failure Mode for Notifications

**Condition:** Configuring health check notifications.

**Action:** Use the `stopped` failure mode instead of `failed` — send notification only when a check transitions to failed AND stays failed on the next run. This prevents notification storms from transient failures.

**Consequence:** Stopped mode significantly reduces alert fatigue. A database timeout triggers one notification, not three (one per check interval).

# Rule 4: Set Realistic Timeouts

**Condition:** Configuring individual health checks.

**Action:** Set check-specific timeouts based on production latency: Database 2s, Redis 1s, Queue 2s, HTTP API 5s. Use the `retry()` helper for transient failures — retry once after 500ms before marking as failed.

**Consequence:** Realistic timeouts prevent false failures. Retry logic handles transient network issues without operator intervention.

# Rule 5: Create Custom Checks for App Dependencies

**Condition:** Application depends on external services (third-party APIs, custom services).

**Action:** Create custom Check classes for each application-specific dependency. Follow the Check interface: `run()` returns `Result::ok()` or `Result::failed()`. Register in the health configuration.

**Consequence:** Comprehensive coverage ensures the health endpoint accurately reflects application readiness. Missing custom checks create false positives — endpoint says healthy but app cannot function.

# Rule 6: Monitor Health Check Results

**Condition:** Operating health checks in production.

**Action:** Create a dashboard panel showing health check results over time. Alert on checks that consistently fail or show high latency. Track flapping checks (healthy → unhealthy → healthy within minutes).

**Consequence:** Health check monitoring reveals dependency trends before they cause incidents. Flapping checks indicate unstable infrastructure that needs attention.

# Rule 7: Review Check Output for Sensitive Data

**Condition:** Configuring check result messages.

**Action:** Review all check result messages for sensitive information. Messages like "Connected to database at db.internal:3306/mydb" reveal connection details. Use generic messages: "Database connection successful".

**Consequence:** Safe result messages prevent infrastructure details from leaking via health endpoints or result store access.

# Rule 8: Test Health Checks in CI/CD Pipeline

**Condition:** Pre-deployment validation.

**Action:** Run `php artisan health:check --fail-command-on-failing-check` in CI/CD before deployment. This catches misconfigured checks before they reach production.

**Consequence:** CI/CD validation prevents broken health checks from deploying. A health check that throws an exception breaks the health endpoint for all instances.
