# Knowledge Unit: CONTRIBUTING.md Patterns

## Metadata
- **Subdomain:** Onboarding & Team Standards
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** onboarding-team-standards/contributing-dot-md-patterns
- **Maturity:** Mature
- **Related Technologies:** GitHub, GitLab, Markdown, Open Source, Laravel

## Executive Summary

CONTRIBUTING.md is a markdown file placed in the project root that documents how developers should contribute to the project—covering setup, coding standards, testing, pull request process, and behavioral expectations (code of conduct). For Laravel teams, a well-crafted CONTRIBUTING.md serves as the single entry point for both internal team members and external open-source contributors. It typically includes: development environment setup (Sail-based), coding standards enforced by Pint, testing requirements (PHPUnit/Pest must pass), pull request checklist, branch naming conventions, commit message style, and review expectations. The file follows established patterns from the Laravel ecosystem (Laravel's own CONTRIBUTING.md, Spatie package templates) and is designed to reduce friction for first-time contributors by answering the most common questions about the contribution workflow.

## Core Concepts

- **Entry Point:** CONTRIBUTING.md is the first file a potential contributor reads; it sets the tone for the project and answers "how do I get started?"
- **Executable Documentation:** The file should link to or reference setup scripts that automate the environment provisioning; the setup section should be verifiable by running `bin/setup`
- **PR Checklist:** A checklist in the PR template that mirrors the CONTRIBUTING.md requirements; contributors confirm they've followed the guidelines before submitting
- **Code of Conduct Link:** A reference to CODE_OF_CONDUCT.md (often based on the Contributor Covenant) that establishes behavioral standards for the community
- **Issue Templates:** Reference to issue templates (bug report, feature request, support) that structure contributor input and reduce missing information

## Mental Models

- **CONTRIBUTING.md as Welcome Mat:** The file is the first impression for new contributors; a welcoming, clear, and well-structured CONTRIBUTING.md encourages contributions
- **CONTRIBUTING.md as FAQ:** The file answers the most common questions contributors have: how to set up, how to run tests, how formatting is handled, how to submit a PR
- **CONTRIBUTING.md as Contract:** The file establishes an implicit contract: "Follow these guidelines and your contribution will be reviewed and considered fairly"

## Internal Mechanics

1. **Discovery:** GitHub and GitLab automatically link to CONTRIBUTING.md when a contributor opens a pull request, creating a natural discovery path
2. **Setup Instructions:** The first section guides the contributor through cloning, environment setup (Sail), dependency installation, and database initialization
3. **Coding Standards:** References Pint and PHPStan configuration; explains that automated checks run in CI and the contributor should run them locally before submitting
4. **Testing Requirements:** Specifies how to run the test suite (sail pest or sail phpunit) and what test coverage is expected for new code
5. **PR Workflow:** Documents branch naming (feature/description, bugfix/issue-number), commit message style (Laravel conventions), and the review process
6. **Code of Conduct:** Links to CODE_OF_CONDUCT.md; establishes expectations for respectful communication and collaboration

## Patterns

- **Laravel Project CONTRIBUTING.md Pattern:**
  ```markdown
  # Contributing to [Project Name]

  ## Setup
  1. Clone the repository
  2. Run `composer install`
  3. Copy `.env.example` to `.env`
  4. Run `php artisan key:generate`
  5. Run `php artisan migrate --seed`
  6. Run `php artisan serve`

  ## Coding Standards
  This project uses Laravel Pint for code style.
  Run `./vendor/bin/pint --test` to check your code.

  ## Testing
  Run `php artisan test` or `./vendor/bin/pest` to run the test suite.

  ## Pull Requests
  - Use a clear, descriptive title
  - Reference the issue number in the description
  - Include tests for new features
  - Ensure all tests pass
  - Squash commits before merging
  ```
- **Spatie Package CONTRIBUTING.md Pattern:**
  ```markdown
  ## Pull Request Procedure
  1. Fork the repository
  2. Create a branch: `git checkout -b feature/description`
  3. Make your changes
  4. Run `composer test` to verify everything passes
  5. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
  6. Push and open a Pull Request
  ```
  Spatie's template is widely adopted in the PHP package ecosystem.
- **PR Checklist Referencing Pattern:**
  ```markdown
  ## PR Checklist
  - [ ] My code follows the coding standards (Pint passes)
  - [ ] I have added tests that prove my fix/feature works
  - [ ] All existing tests pass
  - [ ] I have updated the documentation if needed
  - [ ] I have added a changelog entry
  ```
  The checklist mirrors the CONTRIBUTING.md requirements and is embedded in the PR template.
- **Section-Based Laravel Ecosystem Pattern:**
  - **Introduction:** Welcome message, link to Code of Conduct
  - **Getting Started:** Environment setup, prerequisites
  - **Development Workflow:** Branch naming, commit messages
  - **Coding Standards:** Pint, PHPStan, test requirements
  - **Pull Request Process:** Review expectations, merge criteria
  - **Questions:** Link to discussions, Discord, or Slack

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| File location | Root vs .github/ vs docs/ | Root (GitHub/GitLab auto-detection); .github/ for additional templates (issue/PR) |
| Tone | Formal vs friendly | Friendly but professional; match the Laravel ecosystem's welcoming tone |
| Detail level | Minimal (setup only) vs comprehensive | Comprehensive for public repos; minimal for internal team projects with face-to-face onboarding |
| Branching convention | feature/ prefix vs issue-number based | feature/short-description for features; bugfix/issue-number for fixes |

## Tradeoffs

- **Comprehensive vs Minimal:** Comprehensive CONTRIBUTING.md answers all questions but is long (may not be read). Minimal files are quick to read but leave contributors guessing. Balance: use clear headings for scanning; keep sections under 5 bullet points.
- **Project-Specific vs Template:** A project-specific file addresses the project's unique requirements but takes time to write and maintain. A template (Spatie skeleton) is faster to adopt but may include irrelevant sections or miss project-specific details.
- **Internal vs External Focus:** Internal team projects may assume shared context; external open-source projects need more explicit instructions. If the project serves both audiences, create separate sections or use "for external contributors" callouts.

## Performance Considerations

- **File Size:** A 10KB CONTRIBUTING.md is acceptable; a 50KB one is too long. Keep sections focused; use links to external docs for deeper details.
- **Render Speed:** Markdown rendering on GitHub takes <1 second regardless of file length. No performance concerns.
- **Update Frequency:** Update after any change to setup workflow, testing requirements, or PR process. Stale instructions cause contributor frustration and increase support questions.

## Production Considerations

- **Link Maintenance:** External links (documentation, issue trackers, CI badges) become stale. Schedule quarterly link checks or use link checker tools in CI.
- **Versioning:** For projects with major version branches, maintain version-specific CONTRIBUTING.md files in each branch (e.g., 10.x vs 11.x setup differences).
- **Security Reporting:** Include a security vulnerability reporting section with contact information (email, private issue tracker link); never ask for security issues to be filed publicly.

## Common Mistakes

- **Assuming Docker/Sail:** Stating "run sail up" without mentioning Docker prerequisite; contributors on different platforms may not have Docker installed
- **No test command:** Telling contributors to "run tests" without providing the exact command (sail pest, sail phpunit, or vendor/bin/pest)
- **Missing Pint command:** Not specifying how to run Pint (`./vendor/bin/pint --test`) before submitting; CI catches style issues but frustrates contributors
- **Outdated setup instructions:** Referencing artisan commands that no longer exist or dependency installation steps that have changed
- **No code of conduct:** Omitting behavioral expectations; contributors from different cultural backgrounds may have different communication norms

## Failure Modes

- **CONTRIBUTING.md Not Read:** Contributors ignore the file and submit PRs that don't follow guidelines. Mitigate: PR template includes checklist; automated CI checks catch style and test violations.
- **Outdated Instructions:** Setup instructions no longer work (changed PHP version, removed packages). Mitigate: test the setup instructions on every release; CI can validate by running a fresh setup from scratch.
- **Conflicting Guidelines:** CONTRIBUTING.md differs from PR template or CI configuration. Mitigate: generate PR templates from CONTRIBUTING.md patterns or vice versa; single source of truth.

## Ecosystem Usage

- **Laravel Framework:** The official Laravel CONTRIBUTING.md sets the standard; references Pint, PHPStan, and testing expectations
- **Spatie Packages:** Spatie's package skeleton includes a CONTRIBUTING.md template widely adopted across the PHP ecosystem
- **Laravel Shift:** Shift's contributing guidelines focus on codemod patterns; useful reference for automated refactoring projects
- **Laravel Nova:** Nova's contributing guidelines demonstrate open-core model expectations (paid product with open-source components)

## Related Knowledge Units

- coding-standards-documentation
- pr-template-patterns
- developer-onboarding-checklists
- team-collaboration-patterns
- git-hooks-laravel-captainhook

## Research Notes

- GitHub automatically links to CONTRIBUTING.md in the PR description area; this organic discovery reduces the need for contributors to manually find the file
- The Contributor Covenant (v2.1) is the most widely adopted code of conduct template in the Laravel ecosystem
- Conventional Commits (angular convention) is the most common commit message style referenced in Laravel CONTRIBUTING.md files
- Spatie's package skeleton template is forked on average 50+ times per month, making it the most influential CONTRIBUTING.md template in the PHP community
