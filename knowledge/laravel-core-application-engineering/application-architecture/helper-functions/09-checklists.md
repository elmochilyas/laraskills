# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Helper Functions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Controllers may use helpers (including container-resolving) for framework services
- [ ] Services, actions, and domain objects use constructor injection exclusively
- [ ] All `env()` calls are inside `config/` files only
- [ ] No `dd()` or `dump()` calls exist in committed code
- [ ] Pure utility helpers are used freely regardless of class role
- [ ] Event listeners and route callbacks may use helpers pragmatically
- [ ] Custom helpers follow `function_exists()` guards

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Helpers vs Facades vs Injection
- [ ] Architecture guideline: ### Where Each Pattern Belongs
- [ ] Architecture guideline: ### Custom Helper Autoloading Configuration
- [ ] Architecture guideline: "app/helpers.php"
- [ ] Decision: Helper Functions vs Constructor Injection for Dependency Access - ensure correct choice is made
- [ ] Decision: Container-Resolving Helpers vs Pure Utility Helpers - ensure correct choice is made
- [ ] Decision: Custom Helper Definitions vs Class Methods - ensure correct choice is made
- [ ] Decision: env() vs config() for Environment Configuration - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Use Helpers in Controllers and Views (Injection in Services)
- [ ] Skill applied: Create Custom Helpers

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
- [ ] Controllers may use helpers (including container-resolving) for framework services
- [ ] Services, actions, and domain objects use constructor injection exclusively
- [ ] All `env()` calls are inside `config/` files only
- [ ] No `dd()` or `dump()` calls exist in committed code
- [ ] Pure utility helpers are used freely regardless of class role
- [ ] Event listeners and route callbacks may use helpers pragmatically
- [ ] Custom helpers follow `function_exists()` guards

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Helper-Driven Development -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Business Logic in Custom Helpers -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: `env()` Helper Outside Config Files -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing `function_exists()` Guard -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
- Use Helpers in Controllers and Views (Injection in Services)
- Create Custom Helpers
### Decision Trees (from 07)
- Helper Functions vs Constructor Injection for Dependency Access
- Container-Resolving Helpers vs Pure Utility Helpers
- Custom Helper Definitions vs Class Methods
- env() vs config() for Environment Configuration
### Anti-Patterns (from 08)
- Helper-Driven Development
- Business Logic in Custom Helpers
- `env()` Helper Outside Config Files
- Missing `function_exists()` Guard
### Related Rules (from 06 skills)
- Use Helpers in Controllers and Views, Injection in Services (05-rules.md)
- Never Use env() Outside Config Files (05-rules.md)
- Wrap Custom Helpers in function_exists() Guard (05-rules.md)
- Prefix Custom Helpers to Reduce Collision Risk (05-rules.md)
- Autoload Custom Helpers via Composer files Directive (05-rules.md)
- Keep Custom Helpers Lightweight and Side-Effect-Free (05-rules.md)
- Never Leave dd() or dump() in Production Code (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Create Custom Helpers
- Skill: Choose Between Facades and Constructor Injection
- Skill: Bind and Resolve Services in Container

