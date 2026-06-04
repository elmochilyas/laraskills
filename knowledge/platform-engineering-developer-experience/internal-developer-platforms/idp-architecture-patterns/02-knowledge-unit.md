# Knowledge Unit: IDP Architecture Patterns for Laravel Teams

## Metadata
- **Subdomain:** Internal Developer Platforms (IDP)
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** internal-developer-platforms-idp/idp-architecture-patterns
- **Maturity:** Emerging
- **Related Technologies:** Backstage, Laravel Forge, Docker, Kubernetes, GitHub Actions

## Executive Summary

Internal Developer Platforms (IDPs) for Laravel teams abstract infrastructure complexity behind a self-service interface, enabling developers to provision environments, deploy applications, and manage services without direct infrastructure access. The architecture typically follows a layered pattern: infrastructure layer (containers, VMs), orchestration layer (CI/CD, provisioning), service catalog layer (application registry), and developer portal layer (self-service UI). For Laravel specifically, IDPs often compose existing tools—Sail for local dev, Forge for server management, GitHub Actions for CI—into a unified experience rather than building from scratch.

## Core Concepts

- **Golden Path / Paved Road:** A pre-defined, opinionated workflow that guides developers through common tasks (create project, deploy, add service) while allowing escape hatches for edge cases
- **Service Catalog:** A registry of all Laravel applications, services, and their metadata (owner, dependencies, health status, documentation)
- **Self-Service Actions:** Automated workflows triggered by developers through a portal or CLI (e.g., "Create new Laravel project with Breeze + MySQL")
- **Template Registry:** Versioned project skeletons and package templates that encode organizational standards
- **Environment Abstraction:** Consistent environments across dev, staging, and production through declarative configuration (Docker Compose, Forge recipes)

## Mental Models

- **Platform as a Product:** Treat the IDP like a product with users, needs, UX design, SLAs, and a roadmap rather than an IT project
- **Thin Platform, Thick Tooling:** The platform layer should be minimal; most value comes from composing and standardizing existing mature tools rather than building custom infrastructure
- **Concierge vs Self-Service Curve:** Early IDPs start as concierge (platform team does work for devs), mature toward full self-service; the transition requires investment in automation and documentation
- **Two-Pizza Team Interface:** The platform should abstract enough that a single two-pizza team can own their Laravel application lifecycle without platform team intervention

## Internal Mechanics

A Laravel IDP architecture typically consists of:

1. **Developer Portal (UI Layer):** Backstage, custom Laravel-based portal, or CLI wrapper. Provides service catalog, documentation, and action triggers.
2. **Orchestration Engine:** CI/CD system (GitHub Actions, GitLab CI) that translates portal actions into infrastructure operations. Actions include: scaffold project, run tests, deploy to staging, promote to production.
3. **Provisioning Layer:** Infrastructure-as-Code (Terraform, Pulumi, Forge API) that creates and manages servers, databases, queues, and storage.
4. **Template System:** Git repositories with Laravel project skeletons, Docker Compose files, Forge recipes, and CI workflow templates.
5. **Package Registry:** Private Packagist or Satis for distributing internal Laravel packages and shared libraries.
6. **Observability Pipeline:** Aggregated logging, metrics, and error tracking across all Laravel services.

## Patterns

- **Scaffold Command Pattern:** A CLI command or portal button that runs: `composer create-project laravel/laravel`, applies organization-specific modifications, configures Sail, initializes Git, and pushes to a new repository with CI already configured.
- **Service Registration Pattern:** On repository creation, automatically register the new service in the service catalog with owner, tech stack version, and dependency declarations.
- **Environment Promotion Pattern:** Code moves through environments via immutable artifacts: build once in CI, promote the same artifact through staging to production.
- **Drift Detection Pattern:** Regularly compare actual infrastructure state against declared configuration (Forge recipes, Docker Compose) and alert on differences.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Portal platform | Backstage vs custom vs CLI-only | Backstage for orgs > 20 devs; CLI-only for smaller teams |
| Provisioning API | Forge API vs Terraform vs Kubernetes | Forge API for Laravel-native deployments; Terraform for multi-service environments |
| Template format | Cookiecutter vs custom composer plugin vs GitHub Templates | GitHub template repositories for simplicity; custom installer for complex scaffolding |
| Service catalog | Backstage catalog vs custom DB vs filesystem | Backstage catalog for multi-language orgs; YAML files in repos for pure Laravel shops |
| CI orchestration | Monorepo vs per-repo pipelines | Per-repo for independent services; monorepo for tightly coupled packages |

