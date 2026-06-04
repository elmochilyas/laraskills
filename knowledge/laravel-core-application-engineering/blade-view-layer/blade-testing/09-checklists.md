# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Blade Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Assert on Visible Content, Not HTML Structure
- [ ] Enforce: Test Both Branches of Every Conditional
- [ ] Enforce: Use View Unit Tests for Logic, HTTP Tests for Data Flow
- [ ] Enforce: Always Test That Sensitive Data Is NOT Rendered
- [ ] Enforce: Test Translation Output, Not Translation Keys
- [ ] Enforce: Verify XSS Escaping in View Tests
- [ ] Enforce: Do Not Test Framework Behavior
- [ ] Enforce: Prefer `$this->blade()` Helper for Directive and Component Tests
- [ ] Every conditional branch is tested in both directions (assertSee + assertDontSee)
- [ ] Loop rendering verified â€” all expected items appear in output
- [ ] Component props, slots, and attributes render correctly via `$this->blade()`
- [ ] Translation output tested per supported locale on the value, not the key
- [ ] XSS escaping verified â€” user input appears as escaped HTML entities
- [ ] No assertions on HTML tags, CSS classes, or raw HTML structure
- [ ] `assertDontSee` confirms sensitive data is absent from rendered output
- [ ] View unit tests are fast (<1ms) and avoid unnecessary database or HTTP dependencies

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### View Unit Tests vs HTTP Integration Tests
- [ ] Architecture guideline: ### Testing Pyramid for Views
- [ ] Architecture guideline: 1. **Unit tests** (fastest) â€” test view model logic, component class methods, helper functions
- [ ] Architecture guideline: 2. **View tests** â€” render isolated views with assertions on rendered HTML
- [ ] Architecture guideline: 3. **HTTP tests** â€” test full controller-to-view flow with assertions on response
- [ ] Architecture guideline: 4. **Browser tests** (slowest, Dusk) â€” test interactive behavior, JS, visual layout
- [ ] Architecture guideline: ### What to Test per Component
- [ ] Architecture guideline: - Constructor parameters correctly used in render
- [ ] Architecture guideline: - Slots render content correctly
- [ ] Architecture guideline: - Conditional display logic (if/else branches)
- [ ] Architecture guideline: - Attribute merging behavior
- [ ] Decision: View Unit Test vs HTTP Integration Test - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Assert on Visible Content, Not HTML Structure
- [ ] Apply rule: Test Both Branches of Every Conditional
- [ ] Apply rule: Use View Unit Tests for Logic, HTTP Tests for Data Flow
- [ ] Apply rule: Always Test That Sensitive Data Is NOT Rendered
- [ ] Apply rule: Test Translation Output, Not Translation Keys
- [ ] Apply rule: Verify XSS Escaping in View Tests
- [ ] Apply rule: Do Not Test Framework Behavior
- [ ] Apply rule: Prefer `$this->blade()` Helper for Directive and Component Tests
- [ ] Skill applied: Write Assertions for Blade View Rendering

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
- [ ] Every conditional branch is tested in both directions (assertSee + assertDontSee)
- [ ] Loop rendering verified â€” all expected items appear in output
- [ ] Component props, slots, and attributes render correctly via `$this->blade()`
- [ ] Translation output tested per supported locale on the value, not the key
- [ ] XSS escaping verified â€” user input appears as escaped HTML entities
- [ ] No assertions on HTML tags, CSS classes, or raw HTML structure
- [ ] `assertDontSee` confirms sensitive data is absent from rendered output

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Structural HTML Assertions -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Single-Branch Conditional Testing -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Testing Framework Behavior -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Asserting on Translation Keys Instead of Values -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Over-Asserting -- apply preferred alternative
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
### Rules (from 05)
- Assert on Visible Content, Not HTML Structure
- Test Both Branches of Every Conditional
- Use View Unit Tests for Logic, HTTP Tests for Data Flow
- Always Test That Sensitive Data Is NOT Rendered
- Test Translation Output, Not Translation Keys
- Verify XSS Escaping in View Tests
- Do Not Test Framework Behavior
- Prefer `$this->blade()` Helper for Directive and Component Tests
### Skills (from 06)
- Write Assertions for Blade View Rendering
### Decision Trees (from 07)
- View Unit Test vs HTTP Integration Test
- assertSee vs assertSeeText
- Single-Branch vs Paired Conditional Testing
### Anti-Patterns (from 08)
- Structural HTML Assertions
- Single-Branch Conditional Testing
- Testing Framework Behavior
- Asserting on Translation Keys Instead of Values
- Over-Asserting
### Related Rules (from 06 skills)
- blade-testing/05-rules.md: Assert on Visible Content, Not HTML Structure
- blade-testing/05-rules.md: Test Both Branches of Every Conditional
- blade-testing/05-rules.md: Use View Unit Tests for Logic, HTTP Tests for Data Flow
- blade-testing/05-rules.md: Always Test That Sensitive Data Is NOT Rendered
- blade-testing/05-rules.md: Test Translation Output, Not Translation Keys
- blade-testing/05-rules.md: Verify XSS Escaping in View Tests
- blade-testing/05-rules.md: Prefer `$this->blade()` Helper for Directive and Component Tests
### Related Skills (from 06 skills)
- Component System: Create and Use Blade Components
- Custom Directives: Register Custom Blade Directives
- Localization in Views: Implement Multi-Language Translation in Views
- View Composers and Creators: Implement View Composers for Shared Data

