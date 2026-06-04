# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Deprecation Notes in Docs
**Generated:** 2026-06-03

---

# Decision Inventory

* Deprecation announcement channel (headers vs docs-only vs both)
* Deprecation timeline enforcement (soft vs hard removal)
* Deprecated endpoint lifecycle (keep vs remove after sunset)

---

# Architecture-Level Decision Trees

---

## Deprecation Announcement Channel — Headers vs Docs-Only vs Both

---

## Decision Context

How should deprecation be communicated to API consumers — through response headers, documentation, or both? Arises when implementing deprecation notice strategy.

---

## Decision Criteria

* visibility — where consumers will see the notice
* automation — runtime header detection vs periodic doc review
* urgency — how quickly consumers need to act
* passive vs active — headers are passive; doc notices require reading

---

## Decision Tree

Is the deprecation notice urgent (removal within 6 months)?
↓
YES → Both headers AND docs (maximum visibility)
NO → Long deprecation period (6+ months)?
    YES → Documentation notice is sufficient (deprecated flag + timeline)
    NO → Use both channels for all deprecations

---

## Rationale

Headers provide runtime deprecation awareness (consumers can monitor headers in their API clients). Documentation provides the full context (what, why, replacement, timeline). Urgent deprecations need both channels; longer deprecation periods can rely more on documentation.

---

## Recommended Default

**Default:** Both headers (Deprecation + Sunset + Link) and documentation updates
**Reason:** Headers enable passive monitoring; documentation provides migration context.

---

## Risks Of Wrong Choice

Documentation only: consumers don't see notices until they read docs. Headers only: consumers can't get migration context from a header alone.

---

## Related Rules

N/A

---

## Related Skills

N/A

---

## Deprecation Timeline Enforcement — Soft vs Hard Removal

---

## Decision Context

How strictly should the deprecation timeline be enforced? Arises when deciding what happens when the removal date arrives.

---

## Decision Criteria

* consumer impact — breaking existing integrations
* security — deprecated endpoints may have known vulnerabilities
* maintenance — supporting legacy endpoints has ongoing cost
* timeline — whether the stated removal date was firm or tentative

---

## Decision Tree

Is the deprecated endpoint actively maintained and secure?
↓
YES → Soft removal: return Sunset header + 410 with explanatory body (endpoint gone, but error is informative)
NO → Is the endpoint a security risk?
    YES → Hard removal: immediate 410 Gone, no graceful response
    NO → Soft removal with documented sunset date

---

## Rationale

Soft removal (410 with migration body) helps consumers fix broken integrations. Hard removal (immediate 410, possibly blank) is for security-driven removals where continued access is unacceptable.

---

## Recommended Default

**Default:** Soft removal — 410 Gone with migration instructions in response body
**Reason:** Helps consumers fix broken integrations without degrading security.

---

## Risks Of Wrong Choice

Hard removal without notice: consumers have no migration path, support requests spike. Soft removal indefinitely: no incentive to migrate, legacy endpoint costs continue.

---

## Related Rules

N/A

---

## Related Skills

N/A

---

## Deprecated Endpoint Lifecycle — Keep vs Remove After Sunset

---

## Decision Context

Should deprecated endpoint code be kept in the codebase after the sunset date? Arises when cleaning up after API version or endpoint removal.

---

## Decision Criteria

* codebase cleanliness — dead code accumulation
* historical reference — ability to serve 410 responses
* reversion risk — need to restore the endpoint if migration issues arise
* maintenance — continued dependency updates for dead code paths

---

## Decision Tree

Is there a business need to serve 410 responses for the removed endpoint?
↓
YES → Keep minimal handler that returns 410 Gone with migration instructions
NO → Is there a reversion risk (migration might fail)?
    YES → Keep code but disable route registration (feature flag)
    NO → Remove endpoint code entirely; rely on global fallback 404

---

## Rationale

Serving 410 responses requires keeping some code (at minimum a redirect or catch-all route). The alternative is letting the global 404 handle the removed endpoint, which provides no migration context. Minimal handlers (~10 lines) are acceptable maintenance cost.

---

## Recommended Default

**Default:** Remove endpoint code; global 404 fallback
**Reason:** Clean codebase, no dead code maintenance, single source of truth for existing behavior.

---

## Risks Of Wrong Choice

Keeping dead code: accumulates over multiple deprecations, maintenance burden, security scan noise. Removing without 410: consumers get generic 404 with no migration context.

---

## Related Rules

N/A

---

## Related Skills

N/A
