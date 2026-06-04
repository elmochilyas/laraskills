# Experience Curation: Dependency Update Automation

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/dependency-update-automation
- **Maturity:** Mature
- **Related Technologies:** Dependabot, Renovate, Composer, NPM, GitHub, Laravel
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Dependency update automation refers to the practice of automatically detecting, proposing, and merging updates to a Laravel application's dependencies (Composer packages and NPM packages) using bot services like Dependabot (GitHub-native) or Renovate (cross-platform). These services monitor the project's composer.json and package.json for new versions, create pull requests with the version bump, and run the test suite against the updated dependency. For Laravel teams, dependency automation is critical because the Laravel ecosystem releases frequent updates (framework patches twice monthly, security releases as needed, package updates continuously). Automated dependency updates reduce the manual overhead of tracking releases, catch breaking changes early, and ensure security patches are applied promptly.

## Core Concepts
- **Dependabot:** GitHub's built-in dependency update bot; creates PRs for outdated dependencies based on .github/dependabot.yml; supports Composer and NPM
- **Renovate:** A configurable dependency update tool supporting multiple platforms (GitHub, GitLab, Bitbucket); offers advanced grouping, scheduling, and auto-merging
- **SemVer Categorization:** Dependabot and Renovate use SemVer to categorize updates: major (breaking → human review), minor (features → auto-merge if tests pass), patch (fixes → auto-merge)
- **Update Schedule:** Controls when update PRs are created (daily, weekly, monthly); reduces PR noise by batching non-urgent updates
- **Grouping:** Combining multiple dependency updates into a single PR (e.g., all "laravel/*" packages, all dev-dependencies)
- **Dependency Bot as QA Engineer:** Continuously checks for new versions, creates PRs, and waits for CI feedback

## When To Use
- Every Laravel project with external dependencies (Composer, NPM packages)
- Projects that want to stay current with framework and package updates
- Teams that want to reduce manual dependency tracking overhead
- Security-conscious projects that need prompt vulnerability patching
- Projects with CI pipelines that can validate dependency update PRs

## When NOT To Use
- Projects with no external dependencies (rare for Laravel applications)
- Projects in maintenance mode where dependencies are intentionally frozen
- Projects without reliable CI test suites (auto-merge without test confidence is dangerous)
- Prototype projects where dependency management is not a priority

## Best Practices
- **WHY:** Start with Dependabot for simplicity (zero-config, GitHub-native); migrate to Renovate when advanced grouping and scheduling needs arise
- **WHY:** Use type-based grouping: non-breaking updates (patch + minor) in one PR, major updates in separate PRs; this reduces PR noise while maintaining safety
- **WHY:** Enable auto-merge for patch and minor updates only when CI passes; major updates always require human review for breaking changes and upgrade effort assessment
- **WHY:** Configure security updates to bypass the regular schedule; security patches should be reviewed and deployed within 24 hours, not waiting for the weekly batch
- **WHY:** Ensure the test suite is reliable before enabling auto-merge; a flaky test suite causes false failures on dependency updates, requiring human intervention