## Tradeoffs

- **Thin vs Thick Platform:** A thin platform composes existing tools (faster to build, less maintenance) but may not fully abstract complexity. A thick platform provides seamless experience but requires significant ongoing investment.
- **Portal vs CLI-first:** Portals provide visibility and governance but require web development. CLIs are faster for developers but harder to enforce standards.
- **Opinionated vs Flexible:** More opinionated platforms provide faster developer velocity on the golden path but make deviations painful. More flexible platforms accommodate edge cases but increase cognitive load.
- **Build vs Buy vs Compose:** Building a custom IDP gives full control but high cost. Composing tools like Forge + Actions is cheaper but may leave gaps. "Buy" options (platform.sh, Laravel Cloud) reduce effort but limit customization.

## Performance Considerations

- **Provisioning Latency:** Environment creation should complete in under 5 minutes to feel self-service; optimize template downloads and Docker image caching.
- **CI Pipeline Duration:** Target under 10 minutes for full CI (test + lint + static analysis); longer pipelines discourage frequent commits.
- **Portal Response Time:** Service catalog queries should complete in < 500ms; use caching and pagination for large catalogs.
- **Template Rendering:** Pre-render templates rather than generating on-demand for commonly used skeletons.

## Production Considerations

- **Multi-Tenant Isolation:** Ensure one team's CI usage or provisioning actions cannot impact other teams (rate limiting, resource quotas, separate build runners).
- **Credential Management:** Never expose production credentials in portal or CI output; use secret managers (Forge's built-in secrets, GitHub Actions secrets, HashiCorp Vault).
- **Failure Recovery:** Provisioning failures should leave no orphaned resources; implement cleanup workflows for partial failures.
- **Audit Trail:** All platform actions should be logged with actor, action, target, and timestamp for compliance and debugging.
- **Upgrade Path:** The IDP itself must be upgradeable; version-control platform configuration and provide a rollback mechanism.

## Common Mistakes

- **Building the platform before understanding developer pain points:** Leads to low adoption and wasted effort
- **Over-automating before stabilizing manual processes:** Automate after the manual workflow is well-understood and stable
- **Neglecting the "last mile" of developer experience:** Provisioning works but documentation is missing, error messages are cryptic, or rollback is manual
- **One-size-fits-all platform:** Different types of Laravel applications (API, monolith, microservices) need different golden paths
- **Under-investing in platform maintenance:** IDPs need ongoing updates, bug fixes, and feature development like any product

## Failure Modes

- **Platform Team Becomes Bottleneck:** If every deviation requires platform team intervention, the IDP has failed its purpose. Monitor: ratio of self-service to assisted actions.
- **Configuration Drift:** Teams modify provisioned resources directly, making subsequent automated operations fail. Mitigate: use drift detection and scheduled reconciliation.
- **Template Decay:** Project templates become outdated as Laravel versions and organizational standards evolve. Mitigate: automated CI that tests templates against latest Laravel version.
- **Portal Neglect:** The developer portal becomes stale with outdated service registrations, broken documentation links, and deprecated actions. Mitigate: service catalog self-healing via repository crawling.

## Ecosystem Usage

- **Spotify's Backstage:** Widely adopted open-source developer portal used by hundreds of organizations; Backstage plugin ecosystem includes tech docs, software catalog, and scaffolder actions
- **Humanitec:** Commercial IDP platform with emphasis on workload specification and environment orchestration
- **Laravel Forge:** Used as the provisioning backend for many Laravel IDPs; its API enables programmatic server and site management
- **Platform.sh:** Commercial PaaS that functions as an IDP; supports Laravel natively with automatic environment branching for PRs
- **Port:** Developer portal platform with Backstage compatibility and strong self-service action builder

## Related Knowledge Units

- forge-based-internal-platforms
- golden-path-paved-road-patterns
- self-service-environment-provisioning
- developer-portal-integration-backstage
- service-catalog-patterns

## Research Notes

- The Backstage community has minimal Laravel-specific content as of 2025; building a Laravel Backstage plugin is a gap opportunity
- Laravel's Forge API is the most common provisioning backend for Laravel IDPs due to its simplicity and Laravel-native understanding
- Most successful Laravel IDPs start as a CLI tool and evolve to a portal as the organization grows beyond 3-5 teams
- The "thin platform" approach (composing Sail + Forge + Actions) is significantly more common than building a custom IDP from scratch in the Laravel ecosystem
