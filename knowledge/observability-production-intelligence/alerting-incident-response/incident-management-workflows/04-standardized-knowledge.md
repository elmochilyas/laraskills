# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 08-alerting-incident-response
**Knowledge Unit:** incident-management-workflows
**Difficulty:** Advanced
**Category:** Incident Response
**Last Updated:** 2026-06-03

# Overview

Incident management is the structured process of detecting, responding to, and resolving production incidents. For Laravel applications, this means defining clear workflows for triaging alerts, assembling response teams, diagnosing root causes, implementing fixes, and conducting postmortems.

The goal of incident management is to reduce Mean Time To Resolution (MTTR), minimize human error during high-stress situations, and capture learning from incidents. Without structured workflows, teams respond ad-hoc: alerts are ignored or escalate chaotically, responders duplicate work, communication breaks down, and the same incidents recur.

Engineers should care because incidents are inevitable in production systems. Structured incident management transforms chaos into process. A team with incident workflows resolves outages 3-5x faster than a team without them.

# Core Concepts

**Severity Levels:** Classification of incidents by impact:
- **SEV1 (Critical):** Complete service outage, data loss, security breach. All hands on deck.
- **SEV2 (High):** Significant feature degradation, partial outage, performance regression affecting many users.
- **SEV3 (Medium):** Minor feature issue, cosmetic bug, single-user impact. Normal business hours response.
- **SEV4 (Low):** Internal tooling issue, documentation error, non-urgent. Next sprint fix.

**Incident Commander:** The person responsible for coordinating the response. They triage the incident, assign roles, communicate status, and drive toward resolution. They do NOT debug — their job is coordination.

**Subject Matter Expert (SME):** The person(s) debugging the technical issue. They investigate, diagnose, and implement the fix. They report findings to the Incident Commander.

**Scribe:** The person documenting the incident timeline, actions taken, and findings. Creates the postmortem draft in real-time.

**Postmortem:** A blameless retrospective document analyzing the incident. It covers: timeline, root cause, impact, detection, response, what went well, what went wrong, and action items to prevent recurrence.

**Runbook:** A documented procedure for handling specific incident types. Example: "Database Connection Pool Exhaustion" runbook lists immediate steps, diagnostic commands, and recovery procedures.

**War Room:** A dedicated communication channel (Slack channel, Discord voice, Zoom room) for incident response coordination. All incident communication happens in the war room.

# When To Use

- **All production incidents** affecting users or data
- **Pre-incident preparation** — creating runbooks for known failure modes
- **Post-incident learning** — conducting blameless postmortems

# When NOT To Use

- **Minor development issues** that don't affect production
- **Routine maintenance windows** with known procedures
- **Preventing incidents** — incident management is about response, not prevention

# Best Practices

**Declare incidents formally.** Don't informally "handle" a SEV2. Formally declare it, assign an Incident Commander, and open a war room. Formal declaration ensures proper attention and documentation.

**Establish clear severity definitions.** Every team member should know what constitutes a SEV1 vs SEV3. Review severity definitions quarterly. Ambiguity leads to under- or over-escalation.

**Create runbooks for common failures.** Database outage, queue backlog, cache failure, deployment rollback, and rate limiting — each needs a runbook. Runbooks reduce MTTR by eliminating thinking time during high-stress situations.

**Conduct blameless postmortems.** Focus on system failures and process gaps, not individual mistakes. Blame discourages honest reporting. Without honest postmortems, the same incident repeats.

**Automate incident detection and escalation.** Alerts should create war room channels, notify responders, and escalate automatically if not acknowledged within the defined period.

# Architecture Guidelines

Incident management integrates with the observability stack:
1. **Detection:** Monitoring tools (Prometheus, Grafana, Nightwatch) detect anomalies
2. **Alerting:** Alertmanager routes alerts to on-call responders via PagerDuty/Opsgenie
3. **Notification:** Responders receive notification via phone call, SMS, or push notification
4. **War Room:** Automated Slack channel creation with relevant context (alert details, affected service, dashboard links)
5. **Response:** Incident Commander coordinates, SMEs debug, Scribe documents
6. **Resolution:** Fix deployed, monitoring confirms recovery
7. **Postmortem:** Blameless analysis within 48 hours

# Performance Considerations

- **Incident detection latency:** Alert evaluation interval should match severity. SEV1: evaluate every 30s. SEV4: evaluate every 5min
- **Notification delivery time:** Phone calls and push notifications deliver within seconds. SMS and email take minutes
- **War room creation time:** Automated war room creation should complete within 10 seconds of alert firing

# Security Considerations

- **Incident communication channel security:** War rooms contain sensitive incident information (vulnerabilities, attack details, data loss). Ensure channels have controlled access
- **Postmortem data classification:** Postmortems may contain sensitive details. Classify and restrict access appropriately
- **On-call access levels:** On-call responders may need elevated access during incidents. Implement just-in-time access (PagerDuty + Okta integration)

# Common Mistakes

**No severity definitions.** Incidents are handled inconsistently. A minor bug gets the same response as a complete outage.

**Informal incident response.** "We'll just hop on a call and figure it out." Without clear roles (Incident Commander, SME, Scribe), response is chaotic.

**Skipping postmortems.** Incidents are resolved but no postmortem is conducted. The same root cause causes another incident weeks later.

**Blaming individuals.** Postmortems focus on "who made the mistake" rather than "what system failure allowed this." Blame culture discourages incident reporting.

**No runbooks.** Every incident requires figuring out diagnostic steps from scratch. Runbooks save critical time during high-stress incidents.

# Anti-Patterns

**Hero culture.** Waiting for a specific senior engineer to resolve incidents. If they're unavailable, the team cannot respond. Build runbooks and train multiple responders.

**No incident commander.** Everyone tries to debug simultaneously. Multiple people run the same queries, duplicate work, and communication is fragmented.

**Postmortem without action items.** Postmortem is written but no follow-up actions are taken. Identified fixes never get implemented. The same incident recurs.

**Alert fatigue.** Too many alerts, most of which are not actionable. Responders ignore alerts, including the critical ones.

# Examples

**SEV1 incident workflow:**
1. Alert fires for complete payment service outage
2. PagerDuty notifies on-call engineer via phone call
3. Engineer acknowledges alert within 2 minutes
4. Engineer assesses impact, declares SEV1, opens war room Slack channel
5. Incident Commander assigned, assembles SME team
6. SMEs debug: database connection pool exhausted
7. Fix: restart connection pool, scale up database instance
8. Monitoring confirms recovery after 5 minutes
9. Postmortem scheduled within 24 hours

# Related Topics

**Prerequisites:**
- Alerting fundamentals (Alertmanager, notification routing)

**Closely Related Topics:**
- Notification Routing & Escalation (how alerts reach responders)

**Advanced Follow-Up Topics:**
- Chaos engineering and incident response testing
- SRE practices for incident management

**Cross-Domain Connections:**
- Security — incident response for security breaches

# AI Agent Notes

- Severity levels: SEV1 (outage) through SEV4 (minor). Define clearly upfront
- Incident Commander coordinates, does NOT debug
- War room: dedicated Slack/Discord channel per incident
- Blameless postmortems within 48 hours — focus on systems, not people
- Runbooks for common failures reduce MTTR significantly
- Alert fatigue kills incident response effectiveness — tune alert volume
- Just-in-time access for responders during incidents
