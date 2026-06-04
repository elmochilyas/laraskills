# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 05-api-versioning
**Knowledge Unit:** backward-compatibility
**Generated:** 2026-06-03

---

# Decision Inventory

1. Change Type Classification (Additive vs Breaking)
2. Breaking Change Migration Strategy
3. Contract Testing and CI Strategy

---

# Architecture-Level Decision Trees

---

## Change Type Classification

---

## Decision Context

Determining whether a proposed API change is backward compatible.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the change add a new field, endpoint, or optional parameter?
↓
YES → Additive change (backward compatible)
  ↓
  Does the new field have a default value?
  ↓
  YES → Fully backward compatible; existing consumers unaffected
  NO → Not backward compatible (existing consumers don't send it)
NO → Does the change remove or rename an existing field?
  ↓
  YES → Breaking change (requires new major version)
  NO → Does the change alter an existing field's type or constraints?
    ↓
    YES → Breaking change (existing parsers may fail)
    NO → Does the change modify behavior without changing format?
      ↓
      YES → Breaking change (consumers depend on existing behavior)
      NO → Compatible change; proceed within current version

---

## Rationale

Additive changes with defaults are always backward compatible. Field removal, type changes, and behavior changes are breaking and require a new API version.

---

## Recommended Default

**Default:** Additive changes only within a version; breaking changes = new major version
**Reason:** Preserves consumer trust; eliminates silent breakage

---

## Risks Of Wrong Choice

Treating a field type change as additive causes consumer JSON parsing failures. Removing a field silently crashes consumers that depend on it.

---

## Related Rules

Never Remove Fields Within a Version, Add Only Optional Fields

---

## Related Skills

Implement SaloonPHP Pagination Plugin

---

## Breaking Change Migration Strategy

---

## Decision Context

Managing consumer migration when breaking changes are necessary.

---

## Decision Criteria

* maintainability
* user experience

---

## Decision Tree

Is the breaking change unavoidable (security, compliance)?
↓
YES → New major version with migration guide and window
  ↓
  Can consumers be notified in advance?
  ↓
  YES → 6-month minimum migration window; deprecation headers
  NO → Emergency breaking change; communicate ASAP
NO → Can the change be deferred to a planned major release?
  ↓
  YES → Defer; batch breaking changes into one major version
  NO → Create new version with minimal breaking changes
  ↓
  Need to support old version during migration?
  ↓
  YES → Run both versions in parallel; shared service layer
  NO → Cutover migration with deadline

---

## Rationale

Breaking changes should be batched into planned major releases to minimize consumer disruption. Emergency breaking changes require immediate communication and accelerated migration.

---

## Recommended Default

**Default:** Batch breaking changes into quarterly major releases with 6-month overlap
**Reason:** Predictable schedule; minimum consumer disruption; clean migration path

---

## Risks Of Wrong Choice

Frequent breaking changes erode consumer trust and increase churn. No migration window breaks production integrations. Unbatched breaking changes create version explosion (v1, v2, v3, v4 in rapid succession).

---

## Related Rules

Validate Backward Compatibility in CI

---

## Related Skills

Implement SaloonPHP Pagination Plugin

---

## Contract Testing and CI Strategy

---

## Decision Context

Automating backward compatibility validation in the development pipeline.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

Does the codebase have OpenAPI specs for the API?
↓
YES → Add OpenAPI diff validation to CI pipeline
  ↓
  Does the spec change detect breaking modifications?
  ↓
  YES → Reject PR if breaking change detected without version bump
  NO → Run consumer contract test suites as secondary check
NO → Are there consumer contract tests available?
  ↓
  YES → Run consumer contract tests in CI for backward compat
  NO → Manual review of all API changes for breaking patterns
  ↓
  Need to alert on accidental breaking changes?
  ↓
  YES → CI fails on breaking changes; requires explicit version bump
  NO → CI warnings only; breaking changes may reach production

---

## Rationale

Automated OpenAPI diff in CI catches breaking changes before they reach production. Consumer contract tests validate that existing consumers still work with the new API version.

---

## Recommended Default

**Default:** OpenAPI spec diff in CI + consumer contract tests as secondary check
**Reason:** Automated breaking change detection; consumer-level validation

---

## Risks Of Wrong Choice

No CI validation allows breaking changes to reach production undetected. Manual review alone is error-prone and doesn't scale with team size.

---

## Related Rules
Validate Backward Compatibility in CI, Use Postel's Law

---

## Related Skills
Implement SaloonPHP Pagination Plugin
