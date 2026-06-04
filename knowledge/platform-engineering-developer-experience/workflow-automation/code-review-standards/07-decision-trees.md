# 07-Decision Trees: Code Review Standards

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | code-review-standards |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Review Depth | How thorough to review based on PR type | What level of scrutiny does this change need? |
| D02 | Reviewer Assignment | Who should review the PR | Who has the domain knowledge to review this change effectively? |
| D03 | Review SLA | How quickly the PR should be reviewed | How long can the PR wait before blocking the developer? |
| D04 | Communication Tone | How to provide constructive feedback | How do we communicate issues without causing friction? |

## Architecture-Level Decision Trees

### D01: Review Depth

```
START: How deeply should we review this PR?
│
├── Light review (5-10 min)
│   ├── When: bug fix, dependency update, documentation
│   ├── Focus: obvious bugs, logic correctness, no architecture concerns
│   ├── Skip: deep architecture analysis, performance review
│   └── Best for: small, contained changes
│
├── Standard review (20-30 min)
│   ├── When: feature addition, new endpoints, model changes
│   ├── Focus: N+1 queries, authorization gates, validation logic, test coverage
│   ├── Check: form requests, policies, queue jobs, migrations
│   └── Best for: typical feature PRs
│
├── Deep review (30-60 min)
│   ├── When: architecture change, new service, security impact, migration
│   ├── Focus: design patterns, security implications, performance, backward compatibility
│   ├── Additional: schema design, API contract, deployment impact
│   └── Best for: cross-cutting or high-impact changes
│
└── All reviews include (regardless of depth)
    ├── Automated: Pint, PHPStan, tests — handled by CI
    ├── Manual: logic correctness, architecture fit, edge cases
    └── No style comments (CI handles formatting)
```

### D02: Reviewer Assignment

```
START: Who should review this PR?
│
├── Automatic via CODEOWNERS (standard PRs)
│   ├── File-based assignments: .github/CODEOWNERS
│   ├── Example: src/Actions/* @team-lead @senior-dev
│   ├── Pro: domain experts review relevant changes
│   └── Best for: most PRs — automatic, consistent
│
├── Manual request (specialized PRs)
│   ├── When: change needs specific expertise not in CODEOWNERS
│   ├── Request: @username with context on what's needed
│   └── Best for: security review, performance review, new tech
│
├── One reviewer (standard) vs Two (architectural)
│   ├── Standard PRs: 1 approval sufficient
│   ├── Architectural changes: 2 approvals
│   ├── Security-critical: 1 standard + 1 security-specific
│   └── Config: branch protection rules for required reviews
│
└── Review rotation
    ├── Distribute reviews across the team
    ├── Avoid single-reviewer bottleneck
    ├── Max 5 PRs per reviewer in queue
    └── Senior devs review, but don't gate all PRs
```

### D03: Review SLA

```
START: How quickly should this PR be reviewed?
│
├── Urgent (hotfix, production issue)
│   ├── SLA: <1 hour
│   ├── Notify: reviewer directly (Slack, phone)
│   ├── Process: expedite, post-deploy review if needed
│   └── After: document root cause, add CI guard
│
├── Standard (most PRs)
│   ├── SLA: <4 hours (within business hours)
│   ├── Notification: GitHub notification, Slack bot
│   ├── Pro: keeps development flowing, prevents context loss
│   └── If unavailable: assign to backup reviewer
│
├── Low-priority (docs, minor refactoring)
│   ├── SLA: <24 hours
│   ├── Reviewer: can batch with other reviews
│   └── No blocking: author can start next task
│
└── SLA monitoring
    ├── Track: median time-to-review per PR
    ├── Alert: if median exceeds SLA by 2x
    ├── Goal: <4 hours for standard PRs
    └── Teams with fast reviews deliver 50% more features
```

### D04: Communication Tone

```
START: How should we communicate feedback?
│
├── Issue + Suggestion + Why format
│   ├── Issue: describe the problem clearly
│   ├── Suggestion: propose a specific fix
│   ├── Why: explain why it matters (security, performance, maintainability)
│   ├── Example: "This query has an N+1 pattern (Issue). Eager-load the relationship (Suggestion). Otherwise, each iteration triggers a separate query (Why)."
│   └── Use: for all blocking feedback
│
├── "nit:" prefix for non-blocking suggestions
│   ├── nit: minor style preference (if not covered by Pint)
│   ├── nit: alternative approach that's equally valid
│   ├── Author can ignore or apply at their discretion
│   └── Use: to distinguish blocking from non-blocking
│
├── What NOT to do
│   ├── Don't comment on style (CI handles it)
│   ├── Don't request changes without explanation
│   ├── Don't approve with "looks good" without actually reviewing
│   ├── Don't make subjective design preferences blocking
│   └── Don't review the author, review the code
│
└── Review resolution
    ├── Approve: "ready to merge as-is or with minor nits"
    ├── Comment: "feedback provided, no blocking issues"
    ├── Request Changes: "blocking issue, must fix before merge"
    └── Close: "won't fix / not needed" (rare, with explanation)
```
