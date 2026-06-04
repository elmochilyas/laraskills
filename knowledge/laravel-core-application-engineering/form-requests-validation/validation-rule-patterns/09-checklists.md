# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Validation Rule Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Array syntax used instead of pipe-delimited strings for complex rules
- [ ] `Rule::unique()->ignore()` used on update requests
- [ ] Regex rules in array syntax to prevent comma-splitting
- [ ] Custom rules added with `new` keyword in array
- [ ] `bail` used on attributes with dependent rules
- [ ] `Rule::exists()` used for foreign key validation
- [ ] No Rule objects in pipe-delimited strings
- [ ] Table/column names in `Rule::unique`/`Rule::exists` are correct

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `ValidationRuleParser::explode()` expands human-friendly rules into validator rules
- [ ] Architecture guideline: - `ValidationRuleParser::parse()` extracts rule name and parameters from a single rule
- [ ] Architecture guideline: - `Rule::unique()` builds lazy database EXISTS queries â€” connection not used until validation time
- [ ] Architecture guideline: - `Rule::exists()` similarly builds lazy database queries
- [ ] Architecture guideline: - `Date` and `Numeric` rule objects are string-cast and re-parsed â€” use sparingly
- [ ] Architecture guideline: - Regular expression rules (`regex:pattern`) preserve the full pattern without splitting on commas
- [ ] Decision: Array Syntax vs Pipe-Delimited String Syntax for Rules - ensure correct choice is made
- [ ] Decision: bail vs stopOnFirstFailure for Validation Stopping - ensure correct choice is made
- [ ] Decision: Rule::unique() Inline vs Dedicated Exists Rule - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Write Validation Rules Using Array Syntax with Rule Objects
- [ ] Skill applied: Configure bail and stopOnFirstFailure Strategically

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
- [ ] Array syntax used instead of pipe-delimited strings for complex rules
- [ ] `Rule::unique()->ignore()` used on update requests
- [ ] Regex rules in array syntax to prevent comma-splitting
- [ ] Custom rules added with `new` keyword in array
- [ ] `bail` used on attributes with dependent rules
- [ ] `Rule::exists()` used for foreign key validation
- [ ] No Rule objects in pipe-delimited strings

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Pipe-Delimited Rules With No Space Around | -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Rule Objects With Unnecessary string Wrapping -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Overusing exists:table Rule -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Inline Anonymous Functions for Simple Rule Logic -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Complex Nested Array Validation in a Single Flat Rule Set -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Required Fields Without Bounds -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Not Using Bail in Rule Chains -- apply preferred alternative
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
- Write Validation Rules Using Array Syntax with Rule Objects
- Configure bail and stopOnFirstFailure Strategically
### Decision Trees (from 07)
- Array Syntax vs Pipe-Delimited String Syntax for Rules
- bail vs stopOnFirstFailure for Validation Stopping
- Rule::unique() Inline vs Dedicated Exists Rule
### Anti-Patterns (from 08)
- Pipe-Delimited Rules With No Space Around |
- Rule Objects With Unnecessary string Wrapping
- Overusing exists:table Rule
- Inline Anonymous Functions for Simple Rule Logic
- Complex Nested Array Validation in a Single Flat Rule Set
- Required Fields Without Bounds
- Not Using Bail in Rule Chains
### Related Rules (from 06 skills)
- Rule 1: Prefer Array Syntax for Validation Rules
- Rule 2: Always Use Rule::unique()->ignore() on Update Requests
- Rule 3: Use bail on Dependent Rules for Performance
- Rule 4: Use Array Syntax for Regex Rules to Prevent Comma-Splitting
- Rule 5: Use Rule::exists() for Foreign Key Validation
- Rule 6: Add bail or stopOnFirstFailure Strategically
### Related Skills (from 06 skills)
- Create and Use Invokable Custom Validation Rules
- Apply Declarative Conditional Validation Rules

