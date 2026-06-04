# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Blade Fragments
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Return Full Page on First Request, Fragment on Subsequent
- [ ] Enforce: Match Fragment Wrapper ID to Fragment Name
- [ ] Enforce: Do Not Nest Fragments
- [ ] Enforce: Always Serve Full-Page HTML to Bots
- [ ] Enforce: Cache Fragment Responses Separately from Full-Page Responses
- [ ] Enforce: Do Not Use Fragments for Interactive Stateful Components
- [ ] Enforce: Use Unique Fragment Names Per View
- [ ] Enforce: Do Not Use Fragments for SEO-Critical Content
- [ ] First page load returns full HTML with layout (head, navigation, footer)
- [ ] Subsequent fragment requests return only the fragment HTML
- [ ] Fragment wrapper element has a consistent DOM ID matching the client target
- [ ] No `@fragment` block is nested inside another `@fragment` block
- [ ] Each fragment name is unique within the view
- [ ] Bot user agents receive full-page HTML, never fragments
- [ ] Fragment and full-page responses use separate cache keys
- [ ] Authorization and middleware still apply to fragment requests

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Fragment vs Livewire
- [ ] Architecture guideline: ### Fragment vs Inertia Partial Reload
- [ ] Architecture guideline: ### Conditional Fragment Pattern
- [ ] Architecture guideline: public function index(Request $request): View
- [ ] Architecture guideline: $view = view('users.index', ['users' => User::paginate()]);
- [ ] Architecture guideline: return $request->header('Turbo-Frame')
- [ ] Architecture guideline: ? $view->fragment('content')
- [ ] Decision: Fragment vs Livewire for Partial Updates - ensure correct choice is made
- [ ] Decision: Fragment Response Caching Strategy - ensure correct choice is made
- [ ] Decision: Fragment Name and ID Convention - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Return Full Page on First Request, Fragment on Subsequent
- [ ] Apply rule: Match Fragment Wrapper ID to Fragment Name
- [ ] Apply rule: Do Not Nest Fragments
- [ ] Apply rule: Always Serve Full-Page HTML to Bots
- [ ] Apply rule: Cache Fragment Responses Separately from Full-Page Responses
- [ ] Apply rule: Do Not Use Fragments for Interactive Stateful Components
- [ ] Apply rule: Use Unique Fragment Names Per View
- [ ] Apply rule: Do Not Use Fragments for SEO-Critical Content
- [ ] Skill applied: Implement Blade Fragment Responses for Turbo/HTMX Navigation

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
- [ ] First page load returns full HTML with layout (head, navigation, footer)
- [ ] Subsequent fragment requests return only the fragment HTML
- [ ] Fragment wrapper element has a consistent DOM ID matching the client target
- [ ] No `@fragment` block is nested inside another `@fragment` block
- [ ] Each fragment name is unique within the view
- [ ] Bot user agents receive full-page HTML, never fragments
- [ ] Fragment and full-page responses use separate cache keys

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Fragment-Only Response on Initial Page Load -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Stateful Interactive UI via Fragments -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing DOM ID on Fragment Wrapper -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Nested Fragments -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Duplicate Fragment Names in the Same View -- apply preferred alternative
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
- Return Full Page on First Request, Fragment on Subsequent
- Match Fragment Wrapper ID to Fragment Name
- Do Not Nest Fragments
- Always Serve Full-Page HTML to Bots
- Cache Fragment Responses Separately from Full-Page Responses
- Do Not Use Fragments for Interactive Stateful Components
- Use Unique Fragment Names Per View
- Do Not Use Fragments for SEO-Critical Content
### Skills (from 06)
- Implement Blade Fragment Responses for Turbo/HTMX Navigation
### Decision Trees (from 07)
- Fragment vs Livewire for Partial Updates
- Fragment Response Caching Strategy
- Fragment Name and ID Convention
### Anti-Patterns (from 08)
- Fragment-Only Response on Initial Page Load
- Stateful Interactive UI via Fragments
- Missing DOM ID on Fragment Wrapper
- Nested Fragments
- Duplicate Fragment Names in the Same View
### Related Rules (from 06 skills)
- blade-fragments/05-rules.md: Return Full Page on First Request, Fragment on Subsequent
- blade-fragments/05-rules.md: Match Fragment Wrapper ID to Fragment Name
- blade-fragments/05-rules.md: Do Not Nest Fragments
- blade-fragments/05-rules.md: Always Serve Full-Page HTML to Bots
- blade-fragments/05-rules.md: Cache Fragment Responses Separately from Full-Page Responses
- blade-fragments/05-rules.md: Use Unique Fragment Names Per View
### Related Skills (from 06 skills)
- Component System: Create and Use Blade Components
- Template Inheritance: Implement Template Inheritance Hierarchy
- Rendering Performance: Profile and Optimize Slow View Rendering
- Layout Strategies: Implement Multi-Layout Strategy

