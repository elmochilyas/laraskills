# Decision Trees: Envoyer Zero-Downtime Deployments

## Envoyer vs Alternative

**Budget for deployment tool:**
- $0 available → Use Deployer PHP instead
- Willing to pay for Forge ecosystem integration → Use Envoyer

**Is application using Laravel Octane?**
- Yes → Octane provides built-in ZDD; Envoyer may be unnecessary
- No → Envoyer is appropriate

**Number of servers:**
- Single server → Simple deploy script may suffice; Envoyer is optional
- Multi-server (2+) → Envoyer orchestrates synchronized deployments

**Self-hosted requirement:**
- Yes → Use Deployer PHP (self-hosted)
- No → Envoyer (SaaS) is convenient

## Deployment Hook Ordering

**Does the release include database migrations?**
- Yes → Run migrate BEFORE symlink swap
- No → Run cache clear and queue restart AFTER swap

**Does the release include JavaScript asset changes?**
- Yes → Run npm build in build hook, verify health check includes asset loading
- No → Skip npm build hook
