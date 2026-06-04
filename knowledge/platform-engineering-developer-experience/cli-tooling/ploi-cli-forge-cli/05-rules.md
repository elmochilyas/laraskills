# Rules: Ploi CLI and Forge CLI

## Metadata
- **Source KU:** ploi-cli-forge-cli
- **Subdomain:** CLI Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- FORGECLI-RULE-001: **Always specify target explicitly** — Use `--site=<id>` to avoid accidental production deployments.
- FORGECLI-RULE-002: **Store API tokens in CI secrets** — Never commit tokens to version control or expose in CI logs.
- FORGECLI-RULE-003: **Check deployment logs** — Deployment trigger success ≠ script execution success; always verify.
- FORGECLI-RULE-004: **Add retry logic** — Network failures and rate limits require retry for robust automation.
- FORGECLI-RULE-005: **Use `--wait` for synchronous deploys** — In CI, block until deployment completes.
- FORGECLI-RULE-006: **Test with staging first** — Always test deployment scripts on staging before production.

## Architecture Rules
- FORGECLI-RULE-007: **Integrate into CI pipelines** — Tests pass → quality gate → `forge deploy`.
- FORGECLI-RULE-008: **Use deployment scripts** (configured in Forge UI) for build steps; CLI triggers the script.
- FORGECLI-RULE-009: **For bulk operations, add delays between requests** to avoid rate limiting (~60 req/min).

## Decision Rules
- FORGECLI-RULE-010: **Use for automating server provisioning and site creation from CI/CD.**
- FORGECLI-RULE-011: **Use SSH or web dashboard** for direct server troubleshooting.
- FORGECLI-RULE-012: **Use webhooks** for "deploy on git push" workflows instead of polling CLI in CI.
