# 07-Decision Trees: PR Template Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | pr-template-patterns |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Template Count | Single vs multiple templates | Does the project have diverse PR types needing different prompts? |
| D02 | Checklist Design | Manual vs CI-enforced checklist items | What should authors self-verify vs rely on CI for? |
| D03 | Deployment Notes | How to document deployment requirements | How do we capture migration, env, and queue changes needed for deployment? |
| D04 | Template Maintenance | How to keep templates current | How often should templates be reviewed and updated? |

## Architecture-Level Decision Trees

### D01: Template Count

```
START: How many PR templates should we have?
│
├── Single template (recommended for most teams)
│   ├── File: .github/PULL_REQUEST_TEMPLATE.md
│   ├── Sections: Description, Ticket, Type, Checklist, Deployment Notes
│   ├── Use: "if applicable" language for optional sections
│   ├── Pro: simpler, one file to maintain
│   └── Best for: most teams, standard PR types
│
├── Multiple templates (diverse PR types)
│   ├── Directory: .github/PULL_REQUEST_TEMPLATE/
│   ├── Files:
│   │   ├── default.md — standard PR
│   │   ├── bug_fix.md — steps to reproduce, root cause
│   │   ├── feature.md — how to test, API changes, docs
│   │   ├── hotfix.md — urgency, impact, risk assessment
│   │   └── dependency_update.md — changed packages, breaking changes
│   ├── Pro: tailored prompts per PR type
│   ├── Con: multiple files to maintain
│   └── Best for: projects with diverse contribution types
│
└── Template reference in URL
    ├── GitHub: ?template=bug_fix.md in PR URL
    ├── Or: default.md used automatically
    └── Set: blank issues setting to require template
```

### D02: Checklist Design

```
START: What should go in the PR checklist?
│
├── Automated items (CI-enforced) — as reminders
│   ├── □ Pint passes (CI checks this, but run locally first)
│   ├── □ PHPStan passes (CI checks this)
│   ├── □ Tests pass (CI checks this)
│   ├── Purpose: prompt author to run checks before creating PR
│   └── Don't: ask reviewer to verify CI items
│
├── Manual items (human-verified)
│   ├── □ Tests added for new functionality
│   ├── □ Documentation updated
│   ├── □ Screenshots attached (for UI changes)
│   ├── □ Migration considered backward compatible
│   ├── Purpose: things CI can't check
│   └── Reviewer: verifies these during review
│
├── Checklist best practices
│   ├── 5-7 items max (checkbox fatigue at 10+)
│   ├── Mix of automated (reminders) and manual (verification)
│   ├── Use "if applicable" for conditional items
│   └── Review checklist quarterly for relevance
│
└── What NOT to include
    ├── Items CI already enforces (as reviewer items)
    ├── Subjective quality measures ("code is clean")
    └── Irrelevant project-specific items
```

### D03: Deployment Notes

```
START: How do we document deployment requirements?
│
├── Section in template
│   ├── Header: "## Deployment Notes"
│   ├── Sub-items:
│   │   ├── □ Migrations required? (yes/no)
│   │   ├── □ New environment variables? (list)
│   │   ├── □ Queue restart needed?
│   │   ├── □ Cache clear needed?
│   │   └── □ Breaking changes? (migration instructions)
│   ├── Filled by: PR author
│   └── Used by: release manager for deployment coordination
│
├── Why it matters
│   ├── Prevents: deploying without running migrations
│   ├── Prevents: missing env var configuration
│   ├── Prevents: old queue workers processing new jobs
│   └── Essential for: smooth deployments, fewer rollbacks
│
└── Integration with deployment pipeline
    ├── Release manager reviews deployment notes
    ├── Adds deployment checklist items
    ├── Coordinates migration timing
    └── Post-deploy: confirms all notes addressed
```

### D04: Template Maintenance

```
START: How often should we review PR templates?
│
├── Quarterly review (recommended)
│   ├── During: quarterly team retros or planning
│   ├── Check: are all sections still relevant?
│   ├── Check: do tools referenced still exist?
│   ├── Check: is anything missing (new tool, new process)?
│   └── Update: commit changes as normal PR
│
├── Trigger-based review
│   ├── After: new quality tool adoption (e.g., adding PHPStan)
│   ├── After: workflow change (e.g., new deployment process)
│   ├── After: team feedback ("this section isn't useful")
│   └── Update: as needed, don't wait for quarterly
│
├── Common updates
│   ├── Adding/removing checklist items
│   ├── Updating tool names or versions
│   ├── Adding new deployment considerations
│   └── Simplifying based on team feedback
│
└── Review trigger: CI template usage tracking
    ├── Are templates consistently filled? If not → too long
    ├── Are reviewers asking same questions repeatedly? → add section
    └── Team pulse: quarterly survey on template usefulness
```
