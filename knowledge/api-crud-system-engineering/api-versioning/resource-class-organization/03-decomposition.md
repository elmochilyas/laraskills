# Resource Class Organization — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers maintaining versioned resource classes over the API lifecycle: managing field deprecation across versions, detecting response shape drift, auditing resource coverage, and safely removing fields from deprecated versions.

## Core Concepts
- **Field Deprecation in Resources:** Marking fields for removal in future versions while keeping them in current.
- **Response Shape Auditing:** Automated comparison of response JSON schemas across versions.
- **Resource Coverage Matrix:** Which resources exist in which versions, with field-level diff tracking.
- **Field Removal Policy:** Guidelines for when and how to remove fields from old version resources.

## Mental Models
- **Museum Exhibit:** Each version's resources are a museum exhibit. V1 exhibit shows the original artifacts. V2 exhibit adds informative plaques. V3 exhibit adds interactive displays. Artifacts may be removed from old exhibits only when the exhibit is closed.
- **Shopping List Evolution:** V1's resource is a basic shopping list (item, quantity). V2 adds aisle number. V3 adds nutritional info. V1 items stay the same; you never remove "quantity" from the V1 list.

## Internal Mechanics
- A resource schema extractor probes each version endpoint and records the JSON response shape.
- Field-by-field diff between versions identifies additions, removals, and type changes.
- Resource coverage checks validate that every model has a resource in every active version.
- Deprecated field reporting flags fields in V{n} resources that no longer exist in V{n+1}.

## Patterns
- Resource schema registry with field-level metadata (since_version, deprecated_in, removed_in).
- Automated schema diff in CI when a PR modifies a resource file.
- Resource deprecation annotation: `$this->when(false, $this->deprecatedField)` to silently drop fields in new versions.
- Resource version matrix documentation auto-generated from code.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Field removal strategy | Remove from V{n} after V{n+2} stable | Gives two versions of buffer |
| Schema audit frequency | Per-PR for resource changes | Catches drift early |
| Resource coverage | CI must pass 100% | Ensures no endpoint returns raw model |
| Deprecated field marker | Docblock `@deprecated` + resource filter | Both human and machine readable |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Automated schema diff | Detects unintentional changes | Requires setup, may produce false positives |
| Manual field audit | Human judgment applied | Labor-intensive, skipped under pressure |
| Full resource coverage | No raw model leaks | Overhead for simple endpoints |
| Selective coverage | Faster development | Risk of exposing sensitive fields |

## Performance Considerations
- Schema extraction is an offline E2E testing concern, zero runtime cost.
- Resource coverage checks are part of CI, not production.
- Field-level metadata in resources adds negligible memory overhead.

## Production Considerations
- Maintain a "resource changelog" for each major version showing field additions, changes, and removals.
- Notify consumers when fields in their version are marked deprecated.
- Deprecated fields in old version resources should include a `@deprecated` response hint.
- Automatically flag PRs that remove fields from V1 without an ADR.

## Common Mistakes
- Silently removing a field from an older version's resource assuming nobody uses it.
- Forgetting to update the V1 resource when the V2 resource changes in a way that affects both.
- Assuming field names are the same across versions — always diff explicitly.
- Not documenting why a field was removed from a version.

## Failure Modes
- **Silent field removal:** V1 resource field removed without breaking change notice, consumer crashes.
- **Schema mismatch:** V2 endpoint accidentally returns V1 resource class, wrong field set.
- **Field type creep:** V1 returns `string`, V2 returns `int` for the same field name — consumer code parsing breaks.
- **Test coverage gap:** V1 resource has full test suite, V2 resource is untested and subtly wrong.

## Ecosystem Usage
- **Stripe:** Maintains field-level changelogs per API version, showing exactly when each field was added or changed.
- **GitHub API:** V3 resource documentation shows which version each field was introduced.
- **Shopify:** Publishes field-level version matrices for all REST resources.

## Related Knowledge Units
- **Prerequisites:** JSON schema, API documentation generation
- **Related Topics:** Response structures, Backward-compatible changes
- **Advanced Follow-up:** Resource versioning at the API gateway, Schema registry patterns

## Research Notes
### Source Analysis
Shopify's "API Versioning & Field Management" talk (2023) is the best resource on field-level version management. Stripe's API changelog (2015-present) is a reference implementation.

### Key Insight
Resource classes inevitably grow fields over time. The operational challenge is not adding fields — it's knowing which fields each version exposes and ensuring old versions remain consistent.

### Version-Specific Notes
Laravel 11 resource response `->additional()` can carry version metadata. Use `$resource->response()->getData()` for schema extraction tools.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization