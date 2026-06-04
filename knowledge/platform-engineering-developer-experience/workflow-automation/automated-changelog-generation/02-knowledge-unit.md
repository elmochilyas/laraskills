# Knowledge Unit: Automated Changelog Generation

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/automated-changelog-generation
- **Maturity:** Mature
- **Related Technologies:** Keep a Changelog, Conventional Commits, GitHub Changelog, Release Drafter, Laravel

## Executive Summary

Automated changelog generation is the practice of producing a human-readable changelog (CHANGELOG.md) from commit history, pull request titles, or release metadata using automated tools. For Laravel teams, changelogs serve as the primary communication channel for release notes—documenting new features, bug fixes, breaking changes, and deprecations in a structured format. The most common approach uses the "Keep a Changelog" format combined with Conventional Commit messages or GitHub Release Drafter to categorize changes by type (Added, Changed, Deprecated, Removed, Fixed, Security). Automated generation eliminates the manual effort of maintaining changelogs, reduces the risk of missed changes, and ensures consistent formatting across releases. The changelog is typically generated at release time (tagging a new version) and is committed to the repository alongside the version bump.

## Core Concepts

- **Keep a Changelog:** The de facto standard format for changelogs; sections are organized by version (reverse chronological), with sub-sections: Added, Changed, Deprecated, Removed, Fixed, Security
- **Conventional Commits:** A commit message convention (`feat:`, `fix:`, `chore:`, `BREAKING CHANGE:`) that maps to changelog sections; automated tools parse commit history to generate categorized entries
- **Release Drafter:** A GitHub Action that automatically drafts release notes from PR labels; each merged PR with a label (feature, bug, maintenance) is categorized in the draft release
- **Semantic Versioning (SemVer):** Version numbering scheme (MAJOR.MINOR.PATCH) that communicates the nature of changes; automated changelog tools can suggest version bumps based on commit types
- **Unreleased Section:** A changelog convention that maintains a running log of changes not yet released; when a release is tagged, the Unreleased section is moved to a new version heading

## Mental Models

- **Changelog as Release Communication:** The changelog is the release notes—it tells users and stakeholders what changed in each version without reading the entire commit history
- **CHANGELOG.md as Derived Artifact:** Like compiled CSS, the changelog is a derived artifact; the source of truth is PR labels or Conventional Commits, and the changelog is generated from that source
- **PR Label as Taxonomy:** Each PR label (feature, bug, enhancement, breaking) is a taxonomic category; the changelog is a sorted view of that taxonomy at release time

## Internal Mechanics

1. **Source of Truth:** PR labels (GitHub) or Conventional Commit prefixes are the primary source of change categorization
2. **Trigger:** A release is triggered by creating a Git tag (v1.2.3) or running a GitHub Action workflow dispatch
3. **Change Collection:** The tool collects all merged PRs (or commits) since the last tag, grouping them by category label/prefix
4. **Version Bump:** Based on the collected changes, the tool determines the next version number (major for breaking changes, minor for features, patch for fixes)
5. **Changelog Update:** The tool preprends a new version section to CHANGELOG.md with categorized entries, or generates a full changelog from scratch
6. **Release Publication:** The generated release notes are published to GitHub Releases (or GitLab Releases) and optionally broadcast to Slack/Discord

## Patterns

- **Release Drafter Pattern (GitHub Actions):**
  ```yaml
  # .github/release-drafter.yml
  template: |
    ## What's Changed
    $CHANGES
  categories:
    - title: Breaking Changes
      label: breaking
    - title: Features
      label: feature
    - title: Bug Fixes
      label: bug
    - title: Maintenance
      label: maintenance
  ```
  A GitHub Action drafts release notes from PR labels automatically.
- **Keep a Changelog + Conventional Commits Pattern:**
  ```markdown
  # Changelog

  ## [1.2.0] - 2024-01-15

  ### Added
  - New user export feature (#123)
  - Email notification preferences (#118)

  ### Changed
  - Upgrade to Laravel 11 (#120)
  - Improve dashboard query performance (#115)

  ### Fixed
  - Fix pagination on search results (#122)
  ```
  The canonical changelog format recognized across the Laravel ecosystem.
- **Automated Changelog GitHub Action Pattern:**
  ```yaml
  - uses: stefanzweifel/git-auto-commit-action@v5
    with:
      commit_message: "chore: bump version to ${{ env.NEXT_VERSION }}"
  - uses: softprops/action-gh-release@v2
    with:
      body_path: CHANGELOG.md
      tag_name: v${{ env.NEXT_VERSION }}
  ```
  Creates a GitHub Release from the generated changelog.
- **Conventional Commits Configuration Pattern:**
  ```
  # .changelog/config.yml
  types:
    feat: Features
    fix: Bug Fixes
    docs: Documentation
    style: Style
    refactor: Refactoring
    perf: Performance
    test: Testing
    chore: Maintenance
  ```
  Maps Conventional Commit types to changelog sections.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Source of truth | PR labels vs Conventional Commits | PR labels (easier for non-committers to categorize; works with squash merges) |
