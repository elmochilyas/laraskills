# ECC Anti-Patterns — Deprecation Notes in Docs

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Deprecation Notes in Docs |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Deprecation Without Consumer Notification
2. Deprecated Without Stating a Replacement
3. Description-Only Deprecation Without OpenAPI Flag
4. Premature Removal Before Stated Sunset Date

---

## Repository-Wide Anti-Patterns

- Premature Optimization

---

## Anti-Pattern 1: Deprecation Without Consumer Notification

### Category
Documentation

### Description
Marking an endpoint as deprecated in documentation but not proactively notifying consumers, leaving them unaware until the endpoint stops working.

### Why It Happens
The `deprecated: true` flag is added to the spec, and the team considers the deprecation "communicated." Consumers are expected to monitor documentation.

### Warning Signs
- Endpoint marked deprecated but no consumer outreach
- No deprecation or sunset headers in API responses
- No logging of deprecated endpoint usage
- Consumers surprised when endpoint is removed

### Why It Is Harmful
Many consumers integrate with an API and never revisit the documentation. Documentation-only deprecation is invisible to them. They discover the deprecation only when the endpoint returns 410.

### Real-World Consequences
A critical integration runs on a deprecated endpoint for 18 months. The consumer never visited the docs after initial integration. The endpoint is removed on the sunset date. The consumer's production system breaks.

### Preferred Alternative
Use multiple notification channels: documentation flag, response headers (`Deprecation`, `Sunset`), changelog entries, and proactive email for identified consumers.

### Refactoring Strategy
1. Add `Deprecation: true` and `Sunset` headers to deprecated endpoint responses
2. Log every deprecated endpoint request with consumer identification
3. Set up automated email notifications for detected deprecated usage
4. Publish deprecation in changelog with clear timeline

### Detection Checklist
- [ ] Check deprecated endpoints for response headers
- [ ] Verify deprecated usage is logged
- [ ] Confirm consumer notification process exists

### Related Rules
- Send Deprecation And Sunset Headers In Responses (05-rules.md)
- Log Deprecated Endpoint Usage And Notify Consumers (05-rules.md)

### Related Skills
- (Deprecation lifecycle management)

### Related Decision Trees
- (Deprecation strategy decisions)

---

## Anti-Pattern 2: Deprecated Without Stating a Replacement

### Category
Documentation

### Description
Marking an endpoint as deprecated without providing the replacement endpoint, leaving consumers with no migration path.

### Why It Happens
The replacement may not be ready yet, or the team removes the endpoint without building a replacement. The deprecation notice says "don't use this" but not "use this instead."

### Warning Signs
- `description: "Deprecated."` with no replacement mentioned
- No "Use instead" or "alternative" section in deprecation notice
- Consumers ask "what should I use instead?"
- Multiple consumers build the same workaround in parallel

### Why It Is Harmful
Consumers cannot migrate because they don't know what to migrate to. They either ignore the deprecation (staying on the old endpoint) or build ad-hoc workarounds that may be incompatible with future changes.

### Real-World Consequences
A v1 endpoint is deprecated with "Use the v2 equivalent instead." But there is no direct v2 equivalent — the functionality was split across two endpoints. Consumers must guess which combination to use.

### Preferred Alternative
Every deprecation notice must include: what is deprecated, what replaces it (with endpoint path), deprecated since version, removal date, and migration instructions.

### Refactoring Strategy
1. Identify the replacement for every deprecated endpoint
2. Update deprecation descriptions with replacement details
3. Add migration examples from old to new endpoint
4. Test that replacement endpoint covers all deprecated functionality

### Detection Checklist
- [ ] Check deprecated endpoint descriptions for replacement
- [ ] Verify migration path exists for each deprecated feature
- [ ] Confirm consumers can determine the alternative

### Related Rules
- Include Structured Deprecation Notice In Description (05-rules.md)

### Related Skills
- (Deprecation lifecycle management)

### Related Decision Trees
- (Migration strategy decisions)

---

## Anti-Pattern 3: Description-Only Deprecation Without OpenAPI Flag

### Category
Framework Usage

### Description
Adding a textual deprecation note in the endpoint description without setting the `deprecated: true` flag, making the deprecation invisible to automated tooling.

### Why It Happens
Developers update the description text but forget or don't know about the `deprecated` boolean flag.

### Warning Signs
- Description says "Deprecated" but `deprecated: true` is not set
- Documentation renders the endpoint as active (no deprecation styling)
- API client generators do not deprecate the generated method
- Contract tests do not flag deprecated endpoints

### Why It Is Harmful
Automated tooling — documentation generators, SDK generators, contract testers — reads the `deprecated` boolean, not the description text. Without the flag, generated SDKs do not mark the method as deprecated. New consumers unknowingly use deprecated endpoints.

### Real-World Consequences
A new consumer uses an SDK generated from the OpenAPI spec. The SDK has a fully functional `getUsersList()` method with no deprecation warning. The consumer builds against a deprecated endpoint. The endpoint is removed. Their integration breaks.

### Preferred Alternative
Always set `deprecated: true` on the operation AND add a structured textual notice in the description.

### Refactoring Strategy
1. Identify all description-only deprecations
2. Add `deprecated: true` flag to each
3. Keep structured description with replacement and timeline
4. Verify documentation renderer shows deprecation styling
5. Test SDK generation produces deprecation warnings

### Detection Checklist
- [ ] Search for "deprecated" in descriptions without the `deprecated` flag
- [ ] Verify deprecated endpoints have `deprecated: true`
- [ ] Confirm documentation renders deprecation visually

### Related Rules
- Always Set The OpenAPI deprecated: true Flag (05-rules.md)

### Related Skills
- (OpenAPI specification management)

### Related Decision Trees
- (Deprecation documentation decisions)

---

## Anti-Pattern 4: Premature Removal Before Stated Sunset Date

### Category
Reliability

### Description
Removing a deprecated endpoint before the published sunset date, breaking consumer integrations that planned their migration around the published timeline.

### Why It Happens
Engineering teams want to clean up old code as soon as possible. The cleanup sprint removes endpoints without checking published sunset dates.

### Warning Signs
- Endpoint returns 410 before the documented sunset date
- Consumer complaints about broken integrations before expected removal
- Internal cleanup tasks reference "removing deprecated code" without checking dates
- No enforcement mechanism preventing early removal

### Why It Is Harmful
Consumers schedule their migrations based on the published timeline. Premature removal breaks trust in the entire deprecation process. Consumers may delay future upgrades because they cannot rely on published timelines.

### Real-World Consequences
An endpoint is documented as "removal: 2026-12-31." A developer removes it in September 2026 to "clean up before the holidays." The consumer was scheduled to migrate in October. Their integration breaks for 2 months.

### Preferred Alternative
Honor the sunset date strictly. Implement enforcement: the endpoint should return 410 only on or after the stated removal date.

### Refactoring Strategy
1. Add automated enforcement: return 410 based on removal date configuration
2. Remove the endpoint at the exact sunset date, not before
3. Add a pre-removal notification at 30 days and 7 days
4. Document the enforcement mechanism in deprecation process

### Detection Checklist
- [ ] Check removal date enforcement logic
- [ ] Verify endpoint is still active before sunset date
- [ ] Confirm sunset date is honored in all environments

### Related Rules
- Never Remove A Deprecated Endpoint Before The Stated Sunset Date (05-rules.md)

### Related Skills
- (Deprecation lifecycle management)

### Related Decision Trees
- (Removal timeline decisions)

---
