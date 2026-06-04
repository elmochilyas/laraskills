# Anti-Pattern 1: Nightwatch as Sole Observability

**Name:** Only Nightwatch, no infrastructure monitoring

**Problem:** Relying entirely on Nightwatch for observability without any infrastructure monitoring (CPU, memory, disk, network). When the server runs out of memory, Nightwatch cannot report it because the Nightwatch SDK runs on the same server that is failing.

**Detection:** Nightwatch dashboard goes dark during infrastructure incidents. No data is received because the server is unresponsive. Operators cannot determine whether the application or the server is the problem.

**Remediation:** Add infrastructure monitoring (Node Exporter + Prometheus + Grafana) alongside Nightwatch. Infrastructure monitoring runs separately and reports server health even when the application is down.

**Prevention:** Nightwatch is application-level observability. Always pair it with infrastructure monitoring. The two tools cover different failure domains.

# Anti-Pattern 2: No PII Redaction

**Name:** Capturing sensitive data in Nightwatch

**Problem:** Nightwatch SDK captures request inputs, headers, and user data without redaction. User passwords, credit card numbers, SSNs, and personal information are stored in the Nightwatch database and visible in the dashboard.

**Detection:** Nightwatch dashboard shows request payloads containing passwords, credit card numbers, or other sensitive data in the request entry details.

**Remediation:** Configure input redaction patterns in Nightwatch config. Add patterns for all known sensitive fields. Purge existing sensitive data from Nightwatch storage.

**Prevention:** Before deploying Nightwatch to production, configure PII redaction. Review captured data in staging to ensure redaction works correctly.

# Anti-Pattern 3: Default Retention Overload

**Name:** Not calculating storage needs

**Problem:** Keeping Nightwatch's default 7-day retention without calculating expected data volume. High-traffic application generates 500MB-1GB of Nightwatch data per day. After 7 days, storage is full.

**Detection:** Nightwatch server runs out of disk space. Dashboard queries fail or time out. Operators must emergency-purge data to restore service.

**Remediation:** Calculate daily data volume in staging. Set retention to fit available storage with 30% headroom. Set up storage monitoring with alerting at 75% capacity.

**Prevention:** Before deploying Nightwatch, calculate: daily request volume × average entries per request × entry size = daily storage. Configure retention accordingly.

# Anti-Pattern 4: Alert Fatigue from No Alert Tuning

**Name:** Default alerts trigger constantly

**Problem:** Nightwatch deploys with all default alerts enabled. In a development or staging environment with expected errors (API calls to services not running locally), alerts constantly trigger and desensitize the team.

**Detection:** Nightwatch notification channel (Slack, email) has dozens of messages per hour. Team members mute the channel. Production-critical alerts go unnoticed.

**Remediation:** Customize alert thresholds for each environment. Disable alerts in development environments. Use environment-specific alert configurations.

**Prevention:** Only configure alerts for production environment. Set thresholds based on production baseline metrics. Review alert volume weekly and adjust.
