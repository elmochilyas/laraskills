# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Model Conventions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Rely on Conventions for New Projects
- [ ] Enforce: Override `$table` Explicitly When Convention Fails
- [ ] Enforce: Specify Foreign Keys Explicitly for Non-Standard Relationships
- [ ] Enforce: Use Alphabetical Order for Custom Pivot Tables
- [ ] Enforce: Test Model-Table Mapping with Schema Assertions
- [ ] Enforce: Document Every Convention Override with a Reason
- [ ] Enforce: Prefer Convention Over Configuration at All Times
- [ ] Every model has the correct `$table` (explicitly or by convention)
- [ ] Convention overrides include a comment explaining why
- [ ] Foreign keys are explicitly specified when they diverge from `{model_name}_id`
- [ ] Custom pivot tables follow alphabetical singular name convention
- [ ] Schema assertion tests exist for models with overrides
- [ ] No unnecessary configuration properties are declared (matching conventions are omitted)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Follow conventions for new projects; override for legacy
- [ ] Architecture guideline: - Document all overrides with comments explaining why the convention doesn't apply
- [ ] Architecture guideline: - Test that model-table mappings are correct with a schema assertion test

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Rely on Conventions for New Projects
- [ ] Apply rule: Override `$table` Explicitly When Convention Fails
- [ ] Apply rule: Specify Foreign Keys Explicitly for Non-Standard Relationships
- [ ] Apply rule: Use Alphabetical Order for Custom Pivot Tables
- [ ] Apply rule: Test Model-Table Mapping with Schema Assertions
- [ ] Apply rule: Document Every Convention Override with a Reason
- [ ] Apply rule: Prefer Convention Over Configuration at All Times
- [ ] Skill applied: Verify and Align Model-Table Mapping Conventions

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] Every model has the correct `$table` (explicitly or by convention)
- [ ] Convention overrides include a comment explaining why
- [ ] Foreign keys are explicitly specified when they diverge from `{model_name}_id`
- [ ] Custom pivot tables follow alphabetical singular name convention
- [ ] Schema assertion tests exist for models with overrides
- [ ] No unnecessary configuration properties are declared (matching conventions are omitted)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Rules (from 05)
- Rely on Conventions for New Projects
- Override `$table` Explicitly When Convention Fails
- Specify Foreign Keys Explicitly for Non-Standard Relationships
- Use Alphabetical Order for Custom Pivot Tables
- Test Model-Table Mapping with Schema Assertions
- Document Every Convention Override with a Reason
- Prefer Convention Over Configuration at All Times
### Skills (from 06)
- Verify and Align Model-Table Mapping Conventions
### Related Rules (from 06 skills)
- Rely on Conventions for New Projects
- Override `$table` Explicitly When Convention Fails
- Specify Foreign Keys Explicitly for Non-Standard Relationships
- Test Model-Table Mapping with Schema Assertions
- Document Every Convention Override with a Reason
### Related Skills (from 06 skills)
- Model Configuration Properties for Overrides
- Base Model Class for Shared Configuration
- Directory Structure for Model Organization

