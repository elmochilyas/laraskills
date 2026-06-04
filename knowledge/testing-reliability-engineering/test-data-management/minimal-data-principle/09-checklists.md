# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Data Management
**Knowledge Unit:** Minimal Data Principle
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Create Only the Data Your Assertion Checks
- [ ] Apply rule: Use Specific Factory States Over Inline Attributes for Reusable Patterns
- [ ] Apply rule: Follow the Record Count Decision Guide
- [ ] Apply rule: Avoid Creating Relationships Unless Needed
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Tests create the minimum records needed for the assertion
- [ ] Explicit values are used for assertion-related attributes
- [ ] No unused factory-created records exist in tests
- [ ] Relationship creation is minimized to what the test requires
- [ ] Pagination tests create exactly page_size + 1 records
- [ ] Avoid: Creating production-like datasets for every test
- [ ] Avoid: Using Faker in assertions
- [ ] Avoid: Creating data that's never used

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Record count guidelines**: 1 record for existence/ownership, 2-3 for scoping/list tests, ~15 for pagination tests (enough for 2 pages).
- **Attribute specification**: Specify attributes relevant to the assertion. Use factory defaults for irrelevant fields.
- **Relationship minimization**: Avoid creating relationships unless they're needed for the test scenario. `User::factory()->hasPosts(10)` is unnecessary if only the user is tested.
- **Test speed-cost awareness**: Each additional database record adds ~1-5ms of creation time. 100 unnecessary records Ã— 100 tests Ã— 5ms = 50 seconds of wasted CI time.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Create Only the Data Your Assertion Checks
- [ ] Follow rule: Use Specific Factory States Over Inline Attributes for Reusable Patterns
- [ ] Follow rule: Follow the Record Count Decision Guide
- [ ] Follow rule: Avoid Creating Relationships Unless Needed
- [ ] Follow rule: Profile Data-Heavy Tests and Optimize
- [ ] Follow rule: Never Use Faker Data in Test Assertions
- [ ] - [ ] Tests create the minimum records needed for the assertion
- [ ] - [ ] Explicit values are used for assertion-related attributes
- [ ] - [ ] No unused factory-created records exist in tests
- [ ] - [ ] Relationship creation is minimized to what the test requires

# Performance Checklist
- **Per-record creation**: 1-5ms for simple models (User, Post). 5-20ms for models with relationships.
- **Transaction rollback**: Proportional to modified data volume. 3 records vs 50 records: rollback is 10x faster for 3.
- **Database connection**: Each test's data volume affects connection pool utilization. Less data = less contention.
- **Factory Faker generation**: Faker calls are fast (~0.01ms) but add up. 50 Faker calls Ã— 50 models = 25ms in Faker alone.

# Security Checklist
- **Data exposure**: Minimal data means fewer records with sensitive attributes. Avoid creating data with real user information.
- **Test isolation**: Minimal data reduces the chance of data leakage between tests. Fewer records = less state to manage.

# Reliability Checklist
- [ ] Ensure: The minimal data principle states that tests should create only the minimum data...
- [ ] Verify: Create Only the Data Your Assertion Checks
- [ ] Verify: Use Specific Factory States Over Inline Attributes for Reusable Patterns
- [ ] Verify: Follow the Record Count Decision Guide
- [ ] Verify: Avoid Creating Relationships Unless Needed

# Testing Checklist
- [ ] Tests create the minimum records needed for the assertion
- [ ] Explicit values are used for assertion-related attributes
- [ ] No unused factory-created records exist in tests
- [ ] Relationship creation is minimized to what the test requires
- [ ] Pagination tests create exactly page_size + 1 records
- [ ] Code review flags `User::factory(10)` when 2 would suffice
- [ ] Avoid: Creating production-like datasets for every test
- [ ] Avoid: Using Faker in assertions
- [ ] Avoid: Creating data that's never used

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Create Only the Data Your Assertion Checks
- [ ] Apply: Use Specific Factory States Over Inline Attributes for Reusable Patterns
- [ ] Apply: Follow the Record Count Decision Guide
- [ ] Apply: Avoid Creating Relationships Unless Needed

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Creating production-like datasets for every test
- [ ] Avoid mistake: Using Faker in assertions
- [ ] Avoid mistake: Creating data that's never used
- [ ] Avoid mistake: Confusing "realistic" with "correct"

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
- Create Only the Data Your Assertion Checks
- Use Specific Factory States Over Inline Attributes for Reusable Patterns
- Follow the Record Count Decision Guide
- Avoid Creating Relationships Unless Needed
- Profile Data-Heavy Tests and Optimize
- Never Use Faker Data in Test Assertions
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Apply the Minimal Data Principle


