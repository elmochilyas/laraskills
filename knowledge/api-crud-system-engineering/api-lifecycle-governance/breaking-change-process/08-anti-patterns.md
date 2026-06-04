# ECC Anti-Patterns — Breaking Change Process

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Lifecycle & Governance |
| **Knowledge Unit** | Breaking Change Process |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Impact Analysis Before Implementation
2. CAB as a Rubber Stamp
3. Big-Bang Rollout Without Progressive Stages
4. Untested Migration Guide Examples
5. Emergency Exception Abuse

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Ticket-Driven Development

---

## Anti-Pattern 1: No Impact Analysis Before Implementation

### Category
Architecture

### Description
Implementing a breaking change without conducting a quantitative impact analysis to determine how many consumers are affected, at what severity, and with what migration effort.

### Why It Happens
The developer "knows" the change is small and assumes few consumers are affected. Sprint pressure prioritizes implementation over research. The team skips the audit because it requires querying access logs, contacting consumers, and estimating effort — all of which takes time.

### Warning Signs
- Breaking change RFC lacks quantitative impact analysis
- "It only affects a few consumers" is stated without data
- No consumer registry query was performed before implementation
- Migration window is set without knowing migration complexity
- Affected consumers are discovered only after rollout
- Estimate of affected consumers differs significantly from actual incident impact

### Why It Is Harmful
Without impact analysis, the team cannot make informed decisions. A change affecting 5 consumers with trivial migration is very different from one affecting 500 consumers with complex migration. Without data, the migration window, consumer outreach, and rollout plan are all guesses. The first signal of real impact is post-deployment breakage.

### Real-World Consequences
A team implements a response format change assuming "maybe 10 consumers" are affected. They set a 3-month migration window. After deployment, they discover 200 consumers were using the old format, many with complex integration logic. The migration window is far too short. 50 consumers miss the cutoff and break. The team spends 3 months in damage control.

### Preferred Alternative
Complete a quantitative impact analysis before implementing any breaking change. Query access logs, identify affected consumers, estimate migration effort per consumer.

### Refactoring Strategy
1. Before implementing, query access logs for the past 12 months to identify all consumers using the affected endpoints
2. Cross-reference with the consumer registry to identify contacts
3. Estimate migration effort per consumer based on integration complexity
4. Document the impact analysis in the RFC
5. Use the analysis to set appropriate migration window and outreach plan

### Detection Checklist
- [ ] Check breaking change RFCs for impact analysis section
- [ ] Verify impact analysis includes consumer count, severity, and migration effort
- [ ] Confirm access logs were queried, not just known consumers listed
- [ ] Test that estimated migration effort matches actual effort for past changes
- [ ] Add impact analysis as required field in RFC template

### Related Rules
- Require RFC with Impact Analysis Before Implementation (05-rules.md)

### Related Skills
- Manage Breaking Changes (06-skills.md)

### Related Decision Trees
- RFC Approval Process — CAB Review vs Lightweight Team Review (07-decision-trees.md)

---

## Anti-Pattern 2: CAB as a Rubber Stamp

### Category
Governance

### Description
The Change Advisory Board (CAB) reviews breaking change RFCs but approves every submission without meaningful discussion, making the review process a formality rather than a safeguard.

### Why It Happens
CAB members are busy with their own work. Reading RFCs thoroughly takes time. If the proposer is a respected team member, reviewers assume the change is well-considered. Over time, the CAB meeting becomes a checklist: "Any objections?" → silence → "Approved."

### Warning Signs
- All RFCs submitted to CAB are approved
- CAB meetings last under 15 minutes for multiple RFCs
- Reviewers do not ask questions or request changes
- No RFCs are ever rejected or sent back for revision
- CAB members admit they skim RFCs before the meeting
- Post-mortems reveal issues that CAB review should have caught

### Why It Is Harmful
A rubber-stamp CAB provides false security. The team believes breaking changes have been reviewed, but no actual scrutiny occurred. Problems that should have been caught — insufficient migration windows, missed affected consumers, incomplete migration guides — pass through to implementation. The CAB process consumes time without providing value.

### Real-World Consequences
A breaking change RFC is submitted to CAB. The reviewers approve it in 10 minutes with no questions. The change removes a field that a high-revenue enterprise consumer depends on — a fact documented in the RFC's impact analysis that no reviewer read. The consumer breaks after deployment. The enterprise account churns to a competitor. The post-mortem finds the data was in the RFC all along; no one read it.

