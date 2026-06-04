# Experience Curation: CONTRIBUTING.md Patterns

## Metadata
- **KU ID:** onboarding-team-standards/contributing-dot-md-patterns
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Mature
- **Dependencies:** coding-standards-documentation, pr-template-patterns, developer-onboarding-checklists
- **Related Technologies:** GitHub, GitLab, Markdown, Open Source, Laravel
- **Target Audience:** Laravel developers, open-source maintainers, team leads

## Overview

CONTRIBUTING.md is a markdown file placed in the project root that documents how developers should contribute to the project—covering setup, coding standards, testing, pull request process, and behavioral expectations (code of conduct). For Laravel teams, a well-crafted CONTRIBUTING.md serves as the single entry point for both internal team members and external open-source contributors. It includes: development environment setup (Sail-based), coding standards enforced by Pint, testing requirements (PHPUnit/Pest must pass), pull request checklist, branch naming conventions, commit message style, and review expectations. The file follows established patterns from the Laravel ecosystem (Laravel's own CONTRIBUTING.md, Spatie package templates).

## Core Concepts

- **Entry Point:** CONTRIBUTING.md is the first file a potential contributor reads; it sets the tone and answers "how do I get started?"
- **Executable Documentation:** The file links to or references setup scripts that automate environment provisioning
- **PR Checklist:** A checklist in the PR template that mirrors the CONTRIBUTING.md requirements
- **Code of Conduct Link:** Reference to CODE_OF_CONDUCT.md establishing behavioral standards
- **Issue Templates:** Reference to issue templates structuring contributor input

## When To Use

- Public open-source Laravel packages or projects
- Internal projects with multiple contributors who aren't always co-located
- Projects expecting external contributions (community or cross-team)
- Team wants to standardize contribution workflow across multiple repositories
- Repository is on GitHub or GitLab (auto-links to CONTRIBUTING.md on PR creation)

## When NOT To Use

- Private internal project with a single team that communicates directly
- Project is a prototype or experiment with short lifespan
- Team prefers verbal onboarding and pair programming for initial contributions
- Repository is archived or read-only

## Best Practices (WHY)

1. **Use GitHub/GitLab Auto-Detection (Why):** Place CONTRIBUTING.md in the project root where GitHub and GitLab automatically detect and link to it when a contributor opens a PR. This organic discovery reduces the need for contributors to search for guidelines.

2. **Provide the Exact Test Command (Why):** "Run tests" is ambiguous. Specify the exact command (`sail pest`, `sail phpunit`, or `vendor/bin/pest`) and include common flags. Contributors shouldn't have to guess how to run the test suite.

3. **Reference PR Checklist (Why):** The PR template should mirror the CONTRIBUTING.md requirements. Contributors confirm they've followed guidelines by checking items in the PR template. This creates a verification loop between guidelines and actual contributions.

4. **Keep Sections Under 5 Bullet Points (Why):** Long sections are skipped. Each section should be scannable in under 30 seconds. Use clear headings and brief bullet points. Link to external docs for deeper details.

5. **Test Setup Instructions on Every Release (Why):** Stale setup instructions cause contributor frustration and increase support questions. Run the setup steps from a fresh checkout in CI on every release to verify they still work.

## Architecture Guidelines

- **File Location:** Root directory (GitHub/GitLab auto-detection). Additional templates in `.github/` (issue templates, PR template).
- **Tone:** Friendly but professional. Match the Laravel ecosystem's welcoming tone. Use "we" and "you" to create a collaborative feel.
- **Detail Level:** Comprehensive for public repos (assume no prior knowledge). Minimal for internal team projects with face-to-face onboarding.
- **Structure:** Introduction + Code of Conduct → Getting Started → Development Workflow → Coding Standards → PR Process → Questions.
- **Branching Convention:** `feature/short-description` for features; `bugfix/issue-number` for fixes.

## Performance

- **File Size:** Under 10KB. Longer files aren't read. Use links to external docs for details.
- **Render Speed:** Markdown rendering on GitHub is instant regardless of file length.
- **Update Frequency:** Update after any change to setup workflow, testing requirements, or PR process.

## Security

- **Security Reporting:** Include a security vulnerability reporting section with an email or private issue tracker link. Never ask for security issues to be filed publicly.
- **No Secrets:** CONTRIBUTING.md must never contain real credentials, API keys, or internal URLs accessible only to the team.
- **Link Maintenance:** External links (documentation, issue trackers) become stale. Use relative links within the repo where possible.

## Common Mistakes

### Mistake 1: Assuming Docker/Sail
- **Description:** Stating "run sail up" without mentioning Docker prerequisite
- **Cause:** Team assumes everyone has Docker installed
- **Consequence:** Contributor on Windows without Docker gets stuck
- **Better:** List prerequisites with platform-specific installation links

### Mistake 2: No Test Command
- **Description:** Telling contributors to "run tests" without providing the exact command
- **Cause:** Assuming tests are run the same way across all projects
- **Consequence:** Contributor doesn't know how to run tests, submits PR without testing
- **Better:** Specify exact command: `./vendor/bin/pest` or `php artisan test`

### Mistake 3: Outdated Setup Instructions
- **Description:** Setup steps reference artisan commands that no longer exist
- **Cause:** No CI verification of setup instructions
- **Consequence:** Contributor can't set up environment, gives up
- **Better:** Run setup instructions from fresh checkout in CI on every release

### Mistake 4: No Code of Conduct
- **Description:** Omitting behavioral expectations
- **Cause:** Assuming a code of conduct isn't needed for "tech-only" discussions
- **Consequence:** Contributors from different backgrounds may experience harassment
- **Better:** Link to CODE_OF_CONDUCT.md (Contributor Covenant v2.1 recommended)

## Anti-Patterns

- **The Wall of Text:** One giant paragraph with no headings or bullet points. Contributors can't scan it. Use clear hierarchical markdown.
- **The Assumed Knowledge Document:** Written for contributors who already know the project. Assume the reader is a first-time contributor to your project.
- **The Outdated Guide:** References tools or versions that are no longer used. Test on every release. Remove deprecated instructions.
- **The Self-Referential Loop:** "See contributing guidelines" in the PR template, but the guidelines say "see the PR template." Both should be independently complete.

## Examples

### Example 1: Laravel Project CONTRIBUTING.md
```markdown
# Contributing to [Project Name]

## Getting Started
1. Fork and clone the repository
2. Run `composer install`
3. Copy `.env.example` to `.env` and configure
4. Run `php artisan key:generate`
5. Run `php artisan migrate --seed`
6. Run `php artisan serve`

## Coding Standards
This project uses Laravel Pint for code style.
Run `./vendor/bin/pint --test` before submitting.

## Testing
Run `php artisan test` or `./vendor/bin/pest` to run the test suite.
All tests must pass before your PR is merged.

## Pull Requests
- Use a clear, descriptive title
- Reference the issue number
- Include tests for new features
- Ensure all CI checks pass
- Squash commits before merging
```

### Example 2: PR Checklist Template
```markdown
## PR Checklist
- [ ] My code follows the coding standards (Pint passes)
- [ ] I have added tests that prove my fix/feature works
- [ ] All existing and new tests pass
- [ ] I have updated the documentation if needed
- [ ] I have added a changelog entry
- [ ] I have read the CONTRIBUTING.md guidelines
```

## Related Topics

- **coding-standards-documentation:** Standards referenced in CONTRIBUTING.md
- **pr-template-patterns:** PR checklist that mirrors CONTRIBUTING.md
- **developer-onboarding-checklists:** CONTRIBUTING.md as onboarding resource
- **team-collaboration-patterns:** Code of conduct and collaboration norms
- **local-environment-setup-documentation:** Detailed setup instructions

## AI Agent Notes

- **Context Requirements:** When advising on CONTRIBUTING.md, first determine whether the project is public or internal, the target audience (external contributors vs internal team), and the existing setup workflow.
- **Key Decision Points:** Detail level (comprehensive vs minimal), tone (formal vs friendly), branch naming convention, commit message convention.
- **Common Pitfalls in AI Assist:** Don't assume Docker/Sail is available. Always include exact test commands. Remember a code of conduct. Test setup instructions.
- **Laravel-Specific Nuances:** GitHub auto-links to CONTRIBUTING.md on PR creation. Spatie's package skeleton template is the most influential template in the PHP ecosystem. Conventional Commits is the most common commit style referenced.

## Verification
- [ ] KU accurately defines CONTRIBUTING.md patterns
- [ ] Core concepts cover entry point, executable docs, PR checklist
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize auto-detection and test verification
- [ ] Architecture guidelines cover location, tone, structure
- [ ] Performance addresses file size and update frequency
- [ ] Security covers vulnerability reporting and link maintenance
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify wall of text and assumed knowledge
- [ ] Examples show realistic CONTRIBUTING.md and PR checklist
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
