# Skill: Establish Team Collaboration Patterns

## Purpose
Define communication protocols, meeting structures, code review norms, and knowledge-sharing practices that enable effective teamwork for Laravel teams, especially distributed ones.

## When To Use
- Team has 3+ developers working on the same codebase
- Team is distributed or remote-first
- New members join regularly and need to learn team norms
- Current collaboration is ad-hoc causing friction or meeting overload
- Team wants to reduce meeting time and improve async communication

## When NOT To Use
- Single developer or pair programming exclusively
- Co-located team that communicates effectively informally
- Organization already has enforced collaboration patterns from management

## Prerequisites
- Team agreement to adopt collaboration patterns
- Communication platform (Slack, Discord, Teams) set up
- Code review process in place
- Issue tracking tool configured (Jira, Linear, GitHub Issues)

## Inputs
- Current team pain points and friction areas
- Meeting audit (current calendars)
- Code review metrics (time to review, feedback quality)
- Team size and distribution (time zones, work hours)

## Workflow
1. Default to async-first communication: PR comments, Slack threads, issue updates over meetings
2. Establish meeting cadence: daily standup (15 min), weekly planning (1 hr), biweekly retro (30 min)
3. Define code review culture: teaching over gatekeeping, "nit:" prefix for style suggestions
4. Set code review SLA: review within 4 hours of assignment during working hours
5. Define decision-making responsibility: developers decide implementation, team votes on packages, lead decides architecture
6. Document decisions by default: ADRs for architecture, postmortems for incidents
7. Set up incident communication: #incidents channel → incident lead → updates every 15 min → postmortem within 48hr
8. Keep recurring meetings under 4 hours/week total
9. Audit meeting attendance quarterly; cancel meetings without regular attendance
10. Document all patterns in a collaboration guide in the repository

## Validation Checklist
- [ ] Async communication is the default (sync reserved for complex discussions)
- [ ] Code review framed as teaching, not gatekeeping
- [ ] "nit:" prefix used for non-blocking style suggestions
- [ ] Meeting total is under 4 hours/week
- [ ] Code review SLA is 4 hours during working hours
- [ ] Decision-making responsibility is clearly defined
- [ ] Incident communication process documented
- [ ] All significant decisions documented (ADRs or equivalent)
- [ ] Meeting attendance audited quarterly

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Meetings consume more than 4 hours/week | No meeting audit | Track meeting time; cancel low-attendance meetings |
| Async messages ignored | No norms for response time | Set expected response time (e.g., 4 hours during work hours) |
| Code review is slow and nitpicky | Gatekeeping culture | Frame review as teaching; use "nit:" prefix |
| Decisions repeated because undocumented | Verbal-only decisions | Enforce documentation for all significant decisions |
| Distributed team feels disconnected | No informal communication | Schedule virtual coffee chats, team social events |
| Incident communication is chaotic | No incident protocol | Document #incidents channel, lead assignment, update cadence |
| PR feedback is inconsistent | No review standards | Document code review expectations and depth |

## Decision Points
- **Standup format:** Async (Slack thread) for distributed vs sync (voice) for co-located
- **Decision matrix:** Simple (majority vote) vs Technical (ADR with rationale) vs Strategic (lead final call)
- **Review SLA:** 4 hours vs within same day vs within 24 hours
- **Meeting rhythm:** Scrum (sprint) vs Kanban (continuous) vs Shape Up (cycle)

## Performance/Security Considerations
- Incident communication channel should integrate with monitoring tools (PagerDuty, Sentry)
- Document security incident response separately (not in general collaboration doc)
- Code review should include security-sensitive code checklist
- Async-first reduces context-switching overhead, improving deep work

## Related Rules
- COLLAB-RULE-001 through COLLAB-RULE-011

## Related Skills
- Define Code Review Standards
- Document Development Workflow
- Create CONTRIBUTING.md
- Write Architecture Decision Records
- Set Up Automated Testing in CI

## Success Criteria
- Meeting time is under 4 hours/week per developer
- Code review turnaround time is under 4 hours during working hours
- All significant decisions have documented ADRs
- New team members can read the collaboration guide and integrate within 2 weeks
- Team satisfaction score on collaboration >4/5
- Incident responses follow documented protocol without confusion
