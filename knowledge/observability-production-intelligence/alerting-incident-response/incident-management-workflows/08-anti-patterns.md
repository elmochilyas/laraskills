# Anti-Pattern 1: Hero Culture

**Name:** Single-person dependency for incident response

**Problem:** Only one senior engineer knows how to handle database failover, cache warming, or deployment rollback. When they are unavailable (vacation, sick, meeting), incidents take 3x longer to resolve because others wait for them or learn under pressure.

**Detection:** "Wait for [engineer]" is a common phrase during incidents. Runbooks do not exist. Only one person has performed each recovery procedure.

**Remediation:** Document runbooks for all critical procedures. Cross-train at least two engineers per procedure. Rotate on-call responsibilities so multiple team members gain experience.

**Prevention:** Every incident or drill should produce documentation. Maintain a "bus factor" register: if only one person knows a procedure, it is a risk that must be addressed.

# Anti-Pattern 2: No Incident Commander

**Name:** Everyone debugs, no one coordinates

**Problem:** During an incident, multiple engineers independently investigate the same problem. They run the same queries, check the same dashboards, and draw the same conclusions. Meanwhile, stakeholders are uninformed, escalation is delayed, and documentation is nonexistent.

**Detection:** After an incident, the timeline is unclear. Multiple engineers say "I was looking into X" but no one was coordinating. Stakeholders complain about lack of communication.

**Remediation:** Assign an Incident Commander at incident declaration. The Commander's only job is coordination — they assign SMEs, communicate status, and manage stakeholders.

**Prevention:** Establish incident roles before incidents happen. Make "first responder becomes Commander until relieved" a documented rule.

# Anti-Pattern 3: Skipping Postmortems

**Name:** Resolve and forget

**Problem:** Incidents are resolved, but no postmortem is conducted. The root cause is not analyzed, no action items are created, and no improvements are made. The same incident recurs weeks or months later.

**Detection:** Recurring incidents with the same root cause. Team says "this happened again." No postmortem documents exist from previous incidents.

**Remediation:** Make postmortems mandatory for SEV1 and SEV2 incidents. Schedule within 48 hours. Track action items to completion.

**Prevention:** Add postmortem creation to the incident response checklist. Require incident closure in PagerDuty to include postmortem document link.

# Anti-Pattern 4: No Runbooks

**Name:** Figuring out diagnostics under pressure

**Problem:** Every incident requires the responder to figure out diagnostic steps from scratch. "What's the command to check database connections?" "How do I restart Horizon?" "Where is the cache warm script?" Each question adds minutes to MTTR.

**Detection:** During incidents, engineers search Slack for past solutions or ask colleagues how to perform basic diagnostic steps.

**Remediation:** Write runbooks for the top 10 most common incidents. Each runbook includes: symptoms, diagnostic commands, root cause identification, resolution steps, and verification steps.

**Prevention:** After each incident, add the resolution steps to a runbook. Over time, runbooks cover all common failure modes.

# Anti-Pattern 5: Blame-Focused Postmortems

**Name:** "Who did this?"

**Problem:** Postmortems focus on identifying who made the mistake that caused the incident. Engineers become defensive, avoid reporting incidents, and hide mistakes. Recurring incidents are not prevented because root causes are not honestly analyzed.

**Detection:** Postmortem action items include "be more careful" or "double-check before deploying." Engineers use CYA (Cover Your Ass) language in incident reports.

**Remediation:** Establish a blameless postmortem culture. Focus on: what system failure allowed this? What process gap contributed? What automation is needed?

**Prevention:** Leadership must model blameless investigation. "Be more careful" is never an acceptable action item. Every action item must be a system or process improvement.
