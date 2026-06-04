# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Service Binding Audit
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Run binding inventory command â€” list all registered bindings with type and shared status
- [ ] For each singleton, trace its constructor dependencies
- [ ] Identify any dependency that holds mutable per-request state
- [ ] Binding inventory command dumps all registered bindings with type, concrete, and shared status
- [ ] Vendor-provided bindings included in inventory (not just application code)
- [ ] For each singleton, constructor dependency graph traced to 2+ levels
- [ ] Generate an automated binding inventory before every audit. followed
- [ ] Trace the full dependency graph, not just direct bindings. followed
- [ ] Classify bindings into three risk categories. followed
- [ ] Add CI lint rules for new singleton registrations. followed
- [ ] Score and prioritize remediation by risk impact. followed
- [ ] Re-audit after every major package update or quarterly. followed
- [ ] Automate binding inventory generation applied
- [ ] Trace the dependency graph applied
- [ ] Add CI binding lint applied
- [ ] Score and prioritize by risk applied
- [ ] One-Time Audit With No Follow-Up prevented
- [ ] Blind Mass Conversion prevented
- [ ] Auditing only application code prevented
- [ ] Assuming safe = "doesn't store user data" prevented

---

# Architecture Checklist

- [ ] Audit is manual with tooling assistance architecture followed
- [ ] Focus on shared bindings architecture followed
- [ ] Dependency graph analysis is critical architecture followed
- [ ] CI enforcement prevents regression architecture followed

---

# Implementation Checklist

- [ ] Generate an automated binding inventory before every audit. followed
- [ ] Trace the full dependency graph, not just direct bindings. followed
- [ ] Classify bindings into three risk categories. followed
- [ ] Add CI lint rules for new singleton registrations. followed
- [ ] Score and prioritize remediation by risk impact. followed
- [ ] Automate binding inventory generation applied
- [ ] Trace the dependency graph applied
- [ ] Add CI binding lint applied
- [ ] Score and prioritize by risk applied
- [ ] Auditing only application code prevented
- [ ] Assuming safe = "doesn't store user data" prevented
- [ ] Not re-auditing after package updates prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] One-Time Audit With No Follow-Up prevented
- [ ] Blind Mass Conversion prevented
- [ ] Ignoring Transitive Dependencies prevented
- [ ] Skipping Package Audit prevented
- [ ] Auditing Only Application Code prevented
- [ ] Generate an automated binding inventory before every audit. followed
- [ ] Trace the full dependency graph, not just direct bindings. followed
- [ ] Classify bindings into three risk categories. followed
- [ ] Add CI lint rules for new singleton registrations. followed
- [ ] Score and prioritize remediation by risk impact. followed
- [ ] Re-audit after every major package update or quarterly. followed

---

# Testing Checklist

- [ ] Binding inventory command dumps all registered bindings with type, concrete, and shared status
- [ ] Vendor-provided bindings included in inventory (not just application code)
- [ ] For each singleton, constructor dependency graph traced to 2+ levels
- [ ] Each shared binding classified into risk category with documented rationale
- [ ] Run binding inventory command â€” list all registered bindings with type and shared status
- [ ] For each singleton, trace its constructor dependencies
- [ ] Identify any dependency that holds mutable per-request state
- [ ] Score each unsafe binding by risk (data sensitivity, leak frequency, fix difficulty)
- [ ] Binding inventory command produces complete list of all shared bindings including vendor packages
- [ ] Each shared binding has documented risk classification with dependency graph trace
- [ ] CRITICAL bindings are remediated (converted to scoped or redesigned) before Octane deployment
- [ ] CI pipeline blocks PRs introducing new singleton() registrations without human review

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] One-Time Audit With No Follow-Up prevented
- [ ] Blind Mass Conversion prevented
- [ ] Ignoring Transitive Dependencies prevented
- [ ] Skipping Package Audit prevented
- [ ] Auditing Only Application Code prevented

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

- singleton-state-leaks (what the audit detects)
- scoped-bindings-for-octane (primary remediation strategy)
- static-property-accumulation (audit must include static analysis)
- octane-architecture-overview (context for why audit matters)

---


