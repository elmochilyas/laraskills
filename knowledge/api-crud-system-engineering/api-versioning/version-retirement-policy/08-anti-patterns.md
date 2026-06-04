# Version Retirement Policy: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Version Retirement Policy |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Perpetual Support** — Fear of breaking consumers leads to never retiring old versions
2. **Surprise Retirement** — Version retired without following the policy's notice period
3. **Policy as Excuse** — Team uses policy to justify aggressive removal without consumer empathy
4. **No Exception Process** — Every retirement is either rigid or arbitrary
5. **Unenforced Policy** — Retirement policy exists but is never followed

## Repository-Wide Anti-Patterns

- Not publishing the retirement policy publicly
- No retirement calendar showing planned removals
- Retiring a version while the alternative is still in beta
- No post-retention 410 guarantee for consumer debugging

---

## 1. Perpetual Support

### Category
Cost Bloat

### Description
Old API versions are never retired because the team is afraid of breaking consumers. The number of supported versions grows over time, increasing maintenance cost.

### Why It Happens
Every retirement faces consumer pushback. The team backs down each time rather than managing the migration.

### Warning Signs
- 5+ active API versions simultaneously
- Oldest version is 5+ years old
- Team spends >30% of engineering on deprecated version maintenance
- No version has ever been retired
- Retirement always blocked by "important consumer" concerns
- New consumers still onboarded to old versions

### Why Harmful
Engineering cost grows linearly with the number of supported versions. New feature development slows. Security patches must be applied to every version. Infrastructure costs multiply.

### Real-World Consequences
An API supports V1 (6 years old), V2 (4 years), V3 (2 years), and V4 (current). The team spends 40% of engineering time maintaining V1 and V2. Feature velocity is 60% of what it should be. Two full-time engineers are dedicated to old version maintenance.

### Preferred Alternative
Establish a firm retirement policy with minimum notice periods. Provide migration support. Never create exceptions without executive approval.

### Refactoring Strategy
1. Set a maximum number of active versions (recommended: 3)
2. Create a retirement schedule for oldest versions
3. Offer migration support to struggling consumers
4. Automate retirement enforcement
5. Track the cost of maintaining each version
6. Publish the retirement policy and schedule

### Detection Checklist
- [ ] 4+ active versions
- [ ] No version ever retired
- [ ] High maintenance cost for old versions
- [ ] Consumers still onboarded to old versions
- [ ] No retirement schedule

### Related Rules/Skills/Trees
- Rule: API-RETIRE-001 (Maximum Active Versions)
- Skill: version-retirement-policy
- Tree: api-governance

---

## 2. Surprise Retirement

### Category
Trust Erosion

### Description
An API version is retired without following the policy's minimum notice period. Consumers are caught off guard by the removal.

### Why It Happens
Emergency (security vulnerability) or management pressure forces immediate removal. The policy's process is bypassed.

### Warning Signs
- Version retired with less than the minimum notice period
- Consumers report surprise at removal
- No deprecation or sunset headers were sent
- No prior communication about the removal
- Post-mortem shows policy bypass

### Why Harmful
Consumer trust is severely damaged. Consumers built integrations relying on the policy's guarantees. Surprise removal breaks those integrations.

### Real-World Consequences
A security vulnerability is found in V1. Management demands immediate removal. The team returns 410 without any notice. Three enterprise consumers have their production integrations break. Two file SLA breach claims.

### Preferred Alternative
Maintain a security patch process for retired versions. Only bypass the retirement policy for genuine emergencies, with full post-mortem and consumer apology.

### Refactoring Strategy
1. Create a security patch process for deprecated versions
2. Define what constitutes a genuine emergency
3. Require VP-level approval for policy bypass
4. Provide consumer communication within 24 hours of emergency removal
5. Add a post-mortem for every policy bypass

### Detection Checklist
- [ ] Version removed without notice period
- [ ] Consumers surprised
- [ ] Policy bypass without documentation
- [ ] No emergency process defined
- [ ] Security patches not available for deprecated versions

### Related Rules/Skills/Trees
- Rule: API-RETIRE-002 (Notice Period Enforcement)
- Skill: sunset-header-implementation
- Tree: api-governance

---

## 3. Policy as Excuse

### Category
Process Weaponization

### Description
The team uses the retirement policy to justify aggressive or premature version removal, ignoring consumer impact or migration readiness.

### Why It Happens
The team is tired of maintaining old versions. The policy becomes a tool to force consumers to migrate, rather than a guideline for orderly retirement.

