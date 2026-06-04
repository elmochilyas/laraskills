# Experience Curation: Self-Service Environment Provisioning

## Metadata
- **KU ID:** internal-developer-platforms-idp/self-service-environment-provisioning
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** forge-based-internal-platforms, laravel-sail, devcontainer-configuration
- **Related Technologies:** Laravel Sail, Docker Compose, Forge API, Terraform, GitHub Codespaces
- **Target Audience:** Platform engineers, DevOps engineers, Laravel developers

## Overview

Self-service environment provisioning enables Laravel developers to create fully configured development, staging, and testing environments on demand without platform team intervention. The provisioning system handles: project scaffolding (from templates), dependency installation (Composer + NPM), database creation + migration, queue infrastructure setup (Redis, Horizon), mail service configuration (Mailpit), and storage configuration (MinIO). The pattern shifts from IT-ticket-based provisioning to developer-triggered automation, typically via a CLI command or portal button that completes within 2-5 minutes.

## Core Concepts

- **Instant Dev Environment:** A running Laravel application with all services (database, cache, queue, mail) started and configured in under 60 seconds using Docker Compose
- **Environment Parity:** Development, staging, and production use the same service topology to prevent environment-specific bugs
- **Disposable Environments:** Environments created and destroyed on demand (feature branch environments, PR previews) without manual cleanup
- **Bootstrapping Script:** Post-provisioning script: create DB, run migrations, seed data, create storage symlinks, configure .env
- **Immutable vs Mutable Environments:** Immutability (destroy and recreate) preferred for consistency
- **TTL-Based Cleanup:** Automatic environment expiration and destruction (e.g., 48 hours for feature branches)

## When To Use

- Developers spend > 30 minutes setting up local development environments
- Team frequently needs temporary environments for feature branches or PR reviews
- Multiple Laravel applications with different service requirements (database, cache, queue, search)
- Organization wants to standardize environment configurations across teams
- CI testing against production-like environments is necessary for reliability

## When NOT To Use

- Single application with simple requirements (SQLite, no queue) doesn't need complex provisioning
- Team under 5 developers can manage ad-hoc environments without automation overhead
- Organization lacks infrastructure budget for remote environments
- Requirements change too frequently for template-based provisioning to be stable

## Best Practices (WHY)

1. **Idempotent Provisioning (Why):** Provisioning scripts must be safe to re-run without side effects. Use `CREATE TABLE IF NOT EXISTS`, `php artisan migrate --force`, and check-before-create logic. This enables retry on failure and safe re-provisioning.

2. **Cattle, Not Pets (Why):** Treat environments as numbered, disposable, replaceable resources. Named environments that require hand-configuration defeat the purpose of automation. If an environment breaks, destroy it and create a new one.

3. **Implement Destroy with Create (Why):** Every environment creation workflow must have a corresponding destruction workflow. Orphaned environments accumulate costs and security risks. TTL-based auto-cleanup prevents resource exhaustion.

4. **Cache Everything (Why):** Pre-pull Docker images, cache Composer dependencies, pre-build Docker images for common service combinations. Each second of provisioning latency reduces developer satisfaction. Target 30-second local setups and 3-minute remote setups.

5. **Parity Over Speed (Why):** Use the same database version, queue driver, and service topology across environments. Environment-specific bugs are among the hardest to debug. Sacrifice provisioning speed for parity when necessary.

## Architecture Guidelines

- **Provisioning Target Selection:** Local Docker for development environments. Forge/VPS for staging environments. Kubernetes for preview/PR environments. Match infrastructure to environment purpose.
- **Template-Based Configuration:** Store environment templates as YAML files in version control alongside application code. Templates declare services, PHP version, environment variables, and post-provision scripts.
- **Progressive Provisioning:** Start with minimal environment (app + DB only), add services on demand. Reduces initial provisioning latency and lets developers choose complexity.
- **Data Seeding Profiles:** Support different strategies: schema only (CI), dummy data (development), anonymized production subset (staging), PR-specific scenarios (review).
- **Health Verification:** Each provisioning step validates success. Final step pings application health endpoint and reports environment URL + credentials.
- **Resource Quotas:** Enforce per-team and per-user limits on concurrent environments. Queue provisioning requests when at capacity.

## Performance

- **Local Provisioning Target:** < 60 seconds for app + DB. < 3 minutes for full-service environment.
- **Remote Provisioning Target:** < 5 minutes for staging. < 10 minutes for preview environments.
- **Image Cache Warmup:** Pre-pull Docker images (mysql, redis, meilisearch, minio). Maintain a "warm pool" of pre-provisioned dev containers for instant assignment.
- **Composer Cache:** Cache vendor/ directory. Avoid `composer install` when dependencies haven't changed.
- **Database Seed Optimization:** Large seeders > 10 seconds should use chunked seeding with progress reporting.

## Security

