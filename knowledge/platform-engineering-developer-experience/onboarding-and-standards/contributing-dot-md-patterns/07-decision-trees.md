# Decision Trees: CONTRIBUTING.md Patterns

## Metadata
- **KU ID:** onboarding-team-standards/contributing-dot-md-patterns
- **Phase:** 4 (Experience Curation)
- **Curator:** Phase 4 Standardization Process
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Content depth | Comprehensive / Minimal / External-link-based | Public vs private repo and audience |
| 2 | Location and auto-detection | Root directory / .github/ / docs/ | GitHub/GitLab auto-linking behavior |
| 3 | Tone and formality | Friendly-professional / Formal / Casual | Match project culture and audience expectations |
| 4 | PR checklist integration | Inline template / Separate file / Auto-checkboxes | Ensuring contributors verify requirements |
| 5 | CI verification of instructions | Per-release / Per-PR / Manual | Keeping setup instructions from becoming stale |

## Architecture-Level Decision Trees

### Tree 1: Content Depth and Detail Level

- **Start:** Writing or updating CONTRIBUTING.md
- **Is the repository public open-source?**
  - Yes → Continue.
  - No → Use minimal version. Focus on internal workflow. Assume contributors have prior team context.
- **Do you expect external contributors with no prior knowledge?**
  - Yes → Comprehensive version. Include prerequisites with platform-specific installation links, exact test commands, coding standards reference, and full PR process. Assume zero prior knowledge.
  - No → Moderate version. Cover essentials but link to internal docs for detail. Assume contributor has some context.
- **Is the project a Laravel package?**
  - Yes → Include Spatie-style template conventions (package-specific setup, testing against multiple Laravel versions).
  - No → Adapt to application-specific workflow.

### Tree 2: Detecting and Fixing Stale Setup Instructions

- **Start:** CONTRIBUTING.md contains setup steps
- **Are setup instructions CI-verified?**
  - Yes → Continue monitoring. CI runs on each release.
  - No → Continue.
- **Can CI run setup from a fresh checkout?**
  - Yes → Add a CI job that runs the setup steps on every release. Use a throwaway Docker container or ephemeral runner.
  - No → Continue.
- **Manual approach:** Assign a team member to test setup steps from a fresh checkout before each release. Document the verification step in the release checklist. Create an issue template for reporting stale instructions.
- **Frequency:** Test on every release. If releases are less frequent than monthly, test at least quarterly.

### Tree 3: PR Checklist Integration

- **Start:** Designing the PR template
- **Does a CONTRIBUTING.md exist?**
  - Yes → Continue.
  - No → Write CONTRIBUTING.md first. The PR template references it.
- **PR checklist should mirror CONTRIBUTING.md requirements:**
  - Coding standards verified (Pint passes)
  - Tests added for new features
  - All existing tests pass
  - Documentation updated if needed
  - Changelog entry added if applicable
  - CONTRIBUTING.md guidelines reviewed
- **Checklist location:**
  - GitHub: `.github/PULL_REQUEST_TEMPLATE.md` with checkbox items.
  - GitLab: Merge request template with checklist.
- **Enforcement:** Make some items required (blocking merge) and some advisory. Use CI to auto-check where possible (Pint, test pass).

### Tree 4: Structure and Organization

- **Start:** Organizing the CONTRIBUTING.md sections
- **Audience:** External contributors who have never seen the project
- **Required sections in order:**
  1. Introduction and welcome message (tone: friendly but professional)
  2. Code of Conduct link
  3. Getting Started (prerequisites with platform links, clone, setup)
  4. Development Workflow (branch naming, commit style, PR process)
  5. Coding Standards (link to detailed doc, not full content)
  6. Testing (exact command: `sail pest` or `./vendor/bin/pest`)
  7. Pull Request Process (checklist, review expectations, merge strategy)
  8. Questions and Support (links to discussions, issue tracker)
- **Each section under 5 bullet points.** Link to external docs for detail. Use clear headings for scanning.
- **For internal repos:** Condense to sections 3-7. Remove introduction. Use direct tone. Assume Docker/Sail knowledge.
