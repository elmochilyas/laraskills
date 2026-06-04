# REST Purity vs Pragmatic: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | rest-purity-vs-pragmatic |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Dogmatic Purity at All Costs** — Rejecting all pragmatic deviations, creating complex workarounds for simple operations
2. **Unprincipled Pragmatism** — Ad-hoc decisions with no pattern or consistency
3. **False Dichotomy Debates** — Spending time on "is this REST?" instead of "is this a good API for consumers?"
4. **Rigid Style Guide** — Attempting to codify every possible decision, eliminating all team judgment
5. **Security Through Purity** — Assuming pure REST is inherently more secure than pragmatic design

## Repository-Wide Anti-Patterns

- Calling a pragmatic Level 2 API "REST" when clients expect Level 3 hypermedia
- Allowing every deviation without requiring documented justification
- Creeping pragmatism — each deviation justified, accumulated destruction of RESTful contract
- Different purity standards for internal vs external APIs not being explicitly defined

---

## 1. Dogmatic Purity at All Costs

### Category
Over-Engineering

### Description
Rejecting all pragmatic deviations from REST principles, even when the pure approach creates significant complexity, performance issues, or poor developer experience. Force-fitting every operation into CRUD.

### Why It Happens
Architectural enthusiasm — the belief that REST is objectively correct and any deviation is a flaw. Developers treat REST as a moral framework rather than an engineering trade-off.

### Warning Signs
- Complex multi-step workarounds for simple business operations
- Rejected PRs because endpoints aren't "pure REST"
- PATCH endpoints with hidden side effects to avoid action endpoints
- Client teams complain the API is hard to use
- Time spent debating REST purity exceeds time implementing features

### Why Harmful
Development velocity slows dramatically. The API becomes harder to use because it prioritizes REST purity over practical usability. Client teams create workarounds or abandon the API.

### Real-World Consequences
An API team insists all operations must be resource-oriented. The "send invoice" operation requires five CRUD calls: create invoice, create recipient list, create email record, update invoice status, and send via PATCH. A pragmatic `POST /invoices/{id}/send` would be a single call with clear intent.

### Preferred Alternative
Default to REST conventions. Accept documented, justified deviations when the pure approach causes disproportionate complexity. Focus on client outcomes.

### Refactoring Strategy
1. Audit endpoints that required complex workarounds for purity
2. Identify operations that are naturally actions, not resource CRUD
3. Create action endpoints with clear naming and documentation
4. Add justification comments documenting why the pure approach was insufficient
5. Measure developer productivity before and after pragmatism

### Detection Checklist
- [ ] Complex CRUD workarounds for simple operations
- [ ] Code reviews blocked by purity arguments
- [ ] Client teams frustrated with API complexity
- [ ] Hidden side effects in "pure" endpoints
- [ ] Feature velocity noticeably slow

### Related Rules/Skills/Trees
- Rule: API-DESIGN-001 (Pragmatic REST)
- Skill: rest-purity-vs-pragmatic
- Tree: pragmatic-design

---

## 2. Unprincipled Pragmatism

### Category
Inconsistency

### Description
Making ad-hoc pragmatic decisions without any guiding principles or patterns. Each developer chooses REST vs RPC based on personal preference, leading to an inconsistent, unpredictable API.

### Why It Happens
No API style guide exists. No team consensus on when to be pure vs pragmatic. Everyone does "what feels right."

### Warning Signs
- Some endpoints pure REST, others RPC with no pattern
- Similar operations handled differently across resources
- New team members can't predict which pattern to follow
- Code review comments say "be consistent" frequently
- API style guide doesn't exist or doesn't address pragmatism

### Why Harmful
Clients cannot predict API behavior. Every endpoint is a unique case requiring individual learning. The API appears unprofessional and poorly designed.

### Real-World Consequences
A developer needs to activate a user. Looking at the codebase, they find: `PATCH /users/{id} {status: "active"}` for users, `POST /products/activate` for products, and `PUT /subscriptions/{id}/resume` for subscriptions. There's no consistent pattern, so they create `POST /api/activateUser`.

### Preferred Alternative
Establish a style guide that specifies when to use REST conventions and when to deviate. Codify common deviation patterns (search, batch, actions) so they're applied consistently.

### Refactoring Strategy
1. Create or update the API style guide
2. Document common deviation patterns with consistent conventions
3. Audit existing endpoints for consistency against the guide
4. Refactor outliers to match established patterns
5. Add architecture tests that enforce consistency rules

### Detection Checklist
- [ ] No API style guide exists
- [ ] Inconsistent REST-pragmatic choices across endpoints
- [ ] Similar operations handled differently
- [ ] New team members confused by patterns
- [ ] Code reviews regularly cite consistency issues

### Related Rules/Skills/Trees
- Rule: API-CONSISTENCY-004 (Guided Pragmatism)
- Skill: api-style-guide-documentation
- Tree: api-consistency

---

## 3. False Dichotomy Debates

### Category
Process Waste

### Description
Spending excessive time debating whether something "is REST" or "is pure enough" instead of evaluating whether it provides value to API consumers.

### Why It Happens
REST debates are philosophical and open-ended. They feel like productive architecture discussions but rarely lead to actionable decisions.

