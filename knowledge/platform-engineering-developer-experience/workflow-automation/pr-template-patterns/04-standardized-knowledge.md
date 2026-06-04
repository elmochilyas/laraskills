# Experience Curation: PR Template Patterns

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/pr-template-patterns
- **Maturity:** Mature
- **Related Technologies:** GitHub, GitLab, Pull Request, Code Review, Laravel
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
PR template patterns are standardized markdown templates used when creating pull requests in GitHub or GitLab, designed to guide contributors in providing complete, consistent information for code reviews. For Laravel teams, effective PR templates include: a description of the change, link to the related ticket/issue, checklist of quality measures (Pint passes, PHPStan passes, tests added), testing instructions, deployment notes (migrations, environment variables, queue changes), and screenshots for UI changes. Templates are stored in `.github/PULL_REQUEST_TEMPLATE.md` and are automatically populated when a new PR is created. Well-designed PR templates reduce back-and-forth during review, ensure consistent PR quality across the team, and serve as a gentle reminder of the team's quality standards.

## Core Concepts
- **PR Template Location:** GitHub auto-detects templates in `.github/PULL_REQUEST_TEMPLATE.md`, `docs/PULL_REQUEST_TEMPLATE.md`, or the repository root
- **Multiple Templates:** Teams can provide directory-based templates (.github/PULL_REQUEST_TEMPLATE/bug_fix.md, feature.md, hotfix.md) with different prompts for different PR types
- **Checklist Pattern:** A markdown checkbox list that the author completes before requesting review; serves as a self-review prompt and quality gate documentation
- **Template Variables:** GitHub doesn't support dynamic variables in PR templates; templates use static markdown with HTML comments for instructions
- **Blank Issues Setting:** Repository setting that prevents PRs without a template

## When To Use
- Every Laravel project with multiple contributors (ensures consistent PR quality)
- Open-source projects where external contributors may not know the team's quality expectations
- Teams that want to reduce back-and-forth during code review (template provides missing context upfront)
- Projects with deployment requirements (migrations, env vars, queue changes) that must be documented per-PR
- Organizations with compliance requirements (every PR must document testing and deployment notes)

## When NOT To Use
- Solo projects where the single developer controls all PRs
- Automated-only PRs (Dependabot, Renovate) where the template is irrelevant
- Projects where PRs are created exclusively via CLI or API and skip the template form

## Best Practices
- **WHY:** Keep the template under 30 lines with clear section headers; templates over 50 lines are not fully read and lead to "checkbox fatigue"
- **WHY:** Include a checklist with items that CI enforces (Pint, PHPStan, tests) as reminders; even though CI checks these, the checklist prompts the author to run them before creating the PR
- **WHY:** Include a "Deployment Notes" section for migrations, queue restarts, environment variables, and cache clears; this alerts the release manager to coordinate deployment carefully
- **WHY:** Use a single template for most teams with "if applicable" language for optional sections; reserve multiple templates (bug_fix.md, feature.md, hotfix.md) for projects with diverse PR types
- **WHY:** Store the template in `.github/PULL_REQUEST_TEMPLATE.md` (GitHub convention, auto-detected, separate from project files)
- **WHY:** Review and update the template quarterly; stale templates reference outdated tools or missing quality checks

## Architecture Guidelines
- **Standard Laravel PR Template Pattern:** Description, ticket reference, type of change, testing checklist, quality checklist, deployment notes, screenshots (if UI)
- **Multiple Template Pattern:** Directory-based templates for different PR types: default.md, bug_fix.md, feature.md, hotfix.md, dependency_update.md
- **Bug Fix Template Pattern:** Bug description, steps to reproduce, expected behavior, root cause, fix explanation
- **Feature Template Pattern:** Feature description, how to test, API changes (if applicable), documentation checklist
- **Hotfix Template Pattern:** Urgency justification, impact if not deployed, risk assessment, verification checklist, team lead approval
- **Checklist Design:** Include both automated checks (Pint, PHPStan, tests) for CI verification and manual items (screenshots, documentation) for human review
- **Template Count:** Single template for most teams; multiple templates for projects with diverse PR types

