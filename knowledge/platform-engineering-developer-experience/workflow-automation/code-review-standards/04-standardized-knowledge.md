# Experience Curation: Code Review Standards

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/code-review-standards
- **Maturity:** Maturing
- **Related Technologies:** GitHub, GitLab, PR Review, Laravel, Coding Standards
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Code review standards define the expectations, process, and etiquette for reviewing pull requests in a Laravel team. Effective code reviews balance thoroughness (catching bugs, security issues, design problems) with speed (keeping the development pipeline flowing). For Laravel teams, review standards cover: what reviewers should check (database queries, N+1 problems, authorization gates, validation logic, queue job design, service container usage), review depth expectations (logic correctness vs style—style is automated via Pint), turnaround time (ideally under 4 hours), and communication tone (constructive, specific, focused on code not the author).

## Core Concepts
- **Review Checklist:** A standardized list of checks that every reviewer performs on each PR: security, performance, correctness, test coverage, documentation, conventions
- **Review Depth Levels:** Not all PRs need the same depth; define Light (style + obvious bugs), Standard (logic + test coverage + architecture), Deep (security + performance + maintainability)
- **Constructive Feedback:** Comments focus on the code, not the author; suggest solutions, not just problems
- **Approval vs Request Changes:** Approval means "ready to merge as-is or with minor nits"; Request Changes means "blocking issue prevents merging"
- **Review Rotation:** Review responsibilities distributed across the team to avoid single-reviewer bottlenecks
- **Review as Knowledge Transfer:** Each review comment is a knowledge transfer opportunity

## When To Use
- Every Laravel team with 2+ developers (code review is essential for knowledge sharing and quality)
- Projects where code quality, security, and maintainability are priorities
- Teams practicing continuous delivery (reviews ensure quality before automated deployment)
- Open-source projects (reviews ensure contributions meet project standards)
- Distributed or async teams (written reviews provide documentation and async participation)

## When NOT To Use
- Solo projects with a single developer (self-review can replace formal review process)
- Emergency hotfixes requiring immediate deployment (post-deploy review acceptable)
- Prototype projects where speed is prioritized over quality
- Automated-only changes (Dependabot, Renovate PRs for patch dependencies)

## Best Practices
- **WHY:** Use a standardized review checklist focused on Laravel-specific concerns: N+1 queries, authorization gates, form request validation, indexed queries, queue job error handling
- **WHY:** Follow the Issue + Suggestion + Why format for review comments: describe what's wrong, suggest how to fix it, explain why it matters
- **WHY:** Automate style checks (Pint) and type checks (PHPStan) in CI so human reviewers focus on logic, architecture, and correctness
- **WHY:** Enforce a 400-line PR size limit; PRs over 400 lines have higher defect rates and take disproportionately longer to review
- **WHY:** Target <4 hour review turnaround time; teams with fast review times ship 50% more features than teams with >24 hour review times
- **WHY:** Prefix non-blocking nitpicks with "nit:" to distinguish from blocking issues; this maintains velocity while allowing style or minor improvement suggestions

## Architecture Guidelines
- **Review Checklist Pattern:** Structured markdown checklist covering N+1 queries, authorization, validation, indexing, queue jobs, config, tests, docs
- **Review Comment Framing Pattern:** Issue + Suggestion + Why format maximizes learning and reduces defensiveness
- **Level-Based Review Depth Pattern:** Bug fix (Light, 5-10 min), Feature addition (Standard, 20-30 min), Architecture change (Deep, 30-60 min), Dependency update (Light, 5 min)
- **CODEOWNERS Pattern:** Automatically assigns reviewers based on file paths; ensures domain experts review relevant changes
- **Review SLA Pattern:** Standard PRs reviewed within 4 hours; urgent hotfixes within 1 hour; large PRs may be requested to split
- **Review Requirement:** 1 approval for standard PRs; 2 for architectural changes and production deployments
- **Reviewer Assignment:** Automatic CODEOWNERS for standard reviews; manual request for specific expertise
- **Merge Strategy:** Squash merge for clean main branch history (one commit per PR)

