# Decision Trees: Development Workflow Documentation

## Metadata
- **KU ID:** onboarding-team-standards/development-workflow-documentation
- **Phase:** 4 (Experience Curation)
- **Curator:** Phase 4 Standardization Process
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Git workflow | GitHub Flow / Git Flow / Trunk-Based | Team size, release cadence, and versioning needs |
| 2 | Quality gate strictness | Hard gates block merge / Soft gates advisory / Mixed | Need for speed vs safety in the pipeline |
| 3 | Deployment strategy | Forge auto-deploy / Vapor / Envoyer symlink / Manual | Infrastructure preference and zero-downtime requirements |
| 4 | Hotfix process | Expedited with approval / Expedited without approval / Standard only | Balance between emergency response and process integrity |
| 5 | Rollback automation | Automated script / Manual playbook / CI rollback | Speed of recovery when deployments fail |

## Architecture-Level Decision Trees

### Tree 1: Git Workflow Selection

- **Start:** Choosing a branching strategy
- **Does the project need versioned releases (semver, multiple simultaneous versions)?**
  - Yes → Continue.
  - No → Use GitHub Flow (single main branch, feature branches, deploy from main). Simplest workflow.
- **Are synchronized releases required (mobile app + API, scheduled deployments)?**
  - Yes → Use Git Flow (main + develop + release branches). Supports release preparation and hotfix branches.
  - No → Continue.
- **Is the team experienced with continuous delivery?**
  - Yes → Use Trunk-Based Development (short-lived feature branches, merge to main multiple times daily, feature flags for incomplete work).
  - No → Use GitHub Flow. Easier to adopt. Add feature flags later for work-in-progress.
- **PR merge strategy:**
  - GitHub Flow → Squash merge (clean history, one commit per PR).
  - Git Flow → Merge commits to develop (preserves history). Squash merge to main.
  - Trunk-Based → Squash merge or rebase merge.

### Tree 2: Quality Gate Configuration

- **Start:** Defining quality gates for PR merge
- **Is this a standard feature/bugfix PR?**
  - Yes → Apply all standard gates.
  - No (hotfix) → Apply hotfix gates (lighter but non-zero).
- **Standard gates (all required):**
  - Pint check passes (blocking, automated)
  - PHPStan level 6 passes (blocking, automated)
  - All PHPUnit tests pass (blocking, automated)
  - At least 1 reviewer approved (blocking, manual)
  - Dusk tests pass (advisory, automated)
  - Coverage does not decrease (advisory, automated)
- **Emergency (hotfix) gates:**
  - PHPStan passes at baseline level (not maximum)
  - Critical tests pass
  - Lead engineer approval (blocking)
  - Post-hoc full review within 24 hours
- **Gate skip process:** Requires lead engineer approval. Documented in PR with reason. Audit trail in deployment log.

### Tree 3: Deployment Strategy and Rollback

- **Start:** Choosing how to deploy the Laravel application
- **Is zero-downtime deployment required?**
  - Yes → Continue.
  - No → Simple deployment: `git pull`, `composer install`, `migrate`, restart queue. Accept brief downtime.
- **Is the application deployed to Vapor?**
  - Yes → Use Vapor's built-in deployment (`vapor deploy`). Rollback via Vapor dashboard. Automated via GitHub Actions.
  - No → Continue.
- **Is Forge + Envoyer the infrastructure?**
  - Yes → Use Envoyer for zero-downtime symlink switching. Automated via Forge deploy script or GitHub Actions.
  - No → Continue.
- **Alternative:** Custom deployment with Docker. Build image → push to registry → deploy to Kubernetes/ECS. Rollback via image tag.
- **Rollback automation:**
  - Define a single-command rollback for each deployment type.
  - Create automated rollback script: restore previous release, rollback migration, restart queue.
  - Test rollback quarterly as part of the deployment freeze period.

### Tree 4: Deployment Window and Change Management

- **Start:** When and how deployments happen
- **Is this a standard deployment?**
  - Yes → Continue.
  - No (hotfix) → Use hotfix process with lead engineer approval.
- **Deployment windows:**
  - Standard: Tuesday/Thursday, 10 AM - 11 AM. Scheduled.
  - Hotfix: Any time with lead engineer approval. Post-hoc notification in #deployments.
  - Frozen: Holiday periods, major events. Exception requires CTO approval.
- **Deployment procedure:**
  1. PR merged to main.
  2. CI runs full suite (Pint, PHPStan, tests).
  3. Auto-deploy to staging.
  4. Staging smoke tests pass.
  5. Manual approval for production (or auto if configured).
  6. `php artisan down --retry=60`, deploy, migrate, cache, queue restart, `php artisan up`.
  7. Verify health endpoint.
  8. Announce in #deployments with PR reference, changelog, rollback instructions.
- **Environment variable changes:** Every PR that adds config must update .env.example and include deployment notes.
