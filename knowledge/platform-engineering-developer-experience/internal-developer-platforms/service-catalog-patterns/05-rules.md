# Rules: Service Catalog Patterns for Laravel Services

## Metadata
- **Source KU:** service-catalog-patterns
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Internal Developer Platforms
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CATALOG-RULE-001: **Registry-as-code** — Store catalog metadata as YAML files in each repository. Distributes ownership, keeps metadata in version control, prevents staleness.
- CATALOG-RULE-002: **Automate registration** — On repo creation, auto-generate catalog-info.yaml with defaults. CI flags repos without catalog metadata.
- CATALOG-RULE-003: **Start minimal, expand on demand** — Begin with 3-5 core fields (name, owner, type, lifecycle, dependencies). Add fields based on consumption patterns.
- CATALOG-RULE-004: **Every entity has an owner** — Assign both team (primary) and individual (secondary contact) ownership for bus-factor redundancy.

## Architecture Rules
- CATALOG-RULE-005: **Storage backend** — YAML files for < 20 services. Backstage catalog for larger orgs. Avoid custom database-backed catalogs.
- CATALOG-RULE-006: **Metadata format** — Use Backstage entity spec for interoperability. Most widely understood catalog format in platform engineering.
- CATALOG-RULE-007: **Registration process** — CI auto-registration for new services. Manual PR review for metadata changes (owner change, lifecycle transition).
- CATALOG-RULE-008: **Health signals** — Aggregate CI status, deploy frequency, test coverage, Pulse metrics. Automated signals with curated team self-assessments.
- CATALOG-RULE-009: **Discovery integration** — Integrate catalog into existing tools (IDE, CLI, PR workflow). Developers shouldn't need a separate portal.

## Implementation Rules
- CATALOG-RULE-010: **Queryable catalog** — An API-backed catalog enables impact analysis during incidents and upgrade planning. Static lists are marginally useful.
- CATALOG-RULE-011: **Prevent orphan services** — Implement periodic orphan detection (no commits, no deployments, no owner response). Quarterly ownership review cycles.
- CATALOG-RULE-012: **Lifecycle state machine** — Define clear transitions: experimental → production → deprecated → end-of-life. Each transition has requirements.

## Security Rules
- CATALOG-RULE-013: **Field-level access controls** — Service metadata may include compliance scope data classification. Sensitive fields require restricted access.
- CATALOG-RULE-014: **Compliance tracking** — PCI/HIPAA/SOC2 requirements tracked per service. Compliance-critical metadata requires manual verification and audit trail.
- CATALOG-RULE-015: **Vulnerability scanning** — Catalog integrates with vulnerability databases to flag services with known CVEs.
- CATALOG-RULE-016: **Catalog accessible during incidents** — Maintain static export or separate infra for incident response access.

## Performance Rules
- CATALOG-RULE-017: **YAML catalogs scale** — Text-based catalogs handle hundreds of services without performance issues.
- CATALOG-RULE-018: **Health signal polling** — CI status: every few minutes. Deploy status: hourly. Dependencies: daily. Tailor to signal volatility.

## Decision Rules
- CATALOG-RULE-019: **5+ Laravel applications** justifies a service catalog.
- CATALOG-RULE-020: **2-3 developers** who know all services by memory → catalog not needed.
- CATALOG-RULE-021: **Incomplete catalogs are worse than no catalog** — If automation can't keep it current, don't start.

## Anti-Pattern Rules
- CATALOG-RULE-022: **Avoid the Database-Backed Catalog** — Custom databases require too much maintenance. Use YAML or Backstage.
- CATALOG-RULE-023: **Avoid the Static Spreadsheet** — Google Sheet or Confluence page listing services. Stale from day one.
- CATALOG-RULE-024: **Avoid the Incomplete Catalog** — Require registration as part of project creation. CI should fail without metadata.
- CATALOG-RULE-025: **Avoid the Orphan Graveyard** — Services with "owner: unknown". Periodic cleanup archives or removes unmaintained entries.

## AI Guidance Rules
- CATALOG-RULE-026: Before advising on catalogs, understand the number of services, current discovery mechanisms, and incidents where missing catalog info caused problems.
- CATALOG-RULE-027: Laravel teams often start with GitHub repo topics and CODEOWNERS as ad-hoc catalogs. composer.json is a natural data source for dependencies.
