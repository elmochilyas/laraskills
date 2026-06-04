# Incident Management Workflows

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 08-alerting-incident-response
- **Knowledge Unit:** incident-management-workflows
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Incident management is the structured process of detecting, responding to, and resolving production incidents. It reduces Mean Time To Resolution (MTTR), minimizes human error during high-stress situations, and captures learning from incidents. A team with structured incident workflows resolves outages 3-5x faster than a team without them.

---

## Core Concepts

- **Severity Levels:** SEV1 (Critical — complete outage, data loss, security breach), SEV2 (High — significant feature degradation), SEV3 (Medium — minor feature issue), SEV4 (Low — internal tooling, non-urgent)
- **Incident Commander:** Coordinates response, triages, assigns roles, communicates status — does NOT debug
- **Subject Matter Expert (SME):** Debugs the technical issue, investigates, diagnoses, implements fix
- **Scribe:** Documents incident timeline, actions taken, and findings — creates postmortem draft in real-time
- **Postmortem:** Blameless retrospective analyzing timeline, root cause, impact, what went well/wrong, action items
- **Runbook:** Documented procedure for handling specific incident types — reduces MTTR by eliminating thinking time
- **War Room:** Dedicated communication channel for incident response coordination

---

## Mental Models

- **Fire Department Model:** Incident Commander is the fire chief (directs traffic, coordinates resources), SMEs are firefighters (fight the fire), Scribe is the dispatcher (logs everything). Everyone has a role, no one does two jobs
- **Triage Tent Model:** Like an ER triage — SEV1 is code blue (immediate, all hands), SEV2 is urgent (next available), SEV3 is routine (schedule), SEV4 can wait
- **Postmortem as Gift Model:** A blameless postmortem is a gift to the future team — every incident makes the system more resilient. Blame culture burns this gift

---

## Internal Mechanics

Incident management integrates with the observability stack across seven stages: Detection (monitoring tools detect anomalies) → Alerting (Alertmanager routes to responders) → Notification (phone/SMS/push) → War Room (automated Slack channel creation) → Response (Incident Commander coordinates, SMEs debug, Scribe documents) → Resolution (fix deployed, monitoring confirms) → Postmortem (blameless analysis within 48 hours). Each stage has defined roles, timelines, and tools. Incident Commander role rotates; runbooks exist for common failure modes.

---

## Patterns

- **Declared Incident Workflow:** Formally declare incidents with severity, assign Incident Commander, open war room. Benefit: ensures proper attention and documentation. Tradeoff: overhead for minor issues that could be handled informally.
- **Runbook-First Response:** Create runbooks for common failures before incidents occur. Benefit: reduces MTTR by eliminating thinking time. Tradeoff: runbooks require ongoing maintenance.
- **Blameless Postmortem:** Focus on system failures and process gaps, not individual mistakes. Benefit: encourages honest reporting — without it, same incidents recur. Tradeoff: requires cultural buy-in and psychological safety.

---

## Architectural Decisions

**Declare incidents formally.** Don't informally "handle" a SEV2. Formal declaration ensures proper attention, documentation, and lessons learned.

**Establish clear severity definitions.** Every team member should know SEV1 vs SEV3. Review definitions quarterly. Ambiguity leads to under- or over-escalation.

**Create runbooks for common failures.** Database outage, queue backlog, cache failure, deployment rollback — each needs a runbook.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Structured incident response reduces MTTR by 3-5x | Overhead of formal process for minor issues | Use severity levels to scope response appropriately |
| Runbooks save critical thinking time during incidents | Runbooks require maintenance and testing | Review and test runbooks quarterly |
| Blameless postmortems prevent repeat incidents | Requires psychological safety culture | No blame means honest incident reporting |

---

## Performance Considerations

Incident detection latency: SEV1 alerts evaluate every 30s; SEV4 every 5min. Notification delivery time: phone calls and push notifications within seconds; SMS/email take minutes. War room creation should complete within 10 seconds of alert firing.

---

## Production Considerations

War rooms contain sensitive incident information — ensure channels have controlled access. Postmortems may contain sensitive details — classify and restrict access appropriately. On-call responders may need elevated access during incidents — implement just-in-time access.

---

## Common Mistakes

**No severity definitions** — incidents handled inconsistently. A minor bug gets the same response as a complete outage.

**Informal incident response** — "We'll just hop on a call and figure it out." Without clear roles, response is chaotic and duplicate work occurs.

**Skipping postmortems** — incidents resolved but no postmortem conducted. Same root cause causes another incident weeks later.

**Blaming individuals** — postmortems focus on "who made the mistake" rather than "what system failure allowed this."

**No runbooks** — every incident requires figuring out diagnostic steps from scratch.

---

## Failure Modes

**Hero culture:** Single senior engineer resolves all incidents — if unavailable, team cannot respond. Detection: incidents stall when specific person is unavailable. Mitigation: build runbooks; train multiple responders; rotate incident commander role.

**Alert fatigue:** Too many alerts, most not actionable — responders ignore critical alerts. Detection: acknowledged alerts decrease; MTTR increases. Mitigation: tune alert volume; route by severity; suppress noisy alerts.

**Postmortem without action:** Postmortem written but no follow-up actions taken. Identified fixes never implemented. Detection: same incident recurs. Mitigation: assign action items with owners and deadlines; track in project management.

---

## Ecosystem Usage

Laravel teams typically integrate incident management with error tracking (Sentry alerts → war room), monitoring (Prometheus → Alertmanager → PagerDuty), and communication (Slack/Discord war rooms). Laravel Forge and Envoyer provide deployment hooks that can trigger incident workflows.

---

## Related Knowledge Units

### Prerequisites
- Alerting fundamentals (Alertmanager, notification routing)

### Related Topics
- Notification Routing & Escalation (how alerts reach responders)

### Advanced Follow-up Topics
- Chaos engineering and incident response testing
- SRE practices for incident management

---

## Research Notes

Severity levels: SEV1 (outage) through SEV4 (minor). Define clearly upfront. Incident Commander coordinates, does NOT debug. War room: dedicated Slack/Discord channel per incident. Blameless postmortems within 48 hours — focus on systems, not people. Runbooks for common failures reduce MTTR significantly. Alert fatigue kills incident response effectiveness.