## Architecture Guidelines
- **Dependabot Configuration Pattern:** .github/dependabot.yml with package-ecosystem (composer, npm), schedule (weekly), open-pull-requests-limit
- **Renovate Grouping Pattern:** Group laravel/* packages together, non-breaking updates together, major updates separately with assigned reviewers
- **CI Integration Pattern:** Full CI pipeline (tests, Pint, PHPStan) runs on every dependency update PR
- **Security Update Priority Pattern:** Security updates auto-merged (with CI passing) for prompt patching; labeled "security" for visibility
- **Schedule Pattern:** Weekly for most projects (balance freshness vs noise); daily for security-critical; Monday morning scheduling to avoid weekend PRs
- **Bot Tool:** Dependabot for simplicity; Renovate for advanced grouping, scheduling, auto-merge policies
- **Auto-merge Policy:** Patch and minor auto-merge; major requires human review
- **Update Grouping:** Type-based: non-breaking in one PR, breaking in separate PRs

## Performance
- Each dependency update PR triggers a full CI run (5-20 minutes); with 10-20 weekly dependency PRs, this adds 1-4 hours of CI time per week; grouping reduces this to 2-3 PRs
- Multiple dependency update PRs modify composer.lock, causing merge conflicts; grouping and sequential processing reduces conflicts
- Dependency update automation is only as reliable as the test suite; invest in test reliability before enabling auto-merge
- Teams using automated dependency updates apply security patches 4x faster than teams relying on manual tracking

## Security
- Security patches should be auto-merged (with CI passing) for prompt remediation; configure bypass for the regular update schedule
- Exclude major version updates from automation; they require significant manual effort and testing
- Regularly audit dependency list for abandoned packages, duplicates, and unused packages
- Always commit composer.lock; security scanners need it to determine exact package versions
- For air-gapped environments, use Dependabot's vendoring feature or a private security advisory mirror

## Common Mistakes

### Auto-merging without CI trust
- **Description:** Enabling auto-merge before the test suite is reliable
- **Consequence:** A bad dependency passes tests, auto-merges, and breaks production
- **Better Approach:** Ensure test suite reliability first; start with manual review for all updates; graduate to auto-merge for patches only

### No grouping
- **Description:** Every outdated package gets its own PR
- **Consequence:** Team is overwhelmed with 30+ open dependency PRs
- **Better Approach:** Group non-breaking updates into a single weekly PR; separate major updates

### Ignoring major updates
- **Description:** Major update PRs pile up because no one reviews them
- **Consequence:** Project falls significantly behind on framework versions; eventual upgrade is much harder
- **Better Approach:** Schedule dedicated time for major updates; use Renovate's assignees to route to responsible developers

### Not excluding problematic packages
- **Description:** A package with frequent breaking changes in minor versions keeps creating failing PRs
- **Consequence:** Noise without value; developer ignores Dependabot PRs
- **Better Approach:** Exclude or pin packages with unstable versioning; handle them manually

### Lock file not committed
- **Description:** composer.lock is in .gitignore
- **Consequence:** Dependency update PRs can't update the lock file; different developers get different versions
- **Better Approach:** Always commit composer.lock; security scanners need it

## Anti-Patterns
- **No dependency automation:** Manually checking for updates; frequently outdated dependencies
- **Auto-merging everything:** Major version bumps auto-merge without review; breaking changes reach production unexpectedly
- **Daily updates for all packages:** 50+ PRs per week overwhelm the team; use weekly or monthly for non-critical packages
- **Ignoring Dependabot alerts:** PRs created but never reviewed; repository accumulates vulnerable dependencies
- **No major update strategy:** Avoiding major version upgrades indefinitely; technical debt grows

## Examples
- **Laravel Framework:** Most frequently updated dependency; Dependabot PRs appear on every patch Tuesday
- **Laravel Packages:** First-party and third-party packages updated via same automation
- **Laravel Forge:** Deployment hooks triggered after dependency updates merged
- **Laravel Shift:** Handles major Laravel version upgrades that are outside daily dependency automation scope

## Related Topics
- github-actions-for-laravel (CI platform for validating dependency updates)
- automated-testing-in-ci (test suite validates dependency updates)
- security-scanning (Dependabot security alerts complement dependency updates)
- automated-changelog-generation (changelog entries for dependency updates)
- composer-version-constraints (proper version constraint syntax for SemVer)

## AI Agent Notes
- Dependabot was acquired by GitHub in 2019 and is now the most widely used tool (3M+ repositories)
- Renovate is preferred for teams needing advanced grouping, scheduling, and configuration
- The Laravel community has a strong "stay current" culture; many teams update to latest patches within 2 weeks
- Start with Dependabot for basic setup; migrate to Renovate when PR volume requires grouping
- Security update automation is the highest priority; configure bypass for regular schedules

## Verification
- [ ] Dependabot or Renovate is configured for Composer and NPM dependencies
- [ ] Update schedule is set (weekly recommended for most projects)
- [ ] Non-breaking updates are grouped into a single PR
- [ ] Patch and minor updates have auto-merge enabled (with CI passing)
- [ ] Major updates require human review and are assigned to team members
- [ ] Security updates bypass the regular schedule for prompt patching
- [ ] composer.lock is committed to the repository
- [ ] Test suite is reliable before auto-merge is enabled
- [ ] Problematic packages are excluded or pinned
- [ ] Dependency audit (abandoned, duplicate, unused) is performed regularly