### Preferred Alternative
CAB must review RFCs with genuine scrutiny. Each RFC should be read in full before approval. Reviewers must ask questions, challenge assumptions, and occasionally reject proposals.

### Refactoring Strategy
1. Require RFCs to be distributed 48 hours before the CAB meeting
2. Require each CAB member to submit at least one question or comment per RFC
3. Separate the "read and comment" phase from the "vote" phase
4. Track CAB approval statistics — rejections and rework requests should be non-zero
5. Rotate CAB members periodically to prevent groupthink

### Detection Checklist
- [ ] Review CAB meeting duration per RFC — is it sufficient for thorough review?
- [ ] Check approval rate — how many RFCs are rejected or sent back?
- [ ] Survey CAB members — do they feel they have time to review thoroughly?
- [ ] Compare pre-CAB RFC quality vs post-CAB — are improvements being made?
- [ ] Review post-mortems — how often are CAB-missed issues identified?

### Related Rules
- Obtain CAB Approval Before Implementation (05-rules.md)

### Related Skills
- Manage Breaking Changes (06-skills.md)

### Related Decision Trees
- RFC Approval Process — CAB Review vs Lightweight Team Review (07-decision-trees.md)

---

## Anti-Pattern 3: Big-Bang Rollout Without Progressive Stages

### Category
Reliability

### Description
Deploying a breaking change to 100% of consumers simultaneously without progressive rollout stages, monitoring gates, or rollback capability.

### Why It Happens
The team is confident the change is correct. Testing passed in staging. Progressive rollout adds complexity and time. The "just ship it" culture prioritizes speed over safety. The team believes that if it works in staging, it works everywhere.

### Warning Signs
- Breaking change is enabled for all consumers on the first deployment
- No feature flag or percentage-based rollout mechanism exists
- No monitoring gates are defined for each rollout stage
- Rollback requires a full redeployment
- Consumer impact is binary: all affected or none
- "We tested it in staging, it's fine" is the deployment justification

### Why It Is Harmful
Big-bang rollout makes every consumer a test subject simultaneously. If the change has an undiscovered bug, every consumer experiences it at once. The impact is a full production incident rather than a detected-and-rolled-back issue at 1%. The team loses the ability to limit blast radius.

### Real-World Consequences
A breaking change to the pagination response format is deployed to 100% of consumers at once. A bug in the new cursor-encoding logic causes the first page of every paginated response to be empty for large datasets. Every consumer's pagination loop returns zero results for the first page. 300 consumer applications are affected within 5 minutes. Full rollback takes 30 minutes.

### Preferred Alternative
Roll out breaking changes progressively: 1% -> 5% -> 25% -> 100% of consumers, with monitoring gates at each stage.

### Refactoring Strategy
1. Implement feature flag infrastructure that supports percentage-based rollouts
2. Define monitoring gates for each stage (error rate, latency, consumer complaints)
3. Configure rollout stages with minimum duration between transitions
4. Set up automatic rollback if monitoring gates fail at any stage
5. Document the rollout plan in the RFC

### Detection Checklist
- [ ] Check if feature flags support percentage-based rollout
- [ ] Verify monitoring gates are defined for each stage
- [ ] Confirm automatic rollback triggers exist
- [ ] Test that 1% rollout works and can be measured
- [ ] Review past rollout incidents — would progressive rollout have limited impact?

### Related Rules
- Progressive Rollout with Monitoring Gates (05-rules.md)
- Dark Launch Breaking Changes Behind Feature Flags (05-rules.md)

### Related Skills
- Manage Breaking Changes (06-skills.md)

### Related Decision Trees
- Rollout Strategy — Big-Bang vs Progressive Rollout (07-decision-trees.md)

---

## Anti-Pattern 4: Untested Migration Guide Examples

### Category
Maintainability

### Description
Writing migration guide code examples that are never tested against the actual API, so consumers receive broken or incorrect code snippets that block their migration.

### Why It Happens
Examples are written manually during the RFC phase. The team runs the examples once during development but does not commit them as tests. As the implementation evolves, the examples diverge from the actual API behavior. By the time the migration guide is published, the examples are stale.

### Warning Signs
- Code examples in the migration guide are not part of the test suite
- No CI step validates example code against the API
- Consumers report that migration guide examples don't work
- Examples reference endpoints or fields that have changed since the guide was written
- Developers rewrite examples without testing them
- Support tickets reference "the example in the migration guide returns an error"