### Warning Signs
- Policy cited as the sole reason for removal
- Consumer migration support minimal despite policy
- Removal timeline doesn't consider consumer readiness
- "Policy says so" is the response to extension requests
- Policy applied rigidly to all consumers regardless of circumstances
- No empathy in retirement communications

### Why Harmful
Consumers feel abused. The API provider is seen as hostile. Long-term partnerships are damaged.

### Real-World Consequences
A consumer is 2 weeks from completing their migration when the removal date arrives. The team refuses extension, citing "policy." The consumer's integration breaks. They move to a competitor's API.

### Preferred Alternative
Use the policy as a framework, not a weapon. Provide migration support. Offer reasonable extensions for consumers actively migrating.

### Refactoring Strategy
1. Add a consumer hardship clause to the policy
2. Require documented migration support for each retirement
3. Track consumer migration readiness before enforcement
4. Offer reasonable extensions with firm end dates
5. Separate policy governance from retirement execution

### Detection Checklist
- [ ] Policy cited as sole justification
- [ ] No migration support offered
- [ ] Extensions denied despite active migration
- [ ] Hostile tone in communications
- [ ] Policy applied without empathy

### Related Rules/Skills/Trees
- Rule: API-RETIRE-003 (Empathetic Retirement)
- Skill: api-style-guide-documentation
- Tree: developer-relations

---

## 4. No Exception Process

### Category
Rigidity

### Description
The retirement policy has no exception process. Every retirement is either applied rigidly (regardless of circumstances) or not at all.

### Why It Happens
The policy was written as a simple rule without considering edge cases. Exception processes were seen as "loopholes" to be avoided.

### Warning Signs
- No documented exception process
- Extensions are either always granted or never granted
- Exceptions handled informally (email, hallway conversation)
- No approval chain for exceptions
- Exceptions are inconsistent (some consumers get them, others don't)
- No exception tracking or reporting

### Why Harmful
Rigid enforcement breaks consumers. Arbitrary exceptions create unfairness. Informal exceptions can't be audited.

### Real-World Consequences
A major enterprise consumer requests a 3-month extension. Without an exception process, the request goes to a VP via email. The VP approves informally. Six other consumers requested extensions and were denied because their requests didn't reach the VP.

### Preferred Alternative
Define an exception process with criteria, approval chain, duration limits, and tracking.

### Refactoring Strategy
1. Document exception criteria (active migration, alternative instability, hardship)
2. Define approval chain (engineering manager → VP)
3. Set maximum extension duration (3 months)
4. Track all exceptions with rationale and expiry
5. Report exceptions in quarterly business review

### Detection Checklist
- [ ] No documented exception process
- [ ] Inconsistent exception handling
- [ ] Informal exception approvals
- [ ] Exceptions not tracked
- [ ] No exception reporting

### Related Rules/Skills/Trees
- Rule: API-RETIRE-004 (Exception Management)
- Skill: version-retirement-policy
- Tree: governance

---

## 5. Unenforced Policy

### Category
Theater

### Description
A retirement policy exists in documentation but is never enforced. Versions remain active indefinitely. The policy is not followed by the team.

### Why It Happens
The policy was written as a compliance requirement. No one owns its enforcement. The team ignores it in practice.

### Warning Signs
- Policy document exists but no one references it
- No automated enforcement of retirement criteria
- Retirement dates in policy are ignored
- No accountability for policy violations
- Team members unaware of the policy's contents
- Policy hasn't been reviewed or updated since creation

### Why Harmful
The policy has zero effect. Teams don't retire versions. The effort of writing the policy was wasted. Consumers have no expectations about version lifetimes.

### Real-World Consequences
A retirement policy was written 3 years ago requiring versions to be retired after 2 years. V1 is still active after 6 years. No one has ever referenced the policy. The team doesn't know it exists.

### Preferred Alternative
Assign ownership for policy enforcement. Automate retirement checks. Report policy compliance regularly.

### Refactoring Strategy
1. Assign policy owner
2. Implement automated retirement eligibility checks
3. Report compliance to leadership quarterly
4. Schedule policy review and updates
5. Integrate policy into development workflow
6. Remove the policy document if it can't be enforced

### Detection Checklist
- [ ] Policy exists but isn't followed
- [ ] No enforcement mechanism
- [ ] No policy owner
- [ ] Team unaware of policy
- [ ] No compliance reporting

### Related Rules/Skills/Trees
- Rule: API-RETIRE-005 (Policy Enforcement)
- Skill: api-lifecycle-governance
- Tree: governance
