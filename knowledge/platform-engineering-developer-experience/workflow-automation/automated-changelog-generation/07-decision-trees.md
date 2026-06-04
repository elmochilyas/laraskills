# 07-Decision Trees: Automated Changelog Generation

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | automated-changelog-generation |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Source of Truth | PR labels vs Conventional Commits vs hybrid | What structured input drives changelog categorization? |
| D02 | Generation Timing | Per-PR vs release-time generation | When should the changelog be updated in the workflow? |
| D03 | Tool Selection | Release Drafter vs custom action vs manual hybrid | Which automation tool fits the team's workflow? |
| D04 | Breaking Changes Handling | How to surface breaking changes prominently | How do we ensure breaking changes are clearly communicated? |

## Architecture-Level Decision Trees

### D01: Source of Truth

```
START: What drives changelog categorization?
│
├── PR labels (GitHub-native, easiest for non-committers)
│   ├── Label mapping: feature→Added, bug→Fixed, breaking→Breaking Change
│   ├── Tool: Release Drafter uses PR labels directly
│   ├── Pro: no commit message discipline required
│   ├── Con: labels must be consistently applied
│   └── Best for: teams without Conventional Commits adoption
│
├── Conventional Commits (git history-based, disciplined)
│   ├── Commit pattern: feat:, fix:, chore:, BREAKING CHANGE:
│   ├── Tool: git log parsing with commit type mapping
│   ├── Pro: changelog derived directly from git history
│   ├── Con: requires commit message discipline across the team
│   └── Best for: teams already using Conventional Commits
│
├── Hybrid (recommended)
│   ├── PR labels for categorization (easier, more reliable)
│   ├── Conventional Commits for commit history (optional)
│   ├── Release Drafter with label mapping for automation
│   └── Best for: most teams — balances ease and structure
│
└── Key requirement: consistency of input
    ├── Define labels or commit types and enforce them
    ├── Document in CONTRIBUTING.md
    └── Review label/commit compliance during PR review
```

### D02: Generation Timing

```
START: When should the changelog be generated?
│
├── Release-time generation (recommended)
│   ├── Trigger: tag creation or release workflow dispatch
│   ├── Tool: Release Drafter drafts release notes at release time
│   ├── Pro: avoids merge conflicts on CHANGELOG.md
│   ├── Pro: includes all changes that landed in this release
│   ├── Con: CHANGELOG.md must be committed separately
│   └── Best for: most projects
│
├── Per-PR generation (adds noise, merge conflicts)
│   ├── Each PR updates CHANGELOG.md
│   ├── Con: frequent merge conflicts on CHANGELOG.md
│   ├── Con: unreleased section churn
│   └── Not recommended
│
├── Hybrid approach
│   ├── CHANGELOG.md maintained with Unreleased section
│   ├── Manual curation before release
│   ├── Automated generation updates CHANGELOG.md at tag
│   ├── Then: manually curate for context and clarity
│   └── Best for: projects wanting human curation
│
└── Recommended: auto-generate at release, manual curation before publish
    ├── Release Drafter drafts → human reviews → publish
    └── Commit final CHANGELOG.md with release commit
```

### D03: Tool Selection

```
START: Which changelog automation tool should we use?
│
├── Release Drafter (recommended for GitHub)
│   ├── Config: .github/release-drafter.yml
│   ├── Behavior: drafts release notes from PR labels
│   ├── Pro: zero-config, works with PR labels
│   ├── Pro: publishes when release is created
│   └── Best for: most GitHub-hosted Laravel projects
│
├── Custom GitHub Action (more control)
│   ├── Uses git-chglog, semantic-release, or custom script
│   ├── Pro: full control over format and behavior
│   ├── Con: more setup and maintenance
│   └── Best for: teams with specific format requirements
│
├── Manual + automated hybrid
│   ├── Auto-generate raw changelog from commits/labels
│   ├── Human curates before release (adds context, links)
│   └── Best for: projects where changelog quality is paramount
│
└── CHANGELOG.md vs GitHub Releases
    ├── Both: CHANGELOG.md in repo (versioned, searchable)
    ├── Both: GitHub Releases (notifications, downloads)
    └── Sync: Release Drafter can update both
```

### D04: Breaking Changes Handling

```
START: How do we ensure breaking changes are communicated?
│
├── Dedicated Breaking Changes section (required)
│   ├── Separate from "Changed" section
│   ├── Label: "breaking" in PR → maps to Breaking Changes
│   ├── Each entry includes: what changed, migration instructions
│   └── Users scan this section first during upgrades
│
├── Migration instructions
│   ├── For each breaking change: step-by-step migration guide
│   ├── Link to upgrade guides or documentation
│   ├── Code examples for before/after
│   └── Without instructions: users can't upgrade safely
│
├── Semantic versioning linkage
│   ├── Breaking change → MAJOR version bump
│   ├── Release Drafter can suggest version based on labels
│   └── MAJOR releases should have longer changelog entries
│
└── Verification
    ├── Review: PR with "breaking" label has migration instructions
    ├── CI: check that breaking changes PRs include migration notes
    └── SLA: breaking changes documented within 24h of merge
```
