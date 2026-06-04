# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** API Version Documentation
**Generated:** 2026-06-03

---

# Decision Inventory

* Spec organization (separate files per version vs single multi-version spec)
* Version status documentation (active vs deprecated presentation)
* Default version strategy (auto-redirect vs explicit selection)

---

# Architecture-Level Decision Trees

---

## Spec Organization — Separate Files Per Version vs Single Multi-Version Spec

---

## Decision Context

How should multiple API versions be documented in OpenAPI specs? Arises when maintaining documentation for multiple active API versions.

---

## Decision Criteria

* maintainability — independent evolution of each version's docs
* consumer clarity — unambiguous which spec applies to which version
* tooling support — docs platforms handling single vs multi-file specs
* diff visibility — comparing changes across versions

---

## Decision Tree

How many API versions are actively maintained (not sunset)?
↓
1-2 versions?
YES → Separate spec files per version (`openapi-v1.yaml`, `openapi-v2.yaml`)
NO → 3+ versions?
    YES → Separate files per version (cleaner separation)
    NO → Single spec — only one version active

---

## Rationale

Separate spec files per version enable independent evolution without merge conflicts. Each version's spec accurately reflects its endpoints, schemas, and behaviors. A single multi-version spec becomes unwieldy as versions diverge.

---

## Recommended Default

**Default:** Separate spec files per version
**Reason:** Clean separation, independent evolution, unambiguous mapping from API version to spec.

---

## Risks Of Wrong Choice

Single spec for multiple versions: conditional logic bloat, stale docs for older versions, merge conflicts from parallel development.

---

## Related Rules

N/A (no 05-rules.md for this KU)

---

## Related Skills

N/A (no 06-skills.md for this KU)

---

## Version Status Documentation — Active vs Deprecated Presentation

---

## Decision Context

How should deprecated and active versions be visually distinguished in documentation? Arises when presenting multiple version statuses (active, deprecated, sunset).

---

## Decision Criteria

* clarity — consumers must immediately identify the recommended version
* visibility — deprecated versions accessible but not prominent
* discovery — new consumers default to the active version
* migration — deprecated versions include upgrade path

---

## Decision Tree

What version status is being presented?
↓
Active (fully supported)?
YES → Green badge or "Recommended" label + primary position
NO → Deprecated (functional, not recommended)?
    YES → Yellow/orange badge + removal date + secondary position + migration link
    NO → Sunset (no longer available)?
        YES → Red badge + "Removed" label + historical docs only (no interactive features)

---

## Rationale

Visual distinction (color-coded badges) helps consumers immediately identify which version to use. Active versions get primary placement and promotion. Deprecated versions remain accessible but visually de-emphasized. Sunset versions become read-only historical references.

---

## Recommended Default

**Default:** Active versions promoted; deprecated clearly labeled with removal date and migration link
**Reason:** Consumers need clear guidance on which version to adopt and when to migrate.

---

## Risks Of Wrong Choice

All versions presented equally: new consumers pick wrong (possibly deprecated) version. Deprecated without migration link: consumers cannot upgrade.

---

## Related Rules

N/A

---

## Related Skills

N/A

---

## Default Version Strategy — Auto-Redirect vs Explicit Selection

---

## Decision Context

When an unversioned API request comes to the documentation, which version should be shown? Arises when consumers access docs without specifying a version.

---

## Decision Criteria

* consumer onboarding — new consumers see the recommended version
* backward compatibility — existing links to unversioned docs still work
* migration nudging — gently push consumers to latest stable version
* deprecation lifecycle — auto-redirect after deprecation period

---

## Decision Tree

Is the consumer request explicitly versioned (e.g., /docs/v2/user)?
↓
YES → Show requested version's docs
NO → Unversioned request (e.g., /docs/user)?
    YES → Auto-redirect to latest stable version
    NO → Explicit version request → Show requested version

---

## Rationale

Unversioned documentation URLs should redirect to the latest stable version. This ensures new consumers use the recommended version and provides a consistent landing point for bookmarked links.

---

## Recommended Default

**Default:** Redirect unversioned docs to latest stable version
**Reason:** New consumers land on the recommended version; existing consumers use their explicitly versioned links.

---

## Risks Of Wrong Choice

No redirect: consumer on deprecated version stays there indefinitely, builds integration against outdated endpoints. Redirect to latest: legacy bookmarks stop showing the version they expected.

---

## Related Rules

N/A

---

## Related Skills

N/A
