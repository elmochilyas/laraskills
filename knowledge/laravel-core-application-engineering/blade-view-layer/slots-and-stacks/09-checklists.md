# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Slots and Stacks
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use Stacks for Assets, Sections for Content
- [ ] Enforce: Always Use `@once` for Component Stack Pushes
- [ ] Enforce: Standardize Stack Names Across All Layouts
- [ ] Enforce: Always Provide Slot Defaults with the `??` Operator
- [ ] Enforce: Never Create Slot and Prop with the Same Name
- [ ] Enforce: Use `@prepend` for Content That Must Come Before Existing Stack Content
- [ ] Default slot renders content between component tags
- [ ] Named slots render in correct component positions with fallback defaults
- [ ] `@push('scripts')` content appears at `@stack('scripts')` in layout
- [ ] `@prepend` content appears before `@push` content in the same stack
- [ ] `@once` prevents duplicate stack content on multiple component instances
- [ ] Slot default (via `??`) renders when consumer omits the slot
- [ ] No stack name mismatches between push and stack directives
- [ ] `{{ $slot }}` present in all components except those intentionally discarding content

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Standard Stack Names
- [ ] Architecture guideline: @stack('styles')        {{-- CSS link tags --}}
- [ ] Architecture guideline: @stack('head-scripts')  {{-- Scripts in <head> --}}
- [ ] Architecture guideline: @stack('modals')        {{-- Modal dialog containers --}}
- [ ] Architecture guideline: @stack('scripts')       {{-- Body scripts --}}
- [ ] Architecture guideline: ### Slot vs @yield Decision
- [ ] Architecture guideline: ### Deduplication Pattern
- [ ] Architecture guideline: @push('scripts')
- [ ] Architecture guideline: <script src="/js/dropdown.js"></script>
- [ ] Decision: Slots (Component) vs @yield (Layout Inheritance) - ensure correct choice is made
- [ ] Decision: Single Named Slot vs Multiple Named Slots - ensure correct choice is made
- [ ] Decision: @push vs @prepend for Stack Injection Order - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use Stacks for Assets, Sections for Content
- [ ] Apply rule: Always Use `@once` for Component Stack Pushes
- [ ] Apply rule: Standardize Stack Names Across All Layouts
- [ ] Apply rule: Always Provide Slot Defaults with the `??` Operator
- [ ] Apply rule: Never Create Slot and Prop with the Same Name
- [ ] Apply rule: Use `@prepend` for Content That Must Come Before Existing Stack Content
- [ ] Skill applied: Implement Content Injection with Slots and Stacks

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
- [ ] Default slot renders content between component tags
- [ ] Named slots render in correct component positions with fallback defaults
- [ ] `@push('scripts')` content appears at `@stack('scripts')` in layout
- [ ] `@prepend` content appears before `@push` content in the same stack
- [ ] `@once` prevents duplicate stack content on multiple component instances
- [ ] Slot default (via `??`) renders when consumer omits the slot
- [ ] No stack name mismatches between push and stack directives

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Using Sections for Assets -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing `@once` Guard on Component Stack Pushes -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Inconsistent Stack Names Across Layouts -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing Slot Defaults -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Prop and Slot with the Same Name -- apply preferred alternative
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
- Use Stacks for Assets, Sections for Content
- Always Use `@once` for Component Stack Pushes
- Standardize Stack Names Across All Layouts
- Always Provide Slot Defaults with the `??` Operator
- Never Create Slot and Prop with the Same Name
- Use `@prepend` for Content That Must Come Before Existing Stack Content
### Skills (from 06)
- Implement Content Injection with Slots and Stacks
### Decision Trees (from 07)
- Slots (Component) vs @yield (Layout Inheritance)
- Single Named Slot vs Multiple Named Slots
- @push vs @prepend for Stack Injection Order
### Anti-Patterns (from 08)
- Using Sections for Assets
- Missing `@once` Guard on Component Stack Pushes
- Inconsistent Stack Names Across Layouts
- Missing Slot Defaults
- Prop and Slot with the Same Name
### Related Rules (from 06 skills)
- slots-and-stacks/05-rules.md: Use Stacks for Assets, Sections for Content
- slots-and-stacks/05-rules.md: Always Use `@once` for Component Stack Pushes
- slots-and-stacks/05-rules.md: Standardize Stack Names Across All Layouts
- slots-and-stacks/05-rules.md: Always Provide Slot Defaults with the `??` Operator
- slots-and-stacks/05-rules.md: Never Create Slot and Prop with the Same Name
- slots-and-stacks/05-rules.md: Use `@prepend` for Content That Must Come Before Existing Stack Content
### Related Skills (from 06 skills)
- Component System: Create and Use Blade Components
- Template Inheritance: Implement Template Inheritance Hierarchy
- Layout Strategies: Implement Multi-Layout Strategy
- Blade with Alpine: Integrate Alpine.js with Blade Templates for Client-Side Interactivity

