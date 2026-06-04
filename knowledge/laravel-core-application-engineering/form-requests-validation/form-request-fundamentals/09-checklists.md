# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Form Request Fundamentals
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] FormRequest generated in `app/Http/Requests/`
- [ ] `authorize()` implemented (never rely on default `true`)
- [ ] `rules()` uses array syntax for complex rules
- [ ] Controller uses `$request->validated()` not `$request->all()`
- [ ] Custom `messages()` defined for user-facing errors
- [ ] Integration tests cover validation failure and success
- [ ] Tests cover authorization failure (403)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - FormRequests extend `Illuminate\Foundation\Http\FormRequest`
- [ ] Architecture guideline: - Located in `app/Http/Requests/` (default) or co-located with domain modules
- [ ] Architecture guideline: - Controller method type-hints the request: `public function store(StoreUserRequest $request)`
- [ ] Architecture guideline: - Validation errors automatically redirect back (web) or return JSON 422 (API)
- [ ] Architecture guideline: - The `validated()` method returns only data that passed all rules
- [ ] Architecture guideline: - The `safe()` method returns a `ValidatedInput` instance for scoped access
- [ ] Decision: FormRequest vs Inline $request->validate() - ensure correct choice is made
- [ ] Decision: One FormRequest Per Action vs Reusable FormRequest - ensure correct choice is made
- [ ] Decision: FormRequest vs Manual Validator in Controller - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create and Wire a FormRequest to a Controller Action

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
- [ ] FormRequest generated in `app/Http/Requests/`
- [ ] `authorize()` implemented (never rely on default `true`)
- [ ] `rules()` uses array syntax for complex rules
- [ ] Controller uses `$request->validated()` not `$request->all()`
- [ ] Custom `messages()` defined for user-facing errors
- [ ] Integration tests cover validation failure and success
- [ ] Tests cover authorization failure (403)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Validation in the Controller -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Not Calling parent::authorize() in Authorized Requests -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Relying on $request->all() After Validation -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Forgetting to Type-Hint the FormRequest -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Accessing Route Parameters Via Input Instead of Route Binding -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Empty or Trivial authorize() Methods -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Not Using Request-Specific Validation Messages -- apply preferred alternative
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
- Create and Wire a FormRequest to a Controller Action
### Decision Trees (from 07)
- FormRequest vs Inline $request->validate()
- One FormRequest Per Action vs Reusable FormRequest
- FormRequest vs Manual Validator in Controller
### Anti-Patterns (from 08)
- Validation in the Controller
- Not Calling parent::authorize() in Authorized Requests
- Relying on $request->all() After Validation
- Forgetting to Type-Hint the FormRequest
- Accessing Route Parameters Via Input Instead of Route Binding
- Empty or Trivial authorize() Methods
- Not Using Request-Specific Validation Messages
### Related Rules (from 06 skills)
- Rule 1: One FormRequest Per Controller Action
- Rule 2: Always Use validated() in Controllers â€” Never all()
- Rule 3: Return Rule Arrays â€” Not Pipe-Delimited Strings
- Rule 4: Implement authorize() on Every FormRequest
- Rule 5: Override messages() for User-Friendly Validation Errors
- Rule 6: Trust Validated Data â€” It Has Passed the Gate
### Related Skills (from 06 skills)
- Implement HTTP-Layer Authorization in FormRequests
- Apply Declarative Conditional Validation Rules
- Implement Cross-Field Validation Using withValidator and after

