# Rules: Internal Template Registries (Laravel Project Templates)

## Metadata
- **Source KU:** internal-template-registries
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Internal Developer Platforms
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- TEMPLATE-RULE-001: **Limit to 3-5 templates** — Each template requires ongoing maintenance. A focused catalog of standard API, monolith, package, and queue worker templates covers 80% of use cases.
- TEMPLATE-RULE-002: **Parameterize, don't hardcode** — Use placeholders for all organization-specific values. Parameterized templates are reusable across teams and environments.
- TEMPLATE-RULE-003: **Template as a contract** — Each template encodes organizational standards and guarantees a minimum baseline of tooling, security, and quality practices.
- TEMPLATE-RULE-004: **Version templates independently** — Templates evolve independently of generated projects. Version in generated project metadata enables upgrade tracking.

## Architecture Rules
- TEMPLATE-RULE-005: **Template format** — Directory trees with placeholder files. Blade syntax for parameter substitution. Post-generation scripts as Artisan commands.
- TEMPLATE-RULE-006: **Distribution** — Composer packages for parameterized templates (supports post-generation hooks). GitHub template repos for simple skeletons.
- TEMPLATE-RULE-007: **Registry catalog** — Maintain `template.yaml` per template with name, description, Laravel version compatibility, PHP requirements, parameters, and dependencies.
- TEMPLATE-RULE-008: **Deprecation policy** — Block new project generation from retired templates. Notify existing projects with migration guidance.

## Implementation Rules
- TEMPLATE-RULE-009: **Test all templates in CI** — CI must: create project from template → run composer install → execute all quality tools → run test suite → verify app boots.
- TEMPLATE-RULE-010: **Capture post-generation fixes** — When developers consistently add the same manual fixes after generation, incorporate those fixes into the template.
- TEMPLATE-RULE-011: **Include post-generation guidance** — Generated project includes README with setup instructions, dev workflow docs, and first-commit guidance.

## Security Rules
- TEMPLATE-RULE-012: **No secrets in templates** — Never include API keys, tokens, or passwords. Use environment variables and secret management.
- TEMPLATE-RULE-013: **Template auditing** — All template changes go through code review. CI validates templates produce working projects.
- TEMPLATE-RULE-014: **Dependency scanning** — Regularly scan template composer.json for vulnerable dependencies. Update when CVEs affect included packages.
- TEMPLATE-RULE-015: **Supply chain security** — Sign template releases. Verify template integrity before distribution.

## Performance Rules
- TEMPLATE-RULE-016: **Template rendering under 2 seconds** — Pre-compile templates where possible.
- TEMPLATE-RULE-017: **Optimize dependency installation** — The bottleneck is composer install + npm install. Use Composer cache and pre-populated vendor dirs.

## Decision Rules
- TEMPLATE-RULE-018: **3+ Laravel apps** justifies template registries. Single app doesn't need it.
- TEMPLATE-RULE-019: **Use templates** when new project setup takes > 30 minutes to configure manually.

## Anti-Pattern Rules
- TEMPLATE-RULE-020: **Avoid the Monolith Template** — One massive template for all project types. Split into focused templates.
- TEMPLATE-RULE-021: **Avoid the Frozen Template** — Template not updated in 12+ months generates projects with outdated practices. Update quarterly minimum.
- TEMPLATE-RULE-022: **Avoid the Empty Template** — Must include meaningful architectural decisions, not just config files.
- TEMPLATE-RULE-023: **Avoid Over-Parameterization** — Limit to 3-5 essential choices with sensible defaults. 20+ parameters cause decision paralysis.

## AI Guidance Rules
- TEMPLATE-RULE-024: Before designing templates, determine the number of Laravel apps, current project creation process, and specific standards to encode.
- TEMPLATE-RULE-025: Spatie's package skeleton is the reference implementation for Laravel package templates. Composer create-project is the natural distribution mechanism.
