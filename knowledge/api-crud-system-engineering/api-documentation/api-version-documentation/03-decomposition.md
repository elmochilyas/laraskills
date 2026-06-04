# Decomposition: API Version Documentation

## Topic Overview
Presenting multiple API versions in documentation � version identification, multi-version doc structure, version-specific behavior notes, and version lifecycle status.

## Decomposition Strategy
This KU is atomic � it covers the single concept of documenting API versions in the documentation UI and spec files. The underlying versioning strategy is covered in the api-versioning subdomain.

## Proposed Folder Structure
```
api-version-documentation/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
```

## Knowledge Unit Inventory

### API Version Documentation
- **Purpose:** Present multiple API versions in documentation with clear identification and navigation
- **Difficulty:** Intermediate
- **Dependencies:** API Versioning Strategy, Semantic Versioning for APIs

## Dependency Graph
Depends on: API Versioning Strategy, Semantic Versioning for APIs. Related to: Changelog Generation (version changes), Deprecation Notes in Docs (version deprecation), API Versioning subdomain.

## Boundary Analysis
**In scope:** Version identification in docs (number, date, status), multi-version documentation structure (separate specs, versioned paths), version status badges (active, deprecated, sunset), version comparison tables, version-specific endpoint notes, default version promotion, version discovery endpoint, documentation UI version selector, per-version doc generation in CI, sunset version archiving.
**Out of scope:** API versioning implementation (api-versioning subdomain), breaking change identification (api-versioning subdomain), changelog content (changelog-generation KU), deprecation timeline policy (api-versioning subdomain).

## Future Expansion Opportunities
- Migration Guide Documentation � Comprehensive guides for upgrading between versions
- Version Lifecycle Automation � Automated version status updates from deployment pipeline
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization