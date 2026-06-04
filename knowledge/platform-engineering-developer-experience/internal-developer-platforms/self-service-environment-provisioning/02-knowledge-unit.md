# Knowledge Unit: Self-Service Environment Provisioning

## Metadata
- **Subdomain:** Internal Developer Platforms (IDP)
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** internal-developer-platforms-idp/self-service-environment-provisioning
- **Maturity:** Maturing
- **Related Technologies:** Laravel Sail, Docker Compose, Forge API, Terraform, GitHub Codespaces

## Executive Summary

Self-service environment provisioning enables Laravel developers to create fully configured development, staging, and testing environments on demand without platform team intervention. The provisioning system must handle: project scaffolding (from templates), dependency installation (Composer + NPM), database creation + migration, queue infrastructure setup (Redis, Horizon), mail service configuration (Mailpit), and storage configuration (MinIO). The pattern shifts from IT-ticket-based provisioning to developer-triggered automation, typically via a CLI command or portal button that completes setup within 2-5 minutes.

## Core Concepts

- **Instant Dev Environment:** A running Laravel application with all services (database, cache, queue, mail) started and configured in under 60 seconds using Docker Compose
- **Environment Parity:** Development, staging, and production environments use the same service topology (same database, cache, queue versions) to prevent environment-specific bugs
- **Disposable Environments:** Environments that can be created and destroyed on demand (feature branch environments, PR previews) without manual cleanup
- **Bootstrapping Script:** A post-provisioning script that runs after infrastructure is ready: create DB, run migrations, seed data, create storage symlinks, configure .env

## Mental Models

- **Environment as a Snapshot:** Think of an environment as a snapshot of a specific source tree state + configuration + data; provisioning restores this snapshot from declarative definitions
- **Push-Button Infrastructure:** The goal is a single action (CLI command, API call, PR merge) that results in a fully working environment without any manual steps
- **Immutable vs Mutable Environments:** Immutable environments are destroyed and recreated on each provision; mutable environments are updated in place; immutability is preferred for consistency
- **Cattle vs Pets:** Environments should be treated as cattle (numbered, disposable, replaceable) not pets (named, hand-configured, irreplaceable)

## Internal Mechanics

1. **Provisioning Trigger:** Developer action (CLI `platform:env:create staging`, PR opened, button click) sends request to provisioning orchestrator
2. **Orchestrator Workflow:** Resolve environment template → determine infrastructure target (local Docker, Forge server, cloud) → execute provisioning steps in order
3. **Service Topology Resolution:** Template defines required services (MySQL 8.0, Redis 7, Meilisearch); orchestrator maps these to available infrastructure (docker-compose services, Forge-managed databases, managed cloud services)
4. **Application Bootstrap:** After infrastructure is ready: clone/pull source → `composer install` → create `.env` from template → `php artisan key:generate` → `php artisan migrate --seed` → `php artisan storage:link` → configure queue worker
5. **Health Verification:** Each step validates success; final step pings the application health endpoint and reports environment URL + credentials

## Patterns

- **Template-Based Provisioning:** Use environment templates (YAML files) that declare services, PHP version, environment variables, and post-provision scripts; store templates in version control alongside application code.
- **Progressive Provisioning:** Start with minimal environment (app + DB only), add services (cache, queue, mail, search) on demand via `sail add` or equivalent pattern; reduces initial provisioning latency.
- **Environment Lifecycle Hooks:** Define pre-provision, post-provision, pre-destroy, and post-destroy hooks; useful for notifications, metric recording, and external service registration/deregistration.
- **Data Seeding Profiles:** Support different seeding strategies: minimal (schema only), development (dummy data for UI testing), staging (anonymized production subset), review (PR-specific test scenarios).

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Provisioning target | Local Docker vs Forge server vs Kubernetes | Local Docker for dev; Forge for staging; K8s for preview environments |
| Template format | Docker Compose only vs Pulumi/Terraform | Docker Compose for simplicity; Terraform for complex cloud resources |
| State management | Database vs YAML files vs Backstage catalog | YAML files in repo for traceability; catalog for discovery |
| Data strategy | Fresh seed vs DB snapshot restore | Fresh seed for CI; snapshot for developer preview environments |
| URL assignment | Subdomain per env vs port mapping | Subdomain per environment for realistic testing |

## Tradeoffs

