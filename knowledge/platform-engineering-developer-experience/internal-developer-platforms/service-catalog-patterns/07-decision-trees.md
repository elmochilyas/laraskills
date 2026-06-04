# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Internal Developer Platforms
**Knowledge Unit:** Service Catalog Patterns for Laravel Services
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we implement a service catalog? | Scale, ownership issues, upgrades | Yes — for 5+ apps with different owners |
| 2 | Storage backend: YAML vs Backstage vs custom? | Scale, maintenance capacity, budget | YAML in repos for < 20 services |
| 3 | Metadata breadth: minimal vs comprehensive? | Maintenance discipline, use cases | Start minimal (3-5 fields) |
| 4 | Registration: automated vs manual? | Scale, standards enforcement | Auto-registration via CI |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Implement a Service Catalog?

---

## Decision Context

A service catalog centralizes metadata about all Laravel applications — owner, dependencies, lifecycle, and health status. It enables discovery, impact analysis, and standardization enforcement. The decision depends on organizational scale and specific pain points.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

How many Laravel applications exist?
↓
< 5 → Catalog not yet justified
5+ → ↓
Can developers already answer "who owns service X?" and "what depends on service Y?"
↓
YES (everyone knows by memory) → ↓
Team size?
↓
2-3 developers → Catalog not needed
4+ → Catalog may become needed as knowledge doesn't scale
NO (frequently asked questions) → ↓
Are there planned Laravel/PHP version upgrades that need impact analysis?
↓
YES → Catalog provides critical dependency mapping
NO → ↓
Do incidents require knowing which services are affected by a failure?
↓
YES → Catalog is essential for incident response
NO → ↓
Is the organization willing to maintain metadata discipline?
↓
NO → Do NOT implement; incomplete catalogs are worse than no catalog
YES → **Implement service catalog** — start minimal, automate registration

---

## Rationale

A service catalog requires ongoing discipline to maintain. If the organization won't maintain metadata, the catalog becomes stale and loses trust. The key threshold is 5 applications — below this, everyone knows the services. Above this, knowledge doesn't scale without a catalog.

---

## Recommended Default

**Default:** Implement for 5+ services with different owners; skip for < 5
**Reason:** Below 5 services, informal knowledge works; above 5, knowledge gaps emerge

---

## Risks Of Wrong Choice

- **Catalog too early (1-2 services):** Maintenance overhead exceeds value; catalog abandoned
- **No catalog at scale (20+ services):** Unknown owners, failed upgrade communications, incident response delays

---

## Related Rules

- CATALOG-RULE-019: 5+ Laravel applications justifies a service catalog
- CATALOG-RULE-020: 2-3 developers who know all services by memory → catalog not needed
- CATALOG-RULE-021: Incomplete catalogs are worse than no catalog

---

## Related Skills

- Implement a Service Catalog for Laravel Applications
- Implement Catalog-Driven Governance for Laravel Services

---

## Decision 2: Storage Backend — YAML vs Backstage vs Custom?

---

## Decision Context

The catalog can be stored as YAML files in each repository, in a Backstage catalog database, or in a custom database-backed solution. The choice affects maintenance burden, queryability, and interoperability.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

How many services will be cataloged?
↓
< 20 → **YAML files in repositories** — simplest, no additional infrastructure
20+ → ↓
Is Backstage already deployed or planned?
↓
YES → **Backstage catalog** — proven at scale, queryable, interoperable
NO → ↓
Does the organization have capacity to build and maintain a custom catalog?
↓
YES → **DO NOT build custom** — Backstage or YAML is always preferred
NO → ↓
Will service count exceed 100 in the next 2 years?
↓
YES → **Backstage catalog** — YAML becomes unwieldy at this scale
NO → **YAML files in repositories** — add search tooling when needed

---

## Rationale

Custom database-backed catalogs require API development, UI development, and ongoing maintenance — they are rarely justified. YAML files in repositories (registry-as-code) distribute ownership and keep metadata in version control. Backstage provides queryability and UI at scale. The 20-service threshold identifies when YAML-only becomes hard to search.

---

## Recommended Default

**Default:** YAML files in repositories for < 20 services; Backstage for 20+
**Reason:** YAML is zero-infrastructure and follows registry-as-code principles; Backstage adds queryability at scale

