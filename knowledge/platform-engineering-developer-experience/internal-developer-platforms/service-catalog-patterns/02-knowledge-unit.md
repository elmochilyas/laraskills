# Knowledge Unit: Service Catalog Patterns for Laravel Services

## Metadata
- **Subdomain:** Internal Developer Platforms (IDP)
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** internal-developer-platforms-idp/service-catalog-patterns
- **Maturity:** Emerging
- **Related Technologies:** Backstage, YAML, GitHub, Laravel Forge, documentation generators

## Executive Summary

A service catalog is a centralized registry of all Laravel applications, packages, and infrastructure services within an organization. It provides metadata: service owner, tech stack (PHP version, Laravel version, packages), dependencies (database, cache, queue, external APIs), lifecycle status (experimental, production, deprecated), documentation links, and health dashboards. For Laravel teams, the catalog typically sources from `catalog-info.yaml` files in each repository, composer.json metadata, or a Backstage-like portal. The catalog enables discovery, ownership tracking, impact analysis, and standardization enforcement across the Laravel service landscape.

## Core Concepts

- **Service Entity:** The atomic unit in the catalog representing one deployable Laravel application or package; includes name, owner, type, lifecycle, and system membership
- **Dependency Graph:** The network of relationships between services (this Laravel API depends on that Laravel package, which depends on MySQL and Redis)
- **Ownership Model:** Every service has a clearly defined owner (individual or team) responsible for maintenance, upgrades, and incident response
- **Lifecycle States:** Standard states: `experimental` (exploration), `production` (supported), `deprecated` (no new features, critical fixes only), `end-of-life` (no support)

## Mental Models

- **Catalog as the Phone Book:** If you need to know who owns a service, what it depends on, or where its documentation is, the catalog provides the answer
- **Dependency Map as a City Map:** Visualizing service dependencies reveals the architecture's shape—monolith clusters, circular dependencies, orphan services, and critical path services
- **Lifecycle as a Stoplight:** Green (active/healthy), yellow (deprecated/migrating), red (end-of-life/broken) gives an at-a-glance health assessment of the service portfolio
- **YAML as the Source of Truth:** The `catalog-info.yaml` in each repository is the authoritative metadata; any other representation (portal UI, dashboard) is a derived view

## Internal Mechanics

1. **Metadata Collection:** Catalog sources data from multiple origins: `catalog-info.yaml` in each Laravel repo, `composer.json` (package dependencies, PHP version), `config/app.php` (providers, aliases), CI pipeline metadata (test coverage, build status), and Forge API (deployment status, PHP version).
2. **Entity Resolution:** The catalog resolves entities and their relationships: Laravel application → depends on → MySQL, Redis, Mailpit; Laravel package → depends on → Laravel framework, Spatie package tools; Laravel application → owned by → Team Alpha.
3. **Catalog API:** The catalog exposes a queryable API (GraphQL or REST) for finding services by owner, dependencies, lifecycle state, or tech stack version—essential for upgrade planning and incident management.
4. **Health Aggregation:** For each service, the catalog aggregates health signals: last deploy timestamp, CI pass/fail rate, test coverage, and Pulse metrics (queue, request, error rates).

## Patterns

- **Registry-As-Code:** Store catalog metadata as YAML files in each repository rather than a centralized database; distribute ownership and make catalog updates part of the development workflow.
- **Automated Registration:** On repository creation (via scaffolder or CLI), automatically generate the `catalog-info.yaml` with default values; require explicit updates for owner and lifecycle changes.
- **Dependency Scanning:** Parse `composer.json` and `composer.lock` regularly to detect outdated dependencies, security vulnerabilities, and license compliance issues; expose in catalog as health signals.
- **Stack Radar:** A catalog view showing PHP versions, Laravel versions, and key package versions across all services; identify services needing upgrades and track migration progress.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Storage backend | YAML files vs database vs Backstage | YAML files in repos for small orgs; Backstage catalog for 20+ services |
| Metadata format | Backstage entity spec vs custom YAML | Backstage spec for interoperability; custom if not using Backstage |
| Ownership model | Single owner vs team ownership | Team ownership for bus-factor redundancy; individual as secondary contact |
| Registration process | Manual PR vs CI auto-registration | CI auto-registration for new services; manual PR for metadata changes |

## Tradeoffs

