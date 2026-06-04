# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Architecture tests to enforce layer boundaries
Knowledge Unit ID: LAP-13
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Architecture tests verify the codebase's structure against architectural rules. In layered architectures, these assert that Domain classes don't import Infrastructure, Application classes don't depend on Presentation, and the Dependency Rule is respected. Without architecture tests, layered architecture is aspirational — violations accumulate until boundaries are meaningless.

---

# Core Concepts

- **Layer dependency tests**: Assert code in one namespace doesn't import from forbidden namespaces.
- **Import violation detection**: Each file's `use` statements checked against allowed dependencies per layer.
- **Module isolation tests**: Assert one module only uses public contracts from another module.
- **Dependency whitelist**: List allowed namespaces per layer — everything else is forbidden (stricter than blacklisting).

---

# When To Use

- More than one architectural layer (beyond MVC)
- Team size >5
- Application expected to live >2 years
- Any layered architecture beyond three-layer

---

# When NOT To Use

- Single developer on simple CRUD
- Prototype or experimental project
- Architecture simple enough that violations are self-correcting
- No architectural layers to enforce

---

# Best Practices

- **Write architecture tests before they're needed.** WHY: Adding arch tests after violations exist requires baselining. Start enforcement before violations appear.
- **Use dependency whitelist (not blacklist).** WHY: Whitelisting allowed namespaces is stricter and more maintainable. Blacklists miss unknown forbidden dependencies.
- **Baseline existing violations when introducing tests to legacy code.** WHY: Allow CI to fail only on NEW violations. This enables incremental adoption without blocking development.
- **Run arch tests in CI as a blocking check.** WHY: Architecture tests prevent drift at merge time. Without CI enforcement, they become optional discipline.
- **Combine Pest arch tests with PHPStan custom rules.** WHY: Pest checks `use` statements; PHPStan catches Facade calls (`DB::table()`) that don't appear in imports.

---

# Architecture Guidelines

- Each layer defined by namespace prefix — tests check prefixes against allowed dependencies.
- Domain namespace should have zero allowed dependencies (no `use` imports).
- Application namespace should only depend on Domain.
- Infrastructure and Presentation can depend on Application and Domain, not each other.
- Architecture tests are living documentation — new developers learn architecture from them.

---

# Performance Considerations

- Architecture tests parse source files via AST traversal — adds 1-3 seconds for large codebases (>500 files).
- Run as separate CI job or with `--arch` flag, not with every test run.
- Each arch test adds ~5-10ms overhead.

---

# Security Considerations

- Architecture tests do not directly affect security.
- They prevent Domain/Access layer violations that could accidentally expose infrastructure concerns.

---

# Common Mistakes

1. **No architecture tests:** Sophisticated structure but no enforcement. Cause: assuming directory structure alone provides boundaries. Consequence: architecture degrades within weeks. Better: write arch tests from the start.

2. **Only checking Domain isolation:** Tests ensure Domain doesn't depend on Infrastructure but miss Application → Infrastructure violations. Cause: focusing on most obvious boundary. Consequence: partial enforcement, hidden coupling.

3. **Too permissive rules:** Whitelisting `Illuminate\*` for all layers. Cause: convenience. Consequence: defeats purpose — Domain imports `Illuminate\Support\Collection` without failing. Better: allow only specific `Illuminate` classes per layer.

4. **Architecture test rot:** Tests never updated when architecture evolves. Cause: no maintenance plan. Consequence: tests fail constantly (get disabled) or pass when they shouldn't.

---

# Anti-Patterns

- **False sense of security**: Tests only check `use` statements — Domain could call `DB::table()` via Facade (global access). PHPStan catches this.
- **Architecture test abandonment**: Tests that fail in CI and get disabled rather than fixed.

---

# Examples

```php
arch('domain')->expect('App\Domain')->toOnlyUse([]);
arch('application')->expect('App\Application')->toOnlyUse(['App\Domain']);
arch('presentation')->expect('App\Http')->toOnlyUse(['App\Application', 'App\Domain', 'Illuminate\Http']);
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-04 Dependency Rule | AEG-02 CI enforcement | AEG-03 PHPStan/Psalm rules |
| LAP-02 Clean Architecture | AEG-05 Import violation detection | AEG-08 Drift detection |

---

# AI Agent Notes

- Generate architecture tests alongside layered code — include Pest arch tests for each layer.
- Use whitelist approach for allowed dependencies.
- Domain layer tests should assert zero dependencies on framework namespaces.

---

# Verification

- [ ] Architecture tests exist for each layer boundary
- [ ] All `Illuminate` imports are whitelisted per-layer with specific classes
- [ ] Architecture tests run in CI as blocking checks
- [ ] Baseline exists for legacy violations
- [ ] Tests are updated when architecture evolves
