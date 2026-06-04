# Knowledge Unit: Code Review Standards

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/code-review-standards
- **Maturity:** Maturing
- **Related Technologies:** GitHub, GitLab, PR Review, Laravel, Coding Standards

## Executive Summary

Code review standards define the expectations, process, and etiquette for reviewing pull requests in a Laravel team. Effective code reviews balance thoroughness (catching bugs, security issues, design problems) with speed (keeping the development pipeline flowing). For Laravel teams, review standards cover: what reviewers should check (database queries, N+1 problems, authorization gates, validation logic, queue job design, service container usage), review depth expectations (logic correctness vs style—style is automated via Pint), turnaround time (ideally under 4 hours), and communication tone (constructive, specific, focused on code not the author). Well-defined review standards reduce review bottlenecks, ensure consistent review quality across team members, and create a culture where reviews are seen as collaborative improvement rather than gatekeeping.

## Core Concepts

- **Review Checklist:** A standardized list of checks that every reviewer performs (or at least considers) on each PR: security, performance, correctness, test coverage, documentation, adherence to conventions
- **Review Depth Levels:** Not all PRs need the same depth; a one-line bug fix needs less scrutiny than a new feature. Define depth: Light (style + obvious bugs), Standard (logic + test coverage + architecture), Deep (security + performance + long-term maintainability)
- **Constructive Feedback:** Review comments focus on the code, not the author ("This query could cause an N+1" vs "You wrote a bad query"). Suggest solutions or alternatives, not just problems.
- **Approval vs Request Changes:** Approval means "this is ready to merge as-is or with minor nits." Request Changes means "there is a blocking issue that prevents merging." Nitpicks (non-blocking style preferences) are prefixed with "nit:".
- **Review Rotation:** Review responsibilities are distributed across the team to avoid single-reviewer bottlenecks; senior developers review architecture; all developers review logic and tests.

## Mental Models

- **Review as Pair Programming (Async):** Code review is asynchronous pair programming; the reviewer extends the author's thinking by catching edge cases and suggesting improvements that the author didn't consider
- **Review as Knowledge Transfer:** Each review comment is a knowledge transfer opportunity—the reviewer teaches something to the author, the author teaches the reviewer about the codebase area they modified
- **Review as Bug Filter:** Think of the review as the last filter before production; if a bug would cost $1000 to fix in production, it's worth spending 10 minutes to catch it in review

## Internal Mechanics

1. **PR Submission:** Author opens PR with description, ticket reference, testing notes, and completed checklist
2. **Automated Checks:** CI runs tests, Pint, PHPStan; results are posted to the PR. Automated checks must pass before human review.
3. **Reviewer Assignment:** Assigned automatically (CODEOWNERS, round-robin) or manually (author requests specific reviewer based on expertise)
4. **Review Execution:** Reviewer reads the PR diff, focusing on: correctness (logic works as intended), security (no SQL injection, XSS, CSRF gaps), performance (no N+1, no inefficient queries), architecture (follows team patterns), tests (adequate coverage, meaningful assertions)
5. **Feedback Loop:** Reviewer posts comments → author responds or addresses → reviewer re-checks → approval or further requests
6. **Merge:** Approved PR is merged (squash merge for clean history); branch is deleted post-merge

## Patterns

- **Code Review Checklist Pattern:**
  ```markdown
  ## Review Checklist
  - [ ] No N+1 queries (check eager loading)
  - [ ] Authorization gates in place (Gate::allow, @can, ->authorize)
  - [ ] Validation in Form Requests (not controllers)
  - [ ] Database queries indexed (check explain plan)
  - [ ] Queue jobs have error handling (failed() method or middleware)
  - [ ] No hardcoded configuration (uses config(), env(), .env)
  - [ ] Tests cover the change adequately
  - [ ] Documentation updated (PHPDoc, README, ADR if needed)
  ```
- **Review Comment Framing Pattern:**
  - **Issue:** "This query could cause an N+1 when loading user orders."
  - **Suggestion:** "Consider using `->with('orders')` to eager load the relationship."
  - **Why:** "Without eager loading, each user triggers a separate query, adding 100+ queries for a page listing 100 users."
  This format (Issue + Suggestion + Why) maximizes learning and reduces defensiveness.
- **Level-Based Review Depth Pattern:**
  ```markdown
  | PR Type | Review Depth | Reviewer | Time Budget |
  |---------|-------------|----------|-------------|
  | Bug fix (1-5 lines) | Light | Any team member | 5-10 min |
  | Feature addition | Standard | Domain expert | 20-30 min |
  | Architecture change | Deep | Senior dev + team | 30-60 min |
  | Dependency update | Light (security scan) | Automated first | 5 min |
  ```
- **CODEOWNERS Pattern:**
  ```
  # .github/CODEOWNERS
  app/Services/ @senior-backend-dev
  app/Http/Controllers/ @team-lead
  database/migrations/ @database-expert
  *.php @all-developers
  ```
  Automatically assigns reviewers based on file paths; ensures domain experts review relevant changes.
