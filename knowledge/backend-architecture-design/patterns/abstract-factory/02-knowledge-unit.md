# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Abstract Factory pattern in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Abstract Factory provides an interface for creating families of related or dependent objects without specifying their concrete classes. In Laravel, Manager classes (Cache, Queue, Mail, Filesystem) are practical implementations of Abstract Factory — they create driver-specific families of objects based on configuration. The pattern excels when a system must support multiple product families (database drivers, payment gateways, notification channels) with consistent creation across each family.

---

# Core Concepts

- Product family: a set of related objects that work together (e.g., Redis cache store + Redis lock + Redis tags)
- Abstract Factory interface: declares creation methods for each product in the family
- Concrete Factory: implements creation for a specific family variant
- Client code: uses only Abstract Factory interface, never concrete factories directly

---

# Mental Models

- **Driver Ecosystem**: Laravel's config-driven driver selection is Abstract Factory at framework scale
- **Configuration Routing**: "Give me the factory for the configured driver" — abstract factory reads config, returns appropriate concrete factory
- **Family Consistency**: Ensures Redis driver uses only Redis components, File driver uses only File components

---

# Internal Mechanics

In PHP, Abstract Factory typically returns interface types. Laravel's Manager classes use a registry of closure-based creators (`$customCreators`) that are invoked when a specific driver is requested. The factory resolves configuration, selects the driver, calls the appropriate creator closure, and returns the fully-configured product.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Laravel Manager | Config-driven driver factories | Pluggable, testable, auto-discovery | Manager can become god class |
| Classic Abstract Factory | Hard-coded family selection | Type-safe, explicit | More classes, less flexible |
| Registry-based Factory | Dynamic family registration | Extensible at runtime | No compile-time safety |

---

# Architectural Decisions

- Use when: multiple interchangeable driver families (cache, queue, mail, storage)
- Use when: payment gateway abstraction (StripeFactory, PayPalFactory)
- Use when: notification channel families (each channel needs its own formatter + transport)
- Avoid for: single-product families — regular Factory is sufficient
- Design: Abstract Factory interface should return interface types, not concrete classes

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Family consistency guaranteed | Complex hierarchy of factory interfaces | New driver = implement N methods |
| Client isolated from concrete types | Factory selection logic adds complexity | Wrong driver selection = runtime error |
| Easy to add new families | No new family without interface change | OCP violation if adding products to family |
| Runtime driver switching possible | Configuration errors surface late | Typo in config key = runtime exception |

---

# Performance Considerations

- Factory resolution overhead negligible (array lookup + closure call)
- Driver creation cost depends on driver (DB connection expensive, file system cheap)
- Cache resolved drivers per request to avoid repeated factory invocation
- Long-running processes: factory closures captured in memory; avoid capturing large scopes

---

# Production Considerations

- Log factory creation failures with driver name for debugging
- Monitor which drivers are actively used vs configured but idle
- Test all driver variants in CI — untested drivers drift and break
- Document driver configuration requirements per concrete factory
- Graceful fallback when configured driver fails to initialize

---

# Common Mistakes

- Abstract Factory interface that grows with every new product → violates ISP
- Concrete factories with shared state → side effects across family creation
- Factory selection logic with hard-coded class names instead of config
- Not testing the factory selection path → wrong driver used in production despite correct tests per driver

---

# Failure Modes

- **Missing driver creator**: configured driver not registered → runtime exception
- **Incompatible family mix**: factory returns objects from different families that don't work together
- **Configuration drift**: factory reads config key that was renamed → silent fallback to default
- **Memory: factory closure captures request object**: in Octane, creates memory leak across requests

---

# Ecosystem Usage

- **Laravel Framework**: `Illuminate\Cache\CacheManager` — creates driver-specific cache stores; `Illuminate\Queue\QueueManager` — creates queue connections; `Illuminate\Mail\MailManager` — creates mailer instances
- **Laravel Filesystem**: `Illuminate\Filesystem\FilesystemManager` — creates local/S3/Cloud driver adapters
- **Spatie**: various packages use Manager pattern for multi-driver support

---

# Related Knowledge Units

**Prerequisites**: Factory pattern, Interface Segregation Principle | **Related**: Strategy pattern (single object variation vs family variation), Service Container binding | **Advanced**: Dynamic driver registration via service providers, Driver extension points

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

