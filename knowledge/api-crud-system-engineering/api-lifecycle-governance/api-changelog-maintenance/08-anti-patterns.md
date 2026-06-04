# ECC Anti-Patterns — API Changelog Maintenance

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Lifecycle & Governance |
| **Knowledge Unit** | API Changelog Maintenance |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Fully Automated Changelog With No Human Review
2. Changelog as an Afterthought — No CI Gating
3. Breaking Changes Buried in Standard Entries
4. Deprecation Entries Without Migration Guide Links
5. No Unreleased Section — Changes Lost Between Releases

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Ticket-Driven Development

---

## Anti-Pattern 1: Fully Automated Changelog With No Human Review

### Category
Maintainability

### Description
Generating changelog entries entirely from commit messages, PR titles, or automated diff tools without human review, producing entries that are technically accurate but lack narrative clarity and consumer context.

### Why It Happens
Automation is more efficient than manual writing. Teams build a CI pipeline that extracts commit messages or PR titles and appends them to the changelog. They believe that if the data is accurate, the changelog is adequate. Narrative quality is sacrificed for consistency.

### Warning Signs
- Changelog contains raw commit messages like "fix: WIP user stuff"
- Entries use internal jargon, ticket numbers, or developer shorthand
- No distinction between consumer-facing changes and internal refactoring
- Changelog reads like a machine log rather than a narrative
- Consumers cannot understand what changed without reading source code
- "Updated dependencies" or "Refactored controller" appear in consumer-facing changelog

### Why It Is Harmful
Consumers read changelogs to understand "what do I need to do differently?" A fully automated changelog forces consumers to decode developer language. Internal refactoring entries add noise. Missing context creates uncertainty — consumers cannot assess whether a change affects them. The changelog becomes an unfiltered data dump that consumers stop reading.

### Real-World Consequences
The automated changelog entry reads: "refactor(users): extract query builder to repository, add cursor pagination support (#1589)". A consumer reads "refactor" and skips it, assuming internal cleanup. The entry's actual consumer impact is a breaking change: the pagination format changed from offset-based to cursor-based. The consumer's integration breaks because they didn't realize the "refactor" was a breaking change.

### Preferred Alternative
Use a hybrid model: auto-extract from structured PR descriptions via CI, then require manual review and editing before release.

### Refactoring Strategy
1. Implement structured changelog blocks in PR description templates
2. CI extracts the structured block on merge
3. Before each release, a human reviews and edits entries for clarity, tone, and consumer context
4. Remove internal-only entries that don't affect consumers
5. Convert developer language to consumer-facing language

### Detection Checklist
- [ ] Review changelog entries for internal jargon and commit-message style
- [ ] Count entries that are not consumer-facing (internal refactoring, dependency updates)
- [ ] Verify human review step exists before releases
- [ ] Check if consumer could understand each entry without reading source code
- [ ] Survey consumers — do they find the changelog helpful?

### Related Rules
- Auto-Extract from PR Descriptions, Curate Manually (05-rules.md)

### Related Skills
- Implement API Changelog Maintenance (06-skills.md)

### Related Decision Trees
- Changelog Generation Approach (07-decision-trees.md)

---

## Anti-Pattern 2: Changelog as an Afterthought — No CI Gating

### Category
Maintainability

### Description
Relying on developer discipline to update the changelog without CI enforcement, resulting in forgotten entries and incomplete release notes.

### Why It Happens
Changelog updates are treated as "documentation" rather than "code." Without CI gating, they are easily deprioritized. Developers focus on the functional change and forget to document it. At release time, the changelog is written from memory or git log — inaccurate and incomplete.

### Warning Signs
- No CI step checks for changelog updates on API-changing PRs
- Changelog is updated sporadically — sometimes days after changes
- Release notes are written from git log because the changelog is incomplete
- Entries are missing for known API changes
- Support team discovers undocumented changes when consumers report unexpected behavior
- Changelog is updated only when someone remembers before a release

### Why It Is Harmful
An incomplete changelog erodes consumer trust. When consumers discover undocumented changes at runtime, they feel the API provider does not respect their integration effort. Changelog gaps also create support burden — every undocumented change generates "what changed?" tickets.

