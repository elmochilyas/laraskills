# Experience Curation: Development Workflow Documentation

## Metadata
- **KU ID:** onboarding-team-standards/development-workflow-documentation
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Mature
- **Dependencies:** contributing-dot-md-patterns, automated-deployment-pipelines, automated-testing-in-ci
- **Related Technologies:** Git, GitHub, GitLab, CI/CD, Laravel, Agile
- **Target Audience:** Laravel developers, team leads, DevOps engineers

## Overview

Development workflow documentation describes the end-to-end process a Laravel team follows to take a feature or fix from idea to production. It covers git branching strategy (GitHub Flow, Git Flow, Trunk-Based Development), the feature lifecycle (ticket → branch → PR → review → merge → deploy), release management, hotfix processes, and quality gates (Pint, PHPStan, tests must pass before merge). For Laravel teams, the workflow documentation also addresses deployment strategies (Forge, Vapor, Envoyer), migration rollback procedures, queue worker management during deployments, and environment-specific configuration handling.

## Core Concepts

- **Feature Lifecycle:** The complete journey: ticket creation → branch → development → testing → PR → review → merge → staging → production
- **Quality Gates:** Automated checks code must pass before merging: Pint (style), PHPStan (analysis), PHPUnit/Pest (tests), Dusk (browser tests)
- **Deployment Strategy:** How code moves from merged PR to running in production; Forge (git push), Vapor (artifact upload), Envoyer (symlink switching)
- **Hotfix Process:** Expedited workflow for production-critical fixes with stricter review and faster deployment
- **Rollback Procedure:** Steps to revert a bad deployment: migration rollback, artifact restoration, queue drain

## When To Use

- Team has 2+ developers shipping code to production regularly
- Deployments need to be consistent and repeatable
- New team members need to learn "how we ship code"
- Organization requires audit trail for code changes and deployments
- CI/CD pipeline is in place and needs documented procedures

## When NOT To Use

- Single developer with full control over the process
- Project is not deployed (library, open-source package)
- Team is experimenting with a prototype and process doesn't matter yet
- Workflow changes too frequently to document (still being figured out)

## Best Practices (WHY)

1. **Document the Rollback Process Explicitly (Why):** Teams document deployment but not rollback. When a deployment goes wrong, they scramble to figure out how to revert. The rollback procedure should be as detailed as the deployment procedure, tested regularly, and included in the same document.

2. **Define Quality Gates Clearly (Why):) Ambiguous gates ("PR should be tested") lead to inconsistent enforcement. Each gate should be: (1) blocking vs advisory, (2) automated vs manual, (3) who is responsible. Example: "Pint check passes — blocking — automated — CI enforces."

3. **Establish Deployment Windows (Why):** Deployments on Friday afternoon are risky—if something goes wrong, no one is available until Monday. Document deployment windows (e.g., Tuesday/Thursday, 10 AM - 11 AM) and the hotfix exception process.

4. **Automate the Standard; Require Approval for the Exception (Why):** Standard deployments should be fully automated (CI → staging → production). Hotfixes and out-of-window deployments require explicit approval (lead engineer sign-off). This balances speed for emergencies with safety for standard changes.

5. **Document Environment Variable Changes (Why):** New environment variables added in a PR are often forgotten in the deployment process. The workflow should require .env.example updates and deployment notes for every PR that adds configuration.

## Architecture Guidelines

- **Git Workflow:** GitHub Flow (simple, one main branch) for most teams. Git Flow for release-versioned projects with synchronized releases.
- **PR Merge Strategy:** Squash merge for main (clean history, one commit per PR). Merge commits for develop in Git Flow.
- **Deployment Frequency:** Continuous to staging (auto-deploy on merge to main). Daily to production (scheduled window). Hotfix as needed with approval.
- **Code Review Requirement:** 1 reviewer for standard work. 2 reviewers for architectural changes or infrastructure modifications.
- **Quality Gates:** Hard gates (CI blocks merge) for standard development. Soft gates for emergencies with override approval.
- **Rollback Strategy:** Automated rollback script. Tested quarterly. Clear single-command rollback for each deployment type.

## Performance

- **CI Pipeline Time:** 5-15 minutes (Pint + PHPStan + PHPUnit + Dusk). Optimize with parallel jobs and caching.
- **Review Turnaround:** Target <4 hours for standard PR review. Long cycles bottleneck the workflow.
- **Deployment Duration:** 2-5 minutes for full Laravel deployment. Zero-downtime (Envoyer) in 30-60 seconds.
- **Deployment Freeze:** Document freeze periods (holidays, major events) and the exception process.

## Security

- **Deployment Permissions:** Document who can deploy to each environment. Production deployment requires specific role or approval.
- **Secrets Management:** Document how secrets are stored and accessed (Forge secrets, GitHub Actions secrets, vault). Never in code or deployment scripts.
- **Compliance Gates:** For regulated environments, document additional gates (security review, compliance approval) in the workflow.
- **Audit Trail:** All deployments logged with PR reference, deployer, timestamp, and result. Logs are immutable.

