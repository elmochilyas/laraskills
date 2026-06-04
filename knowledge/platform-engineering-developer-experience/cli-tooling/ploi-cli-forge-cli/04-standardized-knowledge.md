# 04-Standardized Knowledge: Ploi CLI and Forge CLI

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | cli-tooling-artisan-extensions |
| **Knowledge Unit** | ploi-cli-forge-cli |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | cli-workflow-automation, automated-deployment-pipelines, github-actions-for-laravel |
| **Framework/Language** | Laravel Forge, Ploi, Forge CLI, PHP, Server Management |

## Overview

Forge CLI (`forge-cli`) and Ploi CLI are command-line tools for managing Laravel server provisioning and deployment via their respective web services. They manage servers, sites, daemons, cron jobs, SSL certificates, and deployments from the terminal. Both tools act as thin REST API wrappers, requiring API tokens for authentication. They enable infrastructure-as-code workflows for Laravel deployments — provisioning servers, creating sites, triggering deployments, and managing environment config without a browser.

## Core Concepts

- **API-Backed Operations**: each CLI command maps to a REST API call (create server, deploy site, manage daemons)
- **Authentication**: API tokens from web dashboard stored in local config (`~/.forge/config.json`)
- **Deployment Triggers**: `forge deploy` sends POST to API which triggers SSH deployment script on target server
- **Site Management**: create, configure Nginx sites, manage `.env` files, install SSL certificates
- **Daemon Management**: register queue workers, Reverb WebSocket servers, or custom long-running processes
- **Caching**: API responses cached locally to reduce latency for list operations

## When to Use

- Automating server provisioning and site creation from CI/CD pipelines
- Triggering deployments after test suites pass in GitHub Actions
- Managing environment variables across multiple sites
- Setting up SSL certificates (Let's Encrypt) via CLI
- Bulk operations across multiple servers or sites

## When NOT to Use

- Direct server troubleshooting (use SSH or web dashboard)
- Operations requiring visual feedback (dashboard provides richer error diagnosis)
- When API rate limits constrain operation volume
- For teams not using Forge or Ploi as their server management platform

## Best Practices (WHY)

- **Always specify target explicitly**: use `--site=<id>` to avoid accidental production deployments
- **Store API tokens in CI secrets**: never commit tokens to version control or expose in CI logs
- **Check deployment logs**: deployment trigger success ≠ script execution success; always verify
- **Add retry logic**: network failures and rate limits require retry for robust automation
- **Use `--wait` for synchronous deploys**: in CI, use the wait flag to block until deployment completes
- **Test with staging first**: always test deployment scripts on staging before production

## Architecture Guidelines

- Integrate into CI pipelines: tests pass → quality gate → `forge deploy` for gated deployments
- Use deployment scripts (configured in Forge UI) for build steps; CLI triggers the script execution
- Environment management: pull `.env` with `forge site:env:get`, modify, push with `forge site:env:set`
- For bulk operations, add delays between requests to avoid rate limiting (~60 req/min)
- Use webhooks for "deploy on git push" workflows instead of polling CLI in CI

## Performance Considerations

- Each CLI command makes 1-3 API calls with 100-500ms latency each
- List operations on many servers/sites may take 2-10 seconds
- `forge deploy` without `--wait` returns immediately; with `--wait`, blocks 30-120 seconds
- Cached responses make subsequent list commands fast; first command after cache expiry is slower
- Rate limit: ~60 requests/minute — batch operations need pacing

## Security Considerations

- API tokens provide full access to server management capabilities — treat as sensitive credentials
- Store tokens in CI secrets, environment variables, or encrypted config (never in VCS)
- Mistargeting a production server from local CLI can cause unintended changes — always verify server ID
- Webhooks for deployment should use secret tokens to prevent unauthorized triggers
- Rotate API tokens periodically and on team member departure

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Targeting wrong environment | Deploying to production instead of staging | Not specifying `--site` | Production downtime | Always use explicit `--site=<id>` |
| Exposing API tokens | Token in CI logs or committed | Careless handling | Server security compromise | Use masked CI secrets |
| Not verifying deployment logs | Assuming trigger success = deployment success | Not checking status | Silent deployment failure | Check deployment logs after trigger |
| Destructive commands | `site:delete` or `server:delete` without confirmation | Haste | Irreversible data loss | Double-check before destructive ops |
| Rate limit hitting | Bulk operations hitting 60 req/min limit | Not pacing requests | Failed commands | Add delays between requests |

## Anti-Patterns

- **Manual Production Changes**: using CLI for ad-hoc production changes without review
- **Shared API Tokens**: multiple developers sharing the same token without audit trail
- **Deployment Bypass**: triggering deployments without CI gating (tests, quality checks)
- **Config Drift**: manually editing `.env` on server and locally, losing sync
- **Script Dependence**: relying on CLI for critical operations without fallback plan for API outages

## Examples

```bash
# Server bootstrap workflow
forge server:create --provider=digitalocean --size=s-2vcpu-4gb --php-version=php82
forge site:create --server=<id> --project-type=laravel example.com
forge site:env:set --server=<id> --site=<id> APP_ENV=production
forge daemon:create --server=<id> --command="php8.2 artisan queue:work"

# CI deployment
forge deploy --server=<id> --site=<id> --wait

# Environment sync
forge site:env:get --server=<id> --site=<id> > .env.production
# Edit .env.production locally
forge site:env:set --server=<id> --site=<id> --from-file=.env.production

# SSL automation
forge site:ssl:letsencrypt --server=<id> --site=<id>
```

## Related Topics

- cli-workflow-automation — chaining commands into workflows
- automated-deployment-pipelines — deployment workflow automation
- github-actions-for-laravel — CI/CD integration
- custom-artisan-command-patterns — command structure and registration

## AI Agent Notes

- Forge CLI is PHP-based; Ploi CLI is Node.js — affects CI image dependencies
- Both tools support webhook-based deployment as alternative to CLI
- API tokens in CI must be configured as repository secrets, never in workflow YAML
- When automating, prefer `forge deploy --wait` for synchronous confirmation in CI pipelines

## Verification

- [ ] API token configured and authenticated (`forge list` works)
- [ ] Correct server/site targeted in all operations
- [ ] Deployment script tested on staging before production
- [ ] CI secrets configured for API token
- [ ] Rate limiting accounted for in bulk operations
- [ ] SSL certificates installed and auto-renewal configured
- [ ] Environment variables synced between local and server
- [ ] Deployment logs reviewed after initial trigger
- [ ] Rollback plan documented for failed deployments
