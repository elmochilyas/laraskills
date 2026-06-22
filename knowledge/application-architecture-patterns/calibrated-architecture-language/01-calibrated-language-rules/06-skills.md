# Skill: Write Calibrated Architecture Guidance

## Purpose

Produce architecture rules, coding standards, agent instructions, and knowledge units where the language correctly matches the strength of the recommendation to the strength of its justification. Every rule is explicitly classified as an invariant (absolute language) or a heuristic (calibrated language), building reader intuition about which rules are hard gates and which are recommendations with acknowledged exceptions.

## When To Use

- Writing or revising architecture guidelines for a project
- Authoring coding standards or rule documents for a team
- Creating AI agent instructions (skills, rules, knowledge units) that agents will consume
- Auditing existing architecture documentation for correct strictness levels
- Mentoring team members on how to read and interpret architecture guidance

## When NOT To Use

- Casual conversation, code comments, or informal documentation where strictness precision is unnecessary
- Self-evident truths that don't need qualification: "The database must be accessible for queries to work"
- Project-specific team norms where the team has already explicitly agreed on the strictness level

## Prerequisites

- Understanding of software architecture fundamentals
- Familiarity with the project's architecture patterns and conventions
- Awareness of which rules are security-critical vs. stylistic preferences
- Knowledge of the calibrated language vocabulary: "default to," "prefer," "usually," "when appropriate," "avoid unless," "consider," "if the requirement demands it"

## Inputs

- Existing architecture rules or guidelines (if auditing)
- Domain knowledge about which rules have guaranteed failure modes
- Team conventions and practical experience with rule exceptions
- Security requirements and compliance obligations

## Workflow

1. Inventory all architecture rules in the target document — list every "must," "should," "always," "never," "consider"
2. For each rule, apply the three-question test:
   - Is the negative outcome guaranteed if the rule is violated?
   - Is the negative outcome recoverable?
   - Are there any valid contexts where following the rule would be worse than breaking it?
3. Classify each rule as Invariant (absolute language) or Heuristic (calibrated language)
4. For invariants: use "always" or "never." Document the guaranteed failure that occurs on violation
5. For heuristics: choose the correct calibrated phrase from the vocabulary table. Document the exceptions
6. Add explicit strictness labels ("Invariant" or "Heuristic") to each rule for both human and AI agent consumption
7. Review for defensive hedging — strengthen any "consider" that should be "prefer," weaken any "always" that has valid exceptions
8. Verify that security rules, data integrity rules, and correctness rules are invariants with absolute language
9. Verify that architecture style rules, pattern preferences, and organizational conventions are heuristics with calibrated language
10. Document if a heuristic was promoted to invariant based on a production incident (or vice versa)

## Validation Checklist

- [ ] Security-critical rules use absolute language ("never," "always") with documented justifications
- [ ] Architecture heuristics use calibrated language ("prefer," "default to," "usually," "consider") with documented exceptions
- [ ] No heuristic uses "always" or "never" without justification of invariant status
- [ ] No invariant uses "consider" or "might want to"
- [ ] Each absolute rule has a documented justification: what guaranteed failure occurs if violated
- [ ] Each calibrated rule documents the exceptions or contexts where the alternative is acceptable
- [ ] Explicit strictness labels ("Invariant" / "Heuristic") are present on every rule
- [ ] AI agent instructions distinguish between invariant violations (blocking errors) and heuristic violations (warnings)
- [ ] Rules have been audited in the last quarter (or after a major incident)

## Common Failures

- Using "always" for patterns that have valid exceptions, causing trust erosion when exceptions are discovered
- Using "consider" for security rules, understating their importance and inviting dangerous shortcuts
- No distinction between invariants and heuristics — all rules use the same language, making prioritization impossible
- Defensive hedging on everything — every rule has the same low weight, and guidance becomes meaningless
- Calling a heuristic an invariant in anger — saying "we said ALWAYS do X" without confirming X is truly invariant
- Inheriting absolute language from legacy documentation without re-evaluating whether the rule is still invariant
- Forgetting to document the rationale for a deviation when a developer breaks a heuristic — losing institutional memory

## Decision Points

- Invariant or heuristic? Apply the three-question test (guaranteed failure? recoverable? valid exceptions?)
- Which calibrated phrase? Match the strength of the recommendation to the vocabulary table
- Promote to invariant? After a production incident, does the heuristic need to become an invariant?
- Document as AER? Does a justified deviation need a formal Architectural Exception Record?

## Performance Considerations

- Calibrated language has no runtime performance impact — it affects developer and agent decision-making speed
- Clear invariants reduce code review time: absolute violations are blocking without discussion
- Clear heuristics reduce decision paralysis: developers know when the recommended path is right and when exceptions apply

## Security Considerations

- Security rules are invariants — a single violation guarantees a vulnerability. Never weaken security rules with calibrated language.
- Data integrity rules (transactions, mass assignment protection, foreign key constraints) are invariants.
- Correctness rules (no external API calls inside transactions, idempotent payment processing) are invariants.
- When in doubt about whether a security rule is invariant, default to absolute language. False-positive strictness is safer than false-negative permissiveness.

## Related Rules (from 05-rules.md)

- Rule 1: Use Absolute Language Only for Invariants — Rules Where Violation Guarantees Failure
- Rule 2: Use Calibrated Language for Heuristics — Rules That Are Correct in Most but Not All Contexts
- Rule 3: Distinguish Invariants and Heuristics Explicitly in All Rule Documents
- Rule 4: Audit Rules Periodically for Correct Strictness Level
- Rule 5: When Justifying a Rule Violation, Document the Rationale

## Related Skills

- Classify Rules as Invariant or Heuristic (decision tree from 07-decision-trees.md)
- Prevent Absolutism and Hedging Anti-Patterns (08-anti-patterns.md)

## Success Criteria

- Every rule in the architecture document has an explicit strictness classification (Invariant or Heuristic)
- No absolute language appears on any rule that has valid exceptions
- No calibrated language appears on any rule whose violation is guaranteed to cause a security breach or data loss
- Developers can explain the invariant/heuristic distinction to new hires
- AI agents consuming the rules correctly block on invariant violations and warn on heuristic violations
