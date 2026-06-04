# API Changelog Maintenance

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
API changelog maintenance covers the format, generation, and lifecycle of API change documentation. A well-maintained changelog serves as the single source of truth for what has changed, what is deprecated, and what is coming next. Automation ensures consistency, while manual curation ensures readability.

## Core Concepts
- **Keep a Changelog Format:** Standardized changelog sections (Added, Changed, Deprecated, Removed, Fixed, Security).
- **Semantic Versioning Integration:** Changelog entries are grouped by API version/release.
- **Automated Generation:** Tooling that extracts changelog entries from commit messages, PR titles, or annotation metadata.
- **Manual Curation:** Human review of auto-generated entries for clarity, tone, and completeness.
- **Changelog API Endpoint:** A machine-readable changelog endpoint (e.g., `/changelog.json`) for automated tooling.
- **Breaking Change Markers:** Visual or textual indicators highlighting entries that contain breaking changes.

## Mental Models
- **Ship's Log:** Like a captain's log recording every significant event during a voyage — date, event, impact. The changelog chronicles the API's journey.
- **Medicine Insert:** Like FDA-required medication guides that list all changes, side effects (breaking changes), and dosage (migration steps) — consumers read this before using.

## Internal Mechanics
1. **Source of Truth:** Changelog entries originate in PR descriptions using a structured format (e.g., `### Changelog: Added | POST /v2/orders`).
2. **CI Extraction:** On merge, CI parses the PR body for changelog blocks and appends them to `CHANGELOG.md`.
3. **Manual Review:** A maintainer reviews the auto-generated changelog before each release, rewriting entries for clarity.
4. **Publication:** The changelog is published to the developer portal, an RSS feed, and a JSON endpoint.
5. **Versioning:** Each API release gets a changelog section tagged with the version number and release date.
6. **Archival:** Old changelog entries are collapsed or archived after 2 years but remain accessible.

## Patterns
- **Unreleased Section:** A `[Unreleased]` section at the top tracks changes not yet in a release — consumers can see upcoming changes.
- **Changelog-Driven Deprecation:** Every deprecation must have a corresponding changelog entry before the `Deprecation` header is served.
- **Categorization Sorting:** Entries within a release are sorted by category (Added > Changed > Deprecated > Removed > Fixed > Security) then by endpoint path.
- **Ticket References:** Each entry links to the relevant issue/ticket for traceability.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Format | Keep a Changelog / Custom | Keep a Changelog (v1.1.0) | Industry standard, well-understood |
| Generation | Fully automated / Manual / Hybrid | Hybrid (auto-extract + manual review) | Balances accuracy with readability |
| Publishing channel | GitHub Releases / Portal / Both | Both + JSON endpoint | Maximizes consumer reach |
| Changelog location | Monorepo / Per-service | Per-service changelog + aggregated index | Supports multi-service architecture |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Auto-generation vs manual curation | Auto is consistent but reads like a robot; manual is readable but inconsistent in timing |
| Per-service vs unified changelog | Per-service is precise; unified gives a platform-wide view |
| Detailed vs summary entries | Detailed entries aid debugging; summary entries are easier to scan |

## Performance Considerations
- Changelog generation in CI adds negligible time (parse PR body → append to file).
- JSON changelog endpoint should be cached (CDN or application cache) — regenerated on each release.
- Changelog files should be kept under 1 MB; older entries can be split into `CHANGELOG-ARCHIVE.md`.

## Production Considerations
- **Monitoring:** Alert if no changelog entry exists for a merged PR with API changes (enforced in CI).
- **Logging:** Log who approved each changelog entry for audit purposes.
- **Backup:** Changelog is version-controlled in git — no separate backup needed.
- **Rollback:** Revert a changelog entry via git revert if incorrect.
- **Testing:** CI test that validates changelog format (required sections, no placeholder text).

## Common Mistakes
- Writing changelog entries that only developers understand (avoid jargon).
- Forgetting to update the changelog before a release — enforced by CI gating.
- Including internal refactoring that has no consumer-facing impact.
- Using vague language ("improved performance") without measurable specifics.
- Not linking to migration guides for deprecation entries.

## Failure Modes
- **Stale Changelog:** No entries for 3+ releases. Mitigation: CI gating blocks releases without changelog updates.
- **Inaccurate Entry:** Entry says "Added" but endpoint was never deployed. Mitigation: cross-reference changelog with OpenAPI spec.
- **Missed Breaking Change:** A breaking change is released without a changelog marker. Mitigation: automated diff analysis between OpenAPI specs.
- **Format Drift:** Entries deviate from the Keep a Changelog format over time. Mitigation: linting on every PR.

## Ecosystem Usage
- **Stripe:** Changelog is detailed, categorized, and always includes migration paths for breaking changes.
- **GitHub:** Publishes a "Changes" section with each API version and maintains a public roadmap.
- **OpenAI:** API changelog is published on their docs site with dates, categories, and links to relevant guides.

## Related Knowledge Units

### Prerequisites
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)
- [Deprecation Policy Design](ku-01-deprecation-policy-design)

### Related Topics
- [API Style Guide Documentation](ku-17-api-style-guide-documentation)
- [Breaking Change Process](ku-05-breaking-change-process)

### Advanced Follow-up Topics
- Automated OpenAPI-to-changelog diff generation
- Changelog RSS/Atom feed implementation
- Consumer changelog subscription and notification system

## Research Notes

### Source Analysis
Keep a Changelog (v1.1.0) is the de facto standard format. Stripe's implementation adds the innovation of linking every entry to a migration guide — a pattern worth adopting.

### Key Insight
The hybrid generation model (auto-extract + manual review) is the sweet spot. Fully automated changelogs produce entries that are technically correct but lack narrative flow. Manual-only changelogs are inconsistent. The PR description as the source of truth ties changelog entries to the review process.

### Version-Specific Notes
- Laravel 11.x: No built-in changelog generation; use custom GitHub Actions or a changelog CLI tool.
- PHP 8.4: `ChangelogBuilder` can be written as a CLI script reading structured PR descriptions via GitHub API.
