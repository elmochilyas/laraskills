# Knowledge Unit: Team Collaboration Patterns

## Metadata
- **Subdomain:** Onboarding & Team Standards
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** onboarding-team-standards/team-collaboration-patterns
- **Maturity:** Mature
- **Related Technologies:** GitHub, GitLab, Slack, Jira, Code Review, Agile, Laravel

## Executive Summary

Team collaboration patterns for Laravel teams encompass the communication protocols, meeting structures, code review norms, and knowledge-sharing practices that enable effective teamwork. These patterns go beyond technical tooling to address how team members interact: daily standup format, issue tracking conventions, pair programming cadence, code review expectations (depth, turnaround time, tone), Slack/Discord channel structure, documentation practices, decision-making processes, and conflict resolution. For distributed and remote-first Laravel teams, collaboration patterns are especially critical as they replace the informal communication of co-located teams. Well-defined patterns reduce meeting overhead, eliminate ambiguity about expectations, and create a predictable working rhythm. The patterns are documented in a team charter or collaboration guide (TEAM.md or docs/collaboration.md) and are revisited during retrospectives for continuous improvement.

## Core Concepts

- **Async-First Communication:** Default to asynchronous communication (PR comments, Slack threads, issue updates) rather than synchronous meetings; synchronous time is reserved for complex discussions and pairing
- **Code Review Culture:** The code review process is framed as collaborative knowledge sharing, not gatekeeping; reviewers focus on correctness, maintainability, and learning, with a constructive and respectful tone
- **Meeting Cadence:** Predictable meeting schedule (daily standup, weekly planning, biweekly retro, monthly demo) that provides rhythm without overwhelming the calendar
- **Documentation by Default:** Relevant decisions, architecture discussions, and process changes are documented rather than communicated verbally; "if it's not documented, it didn't happen"
- **Psychological Safety:** Team members feel safe to ask questions, admit mistakes, and suggest improvements without fear of blame or ridicule; this is the foundation of effective collaboration

## Mental Models

- **Collaboration as API Contract:** Team collaboration patterns define the API contract between team members—how information is passed, what endpoints (channels) to use, expected response times, and error handling (conflict resolution)
- **Async-First as Bandwidth Optimization:** Using async communication is like optimizing for bandwidth over latency; synchronous meetings are high-bandwidth but expensive (all participants blocked), async is lower bandwidth but allows parallel work
- **Code Review as Teaching Moment:** Every code review is both a quality check and a teaching opportunity; the reviewer learns about new code, and the author learns from the reviewer's experience

## Internal Mechanics

1. **Daily Standup (15 min):** Each member shares what they did yesterday, what they'll do today, and any blockers; async standup via Slack thread as alternative for distributed teams
2. **Sprint Planning (1 hour/week):** Team reviews the backlog, estimates effort, and commits to a sprint goal; tickets are assigned and prioritized for the upcoming sprint
3. **Code Review Workflow:** PR submitted → CI checks (automated) → reviewer assigned (round-robin or expertise-based) → review comments → author addresses → re-review → approval → merge
4. **Knowledge Sharing:** Regular tech talks (biweekly or monthly), pair programming sessions, and documentation contributions; team members rotate presenting on topics of interest
5. **Decision Making:** Proposals discussed in GitHub Issues or Slack thread; simple decisions (majority vote), technical decisions (ADR with rationale), strategic decisions (team lead final call)
6. **Conflict Resolution:** Escalation path: direct discussion between parties → facilitated discussion with lead → retrospective item → process change

## Patterns

- **Async Standup Pattern:**
  ```
  Yesterday:
  - Merged PR #123 (User export feature)
  - Investigated slow query on dashboard

  Today:
  - Start work on ticket #456 (email notifications)
  - Review PR #124 (auth refactor)

  Blockers:
  - Waiting on database credentials for staging environment
  ```
  Posted in Slack #standup channel before 10 AM.
- **Code Review Etiquette Pattern:**
  ```markdown
  ## Code Review Guidelines
  - Review within 4 hours of assignment (during working hours)
  - Focus on: correctness, security, performance, test coverage
  - Use "nitpick:" prefix for style preferences (non-blocking)
  - Explain the "why" behind suggestions, not just the "what"
  - Approve when satisfied; request changes only for blocking issues
  - Authors: respond to all comments; mark threads resolved after addressing
  ```
- **Documentation by Default Pattern:**
  ```markdown
  ## When to Document
  - Every architecture decision → ADR in docs/adrs/
  - Every significant PR → PR description with context and reasoning
  - Every new environment variable → update .env.example and README
  - Every production incident → postmortem in docs/postmortems/
  - Every meeting with decisions → meeting notes in Notion/wiki
  ```
- **Pair Programming Cadence Pattern:**
  ```markdown
  ## Pair Programming
  - Scheduled: Tuesday/Thursday 2-4 PM (optional participation)
  - Ad-hoc: Any team member can request a pair session via Slack
  - Rotation: Partners rotate weekly; no fixed pairs for >2 weeks
  - Roles: Driver (writes code) and Navigator (reviews, thinks ahead); swap every 20-30 min
  ```
