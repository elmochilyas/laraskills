# Knowledge Unit: Dependency Update Automation

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/dependency-update-automation
- **Maturity:** Mature
- **Related Technologies:** Dependabot, Renovate, Composer, NPM, GitHub, Laravel

## Executive Summary

Dependency update automation refers to the practice of automatically detecting, proposing, and merging updates to a Laravel application's dependencies (Composer packages and NPM packages) using bot services like Dependabot (GitHub-native) or Renovate (cross-platform). These services monitor the project's composer.json and package.json for new versions, create pull requests with the version bump, and run the test suite against the updated dependency. For Laravel teams, dependency automation is critical because the Laravel ecosystem releases frequent updates (framework patches twice monthly, security releases as needed, package updates continuously). Automated dependency updates reduce the manual overhead of tracking releases, catch breaking changes early (when the impact is smallest), and ensure security patches are applied promptly. The automation is configured to batch non-breaking updates into a single PR, flag breaking changes for human review, and run full CI validation on every update PR.

## Core Concepts

- **Dependabot:** GitHub's built-in dependency update bot; creates PRs for outdated dependencies based on a configuration file (.github/dependabot.yml); supports Composer and NPM
- **Renovate:** A configurable dependency update tool that supports multiple platforms (GitHub, GitLab, Bitbucket); offers advanced features like grouping, scheduling, and auto-merging
- **Semantic Versioning (SemVer):** The versioning scheme that Dependabot and Renovate use to categorize updates: major (breaking changes → human review), minor (new features → auto-merge if tests pass), patch (bug fixes → auto-merge)
- **Update Schedule:** Configuration that controls when dependency update PRs are created (daily, weekly, monthly); reduces PR noise by batching non-urgent updates
- **Grouping:** Combining multiple dependency updates into a single PR (e.g., all "laravel/*" packages, all dev-dependencies); reduces the number of PRs while maintaining safety

## Mental Models

- **Dependency Bot as Tireless QA Engineer:** The bot continuously checks for new package versions, creates PRs, and waits for CI feedback—like having a QA engineer dedicated solely to keeping dependencies current
- **Auto-Merge as Confidence Signal:** Auto-merging patch and minor updates signals high confidence in the test suite's ability to catch regressions; if a bad update passes tests, the test suite is incomplete
- **Update Frequency as Technical Debt Indicator:** The number of outstanding dependency updates is a leading indicator of technical debt; a project with 30+ outdated packages has likely neglected maintenance

## Internal Mechanics

1. **Manifest Scanning:** Dependabot/Renovate scans composer.json, composer.lock, package.json, and package-lock.json to identify current dependency versions and their latest available versions
2. **Version Comparison:** The bot compares each installed version against the latest version from Packagist/NPM, factoring in SemVer constraints from composer.json (^, ~, exact)
3. **PR Creation:** For each outdated dependency (or group of dependencies), the bot creates a PR with: the version bump, updated lock file, changelog/release notes link, and CI trigger
4. **CI Validation:** The PR triggers the project's CI pipeline (tests, Pint, PHPStan); the bot monitors CI results and reports pass/fail on the PR
5. **Auto-Merge (Optional):** If configured and CI passes, the bot automatically merges the PR; for breaking changes, it leaves the PR for human review
6. **Scheduling:** Updates are checked on a configurable schedule (e.g., daily at 9 AM, weekly on Monday); Renovate supports more granular scheduling than Dependabot

## Patterns

- **Dependabot Configuration Pattern:**
  ```yaml
  # .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: "composer"
      directory: "/"
      schedule:
        interval: "weekly"
      open-pull-requests-limit: 10
      labels:
        - "dependencies"
        - "php"
  ```
  Basic Dependabot config for Composer dependencies with weekly updates.
- **Renovate Grouping Pattern:**
  ```json
  {
    "packageRules": [
      {
        "matchPackagePrefixes": ["laravel/"],
        "groupName": "Laravel Framework",
        "automerge": false
      },
      {
        "matchUpdateTypes": ["patch", "minor"],
        "groupName": "Non-breaking updates",
        "automerge": true
      },
      {
        "matchUpdateTypes": ["major"],
        "groupName": "Major updates",
        "automerge": false,
        "assignees": ["team-lead"]
      }
    ]
  }
  ```
  Groups updates by type; auto-merges patch/minor, assigns major updates to the team lead.
- **CI Integration Pattern:**
  ```yaml
  name: Dependency PR
  on: pull_request
  steps:
    - uses: actions/checkout@v4
    - name: Validate composer.json changes
      run: composer validate --strict
    - name: Run tests
      run: php artisan test
    - name: Check Pint
      run: ./vendor/bin/pint --test
    - name: Check PHPStan
      run: ./vendor/bin/phpstan analyse
  ```
  The CI pipeline that validates each dependency update PR.
- **Security Update Priority Pattern:**
  ```yaml
  # Renovate config for security updates
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "assignees": ["security-lead"],
    "automerge": true
  }
  ```
  Security updates are auto-merged (with CI passing) to ensure prompt patching.
- **Schedule Pattern:**
  ```yaml
  # Renovate: weekly schedule, Monday morning
  "schedule": ["before 9am on Monday"],
  # Dependabot: daily at 5 AM
  schedule:
    interval: "daily"
    time: "05:00"
    timezone: "UTC"
  ```
  Schedule updates for low-activity periods to avoid PR flood during peak development hours.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Bot tool | Dependabot vs Renovate | Dependabot for simplicity (zero config, GitHub-native); Renovate for advanced needs (grouping, scheduling, auto-merge policies) |
