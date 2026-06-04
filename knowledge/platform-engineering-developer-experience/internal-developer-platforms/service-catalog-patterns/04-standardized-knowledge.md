# Experience Curation: Service Catalog Patterns for Laravel Services

## Metadata
- **KU ID:** internal-developer-platforms-idp/service-catalog-patterns
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Emerging
- **Dependencies:** developer-portal-integration-backstage, idp-architecture-patterns, automated-deployment-pipelines
- **Related Technologies:** Backstage, YAML, GitHub, Laravel Forge, documentation generators
- **Target Audience:** Platform engineers, Laravel team leads, DevOps engineers

## Overview

A service catalog is a centralized registry of all Laravel applications, packages, and infrastructure services within an organization. It provides metadata: service owner, tech stack (PHP version, Laravel version, packages), dependencies (database, cache, queue, external APIs), lifecycle status (experimental, production, deprecated), documentation links, and health dashboards. For Laravel teams, the catalog sources from `catalog-info.yaml` files in each repository, composer.json metadata, or a Backstage-like portal. The catalog enables discovery, ownership tracking, impact analysis, and standardization enforcement across the Laravel service landscape.

## Core Concepts

- **Service Entity:** The atomic unit representing one deployable Laravel application or package; includes name, owner, type, lifecycle, and system membership
- **Dependency Graph:** The network of relationships between services (this Laravel API depends on that Laravel package, which depends on MySQL and Redis)
- **Ownership Model:** Every service has a clearly defined owner (individual or team) responsible for maintenance, upgrades, and incident response
- **Lifecycle States:** Standard states: experimental (exploration), production (supported), deprecated (no new features), end-of-life (no support)
- **Registry-As-Code:** Catalog metadata as YAML files in each repository rather than a centralized database
- **Dependency Scanning:** Parse composer.json/lock to detect outdated dependencies, security vulnerabilities, and license compliance

## When To Use

- Organization has 5+ Laravel applications with different owners and dependencies
- Incident response requires knowing which services are affected by a failure
- Planning Laravel/PHP version upgrades requires impact analysis across services
- Teams frequently ask "who owns service X?" or "what depends on service Y?"
- Organization wants to track lifecycle (experimental → production → deprecated) across all services
- Need to enforce organizational standards (PHP version, package versions) across the portfolio

## When NOT To Use

- Single Laravel application with no dependencies tracking needed
- Team of 2-3 developers who already know all services by memory
- Organization culture won't maintain the metadata discipline required
- Existing tools (GitHub repo topics, CODEOWNERS) already meet discovery needs
- No budget or resources for catalog tooling and maintenance

## Best Practices (WHY)

1. **Registry-As-Code (Why):** Store catalog metadata as YAML files in each repository rather than a centralized database. This distributes ownership, makes updates part of the development workflow, and keeps metadata in version control alongside the code it describes. Centralized databases become stale quickly because catalog updates compete with development work.

2. **Automate Registration (Why):** On repository creation (via scaffolder or CLI), automatically generate catalog-info.yaml with default values. Manual registration is forgotten or deprioritized. If a repository exists without catalog metadata, CI should flag it.

3. **Start Minimal, Expand on Demand (Why):** Begin with 3-5 metadata fields (name, owner, type, lifecycle, dependencies) and add fields as teams express needs. Over-collecting metadata upfront creates maintenance burden without proven value. The most successful catalogs grow organically.

4. **Queryable Catalog (Why):)** The catalog provides the most value when it's queryable and integrated into workflows—CI gates, notification triggers, dashboard displays. A static list of services is marginally useful. An API-backed catalog enables impact analysis during incidents and upgrade planning.

5. **Prevent Orphan Services (Why):** Services whose owner has left or team disbanded become unmaintained. Implement periodic orphan detection (no commits, no deployments, no owner response) with an escalation process. Schedule quarterly ownership review cycles.

## Architecture Guidelines

- **Storage Backend:** YAML files in repositories for small orgs (< 20 services). Backstage catalog for larger orgs. Avoid custom database-backed catalogs—they require too much maintenance.
- **Metadata Format:** Use Backstage entity spec for interoperability (even without Backstage itself). It's the most widely understood catalog format in the platform engineering community.
- **Ownership Model:** Team ownership with individual as secondary contact. Team ownership provides bus-factor redundancy and reflects real responsibility.
- **Registration Process:** CI auto-registration for new services. Manual PR review for metadata changes (owner change, lifecycle transition).
- **Health Signals:** Aggregate CI status, deploy frequency, test coverage, and Pulse metrics. Automated signals are objective; supplement with curated team self-assessments for context.
- **Discovery Integration:** Integrate catalog into existing tools—IDE, CLI, PR workflow. Developers shouldn't need to visit a separate portal to use the catalog.

## Performance

- **Catalog Scale:** Text-based catalogs (YAML files) handle hundreds of services without performance issues. Database-backed catalogs should index on common query fields (owner, lifecycle, tech stack).
- **Dependency Graph Rendering:** Visualizing 50+ service dependencies requires thoughtful layout. Use hierarchical or force-directed layouts. Limit initial view to direct dependencies.
- **Health Signal Update Frequency:** CI status: every few minutes. Deployment status: hourly. Dependency information: daily. Tailor polling frequency to signal volatility.

## Security

