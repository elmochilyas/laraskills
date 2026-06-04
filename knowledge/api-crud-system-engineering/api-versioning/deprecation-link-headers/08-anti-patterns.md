# Deprecation Link Headers: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Deprecation Link Headers |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Broken Link** — Migration guide URL returns 404
2. **No Alternative URL** — Deprecation link points to a page that says "no alternative available"
3. **Link Rot** — No scheduled check for link validity, consumers find dead links
4. **Non-Standard Relation Type** — Using `rel="deprecated"` instead of `rel="deprecation"`
5. **Relative URLs** — Using relative URLs in Link headers instead of absolute URLs

## Repository-Wide Anti-Patterns

- Not including links in error responses (410, 406) for deprecated endpoints
- Forgetting to update link URLs when documentation moves
- Links pointing to unstable or temporary URLs
- Not combining deprecation, sunset, and link headers together

---

## 1. Broken Link

### Category
Consumer Harm

### Description
The `Link` header with `rel="deprecation"` points to a URL that returns 404. Consumers who want to learn about the migration cannot access the guidance.

### Why It Happens
Documentation moves, pages are restructured, or the migration guide was never created. The link is added once and never validated again.

### Warning Signs
- Deprecation link returns 404, 500, or redirects unexpectedly
- Consumers report "the migration link doesn't work"
- No link health check scheduled
- Developer documentation restructured without updating API link headers

### Why Harmful
A broken deprecation link is worse than no link — consumers who are trying to do the right thing are blocked. Support tickets increase as consumers ask "the migration link is broken, what do we do?"

### Real-World Consequences
An API consumer sees a deprecation warning and clicks the migration link. The link returns 404 because the documentation was moved to a new CMS. The consumer can't find migration instructions and their integration breaks when the old version is removed.

### Preferred Alternative
Use permanent URLs (permalinks) for migration guides. Implement automated link health checks that verify all deprecation links return 200.

### Refactoring Strategy
1. Identify all deprecation link URLs
2. Set up permanent redirects for any moved documentation
3. Implement scheduled link health check (daily)
4. Alert the team immediately when a deprecation link breaks
5. Add a test that verifies deprecation links in the test suite

### Detection Checklist
- [ ] Deprecation link returns non-200 status
- [ ] No link health check exists
- [ ] Documentation has been restructured
- [ ] Consumers report broken links

### Related Rules/Skills/Trees
- Rule: API-LINK-003 (Deprecation Link Health)
- Skill: deprecation-link-headers
- Tree: api-lifecycle

---

## 2. No Alternative URL

### Category
Dead End

### Description
The deprecation link points to a page that doesn't provide an alternative or migration path — it just confirms the deprecation. Consumers learn "this is deprecated" but not "what to use instead."

### Why It Happens
The team hasn't built the replacement yet but has started the deprecation process. The documentation team writes the deprecation notice but has no alternative to document.

### Warning Signs
- Migration guide page says "we're working on an alternative"
- No `alternate` link header alongside the deprecation link
- Documentation describes the deprecated feature but not its replacement
- Consumers can't find what to migrate to
- Support tickets ask "what replaces this endpoint?"

### Why Harmful
Consumers are aware of the deprecation but have no migration target. They're stuck on the deprecated version until an alternative appears, which may be too late.

### Real-World Consequences
Consumers see a deprecation warning and follow the link. The page says "The /v1/orders endpoint is deprecated. A replacement is coming soon." The replacement never comes. The endpoint is eventually removed, and consumers are left without the feature.

### Preferred Alternative
Only provide deprecation links when the alternative exists and is documented. The link should immediately lead to the migration path.

### Refactoring Strategy
1. Ensure the migration guide documents the replacement endpoint or version
2. Add `Link` header with `rel="alternate"` pointing to the replacement
3. Remove deprecation links if no alternative exists
4. Document the migration steps clearly

### Detection Checklist
- [ ] Deprecation page lacks migration guidance
- [ ] No `alternate` link header
- [ ] Consumers cannot find replacement
- [ ] Replacement doesn't exist yet

### Related Rules/Skills/Trees
- Rule: API-LINK-004 (Actionable Deprecation Links)
- Skill: deprecation-link-headers
- Tree: api-lifecycle

---

## 3. Link Rot

### Category
Maintenance Failure

### Description
Deprecation link URLs that were valid at deprecation time become stale over time. Documentation is restructured, URLs change, and links are not updated to match.

### Why It Happens
No automated process validates link health. The original author who created the links has moved on. Documentation changes are made without considering API link references.

### Warning Signs
- Deprecation links were added 12+ months ago
- No link health check has ever been run
- Documentation team has restructured URLs
- No one owns API documentation link maintenance
- Consumer complaints about broken links increase over time

