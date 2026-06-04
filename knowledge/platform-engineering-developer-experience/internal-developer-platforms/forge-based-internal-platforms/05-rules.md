# Rules: Forge-Based Internal Platform Patterns

## Metadata
- **Source KU:** forge-based-internal-platforms
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Internal Developer Platforms
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- FORGE-RULE-001: **Forge as provisioning backend** — Forge API is the de facto provisioning backend for Laravel IDPs. Most Laravel platform needs are met by composing Forge + GitHub Actions + Sail.
- FORGE-RULE-002: **Version-control recipes** — Store Forge recipes in a version-controlled repository with CI testing. Recipes are infrastructure code.
- FORGE-RULE-003: **Abstraction layer** — Wrap Forge API calls behind an interface (e.g., `ProvisioningProvider` interface with `ForgeAdapter`). Prevents vendor lock-in.
- FORGE-RULE-004: **Deployment scripts in app repos** — Maintain deployment scripts in the application repository, not only in Forge UI. Ties deployment logic to codebase version.

## Architecture Rules
- FORGE-RULE-005: **Environment template pattern** — Define reusable templates as Forge recipe + deployment script + daemon configuration. Parameterize app name, domain, PHP version.
- FORGE-RULE-006: **Zero-downtime deploy flow** — maintenance mode on → git pull → composer install → migrate → queue:restart → maintenance mode off.
- FORGE-RULE-007: **Recipe versioning** — Tag and promote recipes through environments (dev → staging → prod). CI tests each recipe.
- FORGE-RULE-008: **Multi-tenant isolation** — Separate Forge servers per client or team. Isolated daemons and database users prevent cross-tenant interference.

## Implementation Rules
- FORGE-RULE-009: **Test recipes before production** — Test in isolated dev Forge servers before applying to production. CI validates recipe output.
- FORGE-RULE-010: **Right-size daemons** — Configure daemon count based on actual queue throughput monitoring. Start conservative and scale up.
- FORGE-RULE-011: **Pre-warm server pools** — Maintain a pool of pre-configured Forge servers for near-instant provisioning.

## Security Rules
- FORGE-RULE-012: **Dedicated API tokens per service** — Use minimum required scopes. Rotate tokens quarterly. IP-restrict API access where possible.
- FORGE-RULE-013: **No credentials in deployment scripts** — Use Forge's environment variables and secret management. Scripts reference env vars, not plaintext secrets.
- FORGE-RULE-014: **Restrict SSH access** — All infrastructure management goes through Forge API. Use bastion hosts for emergency SSH access.
- FORGE-RULE-015: **Supplement Forge monitoring** — Add external monitoring for disk space, memory, response time, and security events.

## Performance Rules
- FORGE-RULE-016: **Server provisioning: 5-15 minutes** — Pre-warming reduces to near-instant.
- FORGE-RULE-017: **API operations: 1-30 seconds** — Design portals for async operation with progress polling.
- FORGE-RULE-018: **Deployment: 30-90 seconds** — Optimize with Composer lock caching and opcache preloading.
- FORGE-RULE-019: **Forge API rate limit: ~60 req/min** — Batch operations via queue to prevent throttling.

## Decision Rules
- FORGE-RULE-020: **Use Forge-based platform** for teams of 10-50 developers with multiple Laravel apps on VPS infrastructure.
- FORGE-RULE-021: **Do NOT use Forge** for Kubernetes-based or serverless infrastructure.
- FORGE-RULE-022: **< 10 servers** → Forge UI is sufficient; API abstraction not needed.

## Anti-Pattern Rules
- FORGE-RULE-023: **Avoid the Forge-SSH Hybrid** — All infrastructure goes through Forge or is migrated. No mixed management.
- FORGE-RULE-024: **Avoid the Manual Tweak** — SSH-ing to "fix one thing" diverges from recipe-defined state and will be overwritten.
- FORGE-RULE-025: **Avoid the Golden Recipe** — Different app types (API, queue worker, monolith) need different recipes.
- FORGE-RULE-026: **Avoid the Abandoned Server** — Implement server lifecycle management. Deprovision unused servers.
- FORGE-RULE-027: **Avoid the API Key on a Post-it** — Store Forge API tokens in a secrets manager with access controls.

## AI Guidance Rules
- FORGE-RULE-028: When advising on Forge-based platforms, first understand current Forge setup (servers, recipes, sites), team size, and specific automation needs.
- FORGE-RULE-029: Never recommend replacing Forge with custom infrastructure when Forge API already provides the capability.
