# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Data Management
**Knowledge Unit:** ** Test Data Factories (States & Sequences)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use Deterministic Values in State Definitions
- [ ] Apply rule: Prefer `->has()` Over `afterCreating` for Test-Specific Relationships
- [ ] Apply rule: Name States as Domain Actions, Not Data States
- [ ] Apply rule: Keep State Definitions in Sync with Schema Changes
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] State methods use deterministic values (no `now()`, `rand()`, `Str::random()`)
- [ ] States are named as domain actions, not getter methods
- [ ] Factory states are documented in the factory class docblock
- [ ] `->has()` is preferred over `afterCreating` for relationships
- [ ] State definitions are in sync with current schema
- [ ] Avoid: Non-deterministic state data
- [ ] Avoid: Overusing afterCreating
- [ ] Avoid: State name collisions

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **State method naming**: Use descriptive names that match domain language: `published()`, `withTeam()`, `verified()`. Avoid `statusX()` or `attributeY()`.
- **State organization**: Group related states in the factory class. Use docblocks to document available states.
- **Sequence callback convention**: Use `fn ($seq) => ['attribute' => "value{$seq->index}"]` for dynamic sequences.
- **Factory class structure**: Base definition â†’ state methods â†’ afterCreating hooks. States reference the base definition.
- **State compatibility**: Ensure states that override the same attribute are not used together accidentally.
- **Factory type resolution**: Laravel resolves factory by model class. Custom resolution via `newModel()` for non-standard models.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use Deterministic Values in State Definitions
- [ ] Follow rule: Prefer `->has()` Over `afterCreating` for Test-Specific Relationships
- [ ] Follow rule: Name States as Domain Actions, Not Data States
- [ ] Follow rule: Keep State Definitions in Sync with Schema Changes
- [ ] Follow rule: Use Sequence Callbacks with `$seq->index` for Dynamic Attributes
- [ ] Follow rule: Document Attribute Precedence
- [ ] - [ ] State methods use deterministic values (no `now()`, `rand()`, `Str::random()`)
- [ ] - [ ] States are named as domain actions, not getter methods
- [ ] - [ ] Factory states are documented in the factory class docblock
- [ ] - [ ] `->has()` is preferred over `afterCreating` for relationships

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Factory states and sequences are Laravel model factory features that enable conc...
- [ ] Verify: Use Deterministic Values in State Definitions
- [ ] Verify: Prefer `->has()` Over `afterCreating` for Test-Specific Relationships
- [ ] Verify: Name States as Domain Actions, Not Data States
- [ ] Verify: Keep State Definitions in Sync with Schema Changes

# Testing Checklist
- [ ] State methods use deterministic values (no `now()`, `rand()`, `Str::random()`)
- [ ] States are named as domain actions, not getter methods
- [ ] Factory states are documented in the factory class docblock
- [ ] `->has()` is preferred over `afterCreating` for relationships
- [ ] State definitions are in sync with current schema
- [ ] Attribute precedence is understood and documented
- [ ] Avoid: Non-deterministic state data
- [ ] Avoid: Overusing afterCreating
- [ ] Avoid: State name collisions

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use Deterministic Values in State Definitions
- [ ] Apply: Prefer `->has()` Over `afterCreating` for Test-Specific Relationships
- [ ] Apply: Name States as Domain Actions, Not Data States
- [ ] Apply: Keep State Definitions in Sync with Schema Changes

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Non-deterministic state data
- [ ] Avoid mistake: Overusing afterCreating
- [ ] Avoid mistake: State name collisions
- [ ] Avoid mistake: Sequence wrapping assumption

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Use Deterministic Values in State Definitions
- Prefer `->has()` Over `afterCreating` for Test-Specific Relationships
- Name States as Domain Actions, Not Data States
- Keep State Definitions in Sync with Schema Changes
- Use Sequence Callbacks with `$seq->index` for Dynamic Attributes
- Document Attribute Precedence
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Create Models with Factory States and Sequences


