# Experience Curation: Developer Portal Integration (Backstage)

## Metadata
- **KU ID:** internal-developer-platforms-idp/developer-portal-integration-backstage
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Emerging
- **Dependencies:** idp-architecture-patterns, service-catalog-patterns, golden-path-paved-road-patterns
- **Related Technologies:** Backstage.io, TechDocs, Scaffolder, Backstage Catalog, Kubernetes
- **Target Audience:** Platform engineers, DevOps engineers, Laravel team leads

## Overview

Backstage is Spotify's open-source developer portal platform that provides a unified UI for service catalogs, documentation, CI/CD pipelines, and self-service actions. Integrating Backstage into a Laravel ecosystem enables teams to discover Laravel services, view API documentation, trigger scaffolding of new Laravel projects, and monitor deployment health—all from a single interface. The integration typically involves building a Backstage plugin that understands Laravel's project structure, artisan commands, and ecosystem tools (Forge, Sail, Telescope). As of 2025, Backstage-Laravel integration is nascent with no official plugin, making this a high-impact gap to fill. The Scaffolder is the most valuable component for Laravel organizations.

## Core Concepts

- **Backstage Software Catalog:** Central registry of all software components with metadata including owner, lifecycle status, dependencies, and API definitions
- **Backstage Scaffolder:** Self-service action engine that creates new projects or triggers workflows using customizable templates
- **TechDocs:** Documentation system rendering Markdown files into a searchable, versioned documentation portal
- **Backstage Plugins:** Extensions adding functionality via React frontend + optional backend; interact with external systems
- **Backstage Entities:** Consistent data model (Component, API, Resource, System, Domain) representing all software artifacts
- **catalog-info.yaml:** YAML file in each repository declaring entity metadata

## When To Use

- Organization has 20+ Laravel services and needs a centralized discovery mechanism
- Teams struggle to find service ownership, documentation, or health information
- Organization wants self-service project scaffolding with organizational standards
- Multiple technology stacks exist and a unified developer portal is needed
- Platform team has resources to set up and maintain Backstage infrastructure

## When NOT To Use

- Team under 20 developers—a simpler CLI tool or README-based discovery is sufficient
- Laravel-only organization—dedicated custom dashboard is simpler than Backstage
- No dedicated platform engineering team to maintain Backstage
- Organization isn't ready to invest in the catalog metadata discipline required
- Developers prefer and are productive with existing tools (GitHub, CLI)

## Best Practices (WHY)

1. **Start with Scaffolder, Not Custom Plugins (Why):** The Scaffolder is Backstage's highest-value feature for developer productivity. Build well-designed scaffolding templates before investing in custom dashboards or plugins. Templates immediately improve developer experience by standardizing project creation.

2. **catalog-info.yaml in Every Repository (Why):** The service catalog is only useful if it's complete and current. Make catalog registration part of the project creation workflow, not an afterthought. Auto-generate the YAML with sensible defaults and require explicit updates for owner and lifecycle changes.

3. **Use TechDocs for Documentation (Why):** TechDocs is the lowest-effort, highest-value Backstage feature for Laravel teams. Store architectural decision records, API documentation, onboarding guides, and runbooks as Markdown in the Laravel repository. TechDocs renders them with search functionality.

4. **Integrate into Existing Workflows (Why):** Don't require developers to come to Backstage. Integrate Backstage information into PR status checks, deployment notifications, and CLI tools. The portal adds the most value when it surfaces information where developers already work.

5. **Plan for Upgrade Cadence (Why):** Backstage releases new versions frequently (weekly). Establish a regular upgrade cadence and test plugin compatibility in a staging instance. Heavy UI customization makes upgrades painful—use Backstage's composability but avoid modifying core components.

## Architecture Guidelines

- **Deployment Model:** Self-host Backstage for customization (Kubernetes cluster, PostgreSQL). Use managed services (Roadie, Kion) for lower operational burden.
- **Plugin Architecture:** Frontend-only plugins for dashboards and displays. Full plugins (frontend + backend) for scaffolder actions and external system integration.
- **Catalog Registration:** Auto-discovery via Git provider for existing repositories. Manual YAML for fine-grained control. CI auto-registration for new services.
- **Scaffolder Templates:** Parameterize project name, PHP version, starter kit, database type, services. Actions: create repo from skeleton, configure Forge server, set up CI, register in catalog.
- **TechDocs Build:** CI pipeline converts /docs folder Markdown to Backstage-compatible HTML. Use mkdocs-material for optimization.
- **Authentication:** Integrate with organization's identity provider (GitHub OAuth, Okta, Azure AD) for single sign-on. RBAC for scaffolder and deployment actions.

## Performance

- **Catalog Scale:** Backstage handles thousands of entities. Performance issues typically arise from plugin backends making slow external API calls, not Backstage itself.
- **TechDocs Build Time:** Large documentation sets (> 100 pages) can take 5+ minutes. Use incremental builds and mkdocs-material optimization.
- **Plugin Response Time:** Backend plugins calling Forge API should cache responses and use async patterns to avoid blocking the UI.
- **Scaffolder Execution:** Template rendering should complete in < 2 seconds. Long-running actions (server provisioning) run asynchronously with progress updates.

## Security

- **Authentication:** OAuth2/OIDC/SAML integration with organization IdP. Single sign-on required for all portal access.
- **Authorization (RBAC):** Define who can scaffold new projects, view production health, trigger deployments. Use Backstage's permission framework.
- **Plugin Security:** Backstage plugins run in the same process space. Vet third-party plugins for security. Isolate untrusted plugins in separate instances.
- **Secrets Management:** Scaffolder actions that call external APIs (Forge, GitHub, CI) use Backstage secrets, not hardcoded credentials.
- **Network Security:** Backstage instances run in isolated network segments. API calls to external systems go through authenticated, audited gateways.