## Performance
- Allocate 1-2 hours per day for code review per developer; reviews should not consume more than 20% of a developer's time
- PRs over 400 lines have higher defect rates and take disproportionately longer to review; enforce size limits
- Review queue should never exceed 5 PRs per reviewer; at that point, the reviewer is overloaded
- A well-filled PR template saves 5-10 minutes of review time per PR; with 200 PRs/year, that's 16-33 hours saved

## Security
- Any PR touching authentication, authorization, payments, or user data requires a security-focused review with a separate security checklist
- Database migration PRs need extra scrutiny: backward compatibility, reversible migrations, performance impact on large tables
- PRs affecting deployment (Dockerfile, CI config, deployment scripts) require production-aware review
- Avoid rubber-stamping PRs from senior developers; every PR deserves genuine review regardless of author seniority
- Security-sensitive changes should have a second reviewer independently verify the security implications

## Common Mistakes

### Style nitpicking
- **Description:** Commenting on code style that should be handled by Pint
- **Consequence:** Wastes human review time on formatting; frustrates developers
- **Better Approach:** Let CI enforce style; reviewers focus on logic, architecture, and correctness

### Rubber stamping
- **Description:** Approving PRs without genuine review, especially from senior developers
- **Consequence:** Bugs and issues slip through because "everyone trusted the author"
- **Better Approach:** Every PR deserves genuine review regardless of author seniority

### Review overreach
- **Description:** Requesting changes for design preferences that aren't team standards
- **Consequence:** Friction and debate over subjective preferences
- **Better Approach:** Stick to team conventions; suggest alternative approaches as nits

### Too many reviewers
- **Description:** Requesting review from everyone on the team
- **Consequence:** PR sits in multiple queues; no one feels responsible
- **Better Approach:** Assign 1-2 reviewers maximum per PR

### Delayed reviews
- **Description:** Leaving PRs unreviewed for 24+ hours
- **Consequence:** PR context is lost, merge conflicts accumulate, author is blocked
- **Better Approach:** Target <4 hour review time; use review SLAs

## Anti-Patterns
- **Gatekeeping culture:** Using reviews to block changes rather than improve them; creates hostility and slows the team
- **Style debates in review:** Arguing about formatting, naming, or style preferences that should be automated
- **Request changes without explanation:** "This needs to change" without explaining why or suggesting how
- **One-person review bottleneck:** Only one senior developer can approve PRs; all work stops when they're unavailable
- **Checklist fatigue:** A 20-item checklist that reviewers skip entirely; keep it to 5-7 essential items

## Examples
- **Laravel Framework:** Core team reviews emphasize correctness, backward compatibility, and documentation
- **Spatie Packages:** Open-source review process focuses on API design, test coverage, and documentation quality
- **Laravel Shift:** Automated code reviews via Rector rules provide a baseline for manual human review
- **GitHub:** Code review features (line comments, suggested changes, thread resolution, draft PRs) shape the workflow

## Related Topics
- coding-standards-documentation (documenting the team's coding standards)
- pr-template-patterns (PR templates support the review process)
- development-workflow-documentation (broader workflow documentation)
- team-collaboration-patterns (team dynamics around reviews)
- contributing-dot-md-patterns (contribution guidelines for open-source)

## AI Agent Notes
- Google's research found the ideal change size is under 200 lines; larger changes have higher defect rates
- Systematic code review catches 60-70% of defects; the first reviewer catches ~35%, a second adds 15-25%
- Laravel's strong conventions reduce review variance; less time debating style, more on logic
- Review turnaround time is a leading indicator of team health; <4 hour median time correlates with higher throughput
- For AI-assisted code review, focus on what AI does well (security scanning, pattern detection) and what humans do well (architecture, design, context)

## Verification
- [ ] Review checklist is documented and shared with the team
- [ ] Review depth levels are defined (Light, Standard, Deep)
- [ ] Review SLA targets are established (<4 hours for standard PRs)
- [ ] CI handles automated checks (Pint, PHPStan, tests) so reviewers focus on logic
- [ ] PR size limit (400 lines) is enforced
- [ ] Constructive feedback guidelines are established (Issue + Suggestion + Why)
- [ ] CODEOWNERS file assigns domain experts to relevant code paths
- [ ] Review rotation prevents single-reviewer bottlenecks
- [ ] Security-critical changes have a separate security review checklist
- [ ] Review load is monitored and balanced (max 5 PRs per reviewer)
