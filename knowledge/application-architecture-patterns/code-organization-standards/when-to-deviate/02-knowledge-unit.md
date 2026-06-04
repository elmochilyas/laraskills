# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: When to deviate from defaults: decision criteria
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The decision to deviate from Laravel's default structure is one of the most consequential in a project's lifecycle. The community consensus is clear: start with defaults, deviate only when measurable pain emerges. The threshold is not team size, application age, or feature count—it's concrete, recurring friction that defaults cannot address. This KU provides the decision framework for evaluating whether deviation is justified.

---

# Core Concepts

Deviating from defaults creates two categories of cost:
1. **Setup cost:** Initial restructuring, PSR-4 configuration, tooling reconfiguration, documentation updates.
2. **Ongoing cost:** Developer training, framework convention mismatch, reduced compatibility with packages and tutorials, code review overhead for placement decisions.

Deviations are justified only when their benefits exceed both costs over the project's expected lifetime.

---

# Mental Models

**The "Pain-First" model:** Don't deviate until you can name the specific pain that defaults cause. "Hard to find code" is not specific. "I spent 15 minutes tracing through 6 files to understand the checkout flow" is specific.

**The "Six-Month Rule" model:** For a new project, don't deviate for the first six months. The structure you need reveals itself organically as domain boundaries emerge.

**The "One Level at a Time" model:** Deviations should be incremental. First add domain subdirectories within technical layers. Only add full domain isolation if the subdirectory approach causes pain.

---

# Internal Mechanics

Deviations that require PSR-4 changes add a `composer.json` update and `dump-autoload` step. Deviations that require custom service provider registration add boot-time overhead. Deviations that require custom Artisan stubs add a maintenance burden when upgrading Laravel versions.

Each deviation should be evaluated against:
- Does it break any `artisan make:` command default?
- Does it require custom autoloading configuration?
- Does it require documentation for new developers?
- Does it introduce any boot-time performance cost?

---

# Patterns

**Decision tree for deviation:**
1. Is the codebase experiencing specific friction from the default structure? (Naming the friction)
2. Does the proposed deviation directly address that friction?
3. Does the benefit of the deviation outweigh its setup and ongoing costs?
4. Is there a less invasive deviation that could work? (Hybrid before full domain, subdirectories before modules)
5. Can the deviation be introduced incrementally without a full rewrite?

**Common justified deviations:**
- `app/Services/` directory → Controllers are 200+ lines
- Domain subdirectories within layers → Models directory has 30+ files
- Full domain structure → Clear bounded contexts and team ownership by domain
- Module structure → Anticipated extraction to microservices

**Common unjustified deviations:**
- Repository pattern for all models → No multi-source data or testing pain
- Clean Architecture from day one → Simple CRUD application
- Interface-per-service → No second implementation planned
- Event bus abstraction → No cross-module communication yet

---

# Architectural Decisions

**Stay with defaults if:**
- Application is primarily CRUD with simple business rules
- Team is 1-5 developers
- Project is expected to live <3 years
- No clear domain boundaries exist yet
- You cannot articulate a specific problem with defaults

**Deviate if:**
- A specific, recurring friction is identified
- The friction causes measurable productivity loss
- The deviation directly addresses the friction
- The team agrees on the deviation and its costs
- The deviation can be enforced (automatically or via code review)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Architecture fits the specific need | Framework conventions no longer apply directly | `artisan make:` may not place files correctly |
| Domain boundaries are explicit | New developers learn custom structure | Onboarding time increases 2-5 days |
| Team ownership is clear | Package compatibility may suffer | Some packages assume default locations |
| Future extraction is easier | Restructuring costs are significant | Migration from defaults may take weeks |

---

# Performance Considerations

Most deviations don't affect runtime performance. The exception is per-domain service providers which increase boot time. Monitor boot time with 10+ providers.

---

# Production Considerations

Deviation decisions should be documented in an Architecture Decision Record (ADR). Include: the problem that motivated the deviation, alternatives considered, and the expected benefits. This prevents the next developer from reverting the structure or repeating the analysis.

---

# Common Mistakes

**Pre-emptive architecture:** Building Clean Architecture, Hexagonal Architecture, or module structure for a project that doesn't exist yet. The architecture you build pre-emptively is usually wrong because you don't yet know the domain.

**Deviation without enforcement:** Creating a new directory structure but not enforcing it. Within months, files scatter across both old and new structures.

**Following trends:** Adopting repository pattern, action classes, or DDD because "that's what real Laravel projects use" without identifying a specific problem.

---

# Failure Modes

**Half-migration:** Some code follows the new structure, some remains in the old. New developers don't know where to put new code. This is the worst outcome—neither structure is consistently applied.

**Ongoing cost exceeds benefit:** The custom structure adds more friction than it removes. Recognize this within 3-6 months and either double down or revert.

---

# Ecosystem Usage

Benjamin Crozat's 2026 Laravel architecture guide explicitly recommends: "start with defaults, organize by domain inside them, only add extra layers when the codebase has clearly earned them." This is the consensus position across community leaders and production experience reports.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-01 Default structure | COS-05 Feature-based org | COS-10 Team-scale strategies |
| COS-02 Layer-based org | COS-06 Domain-based org | AEG-06 Architecture Decision Records |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