| Update schedule | Daily vs weekly vs monthly | Weekly for most projects (balance of freshness vs PR noise); daily for security-critical projects |
| Auto-merge policy | All passing vs patch/minor only vs manual only | Patch and minor auto-merge (CI passes); major updates require human review |
| Update grouping | Per-package vs ecosystem vs type-based | Type-based grouping: non-breaking (patch+minor) in one PR, major in separate PRs |

## Tradeoffs

- **Dependabot vs Renovate:** Dependabot is simpler (built into GitHub, zero-config for basic setup) but has limited grouping and scheduling. Renovate is more configurable (complex grouping, advanced automerge policies, cross-platform) but requires more setup and understanding of its config format. Start with Dependabot; migrate to Renovate when grouping and scheduling needs grow.
- **Auto-Merge vs Manual Review:** Auto-merge patch and minor updates keeps dependencies current with minimal effort but risks merging a bad patch that passes tests (test coverage gap). Manual review is safer but creates a bottleneck (developers must review 5-10 dependency PRs weekly). Start with auto-merge for patches; add manual review for minor updates if confidence is low.
- **Frequency vs Noise:** Daily updates catch issues fast but produce 10-20 PRs per week (noise). Weekly updates batch changes but may miss a critical security patch for several days. Use daily for security updates, weekly for routine dependency bumps.

## Performance Considerations

- **CI Pipeline Impact:** Each dependency update PR triggers a full CI run (5-20 minutes). With 10-20 weekly dependency PRs, this adds 1-4 hours of CI time per week. Grouping non-breaking updates reduces this to 2-3 PRs per week.
- **Lock File Conflicts:** Multiple dependency update PRs modify composer.lock, causing merge conflicts. Grouping and sequential processing (one update PR at a time) reduces conflicts.
- **Test Suite Reliability:** Dependency update automation is only as reliable as the test suite. A flaky test suite causes false failures on dependency updates, requiring human intervention. Invest in test reliability before enabling auto-merge.

## Production Considerations

- **Security Patch Urgency:** Configure security updates to bypass the regular schedule; security patches should be reviewed and deployed within 24 hours, not waiting for the weekly batch.
- **Breaking Change Handling:** Major version updates (Laravel 10→11, PHP 8.2→8.3) require significant manual effort beyond what the bot can handle. Exclude major updates from automation; handle them in dedicated upgrade projects.
- **Production Dependency Audit:** Regularly audit the dependency list for abandoned packages, duplicates, and unused packages. Automation keeps versions current but doesn't identify dependencies that should be removed.

## Common Mistakes

- **Auto-merging without CI trust:** Enabling auto-merge before the test suite is reliable; a bad dependency passes tests, auto-merges, and breaks production
- **No grouping:** Every outdated package gets its own PR; the team is overwhelmed with 30+ open dependency PRs
- **Ignoring major updates:** Major updates pile up because the bot creates PRs but no one reviews them; the project falls significantly behind on framework versions
- **Not excluding problematic packages:** A package with frequent breaking changes in minor versions keeps creating PRs that fail CI; noise without value. Exclude or pin such packages.
- **Lock file not committed:** composer.lock is in .gitignore; dependency update PRs can't update the lock file, and different developers get different dependency versions

## Failure Modes

- **Dependency Conflict Resolution Failure:** Updating one package requires updating another, but the second update hasn't been merged yet; CI fails with dependency conflicts. Mitigate: group related packages; process updates sequentially.
- **Test Coverage Gap:** A dependency update changes behavior but the test suite doesn't cover the changed functionality; the update passes CI but breaks production. Mitigate: review test coverage periodically; add integration tests for critical paths.
- **Bot Rate Limiting:** Dependabot hits GitHub API rate limits and stops creating PRs. Mitigate: reduce update frequency; restrict the number of open dependency PRs.
- **Accidental Major Update:** A package's major version 3.0 is released and auto-merged because the bot misidentified it as minor (incorrect SemVer tagging). Mitigate: restrict auto-merge to patch-only; manually review minor and major updates.

## Ecosystem Usage

- **Laravel Framework:** The most frequently updated dependency; Dependabot PRs for laravel/framework appear on every patch Tuesday; grouping laravel/* packages prevents PR explosion
- **Laravel Packages:** First-party (laravel/telescope, laravel/pulse, laravel/sanctum) and third-party (spatie/*, barryvdh/*) packages are updated via the same automation
- **Laravel Forge:** Forge's deployment hooks can be triggered after dependency updates are merged, ensuring the updated packages are deployed promptly
- **Laravel Shift:** Shift handles major Laravel version upgrades (10→11) which are outside the scope of daily dependency automation; Shift and Dependabot/Renovate complement each other

## Related Knowledge Units

- github-actions-for-laravel
- automated-testing-in-ci
- security-scanning
- automated-changelog-generation

## Research Notes

- Dependabot was acquired by GitHub in 2019 and is now the most widely used dependency update tool in the GitHub ecosystem, with over 3 million repositories using it
- Renovate was originally developed by the WhiteSource (now Mend) team and has become the preferred tool for teams needing advanced grouping, scheduling, and configuration options
- The Laravel community has a strong "stay current" culture: many teams update to the latest Laravel patch within 2 weeks of release
- A 2023 study of dependency management practices found that teams using automated dependency updates apply security patches 4x faster than teams relying on manual tracking