| Generation timing | On release vs per-commit | On release (tag creation or workflow dispatch); per-commit generates noise |
| Changelog location | CHANGELOG.md vs GitHub Releases only | Both: CHANGELOG.md in repository (versioned, searchable) + GitHub Releases (notification, artifacts) |
| Tool | Release Drafter vs semantic-release vs changelog-generator | Release Drafter for simplicity; semantic-release for full SemVer automation |

## Tradeoffs

- **PR Labels vs Conventional Commits:** PR labels are visual and easy to apply from the GitHub UI but require discipline to maintain. Conventional Commits are in the git history (always available) but require training and commit hook enforcement. Most Laravel teams use squash merging with PR titles following Conventional Commits.
- **Automated vs Curated:** Fully automated changelogs are consistent and complete but may include irrelevant changes (chore commits, typo fixes). Curated changelogs are more readable but require manual effort and are often incomplete. A hybrid approach: auto-generate, then manually curate before release.
- **CHANGELOG.md vs GitHub Releases:** CHANGELOG.md in the repository is versioned with the code and searchable locally. GitHub Releases provide a UI for download links and are the canonical source for package consumers. Maintain both: auto-generate CHANGELOG.md and sync to GitHub Releases.

## Performance Considerations

- **Generation Time:** Changelog generation takes <5 seconds for repositories with hundreds of PRs; negligible impact on CI pipeline time.
- **File Size:** CHANGELOG.md grows over time; a project with 50 releases might have a 20-50KB changelog. Acceptable size; no impact on git operations.
- **Merge Conflicts:** Frequent CHANGELOG.md updates can cause merge conflicts in active repositories. Mitigate: keep the Unreleased section at the top; generate the changelog as a CI step rather than committing per-PR.

## Production Considerations

- **Breaking Change Communication:** Breaking changes in the changelog must include migration instructions or a reference to upgrade documentation. The changelog is the first place users look for breaking changes.
- **Security Fix Notifications:** Security-related changes should be clearly marked in the changelog (Security section in Keep a Changelog format); users need to prioritize updating for security patches.
- **Changelog for Monorepos:** In a monorepo with multiple packages, maintain per-package changelogs or a single changelog with package-prefixed entries (e.g., "[User Service] Fixed pagination bug").

## Common Mistakes

- **Empty changelog:** Releasing without any changelog entries; users don't know what changed or why they should upgrade
- **Inconsistent labels:** PR labels drift over time (some use "bug", others use "bugfix"); the changelog categorizes inconsistently or misses entries
- **No breaking changes section:** A release includes breaking changes but they're buried in "Changed" rather than called out in a dedicated section
- **Manual editing lost on regenerate:** A manually curated changelog is overwritten by the next automated generation; template changes cannot be preserved
- **Changelog not in repository:** Only using GitHub Releases without committing CHANGELOG.md; users checking out the repository at a tag don't see the changelog

## Failure Modes

- **Label Drift:** Team members stop applying PR labels consistently; the changelog shows all changes as "Uncategorized". Mitigate: enforce PR labels via GitHub branch protection rules; label PRs without labels as a CI check.
- **Conventional Commit Enforcement Failure:** Commits don't follow the convention; the changelog is empty or miscategorized. Mitigate: install a commit hook (commitlint) to enforce Conventional Commits format.
- **Release Drafter API Rate Limiting:** For large open-source projects, GitHub API rate limiting can delay draft generation. Mitigate: use a scheduled workflow rather than event-triggered generation.

## Ecosystem Usage

- **Laravel Framework:** Laravel's own changelog (github.com/laravel/framework/releases) follows Keep a Changelog format with Conventional Commit-derived entries
- **Laravel Packages:** Most popular Laravel packages (Spatie, Barryvdh) maintain CHANGELOG.md files following the Keep a Changelog specification
- **Laravel Shift:** Shift generates upgrade changelogs as part of its automated upgrade service; the output includes categorized changes with links to documentation
- **GitHub Releases:** The primary distribution mechanism for Laravel packages; automated changelog generation populates release notes automatically

## Related Knowledge Units

- automated-deployment-pipelines
- github-actions-for-laravel
- dependency-update-automation
- development-workflow-documentation

## Research Notes

- Keep a Changelog (keepachangelog.com) is the most widely adopted changelog format in the Laravel ecosystem, referenced in package READMEs and contribution guidelines
- Release Drafter by Jason Etcovitch is the most commonly used GitHub Action for automated changelog generation in Laravel projects
- Conventional Commits specification v1.0.0 provides a standardized mapping of commit types to changelog sections
- Laravel applications with automated changelog generation report 40% fewer "what's in this release?" questions from stakeholders
