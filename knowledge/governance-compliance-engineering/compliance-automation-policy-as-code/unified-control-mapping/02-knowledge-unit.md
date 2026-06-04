# Unified Control Mapping

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** compliance-automation-policy-as-code
- **Knowledge Unit:** Unified Control Mapping
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Unified Control Mapping creates a centralized, machine-readable mapping between regulatory requirements (GDPR, SOC 2, HIPAA, PCI-DSS), technical controls (encryption, access control, audit logging), and specific application features. For Laravel applications managing multiple compliance frameworks, this mapping eliminates duplication, identifies coverage gaps, and enables automated compliance reporting from a single source of truth.

---

## Core Concepts

- **Control mapping** connects regulatory requirements to technical implementations in a structured format (YAML, JSON, database)
- **Cross-framework mapping** identifies where a single technical control satisfies requirements from multiple regulations
- **Gap analysis** compares mapped controls against required controls to identify compliance deficiencies
- **Control inheritance** recognizes when controls are provided by infrastructure or platform rather than application code
- **Automated evidence linking** connects mapped controls to evidence collection automation
- **Mapping versioning** tracks changes to control mappings alongside application code

---

## Mental Models

- **The Transit Map:** Like a subway map, control mapping shows connections between regulations (lines), control categories (stations), and implementations (routes). Transfers show where one control serves multiple requirements.
- **The Requirements Traceability Matrix (RTM):** A living document connecting what the regulation says, what the control does, and how the code implements it, with test results proving each connection.
- **The City Zoning Map:** Different regulations (zones) overlap on the same technical controls (properties). A single property can satisfy multiple zoning requirements if properly configured.

---

## Internal Mechanics

Control mapping is stored as structured data — typically a YAML file or database table with fields for: regulation ID, control ID, control description, implementation class/service, implementation method, evidence source, test reference, and status. A mapping engine loads these definitions and provides APIs to query: which regulations a control satisfies, which controls implement a requirement, and where gaps exist. The mapping is versioned in source control alongside application code. Scheduled jobs can validate mappings against actual control implementations to detect drift.

---

## Patterns

**Single Source of Truth Pattern:** Define all control mappings in a central database or file, referenced by other compliance systems. Benefit: No duplication across frameworks. Tradeoff: Single point of failure — mapping corruption affects all compliance reporting.

**Framework-Specific Overlay Pattern:** Store core control definitions separately from framework-specific mappings. Overlays add framework context. Benefit: Easier to add new regulatory frameworks. Tradeoff: Overlay complexity can obscure total coverage.

**Automated Mapping Validation Pattern:** Run regular tests verifying that mapped controls actually exist and function as expected. Benefit: Catch drift before audits. Tradeoff: Test maintenance overhead.

---

## Architectural Decisions

Use a database-backed mapping for dynamic compliance programs where regulations change frequently; use file-based YAML for static mappings that change with deployments. Store mappings in the application repository to keep them synchronized with code changes. Implement a mapping API service that provides a single interface for compliance reporting tools. Choose a mapping format (YAML, JSON, DB) that integrates with your evidence collection and compliance reporting pipeline.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single source of truth across frameworks | Mapping maintenance as regulations evolve | Dedicated compliance engineering time for updates |
| Automated gap detection | Requires comprehensive initial mapping | Slow setup but immediate visibility into coverage |
| Cross-framework control reuse | One broken control affects multiple frameworks | Higher impact of control failures |
| Versioned alongside application code | Merge conflicts on mapping changes | Requires code review discipline for mapping changes |

---

## Performance Considerations

Mapping queries should be performant for real-time compliance checks. Cache mapping data in memory with a short TTL. Index database mappings on regulation ID, control ID, and implementation reference. For large mappings (1000+ controls), use a materialized view for reporting queries. Mapping validation jobs run during off-peak hours and should not impact application performance.

---

## Production Considerations

Implement mapping validation as part of CI/CD pipeline — deployments that affect mapped controls must pass validation. Create a compliance coverage dashboard showing control status by regulation. Set up alerts when mapped controls are modified or removed. Establish a mapping review process — every mapping change requires compliance team approval. Version controlled mappings enable rollback of changes that break compliance coverage. Document the mapping schema and update process for auditors.

---

## Common Mistakes

**Mapping at the wrong granularity** — too coarse misses compliance requirements; too fine creates unmanageable complexity. Map at the control objective level.

**Not mapping infrastructure-provided controls** — encryption at rest, network firewalls, and physical security are often provided by cloud providers. Include inherited controls.

**Static mappings for dynamic systems** — if controls change with deployments, mappings must too. Automate mapping updates from deployment events.

---

## Failure Modes

- **Mapping drift:** Application changes without corresponding mapping updates. Detect via automated validation comparing mappings to actual implementation.
- **Regulation interpretation error:** Control mapped to the wrong requirement. Mitigate via compliance team review of mappings.
- **Inherited control discontinuation:** Cloud provider discontinues a security feature mapped as a control. Monitor provider announcements and update mappings.
- **Mapping format migration failure:** Changing mapping schema causes data loss. Test migration procedures before applying.

---

## Ecosystem Usage

Laravel applications implementing unified control mapping typically use: custom database schemas for mapping storage, internal API endpoints for mapping queries, scheduled validation jobs, and integration with compliance reporting tools. The mapping service is often a dedicated microservice or module within a larger compliance automation platform. Open-source tools like OpenControl and compliance frameworks can be adapted for Laravel-specific use.

---

## Related Knowledge Units

### Prerequisites
- Compliance Frameworks (SOC 2, ISO 27001, HIPAA, PCI-DSS, GDPR)
- Evidence Collection Automation
- Control Implementation Patterns

### Related Topics
- Evidence Collection Automation (feeds control evidence)
- Compliance Attestation PDF (consumes mapping for reports)
- CI/CD Policy Gates (validates control mapping)

### Advanced Follow-up Topics
- Automated Control Mapping Update from Regulation Changes
- Multi-Framework Compliance Reporting Dashboards
- Machine-Readable Compliance Mapping Standards (OSCAL, OpenControl)

---

## Research Notes

Unified control mapping is the architectural foundation for managing multiple compliance frameworks. Without it, organizations maintain separate compliance programs for each regulation, duplicating effort and risking inconsistent coverage. The OSCAL (Open Security Controls Assessment Language) standard from NIST provides a formal schema for control mappings. For Laravel applications, the practical approach is to start with a custom mapping solution that can later migrate to OSCAL compliance as the standard matures. The key insight is that most technical controls serve multiple regulatory requirements simultaneously — recognizing and documenting these overlaps is the primary value of unified control mapping.
