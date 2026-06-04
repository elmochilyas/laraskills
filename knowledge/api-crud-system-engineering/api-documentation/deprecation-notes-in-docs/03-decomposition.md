# Decomposition: Deprecation Notes in Docs

## Topic Overview
Marking endpoints, parameters, response fields, and API versions as deprecated in documentation. Covers OpenAPI deprecated flag, deprecation descriptions, sunset headers, and migration guidance.

## Decomposition Strategy
This KU is atomic � it covers the single concept of documenting deprecations. The deprecation policy and timeline are covered in the api-versioning subdomain.

## Proposed Folder Structure
```
deprecation-notes-in-docs/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
```

## Knowledge Unit Inventory

### Deprecation Notes in Docs
- **Purpose:** Communicate endpoint, field, and version deprecations clearly in documentation
- **Difficulty:** Intermediate
- **Dependencies:** API Versioning Strategy, API Changelog Generation

## Dependency Graph
Depends on: API Versioning Strategy, API Changelog Generation. Related to: API Version Documentation (version-level deprecation), Changelog Generation (deprecation entries). Serves as prerequisite for: Documentation CI Validation (deprecation notice completeness).

## Boundary Analysis
**In scope:** OpenAPI deprecated flag on operations and schema properties, deprecation description format (what, alternative, timeline, migration), deprecation levels (soft, hard, sunset), Deprecation and Sunset HTTP headers, deprecation callout format in endpoint descriptions, visual styling in doc tools (Swagger UI, ReDoc), Scramble #[Deprecated] attribute mapping, Scribe @deprecated tag, migration guide references, deprecation monitoring via logs, sunset enforcement (410 Gone), consumer notification.
**Out of scope:** Deprecation policy design (api-versioning subdomain), version lifecycle/timeline design (api-versioning subdomain), breaking change identification (api-versioning subdomain), changelog content beyond deprecation entries (changelog-generation KU).

## Future Expansion Opportunities
- Deprecation Header Implementation � Technical deep dive on Deprecation/Sunset header middleware
- Consumer Deprecation Dashboard � UI showing deprecated usage per consumer
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization