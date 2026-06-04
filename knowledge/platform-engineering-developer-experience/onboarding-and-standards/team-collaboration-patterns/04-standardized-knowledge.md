# Experience Curation: Team Collaboration Patterns

## Metadata
- **KU ID:** onboarding-team-standards/team-collaboration-patterns
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Mature
- **Dependencies:** code-review-standards, development-workflow-documentation, contributing-dot-md-patterns
- **Related Technologies:** GitHub, GitLab, Slack, Jira, Code Review, Agile, Laravel
- **Target Audience:** Laravel team leads, developers, engineering managers

## Overview

Team collaboration patterns for Laravel teams encompass the communication protocols, meeting structures, code review norms, and knowledge-sharing practices that enable effective teamwork. These patterns go beyond technical tooling to address how team members interact: daily standup format, issue tracking conventions, pair programming cadence, code review expectations (depth, turnaround time, tone), Slack/Discord channel structure, documentation practices, decision-making processes, and conflict resolution. For distributed teams, collaboration patterns are especially critical as they replace the informal communication of co-located teams. Well-defined patterns reduce meeting overhead, eliminate ambiguity, and create a predictable working rhythm.

## Core Concepts

- **Async-First Communication:** Default to asynchronous communication (PR comments, Slack threads, issue updates) rather than synchronous meetings
- **Code Review Culture:** Framed as collaborative knowledge sharing, not gatekeeping; constructive and respectful tone
- **Meeting Cadence:** Predictable schedule (daily standup, weekly planning, biweekly retro, monthly demo) providing rhythm without overwhelming the calendar
- **Documentation by Default:** Decisions, architecture discussions, and process changes are documented rather than communicated verbally
- **Psychological Safety:** Team members feel safe to ask questions, admit mistakes, and suggest improvements without fear of blame

## When To Use

- Team has 3+ developers working on the same codebase
- Team is distributed or remote-first
- New members join regularly and need to learn team norms
- Current collaboration is ad-hoc and causing friction (missed information, meeting overload)
- Team wants to reduce meeting time and improve async communication

## When NOT To Use

- Single developer or pair programming exclusively
- Co-located team that communicates effectively informally
- Team is temporary (short-term project, small task force)
- Organization already has enforced collaboration patterns from management

## Best Practices (WHY)

1. **Default to Async (Why):** Async communication allows deep work without interruptions. Each Slack notification or meeting costs 15-25 minutes of context recovery. Reserve synchronous time for complex discussions and pairing. Async-first teams ship more because developers have uninterrupted focus time.

2. **Frame Code Review as Teaching, Not Gatekeeping (Why):** When review is framed as gatekeeping, reviewers focus on style nits and personal preferences, becoming a bottleneck. When framed as teaching, reviewers focus on correctness, security, and maintainability, and the whole team grows. Use "nitpick:" prefix for style suggestions (non-blocking).

3. **Limit Recurring Meetings to <4 Hours/Week (Why):** Anything more impacts deep work. Standup (15 min daily = 1.25 hr), planning (1 hr/week), retro (1 hr/biweekly = 0.5 hr) totals ~3 hours/week. Audit meeting attendance quarterly; cancel meetings without regular attendance.

4. **Document Decisions by Default (Why):** Decisions made verbally in meetings are forgotten in two months. Enforce documentation for all significant decisions (ADRs), every production incident (postmortem), and every configuration change (.env.example update). "If it's not documented, it didn't happen."

5. **Define Decision-Making Responsibility (Why):** Without clear ownership, every decision goes through team discussion, causing decision paralysis. Define who decides what: developers decide implementation details, team votes on package selection, lead decides architecture. Document in a decision matrix.

## Architecture Guidelines

