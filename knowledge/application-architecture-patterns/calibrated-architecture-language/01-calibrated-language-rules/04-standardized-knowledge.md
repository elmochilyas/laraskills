# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Calibrated Architecture Language |
| Knowledge Unit | Calibrated Language Rules |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Software Architecture Fundamentals, Communication Best Practices |
| Related KUs | Architecture Enforcement & Governance, Code Organization Standards, Package Decision Calibration |
| Source | domain-analysis.md |

# Overview

Calibrated architecture language is the practice of choosing words that match the strength of a recommendation to the strength of its justification. In architecture guidance, absolute language ("always," "never," "every") signals invariants — rules that, if violated, produce guaranteed failure. Calibrated language ("prefer," "default to," "usually," "consider") signals heuristics — rules that are correct in most cases but admit exceptions when justified. Using absolute language for heuristics erodes trust in all guidance; using calibrated language for invariants understates their importance.

# Core Concepts

- **Calibrated language**: Words that communicate the appropriate level of strictness — "default to," "prefer," "usually," "when appropriate," "avoid unless," "consider," "if the requirement demands it."
- **Absolute language**: Words reserved for rules that have no valid exceptions — "always," "never," "every," "no layer is allowed," "all jobs must."
- **Invariants**: Conditions that must be true in all valid states. Violating an invariant produces a guaranteed failure or security vulnerability. Absolute language is correct here.
- **Heuristics**: Rules that are correct in most contexts but admit justified exceptions. Calibrated language is correct here.
- **Trust erosion**: When absolute language is applied to heuristics, practitioners discover exceptions, conclude the guidance is unreliable, and ignore all of it — including the actual invariants.

# When To Use

- When writing architecture guidelines, rules, coding standards, or agent instructions
- When reviewing architecture documentation for correctness
- When mentoring team members on how to read and interpret architecture guidance
- When defining repository-wide rules that team members must follow
- When writing AI agent skills, rules, or knowledge units that other agents will consume

# When NOT To Use

- In casual conversation or code comments where precision about strictness isn't needed
- For self-evident truths that don't need qualification: "The database must be accessible for queries to work"
- For project-specific team norms where the team has already agreed on the strictness level

# Invariants: When Absolute Language IS Correct

Absolute language is correct ONLY for rules where a violation produces guaranteed, predictable harm. These are invariants — conditions that must hold in every valid state of the system.

## Security Invariants

Security rules are invariants because their violation has a predictable outcome: vulnerability exploitation.

| Rule | Justification |
|------|---------------|
| "Never store plaintext passwords." | Plaintext passwords are guaranteed to be readable by anyone with database access. |
| "Always use parameterized queries." | String-interpolated SQL is guaranteed to be injectable. |
| "Never expose stack traces in production." | Stack traces in production guaranteed to leak system internals to attackers. |
| "Always hash passwords; never encrypt them." | Encryption is reversible; hashing is not. Encrypted passwords are recoverable by anyone with the key. |
| "Never trust user input." | User input from any source (form, API, header, cookie) is guaranteed to be controllable by an attacker. |
| "Always use CSRF protection on state-changing web routes." | Without CSRF, an attacker on any website can forge requests as the victim. |

## Data Integrity Invariants

Data integrity rules are invariants because violations produce corrupt state that is permanently wrong or unrecoverable.

| Rule | Justification |
|------|---------------|
| "Always use transactions for multi-step writes." | Without a transaction, partial writes are guaranteed to persist on failure. |
| "Never use SELECT * in production queries." | SELECT * is guaranteed to break when columns are added, removed, or reordered — and it fetches unnecessary data every time. |
| "Always protect against mass assignment." | Unprotected mass assignment is guaranteed to allow an attacker to set any column on the model. |
| "Never skip foreign key constraints." | Missing constraints are guaranteed to allow orphaned rows, making data untrustworthy. |

## Correctness Invariants

