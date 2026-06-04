# Decision Trees: Static Analysis Rules for Architecture

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** Static analysis rules for architecture
- **Knowledge Unit ID:** AEG-03
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Pest architecture tests vs custom PHPStan rules | Architecture | Rule enforcement mechanism selection |
| 2 | Single enforcement mechanism vs duplicate (Pest + PHPStan) | Architecture | Rule coverage strategy |
| 3 | Pattern-based rules vs specific-class-name rules | Architecture | Rule implementation strategy |

---

## Decision 1: Pest architecture tests vs custom PHPStan rules

### Context
Pest architecture tests check structural constraints (namespace, import direction, naming). Custom PHPStan rules check type-level constraints (return types, method calls, interface implementation). Both can enforce architecture rules, but they have different strengths. Pest is simpler and more readable. PHPStan is more powerful but more complex.

### Decision Tree

```
What does the constraint check?
├── Namespace or import direction (structural)
│   → Use Pest architecture test
│   "Services may not use Models"
│   "Context A may not import from Context B"
│   "Controllers must end with 'Controller'"
│   Pest syntax: `expect('...')->not->toUse('...')`
│   Simple, readable, 1-3 lines per rule
├── Type, method call, or interface implementation (AST-level)
│   → Use custom PHPStan rule
│   "Repositories must return Collection, not Eloquent\Collection"
│   "Services must not call `::all()` on Models"
│   "All DTOs must implement DTOInterface"
│   PHPStan inspects AST nodes — can verify types and method calls
├── Both structural and type-level
│   → Split into two rules, one per mechanism
│   Structural part → Pest
│   Type-level part → PHPStan
│   └── Is this a simple disallowed call or class?
│       ├── YES → Use `spaze/phpstan-disallowed-calls`
│       │   Declarative config in phpstan.neon, no custom rule needed
│       └── NO → Custom PHPStan rule
└── Does the simpler mechanism (Pest) cover it?
    ├── YES → Prefer Pest
    └── NO → PHPStan is justified
```

### Rationale
Pest architecture tests are the default because they handle 80%+ of architecture constraints with minimal effort. A Pest test is 1-3 lines of readable code. A custom PHPStan rule is 30-100+ lines of PHP class plus registration in phpstan.neon. The extra complexity is only justified when the constraint requires AST-level analysis — checking return types, method parameters, interface implementations, or method calls. `spaze/phpstan-disallowed-calls` covers many common cases declaratively without custom rules.

### Recommended Default
Pest for structural rules; PHPStan only for type-level rules Pest cannot express

### Risks
- PHPStan for structural rules: 10x effort for same result, harder to maintain
- Pest for type-level rules: impossible — Pest doesn't check method signatures
- No $→ignoring() mechanism: exceptions require modifying the PHPStan rule

### Related Rules
- Default To Pest Architecture Tests Over Custom PHPStan Rules (AEG-03/05-rules.md)
- Never Duplicate Rules Across Pest And PHPStan (AEG-03/05-rules.md)
- Use `spaze/phpstan-disallowed-calls` (AEG-03/05-rules.md)

### Related Skills
- Configure Static Analysis Rules for Architecture Enforcement (AEG-03/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)

---

## Decision 2: Single enforcement mechanism vs duplicate (Pest + PHPStan)

### Decision Tree

```
Does another mechanism already enforce this constraint?
├── YES — a Pest test already covers it
│   → Do NOT add a PHPStan rule for the same constraint
│   Duplicate rules create:
│   ├── Maintenance burden (must update both when rule changes)
│   ├── Inconsistency risk (one updated, other not)
│   └── Confusion (which one is authoritative?)
│   Choose ONE mechanism per rule
├── YES — a PHPStan rule already covers it
│   → Do NOT add a Pest test for the same constraint
│   Same reasoning as above
└── NO — it's a new constraint
    → Choose the right mechanism (Decision 1 above)
    └── Does the constraint have two aspects?
        ├── Structural aspect → Pest
        ├── Type-level aspect → PHPStan
        └── Both → Two separate rules, one per mechanism
            Different aspects, different enforcement
            Not duplication — they check different things
```

### Rationale
Duplicate rules are a maintenance anti-pattern. When a rule changes, both implementations must be updated. In practice, only one is updated and the other becomes stale, creating inconsistency. Developers lose trust in both mechanisms when they contradict each other. The rule is: one constraint, one enforcement mechanism. If a constraint has both structural and type-level aspects, they are two separate constraints and should be two separate rules, each using the appropriate mechanism.

### Recommended Default
One constraint, one enforcement mechanism — never duplicate

### Risks
- Duplicate rules: maintenance burden, inconsistency, confusion
- Missing coverage: constraint has two aspects but only one is covered
- Overlapping scope: Pest and PHPStan partly cover the same constraint

### Related Rules
- Never Duplicate Rules Across Pest And PHPStan (AEG-03/05-rules.md)
- Default To Pest Architecture Tests Over Custom PHPStan Rules (AEG-03/05-rules.md)
- Use Static Analysis For Type-Level Architecture Constraints (AEG-03/05-rules.md)

### Related Skills
- Configure Static Analysis Rules for Architecture Enforcement (AEG-03/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)

---

## Decision 3: Pattern-based rules vs specific-class-name rules

### Decision Tree

```
What does the rule enforce?
├── An architectural pattern (namespace, interface, suffix convention)
│   → Use pattern-based rule — check the architectural abstraction
│   Examples:
│   ├── "All classes in App\Repositories must implement RepositoryInterface"
│   │   Checks by namespace/contract, not by specific class name
│   ├── "All classes in App\Services must return Collection"
│   │   Checks by namespace, not by individual service name
│   └── Rule survives refactoring — class can be renamed without breaking the rule
├── A specific class or method name
│   → Use disallowed calls config for simple cases
│   `spaze/phpstan-disallowed-calls` in phpstan.neon
│   Examples:
│   ├── "No calls to `dd()` or `dump()`"
│   ├── "No direct access to `Auth::user()` in Services"
│   └── Good for disallowing specific methods/functions
└── A specific class name that is likely to change
    → NOT pattern-based — fragile
    "Class OrderService must not call class OrderModel"
    If either class is renamed, the rule breaks silently
    Better: "Classes in App\Services must not use App\Models"
    Pattern-based rules survive refactoring
```

### Rationale
Pattern-based rules check architectural abstractions (namespace, interface, suffix) rather than specific class names. When a class is renamed or refactored, a pattern-based rule still applies. A rule that says "Services may not import Models" still works when `OrderService` is renamed to `OrderManagementService`. A rule that says "OrderService may not import OrderModel" breaks after the rename. Pattern-based rules are also easier to reason about — they enforce the architecture, not specific names.

### Recommended Default
Pattern-based rules (check by namespace, interface, suffix); use `spaze/phpstan-disallowed-calls` for specific forbidden methods

### Risks
- Specific class names: breaks on refactoring, silently stops enforcing
- Too-broad patterns: may catch false positives (shared utility classes)
- No pattern at all: rule is a list of class names — impossible to maintain

### Related Rules
- Check Patterns, Not Specific Class Names (AEG-03/05-rules.md)
- Use `spaze/phpstan-disallowed-calls` (AEG-03/05-rules.md)
- Default To Pest Architecture Tests Over Custom PHPStan Rules (AEG-03/05-rules.md)

### Related Skills
- Configure Static Analysis Rules for Architecture Enforcement (AEG-03/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)
- Enforce Dependency Direction (COS-01/06-skills.md)
