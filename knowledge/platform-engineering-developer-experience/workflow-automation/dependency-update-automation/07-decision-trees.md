# 07-Decision Trees: Dependency Update Automation

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | dependency-update-automation |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Tool Selection | Dependabot vs Renovate | Do we need basic or advanced dependency update automation? |
| D02 | Update Strategy | Grouping and scheduling approach | How do we balance staying current with managing PR volume? |
| D03 | Auto-merge Policy | Which updates merge automatically | What level of risk are we willing to auto-merge? |
| D04 | Security Updates | How to handle vulnerability patches | How quickly do we need security fixes applied? |

## Architecture-Level Decision Trees

### D01: Tool Selection

```
START: Which dependency update tool should we use?
│
├── Dependabot (GitHub-native, simple)
│   ├── Config: .github/dependabot.yml
│   ├── Supports: Composer, NPM, Docker, GitHub Actions
│   ├── Features:
│   │   ├── Version update PRs (weekly schedule)
│   │   ├── Security update PRs (instant on advisory)
│   │   └── Labels, reviewers, auto-merge
│   ├── Pro: zero setup (GitHub-native), free
│   ├── Con: limited grouping (one PR per package)
│   └── Best for: simple projects, small teams
│
├── Renovate (advanced, configurable)
│   ├── Config: renovate.json (or .github/renovate.json)
│   ├── Supports: same ecosystems as Dependabot + more
│   ├── Features:
│   │   ├── Advanced grouping (all laravel/* in one PR)
│   │   ├── Custom schedules (automerging, time window)
│   │   ├── Auto-merge policies (per type)
│   │   └── Dashboard PR for overview
│   ├── Pro: powerful grouping, flexible config
│   ├── Con: more setup, can be complex
│   └── Best for: teams needing grouped PRs, custom policies
│
└── Recommendation
    ├── Start with Dependabot (simple, works out of the box)
    ├── Migrate to Renovate when PR volume exceeds Dependabot's management
    └─ Or use Renovate from start if advanced grouping is needed
```

### D02: Update Strategy

```
START: How should we group and schedule updates?
│
├── No grouping (Dependabot default)
│   ├── Each outdated package → separate PR
│   ├── Weekly schedule: 10-30 PRs for typical Laravel project
│   ├── Pro: per-package testing, clear changelog
│   ├── Con: PR overload, team ignores them
│   └── Only sustainable with auto-merge for non-breaking
│
├── Type-based grouping (recommended)
│   ├── Group 1: Non-breaking updates (patch + minor) in one PR
│   ├── Group 2: Major updates (one per package, separate PRs)
│   ├── Group 3: Dev dependencies in one PR
│   ├── Renovate can do this natively
│   └── Pro: manageable PR count, clear risk categorization
│
├── Ecosystem grouping
│   ├── Group: all laravel/* packages together
│   ├── Group: all PHP packages together
│   ├── Group: all NPM packages together
│   └── Reduce: from 20+ PRs to 3-4 PRs per week
│
└── Schedule
    ├── Weekly: recommended balance (most projects)
    ├── Daily: security-critical, active development
    ├── Monthly: maintenance mode projects
    └── Time: Monday morning (avoid weekend PRs)
```

### D03: Auto-merge Policy

```
START: Which updates should auto-merge?
│
├── Never auto-merge (safest, but highest overhead)
│   ├── All updates require human review
│   ├── Pro: full control, no surprises
│   ├── Con: PR backlog, slow adoption
    └── Best for: high-compliance, manually reviewed projects
│
├── Non-breaking auto-merge (recommended)
│   ├── Patch updates: auto-merge after CI passes
│   ├── Minor updates: auto-merge after CI passes
│   ├── Major updates: human review required
│   ├── Prerequisite: reliable CI test suite
│   ├── Pro: low overhead for safe updates
│   └── Best for: most projects
│
├── All auto-merge (risky)
│   ├── Major version bumps merge automatically
│   ├── Breaking changes can reach production unexpectedly
│   └── Not recommended
│
└── Prerequisites for auto-merge
    ├── Reliable CI test suite (no flaky tests)
    ├── PHPStan passing (catches type issues)
    ├── Composer audit passing (security check)
    ├── Define "non-breaking" via SemVer
    └── Test auto-merge policy in staging first
```

### D04: Security Updates

```
START: How should we handle security vulnerability updates?
│
├── Dependabot security alerts (automatic)
│   ├── Enabled by default on GitHub
│   ├── Creates PR with fix when available
│   ├── Labels: "security" for visibility
│   └── Severity: Critical, High, Medium, Low
│
├── Auto-merge security patches (recommended)
│   ├── Critical + High: auto-merge with CI passing
│   ├── Medium: auto-merge or brief human review
│   ├── Low: bundle with weekly update
│   ├── Bypass: security updates ignore regular schedule
│   └── Rationale: faster patch = smaller attack window
│
├── Composer audit in CI (safety net)
│   ├── Command: composer audit
│   ├── Fails CI if known vulnerabilities found
│   ├── Blocks PRs with vulnerable dependencies
│   └── Complements Dependabot (proactive + reactive)
│
└── Vulnerability SLA
    ├── Critical: patch within 24 hours
    ├── High: patch within 72 hours
    ├── Medium: patch within 2 weeks
    └── Low: patch within 1 month
```
