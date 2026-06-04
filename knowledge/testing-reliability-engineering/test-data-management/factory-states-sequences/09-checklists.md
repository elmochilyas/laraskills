# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Data Management
**Knowledge Unit:** Factory States and Sequences
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use Deterministic Values in State Definitions â€” Never `now()`
- [ ] Apply rule: Prefer `->has()` Over `afterCreating` for Scenario-Specific Relationships
- [ ] Apply rule: Document Available States in Factory Docblocks
- [ ] Apply rule: Understand Attribute Precedence: `create()` > Last State > First State > Base
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] State methods use deterministic values (not `now()`, `rand()`, `Str::random()`)
- [ ] Factory states are documented in factory docblocks
- [ ] `afterCreating` hooks are documented and minimal
- [ ] Sequence usage is clear and tested
- [ ] Attribute precedence is documented (`create()` > `state()` > base)
- [ ] Avoid: State methods with non-deterministic data
- [ ] Avoid: Overusing afterCreating for test-scenario relationships
- [ ] Avoid: Unclear attribute precedence

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **State method naming**: Use descriptive names that match the domain. `published()`, `draft()`, `archived()`, `admin()`, `subscribed()`.
- **State organization**: Group related states in the factory class. `UserFactory` states for roles, `PostFactory` states for content status.
- **Sequence with callback**: Use sequence callbacks for dynamic attribute generation based on index. Use explicit arrays for static variations.
- **Combined patterns**: States + sequences + `->has()` for expressive bulk data creation. `Post::factory()->published()->has(Comment::factory(3))->create()`.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use Deterministic Values in State Definitions â€” Never `now()`
- [ ] Follow rule: Prefer `->has()` Over `afterCreating` for Scenario-Specific Relationships
- [ ] Follow rule: Document Available States in Factory Docblocks
- [ ] Follow rule: Understand Attribute Precedence: `create()` > Last State > First State > Base
- [ ] Follow rule: Use Sequences for Small Batches (2-10), Explicit Loops for Larger
- [ ] Follow rule: Document `afterCreating` Hooks Clearly
- [ ] - [ ] State methods use deterministic values (not `now()`, `rand()`, `Str::random()`)
- [ ] - [ ] Factory states are documented in factory docblocks
- [ ] - [ ] `afterCreating` hooks are documented and minimal
- [ ] - [ ] Sequence usage is clear and tested

# Performance Checklist
- **State evaluation**: Negligible overhead (attribute array merge).
- **Sequence iteration**: Linear O(n) over sequence items. Negligible for typical sizes (<100).
- **afterCreating hooks**: Add model creation time. For large batches, hooks can significantly increase time.
- **Relationship factories**: `->has()` creates related models in separate database queries. For large relationships (100+), consider chunking.
- **Factory resolution**: Cached per test class. No repeated resolution overhead.

# Security Checklist
- **afterCreating side effects**: Ensure afterCreating hooks don't accidentally trigger real service calls (emails, API requests). Use `->withoutEvents()` for sensitive operations.
- **State data exposure**: Factory states should not contain sensitive or real user data.

# Reliability Checklist
- [ ] Ensure: Factory states and sequences are Laravel model factory features that enable conc...
- [ ] Verify: Use Deterministic Values in State Definitions â€” Never `now()`
- [ ] Verify: Prefer `->has()` Over `afterCreating` for Scenario-Specific Relationships
- [ ] Verify: Document Available States in Factory Docblocks
- [ ] Verify: Understand Attribute Precedence: `create()` > Last State > First State > Base

# Testing Checklist
- [ ] State methods use deterministic values (not `now()`, `rand()`, `Str::random()`)
- [ ] Factory states are documented in factory docblocks
- [ ] `afterCreating` hooks are documented and minimal
- [ ] Sequence usage is clear and tested
- [ ] Attribute precedence is documented (`create()` > `state()` > base)
- [ ] States are compatible with each other (no conflicting attributes)
- [ ] Avoid: State methods with non-deterministic data
- [ ] Avoid: Overusing afterCreating for test-scenario relationships
- [ ] Avoid: Unclear attribute precedence

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use Deterministic Values in State Definitions â€” Never `now()`
- [ ] Apply: Prefer `->has()` Over `afterCreating` for Scenario-Specific Relationships
- [ ] Apply: Document Available States in Factory Docblocks
- [ ] Apply: Understand Attribute Precedence: `create()` > Last State > First State > Base

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: State methods with non-deterministic data
- [ ] Avoid mistake: Overusing afterCreating for test-scenario relationships
- [ ] Avoid mistake: Unclear attribute precedence

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Use Deterministic Values in State Definitions â€” Never `now()`
- Prefer `->has()` Over `afterCreating` for Scenario-Specific Relationships
- Document Available States in Factory Docblocks
- Understand Attribute Precedence: `create()` > Last State > First State > Base
- Use Sequences for Small Batches (2-10), Explicit Loops for Larger
- Document `afterCreating` Hooks Clearly
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Use Factory States and Sequences


