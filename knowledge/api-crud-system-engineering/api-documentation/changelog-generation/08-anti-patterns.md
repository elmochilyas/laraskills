# ECC Anti-Patterns — Changelog Generation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Changelog Generation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Changelog Only for Major Versions
2. Vague Generic Descriptions
3. No Migration Guidance for Breaking Changes
4. No CI Enforcement for Changelog Entries
5. Removing Historical Changelog Entries

---

## Repository-Wide Anti-Patterns

- Premature Optimization

---

## Anti-Pattern 1: Changelog Only for Major Versions

### Category
Documentation

### Description
Only documenting changes for major version releases while skipping minor and patch versions, leaving consumers blind to important changes between major versions.

### Why It Happens
Major versions are "big enough" to warrant documentation. Minor and patch releases feel too incremental to document.

### Warning Signs
- Changelog has entries only for v2.0.0, v1.0.0
- No entries for v2.1.0, v2.0.1, v2.0.2
- Consumers ask "what changed in the latest update?"
- Release notes only for "big" releases

### Why It Is Harmful
Consumers cannot assess whether a minor or patch update requires changes to their integration. They must either ignore the update, diff the spec manually, or contact support. Trust in the release process erodes.

### Real-World Consequences
A patch release fixes a bug in the pagination response format. The changelog doesn't mention it because it's "just a patch." A consumer's integration breaks because they relied on the buggy format. They discover the fix only when their tests fail.

### Preferred Alternative
Create a changelog entry for every released version — major, minor, and patch — with categorized changes.

### Refactoring Strategy
1. Add CI step requiring changelog entry for any production release
2. Categorize each entry (Added, Changed, Deprecated, Removed, Fixed, Security)
3. Include version number and date for every release
4. Review changelog as part of release checklist

### Detection Checklist
- [ ] Check if changelog has entries for minor/patch versions
- [ ] Verify every version number appears in changelog
- [ ] Confirm release process checks changelog completeness

### Related Rules
- Document Every Version Release Including Patches (05-rules.md)

### Related Skills
- (Changelog generation skills)

### Related Decision Trees
- (Documentation decisions)

---

## Anti-Pattern 2: Vague Generic Descriptions

### Category
Documentation

### Description
Writing changelog entries with generic phrases like "Bug fixes and performance improvements" that provide no actionable information to consumers.

### Why It Happens
Entries are written at the last minute. Developers don't want to write detailed descriptions. Generic entries pass the changelog requirement without meaningful content.

### Warning Signs
- "Bug fixes" or "Performance improvements" as the entire entry
- No endpoint paths mentioned
- No description of what the fix actually changes
- Consumers cannot determine if they need to update their integration

### Why It Is Harmful
Consumers cannot assess whether a change affects them. They must read changelogs for every release or ignore them entirely. The changelog becomes noise that everyone stops reading.

### Real-World Consequences
A changelog entry says "Fixed a bug in user listing." Consumers ignore it — it sounds minor. Actually, the bug fix changed the response format for paginated user lists. Their integration breaks silently.

### Preferred Alternative
Write specific descriptions including endpoint path, what changed, and the consumer impact.

### Refactoring Strategy
1. Require endpoint paths in change descriptions
2. Describe before/after behavior explicitly
3. Include "impact: none" or "impact: migration required" tags
4. Review changelog entries for specificity before release

### Detection Checklist
- [ ] Check for generic phrases in changelog
- [ ] Verify entries mention specific endpoints
- [ ] Confirm consumer impact is described

### Related Rules
- Use Specific Descriptions Not Generic Categories (05-rules.md)

### Related Skills
- (Changelog generation skills)

### Related Decision Trees
- (Documentation quality decisions)

---

## Anti-Pattern 3: No Migration Guidance for Breaking Changes

### Category
Documentation

### Description
Documenting breaking changes without step-by-step migration instructions, forcing consumers to reverse-engineer the correct migration path.

### Why It Happens
Breaking changes are documented as "what changed" without "how to update." The development team knows the fix but doesn't write it down.

### Warning Signs
- Breaking changes described only as "Changed X endpoint"
- No before/after code examples
- No migration steps or checklist
- Support team receives "how do I upgrade?" questions after each breaking release

