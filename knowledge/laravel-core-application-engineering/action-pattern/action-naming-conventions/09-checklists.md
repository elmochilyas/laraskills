# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action Naming Conventions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Choose One Naming Convention and Apply It Consistently
- [ ] Enforce: Use Domain Subdirectories Before Changing Naming Conventions
- [ ] Enforce: Match Method Name to Class Intent
- [ ] Enforce: Document the Naming Convention Decision Explicitly
- [ ] Enforce: Prefer VerbNoun as Default, Switch to NounVerb Only for Entity-Heavy Domains
- [ ] Enforce: Use ActionSuffix Only When Necessary to Avoid Name Collisions
- [ ] A single naming convention is chosen (VerbNoun, NounVerb, ActionSuffix, or DescriptiveMethod)
- [ ] The convention is documented in a project-level architecture decision record
- [ ] All existing action names are consistent with the chosen convention
- [ ] A single method name is chosen for all actions (`handle()`, `execute()`, or `__invoke()`)
- [ ] Domain subdirectory plan is documented (threshold for introducing subdirectories)
- [ ] Pest architecture tests enforce the naming convention
- [ ] No mixed conventions exist in the codebase (the most destructive anti-pattern)
- [ ] Method names match class intent (no `CreateOrder` with method `process()`)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Flat VerbNoun directory structure** is acceptable for < 30 actions. Beyond that, add domain s...
- [ ] Architecture guideline: - **Domain subdirectories** should mirror the application's bounded contexts: `app/Actions/User/`...
- [ ] Architecture guideline: - **Action class naming is PSR-4 compliant** â€” the class name determines the filename. `CreateO...
- [ ] Architecture guideline: - **Renaming convention is a breaking change** â€” switching from VerbNoun to NounVerb after 50+ ...
- [ ] Architecture guideline: - **IDE navigation** benefits from NounVerb for entity-heavy domains (all Order operations adjace...
- [ ] Architecture guideline: - **ActionSuffix** is redundant with the `App\Actions` namespace but provides visual clarity in i...
- [ ] Architecture guideline: - **Jetstream compatibility** extends only to projects that use Jetstream scaffolding. Teams exte...
- [ ] Decision: VerbNoun vs NounVerb Naming Convention - ensure correct choice is made
- [ ] Decision: ActionSuffix vs No Suffix - ensure correct choice is made
- [ ] Decision: Method Name Convention for Actions - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Choose One Naming Convention and Apply It Consistently
- [ ] Apply rule: Use Domain Subdirectories Before Changing Naming Conventions
- [ ] Apply rule: Match Method Name to Class Intent
- [ ] Apply rule: Document the Naming Convention Decision Explicitly
- [ ] Apply rule: Prefer VerbNoun as Default, Switch to NounVerb Only for Entity-Heavy Domains
- [ ] Apply rule: Use ActionSuffix Only When Necessary to Avoid Name Collisions
- [ ] Skill applied: Choose and Document a Naming Convention
- [ ] Skill applied: Introduce Domain Subdirectories to a Flat Action Directory

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
- [ ] A single naming convention is chosen (VerbNoun, NounVerb, ActionSuffix, or DescriptiveMethod)
- [ ] The convention is documented in a project-level architecture decision record
- [ ] All existing action names are consistent with the chosen convention
- [ ] A single method name is chosen for all actions (`handle()`, `execute()`, or `__invoke()`)
- [ ] Domain subdirectory plan is documented (threshold for introducing subdirectories)
- [ ] Pest architecture tests enforce the naming convention
- [ ] No mixed conventions exist in the codebase (the most destructive anti-pattern)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Mixed Naming Conventions -- apply preferred alternative
    - [ ] List all action classes â€” count how many follow each convention
    - [ ] Verify no more than one convention is present
- [ ] Prevent: Flat Action Directory at Scale (No Domain Grouping) -- apply preferred alternative
    - [ ] Count files in `app/Actions/` (threshold: 20)
    - [ ] Check if any domain has 10+ actions that need grouping
- [ ] Prevent: Method Name Mismatch with Class Intent -- apply preferred alternative
    - [ ] Check if method names are consistent across all actions
    - [ ] Check if any method name contradicts the class name
- [ ] Prevent: Redundant ActionSuffix in Dedicated Namespace -- apply preferred alternative
    - [ ] Check if any suffix is redundant given the namespace
    - [ ] Verify no naming collisions exist after stripping the suffix
- [ ] Prevent: Convention Chosen Without Considering Future Scale -- apply preferred alternative
    - [ ] Does the codebase have >20 flat action files?
    - [ ] Is the team considering a naming convention change instead of subdirectories?

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
- Choose One Naming Convention and Apply It Consistently
- Use Domain Subdirectories Before Changing Naming Conventions
- Match Method Name to Class Intent
- Document the Naming Convention Decision Explicitly
- Prefer VerbNoun as Default, Switch to NounVerb Only for Entity-Heavy Domains
- Use ActionSuffix Only When Necessary to Avoid Name Collisions
### Skills (from 06)
- Choose and Document a Naming Convention
- Introduce Domain Subdirectories to a Flat Action Directory
### Decision Trees (from 07)
- VerbNoun vs NounVerb Naming Convention
- ActionSuffix vs No Suffix
- Method Name Convention for Actions
### Anti-Patterns (from 08)
- Mixed Naming Conventions
- Flat Action Directory at Scale (No Domain Grouping)
- Method Name Mismatch with Class Intent
- Redundant ActionSuffix in Dedicated Namespace
- Convention Chosen Without Considering Future Scale
### Related Rules (from 06 skills)
- Rule: Choose One Naming Convention and Apply It Consistently (action-naming-conventions/05-rules.md)
- Rule: Use Domain Subdirectories Before Changing Naming Conventions (action-naming-conventions/05-rules.md)
- Rule: Match Method Name to Class Intent (action-naming-conventions/05-rules.md)
- Rule: Document the Naming Convention Decision Explicitly (action-naming-conventions/05-rules.md)
- Rule: Prefer VerbNoun as Default (action-naming-conventions/05-rules.md)
- Rule: Use ActionSuffix Only When Necessary (action-naming-conventions/05-rules.md)
### Related Skills (from 06 skills)
- Introduce Domain Subdirectories to a Flat Action Directory (action-naming-conventions/06-skills.md)
- Extract Controller Logic to an Action (action-class-design/06-skills.md)

