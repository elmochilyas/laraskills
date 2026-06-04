# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Manual Validator Usage
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `Validator::make()` used for non-HTTP input validation
- [ ] `$validator->fails()` always checked before proceeding with data
- [ ] `ValidationException` thrown on failure (not generic exceptions)
- [ ] Authorization handled separately via Gates/Policies
- [ ] Batch validation uses `setData()` to reuse Validator instance
- [ ] Rules co-located with the action (not in separate rule files for single use)
- [ ] Tests cover both pass and fail paths

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `ValidationFactory::make()` resolves the Validator, injects presence verifier, and adds extensions
- [ ] Architecture guideline: - Manual Validator uses the EXACT same rule parsing as FormRequests â€” all custom rules work ide...
- [ ] Architecture guideline: - `setData()` allows Validator reuse for bulk validation scenarios
- [ ] Architecture guideline: - `ValidationException` thrown from manual validation is caught by Laravel's exception handler
- [ ] Architecture guideline: - For API contexts, `ValidationException` returns JSON 422; for CLI, it's a regular exception
- [ ] Architecture guideline: - Use `Validator::resolver()` to customize the validator class globally if needed
- [ ] Decision: FormRequest vs Manual Validator for Validation Context - ensure correct choice is made
- [ ] Decision: Validator::make() in Service Layer vs CLI Command - ensure correct choice is made
- [ ] Decision: Manual Validation Error Handling: Exception vs Conditional Check - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Validate Input in Non-HTTP Contexts Using Manual Validator
- [ ] Skill applied: Perform Batch Validation with Repeated Validator Use

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
- [ ] `Validator::make()` used for non-HTTP input validation
- [ ] `$validator->fails()` always checked before proceeding with data
- [ ] `ValidationException` thrown on failure (not generic exceptions)
- [ ] Authorization handled separately via Gates/Policies
- [ ] Batch validation uses `setData()` to reuse Validator instance
- [ ] Rules co-located with the action (not in separate rule files for single use)
- [ ] Tests cover both pass and fail paths

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Calling Validator::make() in the Controller Instead of Dependency Injection -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Ignoring the Return Value of Validator::fails() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Creating New Validator Instances Inside Loops -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Manually Constructing Validation Messages Without Using the ErrorBag -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Calling validate() Without try-catch for Non-API Responses -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Using Manual Validation When a FormRequest Would Suffice -- apply preferred alternative
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
- Validate Input in Non-HTTP Contexts Using Manual Validator
- Perform Batch Validation with Repeated Validator Use
### Decision Trees (from 07)
- FormRequest vs Manual Validator for Validation Context
- Validator::make() in Service Layer vs CLI Command
- Manual Validation Error Handling: Exception vs Conditional Check
### Anti-Patterns (from 08)
- Calling Validator::make() in the Controller Instead of Dependency Injection
- Ignoring the Return Value of Validator::fails()
- Creating New Validator Instances Inside Loops
- Manually Constructing Validation Messages Without Using the ErrorBag
- Calling validate() Without try-catch for Non-API Responses
- Using Manual Validation When a FormRequest Would Suffice
### Related Rules (from 06 skills)
- Rule 1: Always Validate Input in Non-HTTP Contexts
- Rule 2: Always Check $validator->fails() Before Proceeding
- Rule 3: Handle Authorization Separately for Manual Validators
- Rule 4: Throw ValidationException for Consistent Error Handling
- Rule 5: Use setData() for Batch Validation
- Rule 6: Keep Validation Rules Co-Located with the Action or Command
### Related Skills (from 06 skills)
- Apply Declarative Conditional Validation Rules
- Test Validation Boundaries via HTTP Integration Tests