Correctness rules are invariants because violations produce behavior that cannot be reasoned about.

| Rule | Justification |
|------|---------------|
| "Never place external API calls inside uncommitted database transactions unless there is a deliberate compensating action." | If the API call succeeds and the transaction rolls back, the external state is permanently desynchronized from the database. |
| "Never rely on transaction rollback for external API calls." | Rollback does not undo an external API call — the third-party system has already processed it. |
| "Always validate idempotency keys for payment processing." | Without idempotency, a retried payment request can double-charge a customer. |

# Heuristics: Where Calibrated Language Is Correct

Most architecture guidance is heuristic. There are circumstances where the "better" approach is genuinely wrong or impossible. Use calibrated language here.

## Common Corrections

| Absolute (Bad) | Calibrated (Good) | Why |
|----------------|-------------------|-----|
| "Every model gets a policy." | "Default to policies for user-facing models that require authorization." | Utility models, pivot models, and internal-only models may not need policies. |
| "All jobs implement ShouldQueue." | "Jobs that perform slow or external side effects should usually implement ShouldQueue." | A synchronous job that updates a single counter is faster as a direct call than going through the queue infrastructure. |
| "No layer can skip another layer." | "Keep dependencies directional; allow exceptions only when explicitly justified." | A simple passthrough endpoint may not need a full action → service → repository chain. |
| "Always use FormRequest." | "Prefer FormRequest for HTTP validation; inline validation is acceptable for simple or non-HTTP contexts." | A CLI command with one field doesn't benefit from FormRequest abstraction. |
| "Never use facades." | "Prefer dependency injection over facades in business logic; facades are acceptable for infrastructure concerns like Cache and Log." | In a controller that just logs an event, `Log::info()` is more readable than injecting `LoggerInterface`. |
| "All controllers must be invokable." | "Prefer invokable controllers for single-action endpoints; resource controllers are appropriate for CRUD operations." | A resource controller with 7 methods is well-understood; breaking it into 7 invokable controllers adds indirection. |
| "Never use raw SQL." | "Prefer Eloquent or Query Builder; raw SQL is acceptable for complex reporting queries, window functions, or database-specific features." | A recursive CTE for category trees is impractical in the query builder. |

## Calibrated Language Vocabulary

| Phrase | Meaning | When to Use |
|--------|---------|-------------|
| "Default to" | The recommended choice; you need a good reason to do otherwise | When the alternative is valid but the recommended path is better for 90%+ of cases |
| "Prefer" | The better option in most contexts | When there's a clear quality difference between options |
| "Usually" | True in the typical case | When exceptions are common enough to be worth mentioning |
| "When appropriate" | Right in some contexts, wrong in others | When the decision depends on project context |
| "Avoid unless" | The cautioned-against approach is valid but has pitfalls | When the alternative has known gotchas |
| "Consider" | An option worth evaluating | When there are multiple valid approaches and context determines the best one |
| "If the requirement demands it" | Overkill for simple cases but necessary for complex ones | When the approach adds complexity that must be justified |

# How to Evaluate Whether a Rule Is Invariant or Heuristic

Ask three questions:

1. **Is the negative outcome guaranteed?** If violating the rule *always* produces the bad outcome (SQL injection from string interpolation), it's an invariant. If violating *may* produce a bad outcome depending on context (skipping a policy for an internal-only model), it's a heuristic.

2. **Is the negative outcome recoverable?** If violating the rule produces permanent damage (corrupt data, security breach), it's an invariant. If violating produces maintenance cost or technical debt that can be addressed later, it's a heuristic.

3. **Are there any contexts where the rule is wrong?** If you can think of a valid scenario where following the rule would be worse than breaking it, it's a heuristic. If you cannot think of any such scenario, it may be an invariant.

# Architecture Guidelines for AI Agents

AI agents consuming architecture rules must be able to distinguish invariants from heuristics:

- **Invariants**: Must never be violated under any circumstances. Flag as blocking errors. Treat as hard gates.
- **Heuristics**: Prefer following them. Flag violations as warnings, not errors. Require justification for deviation, not prohibition.

When writing rules for AI agents, encode this explicitly:

```markdown
# Bad (ambiguous — is this a hard rule or advice?)
Use FormRequest for all validation.

# Good (explicit strictness)
Prefer FormRequest for HTTP request validation. Inline validation is acceptable
for simple contexts (1-2 fields) or non-HTTP entry points (CLI commands, queued jobs).
```

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using "always" for heuristics | Overstating confidence in a recommendation | Practitioners discover exceptions, conclude the guidance is unreliable, ignore all of it | Use "prefer" or "default to" and document the exceptions |
| Using "consider" for invariants | Understating the importance of a security rule | A developer reads "consider using parameterized queries" and chooses string interpolation for convenience | Use absolute language: "Always use parameterized queries. Never interpolate user input into SQL." |
| No distinction between invariants and heuristics in documented rules | All rules use the same language ("must," "should") | Readers can't distinguish "this will break if you violate it" from "this is nicer if you follow it" | Separate rules into invariant and heuristic sections; use calibrated vs absolute language consistently |
| Defensive hedging on everything | "It might be a good idea to consider perhaps using transactions" | Guidance becomes meaningless — every rule has the same low weight | Reserve hedging for genuinely uncertain recommendations |
| Calling a heuristic an invariant in anger | "We said ALWAYS use policies and now we have 47 policies for pivot tables" | Team ignores the rest of the guidelines | Admit the misclassification; rewrite the rule as calibrated; learn from it |

# Anti-Patterns

- **Absolutism as a substitute for thought**: Using "always" and "never" to avoid having to explain the reasoning behind a rule. The rules that need absolute language become diluted. Instead, explain the reasoning so practitioners understand when rules apply and when they don't.
- **Calibrated language as a substitute for conviction**: Using "consider" and "maybe" to avoid taking a position. "Consider using transactions" when the data integrity requirement demands it is cowardly. Instead, state the invariant clearly.
- **"This is how we've always written rules"**: Inheriting absolute language from legacy documentation without re-evaluating whether the rule is actually invariant. Instead, audit rules periodically and recalibrate based on experience.

# Related Topics

- **Prerequisites**: Software Architecture Fundamentals, Communication Best Practices
- **Closely Related**: Architecture Enforcement & Governance, Code Organization Standards, Package Decision Calibration
- **Advanced**: Formal methods for invariant verification, Architecture decision records (ADRs), Rule classification taxonomies

# AI Agent Notes

- When generating architecture rules for a project, explicitly label each rule as "Invariant" or "Heuristic." Invariants use absolute language and block merges. Heuristics use calibrated language and produce warnings.
- When consuming rules written by others, identify which rules use absolute language and verify they're actually invariants. If an "always" rule has valid exceptions, flag it for recalibration.
- In code review, distinguish between "this violates an invariant" (blocking) and "this goes against the preferred pattern" (discussable). The language used in the original rule should make this distinction clear.
- When writing knowledge units, use the calibrated language vocabulary table above. Consistency in language across all knowledge units builds reader intuition about which rules are hard and which are soft.

# Verification

- [ ] Security-critical rules use absolute language ("never," "always")
- [ ] Architecture heuristics use calibrated language ("prefer," "default to," "usually," "consider")
- [ ] No heuristic uses "always" or "never" without justification
- [ ] No invariant uses "consider" or "might want to" — invariants demand absolute language
- [ ] Each absolute rule has a documented justification: what guaranteed failure occurs if violated
- [ ] Each calibrated rule documents the exceptions or contexts where the alternative is acceptable
- [ ] AI agent instructions distinguish between invariant violations (blocking errors) and heuristic violations (warnings)
- [ ] Team members understand the distinction and can explain it to new hires
- [ ] Rules are periodically audited for correct strictness level