---

## Risks Of Wrong Choice

- **Custom database catalog:** High maintenance burden; competes with development work; rarely better than Backstage
- **YAML-only at scale (100+ services):** Hard to search; no relationship visualization; no health signals

---

## Related Rules

- CATALOG-RULE-005: Storage backend
- CATALOG-RULE-006: Metadata format — Backstage entity spec
- CATALOG-RULE-022: Avoid the Database-Backed Catalog
- CATALOG-RULE-023: Avoid the Static Spreadsheet

---

## Related Skills

- Implement a Service Catalog for Laravel Applications
- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 3: Metadata Breadth — Minimal vs Comprehensive?

---

## Decision Context

The catalog schema can include 3-5 core fields or dozens of specialized fields. The breadth affects maintenance burden, adoption barriers, and catalog utility.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Have specific use cases for catalog data been identified?
↓
NO → **Start with 3-5 core fields** (name, owner, type, lifecycle, dependencies)
YES → ↓
Are the additional fields immediately needed for an actionable workflow?
↓
NO → **Start minimal** — add fields when consumption patterns justify them
YES → ↓
Can these fields be auto-populated from existing sources (composer.json, CI)?
↓
YES → Add auto-populated fields; no manual maintenance burden
NO → ↓
Does the team have capacity to maintain additional manual metadata?
↓
NO → **Keep minimal** — do not add fields that require manual updates
YES → **Add fields** — but establish CI validation to prevent stale metadata

---

## Rationale

Every metadata field requires maintenance. The most successful catalogs start with 3-5 fields and grow organically based on consumption patterns. Auto-populated fields (from composer.json, CI status, deployment pipelines) provide value without maintenance burden. The key principle: don't collect data until there's a proven consumer.

---

## Recommended Default

**Default:** Start with 5 core fields: name, owner (team), type, lifecycle, dependencies
**Reason:** Covers 80% of discovery needs; expand based on actual consumption patterns

---

## Risks Of Wrong Choice

- **Too many fields upfront:** High barrier to entry; maintenance burden; teams resist catalog participation
- **Too few fields:** Catalog fails to answer key questions; low adoption

---

## Related Rules

- CATALOG-RULE-003: Start minimal, expand on demand
- CATALOG-RULE-001: Registry-as-code

---

## Related Skills

- Implement a Service Catalog for Laravel Applications

---

## Decision 4: Registration — Automated vs Manual?

---

## Decision Context

Services can be registered in the catalog automatically (CI on repo creation) or manually (developers add catalog-info.yaml via PR). The approach affects catalog completeness, metadata quality, and adoption.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Are new projects created from templates or scaffolds?
↓
YES → **Auto-registration during project creation** — catalog-info.yaml generated with defaults
NO → ↓
Is there a CI pipeline for new repositories?
↓
YES → **Auto-registration via CI** — detect new repos without catalog-info.yaml and generate default
NO → ↓
Team size and discipline?
↓
Small team, high discipline → Manual registration may work; CI checks for staleness
Large team or low discipline → **Auto-registration required** — manual won't be consistent

For metadata changes (owner change, lifecycle transition):
↓
→ **Manual with PR review** — requires human verification
→ CI validates that changes match defined transition rules
→ e.g., experimental → production requires security review evidence

---

## Rationale

Manual registration is forgotten or deprioritized. Auto-registration ensures every service is cataloged from day one. The distinction between initial registration (auto) and metadata changes (manual with review) balances completeness with quality. CI should flag repositories without catalog metadata.

---

## Recommended Default

**Default:** Auto-registration on project creation; manual PR review for metadata changes
**Reason:** Ensures every service is cataloged while maintaining quality control on changes

---

## Risks Of Wrong Choice

- **Fully manual registration:** Stale metadata; incomplete catalog; developers forget to register
- **Fully automated changes:** Incorrect owner assignments; lifecycle transitions without proper review

---

## Related Rules

- CATALOG-RULE-002: Automate registration
- CATALOG-RULE-007: Registration process
- CATALOG-RULE-024: Avoid the Incomplete Catalog

---

## Related Skills

- Implement a Service Catalog for Laravel Applications
- Implement Catalog-Driven Governance for Laravel Services