- **Metadata Classification:** Service metadata may include sensitive information (compliance scope, data classification). Implement field-level access controls for sensitive metadata.
- **Compliance Tracking:** Catalog tracks compliance requirements per service (PCI, HIPAA, SOC2). Compliance-critical metadata requires manual verification and audit trail.
- **Dependency Vulnerability Scanning:** Catalog integrates with vulnerability databases to flag services running packages with known CVEs. Prioritize remediation based on severity and service criticality.
- **Catalog Access in Incidents:** Ensure catalog is accessible even when primary services are down. Maintain static export or separate infrastructure for incident response access.

## Common Mistakes

### Mistake 1: Manual Catalog Maintenance
- **Description:** Relying on humans to keep metadata current
- **Cause:** No automation, treating catalog as a documentation exercise
- **Consequence:** Stale, unreliable metadata; catalog loses trust and value
- **Better:** Automate as much as possible from source control metadata. CI checks for staleness. Flag entities without recent metadata updates.

### Mistake 2: Too Much Metadata Too Soon
- **Description:** Collecting every possible field upfront
- **Cause:** Desire for completeness, "we might need this later"
- **Consequence:** Maintenance burden, high barrier to entry for teams
- **Better:** Start with 3-5 core fields. Add fields based on actual consumption patterns and team requests.

### Mistake 3: Catalog Without Discovery
- **Description:** Catalog exists but developers can't easily browse or query it
- **Cause:** Focus on data collection, neglect of user experience
- **Consequence:** Low usage, catalog provides no value
- **Better:** Integrate catalog into existing tools (IDE, CLI, PR workflow). Make it searchable and browseable.

### Mistake 4: Ignoring Ownership Drift
- **Description:** Services remain assigned to individuals or teams that no longer exist
- **Cause:** No review cycle, org changes not reflected in catalog
- **Consequence:** Orphaned services, incident response confusion, failed upgrade communications
- **Better:** Quarterly ownership review cycles. Automated orphan detection (no commits, no deployments, no owner response).

## Anti-Patterns

- **The Database-Backed Catalog:** A custom database that requires API development and dedicated maintenance. Use Backstage catalog or YAML files in repos—both are proven patterns with existing tooling.
- **The Static Spreadsheet:** A Google Sheet or Confluence page listing services. Stale from day one, not queryable, no automation. Requires manual updates.
- **The Incomplete Catalog:** Only 60% of services registered, making it unreliable as a source of truth. Require catalog registration as part of project creation. CI should fail without catalog metadata.
- **The Orphan Graveyard:** Hundreds of services listed with "owner: unknown" and "lifecycle: unknown". Periodic cleanup should archive or remove services without current metadata.

## Examples

### Example 1: catalog-info.yaml for Laravel API Service
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: invoice-api
  description: Invoice generation and management API
  tags:
    - laravel
    - api
    - php
  annotations:
    github.com/project-slug: myorg/invoice-api
    backstage.io/techdocs-ref: dir:/docs
spec:
  type: service
  lifecycle: production
  owner: team-billing
  dependsOn:
    - Component:mysql-main
    - Component:redis-cache
    - Component:payment-gateway
  system: billing-system
```

### Example 2: Lifecycle States and Transitions
```
experimental → production → deprecated → end-of-life
       ↑              ↓
exploration      archived

Transition requirements:
- experimental → production: passed security review, documented runbooks, > 90% test coverage
- production → deprecated: announced migration timeline, no new features
- deprecated → end-of-life: all traffic migrated, last update > 6 months ago
```

### Example 3: Stack Radar Query
```graphql
query {
  services(phpVersion: "8.1") {
    name
    owner
    laravelVersion
    lifecycle
    lastDeploy
  }
}
# Identifies services needing PHP upgrade from 8.1 to 8.3
```

## Related Topics

- **developer-portal-integration-backstage:** Backstage catalog implementation
- **idp-architecture-patterns:** Catalog within IDP architecture
- **automated-deployment-pipelines:** Health signals from deployment pipelines
- **golden-path-paved-road-patterns:** Catalog registration as path final step
- **forge-based-internal-platforms:** Forge as catalog data source

## AI Agent Notes

- **Context Requirements:** When advising on service catalogs, first understand the number of Laravel services, current discovery mechanisms (or lack thereof), and specific incidents where missing catalog information caused problems. The solution depends on organization size and existing tooling.
- **Key Decision Points:** The critical choices are: (1) YAML files vs Backstage vs custom, (2) registration process (manual vs automated), (3) metadata breadth (minimal vs comprehensive), (4) queryability approach. Each choice affects adoption and maintenance.
- **Common Pitfalls in AI Assist:** Avoid recommending custom catalog databases. Don't suggest comprehensive metadata from day one. Always emphasize automated registration and staleness detection. Remember that incomplete catalogs are worse than no catalog.
- **Laravel-Specific Nuances:** Laravel teams often start with GitHub repo topics and CODEOWNERS as ad-hoc catalogs. composer.json is a natural data source for dependency information. Forge API provides deployment and server metadata. The catalog should leverage these existing data sources.

## Verification

- [ ] KU accurately defines service catalog patterns for Laravel
- [ ] Core concepts cover entities, dependency graph, ownership, lifecycle
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize registry-as-code and minimal start
- [ ] Architecture guidelines cover storage, format, ownership, registration
- [ ] Performance addresses catalog scale and health signal frequency
- [ ] Security covers compliance, vulnerability scanning, incident access
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify database-backed and static spreadsheet catalogs
- [ ] Examples show YAML, lifecycle states, and query usage
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
