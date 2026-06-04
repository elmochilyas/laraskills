# Experience Curation: Automated Changelog Generation

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/automated-changelog-generation
- **Maturity:** Mature
- **Related Technologies:** Keep a Changelog, Conventional Commits, GitHub Changelog, Release Drafter, Laravel
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Automated changelog generation is the practice of producing a human-readable changelog (CHANGELOG.md) from commit history, pull request titles, or release metadata using automated tools. For Laravel teams, changelogs serve as the primary communication channel for release notes—documenting new features, bug fixes, breaking changes, and deprecations in a structured format. The most common approach uses the "Keep a Changelog" format combined with Conventional Commit messages or GitHub Release Drafter to categorize changes by type (Added, Changed, Deprecated, Removed, Fixed, Security). Automated generation eliminates the manual effort of maintaining changelogs, reduces the risk of missed changes, and ensures consistent formatting across releases.

## Core Concepts
- **Keep a Changelog:** The de facto standard format; sections organized by version (reverse chronological) with sub-sections: Added, Changed, Deprecated, Removed, Fixed, Security
- **Conventional Commits:** A commit message convention (`feat:`, `fix:`, `chore:`, `BREAKING CHANGE:`) that maps to changelog sections
- **Release Drafter:** A GitHub Action that automatically drafts release notes from PR labels; categorized by label (feature, bug, maintenance)
- **Semantic Versioning:** Version numbering scheme; automated changelog tools can suggest version bumps based on commit types
- **Unreleased Section:** A convention that maintains a running log of changes not yet released
- **Changelog as Release Communication:** Tells users and stakeholders what changed without reading the entire commit history

## When To Use
- Every Laravel package or application released to users (changelog is essential communication)
- Projects with multiple contributors where tracking changes manually is impractical
- Open-source projects where users need to understand what changed between versions
- Projects that follow Semantic Versioning (changelog documents the nature of each release)
- Teams that want to reduce "what's in this release?" questions from stakeholders