### Warning Signs
- Design meetings devolve into REST definition debates
- Pull request comments debate REST purity instead of functionality
- "This isn't REST" used as primary rejection reason
- No consumer value discussed in API design reviews
- Team can't describe the API's design principles but debates REST definition

### Why Harmful
Time wasted on philosophical debates directly reduces feature delivery velocity. Client needs are not discussed. The team develops a reputation for being difficult to work with.

### Real-World Consequences
A 30-minute design review for a simple endpoint becomes a 2-hour debate about whether `POST /search` violates REST principles. The endpoint is delayed by a week while the team discusses. The client wanted the endpoint yesterday.

### Preferred Alternative
Frame all API design discussions around consumer value: "Is this easy for clients to use?" "Does this follow our established patterns?" "What's the cost of this approach vs alternatives?"

### Refactoring Strategy
1. Set a timebox for REST purity discussions
2. Require all design discussions to start with consumer value
3. Document decision criteria that don't include "is it pure REST?"
4. Create a decision framework focused on trade-offs, not dogma
5. Measure time spent on REST debates vs feature delivery

### Detection Checklist
- [ ] Design meetings dominated by REST debates
- [ ] PR comments focus on purity, not functionality
- [ ] "Is this REST?" is a common question
- [ ] Client value not discussed in design reviews
- [ ] Feature velocity correlates inversely with debate time

### Related Rules/Skills/Trees
- Rule: API-PROCESS-001 (Value-Oriented Design)
- Skill: rest-purity-vs-pragmatic
- Tree: team-process

---

## 4. Rigid Style Guide

### Category
Over-Standardization

### Description
Creating an API style guide that attempts to codify every possible scenario, eliminating all need for human judgment. The guide becomes so long and prescriptive that no one reads or follows it.

### Why It Happens
The desire to prevent all inconsistency by having a rule for everything. Each exception discovered adds another rule.

### Warning Signs
- Style guide is 50+ pages
- Every design decision requires consulting the style guide
- Style guide has contradictory rules (added by different authors over time)
- New team members can't remember all the rules
- Developers stop reading the guide and make their own decisions
- Style guide updates take weeks to approve

### Why Harmful
A bloated style guide becomes unreadable and ignored. Real consistency is achieved through shared principles, not exhaustive rules. The rigid guide creates friction without improving quality.

### Real-World Consequences
A 200-page API style guide covers naming, error formats, pagination, versioning, headers, and status codes — all prescribed in detail. No one has read the entire guide. Developers follow their own instincts. The API is just as inconsistent as before the guide existed.

### Preferred Alternative
Cover 80% of common scenarios in a concise guide. Leave 20% for team judgment. Focus on principles and patterns, not exhaustive rules.

### Refactoring Strategy
1. Trim the style guide to the most impactful 20% of rules
2. Replace detailed rules with principles and examples
3. Create a lightweight decision framework for edge cases
4. Remove contradictory or outdated rules
5. Establish a regular review cadence for the guide

### Detection Checklist
- [ ] Style guide exceeds 20 pages
- [ ] Every decision requires rule lookup
- [ ] Contradictory or outdated rules exist
- [ ] Developers don't read the guide
- [ ] Style guide updates are bureaucratic

### Related Rules/Skills/Trees
- Rule: API-PROCESS-002 (Concise Style Guide)
- Skill: api-style-guide-documentation
- Tree: team-process

---

## 5. Security Through Purity

### Category
Security Misconception

### Description
Assuming that strict REST compliance inherently provides better security than pragmatic design. Believing that action endpoints are less secure than resource-oriented alternatives.

### Why It Happens
Pure REST advocates argue that the uniform interface constraint provides security benefits. This is extended to the unfounded conclusion that non-RESTful designs are insecure.

### Warning Signs
- Security justifications used in REST purity debates
- Action endpoints rejected for "security reasons" without specific threats
- Resource-oriented workarounds add complexity without security benefit
- Security review accepts pure REST endpoints without scrutiny
- Belief that "REST is secure by default"

### Why Harmful
Security theater — the team believes they're more secure because they follow REST principles. Meanwhile, actual security vulnerabilities (authentication, authorization, input validation) may exist in any endpoint regardless of its REST compliance.

### Real-World Consequences
A team rejects `POST /users/{id}/reset-password` as "not RESTful" and instead implements password reset as `PATCH /users/{id} {password: "new"}`. The PATCH endpoint is accepted without security scrutiny because it's "proper REST." The endpoint lacks rate limiting, allowing unlimited password reset attempts.

### Preferred Alternative
Apply the same security review process to all endpoints regardless of REST compliance. Security depends on authentication, authorization, input validation, and rate limiting — not REST purity.

### Refactoring Strategy
1. Standardize security review across all endpoint types
2. Remove "REST compliance" from security checklist
3. Add specific security controls (rate limiting, auth, validation) to each endpoint
4. Document that security is orthogonal to REST compliance
5. Conduct security review without considering REST purity

### Detection Checklist
- [ ] REST purity used as security argument
- [ ] Action endpoints rejected for "security" without specifics
- [ ] Pure endpoints with actual security vulnerabilities
- [ ] No standardized security review process
- [ ] Security checklist includes REST compliance

### Related Rules/Skills/Trees
- Rule: API-SEC-009 (Security Orthogonal to REST)
- Skill: api-security-headers
- Tree: security-basics