### Real-World Consequences
A team adds a new `filter` query parameter to `GET /users`. No changelog entry is created. A consumer who has been asking for filter support checks the changelog weekly. They miss the feature for 3 months because it was never documented. When they finally discover it through a colleague, they are frustrated — they wasted months of manual filtering because the changelog was incomplete.

### Preferred Alternative
Gate releases on changelog updates in CI. Block PRs with API changes that lack corresponding changelog entries.

### Refactoring Strategy
1. Add a CI step that detects API changes (route diffs, OpenAPI spec changes)
2. When API changes are detected, require a changelog entry in the PR body
3. Block PRs that modify API routes without a changelog entry
4. Validate changelog entry format (must include category, endpoint, and description)
5. Include changelog check in the PR merge requirements

### Detection Checklist
- [ ] Check CI pipeline for changelog validation
- [ ] Test that a PR with API change but no changelog entry is blocked
- [ ] Verify changelog entries exist for known recent API changes
- [ ] Review changelog update timestamps — are they aligned with code changes?
- [ ] Confirm changelog validation is in the PR merge requirements

### Related Rules
- Gate Releases on Changelog Updates in CI (05-rules.md)

### Related Skills
- Implement API Changelog Maintenance (06-skills.md)

### Related Decision Trees
- Changelog Generation Approach (07-decision-trees.md)

---

## Anti-Pattern 3: Breaking Changes Buried in Standard Entries

### Category
Documentation

### Description
Listing breaking changes under a standard "Changed" heading without `[BREAKING]` markers, causing consumers to overlook critical migration requirements.

### Why It Happens
Breaking changes are just "changes" to the team that made them. The developer may not realize the change is breaking, or may assume consumers will notice the different behavior. Teams sometimes omit the breaking label to avoid drawing attention to the disruption.

### Warning Signs
- Breaking changes listed under "Changed" without a `[BREAKING]` tag
- No visual distinction between breaking and non-breaking entries
- Consumers report discovering breaking changes at runtime
- "I didn't see that in the changelog" is a common response
- Breaking changes are described with neutral language that masks impact
- The changelog has no separate breaking change section or markers

### Why It Is Harmful
Consumers scan changelogs for breaking changes — these require code changes, testing, and deployment coordination. When breaking changes are buried in standard entries, consumers miss them. Their integrations break at runtime. The changelog fails its most critical function: alerting consumers to actions they must take.

### Real-World Consequences
A changelog entry reads: "Changed response format for GET /users pagination metadata." Buried under a standard "Changed" heading with no `[BREAKING]` marker. The consumer skims the entry, assumes it's cosmetic (renamed fields, not breaking). In reality, the pagination format changed from offset-based to cursor-based. The consumer's pagination loop breaks. Thousands of pages fail to load.

### Preferred Alternative
Append `[BREAKING]` to the category header or entry title for changes that break backward compatibility. Group breaking changes together at the top of the release.

### Refactoring Strategy
1. Audit the changelog for breaking changes that lack `[BREAKING]` markers
2. Add `[BREAKING]` tags to all identified entries
3. Establish a "breaking change" review check: before each release, confirm all breaking entries are correctly labeled
4. Group breaking changes together in a prominent section
5. Require `[BREAKING]` in the PR template for any change marked as breaking

### Detection Checklist
- [ ] Search changelog for breaking changes without `[BREAKING]` markers
- [ ] Verify every breaking change entry has the marker
- [ ] Confirm breaking changes are grouped in a prominent section
- [ ] Review consumer feedback — are consumers surprised by breaking changes?
- [ ] Add a CI check that flags breaking changes lacking the marker

### Related Rules
- Mark Breaking Changes Visibly (05-rules.md)

### Related Skills
- Implement API Changelog Maintenance (06-skills.md)

### Related Decision Trees
- Breaking Change Documentation Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Deprecation Entries Without Migration Guide Links

### Category
Documentation

### Description
Listing deprecated endpoints in the changelog without linking to a migration guide, forcing consumers to search for upgrade instructions.

### Why It Happens
The migration guide may not exist yet when the deprecation entry is written. The team intends to write it "before the cutoff" but writes the changelog entry immediately to announce the deprecation. The migration guide is never added because the deprecation window seems long enough.

