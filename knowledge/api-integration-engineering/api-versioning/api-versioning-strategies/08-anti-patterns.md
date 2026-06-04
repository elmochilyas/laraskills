# Anti-Patterns: API Versioning Strategies

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-01 |
| **Domain** | API Integration Engineering |
| **Subdomain** | API Versioning |
| **Type** | Implementation |
| **Version** | 1.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Versionless Drift](#1-versionless-drift)
2. [Cosmetic Versioning](#2-cosmetic-versioning)
3. [Eternal Version Support](#3-eternal-version-support)
4. [Database Schema Versioning](#4-database-schema-versioning)

---

## 1. Versionless Drift

### Category
Evolution Strategy Failure

### Description
Evolving an API without versioning—adding, removing, and changing fields, parameters, and behaviors without incrementing a version number. Each deployment silently changes the contract that consumers depend on, eventually breaking integrations without warning. Consumers cannot pin to a known, stable contract.

### Why It Happens
- Short-term thinking: "We don't have consumers yet" (still true after they arrive)
- Inconvenience: versioning feels like overhead in early stages
- False belief that "small changes don't need versioning"
- No understanding of API contract stability requirements
- Internal API mentality applied to external APIs

### Warning Signs
- API has no `/v1/` prefix or version header from day one
- Changelog includes "breaking changes" without version bumps
- Consumers report integration breakage after routine deployments
- No deprecation notice for changed endpoints
- Regression tests fail because expected behavior changed
- Team can't deploy because "it might break someone"

### Why Harmful
- Consumers cannot rely on API stability
- Each deployment risks breaking production integrations
- Integration support requests increase with every change
- Consumer trust erodes; migration to competitors accelerates
- Eventual forced versioning is far more painful than initial versioning

### Real-World Consequences
- E-commerce integration breaks silently, order processing fails for 2 days
- Mobile app crashes because nested JSON field was removed
- Third-party developer abandons integration after third breaking change
- Emergency revert required when breaking change reaches production

### Preferred Alternative
Version from day one: `/api/v1/` from the first endpoint. Even before external consumers exist, the versioning infrastructure provides the foundation for evolution. Additive-only changes within a version; breaking changes require a new version.

### Refactoring Strategy
1. Implement API versioning (start with `/v1/` prefix)
2. Version-lock the current API behavior as v1
3. Communicate the versioning strategy to consumers
4. Add CI validation that prevents unversioned changes
5. Document versioning policy and migration process

### Detection Checklist
- [ ] API uses explicit versioning (URI prefix, header, or query parameter)
- [ ] No breaking changes within a version
- [ ] Versioning was present from the first consumer-facing release
- [ ] CI validates versioning compliance

### Related Rules/Skills/Trees
- Skill: Implement API Versioning Strategies

---

## 2. Cosmetic Versioning

### Category
Versioning Misuse

### Description
Bumping the API version number without meaningful changes between versions. v1 → v2 occurs with no actual behavioral, structural, or functional differences. This degrades the value of versioning as a communication tool—consumers cannot distinguish between cosmetic and substantive version changes, and unnecessary migration effort is demanded.

### Why It Happens
- Version number tied to application release cycle rather than API contract changes
- "Major version" confused with application major version
- No clear definition of what constitutes a version-worthy change
- Marketing pressure: "We're on v2 now" sounds more impressive
- Following internal convention that doesn't fit API semantics

### Warning Signs
- v1 and v2 have identical or near-identical codebases
- Changelog between versions: "Updated to v2" (no substantive changes)
- Consumers migrate for no functional benefit
- Migration guide: "Nothing changed, just update the URL prefix"
- Team cannot articulate what differs between versions

### Why Harmful
- Consumer migration effort is wasted (no benefit)
- Versioning loses meaning as a contract signal
- Consumers stop migrating (cry wolf effect)
- Multiple versions with identical behavior create confusion
- Maintenance burden doubles for zero benefit

### Real-World Consequences
- Consumers spend weeks migrating to v2 that has no changes
- Team maintains two identical code paths
- Consumer trusts versioning less; ignores future version announcements
- Support team fields "what's different in v2?" questions constantly

### Preferred Alternative
Only increment the API version when there is an actual breaking change in the API contract. Minor, backward-compatible changes do not require a version bump. Version the API independently of the application version.

### Refactoring Strategy
1. Define explicit criteria for API version bumps (breaking changes only)
2. Remove unnecessary version duplication
3. Communicate the versioning policy to consumers
4. Merge v1 and v2 codebases if they're identical
5. Route both URI prefixes to the same code (no migration needed)

### Detection Checklist
- [ ] Version increments correspond to actual breaking changes
- [ ] Multiple versions have demonstrable differences
- [ ] API version is independent of application version
- [ ] Migration guides describe actual changes

### Related Rules/Skills/Trees
- Skill: Implement API Versioning Strategies

---

## 3. Eternal Version Support

### Category
Maintenance Debt

### Description
Never removing deprecated API versions, accumulating infinite maintenance burden. Teams keep v1, v2, v3, v4 all running simultaneously because "someone might still use it." Over time, supporting many versions multiplies codebase complexity, testing requirements, and security patching effort without corresponding value.

### Why It Happens
- Fear of breaking long-time consumers
- No version analytics to determine actual usage
- "We promised backward compatibility" (permanently)
- No sunset policy or end-of-life planning
- Version removal feels aggressive or risky

### Warning Signs
- 3+ API versions active simultaneously
- Oldest version has <5% of traffic
- No deprecation headers on old versions
- No sunset date ever set
- Team spends significant effort maintaining old versions
- Documentation doesn't show which versions are recommended

### Why Harmful
- Exponential maintenance cost: each new version adds to the support burden
- Security patching required for old code paths
- Test suite expands with every version
- Developer productivity decreases as version complexity grows
- New features delayed by old-version compatibility requirements

### Real-World Consequences
- 5 API versions maintained; each takes 20% of development time
- v1 security patch required after original developer left
- Route table has 4x entries needed; route cache exceeds memory limits
- New endpoint requires 4 controller implementations

### Preferred Alternative
Define a version lifecycle policy: Active → Deprecated (with headers) → Sunset (with date) → Removed. Enforce the lifecycle based on usage analytics. Set a maximum supported version count (typically 2-3). Remove versions when usage drops below a threshold.

### Refactoring Strategy
1. Audit all active API versions and their usage
2. Define version lifecycle policy with explicit timelines
3. Add deprecation headers to versions eligible for removal
4. Set sunset dates based on usage analytics
5. Remove versions when sunset date passes and usage is minimal
6. Set maximum supported version policy (e.g., 2 active versions)

### Detection Checklist
- [ ] Version lifecycle policy exists and is enforced
- [ ] Old versions have deprecation and sunset headers
- [ ] Maximum 2-3 active versions at any time
- [ ] Version removal happens on schedule

### Related Rules/Skills/Trees
- Skill: Implement API Versioning Strategies

---

## 4. Database Schema Versioning

### Category
Architecture Coupling

### Description
Coupling the API version number to the database schema version. When the database schema changes, the API version is incremented—or conversely, API version increments require database migrations. This tight coupling prevents independent evolution of the API contract and the data store, and creates unnecessary version churn.

### Why It Happens
- Naive approach: "API reflects the database, so schema changes need API version bumps"
- No service layer abstraction between API and database
- ORM models exposed directly in API responses
- No DTOs or response transformers
- Team equates "breaking change" with "schema migration"

### Warning Signs
- API version changes coincide with database migrations
- API responses directly expose database column names
- Version changelogs describe database changes, not API contract changes
- Frontend code references database column names
- API version v3 uses same schema as v2 but with a different view

### Why Harmful
- API versions churn faster than contract changes warrant
- Database refactoring forces unnecessary consumer migrations
- Cannot evolve API independently of data storage
- Consumer-facing contract is tied to implementation details
- Database-first design exposes internal structure as API contract

### Real-World Consequences
- Database column rename from "username" to "handle" forces API v2
- Adding an internal `updated_at` column to response triggers consumer-side migration
- API v3, v4, v5 all reflect different database views of the same logical resource
- Consumer-facing breaking changes caused by internal refactoring

### Preferred Alternative
Decouple API version from database schema. Use a service layer with DTOs/transformers between the database and API response. Database changes that don't affect the API contract should not trigger version bumps.

### Refactoring Strategy
1. Implement DTOs that define the API response contract independently of database schema
2. Add response transformers that map database results to API contract
3. Decouple versioning from database migrations
4. Deprecate API versions that expose database internals
5. Document the API contract separately from the data model

### Detection Checklist
- [ ] API responses are not direct database representations
- [ ] DTOs/transformers exist between DB and API layer
- [ ] Database changes don't trigger API version bumps
- [ ] API contract is documented independently of database schema
