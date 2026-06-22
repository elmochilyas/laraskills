# Rules: Calibrated Architecture Language

**Domain:** Application Architecture Patterns
**Subdomain:** Calibrated Architecture Language
**Knowledge Unit:** Calibrated Language Rules

---

## Rule 1: Use Absolute Language Only for Invariants — Rules Where Violation Guarantees Failure

**Category:** Communication

**Rule:** Use "always" and "never" only for rules where violating them produces a guaranteed, predictable failure — security vulnerabilities, data integrity violations, or correctness failures. Examples: "Always use parameterized queries" (SQL injection is guaranteed), "Never store plaintext passwords" (database breach guarantees credential exposure). For all other guidance, use calibrated language.

**Reason:** Absolute language on heuristics erodes trust. When a developer finds a valid exception to an "always" rule, they conclude the guidance is unreliable and ignore all of it — including the actual invariants where violation would cause real harm. Reserve absolute language for rules where no valid exception exists.

**Bad Example:**
```php
// BAD: absolute language on a heuristic — erodes trust
//
// "Always use FormRequest for validation."
//
// Valid exception: CLI command with one parameter doesn't benefit from FormRequest.
// Developer thinks: "This rule is wrong. What other rules are also wrong?"
```

**Good Example:**
```php
// Correct: calibrated language acknowledges exceptions
//
// "Prefer FormRequest for HTTP request validation. Inline validation is acceptable
//  for simple contexts (1-2 fields) or non-HTTP entry points (CLI commands, jobs)."
//
// Developer thinks: "This rule is thoughtful. The exception matches my case."
```

**Exceptions:** Security rules are almost always invariants. Data integrity rules (transactions, mass assignment protection) are almost always invariants. Correctness rules (external API calls inside transactions) are invariants.

**Consequences Of Violation:** Developers discover valid exceptions to "always" rules and lose trust in all architecture guidance. They start ignoring even the security rules because "those were probably exaggerated too." The architecture document becomes wallpaper.

---

## Rule 2: Use Calibrated Language for Heuristics — Rules That Are Correct in Most but Not All Contexts

**Category:** Communication

**Rule:** For architecture guidance that is correct in the majority of cases but admits justified exceptions, use calibrated vocabulary: "default to," "prefer," "usually," "when appropriate," "avoid unless," "consider," "if the requirement demands it." Document the exceptions or contexts where the alternative is acceptable.

**Reason:** Architecture guidance serves two purposes: setting defaults and documenting trade-offs. Calibrated language achieves both. It tells the developer "this is the right choice 90% of the time, but here's when it's not." This builds trust because the guidance acknowledges its own boundaries.

**Bad Example:**
```php
// BAD: absolute language on a heuristic
//
// "All controllers must be invokable."
//
// Reality: Resource controllers with 7 methods are well-understood. Breaking them
// into 7 invokable controllers adds indirection for no benefit. The rule is wrong.
```

**Good Example:**
```php
// Correct: calibrated language with documented exceptions
//
// "Prefer invokable controllers for single-action endpoints. Resource controllers
//  are appropriate for standard CRUD operations where all 7 REST actions are needed."
//
// Developer: "I have a standard CRUD resource — I'll use a resource controller."
// Also developer: "I have a single report generation endpoint — I'll use invokable."
```

**Exceptions:** The rule itself is about when to use calibrated language. There's no exception to "communicate clearly about strictness."

**Consequences Of Violation:** Architecture guidance becomes either too rigid (forcing suboptimal choices) or too vague (providing no direction at all). In both cases, the guidance is ignored and architecture decisions are made ad-hoc.

---

## Rule 3: Distinguish Invariants and Heuristics Explicitly in All Rule Documents

**Category:** Documentation

**Rule:** In every rules file, skill document, or knowledge unit, explicitly label each rule as "Invariant" or "Heuristic." Invariants use absolute language and signal blocking errors. Heuristics use calibrated language and signal warnings. This distinction must be visible to both human readers and AI agents consuming the rules.

**Reason:** Without explicit labels, readers must infer strictness from word choice alone — which is error-prone, especially for non-native speakers and AI agents. Explicit labeling removes ambiguity and enables tooling (linters, CI checks, agent enforcement) to apply the correct severity.

**Bad Example:**
```markdown
# BAD: ambiguous strictness — is this a hard rule or a suggestion?
Use FormRequest for all validation.
```

