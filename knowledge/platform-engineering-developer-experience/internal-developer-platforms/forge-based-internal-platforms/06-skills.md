# Skill: Build a Forge-Based Self-Service Provisioning Platform

## Purpose
Create an automated provisioning system using Laravel Forge API as the infrastructure backend, enabling developers to self-serve server creation, site deployment, and environment management without SSH access.

## When To Use
- Organization uses Laravel Forge and wants self-service environment creation
- Team needs repeatable, version-controlled server provisioning
- You want to provide self-service without exposing SSH access
- Team of 10-50 developers with multiple Laravel applications on VPS infrastructure

## When NOT To Use
- Organization uses Kubernetes or serverless infrastructure
- Fewer than 10 servers managed — Forge UI is sufficient
- No Forge subscription budget ($12/server/month minimum)

## Prerequisites
- Laravel Forge account with API token
- Git repository for storing recipes
- CI/CD platform (GitHub Actions) for orchestration
- Abstraction layer interface (`ProvisioningProvider`)

## Inputs
- Forge API token with minimum required scopes
- Server provider credentials (DigitalOcean, Linode, AWS, etc.)
- Recipe scripts defining desired server state
- Application repository with deployment script

## Workflow (numbered)
1. **Set up recipe repository** — Create version-controlled repository for Forge recipes; each recipe is a bash script defining server state
2. **Define environment templates** — Each template = Forge recipe + deployment script + daemon configuration; parameterize app name, domain, PHP version
3. **Build abstraction layer** — Implement `ProvisioningProvider` interface with `ForgeAdapter` implementation; prevents vendor lock-in
4. **Implement provisioning flow** — Platform action → Forge API (create server, install recipe, create site, configure daemon) → webhook notifies CI → CI validates → portal shows ready
5. **Set up zero-downtime deploy** — maintenance mode on → git pull → composer install → migrate → queue:restart → maintenance mode off
6. **Store deployment scripts in app repos** — Reference from Forge configuration; never store only in Forge UI
7. **Test recipes in isolation** — CI validates recipes on dev Forge servers before production application
8. **Establish server lifecycle** — Implement deprovisioning workflow; TTL-based cleanup; pre-warm server pools for instant provisioning

## Validation Checklist
- [ ] All recipes are version-controlled and CI-tested
- [ ] Deployment scripts live in application repositories, not only in Forge UI
- [ ] Provisioning is fully automated from trigger to environment ready
- [ ] Zero-downtime deploy flow implemented
- [ ] API tokens use minimum required scopes; rotated quarterly
- [ ] No credentials in deployment scripts or recipes
- [ ] Servers can be deprovisioned automatically
- [ ] Provisioning completes within 5-15 minutes (near-instant with pre-warming)

## Common Failures
- **Storing deployment scripts only in Forge UI** — no version history, no audit trail
- **Hardcoding credentials in recipes** — exposed in Forge UI, recipe repo, server logs
- **Not testing recipes before production** — server misconfiguration, downtime
- **Over-provisioning daemons** — wasted resources; right-size based on queue throughput

## Decision Points
- Recipe management: UI vs version-controlled (always version-controlled)
- Provisioning flow: sync vs async (async with progress polling for long operations)
- Abstraction layer depth: thin wrap vs comprehensive interface (thin for Laravel-only; comprehensive for multi-backend)
- Pre-warm vs on-demand: pre-warm for speed; on-demand for cost optimization

## Performance/Security Considerations
- Server provisioning: 5-15 minutes; API operations: 1-30 seconds; deployments: 30-90 seconds
- Forge API rate limit ~60 req/min; batch via queue to prevent throttling
- Dedicated API tokens per service with IP restriction where possible
- No plaintext credentials in scripts; use Forge environment variables
- Restrict SSH access; all management goes through Forge API
- Supplement Forge monitoring with external tools for disk, memory, response time

## Related Rules (from 05-rules.md)
- FORGE-RULE-001: Forge as provisioning backend
- FORGE-RULE-002: Version-control recipes
- FORGE-RULE-003: Abstraction layer
- FORGE-RULE-004: Deployment scripts in app repos
- FORGE-RULE-009: Test recipes before production
- FORGE-RULE-012: Dedicated API tokens per service

## Related Skills
- Architect IDP Patterns for Laravel Teams
- Implement Self-Service Environment Provisioning
- Set Up Automated Deployment Pipelines

## Success Criteria
- Developers can provision a staging environment in under 5 minutes via self-service
- All infrastructure is defined as version-controlled code
- Zero credential exposure incidents
- Server lifecycle is managed automatically (provision + deprovision)
- Forge API token rotation happens quarterly without service disruption

---

# Skill: Manage Forge Recipe Lifecycle and Testing

## Purpose
Establish a rigorous recipe development, testing, and promotion pipeline for Forge infrastructure recipes, ensuring server configurations are reliable, auditable, and production-safe.

## When To Use
- Multiple Forge recipes in use across different application types
- Team needs to promote recipes through dev → staging → production environments
- Compliance requirements mandate infrastructure change control

## When NOT To Use
- Single recipe for all servers; simple environment
- No dedicated platform engineering resources

## Prerequisites
- Recipe repository with CI pipeline
- Isolated dev Forge servers for testing
- Recipe versioning strategy (tags, branches)

## Inputs
- Recipe scripts (bash)
- Target environment specifications (PHP version, extensions, services)
- Compliance and security requirements

## Workflow (numbered)
1. **Develop recipe** — Write bash script defining server state: PHP version, extensions, nginx config, security tools, monitoring
2. **Test in isolation** — Apply recipe to dev Forge server; CI validates expected state (services running, ports open, security config)
3. **Version tag** — Tag recipe with semantic version; record changelog
4. **Promote to staging** — Apply recipe to staging server; run integration tests
5. **Promote to production** — Apply to production with canary strategy; monitor for regressions
6. **Audit and review** — Code review all recipe changes; maintain change log

## Validation Checklist
- [ ] Recipe tested on isolated dev server before any promotion
- [ ] CI validates recipe produces expected server state
- [ ] Version tags match semantic versioning; changelog maintained
- [ ] Promotion requires passing CI + code review
- [ ] Rollback plan exists for each promotion step

## Common Failures
- **Golden recipe** — one recipe for all app types; maintain specialized recipes per app type
- **Manual tweak** — SSH-ing to "fix one thing" diverges from recipe; never manually modify Forge-managed servers
- **Abandoned servers** — provisioned but never deprovisioned; implement lifecycle management

## Decision Points
- Recipe granularity: per-application vs per-application-type (per-type is maintainable, per-app is too granular)
- Testing depth: basic validation vs full integration (full for production recipes; basic for experimental)

## Performance/Security Considerations
- Test recipes in isolated networks to avoid production impact
- Recipe run as root; validate they don't expose ports, disable firewalls, or create insecure configs
- Pre-bake common service combinations into images to reduce provisioning time

## Related Rules (from 05-rules.md)
- FORGE-RULE-002: Version-control recipes
- FORGE-RULE-007: Recipe versioning
- FORGE-RULE-009: Test recipes before production
- FORGE-RULE-024: Avoid the Manual Tweak
- FORGE-RULE-025: Avoid the Golden Recipe

## Related Skills
- Build a Forge-Based Self-Service Provisioning Platform
- Architect IDP Patterns for Laravel Teams

## Success Criteria
- Every recipe change passes CI before production promotion
- Recipe promotion through dev → staging → prod takes < 1 hour
- Zero incidents from untested recipe changes
- All servers match their recipe-defined state (drift detection in place)
