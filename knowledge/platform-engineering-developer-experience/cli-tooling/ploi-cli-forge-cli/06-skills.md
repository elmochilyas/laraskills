# Skill: Manage Servers and Deployments with Forge CLI / Ploi CLI

## Purpose
Manage Laravel server provisioning, site creation, deployments, daemons, SSL certificates, and environment configuration via command-line tools backed by Forge or Ploi REST APIs.

## When To Use
- Automating server provisioning and site creation from CI/CD pipelines
- Triggering deployments after test suites pass in GitHub Actions
- Managing environment variables across multiple sites
- Setting up SSL certificates (Let's Encrypt) via CLI
- Bulk operations across multiple servers or sites

## When NOT To Use
- Direct server troubleshooting (use SSH or web dashboard)
- Operations requiring visual feedback (dashboard provides richer error diagnosis)
- When API rate limits constrain operation volume
- For teams not using Forge or Ploi as their server management platform

## Prerequisites
- Forge or Ploi account with active servers
- API token from web dashboard (stored in CI secrets)
- Forge CLI (`forge-cli`) or Ploi CLI installed
- Deployment scripts configured in the web dashboard

## Inputs
- API token for authentication
- Server ID and site ID targets
- Environment variable names and values
- Deployment script configuration in Forge/Ploi dashboard

## Workflow
1. Install Forge CLI or Ploi CLI via `composer global require` or direct download
2. Authenticate with API token: `forge auth:login` or configure `~/.forge/config.json`
3. Always specify target explicitly with `--site=<id>` to avoid accidental production deployment
4. Integrate into CI pipeline: tests pass → quality gate → `forge deploy`
5. Use `--wait` for synchronous deploys in CI to block until deployment completes
6. Check deployment logs after trigger (trigger success ≠ execution success)
7. For bulk operations, add delays between requests to avoid rate limiting (~60 req/min)
8. Store API tokens in CI secrets — never commit tokens to version control
9. Add retry logic for network failures and rate limits
10. Test deployment scripts on staging before production every time

## Validation Checklist
- [ ] Target explicitly specified with `--site=<id>` for all operations
- [ ] API tokens stored in CI secrets, not in version control
- [ ] Deployment logs checked after trigger (confirm execution success)
- [ ] Retry logic implemented for network failures and rate limits
- [ ] `--wait` used for synchronous deploys in CI
- [ ] Deployment scripts tested on staging before production
- [ ] Rate limits respected with delays between bulk operations
- [ ] CI pipeline uses quality gate before triggering deploy
- [ ] `forge deploy` triggers via webhook for "deploy on git push" workflows

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Accidental production deploy | Wrong site ID | Always specify `--site=<id>` explicitly |
| Deploy trigger succeeds but deploy fails | Trigger ≠ execution success | Check deployment logs after trigger |
| API token exposed in CI logs | Token not in secrets | Store tokens in CI secrets; mask in logs |
| Rate limited during bulk operations | Too many requests in short time | Add delays between requests (~1 second) |
| Deploy fails silently in CI | No wait flag | Use `--wait` to block until deploy completes |
| Staging works, production fails | Different config | Test deploy script on staging first |
| Deploy triggered on every push | No quality gate | Gate deploys behind passing tests + static analysis |

## Decision Points
- **Deployment trigger:** CLI command (CI) vs webhook (git push) vs dashboard (manual)
- **Synchronous vs async:** `--wait` for CI (block until done) vs async for manual deploys
- **Environment variables:** CLI `env:set` vs `.env` file upload vs dashboard
- **Rate limiting approach:** Fixed delay vs exponential backoff vs queued batch

## Performance/Security Considerations
- **Never commit API tokens** to version control; use CI secrets
- API tokens provide full access to server management; restrict token permissions
- Check deployment logs for each trigger — trigger success doesn't mean deploy success
- Rate limits vary by provider; implement retry with backoff
- Use staging environment for all deployment script testing before production
- Access tokens should be rotated periodically and revoked for departed team members

## Related Rules
- FORGECLI-RULE-001 through FORGECLI-RULE-012

## Related Skills
- Set Up Automated Deployment Pipelines
- Set Up GitHub Actions for Laravel
- Automate CLI Workflows
- Manage Environment Files

## Success Criteria
- Server provisioning is fully scripted and repeatable
- Deployments trigger automatically from CI after quality gate passes
- All production deploys are tested on staging first
- Environment variables managed via CLI (not manual dashboard edits)
- SSL certificates provisioned and renewed automatically via CLI
- Rate limits respected; retry logic handles transient failures
- No API tokens committed to version control
