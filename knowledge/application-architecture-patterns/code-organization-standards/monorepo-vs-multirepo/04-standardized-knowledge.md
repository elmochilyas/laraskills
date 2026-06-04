# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Monorepo vs. multi-repo organizational tradeoffs
Knowledge Unit ID: COS-11
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

The monorepo vs. multi-repo decision determines how code is shared, versioned, and deployed across teams. Monorepo keeps all code in one repository with modular structure; multi-repo splits into separate repositories per module. The Laravel ecosystem is overwhelmingly monorepo-centric — the framework itself is a monorepo, most packages expect single-repo setups, and modular monolith is inherently a monorepo pattern. Multi-repo becomes relevant at significant organizational scale (>50 engineers) or when independent deployment is required.

---

# Core Concepts

- **Monorepo**: Single repository with multiple distinct projects, shared tooling/CI/versioning. All code synchronized at the same version.
- **Multi-repo**: Separate repositories per project with independent CI, versioning, and deployment. Code shared via Composer packages.
- **Hybrid**: Monorepo for related modules, multi-repo for loosely coupled services.
- **Atomic Changes**: Monorepo enables cross-module refactoring in single commits. Multi-repo requires version bumps.

---

# When To Use

Monorepo:
- Teams <50 engineers
- Single deployment (modular monolith)
- Cross-module refactoring is frequent
- Atomic changes matter

Multi-repo:
- Teams need independent deployment cadences
- Modules are truly independent services (microservices)
- Different scaling requirements per module
- Team independence outweighs atomic change benefits

---

# When NOT To Use

Monorepo:
- Teams >50 with independent deploy requirements
- CI can't be optimized (full test suite runs on every change)
- Repository size causes significant tooling slowdown

Multi-repo:
- Teams <15 engineers — coordination costs exceed benefits
- Cross-module changes are frequent (version bump hell)
- No shared contracts package maintained

---

# Best Practices

- **Use monorepo with modular structure** as default. WHY: Cross-module refactoring is atomic, shared tooling works, and dependency hell is avoided.
- **Invest in shared contracts package for multi-repo** if splitting. WHY: Without shared contracts, code duplication and drift follow across repositories.
- **Use path-based CI filtering in monorepos.** WHY: Prevents full test suite from running on every change, keeping CI under 10 minutes.
- **Establish clear module boundaries** even within monorepo. WHY: Monorepo without module boundaries is just a monolith — unmanageable at scale.
- **Document cross-repo dependency graph** in multi-repo setups. WHY: Coordinating upgrades across multiple repos requires clear dependency understanding.

---

# Architecture Guidelines

- The default recommendation for Laravel is monorepo with modular structure.
- Multi-repo should be a deliberate choice driven by organizational constraints, not technical preference.
- For monorepo, use selective test execution (Pest parallel, GitHub Actions path filters).
- For multi-repo, version shared contracts package and use semantic versioning.
- Hybrid approach: monorepo for related modules, multi-repo for external services.

---

# Performance Considerations

- Monorepo CI: As repo grows, optimize with path-based CI filtering and selective test execution.
- Multi-repo CI: Each repo's CI is independent and fast, but cross-cutting changes (framework upgrade) require N repo changes.
- Repository size: Large monorepos slow `git clone` and IDE indexing.

---

# Security Considerations

- Multi-repo may reduce blast radius of compromised CI pipelines.
- Monorepo requires more careful branch protection and access control.

---

# Common Mistakes

1. **Microservices driving multi-repo prematurely:** Creating 5 repos for what could be a modular monolith. Cause: anticipating future microservices. Consequence: multiplied operational costs without benefit. Better: start modular monolith, extract when needed.

2. **Monorepo without module boundaries:** Putting everything in one repo without structure. Cause: assuming monorepo = monolith. Consequence: unmanageable single-mass codebase. Better: enforce module boundaries even within monorepo.

3. **Multi-repo without shared contracts:** Splitting repos without shared contracts package. Cause: underestimating cross-cutting concerns. Consequence: code duplication and drift. Better: maintain shared contracts package.

---

# Anti-Patterns

- **Monorepo CI death**: CI too slow for any single change — mitigated by path-based filtering.
- **Multi-repo versioning hell**: Module A requires v2 of contracts, Module B requires v3 — coordination becomes full-time work.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-10 Team-scale strategies | MMD-01 Module vs microservice | MMD-11 Module extraction |
| MMD-17 Modular vs microservices decision | MMD-09 Module dependency management | AEG-06 ADRs |

---

# AI Agent Notes

- Default to monorepo recommendation for Laravel projects under 50 engineers.
- When suggesting multi-repo, ensure shared contracts package and versioning strategy are in place.
- Recognize that modular monolith (one repo, multiple modules) is the recommended Laravel architecture.

---

# Verification

- [ ] Module boundaries are enforced even within monorepo
- [ ] CI uses path-based filtering for selective execution
- [ ] Multi-repo setup includes shared contracts package
- [ ] Cross-repo dependency graph is documented
- [ ] Team can articulate why their repo structure exists
