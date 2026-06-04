# Anti-Patterns: OpenAPI Specification Generation

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-25 |
| **Domain** | API Integration Engineering |
| **Subdomain** | API Versioning |
| **Type** | Implementation |
| **Version** | 1.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Outdated Spec Not Matching Actual API](#1-outdated-spec-not-matching-actual-api)
2. [Missing Error Response Schemas](#2-missing-error-response-schemas)
3. [Hardcoded Example Values Not Matching Production](#3-hardcoded-example-values-not-matching-production)
4. [Not Versioning the Spec Separately](#4-not-versioning-the-spec-separately)
5. [Spec Generation Dependent on Production Data](#5-spec-generation-dependent-on-production-data)

---

## 1. Outdated Spec Not Matching Actual API

### Category
Documentation Integrity Failure

### Description
The OpenAPI specification becomes outdated because it's manually maintained (or auto-generated but never validated against the actual API). The spec describes endpoints, parameters, and schemas that differ from the live implementation. Consumers relying on the spec build integrations that fail against the real API, or the spec is ignored because "it's always wrong."

### Why It Happens
- Spec generated once during initial development, never updated
- Auto-generation not set up in CI; changes made without regenerating
- Manual spec edits drift from implementation
- No validation that spec matches actual API responses
- Spec considered "documentation" rather than a "contract"

### Warning Signs
- Contract tests comparing spec to actual responses fail
- Consumers report that documented endpoints don't exist or behave differently
- README says "see Swagger docs" but Swagger shows inaccurate info
- Spec last updated months or years ago
- No CI step validating spec-against-response
- Team doesn't use the spec themselves (it's for "external use only")

### Why Harmful
- Consumer integrations built on inaccurate specs fail in production
- Developer experience degraded; documentation cannot be trusted
- Support team handles "the docs say X but the API does Y" tickets
- Spec becomes an anti-pattern: maintained but useless
- Cannot trust spec for automated tasks (SDK generation, testing)

### Real-World Consequences
- Generated TypeScript SDK has wrong types; consumer's compile-time error at runtime
- New developer spends 2 days debugging integration built from spec (spec was wrong)
- Consumer abandons integration after "following the docs" produced nothing working
- Spec validation failure discovered during production outage

### Preferred Alternative
Validate the OpenAPI spec against actual API responses in CI on every change. Use contract testing to compare responses to documented schemas. Regenerate spec automatically from code annotations/attributes.

### Refactoring Strategy
1. Implement spec validation in CI: compare API responses to spec schemas
2. Fix discrepancies: update spec to match API or vice versa
3. Set up auto-generation of spec from code annotations
4. Add contract tests that fail when spec doesn't match responses
5. Include spec accuracy in API quality metrics

### Detection Checklist
- [ ] Spec is validated against actual API responses in CI
- [ ] Auto-generation from annotations is configured
- [ ] Contract tests detect spec-response mismatches
- [ ] Spec accuracy is tracked over time

### Related Rules/Skills/Trees
- Skill: Implement OpenAPI Specification Generation

---

## 2. Missing Error Response Schemas

### Category
Incomplete Spec Coverage

### Description
The OpenAPI spec documents successful responses but omits error response schemas. Consumers cannot determine what error formats to expect, which fields will be present in error cases, or how to parse different HTTP status error responses. Error handling in consumer code is built on guesswork or observed behavior.

### Why It Happens
- Focus on documenting the happy path
- Error responses considered "implementation detail"
- No standard error response format across the API
- Error documentation perceived as "too complex" or "too many cases"
- OpenAPI examples show only successful responses

### Warning Signs
- OpenAPI spec has no `4XX` or `5XX` response schemas
- Error response examples are missing
- Error format differs across endpoints (inconsistent)
- Consumers parse error responses with fragile string matching
- Error handling tests exist only in consumer code, not in API spec
- No standard error response class or structure

### Why Harmful
- Consumer error handling is built on speculation
- Error format changes break consumer integrations silently
- No documentation for rate limit errors, validation errors, auth errors
- Consumer integration fragile: crashes on unexpected error response
- API looks less professional and complete

### Real-World Consequences
- Consumer integration crashes on validation error because error format was undocumented
- Mobile app shows raw JSON error because no error schema was specified
- Rate limit retry logic broken because error response format unknown
- Integration partner files support ticket for "we don't know how your errors look"

### Preferred Alternative
Document all error response schemas in the OpenAPI spec. Define a standard error response format (code, message, details) and use it consistently. Include examples for each error status code.

### Refactoring Strategy
1. Define a standard error response schema
2. Document error responses for each endpoint (4XX, 5XX)
3. Add example error responses for common cases
4. Implement error response consistency across endpoints
5. Add tests that verify error responses match spec

### Detection Checklist
- [ ] Error response schemas are documented for all status codes
- [ ] Standard error format is defined and consistent
- [ ] Error examples exist for common cases
- [ ] Error response tests verify spec compliance

### Related Rules/Skills/Trees
- Skill: Implement OpenAPI Specification Generation

---

## 3. Hardcoded Example Values Not Matching Production

### Category
Misleading Documentation

### Description
OpenAPI spec examples contain hardcoded, unrealistic values that don't match production data shapes. Example email addresses don't follow validation rules, IDs are invalid formats, dates are impossible, and field lengths exceed actual limits. Consumers build validation and parsing logic based on these examples, then fail against real data.

### Why It Happens
- Examples generated without production data reference
- "placeholder" examples from initial spec creation reused indefinitely
- No automated example generation from actual data
- Examples treated as cosmetic (not functional) documentation
- No validation that examples match schema constraints

### Warning Signs
- Example email uses non-existent domain format
- Example IDs don't match production ID format (uuid vs. int, different patterns)
- Example dates are in wrong format or impossible
- Field values exceed documented maxLength
- Example lacks required fields that have no `example` attribute
- Consumers complain that "the examples don't work"

### Why Harmful
- Consumers build parsing logic based on examples, break against real data
- False sense of validation: consumer thinks "I've seen the output format"
- SDK-generated types have wrong constraints based on examples
- Examples cannot be used for integration testing
- Spec perceived as low-quality and unreliable

### Real-World Consequences
- Consumer's date parser built for example format; production uses different format
- ID validation built for UUID; production uses incremental integers
- String length from examples exceeds actual production limits, causing truncation
- Integration tests using example data produce different results than real data

### Preferred Alternative
Generate examples from actual production data (anonymized) whenever possible. Use realistic example values that match schema constraints. Validate examples against the schema they document.

### Refactoring Strategy
1. Review all OpenAPI examples for realism
2. Replace unrealistic examples with production-like data (anonymized)
3. Validate that examples satisfy schema constraints
4. Automate example generation from test fixtures or production data
5. Add CI validation that examples are schema-compliant

### Detection Checklist
- [ ] Examples match production data shapes
- [ ] Examples satisfy schema constraints
- [ ] Examples can be used for integration testing
- [ ] Example generation is automated (not manual)

### Related Rules/Skills/Trees
- Skill: Implement OpenAPI Specification Generation

---

## 4. Not Versioning the Spec Separately

### Category
Spec-Lifecycle Coupling

### Description
Tying the OpenAPI spec version to the application or API version, so that spec changes and API changes must occur in lockstep. Spec updates that don't affect the API contract (typo fixes, documentation improvements, example updates) require an API version bump. Conversely, API changes may not have corresponding spec updates because they're on different versioning tracks.

### Why It Happens
- Spec file version = API version (simplification)
- No separate spec versioning infrastructure
- Spec considered part of the API (not an independent artifact)
- No recognition that spec can change independently of API behavior
- File naming convention: `openapi-v1.yaml`, `openapi-v2.yaml`

### Warning Signs
- Spec version matches API version exactly
- Minor spec documentation fixes require API version bump
- Spec improvements not published because "waiting for next API version"
- API has changes that spec doesn't reflect (version mismatch)
- Old API version has no corresponding spec version

### Why Harmful
- Spec documentation improvements are blocked by API version cycle
- Documentation accuracy lags behind because spec can't be updated freely
- Consumer cannot find spec for specific API version
- Spec version history doesn't align with API version history
- Minor spec fixes buried in major version bumps

### Real-World Consequences
- Typo fix in spec documentation: "waiting for v3" (6 months away)
- API v2.1 released but spec still shows v2.0
- Consumer cannot find spec for API v1.3
- Spec improvements deferred indefinitely

### Preferred Alternative
Version the OpenAPI spec independently of the API. Use the spec's own `info.version` field. Spec minor versions track documentation changes; spec major versions track API contract changes.

### Refactoring Strategy
1. Separate spec version from API version in the spec metadata
2. Allow spec documentation updates without API version bumps
3. Keep spec versions that map to API versions
4. Automate spec version management in CI
5. Document the spec versioning convention

### Detection Checklist
- [ ] Spec version is independent of API version
- [ ] Spec documentation fixes don't require API version bumps
- [ ] Spec exists for each active API version
- [ ] Spec versioning is documented

### Related Rules/Skills/Trees
- Skill: Implement OpenAPI Specification Generation

---

## 5. Spec Generation Dependent on Production Data

### Category
Environmental Coupling

### Description
The OpenAPI spec generation process depends on production database data or external services to produce accurate schemas. Running the spec generator in development or CI produces different results than expected because it connects to production databases, or fails entirely because it can't access production. Spec generation becomes environment-dependent and unreliable.

### Why It Happens
- Spec generator reads database schema for type information
- Example generation pulls from production data
- No development-only data fixtures for spec generation
- Spec generation coupled to application runtime (needs real DB connection)
- CI environment doesn't have the database access the spec generator requires

### Warning Signs
- Spec generation fails in CI (no database access)
- Spec output differs between local dev and CI
- Spec generation requires network access to production APIs
- Spec contains production data (PII leak risk)
- Database schema changes alter spec output unexpectedly
- Spec generation is not part of CI pipeline because it requires database

### Why Harmful
- Spec cannot be generated reliably in CI
- Spec accuracy depends on which environment it was generated in
- Production data may leak into spec (generated examples contain real user data)
- Spec generation becomes a manual step (run locally, commit artifact)
- Spec not regenerated because environment setup is complex

### Real-World Consequences
- Developer runs spec generation locally; CI generates different spec
- Production PII appears in OpenAPI examples (data leak incident)
- CI spec generation fails; spec goes 6 months without update
- New developer cannot generate spec (no database access configured)

### Preferred Alternative
Decouple spec generation from production data. Use code annotations/attributes as the source of truth for schemas. Use fixture-based test data for examples. Spec generation should work in CI with no external dependencies.

### Refactoring Strategy
1. Move from DB-dependent generation to annotation/attribute-based generation
2. Create development-only fixtures for spec examples
3. Ensure spec generation works in CI without database access
4. Remove production data dependencies from the generator
5. Add spec generation to CI pipeline

### Detection Checklist
- [ ] Spec generation works without production database access
- [ ] Spec examples use fixture data, not production data
- [ ] Spec generation runs in CI pipeline
- [ ] Spec output is consistent across environments