- **Standup Format:** Async for distributed teams (Slack thread). Sync for co-located (15 min standup). Focus on blockers, not status reports.
- **Code Review SLA:** Review within 4 hours of assignment during working hours. Focus on correctness, security, performance, test coverage. "Nitpick:" prefix for non-blocking suggestions.
- **Communication Channels:** Topic channels (#general, #dev, #deployments, #random) to reduce noise. Avoid @here and @channel except for urgent matters.
- **Pair Programming:** Scheduled slots (Tue/Thu 2-4 PM optional). Partners rotate weekly. Driver/Navigator roles swap every 20-30 min.
- **Decision Matrix:** Simple decisions (majority), technical decisions (ADR with rationale), strategic decisions (lead final call).
- **Incident Communication:** #incidents channel → incident lead → status updates every 15 min → postmortem within 48 hours.

## Performance

- **Meeting Time Budget:** <4 hours/week recurring meetings per developer. More impacts deep work.
- **Review Response SLA:** 4-hour target balances responsiveness with reviewer availability. Faster creates pressure; slower bottlenecks the pipeline.
- **Context Switching:** Each interruption costs 15-25 minutes of recovery. Batch notifications. Use "Do Not Disturb" during focus blocks (morning hours).
- **On-Call:** On-call developers have no meeting obligations during rotation to maintain incident response focus.

## Security

- **Incident Communication:** Define clear incident channel, escalation path, and communication cadence. All incidents are documented in postmortems.
- **On-Call Rotation:** Document schedule, handoff procedure, and escalation tree. On-call has priority over all other work.
- **Deployment Communication:** All deployments announced in #deployments channel with PR references, changelog, and rollback instructions.
- **Security Incident Handling:** Document how to report security issues (private channel, email) and the escalation process.

## Common Mistakes

### Mistake 1: Over-Meeting
- **Description:** 5+ hours of recurring meetings per week
- **Cause:** Status update meetings that could be async
- **Consequence:** No time for actual development
- **Better:** Audit meeting attendance quarterly. Cancel meetings without regular attendance. Default to async.

### Mistake 2: Code Review as Gatekeeping
- **Description:** Reviewers focus on style nits and personal preferences
- **Cause:** Not distinguishing between blocking and non-blocking feedback
- **Consequence:** Review bottleneck, demoralized contributors
- **Better:** Focus on correctness, security, and maintainability. Use "nitpick:" prefix for style. Approve when satisfied.

### Mistake 3: Slack Overload
- **Description:** 20+ channels with constant @here notifications
- **Cause:** No channel management, over-communication
- **Consequence:** Developers mute everything, miss important messages
- **Better:** Consolidate channels. Use @here sparingly. Define channel purposes in topic.

### Mistake 4: No Documentation Culture
- **Description:** Decisions made verbally, never written down
- **Cause:** Speed preference, assumption that "everyone will remember"
- **Consequence:** Two months later, no one remembers why a choice was made
- **Better:** Enforce documentation by default. Make ADR creation a definition-of-done item.

## Anti-Patterns

- **The Meeting Factory:** 5+ hours of meetings per week, every week. No time for deep work. Audit and cut.
- **The Blame Culture:** Postmortems focus on "who did this" rather than "what process allowed this." Foster blameless culture where mistakes are learning opportunities.
- **The Communication Silo:** Frontend and backend don't communicate; integration issues discovered late. Cross-team demos, shared channels, joint planning.
- **The Decision Black Hole:** Every decision discussed indefinitely. Clear decision-making matrix; empower developers for implementation decisions.
- **The Notification Firehose:** @here in every channel, every message. Developers tune out. Reserve @here for truly urgent, team-wide announcements.

## Examples

### Example 1: Decision-Making Matrix
```markdown
| Decision Type | Who Decides | Input From | Documentation |
|--------------|-------------|------------|---------------|
| Implementation details | Developer | PR reviewer | PR comments |
| Package selection | Team (vote) | All devs | ADR |
| Architecture changes | Lead + team | All devs | ADR + RFC |
| Sprint scope | Product manager | Team | Sprint goal |
| Process changes | Team (retro) | All devs | Retro notes |
```

### Example 2: Code Review Etiquette
```markdown
## Code Review Guidelines
- Review within 4 hours of assignment (during working hours)
- Focus on: correctness, security, performance, test coverage
- Use "nitpick:" prefix for style preferences (non-blocking)
- Explain the "why" behind suggestions, not just the "what"
- Approve when satisfied; request changes only for blocking issues
- Authors: respond to all comments; mark threads resolved after addressing
```

## Related Topics

- **code-review-standards:** Code review norms and expectations
- **development-workflow-documentation:** Workflow that collaboration supports
- **contributing-dot-md-patterns:** Collaboration and contribution guidelines
- **developer-onboarding-checklists:** Onboarding includes collaboration patterns
- **pr-template-patterns:** PR templates supporting review culture

## AI Agent Notes

- **Context Requirements:** When advising on collaboration patterns, first understand team size, distribution (co-located vs remote), current meeting load, communication pain points, and code review bottlenecks.
- **Key Decision Points:** Async vs sync standup, meeting cadence, review SLA, decision-making ownership, channel structure.
- **Common Pitfalls in AI Assist:** Don't recommend synchronous standups for distributed teams. Always emphasize async-first culture. Keep meeting time to <4 hours/week. Document decisions by default.
- **Laravel-Specific Nuances:** Laravel's strong conventions reduce collaboration friction—less debate about structure means more energy for meaningful decisions. Remote-first Laravel teams benefit from the framework's excellent documentation culture.

## Verification
- [ ] KU accurately defines team collaboration patterns
- [ ] Core concepts cover async-first, review culture, documentation by default
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize async communication and meeting limits
- [ ] Architecture guidelines cover standup, review SLA, decision matrix
- [ ] Performance addresses meeting time budget and context switching
- [ ] Security covers incident communication and on-call rotation
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify meeting factory and blame culture
- [ ] Examples show decision matrix and review etiquette
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
