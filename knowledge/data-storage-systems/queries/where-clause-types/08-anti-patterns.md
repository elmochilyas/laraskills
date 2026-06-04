# ECC Anti-Patterns â€” Where Clause Types
---
## Metadata
| Field | Value |
|-------|-------|
| **Domain** | Data & Storage Systems |
| **Subdomain** | Queries |
| **Knowledge Unit** | 2-11-where-clause-types |
| **Generated** | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Ignoring: Always Eager-Load Relationships In Loops
2. Unvalidated Assumptions About Behavior
3. ### whereDate on indexed columns
4. Wrong Decision Without Context Evaluation
5. Production Blindness
---
## Repository-Wide Anti-Patterns
The following cross-cutting anti-patterns are relevant to this KU:
- **Fat Controllers**: Database connection logic should not reside in controllers; delegate to services or repositories.
- **God Services**: Centralizing all database access in a single service creates coupling and testing difficulty.
- **N+1 Query Problem**: Occurs when relationship lazy-loading creates excessive queries.
- **Premature Caching**: Caching without profiling leads to stale data and invalidation complexity.
- **Premature Optimization**: Micro-optimizations before identifying actual bottlenecks waste effort.
- **Hidden Database Queries**: Implicit queries triggered by property access or blade rendering increase latency unexpectedly.
- **Business Logic in Models**: Violates Single Responsibility by mixing persistence and domain logic.

