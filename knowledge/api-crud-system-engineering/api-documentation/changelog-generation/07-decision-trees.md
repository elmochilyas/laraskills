# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Changelog Generation
**Generated:** 2026-06-03

---

# Decision Inventory

* Changelog source (spec diff vs git conventional commits)
* Changelog scope (all versions vs major versions only)
* CI validation (required vs optional changelog entries)

---

# Architecture-Level Decision Trees

---

## Changelog Source — Spec Diff vs Git Conventional Commits

---

## Decision Context

How should changelog entries be generated — from spec diffs or from git commit history? Arises when setting up the changelog generation process.

---

## Decision Criteria

* accuracy — spec diff shows actual API changes; commits show developer intent
* automation — percentage of entries that can be auto-generated
* curation — level of human review needed before publishing
* tooling — available tools for spec diff vs Conventional Commits

---

## Decision Tree

Is the OpenAPI spec the single source of truth for the API contract?
↓
YES → Use spec diff (compare two spec versions) as primary source
NO → Use conventional commits (feat:, fix:, deprecate: prefixes) as primary source

In both cases: human curate with migration notes after auto-generation.

---

## Rationale

Spec diff shows exactly what changed in the API contract (endpoints added, fields changed, parameters removed). Conventional commits show developer intent but may miss API-level changes or include irrelevant internal changes. Spec diff is more accurate for consumer-facing changelogs.

---

## Recommended Default

**Default:** Spec diff as the primary source, with human curation
**Reason:** Spec diff reveals actual contract changes that matter to consumers, without internal noise.

---

## Risks Of Wrong Choice

Conventional commits only: consumer-facing API changes mixed with internal refactoring, missed changes where commit message didn't follow convention.

---

## Related Rules

N/A

---

## Related Skills

N/A

---

## Changelog Scope — All Versions vs Major Versions Only

---

## Decision Context

Should changelogs be maintained for every version (including patches) or only major versions? Arises when deciding changelog granularity.

---

## Decision Criteria

* consumer awareness — patch changes can still affect integrations
* maintenance burden — documenting every patch is overhead
* impact assessment — breaking changes vs backward-compatible additions
* versioning scheme — semantic versioning includes meaningful patches

---

## Decision Tree

Is every version release publicly available to consumers?
↓
YES → Changelog every version (patch, minor, major)
NO → Do patch releases affect API behavior?
    YES → Changelog patches that affect API (skip internal-only patches)
    NO → Changelog only minor and major versions

---

## Rationale

Consumers on a specific version need to know about patch changes that affect behavior. However, internal-only patches (Dockerfile changes, CI changes, README fixes) don't need changelog entries.

---

## Recommended Default

**Default:** Changelog all versions that change API behavior (skip internal-only releases)
**Reason:** Consumers need complete visibility into API-affecting changes while filtering out internal noise.

---

## Risks Of Wrong Choice

Major versions only: consumers miss behavior-affecting patches, causing runtime surprises. All versions including internal: changelog noise obscures meaningful changes.

---

## Related Rules

N/A

---

## Related Skills

N/A

---

## CI Validation — Required vs Optional Changelog Entries

---

## Decision Context

Should CI require a changelog entry for every API change? Arises when integrating changelog generation into the CI pipeline.

---

## Decision Criteria

* enforcement — preventing undocumented changes
* friction — developer overhead for trivial/internal changes
* automation — ability to auto-detect if change needs changelog entry
* documentation culture — team's investment in documentation quality

---

## Decision Tree

Does the PR modify API routes, schemas, or operation parameters?
↓
YES → CI must require a changelog entry (breaking or non-breaking)
NO → Internal-only change (config, CI, tests)?
    YES → Changelog entry optional (skip if not consumer-facing)
    NO → CI passes without changelog entry

---

## Rationale

API-affecting changes (routes, schemas, parameters) always need changelog entries — consumers must know what changed. Internal changes don't need changelog entries. Auto-detection via spec diff or route file analysis can gate the requirement.

---

## Recommended Default

**Default:** CI requires changelog entry when API routes/schemas change
**Reason:** Prevents undocumented API changes while avoiding friction for internal-only work.

---

## Risks Of Wrong Choice

Required for all changes: developers bypass with "minor" entries, internal changes pollute changelog. Optional always: undocumented API changes slip through, consumers discover changes at runtime.

---

## Related Rules

N/A

---

## Related Skills

N/A