- **Centralized vs Distributed Registration:** Centralized registration (provisioning tool adds to catalog) ensures completeness but creates a bottleneck. Distributed registration (each team adds their own YAML) spreads ownership but risks inconsistency.
- **Rich vs Minimal Metadata:** More metadata enables better discovery and analysis but requires ongoing maintenance effort. Start minimal (name, owner, type, lifecycle) and add fields as needs emerge.
- **Automated vs Curated Health Signals:** Automated health signals (CI status, deploy frequency) are objective but may not capture service quality. Curated assessments (team self-evaluation) are subjective but provide context.

## Performance Considerations

- **Catalog Scale:** Text-based catalogs (YAML files) handle hundreds of services without performance issues. If using a database-backed catalog, index on common query fields (owner, lifecycle, tech stack).
- **Dependency Graph Rendering:** Visualizing dependency graphs for 50+ services requires thoughtful layout; use hierarchical or force-directed layouts and limit initial view to direct dependencies.
- **Health Signal Update Frequency:** CI status changes every few minutes; deployment status changes hourly; dependency information changes daily. Tailor update frequency to signal volatility.

## Production Considerations

- **Discovery for Incident Response:** During an incident, the catalog should answer: which services depend on the failing component? Who owns them? What's their on-call contact? Ensure catalog is accessible even when primary services are down (static export or separate infrastructure).
- **Upgrade Impact Analysis:** Before upgrading Laravel/PHP versions, query the catalog to identify all services running the target version, their owners, and their test coverage—prioritize upgrade candidates and coordinate owner communication.
- **Deprecation Workflow:** Mark services as `deprecated` in the catalog with a deprecation date and migration path; catalog notifies owners of approaching end-of-life dates; remove from catalog only when fully decommissioned.

## Common Mistakes

- **Manual catalog maintenance:** Relying on humans to update metadata leads to stale, unreliable catalog; automate as much as possible from source control metadata
- **Too much metadata too soon:** Collecting every possible field upfront creates maintenance burden; iterate based on actual consumption patterns
- **Catalog without discovery:** If developers don't know about or can't easily browse the catalog, it provides no value; integrate catalog into existing tools (IDE, CLI, PR workflow)
- **Ignoring ownership drift:** Teams restructure, people leave, but catalog ownership doesn't update; schedule quarterly ownership review cycles
- **Treating catalog as a static artifact:** The catalog provides most value when it's queryable and integrated into workflows (CI gates, notification triggers, dashboard displays)

## Failure Modes

- **Catalog Entropy:** Over time, catalog becomes increasingly inaccurate as services are added without metadata or ownership changes aren't reflected. Mitigate: automated staleness checks flagging entities without recent metadata updates.
- **Dependency Blind Spots:** External dependencies (third-party APIs, SaaS services) not captured in the catalog cause missed impact during outages. Mitigate: allow service dependency declarations for external systems.
- **Orphan Services:** Services whose owner has left the organization or team has disbanded become unmaintained. Mitigate: periodic orphan detection (no commits, no deployments, no owner response) and escalation process.
- **Catalog as a Single Point of Failure:** If the catalog system is down, teams cannot discover services or assess impact. Mitigate: static snapshot export, distributed YAML-based metadata in repos as fallback.

## Ecosystem Usage

- **Backstage Catalog:** The most popular open-source catalog platform; uses `catalog-info.yaml` entities; supports plugins for Kubernetes, GitHub, CircleCI, and custom sources
- **ServiceNow CMDB:** Enterprise configuration management database; integrates with infrastructure provisioning tools but is heavier weight than developer-focused catalogs
- **Netflix's Graph Builder:** Internal tool (not open-source) for visualizing microservice dependencies; inspiration for dependency graph features in Laravel service catalogs
- **Laravel Forge:** Implicitly acts as a catalog by listing all servers and sites; metadata is limited to Forge-specific fields (server type, PHP version, site status)
- **GitHub (de facto):** Many Laravel teams use GitHub's repository topics, descriptions, and CODEOWNERS as a lightweight catalog before adopting formal tooling

## Related Knowledge Units

- developer-portal-integration-backstage
- idp-architecture-patterns
- automated-deployment-pipelines
- golden-path-paved-road-patterns

## Research Notes

- The service catalog concept is borrowed from enterprise IT (CMDBs) and adapted for developer platform engineering; the Backstage catalog popularized the "oreilly-ops" to "platform-ops" shift
- Laravel teams typically start using GitHub repository metadata (topics, CODEOWNERS) as an ad-hoc catalog before adopting Backstage or custom catalog tooling
- The most common mistake in service catalog adoption is over-engineering upfront; successful implementations start with 3-5 metadata fields and expand based on team needs
- Catalog-driven development (making catalog metadata a first-class artifact in the development workflow) is a 2024-2025 trend that Laravel teams are beginning to adopt alongside Backstage
