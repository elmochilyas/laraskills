# Sunset Header Implementation: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Sunset Header Implementation |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Missed Sunset** — Sunset date passes but version still works, consumers learn to ignore deadlines
2. **Premature 410** — Bug triggers 410 before sunset date
3. **Perpetual Sunset** — Version always has a Sunset header but never gets removed
4. **Sunset Without Deprecation** — Setting Sunset header without preceding Deprecation header
5. **Missing 410 Response** — Sunset date passes but version still returns data instead of 410

## Repository-Wide Anti-Patterns

- Using `Sunset: true` instead of a proper HTTP-date
- Forgetting to update the sunset date when extending the timeline
- Not storing sunset dates in config (hardcoding them)
- Not testing that 410 response is returned after sunset

---

## 1. Missed Sunset

### Category
Credibility Loss

### Description
The sunset date passes but the version continues to work normally. The `Sunset` header continues to show a date in the past. Consumers learn that deadlines are not enforced.

### Why It Happens
The team forgets to enable the enforcement mechanism, or a stakeholder requests an extension without updating the header.

### Warning Signs
- Sunset date passed but version still works
- `Sunset` header shows a past date
- Multiple missed sunsets for different versions
- Consumers say "they never actually remove versions"
- No automated sunset enforcement in place

### Why Harmful
Consumers learn to ignore sunset deadlines. Future deprecation warnings are ignored. When a critical sunset must be enforced, consumers are not prepared.

### Real-World Consequences
An API has missed 3 sunset dates over 2 years. Consumers know deadlines are flexible. When a security vulnerability forces an actual sunset, consumers are caught off guard and angry because "you never enforced before."

### Preferred Alternative
Automate sunset enforcement. When the date passes, the version must return 410. Never extend a sunset date unless absolutely necessary.

### Refactoring Strategy
1. Implement automated sunset enforcement (scheduled command)
2. Configure enforcement to return 410 on/after the date
3. Add monitoring that alerts if a version is still serving after its sunset date
4. Establish that sunset dates are firm deadlines
5. Create exception process for rare extensions

### Detection Checklist
- [ ] Past sunset date but version still active
- [ ] No automated enforcement
- [ ] Multiple missed deadlines
- [ ] Consumers ignore deprecation warnings

### Related Rules/Skills/Trees
- Rule: API-SUNSET-001 (Sunset Enforcement)
- Skill: sunset-header-implementation
- Tree: api-lifecycle

---

## 2. Premature 410

### Category
False Removal

### Description
A bug triggers 410 Gone response before the sunset date. Consumers cannot access the version that should still be available.

### Why It Happens
Time zone confusion, date comparison bug, or configuration error causes the enforcement logic to trigger early.

### Warning Signs
- 410 returned before the sunset date
- Reports of "version X is gone" before scheduled removal
- Date comparison bug in middleware
- Timezone conversion issues
- Enforcement logic uses wrong date field

### Why Harmful
Consumer panic and business disruption. The version was supposed to be available for months. Emergency fix required. Trust is damaged.

### Real-World Consequences
A timezone bug in the sunset middleware compares the date in UTC but reads the config date as local time. The sunset appears to have passed 5 hours early. Consumers in the affected timezone receive 410 during business hours.

### Preferred Alternative
Use consistent timezone (UTC) for all sunset dates. Test enforcement logic thoroughly. Add canary monitoring that alerts before automatic enforcement.

### Refactoring Strategy
1. Use UTC consistently for all date comparisons
2. Add tests for edge cases: timezone boundaries, DST transitions
3. Implement canary monitoring that checks sunset enforcement correctness
4. Add a grace period (1 hour) after the sunset date before enforcement
5. Log enforcement decisions for audit

### Detection Checklist
- [ ] 410 returned before sunset date
- [ ] Timezone conversion in enforcement logic
- [ ] No date comparison tests
- [ ] No canary monitoring for premature enforcement

### Related Rules/Skills/Trees
- Rule: API-SUNSET-002 (Accurate Sunset Enforcement)
- Skill: sunset-header-implementation
- Tree: api-lifecycle

---

## 3. Perpetual Sunset

### Category
Meaningless Deadline

### Description
A version has a `Sunset` header with a date, but the date keeps getting extended. The sunset is never actually enforced.

### Why It Happens
Large consumers threaten to leave if the version is removed. The team extends the sunset date instead of managing the migration.

### Warning Signs
- Same version's sunset date extended multiple times
- Sunset date years in the past but version still active
- No firm policy on sunset extensions
- Certain consumers exempt from sunset
- Version has been "sunsetting" for 3+ years

