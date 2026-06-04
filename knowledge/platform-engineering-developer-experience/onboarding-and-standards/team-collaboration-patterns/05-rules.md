# Rules: Team Collaboration Patterns

## Metadata
- **Source KU:** team-collaboration-patterns
- **Subdomain:** Onboarding and Standards
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- COLLAB-RULE-001: **Default to async communication** — Async allows deep work without interruptions. Reserve sync for complex discussions.
- COLLAB-RULE-002: **Frame code review as teaching, not gatekeeping** — Focus on correctness, security, maintainability. Use "nit:" prefix for style.
- COLLAB-RULE-003: **Limit recurring meetings to <4 hours/week** — Daily standup (1.25hr) + planning (1hr) + retro (0.5hr) = ~3hr.
- COLLAB-RULE-004: **Document decisions by default** — If it's not documented, it didn't happen. ADRs for architecture, postmortems for incidents.
- COLLAB-RULE-005: **Define decision-making responsibility** — Developers decide implementation, team votes on packages, lead decides architecture.

## Architecture Rules
- COLLAB-RULE-006: **Standup:** Async for distributed teams (Slack thread). Sync for co-located (15 min). Focus on blockers.
- COLLAB-RULE-007: **Code review SLA:** Review within 4 hours of assignment during working hours.
- COLLAB-RULE-008: **Decision matrix:** Simple decisions (majority), technical decisions (ADR with rationale), strategic (lead final call).
- COLLAB-RULE-009: **Incident communication:** #incidents channel → incident lead → updates every 15 min → postmortem within 48hr.

## Decision Rules
- COLLAB-RULE-010: **Use for team with 3+ developers** on same codebase, especially distributed/remote-first.
- COLLAB-RULE-011: **Skip for single developer or pair programming exclusively.**
