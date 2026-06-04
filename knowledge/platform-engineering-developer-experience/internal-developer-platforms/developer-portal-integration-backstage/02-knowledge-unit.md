# Knowledge Unit: Developer Portal Integration (Backstage)

## Metadata
- **Subdomain:** Internal Developer Platforms (IDP)
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** internal-developer-platforms-idp/developer-portal-integration-backstage
- **Maturity:** Emerging
- **Related Technologies:** Backstage.io, TechDocs, Scaffolder, Backstage Catalog, Kubernetes

## Executive Summary

Backstage is Spotify's open-source developer portal platform that provides a unified UI for service catalogs, documentation, CI/CD pipelines, and self-service actions. Integrating Backstage into a Laravel ecosystem enables teams to discover Laravel services, view API documentation, trigger scaffolding of new Laravel projects, and monitor deployment health—all from a single interface. The integration typically involves building a Backstage plugin that understands Laravel's project structure, artisan commands, and ecosystem tools (Forge, Sail, Telescope). As of 2025, Backstage-Laravel integration is nascent with no official plugin, making this a high-impact gap to fill.

## Core Concepts

- **Backstage Software Catalog:** Central registry of all software components (services, libraries, websites, pipelines) with metadata including owner, lifecycle status, dependencies, and API definitions
- **Backstage Scaffolder:** Self-service action engine that creates new projects, adds features to existing projects, or triggers workflows using customizable templates (written in JSON/YAML with Nunjucks templating)
- **TechDocs:** Documentation system that renders Markdown files (from repository) into a searchable, versioned documentation portal with a "docs-like-code" approach
- **Backstage Plugins:** Extensions that add functionality; each plugin is a React frontend + optional backend; plugins can interact with external systems (Forge API, GitHub, Jenkins)
- **Backstage Entities:** A consistent data model (Component, API, Resource, System, Domain, Group, User, Location) that represents all software artifacts

## Mental Models

- **Backstage as the Front Door:** Backstage is the single entry point for developers to interact with the platform—find services, read docs, create projects, view deployments
- **Catalog as Source of Truth:** The Backstage catalog is the authoritative registry of all Laravel services; if it's not in the catalog, it doesn't exist officially
- **Scaffolder as Golden Path Factory:** Scaffolder templates encode organizational best practices into reusable, standardized project creation flows
- **Plugin as Integration Bridge:** Each Backstage plugin bridges the developer portal to an external system (Forge API, GitHub, CI/CD, monitoring)

## Internal Mechanics

1. **Entity Registration:** Laravel services register in the Backstage catalog via `catalog-info.yaml` files in each repository. The file declares the component type, owner, dependencies, and lifecycle.
2. **Scaffolder Action Execution:** A developer clicks "Create new Laravel API service" → Scaffolder runs the template → Template may call Forge API to provision server → Create GitHub repo → Trigger CI pipeline → Return service URL.
3. **TechDocs Build Pipeline:** CI pipeline converts `/docs` folder Markdown to Backstage-compatible HTML; TechDocs indexes and serves it with search functionality.
4. **Plugin Data Flow:** External system → Backstage Plugin Backend → Backstage Plugin Frontend → UI Components. For a Laravel plugin: Forge API → Laravel plugin backend → plugin frontend → service health dashboard.

## Patterns

- **catalog-info.yaml in Every Repo:** Place a `catalog-info.yaml` at the root of every Laravel repository declaring: `apiVersion: backstage.io/v1alpha1`, `kind: Component`, `metadata.name`, `spec.type: service`, `spec.lifecycle: production`.
- **Laravel Scaffolder Template:** A Backstage template that parameterizes: project name, PHP version, starter kit (Breeze/Jetstream), database type, services (queue, mail, search), and team. Actions: create repo from skeleton, configure Forge server, set up CI, register in catalog.
- **TechDocs for Laravel:** Store architectural decision records (ADRs), API documentation, onboarding guides, and runbooks as Markdown in the Laravel repository under `/docs`; TechDocs renders them in Backstage.
- **Health Dashboard Plugin:** A Backstage plugin that queries Forge API + Laravel Pulse for each service and displays: deployment status, PHP version, queue health, recent errors, and last deploy timestamp.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Deployment model | Managed Backstage vs self-hosted | Self-hosted for customization; managed (Roadie, Kion) for lower ops burden |
| Plugin architecture | Frontend-only vs full plugin | Frontend-only for dashboards; full plugin for scaffolder actions |
| Catalog registration | Manual YAML vs auto-discovery via Git provider | Auto-discovery for existing repos; manual for fine-grained control |
| Laravel-LBackstage bridge | Custom plugin vs Backstage proxy vs API Gateway | Custom plugin for deep integration; proxy for simple read-only access |

