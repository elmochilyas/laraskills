# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Template Method pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Template Method defines the skeleton of an algorithm in a base class, letting subclasses override specific steps without changing the algorithm's structure. In Laravel, the pattern is pervasive: service providers (register/boot lifecycle), controller method flow, and many framework base classes use Template Method to define invariant processes with variant steps. The pattern prevents duplication of algorithm structure while allowing customization at designated extension points.

---

# Core Concepts

- AbstractClass: defines template method (algorithm skeleton) and abstract primitive operations
- ConcreteClass: implements primitive operations
- Template method: calls primitive operations in specific order, marked `final` to prevent override
- Hook methods: optional overridable methods (default empty body) for additional customization
- Hollywood Principle: "Don't call us, we'll call you" — framework calls hook methods

---

# Mental Models

- **Recipe**: Follow the same steps (boil water, add pasta, drain), but ingredients vary
- **Car Manufacturing**: Same assembly line process, different parts for different models
- **Software Installer**: Same step sequence (welcome → license → directory → install), different content

---

# Internal Mechanics

Base class has a `final` public template method that calls protected abstract/overridable methods in a specific sequence. Subclasses implement only the variant parts. PHP 8+ allows private methods in base class for shared logic. The template method pattern is the foundation of the "framework" concept — the framework calls your code (inversion of control).

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Framework Template | Base class lifecycle | Consistent process, enforced order | Subclass must follow contract |
| Hook Method | Optional extension points | Default no-op, override only if needed | Hooks must be documented |
| Factory Method in Template | Custom object creation within template | Subclass controls what gets created | Each subclass may need different objects |

---

# Architectural Decisions

- Use for: invariant algorithm with variant steps (report generation, data import/export)
- Use for: lifecycle management (boot sequence, pipeline setup)
- Use for: framework base classes (ServiceProvider, Command, Rule)
- Use for: test fixtures with common setup/teardown but variant test content
- Avoid for: strategies that vary entirely (use Strategy pattern)
- Avoid for: algorithms where most steps change — inheritance becomes complex

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Algorithm structure defined once | Subclass must follow base class contract | Can't easily change step order |
| Variant steps isolated per subclass | Deep inheritance hierarchies | Hard to understand full algorithm |
| Hook methods for optional customization | Hooks must be documented and discovered | Unused hooks add complexity |
| Enforces consistency across implementations | LSP violations possible if subclass restricts | Child must satisfy parent contract |

---

# Performance Considerations

- Template method call: standard virtual method dispatch — no overhead
- Hook methods: empty method calls from parent cost ~nanoseconds
- Deep inheritance: each level adds method resolution cost (negligible in PHP)
- Reflection-based frameworks (Laravel): additional overhead from container resolution

---

# Production Considerations

- Document which methods subclasses MUST override vs MAY override
- Test abstract class logic against various subclass implementations
- Log template method execution for timing analysis
- Consider composition over inheritance when subclass variations are extreme

---

# Common Mistakes

- Template method not declared `final` → subclass can override and break algorithm order
- Too many abstract methods → subclass implementation burden
- Too few hooks → subclasses forced to copy whole class to add behavior
- Template method too long → hard to understand algorithm structure
- Subclass violating LSP by strengthening preconditions → breaks caller expectations

---

# Failure Modes

- **Subclass doesn't implement abstract method**: PHP raises fatal error (caught at compile time)
- **Subclass breaks parent contract**: overridden method returns wrong type → TypeError at runtime
- **Empty hook never called**: subclass overrides hook but parent doesn't call it → no effect
- **Framework upgrade breaks template method**: parent changes algorithm, subclasses break

---

# Ecosystem Usage

- **Laravel ServiceProvider**: `register()` called first, then `boot()` — template method defines provider lifecycle
- **Laravel Command**: `handle()` is the main execution step in Artisan commands
- **Laravel Rule**: `passes()` and `message()` — validation rule template
- **Laravel Controller**: base class provides middleware, authorization, validation hooks
- **Eloquent Collection**: `each()`, `map()`, `reduce()` — iteration algorithm with variant callback

---

# Related Knowledge Units

**Prerequisites**: Inheritance, Abstract classes | **Related**: Strategy (composition-based algorithm variation vs inheritance-based), Factory Method (template's object creation variant), Hook Method pattern | **Advanced**: Template Method vs Callback/Strategy, Inversion of Control containers, Framework design

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