**Good Example:**
```markdown
# Correct: explicit strictness classification

## Rule: Prefer FormRequest for HTTP Validation
**Category:** Architecture
**Strictness:** Heuristic
**Rule:** Prefer FormRequest for HTTP request validation. Inline validation is
acceptable for simple contexts (1-2 fields) or non-HTTP entry points.

## Rule: Always Use Parameterized Queries
**Category:** Security
**Strictness:** Invariant
**Rule:** Always use parameterized queries for all database access. Never
interpolate user input into SQL strings.
```

**Exceptions:** Short inline code review comments don't need full classification. But any persisted documentation (rules files, skill docs, knowledge units) should include it.

**Consequences Of Violation:** AI agents apply the same severity to all rules — blocking on heuristics (frustrating developers) or warning on invariants (allowing security vulnerabilities). Human readers can't prioritize which rules to follow when they conflict.

---

## Rule 4: Audit Rules Periodically for Correct Strictness Level

**Category:** Process

**Rule:** Review architecture rules at least quarterly (or after major incidents) to verify that each rule's strictness level remains correct. Rules that were invariants may become heuristics as the system evolves. Rules that were heuristics may need to become invariants based on production incidents. Update calibrated language accordingly.

**Reason:** Architecture is not static. A heuristic like "prefer async processing for webhooks" becomes an invariant after a production outage caused by synchronous webhook processing. Conversely, an "always use X library" rule becomes heuristic when the library is deprecated and alternatives emerge. Periodic review keeps guidance accurate.

**Good Example:**
```php
// Before incident: heuristic
// "Prefer idempotent webhook handlers." (was a recommendation)

// After double-charge incident: invariant
// "Webhook handlers must use idempotent operations (updateOrCreate/upsert).
//  Never use plain create() in webhook handlers. This is an invariant —
//  violation guarantees duplicate charges on retry."
```

**Exceptions:** Security invariants ("never store plaintext passwords") don't degrade to heuristics over time. They remain invariants permanently. The audit direction is heuristic → invariant, not the reverse.

**Consequences Of Violation:** Rules become stale. Heuristics that should be invariants after incidents remain recommendations. Invariants that are no longer true create unnecessary friction. The rule set loses credibility.

---

## Rule 5: When Justifying a Rule Violation, Document the Rationale

**Category:** Process

**Rule:** When a developer chooses to deviate from a heuristic (or rarely, an invariant with explicit approval), the justification must be documented: what rule is being violated, why the alternative is correct in this context, and who approved the deviation. This creates institutional memory for future rule audits.

**Reason:** Undocumented deviations are indistinguishable from ignorance of the rule. Future developers see the violation and either: (a) assume the rule doesn't apply and copy the violation, or (b) "fix" the violation and break the intentional exception. Documented rationale prevents both outcomes.

**Bad Example:**
```php
// DANGER: undocumented deviation — future developer doesn't know why
// Raw SQL used instead of Eloquent — is this intentional or a mistake?
$results = DB::select("
    WITH RECURSIVE category_tree AS (...)
    SELECT * FROM category_tree
");
```

**Good Example:**
```php
// Correct: documented rationale for rule deviation
//
// Architectural Exception Record (AER-2026-042):
// Rule: "Prefer Eloquent/Query Builder over raw SQL"
// Deviation: Raw SQL with recursive CTE for category tree query
// Rationale: Recursive CTEs are not supported by the Query Builder.
//   The alternative (N+1 queries with PHP recursion) is worse for performance.
//   This raw query uses parameterized bindings — no SQL injection risk.
// Approved by: Architecture Lead, 2026-06-15
// Review: Revisit if Query Builder adds CTE support

$results = DB::select("
    WITH RECURSIVE category_tree AS (
        SELECT id, name, parent_id, 1 as depth FROM categories WHERE parent_id IS NULL
        UNION ALL
        SELECT c.id, c.name, c.parent_id, ct.depth + 1
        FROM categories c JOIN category_tree ct ON ct.id = c.parent_id
    )
    SELECT * FROM category_tree ORDER BY depth, name
");
```

**Exceptions:** Trivial deviations that are self-documenting (using a one-line raw query with parameterized bindings for a database-specific feature) don't need a formal AER. Use judgment.

**Consequences Of Violation:** Deviation patterns spread unchecked. Half the codebase follows the rule, half doesn't. Code reviews spend time debating whether a deviation is intentional or accidental. Rule audits cannot distinguish good exceptions from bad patterns.
