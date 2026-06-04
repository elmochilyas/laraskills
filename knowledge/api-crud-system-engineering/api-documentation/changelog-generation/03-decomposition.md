# Decomposition: Changelog Generation

## Topic Overview
Creating and maintaining a human-readable changelog documenting API changes across versions — both automated (from spec diff or conventional commits) and manually curated.

## Decomposition Strategy
This KU is atomic — it covers the single concept of changelog generation for APIs. While related to spec diff and versioning, the changelog is a distinct documentation artifact.

## Proposed Folder Structure
```
changelog-generation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Changelog Generation
- **Purpose:** Produce and maintain a changelog documenting API changes across versions
- **Difficulty:** Intermediate
- **Dependencies:** Semantic Versioning for APIs, API Versioning Strategy

## Dependency Graph
Depends on: Semantic Versioning for APIs, API Versioning Strategy. Related to: Deprecation Notes in Docs (deprecation entries), API Version Documentation (version-bound artifact). Consumed by: Documentation CI Validation (changelog entry requirement).

## Boundary Analysis
**In scope:** Changelog entry types (Added, Changed, Deprecated, Removed, Fixed, Security), Keep a Changelog format, conventional commit-based generation, OpenAPI spec diff generation, manual changelog maintenance, migration guidance in changelog, changelog CI validation, changelog publishing, version-bound changelogs, changelog feeds (RSS/webhook).
**Out of scope:** Semantic versioning decisions (api-versioning subdomain), breaking change identification (api-versioning subdomain), deprecation timeline policy (api-versioning subdomain), automated consumer notification infrastructure.

## Future Expansion Opportunities
- Changelog API Endpoint — Serving changelog as machine-readable JSON
- Automated Spec Diff Pipeline — CI-based spec comparison and changelog draft generation
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization