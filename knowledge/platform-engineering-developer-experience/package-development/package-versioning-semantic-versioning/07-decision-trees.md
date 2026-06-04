# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Package Versioning & Semantic Versioning
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | What version bump does this change warrant? | Breaking change, feature, fix | SemVer: MAJOR for breaks, MINOR for features, PATCH for fixes |
| 2 | Pre-1.0 vs 1.0+ versioning? | API stability, consumer expectations | 0.x for unstable API; 1.0+ for stable SemVer commitment |

---

# Architecture-Level Decision Trees

---

## Decision 1: What Version Bump Does This Change Warrant?

---

## Decision Context

SemVer communicates change scope through version numbers. Correct version bumps maintain consumer trust and enable safe dependency updates. Each change type maps to a specific version component.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the change break existing public API (remove/rename methods, change signatures, add required params)?
↓
YES → **MAJOR version bump**
NO → ↓
Does it add new backward-compatible features or deprecate existing API?
↓
YES → **MINOR version bump**
NO → ↓
Does it fix bugs, improve performance, or update documentation (all backward compatible)?
↓
YES → **PATCH version bump**
NO → ↓
Is it a security fix?
↓
PATCH version bump with clear security notes
Before any release:
- Update CHANGELOG.md first; version number emerges from changelog content
- Create Git tag (`git tag v1.2.3`)
- Deprecate APIs for one full MAJOR cycle before removal

---

## Rationale

Strict SemVer discipline is the foundation of trust in the package ecosystem. Breaking changes in MINOR/PATCH versions silently break consumer code and erode community trust. The changelog-driven approach ensures version numbers reflect actual change scope.

---

## Recommended Default

**Default:** Follow strict SemVer: MAJOR for breaks, MINOR for features, PATCH for fixes
**Reason:** Enables Composer's safe dependency resolution; maintains consumer trust

---

## Risks Of Wrong Choice

- **Breaking change in MINOR/PATCH:** Consumer code breaks silently; package loses trust
- **MAJOR bump for minor change:** Consumers avoid upgrading due to perceived risk

---

## Related Rules

- TEMPLATE-RULE-004: Version templates independently

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Pre-1.0 vs 1.0+ Versioning?

---

## Decision Context

Pre-1.0 versions (0.x) allow breaking changes in MINOR bumps. 1.0+ commits to strict SemVer. The choice depends on API stability and consumer expectations.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the package API stable and well-documented?
↓
NO → **Start with 0.x (e.g., 0.1.0)** — breaking changes allowed in MINOR (0.1 → 0.2 may break)
YES → ↓
Are there real consumers depending on the package?
↓
NO → 0.x until API stabilizes
YES → ↓
Is the team committed to SemVer discipline for breaking changes?
↓
NO → Stay in 0.x; revisit when API stabilizes
YES → **Release 1.0.0** — commit to SemVer discipline
Regardless:
- In 0.x, `^0.3` means `>=0.3.0 <0.4.0` (not `<1.0` as commonly misunderstood)
- Document pre-1.0 versioning behavior in README
- The jump to 1.0.0 should align with a stable, documented API

---

## Rationale

The 0.x phase allows rapid API iteration without the burden of deprecation cycles. However, consumers often misunderstand `^0.x` constraints. Releasing 1.0.0 signals API stability and a commitment to backward compatibility.

---

## Recommended Default

**Default:** 0.x for early development; 1.0+ when API is stable with real consumers
**Reason:** 0.x allows rapid iteration; 1.0+ signals stability and SemVer commitment

---

## Risks Of Wrong Choice

- **1.0.0 too early:** Breaking changes frustrate consumers; image of instability
- **0.x forever:** Consumers treat it as unstable; may not adopt for production use

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

