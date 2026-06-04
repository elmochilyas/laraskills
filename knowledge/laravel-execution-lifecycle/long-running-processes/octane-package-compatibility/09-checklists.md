# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Octane Package Compatibility
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Run package compatibility scan â€” list all installed packages with their Octane status
- [ ] For each package, examine the service provider for `singleton()` calls
- [ ] Check for static properties using reflection or grep
- [ ] All packages (direct and transitive) enumerated from `composer show --tree`
- [ ] Each package's service provider inspected for `singleton()` with mutable state
- [ ] Vendor code grepped for static property accumulation patterns
- [ ] Audit every installed package for Octane compatibility before deployment. followed
- [ ] Create shim layers over package forks. followed
- [ ] Test packages with â‰¥100 sequential requests. followed
- [ ] Maintain a living package compatibility matrix. followed
- [ ] Re-audit package compatibility after every update. followed
- [ ] Use feature-flag gating for partially compatible packages. followed
- [ ] Test with â‰¥100 sequential requests applied
- [ ] Audit the package's service provider first applied
- [ ] Create shims over forks applied
- [ ] Maintain a package compatibility matrix applied
- [ ] Forking Packages for Octane Compatibility prevented
- [ ] Deploying Without Package Audit prevented
- [ ] Assuming "works in PHP-FPM = works in Octane" prevented
- [ ] Testing with single request prevented

---

# Architecture Checklist

- [ ] Application-side compatibility is the default architecture followed
- [ ] Static property analysis is mandatory architecture followed
- [ ] Shims over forks architecture followed
- [ ] Test-based verification architecture followed

---

# Implementation Checklist

- [ ] Audit every installed package for Octane compatibility before deployment. followed
- [ ] Create shim layers over package forks. followed
- [ ] Test packages with â‰¥100 sequential requests. followed
- [ ] Maintain a living package compatibility matrix. followed
- [ ] Re-audit package compatibility after every update. followed
- [ ] Test with â‰¥100 sequential requests applied
- [ ] Audit the package's service provider first applied
- [ ] Create shims over forks applied
- [ ] Maintain a package compatibility matrix applied
- [ ] Assuming "works in PHP-FPM = works in Octane" prevented
- [ ] Testing with single request prevented
- [ ] Patching vendor directory prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Forking Packages for Octane Compatibility prevented
- [ ] Deploying Without Package Audit prevented
- [ ] One-Time Audit With No Re-Evaluation prevented
- [ ] Blindly Enabling All Package Features prevented
- [ ] Assuming "No Errors" = "Compatible" prevented
- [ ] Audit every installed package for Octane compatibility before deployment. followed
- [ ] Create shim layers over package forks. followed
- [ ] Test packages with â‰¥100 sequential requests. followed
- [ ] Maintain a living package compatibility matrix. followed
- [ ] Re-audit package compatibility after every update. followed
- [ ] Use feature-flag gating for partially compatible packages. followed

---

# Testing Checklist

- [ ] All packages (direct and transitive) enumerated from `composer show --tree`
- [ ] Each package's service provider inspected for `singleton()` with mutable state
- [ ] Vendor code grepped for static property accumulation patterns
- [ ] Sequential 100+ request test passes for each package â€” no data contamination
- [ ] Run package compatibility scan â€” list all installed packages with their Octane status
- [ ] For each package, examine the service provider for `singleton()` calls
- [ ] Check for static properties using reflection or grep
- [ ] Test with 100+ sequential requests â€” compare response outputs for contamination
- [ ] Every installed package has a documented compatibility classification
- [ ] Incompatible packages have application-side shims (not forks)
- [ ] 100+ sequential request test passes for every package without data contamination
- [ ] Compatibility matrix is version-controlled and updated on every package change

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Forking Packages for Octane Compatibility prevented
- [ ] Deploying Without Package Audit prevented
- [ ] One-Time Audit With No Re-Evaluation prevented
- [ ] Blindly Enabling All Package Features prevented
- [ ] Assuming "No Errors" = "Compatible" prevented

---

# Production Readiness Checklist

- [ ] Production readiness reviewed

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- singleton-state-leaks (core pattern to check in packages)
- static-property-accumulation (core pattern to check in packages)
- scoped-bindings-for-octane (remediation for package singletons)
- octane-lifecycle-hooks (RequestTerminated for package cleanup)
- service-binding-audit (audit methodology applied to packages)

---


