# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Layer Supertype pattern
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Layer Supertype provides a base class that all types in a layer inherit from, offering common functionality without duplicating code. In Laravel, the pattern is foundational: `Illuminate\Database\Eloquent\Model` is the Layer Supertype for all Eloquent models, `Illuminate\Foundation\Http\FormRequest` for form requests, `Illuminate\Console\Command` for Artisan commands, and `Illuminate\Support\ServiceProvider` for service providers. The pattern centralizes cross-cutting behavior (timestamps, event dispatching, serialization, authorization checking) while maintaining a consistent interface across all types in the layer.

---

# Core Concepts

- Base class for a layer (domain, persistence, presentation)
- Common behavior: timestamp management, event dispatching, serialization
- Template methods: hooks for subclasses to customize
- Framework integration: base class knows about framework concerns
- Convention over configuration: sensible defaults in base class

---

# Mental Models

- **Abstract Blueprint**: Base class defines what all objects in layer share
- **Framework Contract**: "Extend this class and you get these capabilities automatically"
- **Opinionated Foundation**: Layer supertype embodies framework's conventions

---

# Internal Mechanics

Layer Supertype uses PHP inheritance. Protected methods provide shared functionality. Template methods (e.g., `boot()`, `register()`, `handle()`) define lifecycle hooks. Traits provide composable behavior blocks. The base class may implement interfaces that all subtypes automatically satisfy.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Framework Supertype (Framework class) | Common framework behavior | Zero-config for developers | Heavy base class, limited flexibility |
| Custom Domain Supertype | Common domain behavior | Enforces consistency | Inheritance coupling |
| Trait-based Composition | Composable behavior blocks | Flexible, avoids deep inheritance | Trait collisions, magic resolution |
| Abstract Service Base | Common service patterns | DRY service classes | Premature abstraction if services vary |

---

# Architectural Decisions

- Accept framework Layer Supertypes (Model, Controller, Command, Request) → they provide essential framework integration
- Create custom domain supertype only when: multiple domain classes share significant behavior
- Prefer Trait composition over deep inheritance chains for cross-cutting concerns
- Use abstract base class when: template method pattern is needed
- Avoid Layer Supertype for: unrelated classes that happen to share a method (use trait)
- Distinguish between: framework supertype (must extend) vs application supertype (convenience)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralizes cross-cutting behavior | Heavy base class | Subclass carries unused features |
| Consistent interface across layer | Inheritance coupling | Change to base affects all subtypes |
| Reduces code duplication | Base class becomes dumping ground | God base class with unrelated concerns |
| Template methods guide correct usage | Subclass must follow base lifecycle | Learning curve for subclass contract |

---

# Performance Considerations

- Layer Supertype methods inherited → no performance penalty
- Heavy base class: Model has many methods inherited by every model
- Trait methods compiled into class → same performance as class methods
- Reflection on Layer Supertype (container resolution) adds first-call overhead

---

# Production Considerations

- Document what subclass methods are available vs required
- Avoid adding framework-specific logic to domain supertypes
- Test base class behavior with various subclass configurations
- Monitor base class growth — if it exceeds 500 loc, consider decomposition
- Be careful with heavy Layer Supertype in memory-constrained environments

---

# Common Mistakes

- Creating deep inheritance chains (supertype → abstract → concrete) → hard to navigate
- Base class accumulating unrelated methods → god object anti-pattern
- Extending framework supertype when not needed → carrying unused behavior
- Custom domain supertype with framework dependencies → couples domain to framework
- Base class changing behavior of subtype via protected methods → hidden coupling

---

# Failure Modes

- **Deep inheritance chain**: change in base Layer Supertype breaks all subtypes
- **God base class**: 1000+ line Model base class with unrelated concerns
- **Fragile base class**: subclass overrides protected method, base behavior changes unexpectedly
- **Framework upgrade breaks supertype**: base class changes in new Laravel version, all models affected

---

# Ecosystem Usage

- **Eloquent Model**: `Illuminate\Database\Eloquent\Model` — Layer Supertype for all models
- **Laravel Controller**: `Illuminate\Routing\Controller` — base controller with middleware, authorization
- **Laravel ServiceProvider**: `Illuminate\Support\ServiceProvider` — register/boot lifecycle
- **Laravel Command**: `Illuminate\Console\Command` — Artisan command base
- **FormRequest**: `Illuminate\Foundation\Http\FormRequest` — validated request base

---

# Related Knowledge Units

**Prerequisites**: Inheritance, Abstract classes | **Related**: Template Method (supertype behavior pattern), Traits (composition alternative), Base class vs Interface design | **Advanced**: Framework Layer Supertypes internals, Trait composition vs inheritance, Skeletal implementation pattern

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

