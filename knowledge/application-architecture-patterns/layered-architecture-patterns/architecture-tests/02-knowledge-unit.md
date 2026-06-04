# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Architecture tests to enforce layer boundaries
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Architecture tests are automated tests that verify the codebase's structure against architectural rules. In layered architectures, these tests assert that Domain classes don't import Infrastructure classes, that Application classes don't depend on Presentation classes, and that the Dependency Rule is respected. Without architecture tests, layered architecture is aspirational—violations accumulate until the boundaries are meaningless. Pest's architecture testing features and PHPStan custom rules are the primary tools for this enforcement in Laravel.

---

# Core Concepts

**Layer dependency tests:** Assert that code in one namespace doesn't import from certain forbidden namespaces:
```php
// Domain should not depend on Infrastructure
test('domain does not depend on infrastructure')
    ->expect('App\Domain')
    ->not->toUse('App\Infrastructure');
test('domain does not depend on Laravel')
    ->expect('App\Domain')
    ->not->toUse('Illuminate');
```

**Import violation detection:** Each file's `use` statements are checked against a whitelist of allowed dependencies per layer.

**Module isolation tests:** Assert that one module doesn't import from another module's internal namespace (only through contracts).

---

# Mental Models

**The "Guardian of Architecture" model:** Architecture tests are automated guards that prevent developers from accidentally violating architectural rules. They run in CI and fail the build if a violation is introduced.

**The "Executable Documentation" model:** Architecture tests serve as living documentation of the architectural rules. A new developer can read the tests to understand what dependencies are allowed between layers.

**The "Contract Enforcement" model:** Architecture tests enforce the contract between layers. If the Presentation layer depends on Infrastructure, the test fails, preventing hidden coupling.

---

# Internal Mechanics

Pest's architecture testing API:
```php
// Pest arch test
arch('presentation')
    ->expect('App\Http')
    ->toOnlyUse(['App\Application', 'App\Domain', 'Illuminate\Http']);

arch('application')
    ->expect('App\Application')
    ->toOnlyUse(['App\Domain']);

arch('domain')
    ->expect('App\Domain')
    ->toOnlyUse([]);  // No framework dependencies
    // or ->not->toUse('Illuminate');
```

PHPStan custom rules can check the same constraints at static analysis time:
```php
// PHPStan rule configuration
parameters:
    layerRules:
        Domain:
            forbiddenPrefixes: ['Illuminate', 'App\\Infrastructure', 'App\\Http']
        Application:
            forbiddenPrefixes: ['App\\Infrastructure', 'App\\Http', 'Illuminate\\Http']
```

---

# Patterns

**Namespace-based layer detection:** Each layer is defined by its namespace prefix. Tests check namespace prefixes against allowed dependencies.

**Dependency whitelist approach:** For each layer, list the namespaces it IS allowed to depend on. Everything else is forbidden. This is stricter and more maintainable than blacklisting.

**Contract-only cross-module access:** Tests assert that Module A only uses public interfaces (contracts) from Module B, never internal classes.

---

# Architectural Decisions

**Write architecture tests when:** You have more than one architectural layer (beyond MVC), team size is >5, or the application is expected to live >2 years.

**Skip architecture tests when:** Single developer working on a simple CRUD app, prototype/experimental project, or the architecture is simple enough that violations are self-correcting.

**Use Pest arch tests for:** Simple dependency rules, layer isolation, module boundaries.

**Use PHPStan custom rules for:** More complex rules (method visibility patterns, naming conventions, forbidden function calls).

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Architectural rules are automatically enforced | Tests must be maintained as architecture evolves | Adding a new layer means updating arch tests |
| Architecture is documented as code | False positives require rule adjustment | Legitimate dependencies need whitelisting |
| CI fails on violations, preventing drift | Initial setup requires understanding all current dependencies | Existing violations must be resolved first |
| New developers learn architecture from tests | Tests slow down the test suite slightly | Each arch test adds ~5-10ms |

---

# Performance Considerations

Architecture tests parse all source files (via `expect()` → AST traversal). For large codebases (>500 files), arch tests can add 1-3 seconds to the test suite. Run them only when `--arch` flag is present or as a separate CI job.

---

# Production Considerations

Run architecture tests in CI as a blocking check. They should run fast (<30 seconds) and fail the build immediately on violation.

Baseline existing violations: when introducing architecture tests to an existing codebase, create a baseline of current violations and allow the CI to fail only on NEW violations. This enables incremental adoption.

---

# Common Mistakes

**No architecture tests:** The most common mistake—having a sophisticated directory structure but no enforcement. Architecture degrades within weeks.

**Only checking domain isolation:** Tests ensure Domain doesn't depend on Infrastructure but miss Application → Infrastructure or Presentation → Infrastructure violations.

**Too permissive rules:** Whitelisting `Illuminate\*` for all layers. This defeats the purpose—allow only the specific `Illuminate` classes each layer needs.

---

# Failure Modes

**Architecture test rot:** Tests that are never updated when the architecture evolves. They either fail constantly (and get disabled) or pass when they shouldn't.

**False sense of security:** Architecture tests only check `use` statements. A Domain class could still call `DB::table()` via Facade without importing it (global access). PHPStan catches this.

---

# Ecosystem Usage

Pest 3+ has built-in architecture testing. `nunomaduro/larastan` provides PHPStan for Laravel with custom rules. The `Modulate` package includes an architecture violation checker. `kubawerlos/php-never-cache` and similar packages provide additional architecture enforcement.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-04 Dependency Rule | AEG-02 CI enforcement | AEG-03 PHPStan/Psalm rules |
| LAP-02 Clean Architecture | AEG-05 Import violation detection | AEG-08 Drift detection |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche�most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
