# Skill: Implement a Service Catalog for Laravel Applications

## Purpose
Create a centralized registry of all Laravel applications, packages, and infrastructure services with metadata (owner, dependencies, lifecycle, health) to enable discovery, ownership tracking, and impact analysis.

## When To Use
- Organization has 5+ Laravel applications with different owners and dependencies
- Incident response requires knowing which services are affected
- Planning Laravel/PHP version upgrades requires impact analysis
- Teams frequently ask "who owns service X?" or "what depends on service Y?"

## When NOT To Use
- Single Laravel application
- Team of 2-3 developers who know all services by memory
- Organization culture won't maintain the metadata discipline

## Prerequisites
- Git provider (GitHub, GitLab) with repository access
- YAML files in each repository (catalog-info.yaml)
- Backstage or YAML-based catalog tool
- CI pipeline for metadata validation

## Inputs
- Service inventory (name, owner, type, lifecycle, dependencies)
- Repository list with Git URLs
- Team ownership assignments
- Compliance requirements per service

## Workflow (numbered)
1. **Define metadata schema** — Start with 3-5 core fields: name, owner (team), type (service/package/library), lifecycle (experimental/production/deprecated), dependencies
2. **Add catalog-info.yaml to each repo** — Use Backstage entity spec format; auto-generate with sensible defaults during project creation
3. **Set up auto-discovery** — Git provider discovery for existing repos; CI auto-registration for new services
4. **Establish lifecycle states** — Define transitions: experimental → production → deprecated → end-of-life with requirements per transition
5. **Implement health signals** — Aggregate CI status, deploy frequency, test coverage, Pulse metrics; automated signals with team self-assessments
6. **Set up vulnerability scanning** — Integrate with vulnerability databases; flag services with known CVEs
7. **Create discovery interfaces** — CLI queries, PR workflow integration, searchable portal; developers shouldn't need a separate tool
8. **Prevent orphan services** — Periodic orphan detection (no commits, no deployments, no owner response); quarterly ownership review

## Validation Checklist
- [ ] catalog-info.yaml exists in every Laravel repository
- [ ] Schema starts with 3-5 core fields; expanded based on demand
- [ ] Auto-discovery and auto-registration implemented
- [ ] Lifecycle states with documented transition requirements
- [ ] Health signals automated for all production services
- [ ] Vulnerability scanning integrated
- [ ] Catalog queryable via CLI or integrated tools
- [ ] Quarterly ownership review cycle established

## Common Failures
- **Manual catalog maintenance** — stale metadata; automate from source control
- **Too much metadata too soon** — maintenance burden; start minimal
- **Catalog without discovery** — data exists but no one can query it
- **Ignoring ownership drift** — services assigned to teams/individuals that no longer exist

## Decision Points
- Storage: YAML files in repos (< 20 services) vs Backstage catalog (20+ services); never custom database
- Registration: automated (CI on repo creation) vs manual PR review (for metadata changes)
- Metadata breadth: minimal (3-5 fields) vs comprehensive (expand on demand)
- Discovery approach: CLI queries, IDE plugin, PR integration, portal

## Performance/Security Considerations
- YAML catalogs scale to hundreds of services; database catalogs index on common query fields
- Health signal polling: CI status every few minutes, deploy hourly, dependencies daily
- Service metadata may include compliance/classification; implement field-level access controls
- Compliance-critical metadata requires manual verification and audit trail
- Catalog must remain accessible during incidents (static export or separate infrastructure)

## Related Rules (from 05-rules.md)
- CATALOG-RULE-001: Registry-as-code
- CATALOG-RULE-002: Automate registration
- CATALOG-RULE-003: Start minimal, expand on demand
- CATALOG-RULE-004: Every entity has an owner
- CATALOG-RULE-011: Prevent orphan services
- CATALOG-RULE-021: Incomplete catalogs are worse than no catalog

## Related Skills
- Integrate Backstage as a Developer Portal for Laravel
- Architect IDP Patterns for Laravel Teams
- Design Golden Paths for Laravel Development