### Why It Is Harmful
Consumers don't know how to update their integration. They must experiment or contact support. Migration takes longer, and some consumers delay upgrading indefinitely.

### Real-World Consequences
A breaking change splits the `name` field into `first_name` and `last_name`. The changelog says "name field split into first_name and last_name." The consumer doesn't know how to concatenate values or handle null cases. They delay upgrading for 6 months.

### Preferred Alternative
Pair every breaking change with migration instructions: before/after code examples, edge-case handling, and rollback procedure.

### Refactoring Strategy
1. Add "Migration" subsection to each breaking change entry
2. Include before/after request/response examples
3. Describe edge cases and error handling
4. Link to full migration guide if changes are complex

### Detection Checklist
- [ ] Check breaking change entries for migration instructions
- [ ] Verify before/after examples are provided
- [ ] Confirm edge cases are addressed

### Related Rules
- Combine Automated Spec Diff With Curated Migration Notes (05-rules.md)

### Related Skills
- (Changelog generation skills)

### Related Decision Trees
- (Breaking change documentation decisions)

---

## Anti-Pattern 4: No CI Enforcement for Changelog Entries

### Category
Testing

### Description
Relying on developer discipline to write changelog entries without CI validation, resulting in forgotten entries and incomplete release notes.

### Why It Happens
No automated check exists. Developers forget to update the changelog during development and it's too late to reconstruct at release time.

### Warning Signs
- No CI step checking for changelog updates
- PRs modifying routes but no changelog entry
- Release process does not include changelog review
- Changelog is updated retrospectively (inaccurate)

### Why It Is Harmful
The changelog becomes incomplete — entries are missed or written from memory days after the change. Consumers cannot trust that the changelog reflects all changes.

### Real-World Consequences
A PR adds a new endpoint but forgets to update the changelog. The release goes out. A consumer building on the API doesn't know about the new endpoint. They duplicate effort building a workaround.

### Preferred Alternative
Add CI validation that blocks PRs modifying API routes from merging without a changelog entry.

### Refactoring Strategy
1. Add CI step that checks for changelog modifications when routes change
2. Configure the check to validate changelog format
3. Include the check in PR merge requirements
4. Add automated release notes generation step

### Detection Checklist
- [ ] Check CI pipeline for changelog validation
- [ ] Verify PRs modifying routes require changelog entry
- [ ] Test CI rejection of missing changelog

### Related Rules
- Validate Changelog Presence In CI For Route Changes (05-rules.md)

### Related Skills
- (CI/CD documentation validation)

### Related Decision Trees
- (Process automation decisions)

---

## Anti-Pattern 5: Removing Historical Changelog Entries

### Category
Maintainability

### Description
Deleting changelog entries for older versions when new versions are released, leaving consumers on older systems without reference material.

### Why It Happens
The changelog file is "cleaned up" to keep it short. Older entries are considered irrelevant.

### Warning Signs
- Changelog only contains entries for the latest version
- Consumers on older versions cannot find past changelogs
- No archive or historical changelog available
- Changelog is labeled "current version only"

### Why It Is Harmful
Consumers still running older versions need historical changelog entries to plan their upgrade path. Without historical context, they cannot determine what changed between their version and the current one.

### Real-World Consequences
A consumer is running v1.2 and wants to upgrade to v2.0. The changelog only shows v2.0 entries. The consumer cannot see what changed in v1.3, v1.4, etc. They must guess the cumulative changes or manually diff two specs.

### Preferred Alternative
Retain all changelog entries in reverse chronological order indefinitely.

### Refactoring Strategy
1. Restore deleted changelog entries from version control history
2. Maintain all entries in the changelog file
3. Consider a separate archive file for very old versions if file size is a concern
4. Link to historical changelog from current page

### Detection Checklist
- [ ] Check if historical changelog entries exist
- [ ] Verify consumers on old versions can view their version's changelog
- [ ] Confirm changelog format supports historical entries

### Related Rules
- Never Remove Historical Changelog Entries (05-rules.md)

### Related Skills
- (Documentation lifecycle management)

### Related Decision Trees
- (Documentation maintenance decisions)

---
