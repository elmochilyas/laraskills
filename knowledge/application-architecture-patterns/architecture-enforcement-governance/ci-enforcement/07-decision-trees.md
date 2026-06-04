# Decision Trees: CI Enforcement of Architecture Rules

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** CI enforcement of architecture rules
- **Knowledge Unit ID:** AEG-02
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Hard gate (block merge) vs soft gate (warn only) | Architecture | CI enforcement severity |
| 2 | Greenfield strict vs brownfield baseline | Architecture | Enforcement approach by codebase age |
| 3 | Separate CI job vs bundled with main test suite | Architecture | CI job design |

---

## Decision 1: Hard gate (block merge) vs soft gate (warn only)

### Context
When architecture tests fail in CI, two responses are possible: block the PR from merging (hard gate) or warn with a comment but allow the merge (soft gate). A hard gate forces the developer to fix the violation or change the rule deliberately. A soft gate provides information but doesn't prevent the violation from reaching the main branch.

### Decision Tree

```
What happens when an architecture test fails in CI?
├── PR is blocked — cannot merge until fixed
│   → Hard gate
│   Developer must either:
│   ├── Fix the violation (change code to follow the rule)
│   └── Change the rule (if it's no longer valid) via a separate PR
│   No manual override. Architecture stays intact.
│   Pros: violations never reach main branch, rule changes are deliberate
│   Cons: can be frustrating for legitimate exceptions without `->ignoring()`
├── PR is commented but merge is allowed
│   → Soft gate
│   CI posts a comment: "Architecture test X failed in file Y"
│   Developer or reviewer may or may not act on it
│   └── Will the team actually fix violations reported by soft gates?
│       ├── YES (typically) → Soft gate may work for mature, disciplined teams
│       └── NO (typically) → Hard gate is REQUIRED
│           Soft warnings are ignored under time pressure
│           "We'll fix it later" → never happens
└── Tests are local-only (not in CI)
    → No gate at all — architecture tests are optional
    Developers may forget to run them
    Violations reach main branch undetected
    This is worse than either gate
```

### Rationale
Soft gates are ignored. When a developer is under time pressure to merge a PR, a warning comment is easily dismissed. "We'll fix it later" accumulates into architecture debt. A hard gate forces the decision: either fix it now (cost of the violation) or change the rule deliberately (cost of admitting the rule is wrong). Both outcomes are better than ignoring a warning. The hard gate preserves the architecture and forces conscious decisions.

### Recommended Default
Hard gate — block merges on architecture test failure

### Risks
- Soft gate: warnings ignored, violations accumulate
- No gate: architecture tests become optional, never run
- Hard gate with no exceptions mechanism: legitimate violations can't be documented

### Related Rules
- Run Architecture Tests As A Pre-Merge Gate In CI (AEG-02/05-rules.md)
- Document Exemptions Explicitly In A Reviewed File (AEG-02/05-rules.md)
- Baseline Existing Violations Before Introducing New Strict Rules (AEG-02/05-rules.md)

### Related Skills
- Configure CI Enforcement of Architecture Rules (AEG-02/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)

---

## Decision 2: Greenfield strict vs brownfield baseline

### Decision Tree

```
What is the state of the codebase regarding architecture violations?
├── Greenfield (new project) or few violations
│   → Strict from the start
│   No baseline needed — all code already conforms
│   Every new PR must not introduce violations
│   If a rule is wrong, change it via PR — don't add to baseline
│   This keeps the codebase clean from the beginning
├── Brownfield with significant existing violations
│   → Use a baseline approach
│   Steps:
│   1. Run architecture tests against the current codebase
│   2. Record the violation count as the baseline
│   3. CI fails if new violations are introduced ABOVE the baseline
│   4. Work to reduce the baseline over time
│   └── Is the violation count acceptable for a one-time fix?
│       ├── YES (< 50 violations, quick to fix)
│       │   Consider fixing all violations first, then strict from that point
│       └── NO (hundreds of violations)
│           Baseline is the pragmatic choice
│           Fixing all of them would block development for weeks
└── Mixed — some contexts clean, some legacy
    → Apply per-context approach
    Clean contexts: strict enforcement
    Legacy contexts: baseline violations
    New modules in existing contexts: strict from day one
```

### Rationale
Applying strict architecture tests to a brownfield codebase with hundreds of existing violations will cause every PR to fail until all violations are fixed. Developers become frustrated and disable or remove the rules entirely. Baselines solve this by recording the current violation count as acceptable — CI only fails when the count increases. This prevents new violations while allowing gradual reduction of the existing debt. For greenfield projects, there's no existing debt, so strict enforcement is the natural choice.

### Recommended Default
Strict for greenfield; baseline existing violations for brownfield

### Risks
- Strict on brownfield: team disables rules, tests lose credibility
- Baseline never reduced: existing violations become permanent
- No baseline at all: all PRs fail indefinitely

### Related Rules
- Baseline Existing Violations Before Introducing New Strict Rules (AEG-02/05-rules.md)
- Track And Alert On Baseline Violation Degradation (AEG-02/05-rules.md)
- Document Exemptions Explicitly In A Reviewed File (AEG-02/05-rules.md)

### Related Skills
- Configure CI Enforcement of Architecture Rules (AEG-02/06-skills.md)
- Implement Drift Detection (AEG-08/06-skills.md)
- Implement Refactoring and Remediation (AEG-09/06-skills.md)

---

## Decision 3: Separate CI job vs bundled with main test suite

### Decision Tree

```
Where should architecture tests run in the CI pipeline?
├── As a separate, parallel CI job
│   → Recommended approach
│   Architecture tests run independently from unit/feature tests
│   They complete in 1-5 seconds (much faster than full test suite)
│   They run early in the pipeline (fail fast)
│   └── Is the CI workflow greenfield or existing?
│       ├── Greenfield → Easy to add a dedicated architecture job
│       └── Existing → May need to reconfigure CI, but worth it
├── Bundled with the main test suite
│   → Not recommended
│   Architecture tests mixed with unit/feature tests
│   Must wait for entire test suite to run before seeing architecture results
│   Architecture tests may be order-dependent or conflict with feature test setup
│   └── Is the test suite fast (< 2 minutes)?
│       ├── YES → Bundling is less problematic
│       │   But still not ideal — architecture failures should surface immediately
│       └── NO → Separate job is strongly preferred
│           Developer waits 20+ minutes to learn about a trivial import violation
└── Not in CI at all (local only)
    → Architecture tests are effectively optional
    Some developers run them, others don't
    Violations reach main branch undetected
```

### Rationale
Architecture tests are fast (1-5 seconds) and have no dependencies — they inspect source code structure, not runtime behavior. A separate parallel job provides instant feedback: the developer knows within seconds if they've violated a structural rule, while the full test suite continues running. Bundling them with the main test suite forces the developer to wait for the entire suite to learn about a rule violation. Fail fast is the guiding principle — catch the cheapest possible failure (structural) as early as possible.

### Recommended Default
Separate parallel CI job running early in the pipeline

### Risks
- Bundled: slow feedback, architecture failures hidden in large test output
- Not in CI: no enforcement, tests become optional
- Separate but not parallel: blocks on slower jobs if dependencies configured wrong

### Related Rules
- Run Architecture Tests Early In The CI Pipeline (AEG-02/05-rules.md)
- Run Architecture Tests In A Separate Parallel CI Job (AEG-02/05-rules.md)
- Post Architecture Test Violation Details On PRs (AEG-02/05-rules.md)

### Related Skills
- Configure CI Enforcement of Architecture Rules (AEG-02/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Configure Static Analysis Rules (AEG-03/06-skills.md)
