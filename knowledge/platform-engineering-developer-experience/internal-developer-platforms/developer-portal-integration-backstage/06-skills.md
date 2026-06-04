# Skill: Integrate Backstage as a Developer Portal for Laravel

## Purpose
Deploy and configure Backstage as a unified developer portal for Laravel organizations, providing service catalog, documentation (TechDocs), and self-service scaffolding.

## When To Use
- Organization has 20+ Laravel services needing centralized discovery
- Teams struggle to find service ownership, documentation, or health information
- Organization wants self-service project scaffolding with standards enforcement
- Multiple technology stacks exist beyond just Laravel

## When NOT To Use
- Team under 20 developers — simpler CLI or README-based discovery is sufficient
- Laravel-only organization — custom dashboard may be simpler than Backstage
- No dedicated platform engineering resources to maintain Backstage

## Prerequisites
- Kubernetes cluster or hosting infrastructure for Backstage
- PostgreSQL database
- Organization identity provider (GitHub OAuth, Okta, Azure AD)
- Git provider with repository access

## Inputs
- List of all Laravel services with metadata
- Existing project templates/skeletons
- Documentation repositories with Markdown
- CI/CD platform integration details

## Workflow (numbered)
1. **Set up Backstage instance** — Deploy Backstage (self-hosted on K8s or managed via Roadie/Kion) with PostgreSQL; configure authentication via org IdP
2. **Register services in catalog** — Add `catalog-info.yaml` to every Laravel repository; auto-discover via Git provider integration
3. **Configure TechDocs** — Set up CI pipeline converting `/docs` Markdown to Backstage-compatible HTML; use mkdocs-material
4. **Build Scaffolder templates** — Create parameterized templates for Laravel project creation: project name, PHP version, starter kit, database type
5. **Integrate Forge API (custom plugin)** — Build plugin for scaffolder actions that trigger Forge server provisioning (no official Laravel plugin exists)
6. **Establish RBAC** — Define permissions for scaffolder actions, health views, deployment triggers
7. **Set upgrade cadence** — Backstage releases weekly; establish regular upgrade schedule; minimize UI customization

## Validation Checklist
- [ ] All Laravel services registered in catalog with `catalog-info.yaml`
- [ ] TechDocs renders documentation from at least 3 services
- [ ] Scaffolder templates create working Laravel projects with CI and Forge configuration
- [ ] Authentication integrated with org IdP (SSO)
- [ ] RBAC scopes scaffolder and deployment actions by role
- [ ] Upgrade process documented; staging instance tests upgrades before production

## Common Failures
- **Empty portal** — deployed with no catalog data, scaffolder templates, or plugins
- **Under-documented catalog** — services registered but metadata goes stale quickly
- **Over-customizing UI** — heavy modifications break on Backstage upgrades
- **Template decay** — scaffolder templates reference outdated Laravel versions
- **Custom plugin graveyard** — many custom plugins that break on each upgrade

## Decision Points
- Self-host vs managed: self-host for deep customization; managed (Roadie/Kion) for lower ops burden
- Scaffolder-first vs Catalog-first: scaffolder for immediate productivity; catalog for discovery value
- Plugin depth: thin (pass-through to existing tools) vs deep (custom workflows)
- Adoption strategy: big bang (all at once) vs incremental (Scaffolder first, then catalog, then TechDocs)

## Performance/Security Considerations
- Backstage handles thousands of entities; performance issues arise from slow plugin backends, not Backstage
- TechDocs build time for large docs (> 100 pages) can take 5+ minutes; use incremental builds
- Scaffolder rendering target: under 2 seconds; long-running actions run asynchronously
- OAuth2/OIDC/SAML SSO required for all portal access
- Vet third-party plugins; they run in the same process space as Backstage
- Scaffolder secrets via Backstage secrets management, not hardcoded

## Related Rules (from 05-rules.md)
- BACKSTAGE-RULE-001: Scaffolder first
- BACKSTAGE-RULE-002: catalog-info.yaml in every repo
- BACKSTAGE-RULE-003: TechDocs for documentation
- BACKSTAGE-RULE-008: Upgrade cadence
- BACKSTAGE-RULE-018: 20+ Laravel services to justify Backstage
- BACKSTAGE-RULE-021: Avoid the Empty Portal

