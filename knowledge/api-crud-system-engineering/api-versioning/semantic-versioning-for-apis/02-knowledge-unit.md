# Semantic Versioning for APIs — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Semantic versioning (SemVer) for APIs applies the MAJOR.MINOR.PATCH convention to API contracts. Phase 2 covers defining what each level means for API consumers, implementing version detection, choosing between URL path major versions and header/sub-version approaches, and tooling for automated version calculation.

## Core Concepts
- **SemVer for APIs:** MAJOR = breaking change, MINOR = backward-compatible addition, PATCH = bug fix (no contract change).
- **API vs Library SemVer:** API SemVer applies to the contract, not the implementation. A library patch may be an API major if it changes the contract.
- **Pre-release Identifiers:** `-alpha`, `-beta`, `-rc.1` for preview API versions.
- **Version Compatibility Declaration:** Documenting what compatibility guarantees each version level provides.

## Mental Models
- **Contract Levels:** MAJOR is a new contract edition. MINOR is an addendum. PATCH is a typo fix in the fine print.
- **Traffic Light:** MAJOR = red (stop, review), MINOR = yellow (caution, review additions), PATCH = green (safe upgrade).

## Internal Mechanics
- API version is declared in a `composer.json`-style manifest: `config('api.version')` with `major`, `minor`, `patch`.
- Route version (URL path) follows MAJOR only: `/api/v1`. MINOR/PATCH changes don't change the URL.
- Change detection (OpenAPI diff) automatically determines version bump: breaking → MAJOR, new fields → MINOR, no changes → PATCH.
- Version compatibility declared in the API root endpoint: `GET /api` returns supported versions and their status.

## Patterns
- Version manifest file: `config/api-version.php` with `current`, `supported_versions`, `deprecated_versions`.
- Automated version bump in CI based on conventional commit analysis.
- MINOR version communicated via response headers (`X-API-Minor-Version`) or changelog.
- PATCH releases deployed transparently with no consumer-visible changes.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| URL version scope | MAJOR only | Keeps URL stable within a major |
| Minor version visibility | Header or changelog only | Avoids URL clutter |
| Pre-release versions | Separate preview endpoints | Consumer opt-in |
| Version detection | OpenAPI diff in CI | Automated, objective |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| MAJOR-only in URL | Simple, clean URLs | Hides minor/patch differences |
| Full SemVer in URL | Precise | Bloated URLs `/api/v1.2.3/` |
| MINOR in headers | Informative | Extra header parsing |
| No MINOR/PATCH exposure | Simple | Consumers can't express "fine with minor upgrades" |

## Performance Considerations
- OpenAPI diff for version detection runs in CI — zero runtime cost.
- Version header injection adds negligible overhead.
- `config('api.version')` reads are cached by Laravel config — O(1).

## Production Considerations
- Publish a version compatibility table in API documentation.
- MINOR version bumps should be announced even if consumers don't need to act.
- PATCH releases should be deployable without any consumer communication.
- Maintain a version changelog mapping API versions to release dates and changes.

## Common Mistakes
- Bumping MAJOR for internal refactors that don't change the contract.
- Bumping MINOR for breaking changes to avoid the MAJOR version conversation.
- Inconsistent version bumping across microservices (different services claim different major versions for the same contract).
- Not documenting what the version numbers mean for your specific API.

## Failure Modes
- **Version inflation:** MAJOR bumped too frequently → consumers ignore version signals.
- **Version stagnation:** Fear of MAJOR bumps leads to breaking changes shipped as MINOR.
- **Version misalignment:** API version and SDK version get out of sync.
- **Version ambiguity:** "v2" URL but documentation says "v2.3" — consumers confused.

## Ecosystem Usage
- **Stripe:** API version 2023-08-16 (date-based MAJOR), MINOR changes via header.
- **GitHub:** API v3 (MAJOR), preview features as MINOR via Accept header.
- **Stripe SDK:** Composer package versions align with API features but use SemVer independently.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Breaking change identification
- When to create new version

### Advanced Follow-up Topics
- Automated version calculation
- API compatibility policies

## Research Notes
### Source Analysis
SemVer specification by Tom Preston-Werner (2013) is the foundation. Stripe's date-based versioning (2015) is a notable adaptation. The "SemVer for APIs" concept is documented in the Google API Design Guide.

### Key Insight
API SemVer differs from library SemVer in one critical way: an API PATCH changes only the implementation behavior (bug fix), never the contract. Any contract change is at least MINOR.

### Version-Specific Notes
Laravel has no built-in SemVer for APIs. Implement version manifest manually or via dedicated packages.