## Common Mistakes

### Mistake 1: Under-Documenting the Catalog
- **Description:** Services registered in catalog with minimal metadata, quickly becomes stale
- **Cause:** No discipline around metadata maintenance, treating catalog as "set and forget"
- **Consequence:** Catalog becomes unreliable, developers stop trusting it, value is lost
- **Better:** Make catalog registration part of project creation. Automate CI checks for stale metadata. Quarterly ownership review cycles.

### Mistake 2: Building Before Understanding Needs
- **Description:** Platform team builds Backstage features based on assumptions
- **Cause:** Enthusiasm for the technology without developer research
- **Consequence:** Features don't get used, investment wasted, platform team credibility damaged
- **Better:** Survey developers about discovery and standardization pain points. Build features that address specific, measured needs.

### Mistake 3: Over-Customizing the UI
- **Description:** Heavy UI modifications to Backstage's default interface
- **Cause:** Desire for brand consistency or specific look-and-feel
- **Consequence:** Upgrade pain, breakage on Backstage version bumps, high maintenance
- **Better:** Use Backstage's composability features. Avoid modifying core components. Customize via plugins and theme configuration.

### Mistake 4: Ignoring Template Decay
- **Description:** Scaffolder templates reference deprecated Laravel versions or outdated packages
- **Cause:** No automated validation of templates
- **Consequence:** Generated projects start with outdated practices, need manual upgrades
- **Better:** CI/CD for template repositories that validate against latest Laravel stable release

## Anti-Patterns

- **The Empty Portal:** Backstage is deployed but has no catalog data, no scaffolder templates, and no plugins. Developers visit once and never return. Have meaningful content before launch.
- **The Mandatory Portal:** Requiring developers to use Backstage for all operations. If CLI or GitHub is faster, developers will bypass the portal. Make the portal valuable, not mandatory.
- **The Backstage Black Hole:** Portal that consumes data from services but never provides value back. Catalog data should enable actions (scaffolding, deployment, notifications), not just display.
- **The Custom Plugin Graveyard:** Building many custom plugins that break on each Backstage upgrade. Minimize custom plugin surface area. Use community plugins where possible.

## Examples

### Example 1: catalog-info.yaml for Laravel Service
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: billing-api
  description: Billing service for invoice processing
  tags:
    - laravel
    - api
    - php
  annotations:
    github.com/project-slug: myorg/billing-api
    backstage.io/techdocs-ref: dir:/docs
spec:
  type: service
  lifecycle: production
  owner: team-payments
  dependsOn:
    - Component:mysql-main
    - Component:redis-cache
    - Component:payment-gateway
  system: billing-system
```

### Example 2: Scaffolder Template for Laravel API
```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: laravel-api-service
  title: Laravel API Service
  description: Create a new Laravel API with Sail, Pest, CI
spec:
  parameters:
    - title: Project Details
      properties:
        projectName:
          type: string
          description: Name of the Laravel project
        phpVersion:
          type: string
          enum: ['8.2', '8.3']
          default: '8.3'
        includeBreeze:
          type: boolean
          default: true
  steps:
    - id: create-repo
      action: github:repo:create
    - id: scaffold
      action: fetch:template
    - id: configure-forge
      action: forge:server:setup
    - id: register-catalog
      action: catalog:register
```

## Related Topics

- **idp-architecture-patterns:** IDP architecture that Backstage integrates into
- **service-catalog-patterns:** Catalog data model and registration
- **golden-path-paved-road-patterns:** Scaffolder templates as golden path implementation
- **self-service-environment-provisioning:** Backstage as provisioning trigger
- **forge-based-internal-platforms:** Backstage plugin integration with Forge

## AI Agent Notes

- **Context Requirements:** When advising on Backstage integration, first understand the team size, number of Laravel services, existing tooling, and specific pain points around discovery and standardization. Backstage is a significant investment—ensure it's justified.
- **Key Decision Points:** The critical choices are: (1) self-hosted vs managed Backstage, (2) Scaffolder-first vs Catalog-first approach, (3) plugin depth (thin vs deep integration), (4) adoption strategy (big bang vs incremental). Each choice depends on organizational maturity and resources.
- **Common Pitfalls in AI Assist:** Avoid recommending Backstage for small teams. Don't suggest custom plugins when scaffolder templates suffice. Always emphasize catalog maintenance discipline. Remember that no official Laravel Backstage plugin exists—custom development is required for deep integration.
- **Laravel-Specific Nuances:** The absence of a community Laravel Backstage plugin is a significant gap. Forge API integration is the most valuable Backstage plugin for Laravel teams. TechDocs with Laravel's existing documentation patterns is the easiest entry point.

## Verification

- [ ] KU accurately defines Backstage integration for Laravel
- [ ] Core concepts cover catalog, scaffolder, TechDocs, plugins
- [ ] When To Use / When NOT To Use is clear with team size thresholds
- [ ] Best practices are actionable and justified
- [ ] Architecture guidelines cover deployment, plugins, catalog, templates
- [ ] Performance considerations address catalog scale and TechDocs
- [ ] Security covers auth, RBAC, plugins, secrets
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify empty portal and custom plugin graveyard
- [ ] Examples show real catalog YAML and scaffolder template
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes address Backstage-Laravel ecosystem gaps
