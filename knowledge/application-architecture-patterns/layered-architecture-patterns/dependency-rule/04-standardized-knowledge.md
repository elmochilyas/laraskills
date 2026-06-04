# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: The Dependency Rule: inward-pointing dependencies
Knowledge Unit ID: LAP-04
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

The Dependency Rule is the fundamental constraint of layered architectures: source code dependencies can only point inward toward the domain core. Outer layers (Presentation, Infrastructure) can depend on inner layers (Application, Domain), but inner layers must never depend on outer layers. This ensures business logic is insulated from technical concerns. It is the single most important rule to enforce with automated tooling.

---

# Core Concepts

- **Presentation layer** can depend on: Application, Domain
- **Infrastructure layer** can depend on: Application, Domain
- **Application layer** can depend on: Domain only
- **Domain layer** can depend on: Nothing external (no framework, no libraries beyond PHP)

A dependency is any import referencing an outer layer class. `use Illuminate\Http\Request;` in Application is a violation.

---

# When To Use

- Clean Architecture, Hexagonal Architecture, or any layered architecture beyond three layers
- When framework independence of business logic is required
- When automated architecture enforcement is in place

---

# When NOT To Use

- Three-layer architecture where business layer depends on Eloquent (a conscious tradeoff)
- Projects where architectural enforcement cannot be maintained
- Simple CRUD applications where dependency inversion adds unnecessary complexity

---

# Best Practices

- **Enforce the Dependency Rule with architecture tests.** WHY: The rule cannot be enforced by directory structure alone — a class in `app/Domain/` can still import `Facades\DB`. Only automated enforcement prevents violations.
- **Use Dependency Inversion at boundaries.** WHY: Inner layers define interfaces; outer layers implement them. The service container injects the outer implementation at runtime.
- **Bind interfaces to implementations in service providers.** WHY: This is the composition root where wiring happens — keeps dependency resolution centralized.
- **Never use facades or helpers in inner layers.** WHY: `\DB::table()`, `\Cache::get()`, `validator()`, `response()` are implicit dependencies on outer layers.
- **Consider tiered enforcement.** WHY: Domain layer: zero external dependencies (strict). Application layer: no Laravel HTTP/database imports (allowed to use Laravel utilities).

---

# Architecture Guidelines

- Inner layer defines interface (`InvoiceRepositoryInterface`) — outer layer implements it (`EloquentInvoiceRepository`).
- At compile time, dependencies point inward. At runtime, control flows outward (outer layers call inner layers).
- A single `use Illuminate` import in Domain breaks the rule — this is a hard boundary.
- Extension of framework classes (`extends Model`, `extends Controller`) in Domain or Application is a violation.

---

# Performance Considerations

- Interface dispatch overhead in PHP 8.x with JIT is negligible.
- Architectural benefit far outweighs micro-performance cost.

---

# Security Considerations

- The Dependency Rule itself does not provide security, but it ensures security infrastructure (auth) stays in outer layers where it belongs.

---

# Common Mistakes

1. **Facade usage in Domain layer:** `\DB::table()`, `\Cache::get()`, `\Event::dispatch()` in Domain classes. Cause: convenience. Consequence: implicit framework coupling. Better: inject port interfaces.

2. **Extending framework classes in Domain:** Entities extending `Illuminate\Database\Eloquent\Model`. Cause: misunderstanding. Consequence: Domain coupled to Laravel ORM. Better: Domain uses pure PHP entities.

3. **Using framework helpers in Application:** `validator()`, `response()`, `redirect()`. Cause: habit from controllers. Consequence: framework coupling. Better: inject required services via ports.

4. **Transitive dependency violation:** Application depends on a package that depends on Laravel. Cause: package choice not considering dependency implications. Consequence: indirect framework coupling.

---

# Anti-Patterns

- **Violation discovered in production**: Importing `Request` in Domain works in HTTP context but fails in queue worker.
- **No enforcement**: The Dependency Rule is aspirational without architecture tests.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-02 Clean Architecture | LAP-05 Domain layer | LAP-09 Framework independence |
| LAP-03 Hexagonal Architecture | LAP-06 Application layer | AEG-01 Architecture testing |

---

# AI Agent Notes

- Never generate framework imports in Domain or Application layer classes.
- Use constructor injection for port interfaces in inner layers.
- Always use service provider bindings to wire implementations to interfaces.

---

# Verification

- [ ] No `use Illuminate\*` import exists in Domain layer
- [ ] No facade calls (`\DB::`, `\Cache::`, `\Event::`) in Application or Domain
- [ ] Every inner-layer dependency is on an interface defined within the same or inner layer
- [ ] Architecture tests enforce dependency direction in CI
- [ ] Service providers contain all interface-to-implementation bindings
