# Knowledge Unit: Development Workflow Documentation

## Metadata
- **Subdomain:** Onboarding & Team Standards
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** onboarding-team-standards/development-workflow-documentation
- **Maturity:** Mature
- **Related Technologies:** Git, GitHub, GitLab, CI/CD, Laravel, Agile

## Executive Summary

Development workflow documentation describes the end-to-end process a Laravel team follows to take a feature or fix from idea to production. It covers git branching strategy (Git Flow, GitHub Flow, Trunk-Based Development), the feature lifecycle (ticket → branch → PR → review → merge → deploy), release management (versioning, changelog generation, deployment windows), hotfix processes, and quality gates (Pint, PHPStan, tests must pass before merge). For Laravel teams, the workflow documentation also addresses Laravel-specific concerns: deployment strategies (Forge, Vapor, Envoyer), migration rollback procedures, queue worker management during deployments, and environment-specific configuration handling. The documentation is stored in the project repository (WORKFLOW.md or docs/workflow.md) and is referenced during onboarding, sprint planning, and incident response. The goal is to create a shared understanding of "how we ship code" so that every team member can navigate the process without asking questions.

## Core Concepts

- **Feature Lifecycle:** The complete journey of a code change: ticket creation in Jira/GitHub Issues → local branch → development → testing → PR → review → merge → staging → production
- **Quality Gates:** Automated checks that code must pass before merging: Pint (style), PHPStan (static analysis), PHPUnit/Pest (unit tests), Dusk (browser tests); gating prevents bad code from reaching production
- **Deployment Strategy:** How code moves from merged PR to running in production; Forge uses git-push-based deployment, Vapor uses artifact upload, Envoyer uses zero-downtime deployment via symlink switching
- **Hotfix Process:** Expedited workflow for production-critical fixes that bypasses the normal feature pipeline; includes stricter review and faster deployment
- **Rollback Procedure:** Documented steps to revert a bad deployment, including database migration rollback (artisan migrate:rollback), artifact restoration, and queue drain

## Mental Models

- **Workflow as Railroad Tracks:** The workflow defines the tracks the code train runs on—from development station through testing tunnels to production destination. Everyone follows the same tracks, preventing collisions and derailments.
- **Quality Gates as Toll Booths:** Each quality gate (Pint, PHPStan, tests) is a toll booth that code must pass through on its way to production. No skipping toll booths; failing gates means the code doesn't proceed.
- **Deployment as Elevator:** Production deployment is an elevator that code rides up in batches; the elevator runs on a schedule (deployment window), and code that misses the current ride waits for the next one.

## Internal Mechanics

1. **Ticket Assignment:** Developer picks a ticket from the backlog; ticket status moves from "To Do" to "In Progress"
2. **Branch Creation:** Developer creates a feature branch from the default branch (main/master); branch naming follows convention (feature/JIRA-123-short-description)
3. **Local Development:** Developer writes code following coding standards; runs Pint, PHPStan, and tests locally before committing
4. **PR Submission:** Developer pushes branch and creates a Pull Request with a description referencing the ticket, change summary, testing notes, and PR checklist
5. **Automated CI:** GitHub Actions runs: Pint check, PHPStan analysis, PHPUnit tests, Dusk tests (if applicable). Status is reported on the PR.
6. **Code Review:** 1-2 team members review the PR; they check logic, test coverage, architecture alignment, and adherence to standards
7. **Merge:** PR is merged (squash or merge commit per team convention); branch is deleted
8. **Deployment:** Merged code is deployed to staging (auto) and production (scheduled or manual trigger)
9. **Verification:** Post-deployment monitoring confirms the deployment is healthy; any rollback triggers the incident process

## Patterns

- **Git Branching Pattern:**
  ```markdown
  ## Branching Strategy
  - **main:** Production-ready code; all merges must pass CI and review
  - **develop:** Integration branch for feature work (if using Git Flow)
  - **feature/<ticket>-<description>:** Individual feature branches from develop/main
  - **hotfix/<ticket>-<description>:** Urgent fixes from main, merged back to main and develop
  - **release/<version>:** Release candidates for stabilization (if using Git Flow)
  ```
- **PR Description Template Pattern:**
  ```markdown
  ## Description
  [Brief description of changes]

  ## Ticket
  [JIRA-123 or GitHub Issue #123]

  ## Testing
  - [ ] Unit tests added/passed
  - [ ] Feature tests added/passed
  - [ ] Manual testing performed

  ## Deployment Notes
  - [ ] Migration required (rollback plan documented)
  - [ ] Queue restart required after deployment
  - [ ] Environment variables added (documented in .env.example)
  ```
- **Deployment Window Pattern:**
  ```markdown
  ## Deployment Schedule
  - **Staging:** Auto-deploy on every merge to main (CI trigger)
  - **Production:** Tuesday/Thursday deployments, 10:00-11:00 AM
  - **Hotfix:** Any time with lead engineer approval
  - **Rollback threshold:** 15 minutes post-deploy monitoring
  ```
- **Quality Gate Definition Pattern:**
  ```markdown
  ## Quality Gates (Merge Requirements)
  1. ✅ Pint check passes (blocking)
  2. ✅ PHPStan level 6 passes (blocking)
  3. ✅ All PHPUnit tests pass (blocking)
  4. ✅ At least one reviewer approved (blocking)
  5. 🔶 Dusk tests pass (non-blocking advisory)
  ```