## Performance
- A template that exceeds 50 lines may not be fully read; keep under 30 lines with clear headers
- A good template takes 2-5 minutes to fill; if longer, the template is too detailed or the author lacks the information
- A well-filled template saves 5-10 minutes of review time per PR; with 200 PRs/year, that's 16-33 hours saved
- Teams using PR templates have 25% fewer review cycles per PR (less back-and-forth for missing context)

## Security
- PR templates should not contain any sensitive information or internal system details
- Deployment notes section should not include actual credentials or secret names; reference CI secrets instead
- For security-critical PRs, add a "Security Impact" section to the template that flags changes needing security review
- Review template content quarterly for any references to outdated security practices or tools
- Ensure the template doesn't expose internal project structure or naming conventions for public repositories

## Common Mistakes

### No template at all
- **Description:** PR descriptions are empty or contain minimal information
- **Consequence:** Reviewers must ask basic questions in comments, slowing the review cycle
- **Better Approach:** Always provide a PR template; enable the "require template" setting in GitHub

### Template too long
- **Description:** 20+ sections with no markdown folding
- **Consequence:** Template is intimidating; authors skip most sections
- **Better Approach:** Keep to 5-8 sections; use "if applicable" language; keep under 30 lines

### Checklist items that CI already checks
- **Description:** "Pint check passes" as a manually confirmed checklist item
- **Consequence:** Redundant; CI already enforces this; checklist item adds no value
- **Better Approach:** Include CI-checked items as reminders (author runs them before PR), not as reviewer verification items

### Static, never-updated template
- **Description:** Template hasn't been reviewed in 2+ years
- **Consequence:** References outdated tools (PHPCS instead of Pint), old PHP versions, obsolete workflows
- **Better Approach:** Review and update the template quarterly; tie review to Laravel version upgrades

### No ticket reference field
- **Description:** PRs don't link to tickets or issues
- **Consequence:** Reviewers can't understand the context or priority of the change
- **Better Approach:** Include a required ticket/issue reference field; use "Closes #123" format for auto-linking

## Anti-Patterns
- **Checklist as quality gate enforcement:** Requiring reviewers to manually verify every checklist item; CI should enforce automated checks
- **Template as substitute for documentation:** Using the PR template as the sole documentation for deployment procedures or API changes
- **One-size-fits-all for every PR type:** Using the same template for bug fixes, features, hotfixes, and dependency updates without adaptation
- **Template bypass allowed:** Allowing PR creation via CLI without requiring template fields to be filled
- **Ignoring template feedback:** Team members repeatedly skip filling out the template without addressing why

## Examples
- **Laravel Framework:** Minimal PR template with description, changes, and checklist sections
- **Spatie Packages:** Template includes specific sections for package changes (docs updates, migration guide, breaking changes)
- **Laravel Shift:** Machine-generated template with upgrade notes, changed files, and post-upgrade instructions
- **GitHub Issues:** Issue templates follow a similar pattern; many Laravel projects have separate templates for bug reports and feature requests

## Related Topics
- code-review-standards (PR templates support the code review process)
- contributing-dot-md-patterns (contribution guidelines reference the PR template)
- development-workflow-documentation (broader workflow documentation)
- automated-changelog-generation (changelogs reference PR descriptions from templates)

## AI Agent Notes
- GitHub's PR template feature was introduced in 2016; multiple PR templates (directory-based) in 2019
- The most commonly omitted section is "testing instructions"; reviewers frequently ask "how do I test this?"
- Studies show PR templates reduce review cycles by 25% and improve review satisfaction by 15%
- For organizations, standardize on a single PR template across all Laravel projects for consistency
- Review the template quarterly to ensure it stays relevant as tools and workflows evolve

## Verification
- [ ] PR template file exists at `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] Template includes description, ticket reference, and checklist sections
- [ ] Checklist includes both automated (Pint, PHPStan, tests) and manual (screenshots, docs) items
- [ ] Deployment notes section covers migrations, env vars, queue changes, cache clears
- [ ] Template is under 30 lines with clear section headers
- [ ] "Require template" setting is enabled in GitHub repository settings
- [ ] Multiple templates exist for different PR types (if applicable)
- [ ] Template is reviewed and updated quarterly
- [ ] Template doesn't include redundant items that duplicate CI checks
- [ ] Template does not contain sensitive or internal information
