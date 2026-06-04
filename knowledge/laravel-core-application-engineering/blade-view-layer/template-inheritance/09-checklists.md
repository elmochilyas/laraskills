# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Template Inheritance
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Cap Inheritance Depth at 3 Levels
- [ ] Enforce: Always Yield `title`, `content`, `styles`, and `scripts`
- [ ] Enforce: Provide Default Values for All `@yield` Directives
- [ ] Enforce: Keep Layouts to HTML Shell Only â€” No Business Logic
- [ ] Enforce: `@extends` Must Be the First Directive in the File
- [ ] Enforce: Do Not Use Conditional `@extends` in Templates
- [ ] Enforce: Use `@parent` Only When Parent Section Content Exists
- [ ] Layout renders with child's content injected at `@yield` points
- [ ] `@parent` correctly preserves parent section content when parent defines it
- [ ] `@stack('scripts')` outputs pushed content from child and components
- [ ] Default yield values appear when child omits the section
- [ ] No unclosed `@section` or `@push` directives exist
- [ ] Layout inheritance depth does not exceed 3 levels
- [ ] `@extends` is the first directive in every child template
- [ ] Compiled view cache clears and regenerates on template change

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Minimum Layout Components
- [ ] Architecture guideline: - `title` â€” Page title (with app name default)
- [ ] Architecture guideline: - `styles` or `head` â€” CSS/link tags
- [ ] Architecture guideline: - `content` or `body` â€” Primary content area
- [ ] Architecture guideline: - `scripts` â€” Footer JavaScript stacks
- [ ] Architecture guideline: ### Three-Level Inheritance Structure
- [ ] Architecture guideline: base.blade.php          â†’ HTML shell, <head>, <body>
- [ ] Architecture guideline: â”œâ”€â”€ layouts/
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ admin.blade.php â†’ Admin layout (sidebar, admin header)
- [ ] Architecture guideline: â”‚   â””â”€â”€ public.blade.php â†’ Public layout (nav, footer)
- [ ] Architecture guideline: â”‚       â””â”€â”€ pages/
- [ ] Architecture guideline: â”‚           â””â”€â”€ about.blade.php â†’ extends layouts.public

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Cap Inheritance Depth at 3 Levels
- [ ] Apply rule: Always Yield `title`, `content`, `styles`, and `scripts`
- [ ] Apply rule: Provide Default Values for All `@yield` Directives
- [ ] Apply rule: Keep Layouts to HTML Shell Only â€” No Business Logic
- [ ] Apply rule: `@extends` Must Be the First Directive in the File
- [ ] Apply rule: Do Not Use Conditional `@extends` in Templates
- [ ] Apply rule: Use `@parent` Only When Parent Section Content Exists
- [ ] Skill applied: Implement Template Inheritance Hierarchy

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
- [ ] Layout renders with child's content injected at `@yield` points
- [ ] `@parent` correctly preserves parent section content when parent defines it
- [ ] `@stack('scripts')` outputs pushed content from child and components
- [ ] Default yield values appear when child omits the section
- [ ] No unclosed `@section` or `@push` directives exist
- [ ] Layout inheritance depth does not exceed 3 levels
- [ ] `@extends` is the first directive in every child template

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Whitespace or Content Before `@extends` -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Conditional `@extends` in Templates -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Deep Inheritance Beyond 3 Levels -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Layouts with Business Logic and Database Queries -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing Default Values on `@yield` Directives -- apply preferred alternative
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
- Cap Inheritance Depth at 3 Levels
- Always Yield `title`, `content`, `styles`, and `scripts`
- Provide Default Values for All `@yield` Directives
- Keep Layouts to HTML Shell Only â€” No Business Logic
- `@extends` Must Be the First Directive in the File
- Do Not Use Conditional `@extends` in Templates
- Use `@parent` Only When Parent Section Content Exists
### Skills (from 06)
- Implement Template Inheritance Hierarchy
### Decision Trees (from 07)
- Inheritance vs Component Composition for View Structure
- Layout Selection Strategy (Controller vs Template)
- Section vs Stack for Content Injection
### Anti-Patterns (from 08)
- Whitespace or Content Before `@extends`
- Conditional `@extends` in Templates
- Deep Inheritance Beyond 3 Levels
- Layouts with Business Logic and Database Queries
- Missing Default Values on `@yield` Directives
### Related Rules (from 06 skills)
- template-inheritance/05-rules.md: Cap Inheritance Depth at 3 Levels
- template-inheritance/05-rules.md: Always Yield `title`, `content`, `styles`, and `scripts`
- template-inheritance/05-rules.md: Provide Default Values for All `@yield` Directives
- template-inheritance/05-rules.md: Keep Layouts to HTML Shell Only â€” No Business Logic
- template-inheritance/05-rules.md: `@extends` Must Be the First Directive in the File
- template-inheritance/05-rules.md: Do Not Use Conditional `@extends` in Templates
- template-inheritance/05-rules.md: Use `@parent` Only When Parent Section Content Exists
### Related Skills (from 06 skills)
- Layout Strategies: Implement Multi-Layout Strategy for Application Sections
- Slots and Stacks: Implement Content Injection with Slots and Stacks
- Component System: Create and Use Blade Components
- Rendering Performance: Profile and Optimize Slow View Rendering