### Warning Signs
- Deprecated entries appear in changelog without hyperlinks
- Deprecation notice says "use v2 instead" but does not link to v2 docs or migration guide
- Consumers ask "where are the migration instructions?" after reading the changelog
- Support tickets reference "the changelog said it's deprecated but didn't say how to migrate"
- Migration guide is mentioned in the entry text but not linked
- Deprecation entries have no `Link` header or URL reference

### Why It Is Harmful
Consumers who see a deprecation entry need immediate access to migration instructions. If they must search for the guide, they may find outdated or incorrect information. The deprecation notification (changelog) and the migration guidance (migration guide) are disconnected, creating friction at the moment consumers are most motivated to migrate.

### Real-World Consequences
A consumer reads a changelog entry: "Deprecated — GET /v1/users — Use /v2/users instead." No link. The consumer searches the docs for "v1 v2 migration" and finds a community-written guide that is partially incorrect. They migrate based on the wrong guide. Their integration uses the wrong endpoint format. They must re-migrate when the incorrect integration fails.

### Preferred Alternative
Every changelog entry in the Deprecated section must include a hyperlink to the corresponding migration guide.

### Refactoring Strategy
1. Audit all Deprecated entries in the changelog for missing migration links
2. Write migration guides for any deprecations that lack them
3. Add hyperlinks to existing migration guides in each entry
4. Create a PR template rule: deprecation entries require migration link
5. Add a CI check that flags Deprecated entries without hyperlinks

### Detection Checklist
- [ ] Check Deprecated entries for missing migration link
- [ ] Verify migration guide exists at the linked URL
- [ ] Confirm the migration guide covers all differences between old and new
- [ ] Test that a consumer can migrate using only the changelog entry and linked guide
- [ ] Add CI check for migration link presence in Deprecated entries

### Related Rules
- Link Deprecation Entries to Migration Guides (05-rules.md)

### Related Skills
- Implement API Changelog Maintenance (06-skills.md)

### Related Decision Trees
- Breaking Change Documentation Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: No Unreleased Section — Changes Lost Between Releases

### Category
Maintainability

### Description
Tracking changes only in released version sections, with no `[Unreleased]` section for changes not yet in a release, causing entries to be forgotten or written retrospectively.

### Why It Happens
Teams start the changelog with a single version entry. As changes accumulate between releases, no one creates the `[Unreleased]` section. At release time, entries must be reconstructed from git log or memory — a process that inevitably misses changes.

### Warning Signs
- Changelog has only released version sections
- No `[Unreleased]` section at the top of the file
- Release entries are written from git log, not from accumulated unreleased changes
- Changes made between releases are undocumented
- Release preparation includes a "write the changelog" step that takes hours
- Entries are missing for known changes because they were "forgotten"

### Why It Is Harmful
Without an `[Unreleased]` section, every change made during the development cycle is at risk of being omitted from the changelog. The release changelog becomes an exercise in archaeology — digging through git history and hoping nothing is missed. Consumers lose visibility into what is coming, and the team loses confidence that the changelog is complete.

### Real-World Consequences
A team releases v2.3.0. They have no `[Unreleased]` section. They must reconstruct the changelog from git log. They miss three changes: a new `sort` parameter on `GET /users`, a deprecated `page` parameter, and a bug fix for the export endpoint. Three consumers independently discover these undocumented changes over the next two weeks. Each files a support ticket.

### Preferred Alternative
Maintain an `[Unreleased]` section at the top of the changelog tracking all changes not yet in a release. Move entries to the version section when a release is cut.

### Refactoring Strategy
1. Add an `[Unreleased]` section to the changelog with all standard subheadings
2. Require changelog entries in the `[Unreleased]` section for every API change PR
3. Before releasing, move `[Unreleased]` entries to the new version section
4. Clear the `[Unreleased]` section after release cut
5. Verify the released entries match the accumulated unreleased entries

### Detection Checklist
- [ ] Check if `[Unreleased]` section exists in the changelog
- [ ] Verify unreleased entries exist for changes since the last release
- [ ] Test that PRs with API changes add entries to the unreleased section
- [ ] Confirm release preparation includes moving unreleased entries
- [ ] Review past releases for missing entries that should have been in unreleased

### Related Rules
- Maintain an Unreleased Section (05-rules.md)

### Related Skills
- Implement API Changelog Maintenance (06-skills.md)

### Related Decision Trees
- Changelog Format and Structure (07-decision-trees.md)

---

