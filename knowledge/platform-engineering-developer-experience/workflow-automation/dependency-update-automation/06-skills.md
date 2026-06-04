# Skill: Configure Dependency Update Automation

## Purpose
Set up Dependabot or Renovate to automatically detect, propose, and merge dependency updates for Laravel projects with proper scheduling, grouping, and auto-merge rules.

## When To Use
- Every Laravel project with external dependencies (Composer, NPM packages)
- Projects wanting to stay current with framework and package updates
- Teams wanting to reduce manual dependency tracking overhead

## When NOT To Use
- Projects in maintenance mode where dependencies are intentionally frozen
- Prototypes where dependency management isn't a priority
- Projects without a reliable test suite (auto-merge requires CI confidence)

## Prerequisites
- GitHub repository (for Dependabot) or GitLab/Bitbucket (for Renovate)
- `composer.lock` committed to version control
- Reliable CI test suite

## Inputs
- `.github/dependabot.yml` — Dependabot configuration
- `renovate.json` — Renovate configuration (if used)

## Workflow

1. **Start with Dependabot:** Add `.github/dependabot.yml` with `package-ecosystem: composer`, directory: `/`, schedule: `weekly`. Dependabot is zero-config and GitHub-native. Migrate to Renovate for advanced needs.

2. **Configure Type-Based Grouping:** Group non-breaking updates (patch+minor) into one PR per group (e.g., all `laravel/*` packages). Keep major updates in separate PRs requiring human review.

3. **Auto-Merge Patch and Minor Updates:** Enable auto-merge when CI passes for patch and minor updates. Major updates always require human review.

4. **Handle Security Updates:** Bypass regular schedule for security updates. Review and deploy within 24 hours for critical vulnerabilities.

5. **Set Weekly Schedule:** Run dependency updates weekly for most projects. Balances dependency freshness with PR noise. Daily updates for security-focused projects.

6. **Ensure Test Suite Reliability:** Verify the test suite is reliable before enabling auto-merge. Flaky tests cause false failures that block or incorrectly approve updates.

7. **Run Full CI Pipeline on Each PR:** Run all CI checks (tests, Pint, PHPStan) on every dependency update PR. Don't skip quality gates for bot-generated PRs.

## Validation Checklist

- [ ] Dependabot/Renovate configured for Composer and NPM
- [ ] Patch and minor updates grouped into single PRs
- [ ] Auto-merge enabled for patch+minor (CI must pass)
- [ ] Major updates require human review
- [ ] Security updates bypass regular schedule
- [ ] Test suite is reliable (no flaky tests)
- [ ] `composer.lock` committed
- [ ] Weekly schedule configured

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Flaky tests auto-merging bad updates | Fix flaky tests before enabling auto-merge |
| `composer.lock` not committed | Dependabot can't determine current versions |
| No grouping = PR noise | Group related updates; use weekly schedule |
| Major updates auto-merged | Always require human review for breaking changes |

## Decision Points

- **Use for every Laravel project with external dependencies**
- **Skip for projects in maintenance mode** where dependencies are intentionally frozen
- **Skip for prototypes** where dependency management isn't a priority
- **Dependabot for simplicity; Renovate for advanced features** (grouping, scheduling, auto-merge)

## Performance/Security Considerations

- **Security updates have priority:** Process within 24 hours for critical vulnerabilities
- **composer.lock required:** Security scanners need exact versions to determine vulnerability status
- **CI cost:** Each dependency PR runs full CI; weekly schedule keeps cost manageable

## Related Rules

- DEPAUTO-RULE-001: Start with Dependabot for simplicity
- DEPAUTO-RULE-002: Use type-based grouping
- DEPAUTO-RULE-003: Auto-merge for patch and minor updates
- DEPAUTO-RULE-004: Security updates bypass regular schedule
- DEPAUTO-RULE-005: Ensure test suite is reliable before auto-merge

## Related Skills

- Set Up Automated Testing in CI
- Run Security Scanning in CI
- Generate Automated Changelogs

## Success Criteria

- Dependency update PRs arrive on schedule with grouped non-breaking changes
- Patch and minor updates auto-merge safely when CI passes
- Major updates get human review before merging
- Security vulnerabilities are patched within SLA (24h for critical)
