# Deprecation Header Implementation: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Deprecation Header Implementation |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Header Fatigue** — Too many endpoints deprecated simultaneously, consumers ignore the header
2. **Silent Deprecation** — Header added but consumers don't notice until the version is removed
3. **Deprecation Without Alternative** — Header sent but no upgrade path exists
4. **Missing Sunset Pair** — Deprecation without a Sunset header or timeline
5. **Non-Standard Header Names** — Using `X-Deprecated` or other non-standard headers

## Repository-Wide Anti-Patterns

- Deprecating a version but continuing to add new features to it
- Not testing that deprecated endpoints still function correctly
- Not monitoring Deprecation header frequency to track migration
- Deprecating without documentation, blog post, or consumer communication

---

## 1. Header Fatigue

### Category
Consumer Desensitization

### Description
Deprecating so many endpoints or versions simultaneously that consumers become desensitized to the `Deprecation` header. When a real critical deprecation occurs, consumers ignore it because they've learned to ignore the noise.

### Why It Happens
Teams deprecate aggressively without prioritizing or communicating the significance of each deprecation. Every minor change gets a deprecation header, flooding consumers with warnings.

### Warning Signs
- Most API responses include a `Deprecation` header
- Consumers report "deprecation warning fatigue"
- Consumer migration rate is low despite widespread warnings
- Support tickets ask "is THIS deprecation important?"
- Multiple endpoints at different lifecycle stages all show deprecated

### Why Harmful
The deprecation signal loses its power. Consumers stop reading deprecation notices, miss critical migration deadlines, and are caught off guard when versions are removed.

### Real-World Consequences
An API deprecates 15 endpoints across 3 versions simultaneously. Every response shows a `Deprecation` header. A critical security-related version deprecation is mixed in with minor endpoint deprecations. Consumers ignore all of them, including the critical one.

### Preferred Alternative
Prioritize deprecations by consumer impact. Communicate each deprecation clearly with specific migration timelines. Keep the total number of simultaneously deprecated endpoints manageable.

### Refactoring Strategy
1. Deprecation endpoint inventory — count active deprecation warnings
2. Prioritize by consumer impact and traffic
3. Consolidate related deprecations into single communications
4. Remove deprecation headers for less important changes
5. Add severity levels to deprecation communications

### Detection Checklist
- [ ] Most API responses show deprecation header
- [ ] Consumers report fatigue
- [ ] Deprecation communications are not prioritized
- [ ] Multiple versions deprecated simultaneously

### Related Rules/Skills/Trees
- Rule: API-DEPRECATE-001 (Deprecation Prioritization)
- Skill: phased-deprecation-timeline
- Tree: api-lifecycle

---

## 2. Silent Deprecation

### Category
Communication Failure

### Description
Adding a `Deprecation` header to responses but not communicating the deprecation through any other channel — no blog post, no email, no dashboard notice, no changelog entry. Consumers never see the header or don't understand its significance.

### Why It Happens
"We added the header, that's sufficient." The team assumes consumers monitor HTTP headers for lifecycle information.

### Warning Signs
- Deprecation header added but no other communication sent
- Consumers express surprise when the version is removed
- Support tickets say "we didn't know this was deprecated"
- No deprecation blog post, email, or dashboard notice exists
- Consumer migration rate is zero despite header being active for months

### Why Harmful
Headers are invisible to most consumers — they're not logged, not displayed in API clients, and many SDKs ignore them. Silent deprecation is functionally equivalent to no deprecation.

### Real-World Consequences
An API adds a `Deprecation` header to all V1 responses. After 12 months, the team removes V1. Consumers across 20 companies are affected because none of them monitored HTTP headers. None had migrated.

### Preferred Alternative
Use multiple communication channels for deprecation: HTTP headers (automated), dashboard notification, email to registered consumers, blog post, and changelog entry.

### Refactoring Strategy
1. Add deprecation notification to the developer dashboard
2. Send deprecation email to registered API consumers
3. Publish a deprecation blog post and changelog entry
4. Schedule follow-up communications during the deprecation window
5. Track consumer acknowledgment of deprecation notices

### Detection Checklist
- [ ] Deprecation header is the only communication channel
- [ ] Consumers unaware of deprecation
- [ ] No email or dashboard notification exists
- [ ] Migration rate not tracked

### Related Rules/Skills/Trees
- Rule: API-DEPRECATE-002 (Multi-Channel Deprecation)
- Skill: deprecation-link-headers
- Tree: api-lifecycle

---

## 3. Deprecation Without Alternative

### Category
Dead End

### Description
Marking an endpoint or version as deprecated without providing a migration path or alternative. The `Deprecation` header says "this will be removed" but doesn't say "use this instead."

### Why It Happens
The team plans to build the replacement but hasn't yet. They want to signal that old endpoints are deprecated to discourage new integrations, but the alternative isn't ready.

