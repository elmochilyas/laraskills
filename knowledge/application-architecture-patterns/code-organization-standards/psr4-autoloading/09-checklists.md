# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** PSR-4 autoloading configuration for custom directories
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Run `composer dump-autoload` After Every PSR-4 Mapping Change followed
- [ ] Never Create Overlapping PSR-4 Roots followed
- [ ] Keep Namespace Case Consistent with Directory Case followed
- [ ] Overlapping PSR-4 Roots prevented
- [ ] Forgotten dump-autoload prevented

---

# Architecture Checklist

- [ ] Run `composer dump-autoload` After Every PSR-4 Mapping Change followed
- [ ] Never Create Overlapping PSR-4 Roots followed
- [ ] Keep Namespace Case Consistent with Directory Case followed
- [ ] Use `autoload-dev` for Test Infrastructure Separately followed
- [ ] Avoid Unnecessary Multiple PSR-4 Roots followed

---

# Implementation Checklist

- [ ] Run `composer dump-autoload` After Every PSR-4 Mapping Change followed
- [ ] Never Create Overlapping PSR-4 Roots followed
- [ ] Keep Namespace Case Consistent with Directory Case followed
- [ ] Use `autoload-dev` for Test Infrastructure Separately followed
- [ ] Avoid Unnecessary Multiple PSR-4 Roots followed
- [ ] Keep Custom PSR-4 Mappings Stable After Release followed
- [ ] Document All Custom PSR-4 Mappings in Project README followed
- [ ] Use `composer dump-autoload -o` in Production for Optimized Class Maps followed
- [ ] Workflow step completed: **Determine namespace prefix and directory.** Choose a unique namespace prefix that does not overlap with existing roots. For domain-based structure: `"Domains\\": "app/Domains/"`. For modules: `"Modules\\": "modules/"`.
- [ ] Workflow step completed: **Add the PSR-4 entry in `composer.json`.** Insert the mapping under `autoload.psr-4`. Ensure the namespace prefix ends with `\\` and the directory path ends with `/`.
- [ ] Workflow step completed: **Verify no overlapping roots.** Confirm the new prefix does not overlap with any existing prefix. `App\Domains\` overlaps with `App\` because classes under `App\Domains\` could resolve through either root.
- [ ] Workflow step completed: **Run `composer dump-autoload`.** Always regenerate the autoloader after any PSR-4 mapping change. Skipping this step produces "class not found" errors.
- [ ] Workflow step completed: **Use `autoload-dev` for test infrastructure.** Place test factories, support classes, and test helpers under `autoload-dev` to exclude them from production class maps.

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

- [ ] Failure addressed: Forgetting `composer dump-autoload`
- [ ] Failure addressed: Mismatched namespace and directory:
- [ ] Failure addressed: Case sensitivity issues on Linux:
- [ ] Failure addressed: Overlapping prefixes:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] `composer dump-autoload` completes after all PSR-4 mapping changes
- [ ] All custom namespace prefixes resolve to correct files
- [ ] Production deployment script includes `composer dump-autoload -o`
- [ ] No overlapping PSR-4 roots exist
- [ ] New developer can identify namespace-to-directory mapping from project documentation
- [ ] Test infrastructure is under `autoload-dev`, not `autoload`
- [ ] All namespace segments use PascalCase matching directory case

### Success Criteria
- [ ] All custom namespace prefixes resolve correctly.
- [ ] Production class map is optimized Ã¢â‚¬â€ no unnecessary autoloading overhead.
- [ ] Team can identify namespace-to-directory mapping from documentation.
- [ ] No "class not found" errors related to PSR-4 configuration.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Run `composer dump-autoload` After Every PSR-4 Mapping Change followed
- [ ] Never Create Overlapping PSR-4 Roots followed
- [ ] Keep Namespace Case Consistent with Directory Case followed
- [ ] Use `autoload-dev` for Test Infrastructure Separately followed
- [ ] Avoid Unnecessary Multiple PSR-4 Roots followed
- [ ] Keep Custom PSR-4 Mappings Stable After Release followed
- [ ] Document All Custom PSR-4 Mappings in Project README followed
- [ ] Use `composer dump-autoload -o` in Production for Optimized Class Maps followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Overlapping PSR-4 Roots
- [ ] Anti-pattern prevented: Forgotten dump-autoload
- [ ] Anti-pattern prevented: Case Sensitivity Mismatch
- [ ] Anti-pattern prevented: autoload-dev Neglect
- [ ] Anti-pattern prevented: Unnecessary Multiple Roots

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Forgetting `composer dump-autoload`
- [ ] Failure scenario handled: Mismatched namespace and directory:
- [ ] Failure scenario handled: Case sensitivity issues on Linux:

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
