# Anti-Patterns: Deployer PHP

## AP-DEPLOYER-001: Golden deploy.php
**Description:** Creating a single `deploy.php` that must work perfectly for all environments, tested only in production.
**Why it happens:** Writing and testing deployment configuration is tedious; skipping staging testing saves time.
**Consequences:** First deployment to production fails with recipe errors. Removing a release directory with active traffic or misconfiguring shared paths causes permanent data loss.
**Remediation:** Test `deploy.php` on staging with identical directory structure before production use.

## AP-DEPLOYER-002: The Shared .env Trap
**Description:** Sharing `.env` between staging and production by placing it in a shared location accessible to both.
**Why it happens:** Convenience — one `.env` to maintain seems simpler than environment-specific files.
**Consequences:** A staging deployment that changes the `.env` affects production. Accidental database URL changes cause production outages.
**Remediation:** Maintain separate `.env` files per environment. Use Deployer's `shared` configuration per host.

## AP-DEPLOYER-003: Deployment by Developer
**Description:** Developers run `dep deploy production` from their local machines instead of through CI/CD.
**Why it happens:** CI/CD setup is not configured; it's faster to deploy locally.
**Consequences:** No audit trail. Deployments happen from unknown commit states. Developer machine compromise exposes production SSH keys. "It works on my machine" becomes deployment standard.
**Remediation:** Restrict SSH access to CI/CD IPs. Require CI/CD pipeline execution for all production deployments.

## AP-DEPLOYER-004: Release Accumulation
**Description:** Keeping hundreds of release directories because "we might need to roll back to any of them."
**Why it happens:** No retention policy is configured; default is unlimited releases.
**Consequences:** Disk space exhaustion on the application server. Release directory listing becomes slow. `dep rollback` to very old releases fails because shared files have diverged.
**Remediation:** Configure retention to keep 3-5 releases. Document the rollback window.
