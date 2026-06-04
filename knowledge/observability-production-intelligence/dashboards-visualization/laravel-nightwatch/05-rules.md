# Rule 1: Enable Watchers Selectively

**Condition:** Configuring Nightwatch SDK in the Laravel application.

**Action:** Enable only the watchers that provide actionable insight for the application: HttpRequestWatcher, QueryWatcher, QueueJobWatcher, ExceptionWatcher. Disable watchers for mail, notifications, cache, and custom events unless they are actively being debugged.

**Consequence:** Selective watchers reduce SDK overhead, network bandwidth, and server storage. Each disabled watcher eliminates 1-5% of instrumentation overhead.

# Rule 2: Configure PII Redaction

**Condition:** Application handles user data (PII, financial, medical).

**Action:** Configure Nightwatch input redaction in the SDK configuration. Add patterns for sensitive fields (password, ssn, credit_card, token, secret). Use wildcard patterns for comprehensive coverage.

**Consequence:** Redaction prevents sensitive user data from being stored in Nightwatch's observability database. Without redaction, request payloads containing PII are stored in plain text.

# Rule 3: Send Deployment Events

**Condition:** Deploying a new version of the Laravel application.

**Action:** Configure the CI/CD pipeline to send a deployment event to Nightwatch after each successful deployment. Include version tag, commit hash, and environment.

**Consequence:** Deployment events enable Nightwatch's deployment-correlation feature. Performance or error rate changes are immediately linkable to the deployment that caused them.

# Rule 4: Set Alerts for Critical Metrics

**Condition:** Configuring Nightwatch alert rules.

**Action:** Set alerts for: error rate >5% over 5 minutes, p95 latency >1000ms over 5 minutes, queue failure rate >1%, and any 5xx spike >2x normal. Configure notification channels for each alert.

**Consequence:** Alerts surface issues between monitoring sessions. Without alerts, incidents may go undetected for hours until someone checks the dashboard.

# Rule 5: Profile Watcher Overhead in Staging

**Condition:** Deploying Nightwatch for the first time or enabling new watchers.

**Action:** Compare request duration with and without Nightwatch enabled in staging. Measure p50, p95, and p99 latency. If overhead exceeds 5% of request time, disable non-critical watchers.

**Consequence:** Profiling ensures Nightwatch does not degrade production performance. Without profiling, watcher overhead can silently increase request times.

# Rule 6: Align Retention with Capacity Planning

**Condition:** Configuring Nightwatch data retention.

**Action:** Calculate expected daily data volume based on request count and enabled watchers. Configure retention to match available storage with 30% headroom. Monitor storage growth weekly.

**Consequence:** Proactive retention planning prevents Nightwatch server from running out of disk space. Without planning, retention must be emergency-reduced when storage fills.

# Rule 7: Use Nightwatch Alongside Infrastructure Monitoring

**Condition:** Building a complete observability strategy.

**Action:** Use Nightwatch for application-level observability (requests, queries, jobs). Use separate infrastructure monitoring (Node Exporter, Grafana) for server CPU, memory, disk, and network.

**Consequence:** Nightwatch covers what it's designed for (Laravel application internals). Infrastructure monitoring covers what Nightwatch does not (server health). Together they provide complete observability.

# Rule 8: Test Nightwatch SDK Update in Staging

**Condition:** Upgrading Nightwatch SDK to a new version.

**Action:** Deploy SDK update to staging first. Verify all watchers function correctly. Check that data appears in Nightwatch dashboard. Monitor error logs for SDK-related issues.

**Consequence:** Staging validation catches SDK compatibility issues before production. Nightwatch SDK updates can introduce breaking configuration changes.
