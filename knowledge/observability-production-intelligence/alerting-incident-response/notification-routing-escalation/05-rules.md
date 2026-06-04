# Rule 1: Route by Service and Severity

**Condition:** Configuring Alertmanager (or equivalent) routes.

**Action:** Define routes that match on `service` and `severity` label combinations. Route critical alerts for payments service to the payments team's on-call schedule. Route infrastructure alerts to the infrastructure team. Define specific routes before generic catch-all routes.

**Consequence:** Accurate routing ensures alerts reach the right responders. A payments alert goes to the payments team, not the infrastructure team. Misrouted alerts waste time and delay response.

# Rule 2: Set 5-Minute Acknowledgment Timeout for Critical Alerts

**Condition:** Configuring escalation for SEV1 and SEV2 alerts.

**Action:** Set the acknowledgment timeout to 5 minutes for critical alerts. If the primary on-call does not acknowledge within 5 minutes, escalate to the secondary. Escalate to manager after 10 minutes.

**Consequence:** 5-minute timeout ensures critical alerts are acknowledged quickly. Longer timeouts (30 minutes) mean incidents go unnoticed for extended periods.

# Rule 3: Group Related Alerts

**Condition:** Alerts that fire simultaneously during cascading failures.

**Action:** Configure grouping by `alertname` and `service` with 30-second group wait. During a cascade of 50 alerts, responders receive 1 notification instead of 50. Set `repeat_interval` to 4 hours for non-critical alerts.

**Consequence:** Grouping prevents notification storms. Responders see "5 groups of similar alerts" instead of 50 individual notifications. Critical alerts are not buried in noise.

# Rule 4: Inhibit Low-Severity Alerts During High-Severity Incidents

**Condition:** Configuring alert inhibition rules.

**Action:** Define inhibition rules: when a SEV1 alert is firing, inhibit all related SEV3 alerts matching the same `service`. Example: "database is down" (SEV1) inhibits "database query slow" (SEV3).

**Consequence:** Inhibition reduces noise during incidents. Responders focus on the SEV1 without distraction from related non-critical alerts.

# Rule 5: Use Silence for Maintenance Windows

**Condition:** Performing planned maintenance that may trigger alerts.

**Action:** Create a silence in Alertmanager before starting maintenance. Use a matcher expression that covers the expected alerts. Set the silence duration to match the maintenance window plus 15 minutes buffer.

**Consequence:** Silences prevent alert noise during planned maintenance. They automatically expire, so there is no risk of forgetting to re-enable alerts.

# Rule 6: Choose Primary Notification Channel by Severity

**Condition:** Configuring notification receivers.

**Action:** Use PagerDuty/Opsgenie with phone call + push notification for SEV1/SEV2. Use Slack channel message for SEV3. Use email summary for SEV4. Do not send to multiple channels simultaneously for the same alert.

**Consequence:** Single-channel per severity ensures clarity. Phone calls wake responders for critical alerts. Email-only alerts are ignored. Multi-channel notifications cause confusion — "which channel should I acknowledge?"

# Rule 7: Test Escalation Paths Monthly

**Condition:** Maintaining on-call schedules and escalation chains.

**Action:** Fire a test alert monthly that follows the full escalation path: primary acknowledgment → timeout → secondary → timeout → manager. Verify each step triggers the correct notification.

**Consequence:** Monthly testing catches expired PagerDuty schedules, disconnected phone numbers, and misconfigured routes before they cause missed alerts during real incidents.

# Rule 8: Define Catch-All Route Last

**Condition:** Defining Alertmanager route order.

**Action:** Place the catch-all route (routes with no match criteria) as the last route. Specific routes with `service` and `severity` matchers come first. Catch-all should route to a low-priority receiver (email only).

**Consequence:** Specific routes match before catch-all. Catch-all prevents unclassified alerts from being lost. Without catch-all, unmatched alerts are dropped silently.
