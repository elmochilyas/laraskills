# Experience Curation: Forge-Based Internal Platform Patterns

## Metadata
- **KU ID:** internal-developer-platforms-idp/forge-based-internal-platforms
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Mature
- **Dependencies:** idp-architecture-patterns, self-service-environment-provisioning, automated-deployment-pipelines
- **Related Technologies:** Laravel Forge, Forge API, Envoyer, Vapor, GitHub Actions
- **Target Audience:** Platform engineers, DevOps engineers, Laravel developers

## Overview

Laravel Forge serves as the de facto infrastructure provisioning backend for Laravel IDPs. Its API enables teams to build self-service platforms that automate server creation, site deployment, database provisioning, SSL certificate management, and worker configuration. Forge-based platforms are lighter weight than Kubernetes-based IDPs and provide Laravel-specific knowledge (PHP-FPM configuration, queue worker management, scheduled task setup) that generic platforms lack. The pattern involves wrapping Forge API calls in a CI/CD pipeline or developer portal that abstracts server management behind simple developer-facing actions.

## Core Concepts

- **Forge Recipe System:** Reusable server provisioning scripts (shell scripts) configuring server state (PHP version, extensions, fail2ban, firewall rules)
- **Forge Sites:** Virtual host configurations mapping domains to Laravel application directories; each site has PHP version, environment variables, and deployment script
- **Forge Daemons:** Background processes managed by supervisor (queue workers, custom daemons); auto-restarted on failure
- **Forge API Token:** Bearer token for authenticating programmatic access to create, read, update, and delete Forge resources
- **Deployment Script:** Bash script per site running on deploy (typically: git pull, composer install, php artisan migrate, php artisan queue:restart)
- **Recipe as Infrastructure Blueprint:** Forge recipes are equivalent to Ansible playbooks—they define desired server state declaratively

## When To Use

- Organization uses Laravel Forge for server management and wants to extend it for self-service
- Team wants automated, repeatable server provisioning with Laravel-specific optimizations
- Need to provide self-service environment creation without exposing SSH access
- Organization prefers VPS-based infrastructure over Kubernetes
- Forge API is the provisioning backend within a larger IDP architecture
- Team of 10-50 developers with multiple Laravel applications

## When NOT To Use

- Organization uses Kubernetes or serverless infrastructure (use platform-specific tools instead)
- Team has < 10 servers managed through Forge UI—API abstraction isn't needed
- Infrastructure requires custom provisioning that Forge recipes can't support
- Organization policy prohibits VPS-based infrastructure
- There is no budget for Forge subscription (starts at $12/server/month)

## Best Practices (WHY)

1. **Version-Control Recipes (Why):** Store Forge recipes in a version-controlled repository, not only in the Forge web UI. This provides version history, audit trail, CI testing, and the ability to roll back changes. Recipes are infrastructure code and deserve the same rigor as application code.

2. **Test Recipes Before Production (Why):** Recipes run as root and can break the server configuration. Test in isolated environments (dev Forge servers) before applying to production. CI should validate that recipes produce the expected server state.

3. **Use an Abstraction Layer (Why):) Wrap Forge API calls behind an interface (e.g., ProvisioningProvider interface with ForgeAdapter implementation). This prevents vendor lock-in and makes the platform portable to other backends (Ploi, RunCloud, custom) if needed.

4. **Right-Size Daemons (Why):** Running too many queue workers or unnecessary daemons wastes resources. Configure daemon count based on actual queue throughput, not guesswork. Monitor queue length and adjust worker count accordingly.

5. **Keep Deployment Scripts in Application Repos (Why):** Deployment scripts stored only in Forge UI lose version history and audit trail. Maintain deployment scripts in the application repository and reference them in Forge configuration. This ties deployment logic to the codebase version.

## Architecture Guidelines

- **Provisioning Flow:** Platform action → Forge API (create server, install recipe, create site, configure daemon) → Server provisions → Webhook notifies CI → CI validates environment → Portal shows ready
- **Environment Template Pattern:** Define reusable templates as Forge recipe + deployment script + daemon configuration. Parameterize application name, domain, PHP version.
- **Zero-Downtime Deploy:** Deployment script: maintenance mode on → git pull → composer install --no-dev → php artisan migrate --force → queue:restart → maintenance mode off
- **Recipe Versioning:** Tag and promote recipes through environments (dev → staging → prod). Store recipes in a repository with CI testing.
- **Multi-Tenant Isolation:** Separate Forge servers per client or team. Isolated daemons and database users prevent cross-tenant interference.
- **Pre-Warm Server Pools:** For "instant" provisioning, maintain a pool of pre-configured Forge servers ready for site assignment.

## Performance

- **Server Provisioning Time:** 5-15 minutes depending on recipe complexity and provider (DigitalOcean, Linode, AWS). Pre-warming reduces to near-instant.
- **API Call Latency:** Forge API operations take 1-30 seconds. Design portals for asynchronous operation with progress polling.
- **Deployment Duration:** Typical deployment: 30-90 seconds. Optimize with Composer lock caching and opcache preloading.
- **Rate Limits:** Forge API ~60 requests/minute. Batch operations via queue to prevent throttling.

## Security

- **API Token Security:** Forge API tokens grant full access. Use dedicated tokens per service with minimum required scopes. Rotate tokens quarterly. IP-restrict API access where possible.
- **Deployment Script Security:** Never include credentials in deployment scripts. Use Forge's environment variables and secret management. Scripts should reference environment variables, not contain plaintext secrets.
- **SSH Access:** Restrict direct SSH access. All infrastructure management goes through Forge API. Implement read-only SSH for debugging; use bastion hosts for emergency access.
- **Server Monitoring:** Forge provides basic monitoring. Supplement with external monitoring for disk space, memory, response time, and security events.
- **Recipe Security:** Test recipes in isolated environments. Validate recipes don't expose ports, disable firewalls, or create insecure configurations. Code review all recipe changes.