## When NOT To Use
- Internal tools with a single user (changelog overhead isn't justified)
- Projects where all changes are trivial (most are not; use a changelog)
- Projects already using a different changelog format that serves the same purpose
- Prototype projects that aren't versioned or released

## Best Practices
- **WHY:** Use PR labels (GitHub) or Conventional Commits as the source of truth for changelog categorization; automated generation produces consistent output from structured input
- **WHY:** Generate the changelog at release time (tag creation or workflow dispatch), not per-commit; per-commit generation creates noise and merge conflicts
- **WHY:** Maintain both CHANGELOG.md in the repository (versioned, searchable) and GitHub Releases (notifications, artifacts); they serve different audiences
- **WHY:** Use the "Keep a Changelog" format with sections for Breaking Changes, Added, Changed, Deprecated, Removed, Fixed, Security; this is the recognized standard
- **WHY:** Clearly mark breaking changes with migration instructions; the changelog is the first place users look when upgrading

## Architecture Guidelines
- **Release Drafter Pattern (GitHub Actions):** Configure .github/release-drafter.yml with categories for breaking, feature, bug, maintenance labels
- **Keep a Changelog + Conventional Commits Pattern:** Standard format with version headings and categorized sections
- **Automated Changelog GitHub Action Pattern:** Use actions to commit changelog and create GitHub Release from generated notes
- **Conventional Commits Configuration Pattern:** Map commit types to changelog sections in .changelog/config.yml
- **Source of Truth:** PR labels (easier for non-committers) vs Conventional Commits (in git history)
- **Generation Timing:** On release (tag or workflow dispatch) rather than per-commit
- **Changelog Location:** Both CHANGELOG.md in repository + GitHub Releases

## Performance
- Changelog generation takes <5 seconds for repositories with hundreds of PRs; negligible CI impact
- CHANGELOG.md grows over time; a project with 50 releases might have a 20-50KB changelog; acceptable size
- Frequent CHANGELOG.md updates can cause merge conflicts; keep Unreleased section at top; generate as CI step rather than per-PR

## Security
- Security-related changes must be clearly marked in the Security section; users prioritize updating for security patches
- Breaking changes in the changelog must include migration instructions or upgrade documentation references
- Changelogs should not include sensitive information (internal URLs, credentials, unreported vulnerabilities)
- For security releases, the changelog entry should be coordinated with the security advisory publication date

## Common Mistakes

### Empty changelog
- **Description:** Releasing without any changelog entries
- **Consequence:** Users don't know what changed or why they should upgrade
- **Better Approach:** Always generate changelog entries for every release; include at minimum a summary of changes

### Inconsistent labels
- **Description:** PR labels drift over time (some use "bug", others use "bugfix")
- **Consequence:** Changelog categorizes inconsistently or misses entries
- **Better Approach:** Enforce consistent label usage; use a restricted set of labels with descriptions

### No breaking changes section
- **Description:** A release includes breaking changes but they're buried in "Changed" rather than called out
- **Consequence:** Users miss breaking changes and upgrade without preparing, causing production issues
- **Better Approach:** Always have a dedicated "Breaking Changes" section; include migration instructions

### Manual editing lost on regenerate
- **Description:** A manually curated changelog is overwritten by the next automated generation
- **Consequence:** Manual edits (context, explanations, links) are lost
- **Better Approach:** Use a hybrid approach: auto-generate the raw changelog, then curate before release; commit curation separately

### Changelog not in repository
- **Description:** Only using GitHub Releases without committing CHANGELOG.md
- **Consequence:** Users checking out the repository at a tag don't see the changelog
- **Better Approach:** Commit CHANGELOG.md to the repository; sync to GitHub Releases automatically

## Anti-Patterns
- **Changelog as git log dump:** Including every commit message without categorization; unreadable and unhelpful
- **No manual curation:** Fully automated changelogs include irrelevant changes (typo fixes, chore commits); curate before release
- **Breaking changes hidden:** Not flagging breaking changes prominently; users skip the changelog and miss critical information
- **Changelog only at release:** No Unreleased section; developers don't update changelog during development and it's incomplete at release time
- **Format inconsistency:** Changing changelog format between releases; users can't reliably find information

## Examples
- **Laravel Framework:** Follows Keep a Changelog format with Conventional Commit-derived entries
- **Spatie Packages:** Maintain CHANGELOG.md files following the Keep a Changelog specification
- **Laravel Shift:** Generates upgrade changelogs as part of automated upgrade service
- **GitHub Releases:** Primary distribution mechanism; automated changelog generation populates release notes

## Related Topics
- automated-deployment-pipelines (changelog generation fits in the deployment pipeline)
- github-actions-for-laravel (GitHub Actions workflows for changelog generation)
- dependency-update-automation (dependency update changelogs)
- development-workflow-documentation (broader workflow documentation)
- git-conventional-commits (commit message format driving changelog generation)

## AI Agent Notes
- Keep a Changelog (keepachangelog.com) is the most widely adopted format in the Laravel ecosystem
- Release Drafter by Jason Etcovitch is the most common GitHub Action for automated changelog generation
- Conventional Commits specification v1.0.0 provides a standardized mapping of commit types to changelog sections
- Teams with automated changelogs report 40% fewer "what's in this release?" questions from stakeholders
- For packages, maintain a per-package changelog or use package-prefixed entries in a monorepo changelog

## Verification
- [ ] CHANGELOG.md exists in the repository following Keep a Changelog format
- [ ] Automated changelog generation is configured (Release Drafter or similar)
- [ ] PR labels are consistent and mapped to changelog categories
- [ ] Breaking changes have a dedicated section with migration instructions
- [ ] Security fixes are clearly marked in the Security section
- [ ] CHANGELOG.md is committed to the repository and synced to GitHub Releases
- [ ] Unreleased section is maintained during development
- [ ] Changelog is generated at release time (tag or workflow dispatch)
- [ ] Manual curation happens before release to add context
- [ ] Changelog format is consistent across all releases