## Success Criteria
- 100% of Laravel services registered with current metadata
- Service discovery time reduced from "ask around" to < 30 seconds via catalog query
- Impact analysis for Laravel version upgrades completed in < 1 hour
- Zero services with unknown owner
- Quarterly review cycle maintains metadata accuracy > 95%

---

# Skill: Implement Catalog-Driven Governance for Laravel Services

## Purpose
Enforce organizational standards, compliance requirements, and lifecycle policies across all Laravel services using the service catalog as the source of truth for governance decisions.

## When To Use
- Compliance requirements (PCI, HIPAA, SOC2) apply to Laravel services
- Organization needs to enforce PHP/Laravel version standards across the portfolio
- Multiple teams with different maturity levels need standardized oversight

## When NOT To Use
- No compliance or standardization requirements
- Catalog is still in initial implementation phase

## Prerequisites
- Complete service catalog with accurate metadata
- CI/CD platform for automated governance checks
- Vulnerability scanning integration
- Compliance requirements documented per service

## Inputs
- Service catalog data (owner, lifecycle, dependencies, compliance scope)
- Compliance requirements matrix
- PHP/Laravel version support schedule
- CVE database access

## Workflow (numbered)
1. **Tag services by compliance scope** — Annotate catalog entries with PCI/HIPAA/SOC2 scope where applicable
2. **Set up compliance CI gates** — CI checks: PHP version is supported, Laravel version is current, no packages with critical CVEs, compliance-required configs present
3. **Implement lifecycle enforcement** — CI fails for services past EOL; blocks deploys for deprecated services without migration plan
4. **Configure vulnerability alerts** — New CVE on any service dependency triggers notification to service owner; SLA for remediation
5. **Run quarterly compliance audit** — Automated catalog scan produces compliance report; manual verification for compliance-critical metadata
6. **Establish escalation path** — Orphaned services (no owner response) escalate to team lead → engineering manager → director

## Validation Checklist
- [ ] All services tagged with compliance scope where applicable
- [ ] CI gates enforce PHP/Laravel version support, CVE remediation, compliance configs
- [ ] Services past EOL blocked from deployment
- [ ] Vulnerability alerts routed to service owners with SLA
- [ ] Quarterly compliance audit produces actionable report
- [ ] Orphan detection and escalation path documented

## Common Failures
- **Incomplete tagging** — services missing compliance scope; enforce at registration time
- **Alert fatigue** — too many low-severity alerts; prioritize by severity and service criticality
- **Manual compliance audits** — automate everything possible; manual effort leads to skipped audits
- **No escalation for orphans** — orphaned services accumulate risk; automate escalation

## Decision Points
- Compliance scope granularity: per-service vs per-system; per-service for precision, per-system for simplicity
- Alert priority: severity × service criticality matrix; critical + production = immediate action
- Enforcement severity: block vs warn; block for compliance-critical, warn for best practices

## Performance/Security Considerations
- Catalog must be queryable during incidents (static backup for when primary systems are down)
- Compliance-critical metadata changes require audit trail and manual verification
- Vulnerability scanning frequency: daily for production services, weekly for others
- Access to compliance metadata restricted; field-level controls for sensitive classifications

## Related Rules (from 05-rules.md)
- CATALOG-RULE-013: Field-level access controls
- CATALOG-RULE-014: Compliance tracking
- CATALOG-RULE-015: Vulnerability scanning
- CATALOG-RULE-016: Catalog accessible during incidents

## Related Skills
- Implement a Service Catalog for Laravel Applications
- Architect IDP Patterns for Laravel Teams
- Integrate Backstage as a Developer Portal for Laravel

## Success Criteria
- All compliance-scoped services meet compliance requirements verified by CI gates
- Critical CVE remediation SLA met > 95% of the time
- Zero services running unsupported PHP or Laravel versions
- Quarterly compliance audits completed on schedule with actionable findings
- Orphan detection catches unowned services within 30 days
