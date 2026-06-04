# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Layout Strategies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Create a New Layout for Each Application Section with Different Navigation
- [ ] Enforce: Cap Layout Inheritance Depth at 3 Levels
- [ ] Enforce: Select Layouts in Controllers, Not Templates
- [ ] Enforce: Consistent Yield and Stack Points Across All Layouts
- [ ] Enforce: Use a Base Layout for the Shared HTML Shell
- [ ] Enforce: Load Section-Specific Assets per Layout
- [ ] Each application section has its own layout with section-specific navigation
- [ ] Layout inheritance depth does not exceed 3 levels
- [ ] All layouts support consistent yield/stack points (title, content, styles, scripts)
- [ ] Each layout loads only its section-specific assets (no cross-contamination)
- [ ] Layout selection is done in the controller, not in the template
- [ ] Base layout contains only shared HTML shell (no section-specific logic)
- [ ] Navigation isolation verified: admin pages don't leak public nav and vice versa
- [ ] Adding a new section requires creating a new layout, not adding conditionals to an existing one

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Layout Count by App Complexity
- [ ] Architecture guideline: ### When to Add a Layout
- [ ] Architecture guideline: A new layout is warranted when a section has:
- [ ] Architecture guideline: - Different navigation structure
- [ ] Architecture guideline: - Different sidebar/widget layout
- [ ] Architecture guideline: - Different asset bundles
- [ ] Architecture guideline: - Different footer content
- [ ] Architecture guideline: ### Directory Organization
- [ ] Architecture guideline: â”œâ”€â”€ layouts/
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ base.blade.php       # HTML shell (shared by all)
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ public.blade.php     # Extends base, public nav
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ admin.blade.php      # Extends base, admin sidebar

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Create a New Layout for Each Application Section with Different Navigation
- [ ] Apply rule: Cap Layout Inheritance Depth at 3 Levels
- [ ] Apply rule: Select Layouts in Controllers, Not Templates
- [ ] Apply rule: Consistent Yield and Stack Points Across All Layouts
- [ ] Apply rule: Use a Base Layout for the Shared HTML Shell
- [ ] Apply rule: Load Section-Specific Assets per Layout
- [ ] Skill applied: Implement Multi-Layout Strategy for Application Sections

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
- [ ] Each application section has its own layout with section-specific navigation
- [ ] Layout inheritance depth does not exceed 3 levels
- [ ] All layouts support consistent yield/stack points (title, content, styles, scripts)
- [ ] Each layout loads only its section-specific assets (no cross-contamination)
- [ ] Layout selection is done in the controller, not in the template
- [ ] Base layout contains only shared HTML shell (no section-specific logic)
- [ ] Navigation isolation verified: admin pages don't leak public nav and vice versa

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Single Layout with Excessive Conditionals -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Layout Inheritance Beyond 3 Levels -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Conditional `@extends` in Templates -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: All Assets Loaded in Base Layout -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Inconsistent Yield/Stack Names Across Layouts -- apply preferred alternative
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
- Create a New Layout for Each Application Section with Different Navigation
- Cap Layout Inheritance Depth at 3 Levels
- Select Layouts in Controllers, Not Templates
- Consistent Yield and Stack Points Across All Layouts
- Use a Base Layout for the Shared HTML Shell
- Load Section-Specific Assets per Layout
### Skills (from 06)
- Implement Multi-Layout Strategy for Application Sections
### Decision Trees (from 07)
- Single vs Multi-Layout Strategy
- Base Layout vs Standalone Section Layouts
- Section-Specific Asset Loading Strategy
### Anti-Patterns (from 08)
- Single Layout with Excessive Conditionals
- Layout Inheritance Beyond 3 Levels
- Conditional `@extends` in Templates
- All Assets Loaded in Base Layout
- Inconsistent Yield/Stack Names Across Layouts
### Related Rules (from 06 skills)
- layout-strategies/05-rules.md: Create a New Layout for Each Application Section with Different Navigation
- layout-strategies/05-rules.md: Cap Layout Inheritance Depth at 3 Levels
- layout-strategies/05-rules.md: Select Layouts in Controllers, Not Templates
- layout-strategies/05-rules.md: Consistent Yield and Stack Points Across All Layouts
- layout-strategies/05-rules.md: Use a Base Layout for the Shared HTML Shell
- layout-strategies/05-rules.md: Load Section-Specific Assets per Layout
### Related Skills (from 06 skills)
- Template Inheritance: Implement Template Inheritance Hierarchy
- Slots and Stacks: Implement Content Injection with Slots and Stacks
- Component System: Create and Use Blade Components
- View Composers and Creators: Implement View Composers for Shared Data