## Common Mistakes

### Mistake 1: No Documented Rollback
- **Description:** Deployment process documented, rollback process omitted
- **Cause:** Focus on success path, ignoring failure
- **Consequence:** When deployment goes wrong, team scrambles to figure out how to revert
- **Better:** Document rollback procedure alongside deployment. Test rollback quarterly.

### Mistake 2: Skipping Quality Gates for Hotfixes
- **Description:** Hotfix deployed without CI because "it's urgent"
- **Cause:** Emergency pressure, no defined hotfix process
- **Consequence:** Hotfix introduces new bug because tests weren't run
- **Better:** Define hotfix process with lighter but non-zero gates. Require post-hoc review within 24 hours.

### Mistake 3: Inconsistent Deployment Process
- **Description:** Different team members follow different deployment steps
- **Cause:** No documented workflow, tribal knowledge
- **Consequence:** One forgets migrations, another forgets queue restart
- **Better:** Automate deployment steps. Document remaining manual steps as a checklist.

### Mistake 4: No Deployment Freeze Policy
- **Description:** Deployments happen on Friday afternoon
- **Cause:** No established windows or freeze periods
- **Consequence:** Production issue on weekend, no one available to fix
- **Better:** Document deployment windows. Define freeze periods with exception process.

## Anti-Patterns

- **The Free-for-All:** Anyone can deploy to production anytime with no process. Risk of uncoordinated changes breaking production. Define roles and workflows.
- **The Ticket-Before-Deployment:** Each deployment requires a change management ticket with 48-hour approval. Kills velocity for low-risk changes. Standardize low-risk deployments; reserve tickets for significant changes.
- **The Manual Deployment Playbook:** 20-step manual deployment instructions that must be followed perfectly. Automate as much as possible; document only what can't be automated.
- **The QA-Bottleneck:** All changes must go through manual QA before deployment. Works for low-frequency releases but blocks continuous delivery. Automate regression testing; reserve manual QA for significant releases.

## Examples

### Example 1: Feature Lifecycle
```
Ticket → Branch → Code → PR → Review → Merge → Staging → Production
  │        │        │      │       │        │         │          │
  JIRA-123 feature/  dev   CI ok  1 review  squash   auto-deploy scheduled
           JIRA-123         passes  approve  merge    to staging   deploy
```

### Example 2: Quality Gates Definition
```markdown
## Quality Gates (Merge Requirements)
1. ✅ Pint check passes (blocking, automated)
2. ✅ PHPStan level 6 passes (blocking, automated)
3. ✅ All PHPUnit tests pass (blocking, automated)
4. ✅ At least one reviewer approved (blocking, manual)
5. 🔶 Dusk tests pass (advisory, automated)
6. 🔶 Coverage does not decrease (advisory, automated)
```

### Example 3: Laravel Deployment Procedure
```markdown
1. Run `php artisan down --retry=60` (maintenance mode with retry)
2. Git pull or deploy artifact
3. Run `composer install --no-dev --optimize-autoloader`
4. Run `php artisan migrate --force`
5. Run `php artisan config:cache` and `php artisan route:cache`
6. Run `php artisan queue:restart` (if queue workers)
7. Run `php artisan up` (disable maintenance mode)
8. Verify health endpoint returns 200
```

## Related Topics

- **contributing-dot-md-patterns:** Contribution workflow reference
- **automated-deployment-pipelines:** Deployment automation
- **automated-testing-in-ci:** CI quality gates
- **code-review-standards:** Review process and expectations
- **team-collaboration-patterns:** Collaboration within the workflow

## AI Agent Notes

- **Context Requirements:** When advising on workflow documentation, first understand team size, current deployment process (or lack thereof), CI/CD setup, and specific pain points (slow reviews, deployment failures, inconsistent process).
- **Key Decision Points:** Branching strategy (GitHub Flow vs Git Flow), merge strategy, deployment frequency, review requirements, quality gate strictness.
- **Common Pitfalls in AI Assist:** Don't recommend Git Flow for small teams. Always include rollback procedures. Document deployment windows. Define hotfix processes separately from standard processes.
- **Laravel-Specific Nuances:** Forge/Vapor/Envoyer are the standard deployment targets. Migration safety is critical. Queue worker restart during deployment is Laravel-specific. `artisan down --retry` provides zero-downtime maintenance mode.

## Verification
- [ ] KU accurately defines development workflow documentation
- [ ] Core concepts cover feature lifecycle, quality gates, deployment
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize rollback and deployment windows
- [ ] Architecture guidelines cover branching, merge, deployment strategy
- [ ] Performance addresses CI time and review turnaround
- [ ] Security covers permissions, secrets, compliance gates
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify free-for-all and QA-bottleneck
- [ ] Examples show lifecycle diagram, quality gates, deploy procedure
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes address Laravel-specific deployment concerns
