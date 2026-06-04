# ECC Anti-Patterns — Deprecation Policy Design

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Lifecycle & Governance |
| **Knowledge Unit** | Deprecation Policy Design |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Perpetual Deprecation — Never Removing Deprecated Features
2. Silent Deprecation Without Headers or Notification
3. Deprecating Without a Migration Path
4. Single Notification Wave
5. Same Deprecation Window for All Endpoint Types

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Ticket-Driven Development
- Golden Hammer

---

## Anti-Pattern 1: Perpetual Deprecation — Never Removing Deprecated Features

### Category
Maintainability

### Description
Marking endpoints as deprecated but never setting a concrete sunset date or removing them, allowing deprecated code to accumulate indefinitely.

### Why It Happens
Removing deprecated code is perceived as risky and low-priority. Teams worry about breaking unknown consumers. Without usage monitoring, they cannot confirm zero traffic. The deprecation marker is added to satisfy the "documentation requirement," but the actual removal step is deferred forever.

### Warning Signs
- Endpoints marked deprecated for 2+ years with no removal date
- `Deprecation` header present but no `Sunset` header
- Deprecated endpoints appear in the spec but no removal schedule exists
- Codebase has commented-out or dead routes from deprecated versions
- No one on the team knows when a deprecated version will be removed
- Tech debt backlog includes "remove deprecated endpoints" tasks that never leave the backlog

### Why It Is Harmful
Perpetual deprecation accumulates technical debt that must be maintained, tested, and secured indefinitely. Consumers lose trust in deprecation signals — if endpoints marked "deprecated" never disappear, consumers stop taking deprecation seriously. The team maintains code for features they no longer want to support, diverting effort from current development.

### Real-World Consequences
An endpoint was deprecated in 2022 with no sunset date. In 2026, a security vulnerability is discovered in the underlying library. The team must patch four versions of the same endpoint because the deprecated version is still live. A simple security fix becomes a four-version deployment. The deprecated endpoint has 0.1% traffic but requires 25% of the remediation effort.

### Preferred Alternative
Always set a concrete `Sunset` date when deprecating. Establish a review cadence that removes deprecated code on schedule.

### Refactoring Strategy
1. Audit all deprecated endpoints and identify missing `Sunset` dates
2. Set concrete removal dates based on criticality (6-12 months from now)
3. Notify consumers of the new sunset dates
4. Build a deprecation calendar with automated reminders for each cutoff
5. After sunset, feature-flag removal, monitor for zero traffic, then delete

### Detection Checklist
- [ ] Count deprecated endpoints without `Sunset` headers
- [ ] Check deprecation dates — any still active after 18+ months?
- [ ] Verify every deprecated endpoint has a scheduled removal date
- [ ] Review tech debt backlog for deprecation removal tasks
- [ ] Confirm the team has a deprecation removal process

### Related Rules
- Never Perpetually Deprecate (05-rules.md)

### Related Skills
- Implement Deprecation Policy Design (06-skills.md)

### Related Decision Trees
- Deprecation Window Duration — 6 vs 12 Months (07-decision-trees.md)

---

## Anti-Pattern 2: Silent Deprecation Without Headers or Notification

### Category
Reliability

### Description
Removing or changing API functionality without informing consumers through `Deprecation`/`Sunset` HTTP headers, changelog entries, or direct notification — relying on consumers to discover breakage at runtime.

### Why It Happens
Internal teams treat API changes as internal refactoring. They underestimate the impact on consumers. The change is deployed as "just a normal update" without considering that existing integrations will break without warning.

### Warning Signs
- Endpoints change behavior without any deprecation period
- Consumers discover breakage at runtime (no prior warning)
- No `Deprecation` or `Sunset` headers on changing endpoints
- Changelog does not mention the change
- No consumer notification was sent before the change
- Support tickets spike after deployments that change API behavior

### Why It Is Harmful
Silent deprecation erodes consumer trust completely. Consumers build integrations expecting stability. When behavior changes without warning, production systems fail. Support teams are overwhelmed with "it was working yesterday" tickets. The API provider gains a reputation for unreliability that takes years to overcome.

### Real-World Consequences
A team renames `GET /v1/users` to `GET /v1/members`. No deprecation header, no changelog entry, no notification. The old route simply stops working after deployment. 50 consumer applications fail simultaneously. The support team receives 100+ tickets in the first hour. The CEO calls an all-hands incident response. Three teams work for 48 hours to revert and re-deploy with proper deprecation headers.

