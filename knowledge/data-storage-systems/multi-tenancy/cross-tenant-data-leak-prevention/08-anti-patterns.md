# ECC Anti-Patterns â€” Cross Tenant Data Leak Prevention
---
## Metadata
| Field | Value |
|-------|-------|
| **Domain** | Data & Storage Systems |
| **Subdomain** | Multi tenancy |
| **Knowledge Unit** | 5-11-cross-tenant-data-leak-prevention |
| **Generated** | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Ignoring: Never Trust Tenant ID From Request
2. Unvalidated Assumptions About Behavior
3. New endpoint added without isolation test
4. Wrong Decision Without Context Evaluation
5. Production Blindness
6. Policy-only tenant isolation without query-level scoping
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
## Anti-Pattern 1: Ignoring: Never Trust Tenant ID From Request
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
1. Never Trust Tenant ID From Request
2. Always Index Tenant ID As Leading Column
3. Review And Apply Core Concepts
4. Consider Architecture Guidelines
### Related Skills
Establish multiple defense layers against cross-tenant data leaks through automated testing, code review checklists, and access control gating for isolation bypasses.
### Related Decision Trees
## Decision Context
## Decision Criteria
## Decision Tree
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
- Assuming global scope covers all queries**: Raw queries, query builder without model, and relationship queries may bypass scopes. Test every data access path.
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
---## Anti-Pattern 3: New endpoint added without isolation test
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
- Decision tree ## Decision Context was available but not consulted - Decision tree ## Decision Criteria was available but not consulted - Decision tree ## Decision Tree was available but not consulted - Decision tree ## Decision Context was available but not consulted - Decision tree ## Decision Criteria was available but not consulted - Decision tree ## Decision Tree was available but not consulted
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
5-11-cross-tenant-data-leak-prevention decision trees in 07-decision-trees.md
---## Anti-Pattern 6: Policy-only tenant isolation without query-level scoping
### Category
Architecture | Security | Testing
### Description
Teams rely exclusively on Laravel Policies to enforce tenant isolation, assuming that if a Policy denies access, data is safe. This approach omits query-level scoping (global scopes, `where tenant_id = ?` in query builder). A Policy prevents an endpoint from returning forbidden data, but without query-level scoping, a buggy or missing Policy check can leak cross-tenant data before it is ever evaluated.
### Why It Happens
Policies are the idiomatic Laravel authorization layer and feel like "enough." Developers assume that if the Policy is correct, no further protection is needed. Query-level scoping is seen as duplication rather than defense in depth.
### Warning Signs
- No global `TenantScope` applied to tenant-scoped models
- Queries use `Model::all()` or `Model::find()` without tenant filtering
- Authorization relies solely on `$this->authorize()` in controllers
- No `withoutGlobalScope()` calls to document intended bypasses
- Policies contain `whereHas` or filtering logic that should be in the query
- Raw SQL queries or query builder calls lack explicit `tenant_id` conditions
### Why It Is Harmful
Policies only gate access at the controller layer. They do not protect against:
- **Direct query bypass**: PhpMyAdmin, raw SQL, another service with DB access
- **Relationship lazy loading**: `$user->posts` loads all posts regardless of tenant
- **Queued jobs**: A job that queries the model without going through the controller
- **Batch operations**: Artisan commands, scheduled tasks, imports without Policy checks
- **API Resource serialization**: Loading relationships may trigger cross-tenant reads
### Real-World Consequences
A controller with a missing `authorize()` call returns all tenants' data. A queued job processing millions of records leaks data silently for months before detection. A developer adds a new relationship and lazy-loads it in a resource, bypassing the Policy layer entirely.
### Preferred Alternative
Use defense-in-depth: query-level scoping as the primary isolation mechanism (global `TenantScope` or explicit `where tenant_id = ?`), with Policies as the secondary authorization layer. Every query must be scoped at the database level, not just at the controller level.
### Refactoring Strategy
1. Add `TenantScope` global scope to all tenant-scoped models
2. Audit all existing queries for tenant filtering (use query log)
3. Remove tenant-filtering logic from Policies — Policies should only check business rules, not enforce isolation
4. Add `withoutGlobalScope()` as an explicit, audited escape hatch
5. Write isolation tests that bypass the controller (direct model queries, queued jobs) to verify query-level scoping
6. Add a CI check that verifies every tenant-scoped table query includes a tenant filter
### Detection Checklist
- [ ] Every tenant-scoped model has a global TenantScope or explicit tenant filter in every query path
- [ ] Policies do not duplicate tenant filtering — they only enforce business-level authorization
- [ ] Direct model queries (tinker, jobs, commands) also respect tenant isolation
- [ ] Relationship lazy loading cannot bypass tenant isolation
- [ ] All legitimate bypasses (`withoutGlobalScope`) are documented, limited, and audited
### Related Rules
1. Never Trust Tenant ID From Request
2. Always Index Tenant ID As Leading Column
3. Apply Global Scopes for Tenant Isolation
4. Defense in Depth: Query Layer + Policy Layer
### Related Skills
Establish multi-layer tenant isolation: global scopes at the query layer, Policies at the authorization layer, and integration tests that verify both layers independently.
### Related Decision Trees
## Decision Context
## Decision Criteria
## Decision Tree
## Decision Context
## Decision Criteria
## Decision Tree