### Why Harmful
The Sunset header becomes meaningless. Consumers learn that dates can be ignored. The team maintains a "sunsetting" version indefinitely.

### Real-World Consequences
V1 has been "sunsetting" for 4 years. The sunset date has been extended 8 times for a major enterprise client. The team maintains V1 infrastructure at 30% of engineering cost. New consumers still integrate with V1.

### Preferred Alternative
Set firm, non-negotiable sunset dates. Require executive approval for extensions. Provide migration support instead of extending deadlines.

### Refactoring Strategy
1. Set a final, non-negotiable sunset date
2. Require VP-level approval for any extension
3. Offer white-glove migration support to struggling consumers
4. Monitor consumer migration progress and offer help early
5. Phase out extensions over time

### Detection Checklist
- [ ] Same sunset date extended multiple times
- [ ] Version sunsetting for years
- [ ] Consumers know deadlines are flexible
- [ ] No policy on extensions

### Related Rules/Skills/Trees
- Rule: API-SUNSET-003 (Firm Sunset Deadlines)
- Skill: version-retirement-policy
- Tree: api-governance

---

## 4. Sunset Without Deprecation

### Category
Surprise Removal

### Description
Sending a `Sunset` header without a preceding `Deprecation` header. Consumers see a removal deadline without any prior warning.

### Why It Happens
The team starts the lifecycle at Warn/Enforce phase without going through Announce. Or the deprecation header was briefly present and removed.

### Warning Signs
- `Sunset` header appears without `Deprecation` header history
- Consumers report seeing a removal date without prior notice
- No deprecation entry in version changelog
- Sunet date is the first indication of deprecation
- Consumer asks "when was this deprecated?"

### Why Harmful
Consumers are surprised by removal deadlines. They didn't know the version was deprecated. The migration period effectively starts at the sunset date, which is supposed to be the end of the warning period.

### Real-World Consequences
An API starts sending `Sunset: March 2026` for V1 without sending `Deprecation` headers first. Consumers see the header in March 2025 and have only 12 months notice — but they thought they had 12 months from announcement. In reality, the sunset date was set 18 months after the initial (undocumented) deprecation decision.

### Preferred Alternative
Always precede `Sunset` header with `Deprecation` header for at least 6 months. The deprecation warning must come first.

### Refactoring Strategy
1. Add `Deprecation` header to versions that only have `Sunset`
2. Maintain deprecation header for 6 months minimum
3. Document the deprecation start date
4. Ensure the sunset date is at least 6 months after the deprecation date
5. Test that `Deprecation` appears before `Sunset` in lifecycle

### Detection Checklist
- [ ] Sunset header without deprecation history
- [ ] Consumers surprised by removal timeline
- [ ] No deprecation notice in changelog
- [ ] Sunset date < 6 months from first notice

### Related Rules/Skills/Trees
- Rule: API-SUNSET-004 (Deprecation Before Sunset)
- Skill: deprecation-header-implementation
- Tree: api-lifecycle

---

## 5. Missing 410 Response

### Category
Incomplete Enforcement

### Description
The sunset date passes but the version continues to serve data normally. No 410 Gone response is implemented. The header says "this will be removed" but removal never happens.

### Why It Happens
The team sets the `Sunset` header but never implements the enforcement code. They "forgot" or deprioritized the implementation.

### Warning Signs
- Past sunset date with no 410 enforcement
- Version still serving data after sunset
- No scheduled command or middleware for enforcement
- Code comments saying "TODO: enforce sunset"
- Sunset has been in config for 3+ years with no enforcement

### Why Harmful
The sunset is a promise to consumers. Breaking that promise erodes trust. Consumers who migrated based on the deadline feel foolish.

### Real-World Consequences
V1's sunset date was December 2024. It's now June 2025 and V1 still works. Five enterprise customers migrated their integrations at significant cost. Two of them ask for refunds because "we migrated for nothing — you never actually removed V1."

### Preferred Alternative
Implement 410 enforcement before setting the sunset date. Test that enforcement works as expected.

### Refactoring Strategy
1. Implement 410 response middleware or scheduled command
2. Write tests for sunset enforcement
3. Verify enforcement works in staging
4. Start enforcement on the published sunset date
5. Monitor for any issues during the first week of enforcement

### Detection Checklist
- [ ] Past sunset with no enforcement
- [ ] No 410 response implementation
- [ ] "TODO" comments for enforcement
- [ ] Consumers who migrated feel misled
- [ ] Enforcement not tested

### Related Rules/Skills/Trees
- Rule: API-SUNSET-005 (Sunset Enforcement Implementation)
- Skill: sunset-header-implementation
- Tree: api-lifecycle