## Tradeoffs

- **Backstage Complexity vs Value:** Backstage requires significant setup (Kubernetes cluster, PostgreSQL, authentication provider, CI integration). For Laravel teams under 20 developers, a simpler CLI or custom portal may provide better ROI.
- **Plugin Customization vs Maintenance:** Custom Laravel plugins provide perfect fit but require ongoing maintenance as Backstage version changes. Generic plugins reduce maintenance but may not understand Laravel-specific concepts (e.g., Artisan commands, Forge sites).
- **Catalog Centralization vs Autonomy:** A centralized catalog provides governance but requires discipline to keep metadata current. Git-based catalog YAML files distribute ownership but may become inconsistent.

## Performance Considerations

- **Catalog Scale:** Backstage catalog handles thousands of entities; performance issues typically arise from plugin backends making slow external API calls rather than Backstage itself.
- **TechDocs Build Time:** Large documentation sets (> 100 pages) can take 5+ minutes to build; use incremental builds and mkdocs-material optimization.
- **Plugin Response Time:** Plugin backends calling Forge API (or other external services) should cache responses and use async patterns to avoid blocking the Backstage UI.

## Production Considerations

- **Authentication Integration:** Backstage supports OAuth2, OIDC, SAML; integrate with the organization's identity provider (GitHub OAuth, Okta, Azure AD) for single sign-on.
- **Authorization (RBAC):** Define who can scaffold new projects, who can view production service health, and who can trigger deployments; Backstage's permission framework supports role-based access control.
- **Backstage Upgrades:** Backstage releases new versions frequently (weekly); establish a regular upgrade cadence and test plugin compatibility in a staging Backstage instance.
- **Plugin Security:** Backstage plugins run in the same process space; vet third-party plugins for security and resource usage; isolate untrusted plugins in separate Backstage instances.

## Common Mistakes

- **Over-customizing Backstage UI:** Heavy UI customization makes Backstage upgrades painful; use Backstage's composability but avoid modifying core components
- **Under-documenting the catalog:** A service catalog is only useful if it's complete and accurate; make catalog registration part of the project creation workflow
- **Building before understanding developer needs:** Backstage solves discovery and standardization problems; if those aren't pain points, it adds complexity without value
- **Treating Backstage as a project, not a product:** Backstage requires ongoing investment in plugin maintenance, content updates, and user onboarding
- **Ignoring the scaffolder:** The scaffolder is Backstage's highest-value feature for developer productivity; invest in well-designed templates over custom dashboards

## Failure Modes

- **Catalog Entropy:** Over time, catalog entities become stale (outdated owner, incorrect lifecycle, missing dependencies). Mitigate: automated drift detection comparing catalog state against repository metadata.
- **Plugin Compatibility Breakage:** A Backstage core update breaks a custom Laravel plugin. Mitigate: comprehensive plugin testing, version pinning, and monitoring Backstage changelog.
- **Scaffolder Template Decay:** Templates reference deprecated Laravel versions or outdated package versions. Mitigate: automated CI/CD for template repositories that validate against latest Laravel stable release.
- **Low Developer Adoption:** Developers don't use the portal; they rely on CLI tools, GitHub, or direct infrastructure access. Mitigate: integrate Backstage into existing workflows (PR status checks, deployment notifications) rather than requiring developers to come to Backstage.

## Ecosystem Usage

- **Spotify:** Original Backstage developer, uses it internally for thousands of services and plugins
- **Roadie:** Managed Backstage SaaS offering with plugins for GitHub, Jira, PagerDuty, AWS
- **Kion:** Commercial Backstage distribution with built-in compliance and cost management
- **Frontback:** Open-source Backstage plugin marketplace with community-contributed integrations
- **Laravel Community:** No official Laravel Backstage plugin exists; individual organizations build custom plugins for Forge, Telescope, and Pulse integration

## Related Knowledge Units

- idp-architecture-patterns
- service-catalog-patterns
- golden-path-paved-road-patterns
- self-service-environment-provisioning

## Research Notes

- Backstage's Scaffolder is the most promising entry point for Laravel organizations considering Backstage investment
- The absence of a community-maintained Laravel Backstage plugin represents a significant ecosystem gap; building one would benefit the entire Laravel community
- Most Laravel teams using Backstage (survey data from Laracon EU 2024) are small teams (< 5 people using it alongside 50+ elsewhere) rather than dedicated Laravel shops
- The trend toward "Backstage as a thin layer" (using scaffolder + catalog but not custom plugins) is common in Laravel teams adopting Backstage incrementally
- TechDocs integration with Laravel's existing documentation patterns (README-driven development, ADRs in `/docs`) is the lowest-effort, highest-value Backstage feature for Laravel teams