### Why Harmful
Every broken link erodes consumer trust. The API appears poorly maintained. Consumers stop following deprecation links because they expect them to be broken.

### Real-World Consequences
A developer portal restructures from `/docs/v1-to-v2` to `/api/migration/v2`. All 50 deprecation Link headers now point to 404 pages. 20 enterprise customers are mid-migration and can't access guidance.

### Preferred Alternative
Implement automated link health checks. Use permanent URLs (permalinks) that don't change when documentation is restructured.

### Refactoring Strategy
1. Run a one-time audit of all deprecation links
2. Fix all broken links
3. Implement daily link health check
4. Use permalinks (e.g., `/docs/api/migration/v1-to-v2`) that never change
5. Add alerting for link failures
6. Assign ownership for link maintenance

### Detection Checklist
- [ ] No link health check exists
- [ ] Documentation restructured without API link updates
- [ ] Consumers report broken links occasionally
- [ ] No permalink strategy for documentation URLs

### Related Rules/Skills/Trees
- Rule: API-LINK-005 (Link Maintenance)
- Skill: documentation-ci-validation
- Tree: api-documentation

---

## 4. Non-Standard Relation Type

### Category
Protocol Violation

### Description
Using `rel="deprecated"`, `rel="old-version"`, `rel="migration-guide"`, or other non-standard relation types instead of the RFC 9745 standard `rel="deprecation"`.

### Why It Happens
Lack of awareness of RFC 9745. Developers invent descriptive relation names that seem intuitive.

### Warning Signs
- Link header uses `rel="deprecated"` instead of `rel="deprecation"` (subtle but wrong)
- Multiple non-standard relation types used across the API
- Consumers must parse custom relation types
- No `rel="deprecation"` link found in deprecated responses
- Documentation specifies custom relation values

### Why Harmful
Non-standard relation types are not recognized by automated tooling, API clients, and monitoring systems that parse standard link relations.

### Real-World Consequences
An API monitoring dashboard tracks `rel="deprecation"` links to alert ops teams about deprecated-version usage. The API uses `rel="deprecated"` instead. The monitoring system never detects the deprecation, and the ops team is unaware of consumer migration progress.

### Preferred Alternative
Use the standard relation type `deprecation` as defined in RFC 9745. Also consider `sunset`, `alternate`, and `latest-version`.

### Refactoring Strategy
1. Replace all non-standard relation types with standard ones
2. Add the correct `rel="deprecation"` link while maintaining old links during migration
3. Remove old non-standard links after verification
4. Add architecture test enforcing standard relation types
5. Update documentation

### Detection Checklist
- [ ] Non-standard relation types used
- [ ] No `rel="deprecation"` link
- [ ] Documentation shows custom relation values
- [ ] Automated tools don't recognize the relation

### Related Rules/Skills/Trees
- Rule: API-LINK-006 (Standard Link Relations)
- Skill: deprecation-link-headers
- Tree: http-protocol

---

## 5. Relative URLs

### Category
Resolution Ambiguity

### Description
Using relative URLs in Link headers (e.g., `Link: </docs/migration>; rel="deprecation"`) instead of absolute URLs. Consumers must resolve the relative URL against the request URL, which may produce different results in different environments.

### Why It Happens
Developers use the path relative to the API base URL, assuming consumers will resolve it correctly. Systems that handle link headers differently may misinterpret the URL.

### Warning Signs
- Link header contains relative paths starting with `/`
- No absolute `https://` URL in link headers
- Consumers report broken links in some environments (staging vs production)
- Link resolution depends on the request URL
- Monitoring tools that follow links resolve to the wrong server

### Why Harmful
Relative URLs are ambiguous — a consumer in development resolves against `localhost`, a consumer in production resolves against `api.example.com`. Link resolution behavior varies by HTTP client library.

### Real-World Consequences
An API returns `Link: </docs/migration>; rel="deprecation"`. A client library resolves this to `http://localhost:8000/docs/migration` (the development URL) because the request was made to localhost. The developer sees a 404 and assumes the migration guide doesn't exist.

### Preferred Alternative
Always use absolute URLs with `https://` scheme in Link headers. Use `url()` helper or `config('app.url')` to generate the base URL.

### Refactoring Strategy
1. Replace all relative link URLs with absolute URLs
2. Use `route()` or `url()` helpers for generation
3. Ensure `APP_URL` is set correctly in all environments
4. Add tests verifying link headers contain absolute URLs
5. Verify links work from different environments

### Detection Checklist
- [ ] Relative URLs used in Link headers
- [ ] No `https://` prefix in link values
- [ ] Links resolve differently per environment
- [ ] Consumers report different link behavior

### Related Rules/Skills/Trees
- Rule: API-LINK-007 (Absolute URLs)
- Skill: url-structure-design
- Tree: http-protocol
