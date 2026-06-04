# Versioning Strategy Selection: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Versioning Strategy Selection |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Strategy Mismatch** — URL versioning chosen for a CDN-heavy API, causing cache purge complexity
2. **No ADR** — Team mixes URL and header versioning across endpoints with no standard
3. **Analysis Paralysis** — Spending months debating the "perfect" strategy instead of shipping
4. **Consumer Ignorance** — Choosing a strategy without considering consumer capabilities
5. **Mid-Lifecycle Strategy Switch** — Switching versioning strategies without a migration plan

## Repository-Wide Anti-Patterns

- Choosing header versioning because it's "cleaner" without considering mobile app header limitations
- Over-engineering with media-type versioning for a 3-endpoint internal service
- Not documenting the strategy decision
- Not training the team on the chosen approach

---

## 1. Strategy Mismatch

### Category
Wrong Tool

### Description
Choosing a versioning strategy that conflicts with the API's operational requirements (caching, CDN, debugging).

### Why It Happens
The strategy is chosen based on what "feels right" or what a blog post recommended, without considering the API's deployment infrastructure.

### Warning Signs
- Header versioning causes CDN cache issues
- URL versioning makes API gateway routing complex
- Media-type versioning creates debugging difficulties
- Operational teams complain about the versioning approach
- Cloud infrastructure doesn't support the chosen strategy

### Why Harmful
Ongoing operational friction. Each deployment requires workarounds. The versioning strategy adds cost instead of value.

### Real-World Consequences
A team chooses media-type versioning for a CDN-heavy API. Each unique Accept header creates a separate cache partition. Cache hit rate drops to 20% because the CDN can't aggregate traffic across versions. Operational costs increase.

### Preferred Alternative
Evaluate versioning strategies against operational requirements (caching, CDN, monitoring, debugging) before choosing.

### Refactoring Strategy
1. Document operational requirements (caching, CDN, logging, debugging)
2. Evaluate each strategy against requirements
3. Choose the strategy that best fits the infrastructure
4. Implement, test with real traffic patterns
5. Monitor operational metrics after implementation

### Detection Checklist
- [ ] Strategy conflicts with CDN/caching approach
- [ ] Operational teams report issues
- [ ] Infrastructure doesn't support strategy well
- [ ] Strategy chosen without operational evaluation

### Related Rules/Skills/Trees
- Rule: API-VERSION-013 (Strategy-Infrastructure Fit)
- Skill: versioning-strategy-selection
- Tree: api-architecture

---

## 2. No ADR

### Category
Decision Drift

### Description
The versioning strategy is not documented in an Architecture Decision Record. Team members make inconsistent decisions, and new members don't know why the strategy was chosen.

### Why It Happens
The initial decision was made informally. No one writes it down.

### Warning Signs
- Team members disagree on the versioning approach
- Some endpoints use URL versioning, others use headers
- New team members ask "why do we do it this way?"
- No documentation of versioning strategy exists
- Code reviews discuss "which strategy should we use here?"

### Why Harmful
Inconsistent application. Without a documented decision, developers may deviate from the strategy. Future changes have no reference point.

### Real-World Consequences
V1 endpoints use URL path versioning. V2 endpoints use Accept header versioning because a new developer assumed "that's the new way." Clients must use different versioning mechanisms for different versions.

### Preferred Alternative
Document the versioning strategy decision as an ADR with rationale, examples, and migration path.

### Refactoring Strategy
1. Write an ADR documenting the chosen strategy
2. Include rationale, alternatives considered, and trade-offs
3. Share with the team and get alignment
4. Add architecture tests enforcing the strategy
5. Review the ADR annually

### Detection Checklist
- [ ] No ADR exists
- [ ] Team disagrees on strategy
- [ ] Inconsistent application
- [ ] New members ask "why?"
- [ ] Code reviews revisit strategy decisions

### Related Rules/Skills/Trees
- Rule: API-ADR-001 (Versioning Strategy ADR)
- Skill: adr-process-for-apis
- Tree: architecture-decisions

---

## 3. Analysis Paralysis

### Category
Process Waste

### Description
Spending excessive time evaluating versioning strategies instead of shipping. The team debates endlessly without reaching a decision.

### Why It Happens
The versioning decision is perceived as irreversible and critical. Fear of choosing wrong prevents choosing at all.

### Warning Signs
- Versioning strategy discussions going on for weeks
- Multiple meetings without resolution
- "Let's research more" is the recurring conclusion
- No API endpoints built because "we don't know the versioning yet"
- Decision matrix being refined continuously without action

