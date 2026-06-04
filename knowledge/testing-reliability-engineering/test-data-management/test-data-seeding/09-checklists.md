# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Data Management
**Knowledge Unit:** ** Test Data Seeding (Declarative Factory Methods)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Name Methods to Describe What They Create, Not How
- [ ] Apply rule: Use the `create`/`make` Naming Convention
- [ ] Apply rule: Always Declare Explicit Return Types
- [ ] Apply rule: Limit Parameters to 2-3 Per Method
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Declarative methods use `create` (persisted) and `make` (non-persisted) naming convention
- [ ] Methods have explicit PHP return types
- [ ] Methods are organized in domain-specific traits, not the base test class
- [ ] Each method has 3 or fewer parameters
- [ ] Multi-object methods return named tuples with all created objects
- [ ] Avoid: Over-parameterization
- [ ] Avoid: Methods with hidden global state
- [ ] Avoid: Not using return types

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Method location hierarchy**: Trait > base test class > dedicated factory class. Traits are most flexible.
- **Return convention**: Single model for simple methods. Named array/destructuring for multi-object returns. Avoid returning more than 3-4 objects.
- **Default value philosophy**: Sensible defaults that make tests pass. Override only for test-specific variations.
- **Method discovery**: Use IDE navigation, organized traits, and naming conventions. Consider generating a factory method index.
- **Consistency with factory states**: Declarative methods should use factory states internally, not duplicate state logic.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Name Methods to Describe What They Create, Not How
- [ ] Follow rule: Use the `create`/`make` Naming Convention
- [ ] Follow rule: Always Declare Explicit Return Types
- [ ] Follow rule: Limit Parameters to 2-3 Per Method
- [ ] Follow rule: Return All Created Objects from Multi-Object Methods
- [ ] Follow rule: Organize Methods in Domain-Specific Traits
- [ ] - [ ] Declarative methods use `create` (persisted) and `make` (non-persisted) naming convention
- [ ] - [ ] Methods have explicit PHP return types
- [ ] - [ ] Methods are organized in domain-specific traits, not the base test class
- [ ] - [ ] Each method has 3 or fewer parameters

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Declarative factory methods are custom helper methods that encapsulate complex o...
- [ ] Verify: Name Methods to Describe What They Create, Not How
- [ ] Verify: Use the `create`/`make` Naming Convention
- [ ] Verify: Always Declare Explicit Return Types
- [ ] Verify: Limit Parameters to 2-3 Per Method

# Testing Checklist
- [ ] Declarative methods use `create` (persisted) and `make` (non-persisted) naming convention
- [ ] Methods have explicit PHP return types
- [ ] Methods are organized in domain-specific traits, not the base test class
- [ ] Each method has 3 or fewer parameters
- [ ] Multi-object methods return named tuples with all created objects
- [ ] Methods use deterministic defaults (no `now()`, no Faker)
- [ ] Avoid: Over-parameterization
- [ ] Avoid: Methods with hidden global state
- [ ] Avoid: Not using return types

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Name Methods to Describe What They Create, Not How
- [ ] Apply: Use the `create`/`make` Naming Convention
- [ ] Apply: Always Declare Explicit Return Types
- [ ] Apply: Limit Parameters to 2-3 Per Method

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Over-parameterization
- [ ] Avoid mistake: Methods with hidden global state
- [ ] Avoid mistake: Not using return types
- [ ] Avoid mistake: Too many tiny methods

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
- Name Methods to Describe What They Create, Not How
- Use the `create`/`make` Naming Convention
- Always Declare Explicit Return Types
- Limit Parameters to 2-3 Per Method
- Return All Created Objects from Multi-Object Methods
- Organize Methods in Domain-Specific Traits
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Seed Test Data with Declarative Factory Methods


