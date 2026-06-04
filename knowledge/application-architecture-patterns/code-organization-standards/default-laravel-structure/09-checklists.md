# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** Default Laravel directory structure and its design rationale
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use Default Structure for Projects Under 5 Engineers followed
- [ ] Keep `app/` Directory Nesting at 4 Levels Max followed
- [ ] Align Custom Directories with `artisan make:` Conventions followed
- [ ] App Dumping Ground prevented
- [ ] Preemptive Architecture prevented

---

# Architecture Checklist

- [ ] Use Default Structure for Projects Under 5 Engineers followed
- [ ] Keep `app/` Directory Nesting at 4 Levels Max followed
- [ ] Align Custom Directories with `artisan make:` Conventions followed
- [ ] Document All Custom Directory Additions followed
- [ ] Never Expose `vendor/` or `storage/` via Web Server followed

---

# Implementation Checklist

- [ ] Use Default Structure for Projects Under 5 Engineers followed
- [ ] Keep `app/` Directory Nesting at 4 Levels Max followed
- [ ] Align Custom Directories with `artisan make:` Conventions followed
- [ ] Document All Custom Directory Additions followed
- [ ] Never Expose `vendor/` or `storage/` via Web Server followed
- [ ] Use Subdirectories Within Default Directories followed
- [ ] Run `composer dump-autoload -o` in Production Deployments followed
- [ ] Start With Defaults, Evolve With Demonstrated Pain followed
- [ ] Preserve `routes/` Ã¢â€ â€™ `Controllers` Entry Point Pattern followed
- [ ] Workflow step completed: **Verify default structure is intact.** Confirm the project has the standard directories: `app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`, `vendor/`. Check that `App\` namespace maps to `app/` in `composer.json`.
- [ ] Workflow step completed: **Use subdirectories within defaults.** Before adding custom top-level directories, use subdirectories within standard locations. Place API controllers in `app/Http/Controllers/Api/`, admin controllers in `app/Http/Controllers/Admin/` to prevent flat-file dumping grounds.
- [ ] Workflow step completed: **Keep `app/` nesting at 4 levels max.** Limit directory depth under `app/` to 4-5 levels. Avoid paths like `app/Domains/Billing/Subscriptions/Plans/Http/Controllers/Admin/PlanController.php` (7 levels).
- [ ] Workflow step completed: **Align custom additions with `artisan make:` conventions.** When creating custom directories like `app/Services/`, ensure generator commands still place artifacts correctly. Document any stub overrides.
- [ ] Workflow step completed: **Document all custom directory additions.** For every non-default directory, add an entry in README or ARCHITECTURE.md explaining what goes there and why.

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

- [ ] Failure addressed: Flat dumping ground
- [ ] Failure addressed: Fighting framework conventions
- [ ] Failure addressed: Over-organization before pain

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All `artisan make:` commands produce files in expected locations
- [ ] `composer dump-autoload` completes without errors after custom directory additions
- [ ] IDE navigation (Ctrl+click on class names) resolves correctly
- [ ] Production deployment includes optimized autoload (`-o` flag)
- [ ] New developers can find expected artifacts (controllers, models, routes) within 30 seconds
- [ ] Custom directories are documented in README or ARCHITECTURE.md
- [ ] No `vendor/` or `storage/` directories are web-accessible

### Success Criteria
- [ ] The project follows standard Laravel directory conventions recognizable to any Laravel developer.
- [ ] Custom extensions are documented and compatible with framework generators.
- [ ] No single directory contains more than 50 unrelated files.
- [ ] Production autoloading is optimized and secure.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Use Default Structure for Projects Under 5 Engineers followed
- [ ] Keep `app/` Directory Nesting at 4 Levels Max followed
- [ ] Align Custom Directories with `artisan make:` Conventions followed
- [ ] Document All Custom Directory Additions followed
- [ ] Never Expose `vendor/` or `storage/` via Web Server followed
- [ ] Use Subdirectories Within Default Directories followed
- [ ] Run `composer dump-autoload -o` in Production Deployments followed
- [ ] Start With Defaults, Evolve With Demonstrated Pain followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: App Dumping Ground
- [ ] Anti-pattern prevented: Preemptive Architecture
- [ ] Anti-pattern prevented: Framework Fighting
- [ ] Anti-pattern prevented: Flat Controller Accumulation

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Flat dumping ground
- [ ] Failure scenario handled: Fighting framework conventions
- [ ] Failure scenario handled: Over-organization before pain

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
