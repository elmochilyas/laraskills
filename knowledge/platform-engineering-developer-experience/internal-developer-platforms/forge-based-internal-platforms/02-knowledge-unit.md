# Knowledge Unit: Forge-Based Internal Platform Patterns

## Metadata
- **Subdomain:** Internal Developer Platforms (IDP)
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** internal-developer-platforms-idp/forge-based-internal-platforms
- **Maturity:** Mature
- **Related Technologies:** Laravel Forge, Forge API, Envoyer, Vapor, GitHub Actions

## Executive Summary

Laravel Forge serves as the de facto infrastructure provisioning backend for Laravel IDPs. Its API enables teams to build self-service platforms that automate server creation, site deployment, database provisioning, SSL certificate management, and worker configuration. Forge-based platforms are typically lighter weight than Kubernetes-based IDPs and provide Laravel-specific knowledge (PHP-FPM configuration, queue worker management, scheduled task setup) that generic platforms lack. The pattern involves wrapping Forge API calls in a CI/CD pipeline or developer portal that abstracts server management behind simple developer-facing actions.

## Core Concepts

- **Forge Recipe System:** Reusable server provisioning scripts (shell scripts) that configure server state (PHP version, extensions, fail2ban, firewall rules)
- **Forge Sites:** Virtual host configurations that map domains to Laravel application directories; each site has its own PHP version, environment variables, and deployment script
- **Forge Daemons:** Background processes managed by supervisor (queue workers, custom daemons); automatically restarted on failure
- **Forge API Token:** Bearer token used to authenticate programmatic access to create, read, update, and delete Forge resources
- **Deployment Script:** A bash script defined per site that runs on deploy (typically: `git pull`, `composer install`, `php artisan migrate`, `php artisan queue:restart`)

## Mental Models

- **Forge as the Control Plane:** Think of Forge as the API-driven control plane for Laravel infrastructure; developer interactions go through Forge rather than directly to servers
- **Recipe as Infrastructure Blueprint:** Forge recipes are equivalent to Ansible playbooks or Dockerfiles—they define the desired server state declaratively
- **Site as Application Unit:** A Forge site is the atomic deployment unit; one site = one Laravel application instance with its own domain, process space, and configuration
- **Deployment Script as Pipeline Stage:** The deployment script is the final stage of CI/CD; CI runs tests, then triggers a Forge deploy which executes the script

## Internal Mechanics

1. **Forged-Based Provisioning Flow:** Platform action triggers → Forge API call (create server, install recipe, create site, configure daemon) → Server provisioning completes → Webhook notifies CI → CI runs tests against new environment → Developer portal shows environment ready
2. **Forge API Endpoints Used:** `/servers` (create/manage), `/servers/{id}/sites` (site management), `/servers/{id}/recipes` (recipe management), `/servers/{id}/daemons` (background workers)
3. **Recipe Execution:** Forge installs the OS, provisions the server with Nginx, then runs user-defined recipes; recipes are bash scripts run as root with variables for PHP version, database type, etc.
4. **Deployment Webhook:** Forge generates unique webhook URLs per site; CI calls this URL to trigger deployment; Forge pulls code from git, runs the deployment script, and reports success/failure

## Patterns

- **Environment Template Pattern:** Define a "Laravel API service" template as a Forge recipe + deployment script + daemon configuration; reuse by parameterizing application name, domain, and PHP version.
- **Zero-Downtime Deploy Pattern:** Deployment script performs: `git pull`, `composer install --no-dev`, `php artisan migrate --force` in maintenance mode, restart queue workers, enable site.
- **Recipe Versioning Pattern:** Store Forge recipes in a version-controlled repository; tag and promote recipes through environments (dev → staging → prod).
- **Multi-Tenant Isolation Pattern:** Create separate Forge servers per client or team; use isolated daemons and database users to prevent cross-tenant interference.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Recipe management | Forge web UI vs version-controlled repositories | Version-controlled repos with CI-tested recipes |
| Server sizing | Forge auto-scaling vs fixed server sizes | Fixed sizes for simpler teams; auto-scaling for variable loads |
| Database provisioning | Forge-managed vs external RDS | Forge for dev/staging; RDS for production |
| SSL management | Forge auto-SSL (LetsEncrypt) vs manual | Forge auto-SSL for all environments |
| Deployment trigger | Forge webhooks vs SSH-based custom deploy | Forge webhooks for simplicity; SSH for complex multi-step workflows |

