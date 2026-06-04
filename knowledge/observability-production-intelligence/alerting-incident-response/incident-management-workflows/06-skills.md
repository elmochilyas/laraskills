```yaml
name: incident-response-workflow
description: >
  Guide an AI agent through establishing an incident management workflow for a
  Laravel application team — severity definitions, roles, war room procedures,
  postmortem process, and runbook creation.
workflow:
  steps:
    - name: define-severity-levels
      description: >
        Document severity definitions:
        - SEV1: Complete outage, data loss, security breach. All hands.
        - SEV2: Significant feature degradation. Business hours response.
        - SEV3: Minor issue, single-user impact. Normal workflow.
        - SEV4: Non-urgent, next sprint.

    - name: establish-roles
      description: >
        Define incident roles:
        - Incident Commander: coordinates, does not debug
        - SME: investigates and fixes
        - Scribe: documents timeline
        Rotate roles across team for cross-training.

    - name: create-war-room-procedure
      description: >
        Establish war room process:
        - Automated Slack channel creation on SEV1/SEV2
        - Pin incident details: severity, affected service, timeline
        - Communication protocol: Commander speaks, SMEs report findings
        - Status update cadence: every 30 minutes

    - name: develop-runbooks
      description: >
        Write runbooks for common failures:
        - Database outage: check replica status, failover steps
        - Queue backlog: check worker count, restart Horizon
        - Cache failure: flush and warm cache
        - Deployment rollback: revert command, verify health

    - name: establish-postmortem-process
      description: >
        Define postmortem workflow:
        - Schedule within 48 hours of incident end
        - Blameless analysis: what happened, why, what we learned
        - Action items with owners and due dates
        - Track action items to completion

    - name: conduct-drills
      description: >
        Schedule regular incident response drills:
        - Quarterly tabletop exercises (paper simulation)
        - Annual Game Days (actual chaos experiments)
        - Post-drill review and process improvement

  triggers:
    - User asks "How do we handle production incidents?"
    - User asks "What's the incident management process?"
    - User reports "We had an incident and didn't know what to do"
```
