# ECC Anti-Patterns — Version Retirement Process

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Lifecycle & Governance |
| **Knowledge Unit** | Version Retirement Process |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Hard Cutoff Without Warning
2. Perpetual Freeze — Version Stuck in Limbo
3. No Exception Mechanism for Stranded Consumers
4. Retiring Without Consumer Audit
5. Deleting Spec and Docs When Version Is Removed

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Ticket-Driven Development

---

## Anti-Pattern 1: Hard Cutoff Without Warning

### Category
Reliability

### Description
Removing a version at the sunset date with no transitional stage — no deprecation headers, no 410 response, no migration link — simply returning 404 Not Found, breaking every consumer simultaneously.

### Why It Happens
The team treats the sunset date as a "delete the code" event. Routes are removed from the router, controllers are deleted, and the version simply stops existing. The engineering team considers the job done at midnight on the sunset date, with no consideration for late migrators.

### Warning Signs
- After sunset date, version returns 404 Not Found
- No `Deprecation` or `Sunset` headers were ever emitted
- No 410 Gone stage exists in the retirement plan
- Consumers discover version removal only when their applications break
- No migration `Link` header on the dead endpoint
- Support tickets flood in after sunset date

### Why It Is Harmful
A hard cutoff with 404 creates maximum consumer disruption. 404 is semantically identical to "this URL never existed" — consumers have no way to distinguish a broken link from an intentional removal. They must debug to discover that a version was retired. Every consumer's integration breaks simultaneously, creating a mass outage event.

### Real-World Consequences
The team deletes all v1 routes at midnight. A consumer's automated billing job runs at 2 AM. Every customer data API call returns 404. The billing job crashes. 10,000 invoices are not generated. The consumer discovers the issue the next morning and escalates to their account manager. The API provider's VP of Engineering gets an urgent call at 7 AM.

### Preferred Alternative
Implement traffic-light retirement stages: Green (active) → Yellow (frozen + deprecation headers) → Red (410 Gone with migration link) → Black (404 after grace period).

### Refactoring Strategy
1. Implement stage-based version routing at the gateway level
2. Progress through stages on a defined schedule, not a single cutoff
3. Return 410 Gone with `Link: <migration-guide>; rel="migration"` for the Red stage
4. Add `Deprecation` and `Sunset` headers during the Yellow stage
5. After a 30-day grace period, transition to Black (404)

### Detection Checklist
- [ ] Check what the retired version currently returns (404 vs 410)
- [ ] Verify `Deprecation` headers were present before removal
- [ ] Confirm `Link` header points to migration guide in 410 response
- [ ] Review retirement plan — does it include traffic-light stages?
- [ ] Test accessing the retired version — is the error actionable?

### Related Rules
- Implement Traffic-Light Retirement Stages (05-rules.md)
- Return 410 Gone with Migration Link, Not Bare 404 (05-rules.md)

### Related Skills
- Retire API Versions (06-skills.md)

### Related Decision Trees
- Retirement Stage Progression Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Perpetual Freeze — Version Stuck in Limbo

### Category
Maintainability

### Description
Freezing a version (no new features, only security patches) but never scheduling or completing its retirement — the version exists in a frozen state for months or years.

### Why It Happens
The freeze decision is easy ("stop adding features to v1, focus on v2"). The retirement decision is hard (requires migration, risks consumer breakage, needs coordination). The team defers the retirement indefinitely, accumulating maintenance burden on a version they want to eliminate.

### Warning Signs
- Version has been in "frozen" state for over 12 months
- No sunset date has been set for the frozen version
- Team keeps fixing bugs in frozen version because "it's still live"
- Frozen version consumes 20%+ of maintenance effort
- No active consumers are being migrated off the frozen version
- Product roadmap has no milestone for completing the retirement

### Why It Is Harmful
A perpetual freeze is the worst of both worlds: the team must maintain the old version (security patches, bug fixes, compatibility) while also developing the new version. Consumers have no incentive to migrate because the old version still works perfectly. The frozen version's maintenance burden diverts resources from new development indefinitely.

### Real-World Consequences
v1 was frozen 18 months ago. The team maintains both v1 and v2 codebases. Every security patch must be applied twice. Every database schema change must be backward-compatible with v1's query patterns. A critical bug discovered in the shared authentication code requires fixes in both versions. The maintenance overhead of the frozen v1 is 3 engineering days per sprint — 15% of the team's capacity.

### Preferred Alternative
Schedule a concrete sunset date at the time of freeze. The freeze is the start of the retirement countdown, not an indefinite holding state.

### Refactoring Strategy
1. If a version is frozen without a sunset date, set one immediately
2. Notify consumers of the new retirement timeline
3. Begin active migration outreach to all consumers on the frozen version
4. Set milestones for the freeze-to-retirement transition
5. Track migration progress to ensure the sunset date is achievable

### Detection Checklist
- [ ] Identify versions in frozen state for 12+ months
- [ ] Check if frozen versions have sunset dates
- [ ] Measure maintenance effort spent on frozen versions
- [ ] Verify consumer migration progress is being tracked
- [ ] Confirm retirement is on the product roadmap

### Related Rules
- Audit All Consumers Before Announcing Freeze (05-rules.md)

### Related Skills
- Retire API Versions (06-skills.md)

### Related Decision Trees
- Consumer Exception Handling (07-decision-trees.md)

---

## Anti-Pattern 3: No Exception Mechanism for Stranded Consumers

### Category
Governance

### Description
Enforcing a hard cutoff with no mechanism to grant temporary exceptions to consumers who cannot migrate in time, leading to business escalations and emergency hotfix deployments.

### Why It Happens
A hard deadline is simple to enforce. Teams design the retirement process assuming all consumers will migrate on schedule. When exceptions are needed, they must be handled ad-hoc — hotfix deploys, manual allowlists, or temporary route re-additions — all of which are error-prone and stressful.

### Warning Signs
- No allowlist mechanism exists in the version routing layer
- After cutoff, the team must hotfix-deploy to restore access for specific consumers
- Exception requests are handled manually one-by-one
- No expiration dates on granted exceptions
- Leadership escalation required for every exception
- Post-mortems cite "no exception mechanism" as a root cause

### Why It Is Harmful
Without an exception mechanism, the team has two bad options: break consumers or deploy emergency hotfixes. Both erode trust. Emergency hotfixes are risky and may not meet compliance review. The absence of a standard exception process turns every missed cutoff into a crisis, consuming leadership attention and engineering time.

### Real-World Consequences
A cutoff hits at midnight. Three enterprise consumers have not migrated. Their production systems break. The VP of Sales calls the CTO. The engineer who deleted the v1 routes is paged at 3 AM to hotfix-restore them. The restoration bypasses normal deployment checks. The hotfix introduces a regression in v2 routing. The 3 AM fire drill produces 8 hours of engineering overhead for what should have been a 5-minute allowlist toggle.

### Preferred Alternative
Implement an exception mechanism with expiration dates as part of the retirement process. Grant temporary allowlist access with automatic reminders before expiry.

### Refactoring Strategy
1. Build an allowlist that grants access to the retired version by consumer ID
2. Every allowlist entry must have an expiration date (max 90 days)
3. Send automated reminders 30, 14, and 7 days before expiration
4. Require management approval for exceptions beyond standard limits
5. Track exception counts and report on retirement progress quarterly

### Detection Checklist
- [ ] Check if an exception/allowlist mechanism exists
- [ ] Verify all exceptions have expiration dates
- [ ] Confirm exception grant requires approval
- [ ] Test that expired exceptions are automatically enforced
- [ ] Review exception frequency — are consumers repeatedly requesting extensions?

### Related Rules
- Grant Exceptions with Expiration Dates (05-rules.md)

### Related Skills
- Retire API Versions (06-skills.md)

### Related Decision Trees
- Consumer Exception Handling (07-decision-trees.md)

---

## Anti-Pattern 4: Retiring Without Consumer Audit

### Category
Maintainability

### Description
Announcing and executing a version retirement without first identifying all active consumers, leading to breakage for unknown consumers who were not notified.

### Why It Happens
Team assumes they know all consumers based on internal knowledge. They may have lost track of integrations built by partner teams, acquired companies, or marketing-automation tools. The consumer registry is incomplete or non-existent.

### Warning Signs
- No consumer registry exists before retirement announcement
- Consumer audit is skipped or based on "known consumers" only
- After cutoff, consumers emerge who were never contacted
- Support tickets reference "we didn't know this was being retired"
- Integration count in the audit differs significantly from actual usage data
- Notifications were sent to outdated contact lists

### Why It Is Harmful
Unknown consumers discovered after cutoff have had zero migration time. They cannot migrate instantly. Their production systems break. The team must either grant emergency exceptions (undermining the retirement) or break the consumer (damaging the relationship). Both outcomes are avoidable with a proper consumer audit.

### Real-World Consequences
The team retires v1 based on a known consumer list of 15 organizations. After the cutoff, a marketing agency's integration breaks. The integration was built by a contractor who left the company 2 years ago. No one on the consumer's team knows about it. The API provider's support team traces the traffic history and discovers the integration had been making 50,000 requests/day to v1 for 3 years. The consumer was never in the registry.

### Preferred Alternative
Complete a full consumer audit before announcing a version freeze. Identify every active consumer, their contact information, and their integration depth.

### Refactoring Strategy
1. Query access logs for the past 12 months to identify every unique consumer calling the version
2. Cross-reference with the consumer registry and update missing entries
3. Contact every identified consumer to confirm integration details and contacts
4. Document integration depth (read-only vs read-write, single endpoint vs full surface)
5. Only announce freeze after the audit is complete and all consumers are accounted for

### Detection Checklist
- [ ] Check if a consumer audit was completed before retirement
- [ ] Compare audit results against actual access logs
- [ ] Verify all identified consumers have current contact information
- [ ] Confirm notification was sent to every audited consumer
- [ ] Check for surprise consumers after cutoff

### Related Rules
- Audit All Consumers Before Announcing Freeze (05-rules.md)

### Related Skills
- Retire API Versions (06-skills.md)

### Related Decision Trees
- Notification Wave Timing (07-decision-trees.md)

---

## Anti-Pattern 5: Deleting Spec and Docs When Version Is Removed

### Category
Maintainability

### Description
Deleting the OpenAPI specification and documentation for a retired version at the same time as removing the code, leaving no historical reference for debugging, compliance, or archived consumer support.

### Why It Happens
Spec and docs are treated as part of the version's code. When routes are deleted, the spec file is deleted too. The team assumes that once a version is retired, no one will ever need its documentation again.

### Warning Signs
- Spec file for retired version no longer exists
- Documentation site shows 404 for retired version's docs
- Compliance team requests archived spec and cannot find it
- Support team cannot debug legacy consumer issues because docs are gone
- Consumer on an expired exception needs to reference old docs
- No archive process exists in the retirement checklist

### Why It Is Harmful
Retired version documentation is needed for: debugging legacy consumer issues during the grace period, compliance audits requiring historical API contracts, supporting consumers on allowed exceptions, future-proofing against "what did the old API look like?" questions. Without archived docs, every one of these needs becomes a research project.

### Real-World Consequences
A consumer on a 90-day exception encounters a bug in the retired v1 endpoint. They file a support ticket. The support team goes to the documentation site — v1 docs return 404. The OpenAPI spec was deleted with the routes. The team must reconstruct the expected behavior from git history and knowledge transfer. What should be a 30-minute debug takes 3 hours of archaeology.

### Preferred Alternative
Archive the OpenAPI specification and documentation to read-only storage before removing a retired version. Never delete the spec when the version is removed.

### Refactoring Strategy
1. Add "Archive spec" as a required step in the retirement checklist before route removal
2. Store archived specs in a separate S3 bucket or CDN path with long cache headers
3. Add a note in the archived spec indicating it is historical and the version is retired
4. Ensure archived specs are accessible to support and compliance teams
5. Link to archived docs from the 410 response for consumers on exceptions

### Detection Checklist
- [ ] Check if retired version's spec is still accessible
- [ ] Verify spec archival is in the retirement checklist
- [ ] Confirm archived spec location is known to support and compliance
- [ ] Test accessing archived spec after version routes are removed
- [ ] Review archived spec for any security-sensitive information before making public

### Related Rules
- Archive Spec and Docs Before Removal (05-rules.md)

### Related Skills
- Retire API Versions (06-skills.md)

### Related Decision Trees
- Retirement Stage Progression Strategy (07-decision-trees.md)

---

