# Anti-Pattern 1: All Checks on Endpoint

**Name:** Endpoint overload with slow checks

**Problem:** Registering all checks (including slow ones like S3 connectivity, full database query, or external API health) to run on the endpoint. The orchestrator calls the endpoint every 10-30 seconds, and slow checks cause timeouts, which cause the orchestrator to mark instances as unhealthy.

**Detection:** Health endpoint response time exceeds 1 second. Orchestrator logs show health check timeouts. Pods are frequently restarted or traffic-routing failures occur.

**Remediation:** Move slow checks (>200ms) to scheduled execution using `->onSchedule()`. Keep only fast, critical checks on the endpoint.

**Prevention:** Profile each check before adding to endpoint. If execution >200ms, assign to schedule. If check involves network calls beyond local infrastructure, assign to schedule.

# Anti-Pattern 2: No Result Store Pruning

**Name:** Unbounded result store growth

**Problem:** Enabling the result store without configuring pruning. Health check results accumulate indefinitely. The `health_check_results` table grows to millions of rows, slowing queries and consuming disk space.

**Detection:** health_check_results table has millions of rows. Queries for recent results are slow. Disk usage grows steadily.

**Remediation:** Add `prunable()` trait to the HealthCheckResult model. Configure `pruneAfterDays()` to 7. Add `model:prune` to the scheduler.

**Prevention:** Always configure pruning when enabling result store. Set retention based on debugging needs — 7 days is typically sufficient for post-incident analysis.

# Anti-Pattern 3: Notification Storm from Transient Failures

**Name:** Every failure triggers notification

**Problem:** Configuring notifications with `failed` failure mode. A transient connection timeout (500ms timeout, resolves on retry) triggers a Slack notification. Three check intervals = three notifications for a single transient issue.

**Detection:** Notification channel (Slack, email, Discord) has repeated messages for the same check within minutes. Team members start ignoring health notifications.

**Remediation:** Switch to `stopped` failure mode. Configure notification throttle if available. Set check `retry()` for transient failures.

**Prevention:** Use `stopped` mode as default for all checks. Only use `failed` for checks where every single failure requires immediate human action.

# Anti-Pattern 4: Check Throws Uncaught Exception

**Name:** Custom check exception breaks endpoint

**Problem:** A custom Check class throws an uncaught exception (connection timeout, HTTP error, invalid response signature). The exception propagates up and breaks the entire health endpoint, returning HTTP 500 instead of a component-level 503 status.

**Detection:** Health endpoint returns HTTP 500 with no useful body. Check logs show PHP exceptions from the health check.

**Remediation:** Wrap all check logic in try-catch. Always return `Result::ok()` or `Result::failed()` — never let exceptions propagate.

**Prevention:** Template for custom checks: start with try-catch, return `Result::ok()` on success, `Result::failed()` on failure, `Result::ok()->warning()` for degraded state. Never throw from run().
