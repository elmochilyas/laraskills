# Skill: Generate Automated Changelogs

## Purpose
Set up automated changelog generation using Release Drafter or Conventional Commits to produce structured changelogs at release time, eliminating manual effort and ensuring consistent formatting.

## When To Use
- Every Laravel package or application released to users
- Projects with multiple contributors where tracking changes manually is impractical
- Open-source packages requiring clear release notes

## When NOT To Use
- Internal tools with a single user where changelog overhead isn't justified
- Prototypes with no formal releases

## Prerequisites
- GitHub repository (for Release Drafter) or Conventional Commits convention
- `.github/release-drafter.yml` configuration (if using Release Drafter)

## Inputs
- PR labels (for Release Drafter) or commit messages (for Conventional Commits)
- `.github/release-drafter.yml` — release drafter configuration

## Workflow

1. **Choose Source of Truth:** Use PR labels (Release Drafter) for teams already labeling PRs. Use Conventional Commits (`feat:`, `fix:`, `BREAKING CHANGE:`) for teams wanting commit-level control.

2. **Configure Release Drafter:** Create `.github/release-drafter.yml` with categories for breaking changes, features, bug fixes, and maintenance. Map PR labels to sections.

3. **Use "Keep a Changelog" Format:** Structure sections: Breaking Changes, Added, Changed, Deprecated, Removed, Fixed, Security. Include migration instructions for breaking changes.

4. **Generate at Release Time:** Trigger changelog generation on tag or workflow dispatch, not per-commit. This produces a single comprehensive changelog per release.

5. **Curate Before Release:** Review the generated changelog before publishing. Add context, explanations, and links to documentation. Remove entries that don't warrant user-facing notes.

6. **Maintain Unreleased Section:** Keep a running log of changes not yet released at the top of `CHANGELOG.md`. This provides visibility into what's coming in the next release.

7. **Maintain Both Formats:** Keep `CHANGELOG.md` in the repo (versioned, searchable) AND publish GitHub Releases (notifications, downloads).

## Validation Checklist

- [ ] Changelog follows "Keep a Changelog" format
- [ ] Sections match: Breaking Changes, Added, Changed, Fixed, Security
- [ ] Breaking changes include migration instructions
- [ ] Changelog generated at release time, not per-commit
- [ ] Unreleased section maintained during development
- [ ] PR labels or conventional commits used consistently
- [ ] Changelog curated before publication

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Inconsistent PR labels | Categories miss entries; enforce label requirements |
| Changelog per-commit | Too many small entries; generate at release time only |
| Breaking changes without migration | Users blocked on upgrade; always include migration notes |

## Decision Points

- **Use for every Laravel package or application** released to users
- **Skip for internal tools with single user** where changelog overhead isn't justified
- **PR labels vs Conventional Commits:** Labels for team workflows; commits for API-defined standards

## Performance/Security Considerations

- **Generation is negligible** — < 1 second; runs at release time only
- **Breaking change documentation** — Critical for user trust; always include migration instructions

## Related Rules

- CHANGELOG-RULE-001: Use PR labels or Conventional Commits
- CHANGELOG-RULE-002: Generate at release time
- CHANGELOG-RULE-003: Maintain both CHANGELOG.md and GitHub Releases
- CHANGELOG-RULE-004: Use "Keep a Changelog" format
- CHANGELOG-RULE-005: Mark breaking changes with migration instructions

## Related Skills

- Set Up Automated Deployment Pipelines
- Create PR Template Patterns
- Configure Dependency Update Automation

## Success Criteria

- Changelog is automatically generated at each release with correct categorization
- Breaking changes include clear migration instructions
- Unreleased section tracks in-progress changes
- Changelog is curated before publication for quality and completeness
