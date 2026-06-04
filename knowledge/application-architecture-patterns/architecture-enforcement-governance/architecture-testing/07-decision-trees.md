# Decision Trees: Architecture Testing (Pest Tests for Architecture Rules)

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** Architecture testing (Pest tests for architecture rules)
- **Knowledge Unit ID:** AEG-01
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Automated architecture tests vs documentation-only rules | Architecture | Rule enforcement strategy |
| 2 | Pest architecture tests vs custom PHPStan rules | Architecture | Rule enforcement mechanism |
| 3 | Strict rules (start strict, loosen with `->ignoring()`) vs loose rules (tighten later) | Architecture | Rule strictness approach |

---

## Decision 1: Automated architecture tests vs documentation-only rules

### Context
Architecture rules can exist as documentation (wiki, README, ADRs) or as automated tests that run on every CI run. Documentation-only rules rely on developers reading and remembering them. Automated tests encode rules as code and catch violations immediately.

### Decision Tree

```
What is the nature of the rule?
├── A structural rule that can be tested (import direction, naming, layer isolation)
│   → Encode as an automated architecture test
│   Controllers must not import from Models
│   Context A must not import from Context B
│   All services must end with "Service"
│   Automated tests catch violations on every CI run
│   No reliance on developer memory or code review
├── A behavioral rule that can't be tested structurally
│   → Documentation is the only option (but rare)
│   "Always handle exceptions at the controller level"
│   Structural testing can't verify exception handling philosophy
│   Use code review and pair programming to reinforce
└── A transient rule that will be removed soon
    → Documentation may be sufficient
    "Temporarily allow direct Model access from controllers during migration"
    Not worth the investment of an automated test
    Remove the rule entirely when the migration is complete
```

### Rationale
Documentation-only rules are never read and never enforced. Every team has a wiki page called "Architecture Rules" that nobody has opened in months. Automated architecture tests encode rules as executable assertions. When a developer violates a rule, the test fails in CI and the PR is blocked. The cost is minimal (a few lines of code per rule) and the benefit is continuous enforcement without relying on human discipline.

### Recommended Default
Automated architecture tests for every stable, structural architectural rule

### Risks
- Documentation-only: rules ignored, architecture erodes silently
- Tests for transient rules: investment wasted when rule is removed
- Tests for behavioral rules: can't verify philosophy, false sense of security

### Related Rules
- Encode Architectural Rules As Automated Pest Architecture Tests (AEG-01/05-rules.md)
- Run Architecture Tests On Every PR As A Pre-Merge Gate (AEG-01/05-rules.md)
- Define All Architecture Tests In `tests/Architecture/` (AEG-01/05-rules.md)

### Related Skills
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)
- Record Architecture Decision Records (AEG-06/06-skills.md)

---

## Decision 2: Pest architecture tests vs custom PHPStan rules

### Decision Tree

```
What kind of constraint does the rule express?
├── Structural or import constraint (namespace, import direction, naming)
│   → Use Pest architecture test
│   Examples:
│   ├── "Controllers may not depend on Models"
│   ├── "Context A may not import from Context B"
│   └── "All controllers must end with 'Controller'"
│   Pest syntax is 1-3 lines, simple, readable
├── Type-level constraint (return types, method calls, interface impl.)
│   → Use custom PHPStan rule
│   Examples:
│   ├── "Services must return Collection, not Eloquent\Collection"
│   ├── "Repositories must implement RepositoryInterface"
│   └── "No direct Facade calls in Services"
│   PHPStan can inspect AST node types and method signatures
└── Does the constraint naturally fit both mechanisms?
    → Choose ONE — never duplicate
    Prefer Pest for structural rules
    Prefer PHPStan for type-level rules
    Duplicate rules must be kept in sync — creates maintenance burden
```

### Rationale
Pest architecture tests are the default because they're simpler, more readable, and sufficient for the majority of architectural rules. A Pest test like `expect('App\Http\Controllers')->not->toUse('App\Models')` is self-documenting and easy to maintain. Custom PHPStan rules require deeper expertise, more code to maintain, and are harder to debug. Reserve PHPStan for rules that Pest cannot express — primarily type-level constraints that require AST analysis (checking return types, method signatures, interface implementations).

### Recommended Default
Pest architecture tests for structural rules; PHPStan only for type-level constraints

### Risks
- PHPStan for everything: unnecessary complexity, harder to maintain
- Duplicate rules: inconsistency when one is updated and the other isn't
- No enforcement at all: rules exist in neither Pest nor PHPStan

### Related Rules
- Default To Pest Architecture Tests Over Custom PHPStan Rules (AEG-03/05-rules.md)
- Never Duplicate Rules Across Pest And PHPStan (AEG-03/05-rules.md)
- Use Static Analysis For Type-Level Architecture Constraints (AEG-03/05-rules.md)

### Related Skills
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Configure Static Analysis Rules (AEG-03/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)

---

## Decision 3: Strict rules (loosen with `->ignoring()`) vs loose rules (tighten later)

### Decision Tree

```
What is the state of the codebase?
├── Greenfield (new project, no existing violations)
│   → Start with strict rules — cover every known rule
│   No existing violations to accommodate
│   Strict from day one prevents architecture erosion
│   If a legitimate exception arises, add `->ignoring()` with a reason
│   This approach reveals true architecture violations immediately
├── Brownfield (existing code with violations)
│   → Two approaches:
│   ├── Baseline existing violations, enforce strict for new code
│   │   Record current violations as a baseline
│   │   New PRs must not introduce violations above the baseline
│   │   Reduce baseline over time
│   │   Pros: doesn't block development, reduces violations gradually
│   │   Cons: existing violations remain visible in reports
│   └── Strict immediately with `->ignoring()` for each existing violation
│       Add each existing violation to the ignore list
│       Pros: all violations explicitly documented
│       Cons: large ignore list, PR for every exception
└── Is the team likely to disable tests if they block all PRs?
    ├── YES → Baseline approach is safer
    │   Strict rules on a brownfield project cause frustration
    │   Developers may disable or remove the rules entirely
    └── NO → Strict with ignores is acceptable
        Team understands the long-term value of architecture tests
```

### Rationale
Starting strict and loosening with `->ignoring()` is easier than starting loose and tightening later. Tightening a loose rule requires finding all existing violations in the codebase and fixing them — often a massive effort that never happens. Adding `->ignoring()` for legitimate exceptions is a deliberate action that documents the exception. For brownfield projects with many existing violations, baselining is the pragmatic approach — record current violations, prevent new ones, and reduce the baseline over time.

### Recommended Default
Start strict for greenfield; baseline existing violations for brownfield

### Risks
- Too strict on brownfield: team disables rules, architecture tests lose credibility
- Too loose: rules are ineffective, violations accumulate
- Ignore list stale: exceptions not reviewed, hide new violations

### Related Rules
- Start With Strict Rules And Loosen With `->ignoring()` (AEG-01/05-rules.md)
- Review The Architecture Test Exception List Periodically (AEG-01/05-rules.md)
- Baseline Existing Violations Before Introducing New Strict Rules (AEG-02/05-rules.md)

### Related Skills
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)
- Implement Drift Detection (AEG-08/06-skills.md)