## Common Mistakes

### Mistake 1: Storing Deployment Scripts Only in Forge UI
- **Description:** Deployment scripts configured through Forge web interface, not version-controlled
- **Cause:** Convenience of the web UI, not treating scripts as code
- **Consequence:** No version history, no audit trail, hard to roll back changes
- **Better:** Maintain deployment scripts in application repository. Reference them in Forge configuration.

### Mistake 2: Hardcoding Environment Variables in Recipes
- **Description:** Database passwords, API keys directly in Forge recipe bash scripts
- **Cause:** Convenience during initial setup, not planning for security
- **Consequence:** Credentials exposed in Forge UI, recipe repository, server logs
- **Better:** Use environment-specific configuration files and Forge's secret management.

### Mistake 3: Not Testing Recipes Before Production
- **Description:** Applying untested recipes to production servers
- **Cause:** Time pressure, assumption that recipes are simple bash scripts
- **Consequence:** Server misconfiguration, downtime, security holes from untested commands
- **Better:** Test recipes in isolated dev/staging environments first. CI validates recipe output.

### Mistake 4: Over-Provisioning Daemons
- **Description:** Running too many queue workers or unnecessary daemon processes
- **Cause:** "Better safe than sorry" resource allocation
- **Consequence:** Wasted server resources, higher costs
- **Better:** Right-size daemons based on queue throughput monitoring. Start conservative and scale up.

## Anti-Patterns

- **The Forge-SSH Hybrid:** Some servers managed through Forge, others via direct SSH access. Consistency is lost. All infrastructure must go through Forge or be migrated.
- **The Manual Tweak:** An engineer SSHs into a server to "just fix one thing quickly." That manual change diverges from the recipe-defined state and will be overwritten on next provision.
- **The Golden Recipe:** One recipe for all server types. Different applications (API, queue worker, monolith) need different configurations. Maintain specialized recipes.
- **The Abandoned Server:** A Forge server that was provisioned for a project and never deprovisioned. Still running, still costing money, potentially unpatched. Implement server lifecycle management.
- **The API Key on a Post-it:** Forge API token stored in an unsecured location (chat, email, wiki). API tokens should be in a secrets manager with access controls and rotation.

## Examples

### Example 1: Forge Provisioning Flow
```
Developer clicks "Create staging environment"
  → Platform orchestrator calls Forge API:
    1. POST /servers → create server on DigitalOcean (Ubuntu 22.04, PHP 8.3)
    2. POST /servers/{id}/recipes → install recipe (nginx, MySQL 8.0, Redis 7)
    3. POST /servers/{id}/sites → create site (api-staging.myorg.com)
    4. POST /servers/{id}/daemons → configure queue worker
    5. POST /servers/{id}/deploy → deploy from repo
  → Webhook notifies CI → CI runs smoke tests
  → Portal shows "Environment Ready → https://api-staging.myorg.com"
```

### Example 2: Version-Controlled Recipe
```bash
# recipes/laravel-api/recipe.sh
#!/bin/bash
# Installs PHP 8.3 with extensions for Laravel API

# PHP Configuration
install_php 8.3
install_extension mbstring
install_extension pdo_mysql
install_extension bcmath
install_extension xml
install_extension redis

# Nginx Configuration
configure_nginx php8.3-fpm
configure_fastcgi_cache

# Security
install_fail2ban
configure_firewall --allow-http --allow-https
install_ufw

# Monitoring
install_netdata
configure_logrotate --retention 14
```

### Example 3: Deployment Script (in Application Repo)
```bash
# .forge/deploy.sh
cd /home/forge/api.myorg.com
git pull origin main
$COMPOSER install --no-interaction --no-dev --prefer-dist
php artisan migrate --force
php artisan queue:restart
php artisan optimize
```

## Related Topics

- **idp-architecture-patterns:** Forge as provisioning layer in IDP architecture
- **self-service-environment-provisioning:** Forge API for automated environment creation
- **automated-deployment-pipelines:** Deployment workflows using Forge webhooks
- **golden-path-paved-road-patterns:** Forge-based golden paths
- **service-catalog-patterns:** Forge as catalog data source

## AI Agent Notes

- **Context Requirements:** When advising on Forge-based platforms, first understand the current Forge setup (servers, recipes, sites), team size, and specific automation needs. The solution depends on existing Forge usage patterns.
- **Key Decision Points:** The critical choices are: (1) recipe management (UI vs version-controlled), (2) provisioning flow (sync vs async), (3) abstraction layer depth (thin wrap vs comprehensive interface), (4) deployment strategy (webhook vs custom). Each choice affects maintainability and flexibility.
- **Common Pitfalls in AI Assist:** Avoid recommending Kubernetes when Forge is already established. Don't suggest replacing Forge with custom infrastructure. Always emphasize version-controlled recipes and abstraction layers.
- **Laravel-Specific Nuances:** Forge API is the most common provisioning backend in the Laravel ecosystem. The combination of Forge API + GitHub Actions covers ~80% of platform engineering needs for most Laravel teams. Forge's recipe system is bash-based—for complex provisioning, supplement with Ansible or Terraform.

## Verification

- [ ] KU accurately defines Forge-based platform patterns
- [ ] Core concepts cover recipes, sites, daemons, deployment scripts
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize version-control and abstraction
- [ ] Architecture guidelines cover provisioning flow and templates
- [ ] Performance targets are quantified
- [ ] Security addresses API tokens, secrets, SSH, and monitoring
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify SSH hybrid and manual tweaks
- [ ] Examples show real provisioning flow and scripts
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