- **Laravel-Specific Deployment Pattern:**
  ```markdown
  ## Deployment Process (Laravel)
  1. Run `php artisan down --retry=60` (maintenance mode with retry)
  2. Git pull or deploy artifact
  3. Run `composer install --no-dev --optimize-autoloader`
  4. Run `php artisan migrate --force`
  5. Run `php artisan config:cache`
  6. Run `php artisan route:cache`
  7. Run `php artisan view:cache`
  8. Run `php artisan queue:restart` (if queue workers)
  9. Run `php artisan up` (disable maintenance mode)
  ```

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Git workflow | GitHub Flow vs Git Flow vs Trunk-Based | GitHub Flow (simple, one main branch) for most teams; Git Flow for release-versioned projects |
| PR merge strategy | Squash merge vs merge commit vs rebase | Squash merge (clean history, one commit per PR) for main; merge commits for develop |
| Deployment frequency | Continuous vs daily vs weekly | Continuous to staging; daily to production; hotfix as needed |
| Code review requirement | 1 reviewer vs 2 reviewers | 1 reviewer for standard work; 2 reviewers for architectural changes |

## Tradeoffs

- **GitHub Flow vs Git Flow:** GitHub Flow is simpler (one main branch, feature branches, continuous deployment) but offers less structure for release management. Git Flow provides release branches and hotfix patterns but adds complexity. GitHub Flow works for most Laravel teams; Git Flow is needed when synchronizing releases with marketing or compliance.
- **Manual vs Automated Deployments:** Manual deployments give control but introduce human error and variable execution times. Automated deployments are consistent and fast but reduce the safety check moment. For Laravel: automate the standard deployment; require manual approval for production.
- **Hard vs Soft Quality Gates:** Hard quality gates (CI blocks merge if tests fail) guarantee quality but can block urgent hotfixes. Soft gates (tests are advisory) allow speed but may let bugs through. Use hard gates for all standard development; soft gates only for emergencies with override approval.

## Performance Considerations

- **CI Pipeline Time:** A full CI pipeline (Pint + PHPStan + PHPUnit + Dusk) takes 5-15 minutes. Optimize by: parallelizing jobs, caching vendor/ and node_modules/, using PHPStan's result cache, running Dusk only on relevant changes.
- **Review Turnaround:** Target <4 hours for standard PR review turnaround. Long review cycles bottleneck the workflow; establish SLAs for review response time.
- **Deployment Duration:** Full Laravel deployment (maintenance mode, composer install, migrate, cache, restart) takes 2-5 minutes. Zero-downtime deployments on Envoyer take 30-60 seconds via symlink switching.

## Production Considerations

- **Maintenance Mode:** Document the `artisan down` and `artisan up` procedure clearly; include retry time for waiting requests during deployment.
- **Migration Safety:** All migrations must be reversible (up and down methods). Document rollback strategy for each deployment that includes migrations.
- **Queue Worker Drain:** Before deployment, drain queue workers (let them finish current jobs) then restart after deployment to pick up new code.
- **Feature Flags:** For risky changes, use feature flags to enable/disable functionality without deployment; allows instant rollback without code revert.

## Common Mistakes

- **No documented rollback:** Teams document the deployment process but not the rollback process; when a deployment goes wrong, they scramble to figure out how to revert
- **Skipping quality gates:** A hotfix is deployed without passing CI because "it's urgent"; the hotfix introduces a new bug because tests weren't run
- **Inconsistent deployment process:** Different team members follow different deployment steps; one forgets to run migrations, another forgets to restart queue workers
- **No deployment freeze policy:** Deployments happen on Friday afternoon; if something goes wrong, no one is available to fix it until Monday
- **Missing environment variable documentation:** A PR adds a new .env variable but doesn't document it; the deployment succeeds but the feature fails because the variable isn't set in production

## Failure Modes

- **Deployment Race Condition:** Two PRs merged simultaneously; the second deployment overwrites the first without including its changes. Mitigate: deployment queue; only one deployment at a time.
- **Migration Conflict:** Two PRs both add migrations; deployment runs them out of order or one references a column the other removed. Mitigate: migration naming convention with timestamps; CI detects migration conflicts.
- **Review Bottleneck:** Only one senior developer can review PRs; all work waits on their availability. Mitigate: distribute review responsibility; define review criteria so multiple team members can review.
- **Hotfix Process Abuse:** Urgent hotfixes become the normal deployment path; quality is permanently degraded. Mitigate: require post-hoc review and test coverage for all hotfixes within 24 hours.

## Ecosystem Usage

- **Laravel Forge:** Forge's deployment workflow (git push → script execution) is the standard for Laravel teams; the workflow documentation should reference Forge's UI and deployment script configuration
- **Laravel Vapor:** Vapor uses a different deployment model (artifact upload); the workflow documentation must address Vapor-specific steps (Lambada function updates, database connections, queue configuration)
- **Laravel Envoyer:** For teams using Envoyer for zero-downtime deployments, document the project setup, deployment triggers, and health check configuration
- **GitHub Actions:** The most common CI platform for Laravel workflows; document the workflow YAML structure and how to trigger manual deployments via workflow_dispatch

## Related Knowledge Units

- contributing-dot-md-patterns
- automated-deployment-pipelines
- automated-testing-in-ci
- code-review-standards
- team-collaboration-patterns

## Research Notes

- GitHub Flow is the most common branching strategy among Laravel teams (~70%), followed by Git Flow (~20%) and Trunk-Based Development (~10%)
- The "Friday deployment ban" is a widely adopted convention; deployments are restricted to Tuesday-Thursday with Monday and Friday as no-deploy days
- Laravel's maintenance mode with retry header (artisan down --retry=60) is a first-party zero-downtime feature that automatically retries requests after deployment
- Forge's Quick Deploy feature auto-deploys on git push; this is commonly used for staging environments and occasionally for production with a webhook gate
