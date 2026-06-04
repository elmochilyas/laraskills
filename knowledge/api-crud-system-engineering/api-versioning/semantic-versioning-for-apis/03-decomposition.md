# Semantic Versioning for APIs — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers the operational lifecycle of semantic versioning: maintaining the version manifest, managing version compatibility commitments, auditing version bump discipline, handling version overlap between services, and planning long-term version strategy based on SemVer patterns.

## Core Concepts
- **Version Manifest:** Central record of current and supported API versions with their SemVer status.
- **Compatibility Window:** How far back the API promises backward compatibility (e.g., "all V1.x versions are compatible").
- **Version Audit:** Periodic review of version bump discipline across the team or organization.
- **Long-Term Support (LTS) Versions:** Selected major versions with extended support windows.

## Mental Models
- **Software Release Train:** Versions are trains on a schedule. MAJOR versions are annual trains. MINOR versions are monthly trains. PATCH versions are on-demand shuttles. Each has a different boarding window.
- **Warranty Period:** The API's version commitment is a product warranty. MAJOR version gets a 2-year warranty (backward compatibility). MINOR gets 6 months. PATCH is "best effort."

## Internal Mechanics
- Version manifest is a published JSON file at `/.well-known/api-version.json` (or similar).
- CI enforces conventional commit prefixes and maps them to version bumps.
- Version bump history is maintained in a changelog with automated release notes.
- Cross-service version coordination: a registry syncs version manifests across microservices.

## Patterns
- Version compatibility matrix published in API documentation, updated automatically.
- LTS version designation: selected major versions get extra support (12+ months deprecation).
- Version sunset calculator: based on version manifest, calculates automatic sunset dates.
- Cross-service version alignment: shared contract versions stay synchronized across services.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| LTS policy | Every 3rd major version | Predictable schedule |
| Support window | MAJOR: 24mo, MINOR: 6mo, PATCH: indefinite | Industry standard |
| Version manifest format | JSON at standard URL | Easy discovery |
| Bump enforcement | CI gate with override | Prevents accidents, allows exceptions |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Strict CI enforcement | Consistent versioning | May block urgent patches |
| Flexible policy | Adaptable | Inconsistent versioning |
| LTS versions | Predictable stability | Support burden on old versions |
| No LTS | Always current | Consumer uncertainty |

## Performance Considerations
- Version manifest generation is a CI concern, no runtime cost.
- Well-known endpoint (`/.well-known/api-version.json`) is a static file or cached response.
- Cross-service sync runs on a schedule, not at request time.

## Production Considerations
- Publish the version manifest at a stable URL so consumers can programmatically check.
- Send version update notifications via webhook or email when version manifest changes.
- Maintain a "version health" dashboard showing support windows and upcoming sunsets.
- Document the SemVer policy in the API's terms of service or developer agreement.

## Common Mistakes
- Promising "semantic versioning" but not defining what major/minor/patch mean for your specific API.
- Committing to backward compatibility "forever" — version 2 should be allowed to exist.
- Ignoring the version manifest when making breaking changes.
- Not communicating version bumps to consumers in a timely manner.

## Failure Modes
- **Version commitment mismatch:** API promises SemVer but breaks compatibility within a major.
- **No enforcement:** Developers claim to follow SemVer but CI doesn't enforce it.
- **Consumer version blindness:** Consumer ignores version headers, uses API wrong, blames the provider.
- **LTS burden:** Too many LTS versions to maintain, team can't keep up.

## Ecosystem Usage
- **Stripe:** Date-based versioning with API version pinned per request. Changelog documents every version.
- **GitHub:** Long-term v3 API with preview features. 12+ month deprecation window for major changes.
- **DigitalOcean:** Full SemVer in documentation, MAJOR in URL path, changelog for MINOR/PATCH.

## Related Knowledge Units
- **Prerequisites:** Release management, Conventional commits
- **Related Topics:** Version retirement policy, Phased deprecation timeline
- **Advanced Follow-up:** API lifecycle management platforms, Version compliance tooling

## Research Notes
### Source Analysis
semver.org (Tom Preston-Werner, 2013) is the foundational spec. Stripe's 2023 documentation on API versioning is the leading industry implementation. The concept of LTS API versions is adapted from Node.js LTS (2015).

### Key Insight
SemVer for APIs is more about communication than mechanics. The version number is a signal to consumers: "trust this upgrade" (PATCH), "look at the changelog" (MINOR), or "prepare for work" (MAJOR).

### Version-Specific Notes
Laravel itself follows SemVer (currently on version 11.x). Its own API stability policy (no breaking changes in minor releases) is a reference model for API SemVer.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization