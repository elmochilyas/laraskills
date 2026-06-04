# Anti-Patterns: Deprecation Headers

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-03 |
| **Domain** | API Integration Engineering |
| **Subdomain** | API Versioning |
| **Type** | Implementation |
| **Version** | 1.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Silent Deprecation](#1-silent-deprecation)
2. [Evergreen Deprecation](#2-evergreen-deprecation)
3. [Reactive Version Removal](#3-reactive-version-removal)
4. [Header-Only Communication](#4-header-only-communication)

---

## 1. Silent Deprecation

### Category
Communication Failure

### Description
Deprecating an API version or endpoint without adding any HTTP headers (Deprecation, Sunset, or Link) to notify consumers. Consumers receive no automated signal that the version they depend on is being phased out. They discover the deprecation only when the version is removed and their integration breaks.

### Why It Happens
- Ignorance of RFC 8594 and standard deprecation headers
- Manual deprecation communication (emails, docs) considered sufficient
- No middleware infrastructure for header injection
- Assumption that consumers read changelogs and documentation
- "We told them in the release notes" without automated signals

### Warning Signs
- Deprecated endpoints return no Deprecation header
- No Sunset header with removal date
- Consumers surprised when version is removed
- Changelog mentions deprecation but API responses don't
- No middleware for deprecation headers
- Deprecation communication is manual only (emails, Slack)

### Why Harmful
- Automated consumer tooling cannot detect deprecation
- Consumers cannot plan migration (no timeline signal)
- Removal always surprises consumers, causing emergency migrations
- Trust damaged when consumers are not proactively warned
- Manual communication is fragile: missed emails, personnel changes

### Real-World Consequences
- Consumer's integration breaks without warning when version removed
- Automated monitoring system doesn't flag deprecated versions (no header to check)
- Enterprise customer's legal agreement requires 6 months notice; emergency negotiation required
- Support team overwhelmed by "our integration stopped working" tickets

### Preferred Alternative
Add Deprecation and Sunset headers to all deprecated endpoints from the moment deprecation is decided. Use middleware for consistent application. Include Link header pointing to the replacement.

### Refactoring Strategy
1. Implement deprecation middleware that adds standard headers
2. Apply middleware to all deprecated route groups
3. Configure realistic Sunset dates based on usage analytics
4. Add Link headers with successor version URLs
5. Monitor header delivery in API analytics

### Detection Checklist
- [ ] All deprecated endpoints return `Deprecation: true` header
- [ ] Sunset header with valid HTTP-date is present
- [ ] Link header with successor version is present
- [ ] Deprecation headers are applied via middleware (consistent)

### Related Rules/Skills/Trees
- Skill: Implement Deprecation Headers

---

## 2. Evergreen Deprecation

### Category
Lifecycle Management Failure

### Description
Setting a Sunset date for a deprecated API version but perpetually extending it—never actually following through with removal. The deprecation is announced, the Sunset date is set, but when the date arrives, the team extends it because "consumers aren't ready yet." This repeats indefinitely: the version is permanently "almost removed" but never actually removed.

### Why It Happens
- Fear of breaking remaining consumers
- No data-driven criteria for when removal is acceptable
- Corporate risk aversion: removal perceived as "customer satisfaction" risk
- No enforcement mechanism or automated removal
- "Next quarter" mentality that keeps deferring

### Warning Signs
- Same endpoint has had Sunset dates extended multiple times
- Original Sunset date was 12+ months ago; endpoint still active
- No consumers on old version but it remains running
- Team cannot articulate when removal will actually happen
- Evergreen deprecation is accepted as normal
- No difference between deprecated and non-deprecated versions behaviorally

### Why Harmful
- Deprecation loses all meaning—consumers ignore deprecation headers as noise
- Maintenance cost of old version continues indefinitely
- Team resources drained supporting unused version
- No incentive for consumers to migrate (deadline is never enforced)
- New versions adoption stalls because old version never truly removed

### Real-World Consequences
- v1 "sunset" extended 4 times over 2 years, still running
- Consumers ignore v2 migration because v1 is still available
- 3 developers maintain 4 API versions with <2% traffic on oldest
- New API features delayed by old version compatibility requirements

### Preferred Alternative
Set realistic Sunset dates based on usage analytics. Enforce removal on schedule. If consumers need more time, grant one extension with a final date. After that, remove the version. For critical consumers, offer a custom migration path, not an indefinite extension.

### Refactoring Strategy
1. Audit all evergreen deprecations and set firm final removal dates
2. Communicate final dates to remaining consumers
3. Offer dedicated migration support for straggler consumers
4. Remove versions on schedule, regardless of remaining usage
5. Establish policy: maximum one extension per deprecated version
6. Automate version removal after Sunset date

### Detection Checklist
- [ ] Deprecated versions have firm, enforced Sunset dates
- [ ] No perpetual extensions beyond one exception
- [ ] Version removal happens on schedule
- [ ] Deprecation timeline is communicated to consumers

### Related Rules/Skills/Trees
- Skill: Implement Deprecation Headers

---

## 3. Reactive Version Removal

### Category
Decision-Making Failure

### Description
Removing API versions based on emotional reactions rather than data. A developer or product manager becomes frustrated with maintaining an old version and pushes for removal based on their own annoyance rather than on usage analytics, migration readiness, or consumer impact assessment. Versions are removed impulsively, breaking consumers who still rely on them.

### Why It Happens
- Maintenance frustration: old versions are annoying to support
- No version usage analytics to inform decisions
- Individual developer's frustration drives team decisions
- No formal version removal process
- "No one uses this" assumption without data

### Warning Signs
- Version removal decisions based on "I think no one uses it"
- No analytics data consulted before removal
- Removal driven by frustration rather than data
- Consumers surprised by removal announcement
- No migration period or support offered for remaining consumers
- Team has no version usage monitoring

### Why Harmful
- Consumers relying on old version are broken without warning
- Business relationships damaged by unilateral removal
- Revenue impact from consumer integration downtime
- Team must scramble to restore removed version
- Emotional decisions replace data-driven lifecycle management

### Real-World Consequences
- Developer removes v1 because "it's ugly code"; major customer uses v1 exclusively
- Version removed based on assumption; analytics later show 15% traffic on old version
- Emergency restore required, creating security incident window
- Consumer files SLA breach claim for unplanned breaking change

### Preferred Alternative
Base version removal decisions on usage analytics. Define thresholds: remove when usage drops below X% or Y requests/month. Communicate removal proactively with migration support. Never remove a version based on emotion or assumption.

### Refactoring Strategy
1. Implement version usage analytics (per-version traffic tracking)
2. Define data-driven removal criteria (e.g., <1% traffic for 3 months)
3. Establish a formal version removal process with approval workflow
4. Communicate removal plans to affected consumers with migration timeline
5. Automate version usage reporting so decisions are data-driven

### Detection Checklist
- [ ] Version removal decisions are based on usage analytics
- [ ] Data-driven removal criteria are defined
- [ ] Formal removal process exists and is followed
- [ ] Consumers are notified before removal

### Related Rules/Skills/Trees
- Skill: Implement Deprecation Headers

---

## 4. Header-Only Communication

### Category
Communication Strategy Failure

### Description
Relying solely on HTTP deprecation headers as the only mechanism for notifying consumers about deprecation. No direct communication (email, documentation updates, developer portal announcements, or direct contact). Consumers that don't inspect headers (many don't) are completely unaware of the deprecation until their integration breaks.

### Why It Happens
- "Headers are the standard, that should be sufficient" mindset
- No access to consumer contact information
- Large consumer base makes direct communication seem impractical
- Automated approach preferred over manual outreach
- Assumption that all consumers monitor API response headers

### Warning Signs
- Deprecated endpoints have headers but no other notification
- Consumer emails not collected or maintained
- No deprecation section in developer portal
- No blog posts or changelog entries about deprecation
- Consumers discover deprecation when version is removed
- No dedicated deprecation communication channel

### Why Harmful
- Many consumers don't inspect response headers—they miss the signal
- Header-only communication assumes technical sophistication not all consumers have
- No audit trail that consumers were notified
- Compliance risk: contractual notification requirements not met
- Consumers feel betrayed when "notified" via headers they never check

### Real-World Consequences
- Small business integration: no one monitors Deprecation headers, misses migration window
- Enterprise consumer's contract requires 90 days written notice; header-only fails legal requirement
- Consumer discovers deprecation via tweet (not header inspection)
- Support team handles avoidable "why was this removed?" tickets

### Preferred Alternative
Use deprecation headers as the automated signal, but supplement with direct communication: email notifications to registered developers, changelog entries, developer portal announcements, and direct outreach to high-traffic consumers.

### Refactoring Strategy
1. Collect consumer contact information during API registration
2. Implement email notifications for version deprecation and sunset
3. Post deprecation notices in developer portal
4. Add deprecation announcements to API changelog
5. Directly contact high-traffic consumers about migration
6. Use deprecation headers as supplement, not replacement

### Detection Checklist
- [ ] Multiple communication channels used (not just headers)
- [ ] Consumer contact information is collected and maintained
- - [ ] Email notifications are sent for deprecation events
- [ ] Changelog and developer portal announce deprecations
