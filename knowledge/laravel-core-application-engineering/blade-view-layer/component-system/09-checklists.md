# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Component System
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Merge `$attributes` on Wrapper Elements
- [ ] Enforce: Prefer Anonymous Components for Presentational UI, Class-Based for Logic
- [ ] Enforce: Limit Constructor Parameters to 5 Maximum
- [ ] Enforce: Namespace Components by Domain
- [ ] Enforce: Never Access Parent Scope in Anonymous Components
- [ ] Enforce: Keep Component Nesting Within 3 Levels
- [ ] Enforce: Always Include `{{ $slot }}` in Components
- [ ] Component renders with correct props and slot content
- [ ] `$attributes->merge()` preserves consumer-passed attributes alongside defaults
- [ ] Named slots render in correct positions with fallback defaults
- [ ] Anonymous components receive only passed attributes (no parent scope leak)
- [ ] Class-based component injects dependencies via constructor
- [ ] Component is discoverable via its `x-` alias
- [ ] Constructor parameters are 5 or fewer
- [ ] Component nesting depth does not exceed 3 levels

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Component Namespace Organization
- [ ] Architecture guideline: resources/views/components/
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ button.blade.php
- [ ] Architecture guideline: â”‚   â””â”€â”€ card.blade.php
- [ ] Architecture guideline: â”œâ”€â”€ forms/
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ input.blade.php
- [ ] Architecture guideline: â”‚   â””â”€â”€ select.blade.php
- [ ] Architecture guideline: â””â”€â”€ layouts/
- [ ] Architecture guideline: â”œâ”€â”€ header.blade.php
- [ ] Architecture guideline: â””â”€â”€ sidebar.blade.php
- [ ] Architecture guideline: ### Custom Component Namespace Registration
- [ ] Architecture guideline: Blade::componentNamespace('App\\View\\Components\\Forms', 'forms');

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Merge `$attributes` on Wrapper Elements
- [ ] Apply rule: Prefer Anonymous Components for Presentational UI, Class-Based for Logic
- [ ] Apply rule: Limit Constructor Parameters to 5 Maximum
- [ ] Apply rule: Namespace Components by Domain
- [ ] Apply rule: Never Access Parent Scope in Anonymous Components
- [ ] Apply rule: Keep Component Nesting Within 3 Levels
- [ ] Apply rule: Always Include `{{ $slot }}` in Components
- [ ] Skill applied: Create and Use Blade Components

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
- [ ] Component renders with correct props and slot content
- [ ] `$attributes->merge()` preserves consumer-passed attributes alongside defaults
- [ ] Named slots render in correct positions with fallback defaults
- [ ] Anonymous components receive only passed attributes (no parent scope leak)
- [ ] Class-based component injects dependencies via constructor
- [ ] Component is discoverable via its `x-` alias
- [ ] Constructor parameters are 5 or fewer

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Missing `$attributes->merge()` on Root Elements -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Omitting `{{ $slot }}` in Wrapper Components -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Class-Based Components for Purely Presentational UI -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Excessive Constructor Parameters -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Anonymous Components Relying on Parent Scope -- apply preferred alternative
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
- Always Merge `$attributes` on Wrapper Elements
- Prefer Anonymous Components for Presentational UI, Class-Based for Logic
- Limit Constructor Parameters to 5 Maximum
- Namespace Components by Domain
- Never Access Parent Scope in Anonymous Components
- Keep Component Nesting Within 3 Levels
- Always Include `{{ $slot }}` in Components
### Skills (from 06)
- Create and Use Blade Components
### Decision Trees (from 07)
- Anonymous vs Class-Based Component
- Component Namespace Organization
- Component vs @include vs Layout Inheritance
### Anti-Patterns (from 08)
- Missing `$attributes->merge()` on Root Elements
- Omitting `{{ $slot }}` in Wrapper Components
- Class-Based Components for Purely Presentational UI
- Excessive Constructor Parameters
- Anonymous Components Relying on Parent Scope
### Related Rules (from 06 skills)
- component-system/05-rules.md: Always Merge `$attributes` on Wrapper Elements
- component-system/05-rules.md: Prefer Anonymous Components for Presentational UI, Class-Based for Logic
- component-system/05-rules.md: Limit Constructor Parameters to 5 Maximum
- component-system/05-rules.md: Namespace Components by Domain
- component-system/05-rules.md: Never Access Parent Scope in Anonymous Components
- component-system/05-rules.md: Keep Component Nesting Within 3 Levels
- component-system/05-rules.md: Always Include `{{ $slot }}` in Components
### Related Skills (from 06 skills)
- Slots and Stacks: Implement Content Injection with Slots and Stacks
- Template Inheritance: Implement Template Inheritance Hierarchy
- Blade Testing: Write Assertions for Blade View Rendering
- View Models and Presenters: Implement View Models for Complex Template Data