## Tradeoffs

- **Forge Control vs Abstraction:** Building directly on Forge API gives maximum control but requires more platform engineering. Using Envoyer for deployment reduces effort but limits customization of the deploy process.
- **Server-Level vs Container-Level Isolation:** Forge manages servers directly (VMs), not containers. This provides simpler networking and debugging but less density than Kubernetes.
- **Forge API Rate Limits:** Forge API has rate limits (~60 requests/minute); batch operations must be throttled; consider using a queue for high-volume provisioning.
- **Vendor Lock-In:** Deep Forge integration creates dependency on Forge's API and pricing; mitigate by maintaining an abstraction layer (interface + adapter) for the provisioning backend.

## Performance Considerations

- **Server Provisioning Time:** 5-15 minutes depending on recipe complexity and provider (DigitalOcean, Linode, AWS). Consider pre-warming server pools for "instant" provisioning.
- **API Call Latency:** Forge API operations take 1-30 seconds; design portals to be asynchronous with progress polling rather than synchronous blocking.
- **Deployment Duration:** Typical deployment script takes 30-90 seconds; optimize Composer dependency resolution with lock file caching and opcache preloading.

## Production Considerations

- **API Token Security:** Forge API tokens grant full access; use dedicated tokens per service with minimum required scopes; rotate tokens regularly.
- **Server Monitoring:** Forge provides basic monitoring; supplement with external monitoring for disk space, memory, and response time alerts.
- **Failure Handling:** Provisioning failures should roll back (delete failed server, clean up DNS); implement idempotent recipes that can be safely re-run.
- **Cost Tracking:** Tag Forge servers with metadata (project, environment, team) for cost allocation; use Forge's billing reports or external cloud cost tools.

## Common Mistakes

- **Storing deployment scripts in Forge UI only:** Lose version history and audit trail; keep deployment scripts in the application repository
- **Hardcoding environment variables in recipes:** Use environment-specific configuration files and secret management
- **Not testing recipes before production use:** Recipes run as root; test in isolated environments before applying to production
- **Over-provisioning daemons:** Running too many queue workers or unnecessary daemons wastes resources; right-size based on actual queue throughput
- **Ignoring Forge update notifications:** Forge regularly updates its platform (PHP version support, OS images); staying current prevents security and compatibility issues

## Failure Modes

- **Recipe Execution Failure:** A recipe fails mid-execution, leaving server in inconsistent state. Mitigate: use idempotent recipes and validate post-condition after each recipe step.
- **Deployment Script Timeout:** Long-running artisan commands (migrations, seeders) exceed Forge's deployment timeout. Mitigate: use the `halt` directive to fail fast and manual migration runs for large datasets.
- **API Token Leak:** Exposed token allows infrastructure modification outside governed workflows. Mitigate: short-lived tokens, IP-restricted API access, token rotation on breach detection.
- **Server Drift:** Manual SSH changes diverge from recipe-defined state. Mitigate: scheduled recipe re-runs, monitoring for config file changes, read-only access for non-platform engineers.

## Ecosystem Usage

- **Laravel Forge:** Official server management platform from Laravel; supports DigitalOcean, Linode, Vultr, Hetzner, AWS
- **Envoyer:** Zero-downtime deployment platform from Laravel; integrates with Forge for server management
- **Laravel Vapor:** Serverless deployment platform; alternative to Forge for teams preferring AWS Lambda
- **Ploi:** Alternative to Forge with similar API-driven server management; supports workers, cron jobs, and deployment scripts
- **RunCloud:** Server management panel with API; alternative for teams that prefer a different provider

## Related Knowledge Units

- idp-architecture-patterns
- self-service-environment-provisioning
- automated-deployment-pipelines
- golden-path-paved-road-patterns

## Research Notes

- Forge API v2 introduced in 2024 with improved rate limits and additional endpoints for daemon configuration
- Forge-based platforms are the most common IDP pattern in Laravel teams with 10-50 developers
- The combination of Forge API + GitHub Actions + Developer Portal covers ~80% of platform engineering needs for Laravel teams without requiring Kubernetes expertise
- Forge's recipe system is limited to bash scripts vs. more sophisticated configuration management tools; teams needing complex provisioning should consider Ansible or Terraform alongside Forge