## Related Skills
- Architect IDP Patterns for Laravel Teams
- Implement Service Catalog Patterns for Laravel
- Build a Forge-Based Self-Service Provisioning Platform

## Success Criteria
- Backstage launched with catalog covering 100% of Laravel services
- 3+ Scaffolder templates actively used for new project creation
- TechDocs rendering documentation for all production services
- Developer survey shows improved service discovery satisfaction
- Backstage upgrades completed within 2 weeks of each release without custom plugin breakage

---

# Skill: Build a Laravel-Specific Backstage Scaffolder Template

## Purpose
Create Backstage scaffolder templates that generate fully configured Laravel projects with organizational standards, CI/CD pipelines, and Forge provisioning baked in.

## When To Use
- Backstage is deployed and Scaffolder is the primary self-service mechanism
- Organization needs standardized Laravel project creation with org-specific tooling
- Multiple teams create Laravel projects and need consistent starting points

## When NOT To Use
- Backstage is not yet deployed
- Simple `composer create-project` meets all project creation needs

## Prerequisites
- Backstage instance running with Scaffolder enabled
- Laravel skeleton repository with org-specific configuration
- Forge API access for server provisioning step
- GitHub/GitLab integration configured

## Inputs
- Laravel skeleton template files (parameterized with placeholders)
- Forge API token for provisioning actions
- CI/CD workflow templates
- Service catalog metadata template

## Workflow (numbered)
1. **Design template parameters** — Project name, PHP version (8.2, 8.3), starter kit (none/Breeze/Jetstream), database type (MySQL/PostgreSQL/SQLite), include CI
2. **Create skeleton repository** — Parameterized Laravel project: `pint.json`, `phpstan.neon`, `docker-compose.yml`, `.github/workflows/ci.yml`, docs template
3. **Implement scaffolder steps** — `github:repo:create` → `fetch:template` → custom Forge action → `catalog:register`
4. **Build Forge action plugin** — Custom Backstage action that creates Forge server, installs recipe, creates site, deploys
5. **Test template end-to-end** — Run scaffolder, verify generated project boots, CI passes, Forge server is provisioned
6. **Document template** — Include description, parameter guidance, and post-scaffold steps in template metadata

## Validation Checklist
- [ ] Scaffolder template creates a working Laravel project
- [ ] Parameters have sensible defaults and validation
- [ ] Project includes pint.json, phpstan.neon, CI workflow, docker-compose
- [ ] Forge server is provisioned automatically (if selected)
- [ ] Service catalog is updated with new service entry
- [ ] Generated project boots and passes all quality checks
- [ ] Template is versioned and CI-tested against latest Laravel stable

## Common Failures
- **Template decay** — references outdated Laravel versions; CI-test templates on schedule
- **Over-parameterization** — 20+ parameters causing decision paralysis; limit to 3-5 with defaults
- **Broken Forge integration** — Forge API changes break provisioning steps; test regularly
- **Missing post-scaffold guidance** — developer gets a project but doesn't know what to do next

## Decision Points
- Parameter count: more parameters = flexibility; fewer = adoption speed
- Forge integration depth: full provisioning vs just creating Forge site on existing server
- Template testing: CI for skeleton repo vs CI that runs full scaffolder (latter is more thorough)

## Performance/Security Considerations
- Template rendering should complete in under 2 seconds
- Scaffolder actions that call Forge API are async; provide progress updates
- Scaffolder uses Backstage secrets for API tokens, not hardcoded credentials
- Generated projects must have secure defaults (no exposed credentials)
- Template repository access should be restricted to platform engineering team

## Related Rules (from 05-rules.md)
- BACKSTAGE-RULE-001: Scaffolder first
- BACKSTAGE-RULE-009: Scaffolder templates must be parameterized
- BACKSTAGE-RULE-017: Scaffolder rendering under 2s
- TEMPLATE-RULE-001: Limit to 3-5 templates

## Related Skills
- Integrate Backstage as a Developer Portal for Laravel
- Build Internal Template Registries for Laravel
- Build a Forge-Based Self-Service Provisioning Platform

## Success Criteria
- Scaffolder template generates a complete Laravel project with CI in under 3 minutes
- 80% of new Laravel projects in the org use the scaffolder template
- Template is updated within 2 weeks of Laravel version releases
- Zero post-scaffold manual setup steps required
