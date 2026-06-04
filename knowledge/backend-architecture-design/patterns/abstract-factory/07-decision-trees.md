# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Abstract Factory pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Abstract Factory vs Simple Factory
* Decision 2: Family creation — Abstract Factory vs Service Container
* Decision 3: Factory interface design — one method per product vs generic factory

---

# Architecture-Level Decision Trees

---

## Decision: Abstract Factory vs Simple Factory

---

## Decision Context

Choose between Abstract Factory (families of related objects) and Simple Factory (single product creation).

---

## Decision Criteria

* performance considerations: both add negligible overhead; Abstract Factory has one extra indirection per family
* architectural considerations: Abstract Factory enforces family consistency; Simple Factory creates individual objects
* security considerations: Abstract Factory can enforce family-wide security constraints; Simple Factory per product
* maintainability considerations: Abstract Factory requires interface + concrete per family; Simple Factory is lighter

---

## Decision Tree

Does your system need to create families of related or dependent objects?
↓
YES → Abstract Factory (families must be consistent — e.g., Stripe backend + Stripe webhook handler)
    ↓
    Is each family's product set the same across all variants?
    YES → Abstract Factory with stable interface (e.g., Cache\Store, Queue\Queue)
    ↓
    Laravel Manager classes are canonical examples
    ↓
    Can the product set grow over time (new requirements)?
    YES → Design factory interface with ISP — split into focused sub-interfaces
    ↓
    Growing product sets inflate the factory interface → violates ISP
    NO → Closed product set — one factory method per product, stable contract
    NO → Regular Factory (single product creation) — Abstract Factory adds unnecessary indirection
NO → Does creation require multiple steps or complex configuration?
    YES → Builder pattern (step-wise construction with fluent API)
    NO → Simple Factory or direct instantiation (constructor call or `new`)

---

## Rationale

Abstract Factory shines when you need interchangeable product families that must be used together consistently. The pattern prevents mixing e.g., Stripe payment with PayPal webhook parser. Laravel's Manager classes (CacheManager, QueueManager) demonstrate this: each driver creates a consistent family of objects. Simple Factory is sufficient when you create objects individually without family constraints.

---

## Recommended Default

**Default:** Simple Factory (or Laravel Service Container) unless you have multiple product families that must be used as consistent groups.
**Reason:** Abstract Factory adds interface complexity. Only pay that cost when family consistency is a hard requirement.

---

## Risks Of Wrong Choice

Abstract Factory for single-product families: over-engineering, excess abstraction. Simple Factory when families must be consistent: risk of mixing incompatible products at runtime (Stripe payment with PayPal receipt).

---

## Related Rules

- Rule 1: Use Abstract Factory when product families must be used as consistent groups
- Rule 2: Abstract Factory interface must follow ISP — don't grow one factory interface with every new product

---

## Related Skills

- Implement Abstract Factory
- Use Laravel Manager classes
- Design Factory interfaces (ISP)

---

## Decision: Family Creation — Abstract Factory vs Service Container

---

## Decision Context

Choose between explicit Abstract Factory classes and Laravel's Service Container for managing family creation.

---

## Decision Criteria

* performance considerations: container resolution ~0.1-1ms first call (reflection); Abstract Factory is direct instantiation
* architectural considerations: Abstract Factory is explicit and framework-agnostic; Container ties to Laravel
* security considerations: Abstract Factory can validate family composition at creation time; Container resolves blindly
* maintainability considerations: Abstract Factory classes are self-documenting; Container bindings are scattered across providers

---

## Decision Tree

Is the family creation logic framework-agnostic (domain layer)?
↓
YES → Abstract Factory class (domain must not depend on framework container)
    ↓
    Domain layer defines the factory interface + domain-specific factory
    ↓
    Example: `interface PaymentGatewayFactory { create(): PaymentGateway }`
    Infrastructure layer implements the concrete factory
    ↓
    Does the factory need to resolve from container anyway (has its own dependencies)?
    YES → Register the Abstract Factory implementation as a singleton in the container
    ↓
    Bind: `$this->app->singleton(PaymentGatewayFactory::class, StripeFactory::class)`
    NO → Pure Abstract Factory — no container needed
NO → Is the creation logic purely infrastructural (cache, queue, mail drivers)?
    YES → Service Container (Laravel Manager pattern — container manages driver resolution)
    ↓
    Container handles dependency resolution, lifecycle, and configuration
    Example: CacheManager uses container to resolve `cache.driver.redis`, `cache.driver.file`
    ↓
    Does the application need to swap implementations in tests?
    YES → Container binding + `mock()` — container makes testing trivial
    NO → Container binding unless you need framework independence
