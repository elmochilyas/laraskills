# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Domain-Specific Query Methods
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] DSQMs named with domain vocabulary, not database column names
- [ ] Custom builder registered via `HasBuilder` trait or `newEloquentBuilder()` override
- [ ] Negation methods exist for state-based DSQMs
- [ ] `@method` annotations on model class for IDE support
- [ ] DSQMs tested at SQL level and business rule level
- [ ] No side effects (logging, API calls) in DSQM methods
- [ ] Domain terminology consistent across models
- [ ] Inline queries don't bypass DSQMs with different logic for the same concept

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place DSQMs in custom builder classes (`app/Models/Builders/`), not on the model
- [ ] Architecture guideline: - Establish naming conventions: verb-based (`published()`), temporal (`recent()`), prepositional ...
- [ ] Architecture guideline: - Use fine-grained methods that compose well over coarse-grained monolithic methods
- [ ] Architecture guideline: - Document complex DSQMs with comments explaining the business rule
- [ ] Architecture guideline: - Keep a glossary of DSQM terms and their definitions for the team
- [ ] Decision: DSQM vs Local Scope Selection - ensure correct choice is made
- [ ] Decision: DSQM Method Granularity - ensure correct choice is made
- [ ] Decision: DSQM Naming Convention - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Domain-Specific Query Methods on Custom Builders

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
- [ ] DSQMs named with domain vocabulary, not database column names
- [ ] Custom builder registered via `HasBuilder` trait or `newEloquentBuilder()` override
- [ ] Negation methods exist for state-based DSQMs
- [ ] `@method` annotations on model class for IDE support
- [ ] DSQMs tested at SQL level and business rule level
- [ ] No side effects (logging, API calls) in DSQM methods
- [ ] Domain terminology consistent across models

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
### Skills (from 06)
- Implement Domain-Specific Query Methods on Custom Builders
### Decision Trees (from 07)
- DSQM vs Local Scope Selection
- DSQM Method Granularity
- DSQM Naming Convention
### Related Rules (from 06 skills)
- Name DSQMs Using Business Domain Vocabulary, Not Database Column Names (query-strategy/domain-specific-query-methods)
- Always Provide Negation Methods for State-Based DSQMs (query-strategy/domain-specific-query-methods)
- Keep DSQMs Focused on a Single Domain Concept (query-strategy/domain-specific-query-methods)
- Add @method Annotations on the Model Class for IDE Discoverability (query-strategy/domain-specific-query-methods)
- Maintain Naming Consistency Across Models for the Same Domain Concept (query-strategy/domain-specific-query-methods)
- DSQMs Must Not Suppress Global Scopes Without Explicit Method Names (query-strategy/domain-specific-query-methods)
- Test DSQMs at the SQL Level to Verify Generated Queries (query-strategy/domain-specific-query-methods)
### Related Skills (from 06 skills)
- Implement Custom Builder Pattern for Rich Query APIs
- Implement Local Scopes for Reusable Constraints
- Compose Conditional Query Chains with when()

