# Decision Trees: Ploi CLI and Forge CLI

## Metadata
- **KU ID:** cli-tooling-artisan-extensions/ploi-cli-forge-cli
- **Subdomain:** cli-tooling-artisan-extensions
- **Domain:** platform-engineering-developer-experience
- **Phase:** 4 (Experience Curation)
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Deployment trigger method | CLI `forge deploy` / Webhook / GitHub Actions | How deployments are initiated after CI passes |
| 2 | Environment targeting | Explicit `--site` / Context config / Prompt | Preventing accidental production deployments |
| 3 | Synchronous vs async | `--wait` block / Fire-and-forget / Check logs | Confirming deployment success vs pipeline speed |
| 4 | Token management | CI secrets / Local config / Encrypted vault | Securing API credentials across environments |
| 5 | Bulk operations | Sequential with delays / Parallel with limits / Batched | Managing rate limits across many servers/sites |

## Architecture-Level Decision Trees

### Tree 1: Deployment Trigger Selection

- **Start:** Choosing how to trigger a deployment
- **Is the deployment part of a CI/CD pipeline with quality gates?**
  - Yes → Use CLI command (`forge deploy`) after CI passes (tests → lint → static analysis → deploy). Ensures quality gates are enforced before deployment.
  - No → Continue.
- **Is the deployment on every git push to a branch?**
  - Yes → Use webhooks. Forge/Ploi can auto-deploy on git push. No CLI needed. Set secret token to prevent unauthorized triggers.
  - No → Manual CLI trigger is appropriate.
- **CI integration flow:** Tests pass → PHPStan passes → Pint passes → `forge deploy --server=X --site=X --wait` → Verify health endpoint.

### Tree 2: Environment Targeting Safety

- **Start:** Ensuring the right environment is targeted
- **Are you deploying to production?**
  - Yes → Continue. Use extra caution.
  - No → Staging/testing targets are lower risk.
- **Safety measures for production:**
  1. Always use explicit `--server=<id> --site=<id>`. Never rely on default context.
  2. Verify server/site ID before executing.
  3. Use environment-specific CI secrets (separate token for production vs staging).
  4. Require manual approval in CI for production deployments.
- **Mistargeting prevention:**
  - Staging: `forge deploy --server=staging-id --site=staging-id`
  - Production: `forge deploy --server=prod-id --site=prod-id`
  - Never use a generic script that determines target from git branch alone (branch can be wrong).

### Tree 3: Synchronous vs Async Deployment

- **Start:** Deciding whether to wait for deployment completion
- **Is this a CI/CD pipeline where success confirmation matters?**
  - Yes → Use `--wait` flag. Blocks until deployment completes (30-120 seconds). Exit code reflects deployment success, not just API trigger success.
  - No → Fire-and-forget is fine for manual triggers.
- **Verification after deployment (even with `--wait`):**
  1. Check deployment logs: `forge deploy:log --server=X --site=X`.
  2. Verify health endpoint returns 200.
  3. Run smoke tests against the deployed environment.
- **Async pattern:** Trigger without `--wait`, check logs in next pipeline step. Slightly faster total time but more complex error handling.

### Tree 4: Token and Credential Management

- **Start:** Managing API tokens securely
- **Is the token used in CI/CD?**
  - Yes → Store as CI repository secret. Never in workflow YAML files. Use masked secret configuration.
  - No → Continue.
- **Is the token used on local developer machines?**
  - Yes → Store in `~/.forge/config.json` (Forge CLI default). Protect with file permissions.
  - No → Never hard-code tokens in application code or shell scripts.
- **Security practices:**
  - Rotate tokens quarterly and on team member departure.
  - Use separate tokens for production vs staging environments.
  - Monitor token usage for unexpected deployment activity.
  - Never commit tokens to version control.
- **CI error handling:** Add retry logic with exponential backoff. Network failures and rate limits (60 req/min) require robust retry handling.
