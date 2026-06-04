# Decision Trees: Module Isolation Enforcement

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Module isolation enforcement: linting and CI rules
- **Knowledge Unit ID:** MMD-12
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Start strict and relax vs add enforcement later | Enforcement | Project inception |
| 2 | Required vs optional CI enforcement | CI/CD | CI setup |
| 3 | PHPStan custom rules vs Pest architecture tests | Enforcement | Tool choice |

---

## Decision 1: Start strict and relax vs add enforcement later

### Context
Module isolation enforcement should be in place from day one — before the second module is created. Starting strict is easy (no existing violations). Adding enforcement later to a codebase with existing violations requires creating baselines, fixing historical issues, and overcoming developer resistance.

### Decision Tree

```
How many modules exist currently?
├── 0-1 → Start strict — no existing violations to fix
│   Set up enforcement before creating the second module
├── 2-5 → Enforcement should still be introduced now
│   Create a baseline of current violations
│   Block NEW violations only
│   Require baseline to shrink over time
└── 6+ → Introduce enforcement with baseline immediately
    Audit all existing violations
    Prioritize fixes (blocking violations first)
    Track trend line
```

### Rationale
Starting strict is the low-cost option. Once violations exist, enforcement introduction requires baselining, which increases complexity significantly. The cost of fixing 10 violations at project start is negligible compared to fixing 150 violations in a mature codebase.

### Recommended Default
Start strict from day one; baseline existing violations for legacy codebases

### Risks
- Starting with no enforcement: 3 months later modules are just folders
- Adding enforcement to 150 violations: team disables enforcement because too many blocks
- Baseline that never shrinks: acceptable violations become permanent

### Related Rules
- Enforce From Day One (MMD-12/05-rules.md)
- Baseline Existing Violations (MMD-12/05-rules.md)
- Enforcement Must Be Required CI Check (MMD-12/05-rules.md)

### Related Skills
- Enforce Module Isolation with Automated Checks (MMD-12/06-skills.md)
- Write Architecture Tests (LAP-13/06-skills.md)
- Set Up Static Analysis Rules (AEG-03/06-skills.md)

---

## Decision 2: Required vs optional CI enforcement

### Context
Module isolation enforcement must be a required CI step that blocks PR merges. If the step is allowed to fail (continue-on-error), it will always fail and be ignored. Within months, the enforcement system is non-functional.

### Decision Tree

```
Is the enforcement step allowed to fail in CI?
├── YES (continue-on-error)
│   Does the team have documented discipline to review failures?
│   ├── YES (unlikely sustainable) → May work short-term, but violations will grow
│   └── NO (typical) → Enforcement will be ignored; violations grow unchecked
│       → Make enforcement a REQUIRED step that blocks merge
└── NO (step blocks merge)
    Is there a process for legitimate whitelisting?
    ├── YES → Strong enforcement — violations are caught and managed
    └── NO → Add whitelisting with justification to prevent developer frustration
```

### Rationale
Optional enforcement is not enforcement. Human discipline is insufficient — under deadline pressure, developers will skip fixes. Required CI checks shift the decision from "should I fix this now?" to "I cannot merge until this is fixed." Whitelisting with justification provides escape valve for legitimate exceptions.

### Recommended Default
Required CI check (blocks merge) with explicit whitelisting process

### Risks
- Optional enforcement: step ignored, violations grow unchecked
- Required with no whitelisting: legitimate exceptions blocked, frustrated team
- Required with permanent whitelisting: whitelist becomes the new normal

### Related Rules
- Enforcement Must Be Required CI Check (MMD-12/05-rules.md)
- Baseline Existing Violations (MMD-12/05-rules.md)
- Whitelist Exceptions with Justification (MMD-12/05-rules.md)

### Related Skills
- Enforce Module Isolation with Automated Checks (MMD-12/06-skills.md)
- Configure CI Enforcement (AEG-02/06-skills.md)

---

## Decision 3: PHPStan custom rules vs Pest architecture tests

### Context
Two primary enforcement mechanisms: PHPStan custom rules (static analysis, catches violations at analysis time) and Pest architecture tests (runtime tests, catches violations during test execution). Both are needed for defense in depth — PHPStan catches import-level violations, Pest tests catch broader architectural assertions.

### Decision Tree

```
What type of violation are you catching?
├── Import-level (class A imports from module B's Services/)
│   → PHPStan custom rules (fast, catches at analysis time)
│   Can you write a PHPStan rule for this pattern?
│   ├── YES → Use PHPStan (faster feedback loop)
│   └── NO → Fall back to Pest architecture tests
├── Database-level (query references another module's table)
│   → PHPStan custom rules + database-level permissions
│   PHPStan catches code references; DB permissions catch runtime access
└── Architectural (dependency cycle, namespace violations)
    → Pest architecture tests (broader, more expressive assertions)
    Use both: PHPStan for fast feedback on imports
    Pest for comprehensive architectural assertions
```

### Rationale
PHPStan provides faster feedback (during IDE, pre-commit hook) compared to running the full test suite. Pest architecture tests are more expressive and catch patterns PHPStan can't easily detect. Using both provides defense in depth: PHPStan catches common violations immediately, Pest catches remaining violations in CI.

### Recommended Default
Both: PHPStan custom rules for import checks + Pest tests for architectural assertions

### Risks
- PHPStan only: complex architectural patterns (circular event cycles) not caught
- Pest only: feedback is slower (must run test suite)
- Neither: no enforcement at all

### Related Rules
- Enforce From Day One (MMD-12/05-rules.md)
- Enforce Contract-Only Imports (MMD-12/05-rules.md)
- Enforce Database Table Ownership (MMD-12/05-rules.md)
- Detect Circular Dependencies Automatically (MMD-12/05-rules.md)

### Related Skills
- Enforce Module Isolation with Automated Checks (MMD-12/06-skills.md)
- Write Architecture Tests (LAP-13/06-skills.md)
- Set Up Static Analysis Rules (AEG-03/06-skills.md)
- Configure CI Enforcement (AEG-02/06-skills.md)
