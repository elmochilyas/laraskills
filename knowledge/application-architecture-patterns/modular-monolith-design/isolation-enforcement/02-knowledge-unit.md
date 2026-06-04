# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module isolation enforcement: linting and CI rules
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Module isolation enforcement is the practice of using automated tools to detect and prevent violations of module boundaries. Without enforcement, modular structure degrades over time as developers take shortcuts—importing implementation classes from other modules, querying cross-module tables, or creating circular dependencies. Enforcement combines architecture tests (Pest/PHPUnit), static analysis (PHPStan custom rules), and CI checks that run on every PR. Enforcement is what makes a modular monolith real rather than aspirational.

---

# Core Concepts

**What to enforce:**
- Module A cannot import implementation classes from Module B (only contracts)
- Module A cannot query Module B's database tables directly
- Module dependency declarations in `module.json` match actual imports
- No circular dependencies between modules

**Enforcement layers:**
1. **Static analysis:** PHPStan rules catch import violations at analysis time
2. **Architecture tests:** Pest tests verify namespace and dependency rules
3. **CI checks:** Custom scripts run dependency validation and graph verification

---

# Mental Models

**The "Architecture Police" model:** Automated checks are the police. They don't prevent violations in development, but they catch them before merge. Violations that reach main are failures of the CI process.

**The "Shift Left" model:** Catch violations as early as possible. Static analysis (PHPStan) catches during development (IDE integration). Tests catch during PR CI. Production incidents mean earlier layers failed.

**The "Guardrail, Not Cage" model:** Enforcement should prevent accidental violations, not prevent intentional architectural changes. Exceptions should be possible with explicit opt-in (PHPStan ignore lines, test whitelists).

---

# Internal Mechanics

**PHPStan custom rule for module isolation:**
```neon
// phpstan.neon
rules:
 - Modules\Architecture\Rules\NoCrossModuleImplementationImportRule

parameters:
    moduleDirectories:
        - modules/Billing
        - modules/Catalog
    contractPaths:
        - modules/*/Contracts
```

**Pest architecture test:**
```php
test('Catalog module only uses contracts from other modules')
    ->expect('Modules\Catalog')
    ->toOnlyUse(['Modules\Catalog', 'Modules\Billing\Contracts', 'Shared', 'Illuminate'])
    ->ignoring(['Modules\Billing', 'Modules\Catalog']); // internal is fine
```

**CI dependency check:**
```bash
modulate:lint  # Checks cross-module imports and database access
```

---

# Patterns

**Contract-only import rule:** Modules can only import from other modules' `Contracts/` namespaces, never from `Services/`, `Models/`, `Http/`, etc.

**Database table ownership rule:** Each module owns specific database table prefixes. Queries against tables owned by other modules are flagged.

**Dependency graph cycle detection:** CI runs a script that builds the module dependency graph and fails if cycles are detected.

---

# Architectural Decisions

**Enforce strictly from the start:** It's easier to start strict and relax than to introduce enforcement later (which requires fixing existing violations).

**Baseline existing violations:** When introducing enforcement to an existing codebase, create a baseline of current violations and only block new ones.

**Whitelist mechanism:** Allow explicit whitelisting for legitimate cross-module imports (rare exceptions) with required justification.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Module boundaries stay real | Initial enforcement setup takes effort | Writing PHPStan rules, arch tests, CI scripts |
| Violations caught in CI | False positives require rule tuning | Legitimate imports must be whitelisted |
| Architecture documentation as code | Enforcement adds CI time | Full dependency analysis adds 10-30s to CI |
| New developers learn boundaries from failures | Can feel restrictive | "Why does my import fail?" becomes a learning moment |

---

# Performance Considerations

Enforcement runs offline (CI, local development). No runtime performance impact.

---

# Production Considerations

Enforcement is useless if it's not blocking. If the CI step is allowed to fail, it will always fail and be ignored. Make enforcement a required check.

---

# Common Mistakes

**No enforcement:** The modular structure exists but anyone can import anything. Within 3 months, the modules are just folders.

**Only testing one direction:** Testing that Domain doesn't depend on Infrastructure, but missing cross-module import violations.

**Over-relying on directory structure:** Assuming that because a file is in `Modules/Billing/`, it won't be imported from `Modules/Catalog/`. Code provides no protection—only enforcement does.

---

# Failure Modes

**Enforcement paralysis:** So many rules that every PR is blocked. Team bypasses enforcement by disabling it rather than fixing violations.

**Stale baseline:** The baseline of "acceptable" violations grows over time. New violations are added to the baseline instead of being fixed. Enforcement becomes meaningless.

---

# Ecosystem Usage

The `Modulate` package is the only first-class modular monolith enforcement package for Laravel. It provides `modulate:lint` for cross-module import and database access checks.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-09 Module dependency mgmt | AEG-01 Architecture testing | AEG-03 PHPStan custom rules |
| MMD-06 Sync inter-module comm | AEG-02 CI enforcement | AEG-08 Drift detection |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