### Why It Is Harmful
Consumers' first interaction with the new API is through the migration guide's examples. If the examples are broken, the consumer's migration attempt fails immediately. They cannot determine whether the issue is their code or the example. Trust in the entire migration process erodes. The team's support burden increases as each consumer encounters the same broken examples.

### Real-World Consequences
A consumer follows the migration guide's example for the new `POST /v2/orders` endpoint. The example uses `customer_id` but the actual API expects `customerId`. The consumer's first request returns a 422 error. They spend 2 hours debugging their code before realizing the example has the wrong field name. They file a support ticket. Five other consumers hit the same bug that week.

### Preferred Alternative
Write and test every code example in the migration guide against the actual API before publication. Include examples in the test suite.

### Refactoring Strategy
1. Extract code examples from the migration guide into automated tests
2. Run the tests against a deployed instance of the new API
3. Fix any examples that fail
4. Add a CI step that validates migration guide examples against the API
5. When the API changes, update the examples and re-run validation

### Detection Checklist
- [ ] Check if migration guide examples are covered by tests
- [ ] Run migration guide examples against the actual API
- [ ] Verify examples match current API field names and formats
- [ ] Test that a new developer can follow examples without errors
- [ ] Add CI validation for migration guide examples

### Related Rules
- Create Tested Migration Guide Before Rollout (05-rules.md)

### Related Skills
- Manage Breaking Changes (06-skills.md)

### Related Decision Trees
- RFC Approval Process — CAB Review vs Lightweight Team Review (07-decision-trees.md)

---

## Anti-Pattern 5: Emergency Exception Abuse

### Category
Governance

### Description
Using the emergency exception path (designed for security/regulatory urgent changes) to bypass the standard breaking change process for non-emergency changes because it is faster and requires less documentation.

### Why It Happens
The standard breaking change process requires RFC writing, impact analysis, CAB review, and migration planning — all of which takes time. The emergency exception requires only VP sign-off. Teams under pressure to "ship fast" abuse the emergency path. The justification is stretched: "if we don't do this now, we'll lose customers" (always true).

### Warning Signs
- Emergency exceptions are granted for non-security, non-regulatory changes
- VP sign-off is obtained via Slack with minimal context
- No post-incident review is conducted for emergency changes
- Emergency exception rate exceeds 20% of all breaking changes
- The short path becomes the default path
- Standard CAB process is viewed as "too slow" and actively avoided

### Why It Is Harmful
Emergency exception abuse undermines the entire breaking change governance process. The CAB becomes irrelevant if most changes bypass it. Impact analysis is skipped. Migration guides are not written. Consumers are not notified. The "emergency" that justified bypassing the process was rarely an actual emergency — just an internal deadline. Consumer trust is damaged by changes that were never properly planned.

### Real-World Consequences
A team uses the emergency exception to rename a response field, citing "urgent product requirement." No impact analysis, no migration guide, no consumer notification. The change deploys. 30 consumer integrations break. The "urgent product requirement" turns out to be a non-essential branding preference. The team spends 3 weeks in damage control. The VP who approved the exception is mortified.

### Preferred Alternative
Reserve the emergency exception for genuine security vulnerabilities and regulatory compliance deadlines. Conduct a post-incident review for every emergency exception to prevent abuse.

### Refactoring Strategy
1. Define emergency criteria explicitly: security vulnerability with active exploitation or regulatory deadline with legal consequence
2. Require VP sign-off with written justification citing specific criteria
3. Require post-incident CAB review within 7 days of any emergency change
4. Track emergency exception metrics: rate, justification, post-review findings
5. If emergency exception rate exceeds 10%, investigate systemic process issues

### Detection Checklist
- [ ] Track emergency exception rate as percentage of all breaking changes
- [ ] Review emergency justifications — are they genuine emergencies?
- [ ] Verify post-incident reviews are conducted for emergency changes
- [ ] Check if standard process is viewed as "too slow" by the team
- [ ] Survey CAB members — do they feel bypassed by emergency exceptions?

### Related Rules
- Obtain CAB Approval Before Implementation (05-rules.md)

### Related Skills
- Manage Breaking Changes (06-skills.md)

### Related Decision Trees
- RFC Approval Process — CAB Review vs Lightweight Team Review (07-decision-trees.md)

---