- **Secret Injection:** Never bake secrets into environment templates or provisioning scripts. Use Forge secrets, environment-specific .env files from a secure store, or vault integration.
- **Network Isolation:** Provisioned environments are isolated from production networks. Development and staging environments cannot access production resources.
- **Cleanup Automation:** TTL-based environment expiration with automatic destruction. No environment lives longer than configured maximum (48h for feature branches, 30d for staging).
- **Credential Rotation:** Environment-specific credentials are generated per provision and destroyed with the environment. No shared credentials across environment instances.
- **Audit Trail:** All provisioning actions logged with actor, environment, timestamp. Provisioning failures captured for analysis.

## Common Mistakes

### Mistake 1: Incomplete Environment Parity
- **Description:** Different database versions or queue drivers between dev, staging, and production
- **Cause:** Using different service configurations for speed or cost reasons
- **Consequence:** Production-only bugs from environment differences, hard to debug
- **Better:** Match service versions across all environments. Sacrifice speed for parity.

### Mistake 2: No Automated Teardown
- **Description:** Environments accumulate as orphaned resources
- **Cause:** Only implementing create workflows, forgetting destroy
- **Consequence:** Resource exhaustion, increased costs, security surface area grows
- **Better:** Every create workflow has a corresponding destroy. Implement TTL-based auto-cleanup.

### Mistake 3: Hardcoded Credentials in Templates
- **Description:** Database passwords or API keys in template files
- **Cause:** Convenience during development, not planning for security
- **Consequence:** Security incidents when templates are shared or committed
- **Better:** Generate credentials per environment, inject via environment variables at provision time

### Mistake 4: One Template for Everything
- **Description:** Same service topology for API services, monoliths, queue workers, packages
- **Cause:** Simplicity preference, not recognizing different service needs
- **Consequence:** Bloated environments for simple services, missing services for complex ones
- **Better:** Different templates for different application types (API, monolith, package, worker)

## Anti-Patterns

- **The Snowflake Server:** A production server that has been manually configured over years and can't be reproduced. Everything should be defined as code.
- **The Click-Ops Interface:** A portal that requires clicking through 20 options to provision an environment. Should be a single command or button with smart defaults.
- **The Ticket-Backed Platform:** Developer requests environment → creates ticket → platform team provisions → replies to ticket. The entire point of self-service is eliminating this cycle.
- **The Stale Snapshot:** Database snapshot that's 6 months old and schema-incompatible with current code. Use fresh seeds or run migrations on restore.

## Examples

### Example 1: Local Dev Environment
```
$ sail up -d
→ MySQL 8.0 container starting...
→ Redis 7 container starting...
→ Meilisearch container starting...
→ Mailpit container starting...
→ Laravel app container starting...
→ Running migrations... done
→ Environment ready at http://localhost
```

### Example 2: Feature Branch Preview Environment
```
PR #42 opened → CI triggers provisioning
  → Clone repo at PR branch
  → Provision Docker Compose services
  → Run migrations with test data
  → Register in service catalog
  → Post preview URL: https://pr-42.dev.myorg.com
  → Auto-destroy on PR merge/close (48h TTL max)
```

### Example 3: Template YAML
```yaml
name: laravel-api-service
php_version: "8.3"
laravel_version: "^11"
services:
  database:
    type: mysql
    version: "8.0"
  cache:
    type: redis
    version: "7"
  queue:
    type: redis
    version: "7"
  mail:
    type: mailpit
post_provision:
  - php artisan key:generate
  - php artisan storage:link
  - php artisan migrate --seed
```

## Related Topics

- **forge-based-internal-platforms:** Forge API as provisioning backend
- **laravel-sail:** Docker-based local environment management
- **devcontainer-configuration:** VS Code devcontainer setup
- **github-actions-for-laravel:** CI/CD pipeline integration
- **idp-architecture-patterns:** IDP architecture context

## AI Agent Notes

- **Context Requirements:** When advising on environment provisioning, first understand the team's current setup process, existing Docker/Forge usage, and specific service requirements. The solution depends heavily on team size and infrastructure preferences.
- **Key Decision Points:** The critical choices are: (1) local vs remote provisioning, (2) Docker Compose vs Forge vs K8s, (3) fresh seeds vs snapshots, (4) TTL policies. Each choice balances speed, parity, and cost.
- **Common Pitfalls in AI Assist:** Avoid recommending Kubernetes for small teams. Don't suggest complex provisioning systems when Sail is sufficient. Always emphasize the destroy workflow alongside the create workflow.
- **Laravel-Specific Nuances:** Sail is the most common local provisioning tool in the Laravel ecosystem. Forge API is the most common remote provisioning backend. The combination covers most use cases without custom infrastructure.

## Verification

- [ ] KU accurately defines self-service environment provisioning
- [ ] Core concepts cover parity, disposability, bootstrapping
- [ ] When To Use / When NOT To Use is clear
- [ ] Best practices emphasize idempotency and cleanup
- [ ] Architecture guidelines cover targets, templates, and quotas
- [ ] Performance targets are quantified
- [ ] Security addresses secrets, isolation, and cleanup
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns are distinct
- [ ] Examples show local dev, preview envs, and template YAML
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
