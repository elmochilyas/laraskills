# Knowledge Unit: PR Template Patterns

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/pr-template-patterns
- **Maturity:** Mature
- **Related Technologies:** GitHub, GitLab, Pull Request, Code Review, Laravel

## Executive Summary

PR template patterns are standardized markdown templates used when creating pull requests in GitHub or GitLab, designed to guide contributors in providing complete, consistent information for code reviews. For Laravel teams, effective PR templates include: a description of the change, link to the related ticket/issue, checklist of quality measures (Pint passes, PHPStan passes, tests added), testing instructions, deployment notes (migrations, environment variables, queue changes), and screenshots for UI changes. Templates are stored in .github/PULL_REQUEST_TEMPLATE.md (or .github/ISSUE_TEMPLATE/ for multiple templates) and are automatically populated when a new PR is created. Well-designed PR templates reduce back-and-forth during review (reviewers don't need to ask for missing context), ensure consistent PR quality across the team, and serve as a gentle reminder of the team's quality standards.

## Core Concepts

- **PR Template Location:** GitHub auto-detects templates in .github/PULL_REQUEST_TEMPLATE.md, docs/PULL_REQUEST_TEMPLATE.md, or the repository root as pull_request_template.md
- **Multiple Templates:** Teams can provide directory-based templates (.github/PULL_REQUEST_TEMPLATE/bug_fix.md, feature.md, hotfix.md) with different prompts for different PR types
- **Checklist Pattern:** A markdown checkbox list ([ ]) that the author completes before requesting review; serves as a self-review prompt and quality gate documentation
- **Template Variables:** GitHub doesn't support dynamic variables in PR templates, but the template can reference environment variables or use comment-based instructions
- **Blank Issues Setting:** The repository setting that prevents PRs without a template; if enabled, contributors must use one of the defined templates

## Mental Models

- **PR Template as Quality Checklist:** The template is a pre-flight checklist that every PR must complete before takeoff (review); it ensures nothing critical is forgotten
- **PR Template as Reviewer Context:** The template provides the context a reviewer needs: what this does, why it needs to happen, how to verify it, and what the risks are
- **PR Template as Team Agreement:** A standardized template encodes the team's agreement about what constitutes a complete PR; every PR meets the same baseline of information

## Internal Mechanics

1. **PR Creation:** When a contributor creates a PR, GitHub/GitLab reads the template file and pre-populates the PR description field
2. **Author Completion:** The contributor fills in the template sections: description, ticket reference, testing notes, and checklist
3. **Review Context:** Reviewers read the completed template to understand the change without asking basic questions (what's this for? is it tested? does it need migrations?)
4. **Checklist Verification:** Reviewers spot-check the checklist items; they don't need to re-verify automated checks (Pint, PHPStan, tests passing in CI) but may verify manual items (screenshots, documentation updates)
5. **Post-Merge Archive:** The completed PR description (including the template content) remains in the PR as documentation; it's searchable and provides context for future developers reading the git history

## Patterns

- **Standard Laravel PR Template Pattern:**
  ```markdown
  ## Description
  <!-- Briefly describe the changes and why they're needed -->

  ## Ticket
  <!-- Link to the issue or ticket: Closes #123 -->

  ## Type of Change
  - [ ] Bug fix (non-breaking change)
  - [ ] New feature (non-breaking change)
  - [ ] Breaking change
  - [ ] Documentation update

  ## Testing
  - [ ] Unit tests added/updated
  - [ ] Feature tests added/updated
  - [ ] Manual testing performed (describe below)

  ## Checklist
  - [ ] Pint check passes (`./vendor/bin/pint --test`)
  - [ ] PHPStan analysis passes (`./vendor/bin/phpstan analyse`)
  - [ ] All tests pass (`php artisan test`)
  - [ ] No new warnings or deprecations
  - [ ] Documentation updated (README, CHANGELOG, ADR if needed)

  ## Deployment Notes
  - [ ] Database migration required
  - [ ] Queue restart required
  - [ ] New environment variables added (documented in .env.example)
  - [ ] Cache clear required after deployment

  ## Screenshots (if UI change)
  <!-- Add screenshots to help reviewers understand visual changes -->
  ```
- **Multiple Template Pattern:**
  ```
  .github/PULL_REQUEST_TEMPLATE/
    default.md
    bug_fix.md
    feature.md
    hotfix.md
    dependency_update.md
  ```
  Different templates for different PR types; each has relevant sections (hotfix has a "urgency justification" section, bug_fix has "steps to reproduce", dependency_update has "breaking changes").
- **Bug Fix Template Pattern:**
  ```markdown
  ## Bug Description
  <!-- Clear description of the bug -->

  ## Steps to Reproduce
  1. Go to '...'
  2. Click on '...'
  3. See error

  ## Expected Behavior
  <!-- What should happen instead -->

  ## Root Cause
  <!-- Technical explanation of what caused the bug -->

  ## Fix
  <!-- Brief explanation of the fix -->
  ```
- **Feature Template Pattern:**
  ```markdown
  ## Feature Description
  <!-- What does this feature do? Why is it needed? -->

  ## How to Test
  <!-- Step-by-step instructions for reviewers to test the feature -->

  ## API Changes (if applicable)
  - New endpoint: `GET /api/v2/...`
  - Deprecated: `POST /api/v1/...`

  ## Documentation
  - [ ] API docs updated
  - [ ] User-facing docs updated
  - [ ] ADR created (for architectural decisions)
  ```
- **Hotfix Template Pattern:**
  ```markdown
  ## Urgency Justification
  <!-- Why this must be deployed urgently (outside normal deployment window) -->

  ## Impact if Not Deployed
  <!-- What breaks if this isn't deployed immediately -->

  ## Risk Assessment
  <!-- What could go wrong with this fix? What's the rollback plan? -->

  ## Verification
  - [ ] Tests pass
  - [ ] Manual verification in production-like environment
  - [ ] Team lead approval obtained for out-of-window deployment
  ```

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Template count | Single template vs multiple (directory-based) | Single template for most teams (simpler, consistent); multiple templates for projects with diverse PR types (bug, feature, hotfix, dependency) |
| Checklist items | Automated checks only vs manual + automated | Both: automated checks (Pint, PHPStan, tests) for CI verification; manual items (screenshots, documentation) for human review |
| Required sections | All required vs optional sections | Minimal required: description + ticket + checklist; optional: screenshots, deployment notes (shown but not required) |
| Template location | .github/ vs root vs docs/ | .github/PULL_REQUEST_TEMPLATE.md (GitHub convention, auto-detected, separate from project files) |

## Tradeoffs

- **Detailed vs Minimal Template:** Detailed templates (10+ sections) ensure complete information but can be tedious to fill out, leading to "checkbox fatigue" where authors skip or half-fill sections. Minimal templates (3-4 sections) are quick to fill but may miss critical context for complex changes. Use a moderate template (5-8 sections); make sections optional where appropriate.
- **Single vs Multiple Templates:** Multiple templates provide relevant prompts for different PR types but require maintenance and author awareness (choosing the right template). A single template with conditional sections (using "if applicable" language) works well for most teams.
- **Checklist as Self-Review vs Quality Gate:** The checklist can serve as a self-review prompt (author checks before creating PR) or a quality gate (reviewer verifies each item). As a self-review prompt, it reminds the author to run checks. As a quality gate, it creates a second review burden. Use it as a self-review prompt; let CI enforce the automated checks.

## Performance Considerations

- **Template Size:** A template that exceeds 50 lines may not be fully read. Keep templates under 30 lines with clear section headers and brief prompts.
- **Fill Time:** A good template takes 2-5 minutes to fill. If it takes longer, the template is too detailed or the author doesn't have the information needed (testing instructions, deployment notes).
- **Review Efficiency:** A well-filled template saves 5-10 minutes of review time per PR (no need to ask basic context questions). Over a year with 200 PRs, that's 16-33 hours saved.

## Production Considerations

- **Required Status Checks:** Configure GitHub branch protection to require status checks (Pint, PHPStan, tests) before merging; the PR template's checklist reminds the author of these checks, but CI enforces them regardless.
- **Deployment Notes:** For PRs that include database migrations or environment variable changes, the deployment notes section alerts the release manager to coordinate the deployment carefully.
- **Breaking Change Flag:** A prominent "Breaking Change" checkbox ensures that breaking changes are flagged during release planning and changelog generation.

## Common Mistakes

- **No template at all:** PR descriptions are empty or contain minimal information; reviewers must ask basic questions in comments, slowing the review
- **Template too long:** 20+ sections with no markdown folding; the template is intimidating and authors skip most sections
- **Checklist items that CI already checks:** "Pint check passes" as a checklist item that must be manually confirmed; CI already enforces this, making the checklist item redundant
- **Static, never-updated template:** The template hasn't been reviewed in 2 years; it references outdated tools (PHPCS instead of Pint, old PHP version requirements)
- **No ticket reference field:** PRs don't link to tickets; reviewers can't understand the context or priority of the change

## Failure Modes

- **Template Fatigue:** Over time, contributors skip filling the template because it's too long or repetitive; PR descriptions revert to being empty. Mitigate: audit template completion; simplify if sections are consistently empty.
- **Stale Checklist Items:** A checklist item references a tool that's no longer used; contributors ignore the checklist entirely. Mitigate: review the template quarterly; remove obsolete items.
- **Template Bypass:** Contributors create PRs via the command line (gh pr create) without the template; the template is bypassed. Mitigate: enable the "require template" setting in GitHub; use a GitHub Action to validate template completion.
- **Template Drift Between Branches:** The template on the main branch differs from the template on a release branch; PRs to release branches get the wrong template. Mitigate: store templates in the default branch only; avoid per-branch templates.

## Ecosystem Usage

- **Laravel Framework:** Laravel's own PR template (github.com/laravel/framework) follows a minimal style with description, changes, and checklist sections
- **Spatie Packages:** Spatie's template includes specific sections for package changes (docs updates, migration guide, breaking changes) that differ from application templates
- **Laravel Shift:** Shift's automated upgrade PRs use a machine-generated template with upgrade notes, changed files, and post-upgrade instructions
- **GitHub Issues:** Issue templates follow a similar pattern to PR templates; many Laravel projects provide separate templates for bug reports and feature requests

## Related Knowledge Units

- code-review-standards
- contributing-dot-md-patterns
- development-workflow-documentation
- automated-changelog-generation

## Research Notes

- GitHub's pull request template feature was introduced in 2016 and is now the standard approach across the Laravel ecosystem for structuring PR descriptions
- Multiple PR templates (directory-based) were introduced by GitHub in 2019, enabling teams to provide type-specific templates for bug fixes, features, and hotfixes
- Studies show that teams using PR templates have 25% fewer review cycles per PR (less back-and-forth for missing context) and 15% higher review satisfaction scores
- The most commonly omitted section in PR templates is "testing instructions"; reviewers frequently ask "how do I test this?" for PRs that include the template but leave this section empty
