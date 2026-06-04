# Rule 1: Define Severity Levels Before Incidents Occur

**Condition:** Setting up incident response processes.

**Action:** Define 4 severity levels with clear criteria: SEV1 (complete outage, data loss), SEV2 (significant degradation), SEV3 (minor issue), SEV4 (non-urgent). Document examples for each level. Review quarterly.

**Consequence:** Clear severity definitions enable consistent incident response. Without definitions, the same incident is handled as SEV1 by one team member and SEV3 by another.

# Rule 2: Formally Declare Incidents

**Condition:** An incident is detected or reported.

**Action:** Formally declare the incident with severity, assign Incident Commander, open a war room channel, and notify stakeholders. Do not handle incidents informally.

**Consequence:** Formal declaration ensures proper attention, documentation, and coordination. Informal handling misses documentation steps, lacks coordination, and often takes longer to resolve.

# Rule 3: Incident Commander Coordinates, Does Not Debug

**Condition:** During an active incident.

**Action:** Assign an Incident Commander whose sole responsibility is coordination: assigning SMEs, communicating status, managing stakeholder expectations, and tracking timeline. The Commander does not write code or run queries.

**Consequence:** Separation of coordination and debugging doubles response efficiency. A Commander who debugs neglects coordination — stakeholders are uninformed, SMEs duplicate work, and documentation is missed.

# Rule 4: Document Timeline During the Incident

**Condition:** Active incident response.

**Action:** Assign a Scribe to document the incident timeline in real-time: detection time, declaration time, key findings, mitigation attempts, and resolution time. Use a shared document or war room thread.

**Consequence:** Real-time documentation creates an accurate postmortem foundation. Retrospective timeline reconstruction is always inaccurate.

# Rule 5: Create Runbooks for Common Failure Modes

**Condition:** Post-incident or proactively preparing for incidents.

**Action:** Write runbooks for the top 10 failure modes: database outage, queue backlog, cache failure, deployment rollback, rate limiting, memory exhaustion, disk full, certificate expiry, DNS failure, and DDoS.

**Consequence:** Runbooks reduce MTTR by 50-70% for covered failure modes. Responders follow documented steps instead of figuring out diagnostics under stress.

# Rule 6: Conduct Blameless Postmortems Within 48 Hours

**Condition:** After any SEV1 or SEV2 incident.

**Action:** Schedule postmortem within 48 hours of resolution. Include timeline, root cause, impact, detection gaps, response gaps, and action items. Focus on system failures, not individual mistakes.

**Consequence:** Blameless postmortems produce actionable improvements. Blame culture discourages honest incident reporting and causes recurring incidents.

# Rule 7: Track Postmortem Action Items to Completion

**Condition:** Postmortem identified action items.

**Action:** Assign owners and due dates for each action item. Track in the team's project management tool. Review outstanding items at weekly team meetings. Close items only after verification.

**Consequence:** Completed action items prevent incident recurrence. Without tracking, identified fixes are forgotten and the same incident recurs months later.

# Rule 8: Test Incident Response Regularly

**Condition:** Maintaining incident response readiness.

**Action:** Conduct tabletop exercises quarterly — simulate an incident scenario and walk through the response process without actual system impact. Conduct full Game Days annually with actual chaos experiments.

**Consequence:** Regular testing reveals gaps in runbooks, escalation paths, and responder knowledge. Untested incident response processes fail when first used during a real incident.