---
## Anti-Pattern 1: Ignoring: Always Eager-Load Relationships In Loops
### Category
Architecture | Performance | Maintainability
### Description
Developers implement functionality without understanding or applying the core concepts defined in the standardized knowledge. This anti-pattern manifests when implementation decisions contradict the documented principles, leading to fragile systems that fail under edge cases not covered by surface-level understanding.
### Why It Happens
Time pressure, assumption that "it's simple enough to skip the docs," overconfidence in prior experience with similar but distinct technologies, lack of code review rigor.
### Warning Signs
- Implementation choices contradict documented best practices
- Pull requests with no reference to knowledge unit guidelines
- Repeated bugs in the same conceptual area
- Developer unable to explain why an approach was chosen
### Why It Is Harmful
Without grounding in core concepts, systems develop latent defects that surface during scale events, security audits, or team transitions. The knowledge gap compounds as the original author moves on.
### Real-World Consequences
Production incidents during traffic spikes, security breaches from misconfigured components, costly rewrites when foundational assumptions prove wrong.
### Preferred Alternative
Read and discuss the knowledge unit's standardized knowledge before implementation. Reference the rules, skills, and decision trees during design review.
### Refactoring Strategy
1. Audit current implementation against core concepts
2. Identify gaps where foundational principles were violated
3. Refactor incrementally, prioritizing the most impactful violations
4. Add automated checks to prevent regression
5. Document deviations with explicit rationale
### Detection Checklist
- [ ] Is the implementation consistent with the "Core Concepts" section?
- [ ] Are there comments or docs explaining deviations from standard practice?
### Related Rules
1. Always Eager-Load Relationships In Loops
2. Use chunkById Over chunk For Production
3. Disable Lazy Loading In Non-Production
4. Review And Apply Core Concepts
5. Consider Architecture Guidelines
### Related Skills
Use Laravel's where method family correctly â€” plain equality, whereIn, whereBetween, whereNull, whereDate, whereColumn, whereExists â€” selecting the appropriate type based on sargability, index usage, and query requirements.
### Related Decision Trees
## Decision Context
## Decision Criteria
## Decision Tree
---## Anti-Pattern 2: Unvalidated Assumptions About Behavior
### Category
Design | Reliability | Maintainability
### Description
Teams assume default configurations, behaviors, or edge cases match their expectations without verification. This anti-pattern ignores the documented "Common Mistakes" and "Anti-Patterns" sections, resulting in systems that fail silently under conditions the developers didn't anticipate.
### Why It Happens
Copy-paste configuration from tutorials, trust in defaults without reading documentation, lack of staging environment that mirrors production, inadequate testing of failure modes.
### Warning Signs
- whereDate on indexed column**: Creates a full table scan on a large table. Use range query instead.
- orWhere without grouping**: `where('a', 1)->orWhere('b', 2)` — the OR may not use the composite index on (a, b). Group with a closure.
- ---
### Why It Is Harmful
Unvalidated assumptions create a gap between expected and actual behavior. This gap widens as the system evolves, making debugging increasingly difficult.
### Real-World Consequences
Data corruption from wrong isolation level, connection leaks from misconfigured pool, silent data loss from wrong replication configuration.
### Preferred Alternative
Create explicit validation tests that verify critical behaviors match expectations. Document assumptions in architecture decision records.
### Refactoring Strategy
1. Document all implicit assumptions about system behavior
2. Create integration tests that validate each assumption
3. Review each "Common Mistake" entry and verify the system handles it correctly
4. Add monitoring to detect when assumptions are violated
5. Share findings in team knowledge-sharing sessions
### Detection Checklist
- [ ] Are all configuration values explicitly set with rationale?
- [ ] Are failure modes tested, not just happy paths?
### Related Rules
Review the rule violations documented in 05-rules.md
### Related Skills
Review the "Common Failures" section in 06-skills.md
### Related Decision Trees
Review decision criteria in 07-decision-trees.md to validate choices
---## Anti-Pattern 3: ### whereDate on indexed columns
### Category
Testing | Maintainability | Code Organization
### Description
Developers skip validation steps after implementing a pattern or configuration. The skills document outlines specific validation checklists, but these are ignored in the rush to ship. This leads to undetected misconfigurations that surface as production incidents.
### Why It Happens
Validation checklists are perceived as "optional extras," time constraints prioritize feature delivery over verification, lack of automated enforcement of validation steps.
### Warning Signs
- No evidence of validation checklist use in pull requests
- Skills document's "Validation Checklist" items not addressed
- Production issues traceable to items on the checklist
- Team unaware of the skills document's validation requirements
### Why It Is Harmful
Validation is the safety net that catches edge cases and misconfigurations. Skipping it removes the last line of defense before production.
### Real-World Consequences
Deploying misconfigured connection pooling that exhausts database connections, using wrong replication mode causing data inconsistency, incorrect transaction isolation leading to race conditions.
### Preferred Alternative
Treat validation checklists as mandatory acceptance criteria. Automate checklist items where possible with CI checks. Include validation steps in definition of done.
### Refactoring Strategy
1. Map each validation checklist item to an automated test or manual check
2. Create a pre-deployment validation script
3. Integrate validation into CI/CD pipeline
4. Track validation coverage as a quality metric
5. Retrofit validation for existing implementations
### Detection Checklist
- [ ] Are all validation checklist items addressed?
- [ ] Is there automated verification of critical configuration?
### Related Rules
Refer to behavioral constraints in 05-rules.md
### Related Skills
Review the complete workflow in 06-skills.md
### Related Decision Trees
Use decision trees from 07-decision-trees.md to validate choices
---## Anti-Pattern 4: Wrong Decision Without Context Evaluation
### Category
Architecture | Design | Scalability
### Description
Engineers make architectural decisions without evaluating the decision context, criteria, and tradeoffs documented in the decision trees. This anti-pattern results in choosing approaches based on familiarity rather than fitness, leading to suboptimal architectures.
### Why It Happens
Developers default to what they know, time pressure favors quick decisions over thorough evaluation, decision trees are not consulted during design reviews, lack of structured decision-making process.
### Warning Signs
- Decision tree ## Decision Context was available but not consulted - Decision tree ## Decision Criteria was available but not consulted - Decision tree ## Decision Tree was available but not consulted
### Why It Is Harmful
Poor architectural decisions are the most expensive to fix. Choosing the wrong pattern early can constrain the system for years, requiring costly migrations.
### Real-World Consequences
Choosing the wrong sharding strategy requiring a multi-month re-architecture, selecting an isolation level that prevents needed concurrent operations, deploying a pooler mode incompatible with the application's query patterns.
### Preferred Alternative
Use the decision trees as mandatory input to architectural decisions. Document decisions with rationale, alternatives considered, and tradeoffs accepted. Review decisions against trees during architecture reviews.
### Refactoring Strategy
1. Identify architectural decisions made without consulting decision trees
2. Evaluate current choices against tree criteria
3. Document any gaps or misalignments
4. Plan remediation for high-impact misalignments
5. Establish decision tree consultation as a gate in the design process
### Detection Checklist
- [ ] Were decision trees consulted for each architectural choice?
- [ ] Is there a written decision record for each major choice?
### Related Rules
Review architecture rules in 05-rules.md
### Related Skills
Apply the skills workflow from 06-skills.md
### Related Decision Trees
2-11-where-clause-types decision trees in 07-decision-trees.md
---## Anti-Pattern 5: Production Blindness
### Category
Operations | Reliability | Performance
### Description
Production readiness concerns are deferred or ignored during development. Teams focus on functional correctness while neglecting the operational aspects that determine real-world reliability and performance. This anti-pattern leads to systems that work in development but fail in production.
### Why It Happens
Development environments lack production scale data, monitoring is set up post-launch, performance testing is deferred, operations teams are not involved early enough.
### Warning Signs
- No monitoring or alerting for database health metrics
- Performance not tested at production scale
- Connection pooling not validated under load
- Backup and recovery not tested before go-live
### Why It Is Harmful
Production is the only environment that reveals the true behavior of data storage systems. Without operational readiness, every deployment carries risk of undetected failure.
### Real-World Consequences
Database crashes under load due to connection exhaustion, undetected replication lag causing stale data serving, backup failures discovered during actual recovery need.
### Preferred Alternative
Build production readiness into the development process. Include operations in design reviews. Test at production scale in staging. Implement monitoring from day one.
### Refactoring Strategy
1. Deploy monitoring for key health metrics
2. Perform load testing at or above expected production traffic
3. Test backup and recovery procedures
4. Document runbooks for common failure scenarios
5. Implement gradual rollouts with automatic rollback
### Detection Checklist
- [ ] Is monitoring in place for all critical metrics?
- [ ] Have backup and recovery procedures been tested?
- [ ] Has the system been load tested at production scale?
### Related Rules
Review operational rules in 05-rules.md
### Related Skills
Review performance and security considerations in 06-skills.md
### Related Decision Trees
Use decision trees from 07-decision-trees.md for operational decisions
---