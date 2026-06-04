# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Real-world tradeoffs: when Clean Architecture pays off
Knowledge Unit ID: LAP-14
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Clean Architecture carries significant costs: increased code volume, cognitive load, onboarding time, and iteration speed. Based on production experience reports, Clean Architecture pays off when business logic is genuinely complex, multiple delivery mechanisms exist, there are 10+ engineers, and the project is expected to outlive its framework. For most CRUD-heavy Laravel applications, simpler architectures provide better ROI.

---

# Core Concepts

- **Architecture Tax**: Clean Architecture imposes a tax on every change — DTO, Use Case interface, implementation, repository interface + implementation, mapper, tests. Worth paying only when benefit exceeds tax.
- **Insurance Policy**: Like insurance against future architecture rot. Premiums paid today protect against worst-case scenarios. Worth it only if the insured risk is realistic.
- **Sufficient Complexity Threshold**: Below a certain complexity, Clean Architecture is net-negative. The threshold is higher than most developers estimate.

---

# When To Use

- Complex business domain (fintech, healthcare, compliance)
- Active testing of business logic without Laravel bootstrap
- Application maintained for 5+ years
- Multiple client types sharing business logic (web, API, CLI)
- Team size >10 engineers

---

# When NOT To Use

- Application is primarily CRUD with simple validation
- Single delivery mechanism (HTTP only)
- Small team (<5) with limited architectural experience
- Short-lived project or prototype
- Business logic tightly coupled to database operations

---

# Best Practices

- **Start with Service Layer and evolve.** WHY: The most successful Clean Architecture implementations in Laravel evolved from simpler patterns. Start with services, add layers only when justified by demonstrated complexity.
- **Consider "Clean Architecture Lite"** (Application + Domain without full Ports/Adapters). WHY: Provides 80% of the benefit at 40% of the cost for moderate complexity applications.
- **Pilot before committing codebase-wide.** WHY: Prove value with one feature before restructuring the entire application. Team buy-in is essential.
- **Quantify costs before deciding.** WHY: Clean Architecture means 2-4x more files per feature and 1.5-3x development time initially. These numbers must be justified by the benefits.

---

# Architecture Guidelines

- Code volume: 2-4x more files per feature vs default MVC.
- Development time: 1.5-3x per feature initially, decreasing to 1.2-1.5x with experience.
- Onboarding: 2-4 weeks vs 1 week for default MVC.
- Test speed: Domain tests ~50ms vs ~500ms for Laravel-bootstrapped tests.
- Framework upgrade: Typically zero changes in Domain/Application layers.

---

# Performance Considerations

- No significant production performance difference.
- Mapping overhead is negligible.
- Clean Architecture may improve test environment performance (faster bootstrap).

---

# Security Considerations

- Architecture level does not determine security — ensure proper patterns regardless of architectural choice.

---

# Common Mistakes

1. **Applying Clean Architecture to simple CRUD.** Cause: architectural fashion. Consequence: years of overhead for no benefit. Better: match architecture to actual complexity.

2. **Not applying it when needed.** Cause: not recognizing complexity growth. Consequence: complex business logic in fat controllers — risky and slow to test. Better: evolve architecture as complexity grows.

3. **Clean Architecture "Theater":** Directory structure says Clean Architecture, but code imports Eloquent in Domain. Cause: no enforcement. Consequence: architecture is cosmetic.

4. **Architecture abandonment:** Team decides overhead isn't worth it but doesn't refactor back. Cause: no reversion plan. Consequence: stuck with partial architecture. Better: either commit or refactor to simpler pattern.

---

# Anti-Patterns

- **Premature architecture**: Full Clean Architecture on day one for unknown complexity.
- **Architecture fashion**: Adopting Clean Architecture because it's popular, not because it solves a problem.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-02 Clean Architecture | LAP-09 Framework independence | COS-09 When to deviate |
| LAP-03 Hexagonal Architecture | LAP-12 Incremental migration | AEG-06 ADRs |

---

# AI Agent Notes

- Default to Service Layer pattern for most Laravel projects — only suggest Clean Architecture when complexity warrants it.
- For simple CRUD features, do not suggest Clean Architecture abstractions.
- When Clean Architecture is in use, ensure all layers are properly implemented — no "theater."

---

# Verification

- [ ] Architectural choice (Clean Architecture vs. Lite vs. Service Layer) is documented in ADR
- [ ] Complexity threshold that justified Clean Architecture is documented
- [ ] Team productivity impact is tracked and evaluated
- [ ] Architecture tests enforce the chosen pattern
- [ ] No Clean Architecture "theater" — directories and code match