NO → Is this part of a reusable package?
    YES → Abstract Factory (packages should not depend on specific containers)
    ↓
    Publish an interface and let the host application register implementations
    NO → Container binding is acceptable for application-specific code

---

## Rationale

Abstract Factory ownership: domain layer defines the contract, infrastructure provides implementations. Container is for infrastructural wiring. When building framework-agnostic domain logic, Abstract Factory is mandatory. When the concern is purely infrastructural, the container provides better integration with Laravel's auto-resolution and testing utilities.

---

## Recommended Default

**Default:** Service Container binding for infrastructural concerns (cache, queue, mail). Abstract Factory for domain-layer family creation that must remain framework-agnostic.
**Reason:** Container reduces boilerplate. Abstract Factory protects domain layer from framework coupling.

---

## Risks Of Wrong Choice

Abstract Factory in domain that depends on container: couples domain to framework, defeats portability. Container for domain creation: application can't be tested without booting the framework. No factory at all: `new` scattered across codebase, cannot substitute implementations.

---

## Related Rules

- Domain layer must define its own factory interfaces (framework-agnostic)
- Infrastructure factories are bound in service providers

---

## Related Skills

- Implement Abstract Factory in domain layer
- Bind factories in Service Container
- Design framework-agnostic factory interfaces

---

## Decision: Factory Interface Design — One Method Per Product vs Generic Factory

---

## Decision Context

Choose whether the Abstract Factory interface declares one method per product or uses a generic parameter-based approach.

---

## Decision Criteria

* performance considerations: type-specific methods have zero routing overhead; generic factory adds string matching
* architectural considerations: specific methods are type-safe; generic factory trades safety for flexibility
* security considerations: generic factory can accept untrusted type parameters → risk of unexpected product creation
* maintainability considerations: specific methods grow interface with each new product; generic factory doesn't scale well

---

## Decision Tree

Does the product set have known cardinality (fixed, bounded)?
↓
YES → One method per product (type-safe, IDE-friendly, explicit)
    ↓
    Each product gets its own method with a meaningful name
    Example: `createPdfExporter(): PdfExporter`, `createCsvExporter(): CsvExporter`
    ↓
    Is the product set large (5+ products)?
    YES → Split into multiple focused factory interfaces (ISP)
    ↓
    `interface DocumentExporterFactory { createPdfExporter(): PdfExporter; createCsvExporter(): CsvExporter }`
    `interface ReportFactory { createSummaryReport(): SummaryReport; createDetailReport(): DetailReport }`
    NO → Single interface with one method per product — manageable
NO → Generic factory with parameter (product set is extensible, plugins)
    ↓
    Single method: `create(string $type, array $options = []): Product`
    ↓
    Is the parameter a string constant or an enum?
    YES → Backed enum is preferred (type-safe, discoverable)
    ↓
    `enum ProductType: string { case PDF = 'pdf'; case CSV = 'csv' }`
    `create(ProductType $type): Product`
    NO → String constant — error-prone, but necessary for dynamic plugins
        ↓
        Validate the string at factory entry to fail fast with meaningful errors
        Throw `UnsupportedProductException` for unknown types
NO → Does the factory need to support runtime addition of new products?
    YES → Registry-based factory (register product creators dynamically)
    ↓
    `factory->register('pdf', new PdfCreator()); factory->create('pdf')`
    NO → Fixed switch/match — compile-time product set

---

## Rationale

One-method-per-product is the preferred default for its type safety and discoverability. Generic factories (parameter-based) are useful when products are dynamically registered or the set is large and extensible. The choice depends on whether the product set is fixed and known at compile time or dynamic at runtime.

---

## Recommended Default

**Default:** One method per product with a fixed, bounded interface. Split into sub-interfaces (ISP) when the product count exceeds 5.
**Reason:** Type safety, IDE autocompletion, and compile-time contract enforcement outweigh the benefit of generic flexibility.

---

## Risks Of Wrong Choice

Generic factory with string params: runtime errors on typos, no autocompletion, type unsafety. One-method-per-product growing unbounded: massive interface violates ISP, every implementation must handle all methods. Regular enum constraining dynamic plugins: can't register new product types without code change.

---

## Related Rules

- Rule 3: Abstract Factory interface must not grow unbounded — split at 5+ products
- Rule 4: Use Backed Enum instead of string for generic factory type parameters

---

## Related Skills

- Design Factory Interface (ISP)
- Implement Registry-Based Factory
- Use PHP Enums for factory type parameters
