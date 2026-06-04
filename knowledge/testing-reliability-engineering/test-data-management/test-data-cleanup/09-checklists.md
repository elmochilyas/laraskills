# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Data Management
**Knowledge Unit:** ** Test Data Cleanup (Minimal Data Principle)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Create Only the Minimum Data Required for the Assertion
- [ ] Apply rule: Use Explicit Values for Asserted Attributes
- [ ] Apply rule: Remove Unused Factory-Created Records
- [ ] Apply rule: Set a Team Convention for Maximum Records Per Test
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `RefreshDatabase` or equivalent trait is applied to all database tests
- [ ] Each test creates only the data needed for its specific assertion
- [ ] Tests use explicit values for attributes in assertions, not Faker data
- [ ] Most tests create 1-3 records; exceptions have comments explaining why
- [ ] No test creates more than 10 records without a documented reason
- [ ] Avoid: Creating production-like datasets for every test
- [ ] Avoid: Using Faker in assertions
- [ ] Avoid: Creating data that's never used

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Contract: RefreshDatabase**: All tests that create database records should use `RefreshDatabase` or `DatabaseTruncation` for cleanup.
- **Data creation isolation**: Tests should not depend on data created by other tests. Each test creates its own minimum data.
- **Factory attribute overrides**: `User::factory()->create(['role' => 'admin'])` creates a user with admin role and Faker defaults for other fields. Override only what's material.
- **Record count decision guide**: 1 record for existence/ownership. 2-3 for scoping/list. ~15 for pagination. Never more without justification.
- **Test data budget**: Monitor total records created per test suite. Alert when trends increase.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Create Only the Minimum Data Required for the Assertion
- [ ] Follow rule: Use Explicit Values for Asserted Attributes
- [ ] Follow rule: Remove Unused Factory-Created Records
- [ ] Follow rule: Set a Team Convention for Maximum Records Per Test
- [ ] Follow rule: Profile Test Data Creation with `--profile`
- [ ] Follow rule: Use `RefreshDatabase` for All Test Data Cleanup
- [ ] - [ ] `RefreshDatabase` or equivalent trait is applied to all database tests
- [ ] - [ ] Each test creates only the data needed for its specific assertion
- [ ] - [ ] Tests use explicit values for attributes in assertions, not Faker data
- [ ] - [ ] Most tests create 1-3 records; exceptions have comments explaining why

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: The minimal data principle states that tests should create only the minimum data...
- [ ] Verify: Create Only the Minimum Data Required for the Assertion
- [ ] Verify: Use Explicit Values for Asserted Attributes
- [ ] Verify: Remove Unused Factory-Created Records
- [ ] Verify: Set a Team Convention for Maximum Records Per Test

# Testing Checklist
- [ ] `RefreshDatabase` or equivalent trait is applied to all database tests
- [ ] Each test creates only the data needed for its specific assertion
- [ ] Tests use explicit values for attributes in assertions, not Faker data
- [ ] Most tests create 1-3 records; exceptions have comments explaining why
- [ ] No test creates more than 10 records without a documented reason
- [ ] Pagination tests create exactly (per_page + 1) records or use config values
- [ ] Avoid: Creating production-like datasets for every test
- [ ] Avoid: Using Faker in assertions
- [ ] Avoid: Creating data that's never used

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Create Only the Minimum Data Required for the Assertion
- [ ] Apply: Use Explicit Values for Asserted Attributes
- [ ] Apply: Remove Unused Factory-Created Records
- [ ] Apply: Set a Team Convention for Maximum Records Per Test

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
- Create Only the Minimum Data Required for the Assertion
- Use Explicit Values for Asserted Attributes
- Remove Unused Factory-Created Records
- Set a Team Convention for Maximum Records Per Test
- Profile Test Data Creation with `--profile`
- Use `RefreshDatabase` for All Test Data Cleanup
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Clean Up Test Data and Apply Minimal Data Principle


