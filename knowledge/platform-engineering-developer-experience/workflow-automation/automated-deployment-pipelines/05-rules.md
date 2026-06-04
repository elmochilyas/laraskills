# Rules: Automated Deployment Pipelines

## Metadata
- **Source KU:** automated-deployment-pipelines
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DEPLOY-RULE-001: **Always run quality gates before deployment** — Tests, static analysis, code style.
- DEPLOY-RULE-002: **Test migrations in staging before production** — Failed migration causes extended downtime.
- DEPLOY-RULE-003: **Make all migrations reversible** — Implement `down()` methods; plan for destructive changes.
- DEPLOY-RULE-004: **Use zero-downtime deployment** for apps with SLAs (Envoyer symlink switching, Vapor alias swap).
- DEPLOY-RULE-005: **Include health check post-deployment** — Pipeline can report success even with 500 errors.
- DEPLOY-RULE-006: **Cache config/route/view** in deployment — `php artisan config:cache`, `route:cache`, `view:cache`.

## Architecture Rules
- DEPLOY-RULE-007: **Forge pattern:** git pull → composer install --no-dev → migrate --force → config:cache → route:cache → view:cache → queue:restart.
- DEPLOY-RULE-008: **Vapor pattern:** `php artisan vapor deploy production` handles full deployment.
- DEPLOY-RULE-009: **CI triggers deployment** — Tests pass → curl Forge webhook URL → Forge runs deploy script.
- DEPLOY-RULE-010: **Auto-deploy to staging** (push to develop); **manual approval gate for production**.

## Decision Rules
- DEPLOY-RULE-011: **Use automated deployment** for any Laravel app in production receiving regular updates.
- DEPLOY-RULE-012: **Deploy early in the week** (Tuesday/Wednesday) — Friday deployments are 3x more likely to cause incidents.
- DEPLOY-RULE-013: **Never deploy without staging verification** and a tested rollback plan.