### Preferred Alternative
Always emit both `Deprecation` and `Sunset` HTTP headers on deprecated endpoints. Notify consumers via changelog, email, and dashboard.

### Refactoring Strategy
1. Implement a middleware that injects `Deprecation` and `Sunset` headers based on route attributes
2. Add `#[Deprecated(since: 'v2', sunset: '2026-11-01')]` attribute to deprecated routes
3. Add changelog entries for every deprecation announcement
4. Implement a notification system that emails affected consumers
5. Track deprecated endpoint usage to confirm consumers have migrated

### Detection Checklist
- [ ] Check recent deployments for behavior changes without deprecation headers
- [ ] Verify all deprecated endpoints emit `Deprecation` and `Sunset` headers
- [ ] Review changelog for deprecation entries aligned with code changes
- [ ] Confirm consumer notification system is in place
- [ ] Monitor support ticket patterns for "unexpected breakage" after deployments

### Related Rules
- Use Deprecation and Sunset HTTP Headers (05-rules.md)

### Related Skills
- Implement Deprecation Policy Design (06-skills.md)

### Related Decision Trees
- Deprecation Window Duration — 6 vs 12 Months (07-decision-trees.md)

---

## Anti-Pattern 3: Deprecating Without a Migration Path

### Category
Maintainability

### Description
Announcing that an endpoint or version is deprecated without providing consumers with documented instructions for migrating to the replacement.

### Why It Happens
The migration path may not be fully designed yet. The team deprecates first ("to give notice") and plans to write the migration guide later. "Later" never arrives because the team is busy building the replacement. Consumers are left with a "deprecated, use something else" message that provides no actionable guidance.

### Warning Signs
- Deprecation notice says "deprecated — use the new version" without specifying which version
- No migration guide exists in documentation
- No `Link` header with `rel="migration"` pointing to migration docs
- Support tickets ask "what should I use instead?"
- Deprecation announcement lacks specific upgrade instructions
- The replacement endpoint exists but its behavior differs in undocumented ways

### Why It Is Harmful
Without a migration path, consumers cannot comply with the deprecation. Support teams must individually guide each consumer through the migration. Some consumers will stay on the deprecated version past the cutoff, causing breakage. The deprecation becomes a support crisis rather than a smooth transition.

### Real-World Consequences
The team deprecates `GET /v1/users` with a 6-month window but no migration guide. The replacement `GET /v2/users` returns a different response format, requires different authentication, and uses different query parameters. Consumers who try to migrate independently fail. The support team spends 40 hours over the deprecation window hand-holding each consumer through the migration. 20% of consumers miss the sunset date and break.

### Preferred Alternative
Always document a complete migration path when deprecating any endpoint, field, or parameter. Include the `Link` header with `rel="migration"` pointing to the migration guide.

### Refactoring Strategy
1. Write the migration guide before announcing the deprecation
2. Include before/after code examples, changed fields, authentication differences
3. Add `Link: <https://docs.example.com/v1-to-v2>; rel="migration"` header alongside `Deprecation`
4. Test the migration guide by having a new developer follow it without assistance
5. Update the migration guide as edge cases are discovered during the deprecation window

### Detection Checklist
- [ ] Check every deprecation notification for migration path documentation
- [ ] Verify `Link` header with `rel="migration"` on deprecated endpoints
- [ ] Confirm migration guide covers all behavioral differences
- [ ] Test migration guide with a consumer unfamiliar with the change
- [ ] Audit support tickets — are consumers asking "what should I use?"

### Related Rules
- Always Provide Migration Path (05-rules.md)

### Related Skills
- Implement Deprecation Policy Design (06-skills.md)

### Related Decision Trees
- Deprecation Window Duration — 6 vs 12 Months (07-decision-trees.md)

---

## Anti-Pattern 4: Single Notification Wave

### Category
Reliability

### Description
Sending only one deprecation notification (typically at announcement) and never following up, assuming all consumers received and acted upon the single message.

### Why It Happens
A single notification is easy to send. Teams have automated deprecation announcement systems but lack reminder scheduling. The assumption is that "we told them once, it's their responsibility." Teams underestimate how easily a single notification is missed.

### Warning Signs
- Deprecation is announced once and never mentioned again
- Consumers claim they "never received" deprecation notice at cutoff time
- No automated reminder system exists
- Deprecation notifications are sent only via one channel (e.g., email only)
- Support team handles "I didn't know" escalations during cutoff
- No midpoint or 30-day-before reminders are sent

