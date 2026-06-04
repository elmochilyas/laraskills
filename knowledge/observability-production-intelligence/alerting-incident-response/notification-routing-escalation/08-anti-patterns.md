# Anti-Pattern 1: No Grouping — Notification Storm

**Name:** One notification per alert

**Problem:** Every alert triggers a separate notification regardless of related alerts. When a database server goes down, 50 alerts fire (connection failed, query timeout, replication lag, etc.), and the responder receives 50 separate notifications within seconds.

**Detection:** On-call responder receives 10+ notifications within a 1-minute window. Notifications from the same incident drown out other alerts.

**Remediation:** Configure alert grouping by `alertname` and `service` with a 30-second group wait. Set `repeat_interval` to 4 hours for non-critical alerts.

**Prevention:** Implement grouping from day one. Test with a cascade scenario (simulate database failure and verify notification count).

# Anti-Pattern 2: No Inhibition — Alert During Incident

**Name:** Low-severity alerts compound high-severity incidents

**Problem:** During a high-severity database outage, low-severity alerts for slow queries, connection warnings, and replication lag continue to fire. Responders drown in notification noise while trying to resolve the SEV1.

**Detection:** During a SEV1, the alert channel is flooded with SEV3 alerts for the same service. Responders mute the channel to focus.

**Remediation:** Configure inhibition rules: SEV1 alerts for a service inhibit all SEV3 alerts for the same service. Only SEV1 and SEV2 alerts are visible during major incidents.

**Prevention:** Define inhibition rules alongside routing rules. Test inhibition with a simulated SEV1 scenario.

# Anti-Pattern 3: No Escalation — Single Point of Failure

**Name:** Alert goes to one person with no fallback

**Problem:** Critical alerts notify a single person with no escalation path. If that person is unavailable (meeting, time off, asleep), the alert goes unacknowledged. The incident is not addressed until someone notices the issue independently.

**Detection:** Alerts fire outside business hours and remain unacknowledged for 30+ minutes. Only one person is listed as on-call.

**Remediation:** Configure escalation at minimum: primary → secondary. For SEV1, primary → secondary → manager. Set acknowledgment timeout to 5 minutes.

**Prevention:** All alerts in production must have at least one escalation target. No alert should ever notify a single person with no fallback.

# Anti-Pattern 4: Email-Only Notifications

**Name:** Critical alerts sent only via email

**Problem:** All alerts are sent via email, including SEV1s. Email notifications have no guaranteed delivery time, can be filtered to spam, and do not provide acknowledgment or escalation capabilities.

**Detection:** On-call engineer says "I didn't see the email." Alert resolution is delayed by 30+ minutes because the notification went to email.

**Remediation:** Use PagerDuty/Opsgenie for critical alerts with phone call and push notification. Use Slack for warning-level alerts. Use email only for informational alerts.

**Prevention:** Define notification channels by severity when setting up alerting. Email is acceptable for SEV4 only. Phone call is mandatory for SEV1.

# Anti-Pattern 5: Disable Alerts Instead of Silencing

**Name:** Global alerting disable during maintenance

**Problem:** During planned maintenance, an engineer globally disables alerting in the monitoring system. After maintenance, they forget to re-enable alerts. Critical incidents go undetected until someone manually checks the dashboard hours later.

**Detection:** After maintenance, no alerts fire even though there are ongoing issues. Monitoring dashboard is checked manually. "Oh, we forgot to turn alerts back on."

**Remediation:** Use Alertmanager silences for maintenance. Create a silence with a specific matcher for the service being maintained. Set automatic expiry. Never disable alerting globally.

**Prevention:** Remove the ability to globally disable alerting. Enforce silence creation via CI/CD or process. Train all engineers on silence best practices.
