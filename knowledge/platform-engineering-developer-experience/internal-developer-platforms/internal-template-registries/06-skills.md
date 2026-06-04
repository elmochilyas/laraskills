# Skill: Build Internal Template Registries for Laravel Projects

## Purpose
Create and maintain a curated collection of Laravel project skeletons that encode organizational standards — PHP version, code style, static analysis, CI/CD, Docker Compose services — ensuring every new project starts with compliant tooling.

## When To Use
- Organization has 3+ Laravel applications needing consistent initial configuration
- New project setup takes > 30 minutes to configure tooling manually
- Need to enforce organizational standards from project inception
- Multiple teams create Laravel projects

## When NOT To Use
- Single application with no plans for additional projects
- Organizational standards change too frequently for templates to stay current
- No resources to maintain templates regularly

## Prerequisites
- Laravel skeleton repository with org-specific configuration
- Composer package or GitHub template distribution mechanism
- CI pipeline for template testing
- Template catalog file (template.yaml per template)

## Inputs
- Organizational standards (PHP version, pint config, phpstan config, CI shape)
- Common service topologies (API, monolith, package, queue worker)
- Parameterization requirements (project name, PHP version, services)

## Workflow (numbered)
1. **Audit existing projects** — Identify common patterns across existing Laravel applications; extract shared configuration
2. **Design 3-5 templates** — Standard API, monolith, package library, queue worker; each with clear use case documentation
3. **Create skeleton** — Build directory tree with placeholder files using Blade syntax for parameters; include pint.json, phpstan.neon, CI workflow, docker-compose.yml
4. **Parameterize** — Use placeholders for all org-specific values; limit to 3-5 parameters with sensible defaults
5. **Set up distribution** — Composer package for parameterized templates (with post-generation hooks) or GitHub template repos for simple skeletons
6. **CI-test each template** — CI must: create project → composer install → run quality tools → run tests → verify app boots
7. **Capture post-generation feedback** — When developers consistently make the same manual fixes, incorporate them into the template
8. **Establish deprecation policy** — Block new generation from retired templates; notify existing projects with migration guidance

## Validation Checklist
- [ ] 3-5 templates maintained; no more
- [ ] Each template CI-tested on every change
- [ ] Templates parameterized with sensible defaults; no hardcoded values
- [ ] Template rendering completes in under 2 seconds
- [ ] Generated project includes README with setup instructions
- [ ] Template versioning in generated project metadata
- [ ] No secrets in templates; credentials via environment variables

## Common Failures
- **Too many templates** — high maintenance; limit to 3-5 actively used templates
- **Untested templates** — generated projects don't work; erodes developer trust
- **Outdated templates** — based on EOL Laravel versions; update within 2 weeks of Laravel releases
- **No post-generation guidance** — developers don't know what to do after project creation

## Decision Points
- Number of templates: 3-5 covers 80% of use cases; resist adding more
- Distribution method: Composer packages (parameterized, post-generation hooks) vs GitHub templates (simple skeletons)
- Template thickness: minimal (just config) vs opinionated (full architecture patterns)
- Parameterization depth: 3-5 parameters with defaults; avoid over-parameterization

## Performance/Security Considerations
- Template rendering target: under 2 seconds; pre-compile where possible
- Dependency installation is the bottleneck; use Composer caching
- Never include API keys, tokens, or passwords in templates
- All template changes go through code review
- Regularly scan template composer.json for vulnerable dependencies
- Sign template releases; verify integrity before distribution

## Related Rules (from 05-rules.md)
- TEMPLATE-RULE-001: Limit to 3-5 templates
- TEMPLATE-RULE-002: Parameterize, don't hardcode
- TEMPLATE-RULE-004: Version templates independently
- TEMPLATE-RULE-009: Test all templates in CI
- TEMPLATE-RULE-012: No secrets in templates

## Related Skills
- Design Golden Paths for Laravel Development
- Build a Forge-Based Self-Service Provisioning Platform
- Customize Laravel Stubs for Generated Code

## Success Criteria
- 3-5 actively maintained templates; each CI-tested and up-to-date with latest Laravel
- New project creation time reduced from > 30 minutes to < 2 minutes
- 80% of new projects start from a template
- Zero security incidents from credentials in templates
- Post-generation fixes captured and incorporated quarterly

---

# Skill: Implement Template Registry Distribution and Governance

## Purpose
Establish the distribution pipeline and governance model for internal Laravel project templates, ensuring templates are discoverable, versioned, and governed with clear ownership and deprecation policies.

## When To Use
- Multiple templates exist and need organized distribution
- Teams need to discover and select appropriate templates
- Template versions need tracking and lifecycle management

## When NOT To Use
- Single template; simple GitHub template repo is sufficient
- No multi-team distribution need

## Prerequisites
- Template catalog files (template.yaml per template)
- Distribution mechanism (Composer package registry or GitHub org)
- CI pipeline for template validation

## Inputs
- Template.yaml files with metadata (name, description, Laravel version, parameters)
- Distribution target (private Packagist, GitHub org)
- Team access requirements

## Workflow (numbered)
1. **Create template catalog** — Maintain `template.yaml` per template: name, description, Laravel version compatibility, PHP version requirements, parameters, dependencies
2. **Set up registry interface** — CLI tool (`my-org:new`) or Backstage scaffolder for template discovery and selection
3. **Establish versioning** — Version templates independently (semantic); track template version in generated project metadata
4. **Implement CI testing** — Every template change triggers CI: create project → run all quality tools → boot app
5. **Define governance** — Code review for all template changes; template owners assigned; quarterly update review
6. **Create deprecation workflow** — Announce deprecation → block new generation → notify existing projects → archive
7. **Monitor usage** — Track which templates are used, how often, and deviation patterns

## Validation Checklist
- [ ] Template.yaml exists for each template with complete metadata
- [ ] CLI or portal interface for template selection
- [ ] Version tracking in generated project metadata
- [ ] CI passes for every template change
- [ ] Deprecation policy documented and enforced
- [ ] Usage metrics collected and reviewed quarterly

## Common Failures
- **Frozen template** — not updated in 12+ months; establish quarterly minimum update frequency
- **Empty template** — only config files, no architectural decisions; include meaningful project structure
- **Over-parameterized template** — 20+ parameters causing decision paralysis; limit to 3-5
- **Monolith template** — one template for all project types; split into focused templates

## Decision Points
- Distribution: Composer (supports post-generation hooks) vs GitHub (simpler but less flexible)
- Versioning scheme: semver for templates; align major with Laravel major versions
- Catalog interface: CLI for developers, portal for discovery

## Performance/Security Considerations
- Template rendering under 2 seconds; pre-compile if needed
- Dependency installation optimization via Composer cache
- Template changes require code review; no direct pushes to template repos
- Supply chain security: sign releases, verify integrity

## Related Rules (from 05-rules.md)
- TEMPLATE-RULE-005: Template format (Blade syntax, Artisan post-generation)
- TEMPLATE-RULE-006: Distribution (Composer packages)
- TEMPLATE-RULE-007: Registry catalog (template.yaml)
- TEMPLATE-RULE-008: Deprecation policy
- TEMPLATE-RULE-013: Template auditing

## Related Skills
- Build Internal Template Registries for Laravel Projects
- Integrate Backstage as a Developer Portal for Laravel
- Design Golden Paths for Laravel Development

## Success Criteria
- Template catalog is discoverable via CLI or portal
- All templates CI-tested; zero untested template deployments
- Usage metrics drive quarterly template improvement
- Deprecated templates have migration guidance; zero orphaned template users
