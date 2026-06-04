# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-05-psr4-multi-layer
**Generated:** 2026-06-03
**Based on:** 06
**Note:** Generated from partial input (missing: 04-standardized-knowledge.md, 05-rules.md, 07-decision-trees.md, 08-anti-patterns.md)

---

# Quick Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Production readiness verified

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Define PSR-4 namespace-to-directory mappings.** Add entries in `composer.json` `"autoload"` `"psr-4"` section. Use the pattern: `"App\\Domain\\" => "src/Domain/", "App\\Application\\" => "src/Application/"`. Each layer's namespace root maps to its own directory.
- [ ] Workflow step completed: **Keep Presentation and Infrastructure under existing App namespace if desired.** Add separate PSR-4 roots only where strict boundary enforcement matters most. Presentation and Infrastructure can share `App\\` if appropriate.
- [ ] Workflow step completed: **Run `composer dump-autoload`.** Regenerate the autoloader after every change to `composer.json` mappings.
- [ ] Workflow step completed: **Create a starter class file in each namespace root.** This verifies autoloading works and establishes the pattern for each layer.
- [ ] Workflow step completed: **Verify autoloading with `composer dump-autoload -o` (optimized).** Run the optimized autoloader dump. Confirm classes autoload without errors by instantiating a test class from each layer.

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure addressed: Overlapping namespace roots.
- [ ] Failure addressed: Missing trailing backslash.
- [ ] Failure addressed: Case sensitivity mismatches.
- [ ] Failure addressed: Forgetting `composer dump-autoload` after changes.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] `composer.json` has separate PSR-4 entries for each layer that needs namespace isolation
- [ ] `composer dump-autoload` completes without errors
- [ ] A test class in each layer's namespace root can be instantiated
- [ ] Optimized autoloader (`-o`) works correctly
- [ ] No directory serves two PSR-4 roots (duplicate mapping)
- [ ] Directory structure matches namespace hierarchy
- [ ] `vendor/composer/autoload_psr4.php` contains the expected entries
- [ ] Octane/performance sensitive projects use `-o` flag

### Success Criteria
- [ ] Each architecture layer has its own PSR-4 namespace root in `composer.json`.
- [ ] `composer dump-autoload -o` runs without errors.
- [ ] Classes in each namespace autoload correctly.
- [ ] Use statements clearly show layer of origin.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] No known anti-patterns for this KU

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Overlapping namespace roots.
- [ ] Failure scenario handled: Missing trailing backslash.
- [ ] Failure scenario handled: Case sensitivity mismatches.

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
