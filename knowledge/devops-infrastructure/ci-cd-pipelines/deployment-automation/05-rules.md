# Rules: Deployment Automation

## DA-001: Immutable Artifacts
**Condition:** CI/CD pipeline builds deployable artifact
**Action:** Build once, promote same artifact through all environments
**Rationale:** Different artifacts per environment introduce irreproducible deployment behavior
**Consequences:** Violation causes staging-success/production-failure scenarios

## DA-002: No Production Build Steps
**Condition:** Deployment pipeline for production
**Action:** All build steps (Composer install, npm build) must run in CI/CD, not on production
**Rationale:** Build on production couples deployment to production toolchain and increases risk
**Consequences:** Violation extends deployment time and introduces production toolchain dependency

## DA-003: Automated Rollback Trigger
**Condition:** Deployment pipeline configured
**Action:** Include automated rollback trigger that can be invoked without code changes
**Rationale:** Manual rollback is slow and error-prone during incidents
**Consequences:** Violation extends incident recovery time

## DA-004: Secrets Never in Repository
**Condition:** Deployment pipeline uses secrets
**Action:** Store all secrets in CI/CD platform secret management, not in repository files
**Rationale:** Repository secrets are visible to all users with repository access
**Consequences:** Violation exposes production credentials to unauthorized parties

## DA-005: Staging-Identical Pipeline
**Condition:** Multi-environment deployment pipeline
**Action:** Staging and production deployment pipelines must differ only in target configuration
**Rationale:** Pipeline differences between environments cause undetected deployment failures
**Consequences:** Violation creates "works in staging, fails in production" scenarios