---## Anti-Pattern 7: Missing scoped route-model binding for tenant isolation
### Category
Architecture | Security
### Description
Applications use route-model binding to fetch resources by ID without verifying that the resource belongs to the current tenant. `Route::get('/organizations/{organization}/users/{user}', ...)` binds the `User` model by primary key alone, ignoring the parent `Organization` tenant context. An attacker can manipulate the `user` ID to access another tenant's user record.
### Why It Happens
Route-model binding is convenient and developers trust it implicitly. The `scopeBindings()` modifier is not well known. Without explicit scoping, Laravel binds the child model by its own primary key without checking the parent relationship.
### Warning Signs
- Nested route parameters (`{organization}/{user}`) without `->scopeBindings()`
- Controller manually verifies parent-child relationship after binding
- No integration test that swaps the child ID to a different tenant's record
### Why It Is Harmful
Without scoped bindings, a request to `/organizations/1/users/999` will resolve `User` 999 even if it belongs to organization 2, bypassing tenant isolation at the routing layer. The leak happens before any Policy can check it.
### Real-World Consequences
A user from Tenant A accesses Tenant B's records by changing a URL parameter. The relationship is never verified because route-model binding resolves the model by ID only.
### Preferred Alternative
Always use `->scopeBindings()` on nested resource routes for tenant-scoped models. This ensures the child model is resolved within the parent's relationship, providing automatic tenant isolation at the routing layer.
### Refactoring Strategy
1. Audit all nested routes for `->scopeBindings()` usage
2. Apply `->scopeBindings()` to any nested route under a tenant parent
3. For routes that cannot use scoped bindings (custom resolution logic), add an explicit `whereBelongsTo()` or `where('tenant_id', tenant()->id)` to the query
4. Write integration tests that verify cross-tenant ID manipulation fails
### Detection Checklist
- [ ] Every nested tenant route uses `->scopeBindings()`
- [ ] Routes without scoped bindings have explicit tenant verification
- [ ] Integration tests confirm cross-tenant ID manipulation returns 404/403
### Related Rules
1. Always scope nested route-model bindings for tenant models
2. Never trust user-provided IDs without tenant validation
3. Apply defense in depth at routing, query, and authorization layers
### Related Skills
Use Laravel's `scopeBindings()` method on nested routes to automatically scope child model resolution to the parent relationship.
### Related Decision Trees
## Decision Context
## Decision Criteria
## Decision Tree

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