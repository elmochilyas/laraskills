# Anti-Patterns: Deployment Automation

## AP-DA-001: The Single-Environment Pipeline
**Description:** A deployment pipeline that only deploys to production, with no staging step.
**Why it happens:** Staging costs money; skipping it saves infrastructure budget.
**Consequences:** Every deployment is the first deployment of that code to a production-like environment. Issues that would be caught in staging become production incidents.
**Remediation:** At minimum, run tests in a CI environment before deploying. Ideally, deploy to a staging environment with similar configuration.

## AP-DA-002: The Build-on-Production Script
**Description:** A deployment script that clones the repository on the production server and runs Composer install, npm build, and other build steps there.
**Why it happens:** Legacy deployment patterns from the pre-container era.
**Consequences:** Production servers require build toolchain (Node.js, npm, Composer with dev dependencies). Deployment time includes build time. Build failures happen on production, not in CI.
**Remediation:** Build artifacts in CI, deploy only the built artifact to production. Use Docker for build-once-deploy-anywhere pattern.

## AP-DA-003: Pipeline Approval Theater
**Description:** Requiring manual approval for every production deployment without actually reviewing what changed.
**Why it happens:** Compliance requirement for manual approval gates in deployment process.
**Consequences:** Manual approval adds delay without adding quality. Approvals become routine clicks with no actual review.
**Remediation:** Automate quality gates (tests, linting, security scan). Reserve manual approval for deployments with specific risk characteristics (database migrations, configuration changes).
