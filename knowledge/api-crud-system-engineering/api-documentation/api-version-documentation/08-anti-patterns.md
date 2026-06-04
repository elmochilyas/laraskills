# ECC Anti-Patterns — API Version Documentation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | API Version Documentation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. All Versions Presented with Equal Visual Weight
2. Single OpenAPI File for All Versions
3. No Version Discovery Endpoint
4. Removing Sunset Version Documentation
5. No Version Comparison or Migration Path

---

## Repository-Wide Anti-Patterns

- Premature Optimization

---

## Anti-Pattern 1: All Versions Presented with Equal Visual Weight

### Category
Documentation

### Description
Listing all API versions in documentation with identical visual styling (same font, same badges), making deprecated versions look as recommended as active ones and misleading new consumers.

### Why It Happens
Documentation templates render a version list without distinguishing status. The data is correct (versions listed), but the presentation is flat.

### Warning Signs
- All versions shown with same color/icon regardless of status
- No status badges (active/deprecated/sunset)
- New consumers frequently pick old versions
- No "Recommended" indicator on latest version

### Why It Is Harmful
New consumers cannot distinguish active from deprecated versions at a glance. Many pick the first version they see, which may be deprecated. They build integrations on endpoints scheduled for removal.

### Real-World Consequences
A new developer picks v1 (deprecated) because it's listed first. They spend 2 weeks integrating. A month later v1 is sunset. They must rewrite their integration for v2 under time pressure.

### Preferred Alternative
Use color-coded status badges: green (active), yellow (deprecated with date), red (sunset). Recommend the active version explicitly.

### Refactoring Strategy
1. Add status badges to version listings
2. Hide or visually demote sunset versions
3. Add "Recommended" badge to the current default version
4. Sort versions with active first, deprecated below

### Detection Checklist
- [ ] Check version listing for visual status indicators
- [ ] Verify deprecated versions are visually distinguishable
- [ ] Confirm recommended default version is clearly marked

### Related Rules
- Visually Distinguish Active From Deprecated Versions (05-rules.md)

### Related Skills
- (API documentation skills)

### Related Decision Trees
- (Version lifecycle decisions)

---

## Anti-Pattern 2: Single OpenAPI File for All Versions

### Category
Code Organization

### Description
Maintaining all API versions in a single OpenAPI specification file, making independent deprecation impossible and coupling version lifecycles.

### Why It Happens
Starting with one version, the spec grows organically. Adding v2 means adding paths to the same file. No one creates a separate file.

### Warning Signs
- One `openapi.yaml` contains both `/v1/users` and `/v2/users`
- Deprecating v1 requires editing the shared file
- Archiving v1 means removing content from the active spec
- Spec file is very large and hard to navigate

### Why It Is Harmful
Changes to the shared spec risk accidentally modifying the other version's documentation. Deprecating a version requires risky edits to the active spec. Version-specific nuances are hard to maintain.

### Real-World Consequences
A developer updates the v2 user schema. They accidentally change the v1 schema in the same file because both are in the same `components/schemas/`. v1 consumers see incorrect documentation.

### Preferred Alternative
Maintain separate spec files per version: `docs/openapi-v1.yaml`, `docs/openapi-v2.yaml`.

### Refactoring Strategy
1. Extract each version into its own spec file
2. Remove version prefix from paths within each file
3. Configure docs generator per version
4. Set up CI to validate each spec independently
5. Archive sunset versions as read-only

### Detection Checklist
- [ ] Check for single OpenAPI file containing multiple versions
- [ ] Verify version isolation in spec organization

### Related Rules
- Separate Spec Files Per Version (05-rules.md)

### Related Skills
- (OpenAPI specification management)

### Related Decision Trees
- (Version documentation organization)

---

## Anti-Pattern 3: No Version Discovery Endpoint

### Category
Design

### Description
Not providing a machine-readable `GET /api/versions` endpoint, forcing consumers to manually find version information through blog posts, changelogs, or word of mouth.

### Why It Happens
Version information is assumed to be "obvious" — the latest version is documented on the docs homepage. Machine-readable discovery is considered unnecessary.

### Warning Signs
- No `/api/versions` or `/versions` endpoint
- Consumers hardcode version strings from blog posts
- Support team frequently answers "which version should I use?"
- CI/CD tooling cannot programmatically determine available versions

