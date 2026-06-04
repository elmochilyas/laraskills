# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: The Dependency Rule: inward-pointing dependencies
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The Dependency Rule is the fundamental constraint of layered architectures: source code dependencies can only point inward toward the domain core. Outer layers (Presentation, Infrastructure) can depend on inner layers (Application, Domain), but inner layers must never depend on outer layers. This rule ensures that business logic is insulated from technical concerns. Violating this rule—even once—allows framework coupling to propagate through the entire codebase. It is the single most important rule to enforce with automated tooling.

---

# Core Concepts

The Dependency Rule across layers:
- **Presentation layer** can depend on: Application, Domain
- **Infrastructure layer** can depend on: Application, Domain
- **Application layer** can depend on: Domain only
- **Domain layer** can depend on: Nothing external (no framework, no libraries beyond standard PHP)

A dependency is any import statement that references a class from an outer layer. `use Illuminate\Http\Request;` in an Application layer class is a violation. `use App\Domain\Entities\Invoice;` in a Presentation layer class is allowed.

---

# Mental Models

**The "Compile-Time vs. Run-Time" model:** At compile time (imports, extends, implements), dependencies must point inward. At runtime, the flow of control goes outward (outer layers call inner layers). Dependency Inversion makes this possible: inner layers define interfaces; outer layers implement them and are injected at runtime.

**The "Screaming Architecture" model:** If you dumped the source code directory tree, it should scream what the application is about, not what framework it uses. Domain/Application directories contain business concepts; Infrastructure/Presentation directories contain technical concepts.

---

# Internal Mechanics

Dependency Inversion Principle (DIP) enables the Dependency Rule:
- Inner layer defines an interface (`InvoiceRepositoryInterface`).
- Outer layer implements it (`EloquentInvoiceRepository`).
- Dependency injection mechanism (Laravel's service container) injects the outer implementation into the inner layer at runtime.

At compile time, the inner layer depends on an interface it owns (good). The outer layer depends on the same interface (allowed). The inner layer never imports the outer implementation.

This creates the inversion: the outer layer "depends on" the inner layer's interface, even though at runtime the inner layer receives the outer implementation.

---

# Patterns

**Hand-coded Dependency Injection:** Constructor injection in use cases, resolved by Laravel's container:
```php
class CreateInvoiceUseCase {
    public function __construct(
        private InvoiceRepositoryInterface $repo // Interface owned by Application
    ) {}
}
```

**Service Provider Binding:** The composition root wires interfaces to implementations:
```php
// AppServiceProvider
public function register(): void {
    $this->app->bind(InvoiceRepositoryInterface::class, EloquentInvoiceRepository::class);
}
```

**Architecture tests:** Pest/PHPUnit tests that assert no inner class imports from outer classes (see AEG-01).

---

# Architectural Decisions

**Enforce the Dependency Rule when:** Using Clean Architecture, Hexagonal Architecture, or any layered architecture beyond three layers. Without enforcement, violations accumulate.

**Relax the rule when:** Using three-layer architecture with services. Three-layer allows the business layer to depend on Eloquent models, which is a conscious tradeoff.

**Tiered enforcement:** Consider different enforcement rigor for different layers. Domain layer: zero external dependencies, enforced strictly. Application layer: no Laravel HTTP or database dependencies, allowed to use Laravel utilities.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Framework-independent business logic | Dependency inversion adds complexity | Interfaces for every boundary |
| Swappable infrastructure | Composition root grows | All bindings in one place |
| Testable domain without Laravel | Inversion requires skill | Teams must understand DIP |
| Architecture resilience | Violations are subtle | A single `use Illuminate` in Application layer breaks the rule |

---

# Performance Considerations

Interface dispatch (calling methods through interfaces) has negligible overhead in PHP 8.x with JIT. The architectural benefit far outweighs the micro-performance cost.

---

# Production Considerations

The Dependency Rule cannot be enforced by directory structure alone. A class in `app/Domain/` can still import `Facades\DB`. Enforcement requires:
- Architecture tests (AEG-01)
- Static analysis rules (AEG-03)
- Code review (AEG-04)

---

# Common Mistakes

**Facade usage in Domain layer:** Calling `\DB::table()`, `\Cache::get()`, or `\Event::dispatch()` in Domain classes. These are implicit dependencies on Laravel's facade layer.

**Extending framework classes in Domain:** Domain entities extending `Illuminate\Database\Eloquent\Model` (which couples them to Laravel's ORM).

**Using framework helpers in Application:** Calling `validator()`, `response()`, or `redirect()` helper functions in Application use cases.

---

# Failure Modes

**Dependency rule discovered in production:** A violation (e.g., `Request` object imported in a Domain service) works in development but fails in a console context or queue worker where HTTP context doesn't exist.

**Transitive dependency violation:** Application code depends on a package that depends on Laravel. The package import is indirect but still couples the Application layer.

---

# Ecosystem Usage

Pest's architecture testing (`expect()->toOnlyUse()`) enforces the Dependency Rule at test time. PHPStan custom rules (various community packages) check imports against configured layer boundaries. Modulate's `violation-checker` specifically targets cross-layer import violations.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-02 Clean Architecture | LAP-05 Domain layer | LAP-09 Framework independence |
| LAP-03 Hexagonal Architecture | LAP-06 Application layer | AEG-01 Architecture testing |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche�most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
