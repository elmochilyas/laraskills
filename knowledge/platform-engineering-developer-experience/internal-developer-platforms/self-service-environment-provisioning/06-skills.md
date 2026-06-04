# Skill: Implement Self-Service Environment Provisioning for Laravel

## Purpose
Enable Laravel developers to create fully configured development, staging, and testing environments on demand without platform team intervention, using automated provisioning that completes within 2-5 minutes.

## When To Use
- Developers spend > 30 minutes setting up local environments
- Team frequently needs temporary environments for feature branches or PR reviews
- Multiple Laravel applications with different service requirements
- CI testing against production-like environments is needed

## When NOT To Use
- Single application with simple requirements (SQLite, no queue)
- Team under 5 developers — ad-hoc management is acceptable
- Requirements change too frequently for template-based provisioning

## Prerequisites
- Docker/Sail for local provisioning
- Forge API or equivalent for remote provisioning
- Version-controlled environment templates (YAML)
- CI/CD platform for orchestration

## Inputs
- Environment template definitions (services, PHP version, post-provision scripts)
- Provisioning targets (local Docker, Forge/VPS, K8s)
- Data seeding profiles (schema-only, dummy data, anonymized production subset)

## Workflow (numbered)
1. **Define environment templates** — YAML files declaring services (database, cache, queue, mail, search), PHP version, and post-provision scripts
2. **Implement create workflow** — Scaffold project → configure services (Docker Compose) → run migrations → seed data → health check → report URL
3. **Implement destroy workflow** — Every create must have destroy; implement TTL-based auto-cleanup (48h feature branches, 30d staging max)
4. **Ensure idempotency** — All scripts safe to re-run; use `CREATE TABLE IF NOT EXISTS`, `migrate --force`, check-before-create patterns
5. **Optimize caching** — Pre-pull Docker images, cache Composer dependencies, pre-build common service combinations
6. **Establish parity** — Same database version, queue driver, service topology across all environments
7. **Set resource quotas** — Per-team and per-user limits on concurrent environments; queue when at capacity
8. **Implement health verification** — Each provisioning step validates success; final step pings app health endpoint

## Validation Checklist
- [ ] Local provisioning: app + DB in < 60 seconds; full-service in < 3 minutes
- [ ] Remote provisioning: staging in < 5 minutes; preview in < 10 minutes
- [ ] Destroy workflow exists for every create workflow
- [ ] TTL-based auto-cleanup configured
- [ ] Environment parity: same service versions across dev/staging/production
- [ ] Idempotent provisioning — re-running is safe
- [ ] Credentials generated per environment; destroyed with environment
- [ ] Network isolation from production

## Common Failures
- **Incomplete parity** — different DB versions/queue drivers between environments causing production-only bugs
- **No automated teardown** — orphaned environments accumulate costs and security risks
- **Hardcoded credentials** — secrets baked into template files
- **One template for everything** — same service topology for API, monolith, queue worker

## Decision Points
- Local vs remote provisioning: local Docker for dev; Forge/VPS for staging; K8s for preview
- Docker Compose vs Forge vs K8s: match infrastructure to environment purpose
- Fresh seeds vs snapshots: fresh seeds for consistency; snapshots for speed
- TTL policies: 48h for feature branches, 30d for staging, no max for production

## Performance/Security Considerations
- Provisioning targets: local < 60s (app+DB), < 3min (full); remote staging < 5min; preview < 10min
- Pre-pull Docker images (mysql, redis, meilisearch, minio) into warm pool
- Large seeders > 10s use chunked seeding with progress reporting
- Never bake credentials into templates; inject via environment variables at provision time
- Environments isolated from production networks
- Per-environment credentials, destroyed with the environment
- All provisioning actions logged with actor, environment, timestamp

## Related Rules (from 05-rules.md)
- PROV-RULE-001: Idempotent provisioning
- PROV-RULE-002: Cattle, not pets
- PROV-RULE-003: Implement destroy with create
- PROV-RULE-004: Parity over speed
- PROV-RULE-005: Cache everything
- PROV-RULE-015: No secrets in templates

## Related Skills
- Build a Forge-Based Self-Service Provisioning Platform
- Configure Laravel Sail for Local Development
- Set Up GitHub Actions for Laravel CI/CD

## Success Criteria
- Developers can create a full environment in < 3 minutes (local) or < 5 minutes (remote)
- Zero environment-related parity bugs reported
- All environments have TTL-based auto-cleanup; zero orphaned environments
- Per-environment credentials; zero shared credential incidents

---

# Skill: Set Up Preview Environments for Laravel PR Workflows

## Purpose
Automatically provision ephemeral preview environments for each pull request, enabling reviewers to test changes in a production-like environment before merging.

## When To Use
- PR review process benefits from live environment testing
- Team frequently catches environment-specific bugs in code review
- Organization wants to test migrations and data changes before production deployment

## When NOT To Use
- Simple applications where local testing is sufficient
- Preview environment provisioning takes longer than 10 minutes

## Prerequisites
- Self-service environment provisioning infrastructure
- CI/CD platform integrated with PR system
- Container registry for application images
- Environment template definitions

## Inputs
- PR branch and commit SHA
- Environment template YAML
- Database seeding profile

## Workflow (numbered)
1. **Trigger on PR open** — CI detects PR open/sync event; starts provisioning workflow
2. **Clone and build** — Checkout PR branch; build application Docker image
3. **Provision environment** — Create isolated environment (Docker Compose or K8s) with all services
4. **Run migrations** — Apply latest migrations with test data seed
5. **Health check** — Verify application boots and passes smoke tests
6. **Post URL to PR** — Comment preview URL on PR: `https://pr-42.dev.myorg.com`
7. **Auto-destroy on merge/close** — PR merge or close triggers environment destruction; 48h TTL maximum as safety net

## Validation Checklist
- [ ] Preview environment provisions on PR open/sync
- [ ] Environment URL posted to PR as comment
- [ ] App boots and passes smoke tests before URL is posted
- [ ] Auto-destroy on PR merge/close
- [ ] Max TTL configured (48h)
- [ ] Network isolation from production and other preview environments

## Common Failures
- **Slow provisioning** — > 10 minute waits discourage use; optimize caching and parallel provisioning
- **No cleanup** — orphaned preview environments accumulate; TTL is essential safety net
- **Data inconsistency** — stale seed data or incompatible schema; use fresh migrations

## Decision Points
- Trigger strategy: every commit vs only on ready-for-review
- Database strategy: fresh seed vs snapshot with migration
- TTL: 48h for feature branches, shorter for draft PRs

## Performance/Security Considerations
- Provisioning target: under 10 minutes; optimize Docker image build and caching
- Preview environments isolated from production network
- No production data in preview environments
- Auto-destroy prevents resource exhaustion and security surface growth

## Related Rules (from 05-rules.md)
- PROV-RULE-003: Implement destroy with create
- PROV-RULE-006: Provisioning target selection
- PROV-RULE-017: TTL-based auto-cleanup
- PROV-RULE-027: Avoid the Ticket-Backed Platform

## Related Skills
- Implement Self-Service Environment Provisioning for Laravel
- Set Up GitHub Actions for Laravel CI/CD
- Configure Docker Compose for Laravel

## Success Criteria
- Preview environment provisioned and URL posted within 10 minutes of PR open
- Zero orphaned preview environments
- Developers report improved PR review confidence with live environments
- Preview environment costs are tracked and within budget
