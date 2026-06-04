# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** Feature-based naming conventions for classes and files
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use Verb-Noun Pattern for Action Classes followed
- [ ] Use Past-Tense for Event Classes followed
- [ ] Use {Domain}Service for Service Names followed
- [ ] Generic Suffix Abuse prevented
- [ ] Inconsistent Suffix Usage prevented

---

# Architecture Checklist

- [ ] Use Verb-Noun Pattern for Action Classes followed
- [ ] Use Past-Tense for Event Classes followed
- [ ] Use {Domain}Service for Service Names followed
- [ ] Never Use `Manager`, `Helper`, `Handler`, or `Processor` as Suffixes followed
- [ ] Use Singular for Service and Model Names followed

---

# Implementation Checklist

- [ ] Use Verb-Noun Pattern for Action Classes followed
- [ ] Use Past-Tense for Event Classes followed
- [ ] Use {Domain}Service for Service Names followed
- [ ] Never Use `Manager`, `Helper`, `Handler`, or `Processor` as Suffixes followed
- [ ] Use Singular for Service and Model Names followed
- [ ] Use Noun+Data or Noun+Dto for Data Transfer Objects followed
- [ ] Ensure File Name Matches Class Name Exactly followed
- [ ] Document Naming Conventions in Team Documentation followed
- [ ] Workflow step completed: **Use Verb-Noun pattern for action classes.** Name actions as `CreateInvoice`, `ProcessRefund`, `SendWelcomeEmail`. The name communicates both the operation (Verb) and the subject (Noun). Avoid suffixes like `Action` Ã¢â‚¬â€ they're redundant.
- [ ] Workflow step completed: **Use past-tense for event classes.** Name events as `UserRegistered`, `OrderShipped`, `PaymentFailed`. Past tense communicates that the event describes something that already happened, distinguishing events from commands.
- [ ] Workflow step completed: **Use {Domain}Service for service names.** Name services with a domain or entity qualifier: `PaymentService`, `UserService`, `BillingService`. Never name a service just `Service`.
- [ ] Workflow step completed: **Avoid generic suffixes.** Prohibit `Manager`, `Helper`, `Handler`, `Processor` as suffixes. These don't communicate architectural role. Use `Service`, `Action`, `UseCase`, `Normalizer`, `Gateway` instead.
- [ ] Workflow step completed: **Use singular for services and models, plural for controllers.** `UserService` (singular), `Invoice` (singular), `InvoicesController` (plural). This follows Laravel and PHP community conventions.

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

- [ ] Failure addressed: Inconsistent suffix usage:
- [ ] Failure addressed: Generic naming:
- [ ] Failure addressed: Name drift:
- [ ] Failure addressed: Plural vs singular inconsistency:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All class names consistently use role-indicating suffixes
- [ ] Naming conventions are documented in project README or CONTRIBUTING.md
- [ ] No `Manager`, `Helper`, `Handler`, `Processor` classes
- [ ] Action classes follow Verb-Noun consistently
- [ ] Event classes use past-tense naming
- [ ] DTOs use Noun+Data or Noun+Dto suffix
- [ ] Every filename matches its class name exactly

### Success Criteria
- [ ] Class names communicate architectural role without opening the file.
- [ ] Naming conventions are documented and consistently applied.
- [ ] No generic suffixes (`Manager`, `Helper`, etc.) exist.
- [ ] Filenames match class names exactly Ã¢â‚¬â€ no autoload errors.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Use Verb-Noun Pattern for Action Classes followed
- [ ] Use Past-Tense for Event Classes followed
- [ ] Use {Domain}Service for Service Names followed
- [ ] Never Use `Manager`, `Helper`, `Handler`, or `Processor` as Suffixes followed
- [ ] Use Singular for Service and Model Names followed
- [ ] Use Noun+Data or Noun+Dto for Data Transfer Objects followed
- [ ] Ensure File Name Matches Class Name Exactly followed
- [ ] Document Naming Conventions in Team Documentation followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Generic Suffix Abuse
- [ ] Anti-pattern prevented: Inconsistent Suffix Usage
- [ ] Anti-pattern prevented: God Class Naming

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Inconsistent suffix usage:
- [ ] Failure scenario handled: Generic naming:
- [ ] Failure scenario handled: Name drift:

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