### Why It Is Harmful
Single notifications are easily missed. Emails go to spam, are read by someone who left the company, or are buried in inbox overload. A single changelog entry scrolls off the page. Consumers who miss the notification discover the deprecation only at cutoff — when their production systems break. The API provider bears the blame for inadequate communication.

### Real-World Consequences
The team sends one deprecation email to the registered technical contact for each consumer. The email goes to `dev-team@consumer-company.com`. The key developer who actually integrates the API left the company 3 months ago. The new developer never saw the email. Six months later, the cutoff hits. The consumer's integration breaks. The consumer escalates to their VP, who calls the API provider's VP. A goodwill extension is granted. Trust is damaged.

### Preferred Alternative
Send deprecation notifications in at least three waves: at announcement, at midpoint, and 30 days before cutoff. Use multiple channels: HTTP headers, changelog, email, and dashboard.

### Refactoring Strategy
1. Set up a deprecation notification scheduler with at least three waves
2. Use multiple channels: email, changelog, dashboard banner, HTTP headers
3. Track notification delivery and open rates for email notifications
4. For high-value consumers, make personal outreach calls at midpoint
5. At 30-day mark, confirm migration progress and offer assistance

### Detection Checklist
- [ ] Check automated deprecation notification schedule for wave count
- [ ] Verify notification channels include headers, changelog, email
- [ ] Confirm email delivery and open rates are tracked
- [ ] Test that a new consumer registration receives all three waves
- [ ] Review past deprecation incidents — did single-notification consumers miss the cutoff?

### Related Rules
- Send Multiple Notification Waves (05-rules.md)

### Related Skills
- Implement Deprecation Policy Design (06-skills.md)

### Related Decision Trees
- Notification Channels — Headers vs Email vs Docs (07-decision-trees.md)

---

## Anti-Pattern 5: Same Deprecation Window for All Endpoint Types

### Category
Architecture

### Description
Applying a uniform deprecation window (e.g., 6 months) to all endpoints regardless of criticality, migration complexity, or consumer impact — treating a payment API change the same as an internal utility endpoint change.

### Why It Happens
Simple policies are easier to implement and communicate. A single window requires no classification logic, no per-endpoint configuration, and no criticality assessment. Teams optimize for internal simplicity at the expense of consumer experience.

### Warning Signs
- All deprecated endpoints have the same window length
- Payment/auth endpoints have the same deprecation period as utility endpoints
- No endpoint criticality classification exists in the deprecation policy
- Consumers on critical endpoints request extensions during cutoff
- Migration complexity is not considered when setting windows
- Emergency exception requests are common for certain endpoint types

### Why It Is Harmful
A uniform window that works for utility endpoints is far too short for critical endpoints like payments, authentication, or data export. Critical consumers are forced into rushed migration or request exceptions. The team spends more time processing exception requests than they saved by using a simple window. Worse, some consumers miss the cutoff entirely and break.

### Real-World Consequences
A 6-month uniform deprecation window is applied to all endpoints. The team deprecates a payment processing endpoint with complex integration patterns. Consumers must recertify their PCI compliance with the new endpoint. PCI recertification takes 8-12 months. Every single consumer requests a deprecation extension. The team processes 30 exception requests, grants 6-month extensions to all, and the "simple" deprecation window becomes a complex exception management process.

### Preferred Alternative
Vary the deprecation window by endpoint criticality: 12 months for critical endpoints (payments, auth, data export), 6 months for standard endpoints. Consider migration complexity when setting windows.

### Refactoring Strategy
1. Classify all endpoints by criticality (critical, standard, internal)
2. Set deprecation windows based on criticality classification
3. For critical endpoints, add migration complexity assessment and adjust window upward if needed
4. Automate window selection based on endpoint metadata
5. Review and approve any deviations from the standard window

### Detection Checklist
- [ ] Check if endpoint criticality classification exists
- [ ] Verify deprecation windows vary by endpoint type
- [ ] Review critical endpoints for adequate windows (12+ months)
- [ ] Check exception request patterns — are certain endpoint types over-represented?
- [ ] Confirm migration complexity is assessed for critical endpoints

### Related Rules
- Vary Deprecation Window by Endpoint Criticality (05-rules.md)

### Related Skills
- Implement Deprecation Policy Design (06-skills.md)

### Related Decision Trees
- Deprecation Window Duration — 6 vs 12 Months (07-decision-trees.md)

---

