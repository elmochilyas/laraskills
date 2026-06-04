# Decision Trees: Team Collaboration Patterns

## Metadata
- **KU ID:** onboarding-team-standards/team-collaboration-patterns
- **Phase:** 4 (Experience Curation)
- **Curator:** Phase 4 Standardization Process
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Standup format | Async (Slack) / Sync (meeting) / Hybrid | Team distribution and deep work preferences |
| 2 | Code review culture | Teaching-focused / Gatekeeping / Checklist-based | Team growth speed vs code quality enforcement |
| 3 | Meeting budget allocation | <4 hrs/week / 4-8 hrs / Per-project | Impact on deep work availability |
| 4 | Decision-making authority | Developer decides / Team votes / Lead decides / Matrix | Speed of decision-making vs team alignment |
| 5 | Communication channel structure | By topic / By team / By project / Minimal | Information discoverability and noise management |

## Architecture-Level Decision Trees

### Tree 1: Standup Format Selection

- **Start:** Deciding how the team does daily standup
- **Is the team fully co-located in the same timezone?**
  - Yes → Sync standup (15 min, in-person or video). Focus on blockers and coordination. Keep to timebox.
  - No → Continue.
- **Is the team distributed across 3+ timezones?**
  - Yes → Async standup (Slack thread or async tool). Each member posts updates by cutoff time (e.g., 10 AM local). Optional sync for coordination.
  - No → Continue.
- **Hybrid approach:** Async standup with optional sync for those who prefer it. Slack thread with three questions: What did I do yesterday? What will I do today? Any blockers? Sync standup once per week for team connection.
- **Structure:** Async-written updates. Sync for blockers and coordination. Focus on blockers, not status reports. Managers extract insights from standup without attending.

### Tree 2: Code Review Culture

- **Start:** Defining code review norms
- **Is the team growing and onboarding new members?**
  - Yes → Teaching-focused review. Frame review as knowledge sharing. Reviewers explain "why" behind suggestions. Use "nitpick:" prefix for non-blocking style preferences.
  - No → Continue.
- **Is code quality currently a problem (frequent production bugs)?**
  - Yes → Gatekeeping-focused initially. Stricter review criteria. Focus on correctness, security, performance. Relax as quality improves.
  - No → Teaching-focused. Collaborative tone. Reviewer learns as much as author from the discussion.
- **Review SLA:** Review within 4 hours of assignment during working hours. Faster creates pressure; slower bottlenecks the pipeline.
- **Checklist for reviewers:** Correctness, Security, Performance, Test Coverage, Architecture. Not style (Pint handles that).

### Tree 3: Meeting Budget and Calendar Management

- **Start:** Managing team meeting load
- **Current recurring meeting time per developer:**
  - <4 hours/week → Healthy. Maintain current cadence. Review quarterly.
  - 4-8 hours/week → Caution. Audit meeting attendance. Cancel meetings without regular attendance. Convert status meetings to async.
  - >8 hours/week → Overloaded. Schedule a meeting reduction session. Cancel all non-essential recurring meetings. Implement async-first communication.
- **Default meeting budget:**
  - Daily standup: 15 min (sync) or async → 1.25 hrs/week max
  - Weekly planning: 1 hour
  - Biweekly retro: 30 min average
  - Monthly demo: 30 min
  - Total: ~3 hours/week (healthy)
- **Meeting principles:**
  - No-meeting morning blocks (e.g., until 1 PM) for deep work.
  - Calendar invite includes agenda. No agenda, no meeting.
  - Meeting notes recorded for absent team members.

### Tree 4: Decision-Making Authority

- **Start:** Assigning decision ownership
- **What type of decision is being made?**
  - Implementation details (how to structure a method, which helper to use) → Developer decides. PR review is input, not approval.
  - Package or tool selection → Team votes. Each developer researches options. ADR documents the decision with rationale.
  - Architecture changes (service layer, cache strategy, deployment approach) → Lead decides with team input. RFC document. Team discusses async. Lead makes final call. ADR written.
  - Sprint scope → Product manager decides. Team provides estimates. Scope adjusted in planning.
  - Process changes (standup format, review SLA) → Team decides via retro. Retro notes document the decision. Try for 2 weeks, then review.
- **Documentation:** All significant decisions documented in ADRs or retro notes. "If it's not documented, it didn't happen."
- **Escalation:** If developer disagrees with a decision, they write an ADR proposing the alternative. Decision is revisited with documented rationale.