### Why Harmful
The API is delayed. The team could have chosen any reasonable strategy, implemented it, and had the API running in the time spent debating.

### Real-World Consequences
A team spends 3 months evaluating versioning strategies. They create detailed decision matrices, prototype all three approaches, and run comparison tests. The chosen strategy (URL path versioning) was the obvious choice from day one.

### Preferred Alternative
Set a decision deadline. Choose the simplest reasonable strategy (URL path versioning for most cases). Ship the API. The cost of choosing wrong is lower than the cost of not choosing.

### Refactoring Strategy
1. Set a 1-week maximum for strategy evaluation
2. Use a simple decision matrix with 3-4 criteria
3. Default to URL path versioning (it works for most cases)
4. Prototype one approach, don't build all three
5. Document the decision and move to implementation

### Detection Checklist
- [ ] Strategy discussion > 1 week
- [ ] Multiple meetings without resolution
- [ ] Prototypes for all strategies built
- [ ] Decision matrix constantly refined
- [ ] No endpoints built yet

### Related Rules/Skills/Trees
- Rule: API-PROCESS-003 (Decision Deadlines)
- Skill: versioning-strategy-selection
- Tree: team-process

---

## 4. Consumer Ignorance

### Category
User Hostility

### Description
Choosing a versioning strategy without considering the capabilities and constraints of the API's consumers (mobile apps, browser-based clients, corporate proxies).

### Why It Happens
The strategy is chosen based on server-side convenience or architectural purity. Consumer capabilities are not evaluated.

### Warning Signs
- Mobile app developers complain about header-based versioning difficulty
- Corporate clients report that proxies strip custom headers
- Browser-based clients struggle with media-type negotiation
- Consumer feedback says "your versioning is hard to use"
- Client libraries require complex configuration for versioning

### Why Harmful
Consumers struggle to use the API. Adoption suffers. The "clean" server-side strategy creates real client-side pain.

### Real-World Consequences
A team chooses header-based versioning for "REST purity." Mobile apps have difficulty setting custom headers in some HTTP clients. Corporate proxies strip the `X-API-Version` header. A significant portion of consumers cannot properly version their requests.

### Preferred Alternative
Evaluate consumer capabilities before choosing a strategy. Survey potential consumers. Choose the simplest strategy that works for your target consumers.

### Refactoring Strategy
1. Identify target consumer types (mobile, web, enterprise, server)
2. Evaluate versioning strategies against their capabilities
3. Choose the strategy with lowest consumer friction
4. Prototype with actual consumer clients
5. Document consumer guidance for the chosen strategy

### Detection Checklist
- [ ] Consumer capabilities not evaluated
- [ ] Mobile developers report issues
- [ ] Corporate proxies strip headers
- [ ] Consumer feedback negative
- [ ] Strategy chosen for server convenience only

### Related Rules/Skills/Trees
- Rule: API-DESIGN-002 (Consumer-Centric Versioning)
- Skill: versioning-strategy-selection
- Tree: developer-experience

---

## 5. Mid-Lifecycle Strategy Switch

### Category
Migration Chaos

### Description
Changing versioning strategies mid-lifecycle (e.g., from URL to header-based versioning) without a clear migration plan. Some endpoints use the old strategy, others use the new.

### Why It Happens
A new team member or architect decides the current strategy is wrong and implements a new one without coordinating the transition.

### Warning Signs
- Both URL and header versioning work simultaneously
- Some endpoints require header, others require URL version
- Documentation describes two different versioning approaches
- Consumer confusion about which mechanism to use
- No migration timeline for the old strategy

### Why Harmful
Maximum consumer confusion. Every endpoint requires checking which versioning mechanism it uses. Client code is complex and brittle.

### Real-World Consequences
V1 and V2 use URL path versioning. A new architect decides V3 should use header-based versioning. Consumers must now use URL for V1/V2 and headers for V3. Client code has conditional versioning logic for every request.

### Preferred Alternative
Either maintain the existing strategy for the API's lifetime, or create a clean break with a migration window where both strategies work.

### Refactoring Strategy
1. Revert to the original strategy for new versions
2. If switching is necessary, plan a migration period
3. During migration, support both strategies
4. Deprecate and remove the old strategy
5. Document the transition timeline

### Detection Checklist
- [ ] Both URL and header versioning active simultaneously
- [ ] Different versions use different strategies
- [ ] Consumer confusion about versioning mechanism
- [ ] No migration plan for the switch
- [ ] Client code handles multiple strategies

### Related Rules/Skills/Trees
- Rule: API-VERSION-014 (Strategy Consistency)
- Skill: versioning-strategy-selection
- Tree: api-architecture
