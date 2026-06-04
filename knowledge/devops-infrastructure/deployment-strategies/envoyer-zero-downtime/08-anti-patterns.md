# Anti-Patterns: Envoyer Zero-Downtime Deployments

## AP-ENVOYER-001: The Blind Deployment
**Description:** Deploying without a health check configured, relying on manual verification after the symlink swap.
**Why it happens:** Health checks require an endpoint; adding one is perceived as unplanned work.
**Consequences:** Bad releases serve traffic until someone notices and manually rolls back. The "zero-downtime" deployment becomes a "downtime-until-someone-notices" deployment.
**Remediation:** Make health checks mandatory for production deployments. Configure Envoyer to fail and roll back automatically if health check fails.

## AP-ENVOYER-002: Post-Swap Migration
**Description:** Running `artisan migrate` after the symlink swap because "migrations should run against live schema."
**Why it happens:** Legacy practice from systems where code and migrations ran in a single deploy step.
**Consequences:** New code receives traffic before the schema is ready, causing a window of application errors (typically 5-30 seconds).
**Remediation:** Run migrations before the symlink swap. Use `php artisan migrate --force` to suppress the production confirmation prompt.

## AP-ENVOYER-003: Envoyer as Configuration Management
**Description:** Using Envoyer's deployment hooks to configure the server (install PHP extensions, modify Nginx, change system settings).
**Why it happens:** It's convenient to run arbitrary commands during deployment.
**Consequences:** Deployment hooks become de facto configuration management, but without idempotency, error handling, or audit trail. A failed deployment can leave the server in an inconsistent state.
**Remediation:** Keep deployment hooks focused on application deployment. Use Forge, Ansible, or recipes for server configuration.