### Why It Is Harmful
New consumers cannot programmatically discover available versions. Integration tooling must hardcode version values. When versions are deprecated or added, consumers must manually update their configurations.

### Real-World Consequences
A CI/CD pipeline hardcodes `v2` because that's what was documented in a blog post from 2025. v3 is now the default. The pipeline continues using v2 until v2 is sunset and the pipeline breaks.

### Preferred Alternative
Implement `GET /api/versions` returning all versions with status, docs URL, and deprecation dates.

### Refactoring Strategy
1. Create version discovery endpoint
2. Return version, status, docs URL, release date for each version
3. Recommend the default version explicitly
4. Document the endpoint in onboarding guides

### Detection Checklist
- [ ] Check for version discovery endpoint
- [ ] Verify version information is machine-readable
- [ ] Confirm default version is recommended

### Related Rules
- Always Expose A Version Discovery Endpoint (05-rules.md)

### Related Skills
- (Version lifecycle management)

### Related Decision Trees
- (Version documentation decisions)

---

## Anti-Pattern 4: Removing Sunset Version Documentation

### Category
Maintainability

### Description
Deleting all documentation for sunset API versions, leaving consumers who are still migrating without reference material and increasing support costs.

### Why It Happens
Cleanup mentality — the endpoint is gone, so the docs should go too. The ongoing migration period for remaining consumers is overlooked.

### Warning Signs
- Sunset version's docs return 404
- Consumers still migrating from sunset version cannot reference old behavior
- Support team must reverse-engineer deprecated behavior from memory
- Migration guide links to now-removed documentation

### Why It Is Harmful
Consumers in the middle of migration lose access to reference material. They must contact support or rely on memory/incomplete notes. The migration takes longer and generates support requests.

### Real-World Consequences
A consumer has a legacy integration on v1 (sunset 2026-01-01). They start migration in Dec 2025. Docs are removed on Jan 1. They can no longer verify old behavior vs new behavior. Migration stalls.

### Preferred Alternative
Preserve sunset version docs as read-only. Remove only interactive features (Try It console, test credentials).

### Refactoring Strategy
1. Set sunset docs to read-only mode
2. Remove interactive features but keep reference content
3. Add banner: "This version is sunset. Upgrade to v2."
4. Link to migration guide from sunset docs

### Detection Checklist
- [ ] Check if sunset version docs are accessible
- [ ] Verify read-only mode for sunset docs
- [ ] Confirm interactive features are disabled

### Related Rules
- Never Remove Sunset Version Docs (05-rules.md)

### Related Skills
- (Documentation lifecycle management)

### Related Decision Trees
- (Version deprecation decisions)

---

## Anti-Pattern 5: No Version Comparison or Migration Path

### Category
Documentation

### Description
Documenting each API version in isolation without a cross-version comparison table or migration guide, forcing consumers to manually diff specs to plan upgrades.

### Why It Happens
Each version's documentation is written independently. The effort to create and maintain a comparison table seems high.

### Warning Signs
- No table comparing features across versions
- Each version's docs are self-contained with no cross-reference
- Upgrade/migration guide does not exist
- Consumers must open two browser tabs and compare manually

### Why It Is Harmful
Consumers cannot easily assess the effort required to upgrade. Breaking changes are discovered during integration, not during planning. Migration decisions are deferred due to uncertainty.

### Real-World Consequences
A consumer plans to upgrade from v1 to v2. They manually compare both docs pages for 2 hours. They miss the change in pagination format. Their integration breaks in production on the first page load.

### Preferred Alternative
Publish a version comparison table covering auth, pagination, response format, rate limits, and default behaviors.

### Refactoring Strategy
1. Create comparison table across all active and deprecated versions
2. Include auth method, pagination, rate limits, response format
3. Link full migration guide from the comparison table
4. Update the table when new versions are released

### Detection Checklist
- [ ] Check for cross-version comparison table
- [ ] Verify migration guide exists for each version upgrade
- [ ] Confirm differences are explicitly listed

### Related Rules
- Publish A Version Comparison Table (05-rules.md)

### Related Skills
- (API documentation skills)

### Related Decision Trees
- (Version lifecycle decisions)

---
