# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Monorepo vs. multi-repo organizational tradeoffs
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The monorepo vs. multi-repo decision for Laravel applications determines how code is shared, versioned, and deployed across teams. A monorepo keeps all code in one repository with modular structure; multi-repo splits into separate repositories per module or service. The Laravel ecosystem is overwhelmingly monorepo-centric: the framework itself is a monorepo, most package ecosystems expect single-repo setups, and modular monolith (the recommended architecture for most teams) is inherently a monorepo pattern. Multi-repo becomes relevant only at significant organizational scale (>50 engineers) or when independent deployment is required.

---

# Core Concepts

**Monorepo:** Single repository containing multiple distinct projects (modules, domains) with shared tooling, CI, and versioning. All code is synchronized at the same version.

**Multi-repo:** Separate repositories per project (module, service), each with independent CI, versioning, and deployment. Code sharing happens via Composer packages.

**Hybrid:** Monorepo for related modules with shared development, multi-repo for loosely coupled services or external dependencies.

---

# Mental Models

**The "Single Source of Truth" model (monorepo):** All code exists in one place. Cross-module refactoring is atomic. You change a contract and all consumers update in the same commit.

**The "Independent Evolution" model (multi-repo):** Each service evolves at its own pace. Breaking changes are managed via version bumps, not coordinated commits.

**The "Coordination Cost Tradeoff" model:** Monorepo minimizes cross-project refactoring cost but maximizes coordination need at build time. Multi-repo minimizes build coordination but maximizes cross-project change cost.

---

# Internal Mechanics

**Monorepo in Laravel:** All modules under one `composer.json`. Autoloading covers all directories. One CI pipeline runs all tests. One deployment packages everything.

**Multi-repo in Laravel:** Each module is a Composer package with its own `composer.json`. Published to a private Packagist or Satis. Consumed via `composer require`. Each repo has independent CI and deployment.

**Shared code in monorepo:** PSR-4 autoloading covers shared directories. Cross-module changes are in the same commit.

**Shared code in multi-repo:** Must be extracted as a shared package (e.g., `vendor/company/contracts`). Version bumps require updates in consuming repos.

---

# Patterns

**Monorepo with modular structure:** Single repo, clear module directories, shared CI, coordinated releases. Best for 10-50 engineers.

**Multi-repo with shared contracts package:** Separate repos per domain/service, a shared contracts package for interfaces and DTOs. Best for 50+ engineers or when independent deployment is required.

**Split monorepo tooling:** Tools like `monorepo-builder` (Symfony) or custom scripts can manage a monorepo that publishes to multiple packages while maintaining a unified development repo.

---

# Architectural Decisions

**Use monorepo when:**
- Teams are <50 engineers
- Code is a single deployment (modular monolith)
- Cross-module refactoring is frequent
- Atomic changes across modules matter
- CI coordination overhead is acceptable

**Use multi-repo when:**
- Teams need independent deployment cadences
- Modules are truly independent services (microservices)
- Different modules have different scaling requirements
- Team independence outweighs atomic change benefits
- Each module has its own CI pipeline

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Atomic cross-module changes | CI runs all tests, all modules | 10+ minute CI times, selective test running needed |
| Single version, no dependency hell | Repository size grows large | `git clone` times increase, IDE indexing slows |
| Shared tooling and conventions | Build coordination overhead | Release coordination meetings needed |
| Easier refactoring | Team independence reduced | Teams must coordinate on framework upgrades |

---

# Performance Considerations

Monorepo CI performance: As the repo grows, CI must optimize by running only changed modules' tests. Tools like `pest --parallel --filter` and GitHub Actions path filters are essential.

Multi-repo CI: Each repo's CI is independent and fast, but cross-cutting changes (framework upgrade) require changes across N repos.

---

# Production Considerations

**Monorepo deployment:** If using a modular monolith, single deployment is straightforward. If deploying modules independently from a monorepo, you need selective build/deploy tooling.

**Multi-repo dependency management:** A shared contracts package means any contract change triggers updates in all consuming repos. This is a coordination bottleneck.

---

# Common Mistakes

**Microservices architecture driving multi-repo prematurely:** Teams create 5 repos for what could be a single modular monolith. The operational costs (CI x 5, deployment x 5, monitoring x 5) are multiplied without clear benefit.

**Monorepo without module boundaries:** Putting everything in one repo without structure. This is just a monolith, not a monorepo. Module boundaries are what make monorepos manageable.

**Multi-repo without shared contracts:** Teams split repos but don't invest in a shared contracts package. Code duplication and drift follow.

---

# Failure Modes

**Monorepo CI death:** As repo grows, CI becomes too slow for any single change. Mitigate with path-based CI filtering and selective test execution.

**Multi-repo versioning hell:** Module A requires v2 of contracts, Module B requires v3. Coordinating upgrades becomes a full-time task.

---

# Ecosystem Usage

Laravel itself uses a monorepo approach. Spatie uses monorepo per product family. The `nwidart/modules` package supports both monorepo (modules in a monorepo) and multi-repo (modules as separate packages) with its `--separate` flag.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-10 Team-scale strategies | MMD-01 Module vs microservice | MMD-11 Module extraction |
| MMD-17 Modular vs microservices decision | MMD-09 Module dependency management | AEG-06 ADRs |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