- **Decision-Making Responsibility Pattern:**
  ```markdown
  | Decision Type | Who Decides | Input From | Documentation |
  |--------------|-------------|------------|---------------|
  | Ticket implementation details | Developer | PR reviewer | PR comments |
  | Package/library selection | Team (vote) | All developers | ADR |
  | Architecture changes | Lead + team | All developers | ADR + RFC |
  | Sprint scope | Product manager | Team | Sprint goal |
  | Process changes | Team (retro) | All developers | Retro notes |
  ```

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Standup format | Synchronous (meeting) vs async (Slack) | Async for distributed teams; sync for co-located or hybrid |
| Code review depth | Surface (style) vs deep (logic + architecture) | Deep: focus on correctness, security, and maintainability; style is automated |
| Communication channels | Single channel vs topic channels | Topic channels (#general, #dev, #deployments, #random) to reduce noise |
| Meeting culture | Meeting-heavy vs meeting-minimal | Meeting-minimal: default to async; sync only for complex discussions |

## Tradeoffs

- **Async vs Sync Communication:** Async communication allows deep work without interruptions but can lead to delayed responses and misinterpretation. Sync communication resolves issues quickly but fragments focus time. Use async by default; escalate to sync for complex or urgent matters.
- **Structured vs Organic Collaboration:** Structured patterns (defined standup format, PR review SLA) provide predictability but can feel rigid. Organic collaboration is flexible but inconsistent across team members. A middle ground: light structure with room for team-specific adjustments.
- **Written vs Verbal Culture:** Written culture (documentation by default) creates valuable artifacts but takes more time. Verbal culture is faster in the moment but creates knowledge silos. Laravel teams benefit from written culture because of the framework's strong conventions that translate well to documentation.

## Performance Considerations

- **Meeting Time Budget:** Limit total recurring meetings to <4 hours/week per developer; anything more impacts deep work. Standup (15 min daily), planning (1 hour/week), retro (1 hour/biweekly) = ~3 hours/week.
- **Review Response SLA:** A 4-hour PR review SLA balances responsiveness with reviewer availability. Faster SLAs (1 hour) create pressure; slower SLAs (24 hours) bottleneck the development pipeline.
- **Context Switching:** Each Slack notification or meeting costs 15-25 minutes of context recovery. Batch notifications; use "Do Not Disturb" mode for focus blocks (typically morning hours).

## Production Considerations

- **Incident Communication:** Define a clear incident communication channel and escalation path: initial alert → #incidents channel → incident lead assigned → status updates every 15 min → postmortem within 48 hours.
- **On-Call Rotation:** Document the on-call schedule, handoff procedure, and escalation tree. On-call developers have no meeting obligations during their rotation to maintain focus for incident response.
- **Deployment Communication:** All deployments are announced in #deployments channel with PR references, changelog summary, and rollback instructions. Failed deployments trigger the incident process.

## Common Mistakes

- **Over-meeting:** 5+ hours of recurring meetings per week leaves no time for actual development. Audit meeting attendance quarterly; cancel meetings without regular attendance.
- **Code review as gatekeeping:** Reviewers focus on style nits and personal preferences rather than correctness and architecture. Code review becomes a bottleneck and demoralizes contributors.
- **Slack overload:** 20+ Slack channels with constant @here and @channel notifications; developers mute everything and miss important messages. Consolidate channels; use @here sparingly.
- **No documentation culture:** Decisions are made verbally in meetings and never written down; two months later, no one remembers why a choice was made. Enforce documentation by default for all decisions.
- **Blame culture:** Postmortems focus on "who did this" rather than "what process allowed this to happen." Foster a blameless culture where mistakes are learning opportunities.

## Failure Modes

- **Collaboration Overhead:** The collaboration patterns themselves become a burden; developers spend more time on process than on coding. Mitigate: retroactively review process efficiency; remove patterns that no longer serve the team.
- **Review Bottleneck:** One senior developer is the only reviewer for all PRs; they become overwhelmed and the team slows down. Mitigate: distribute review responsibility; grow review capability across the team.
- **Communication Silos:** Frontend and backend teams don't communicate; integration issues are discovered late. Mitigate: cross-team demos; shared slack channels; joint planning sessions.
- **Decision Paralysis:** Every decision goes through team discussion; even trivial choices require consensus. Mitigate: clear decision-making responsibility matrix; empower developers to make implementation decisions independently.

## Ecosystem Usage

- **Laravel Teams:** Laravel's strong conventions simplify collaboration—there's less to debate about structure because the framework standardizes it. Collaboration patterns focus on team-specific decisions (which packages, which services, which deployment strategy).
- **Laravel Forge:** Forge's team management features (multiple team members per server, deploy logs) affect collaboration patterns around deployment permissions and audit trails.
- **GitHub:** PR reviews, issue tracking, and project boards are the primary collaboration tools; GitHub's code review features (suggested changes, thread resolution, draft PRs) shape the review workflow.
- **Laravel Shift:** Shift's automated upgrade service changes collaboration patterns around version upgrades—less manual work, more review of generated changes.

## Related Knowledge Units

- code-review-standards
- development-workflow-documentation
- contributing-dot-md-patterns
- developer-onboarding-checklists
- pr-template-patterns

## Research Notes

- The State of DevOps Report consistently identifies "generative culture" (high trust, low blame, information flow) as the top predictor of high software delivery performance
- Laravel teams benefit from the framework's opinionated nature; there are fewer "tabs vs spaces" debates, allowing collaboration energy to focus on meaningful architectural decisions
- Remote Laravel teams grew significantly post-2020, leading to increased adoption of async-first patterns and written documentation culture
- The most common collaboration pattern failure in Laravel teams is "meeting creep"—weekly meetings that expand from 30 minutes to 90 minutes without clear agendas or timeboxing