- **Review SLA Pattern:**
  ```markdown
  ## Review Service Level Agreement
  - Standard PRs: first review within 4 working hours
  - Urgent PRs (hotfix): review within 1 hour (ping reviewer directly)
  - Large PRs (>500 lines): reviewer may request break into smaller PRs
  - Weekend/Friday PRs: review on next working day
  ```

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Review requirement | 1 approval vs 2 approvals | 1 approval for standard PRs; 2 for architectural changes and production deployments |
| Reviewer assignment | Automatic (CODEOWNERS) vs manual request | Automatic CODEOWNERS for standard reviews; manual request for specific expertise |
| Merge strategy | Squash merge vs merge commit vs rebase | Squash merge (clean main branch history, one commit per PR) |
| Review depth | Standardized checklist vs reviewer discretion | Standardized checklist for consistency; reviewer discretion for depth per PR type |

## Tradeoffs

- **Thoroughness vs Speed:** Thorough reviews (checking every line, running code locally, testing edge cases) catch more bugs but slow the pipeline. Fast reviews (skimming for obvious issues) ship faster but risk missing subtle bugs. The tradeoff depends on the application's risk tolerance; financial/healthcare apps need thoroughness; internal tools can prioritize speed.
- **Blocking vs Non-Blocking Nits:** Treating all feedback as blocking (PR can't merge until all comments are resolved) ensures quality but creates friction for trivial style preferences. Non-blocking nits (prefixed with "nit:") allow authors to merge without addressing minor preferences, maintaining velocity.
- **Written vs Verbal Reviews:** Written reviews (PR comments) are documented, searchable, and allow async participation. Verbal reviews (pair review, video call) are faster for complex discussions but leave no audit trail. Use written by default; escalate to verbal for contentious or complex discussions.

## Performance Considerations

- **Review Time Budget:** Allocate 1-2 hours per day for code review per developer. Reviews should not consume more than 20% of a developer's time. If review load exceeds this, the team has too many simultaneous PRs or insufficient reviewers.
- **PR Size Limit:** PRs over 400 lines of code change have a statistically higher defect rate and take disproportionately longer to review. Enforce a 400-line limit; large changes should be broken into logical PRs.
- **Review Queue Depth:** The review queue should never exceed 5 PRs per reviewer; at that point, the reviewer is overloaded and new PRs should be reassigned.

## Production Considerations

- **Security-Critical Reviews:** Any PR touching authentication, authorization, payments, or user data requires a security-focused review. Use a separate security checklist for these PRs.
- **Database Migration Reviews:** Migration PRs require extra scrutiny: check for backward compatibility (no breaking changes without a plan), reversible migrations, and performance impact on large tables (indexing strategy).
- **Deployment-Critical Reviews:** PRs that affect the deployment process (Dockerfile changes, CI config changes, deployment script changes) require a production-aware review, even if the code change is small.

## Common Mistakes

- **Style nitpicking:** Commenting on code style (spacing, variable naming, brace placement) that should be handled by Pint. Reject the PR in CI if Pint fails; don't waste human review on automated checks.
- **Rubber stamping:** Approving PRs without actually reviewing them (especially from senior developers). Every PR deserves genuine review regardless of author seniority.
- **Review overreach:** Requesting changes for design preferences that aren't team standards ("I would have used an Action class instead of a Service class"). Stick to team conventions; suggest alternative approaches as nits.
- **Too many reviewers:** Requesting review from everyone on the team; the PR sits in multiple queues and no one feels responsible. Assign 1-2 reviewers maximum.
- **Delayed reviews:** Leaving PRs unreviewed for 24+ hours; the PR context is lost, merge conflicts accumulate, and the author is blocked.

## Failure Modes

- **Reviewer Bottleneck:** One senior developer is the only reviewer; all PRs wait on their availability. Mitigate: distribute review responsibility; grow reviewing capability across the team; implement CODEOWNERS for parallel review paths.
- **Review Fatigue:** Developers burn out from constant review requests; reviews become shallow (rubber stamping). Mitigate: limit daily review load; rotate review responsibilities; recognize review contributions.
- **Hostile Review Culture:** Review comments are personal, dismissive, or overly critical; developers fear opening PRs. Mitigate: adopt constructive feedback guidelines; review the reviewers; blameless postmortems.
- **Checklist Fatigue:** Review checklist is so long that reviewers skip it entirely. Mitigate: keep the checklist to 5-7 essential items; automate checklist checks in CI where possible.

## Ecosystem Usage

- **Laravel Framework:** The Laravel core team's review standards are visible in the framework's PRs; they emphasize correctness, backward compatibility, and documentation
- **Spatie Packages:** Spatie's open-source review process is a model for the Laravel ecosystem; their reviews focus on API design, test coverage, and documentation quality
- **Laravel Shift:** Shift's automated code reviews (via Rector rules and codemods) provide a baseline for manual human review; teams can use Shift results as input to the review process
- **GitHub:** GitHub's code review features (line comments, suggested changes, thread resolution, draft PRs) shape the review workflow; understanding these features is essential for effective reviews

## Related Knowledge Units

- coding-standards-documentation
- pr-template-patterns
- development-workflow-documentation
- team-collaboration-patterns
- contributing-dot-md-patterns

## Research Notes

- Google's "Code Review Best Practices" research found that the ideal CL (change list) size is under 200 lines; larger CLs have a higher defect rate and take disproportionately longer to review
- The "SmartBear Code Review Study" (2013) showed that systematic code review catches 60-70% of defects; the first reviewer catches ~35%, a second reviewer catches an additional 15-25%
- Laravel's strong conventions reduce review variance; less time is spent debating coding style and more time on logic and architecture compared to less opinionated frameworks
- The "review turnaround time" is a leading indicator of team health; teams with <4 hour median review time ship 50% more features than teams with >24 hour review time