- **Speed vs Completeness:** Minimal provisioning (app + DB only) completes in 30 seconds but may miss service-dependent bugs. Full provisioning (all services) takes 3-5 minutes but is more reliable.
- **Local vs Remote Environments:** Local provisioning is interactive and fast but consumes developer machine resources. Remote provisioning is consistent but requires network access and has latency.
- **Fresh vs Snapshot Data:** Fresh migration + seed provides predictable state but may lack realistic data volume. Database snapshots are more realistic but require storage management and may contain PII concerns.
- **Centralized vs Decentralized Provisioning:** Centralized orchestrator provides governance and monitoring but is a single point of failure. Decentralized scripts (Sail, docker-compose up) are simpler but harder to enforce standards.

## Performance Considerations

- **Image Cache Warmup:** Pre-pull Docker images (mysql, redis, meilisearch, minio) to reduce provisioning time; maintain a "warm pool" of pre-provisioned dev containers for instant assignment.
- **Composer Dependency Cache:** Use Composer's cache mechanism in CI and local environments; avoid `composer install` on every provision when dependencies haven't changed.
- **Database Seed Time:** Large seeders can take minutes; implement chunked seeding and progress reporting for seed operations exceeding 10 seconds.
- **Parallel Provisioning:** For multi-service environments, provision independent services (database, cache, search) in parallel rather than sequentially; use Docker Compose's dependency graph with caution.

## Production Considerations

- **Idempotency:** Provisioning scripts must be safe to re-run; use `CREATE TABLE IF NOT EXISTS`, `php artisan migrate --force`, and check-before-create logic for all resources.
- **Cleanup Automation:** Implement TTL-based environment expiration (e.g., 48 hours max for feature branch environments) with automatic destruction and storage reclamation.
- **Resource Quotas:** Enforce per-team and per-user limits on concurrent environments to prevent resource exhaustion; provide queue for provisioning requests when at capacity.
- **Secret Injection:** Never bake secrets into environment templates or provisioning scripts; use Forge secrets, environment-specific `.env` files from a secure store, or vault integration.

## Common Mistakes

- **Incomplete environment parity:** Different database versions or queue drivers between environments cause production-only bugs
- **Hardcoded credentials in templates:** Leads to security incidents when templates are shared or committed to repositories
- **Ignoring teardown:** Environments accumulate as orphaned resources without automated cleanup; always implement destroy workflows alongside create workflows
- **Over-engineering for small teams:** A simple `sail up` + bash script is sufficient for teams under 5 developers; complex IDP provisioning is unnecessary overhead
- **One template to rule them all:** Different Laravel application types (API, monolith, microservice, package library) need different service topologies

## Failure Modes

- **Provisioning Timeout:** Environment takes too long (>10 min) and developers bypass the platform, provisioning manually. Mitigate: caching, pre-warming, and async provisioning with polling.
- **Resource Exhaustion:** Too many environments consume all available cloud credits or server capacity. Mitigate: quotas, billing alerts, and stale environment reaper cron jobs.
- **Stale Data in Snapshots:** Database snapshots contain outdated schema incompatible with current code. Mitigate: run migrations on restore or use fresh seeds with migration state tracking.
- **Port/Domain Conflicts:** Environment URLs or ports collide due to naming conflicts. Mitigate: unique naming (append random hash or PR number), port allocation service with lease tracking.

## Ecosystem Usage

- **Laravel Sail:** Provides `sail up` and `sail down` for local environment provisioning; extensible with custom Dockerfiles and service definitions
- **GitHub Codespaces:** Cloud-based dev environments triggered per branch; configurable via `.devcontainer/devcontainer.json`
- **Laravel Forge API:** Used for remote environment provisioning on VPS; `createServer` + `installRecipe` + `createSite` flow
- **Terraform + Laravel:** Infrastructure-as-code for complex environments with RDS, ElastiCache, S3, and other cloud-managed services
- **Symfony Docker:** Reference Docker Compose setup for PHP applications, often forked for Laravel environment provisioning

## Related Knowledge Units

- forge-based-internal-platforms
- laravel-sail
- devcontainer-configuration
- github-actions-for-laravel

## Research Notes

- Laravel Cloud (announced but not yet fully released) promises self-service environment provisioning as a managed service, potentially reducing the need for custom IDP provisioning code
- The trend in 2024-2025 is toward environment-per-PR with automatic cleanup on merge, reducing the need for permanent staging environments
- Docker Compose is the dominant provisioning format for Laravel development environments, with Kubernetes reserved for staging/production parity in larger organizations
- Environment provisioning is the highest-impact platform engineering investment for Laravel teams: reducing setup time from hours to minutes is the most visible developer experience improvement