### Warning Signs
- Deprecation header present but no `alternate` link header
- Deprecation documentation says "this will be removed" without migration guidance
- No replacement endpoint exists in the latest version
- Consumers ask "what should we use instead?" and the answer is "we're working on it"
- Deprecation has been active for months with no alternative available

### Why Harmful
Consumers are stuck — they must continue using a deprecated endpoint because no alternative exists. The deprecation warning becomes background noise. When the endpoint is eventually removed, consumers are still unprepared.

### Real-World Consequences
An API deprecates V1 of the orders endpoint because the team wants to redesign it. The V2 alternative isn't ready. After 18 months, the team removes V1. All consumers are still on V1 because no alternative was ever provided.

### Preferred Alternative
Only deprecate when a stable alternative is available. If the alternative isn't ready, don't send deprecation headers.

### Refactoring Strategy
1. Ensure a stable replacement endpoint/version exists
2. Add `Link` header with `rel="alternate"` pointing to the replacement
3. Document the migration path clearly in OpenAPI
4. Provide migration examples and tooling
5. Only begin the deprecation timeline when the alternative is production-ready

### Detection Checklist
- [ ] Deprecated but no alternative exists
- [ ] No `alternate` link header
- [ ] Consumers have no migration path
- [ ] Replacement is not production-ready

### Related Rules/Skills/Trees
- Rule: API-DEPRECATE-003 (Alternative Before Deprecation)
- Skill: deprecation-link-headers
- Tree: api-lifecycle

---

## 4. Missing Sunset Pair

### Category
Incomplete Implementation

### Description
Sending a `Deprecation` header without a `Sunset` header. Consumers know the endpoint is deprecated but don't know when it will be removed. They have no deadline to plan against.

### Why It Happens
The team hasn't determined the removal date yet but wants to start deprecation signaling. "We'll add the Sunset header later."

### Warning Signs
- `Deprecation: true` without `Sunset` header
- Consumers ask "when will this be removed?"
- No removal date documented in deprecation communication
- Deprecation continues indefinitely with no deadline
- Internal teams have different opinions on the removal date

### Why Harmful
Without a deadline, consumers have no urgency to migrate. Indefinite deprecation periods mean consumers never prioritize migration. The deprecation becomes permanent.

### Real-World Consequences
An API deprecates V1 with just a `Deprecation` header. Three years later, V1 is still active. New consumers still integrate with V1 because it works and there's no removal date. The team can never remove it.

### Preferred Alternative
Always pair `Deprecation` with `Sunset` header containing a specific HTTP-date. If the date isn't determined, don't send the deprecation header yet.

### Refactoring Strategy
1. Determine a specific removal date for each deprecated version
2. Add `Sunset` header with HTTP-date to all deprecated responses
3. Store sunset dates in config, not hardcoded
4. Enforce sunset dates with automated 410 response on/after the date
5. Communicate the specific deadline in all deprecation channels

### Detection Checklist
- [ ] Deprecation without Sunset header
- [ ] No removal date determined
- [ ] Deprecation continues indefinitely
- [ ] Consumers unaware of timeline

### Related Rules/Skills/Trees
- Rule: API-DEPRECATE-004 (Deprecation + Sunset Pair)
- Skill: sunset-header-implementation
- Tree: api-lifecycle

---

## 5. Non-Standard Header Names

### Category
Protocol Violation

### Description
Using non-standard or custom header names like `X-Deprecated`, `X-API-Version-Deprecated`, or `Deprecation-Status` instead of the standardized `Deprecation` header (RFC 9745).

### Why It Happens
Legacy implementations predating RFC 9745 (2022). Developers invent their own header names because they don't know the standard exists.

### Warning Signs
- Response includes `X-Deprecated` instead of `Deprecation`
- Multiple different deprecation headers used across the API
- Documentation refers to non-standard header names
- Consumer SDKs must parse multiple header formats
- No `Deprecation: true` header in deprecated responses

### Why Harmful
Non-standard headers are not recognized by API gateways, monitoring tools, and automated deprecation trackers. Consumers must implement custom parsing for your specific header name.

### Real-World Consequences
An API uses `X-API-Deprecated: true` instead of `Deprecation: true`. A consumer's API monitoring tool, which tracks standard `Deprecation` headers, doesn't detect the deprecation. The consumer misses the deprecation window entirely.

### Preferred Alternative
Use the standard `Deprecation` header as defined in RFC 9745. Use `Deprecation: true` with optional `since` and `for` parameters.

### Refactoring Strategy
1. Replace all non-standard deprecation headers with `Deprecation`
2. Add both old and new headers during migration
3. Remove old headers after confirming consumers have migrated
4. Update documentation to reference standard headers
5. Add architecture test enforcing standard header names

### Detection Checklist
- [ ] Custom deprecation header names used
- [ ] No `Deprecation: true` header
- [ ] Multiple deprecation header formats
- [ ] Documentation references non-standard headers

### Related Rules/Skills/Trees
- Rule: API-DEPRECATE-005 (Standardized Headers)
- Skill: deprecation-header-implementation
- Tree: http-protocol
