# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Calibrated Architecture Language
**Knowledge Unit:** Calibrated Language Rules
**Generated:** 2026-06-22

---

# Decision Inventory

* Decision 1: Classify a rule as invariant vs heuristic
* Decision 2: Choose the right calibrated language phrase for a heuristic
* Decision 3: Determine when to audit and recalibrate a rule's strictness level
* Decision 4: Decide whether a rule deviation requires a formal Architectural Exception Record

---

# Architecture-Level Decision Trees

---

## Decision: Classify a Rule as Invariant vs Heuristic

---

## Decision Context

Given an architecture rule, determine whether it should use absolute language ("always," "never") or calibrated language ("prefer," "default to," "usually," "consider").

---

## Decision Criteria

* security considerations: does violating the rule guarantee a security vulnerability?
* data integrity considerations: does violating the rule guarantee data corruption or loss?
* correctness considerations: does violating the rule guarantee unrecoverable system behavior?
* maintainability considerations: is the negative outcome recoverable through refactoring or process improvement?
* practical considerations: are there any valid contexts where following the rule would be worse than breaking it?

---

## Decision Tree

Is violating the rule guaranteed to produce a negative outcome? (Not "may produce" — "always produces")
↓
YES → Is the negative outcome a permanent or unrecoverable harm?
    YES → **INVARIANT** — use absolute language ("always," "never")
        ↓
        What category?
        Security breach → "Never [do the dangerous thing]" / "Always [do the safe thing]"
        Data corruption → "Always [protective measure]" / "Never [skip the protection]"
        Correctness failure → "Always [ensuring operation]" / "Never omit [critical step]"
        Example: "Always use parameterized queries. Never interpolate user input into SQL."
    NO → Is the negative outcome acceptable in some contexts (e.g., known trade-off)?
        YES → **HEURISTIC** — use calibrated language ("prefer," "default to")
        NO → **INVARIANT** — the outcome is unacceptable in all contexts
NO → Is the negative outcome merely a maintenance cost or technical debt that can be addressed later?
    YES → **HEURISTIC** — use calibrated language
        ↓
        How strong is the recommendation?
        Correct in 90%+ of cases → "Default to" / "Prefer"
        Correct in typical case but exceptions common → "Usually"
        Depends heavily on context → "When appropriate" / "Consider"
    NO → Are there valid contexts where following the rule would be worse than breaking it?
        YES → **HEURISTIC** — the rule admits justified exceptions
            Example: "Prefer invokable controllers for single-action endpoints. Resource controllers are appropriate for standard CRUD."
        NO → This is likely an invariant — re-evaluate with the three-question test:
            1. Is the negative outcome guaranteed?
            2. Is the negative outcome recoverable?
            3. Are there any contexts where the rule is wrong?

---

## Rationale

The distinction between invariants and heuristics is the foundation of calibrated architecture language. Invariants are rules where violation produces guaranteed, predictable harm — security breaches, data corruption, or correctness failures. Heuristics are rules that are correct in most contexts but admit justified exceptions. Misclassifying one as the other erodes trust in all architecture guidance.

---

## Recommended Default

**Default:** Assume a rule is a heuristic until proven otherwise. Only classify as invariant if the three-question test conclusively shows guaranteed, irrecoverable harm on every violation.

**Reason:** Most architecture guidance is heuristic. Over-classifying rules as invariants creates false absolutes that practitioners discover exceptions to, leading to trust erosion. Reserve absolute language for rules with ironclad justification.

---

## Risks Of Wrong Choice

Classifying a heuristic as invariant: developers discover valid exceptions, conclude all guidance is unreliable, and ignore actual invariants — including security rules. Classifying an invariant as heuristic: developers treat a critical security rule as optional advice and introduce a vulnerability.

---

## Related Rules

- Rule 1: Use Absolute Language Only for Invariants — Rules Where Violation Guarantees Failure
- Rule 2: Use Calibrated Language for Heuristics — Rules That Are Correct in Most but Not All Contexts
- Rule 3: Distinguish Invariants and Heuristics Explicitly in All Rule Documents

---

## Related Skills

- Write Calibrated Architecture Guidance
- Audit Rules for Correct Strictness Level

---

## Decision: Choose the Right Calibrated Language Phrase for a Heuristic

---

## Decision Context

A rule has been classified as a heuristic. Choose the correct calibrated language phrase that communicates the appropriate degree of recommendation strength.

---

## Decision Criteria

* strength of recommendation: how often is the recommended approach the right choice?
* frequency of valid exceptions: how commonly do contexts arise where the alternative is correct?
* quality gap between options: how much better is the recommended approach than alternatives?
* context sensitivity: does the correct choice depend heavily on project-specific factors?

---

## Decision Tree

Is the recommended approach the right choice in 90%+ of cases?
↓
YES → Are the valid exceptions well-understood and documentable?
    YES → **"Default to"** — the recommended choice; you need a good reason to do otherwise
        Example: "Default to policies for user-facing models that require authorization."
    NO → **"Prefer"** — the better option in most contexts, but the boundary is fuzzy
        Example: "Prefer constructor injection over facades in business logic."
NO → Is the recommended approach the right choice in roughly 60-80% of cases?
    YES → **"Usually"** — true in the typical case; exceptions are common enough to mention
        Example: "Jobs that perform slow or external side effects should usually implement ShouldQueue."
    NO → Does the correct choice depend heavily on project context or requirements?
        YES → Is the approach only appropriate in specific situations?
            YES → **"When appropriate"** — right in some contexts, wrong in others
                Example: "Use materialized views when appropriate for dashboard queries."
            NO → Is the approach worth evaluating among multiple valid options?
                YES → **"Consider"** — an option worth evaluating
                    Example: "Consider using read replicas for reporting queries."
        NO → Is the alternative valid but has known gotchas or pitfalls?
            YES → **"Avoid unless"** — the cautioned-against approach is valid but has pitfalls
                Example: "Avoid raw SQL unless the query builder can't express the query."
            NO → Is the approach overkill for simple cases but necessary for complex ones?
                YES → **"If the requirement demands it"** — justifies the added complexity
                    Example: "Use event sourcing if the requirement demands full audit trails."

---

## Rationale

Each calibrated language phrase communicates a specific level of recommendation strength. Consistency in phrase usage builds reader intuition — a developer sees "default to" and knows this is the standard path; they see "consider" and know this is one valid option among several. Inconsistent phrase usage confuses readers and makes all guidance feel equally weighted.

---

## Recommended Default

**Default:** Use "prefer" for most heuristics. Escalate to "default to" when the quality gap is large. Downgrade to "consider" when context sensitivity is high.

**Reason:** "Prefer" strikes the right balance — it communicates a clear recommendation without pretending no exceptions exist. It's strong enough to guide decisions, weak enough to acknowledge the world is messy.

---

## Risks Of Wrong Choice

"Default to" for a weak recommendation: developers follow a suboptimal path rigidly, missing context-appropriate alternatives. "Consider" for a strong recommendation: developers treat a near-universal best practice as optional advice.

---

## Related Rules

- Rule 2: Use Calibrated Language for Heuristics — Rules That Are Correct in Most but Not All Contexts

---

## Related Skills

- Write Calibrated Architecture Guidance

---

## Decision: Determine When to Audit and Recalibrate a Rule's Strictness Level

---

## Decision Context

Rules are not static. A heuristic may need to become an invariant after a production incident. An invariant may need to become a heuristic as the system evolves. Determine when to trigger a recalibration audit.

---

## Decision Tree

Has a production incident occurred since the last audit?
↓
YES → Did the incident involve violation of a rule classified as heuristic?
    YES → Was the violation result in a security breach, data loss, or unrecoverable failure?
        YES → **PROMOTE TO INVARIANT** — recalibrate immediately
            Example: "Prefer idempotent webhook handlers" → "Webhook handlers must use idempotent operations"
        NO → Keep as heuristic; document the incident as a cautionary example
    NO → Did the incident involve a rule where absolute language blocked a reasonable approach?
        YES → **DEMOTE TO HEURISTIC** — recalibrate immediately
        NO → No recalibration needed for this rule
NO → Has it been more than one quarter since the last audit?
    YES → **SCHEDULE AUDIT** — review all rules for correct strictness
        ↓
        For each rule, ask:
        - Has the system evolved such that a heuristic now needs invariant status?
        - Has a library or pattern changed such that an invariant is no longer always true?
        - Have team members reported trust erosion or rule fatigue?
    NO → **SKIP** — maintain current calibration
    ↓
    Has a new technology, library, or framework version been adopted?
    YES → **AUDIT AFFECTED RULES** — rules that reference specific technologies may need recalibration
        Example: "Always use X library" → becomes heuristic when a superior alternative emerges
    NO → No audit needed

---

## Rationale

Architecture evolves. Production incidents provide hard evidence about which rules were too weak and which were too rigid. Quarterly audits catch drift before it accumulates to the point of trust erosion.

---

## Recommended Default

**Default:** Audit rules quarterly and after every production incident. Promote heuristics to invariants freely based on incident evidence. Demote invariants to heuristics cautiously — security invariants ("never store plaintext passwords") never degrade.

**Reason:** The audit direction is primarily heuristic → invariant (tightening based on evidence). The reverse direction (invariant → heuristic) should be rare and deliberate, never for security rules.

---

## Risks Of Wrong Choice

No audits: rules become stale, credibility erodes, outdated absolutes block valid approaches. Over-auditing: churn in rule strictness confuses the team; rules should be stable enough to build intuition.

---

## Related Rules

- Rule 4: Audit Rules Periodically for Correct Strictness Level
- Rule 5: When Justifying a Rule Violation, Document the Rationale

---

## Related Skills

- Write Calibrated Architecture Guidance

---

## Decision: Decide Whether a Rule Deviation Requires a Formal Architectural Exception Record (AER)

---

## Decision Context

A developer needs to deviate from a heuristic (or, rarely, an invariant with explicit approval). Determine whether the deviation warrants a formal Architectural Exception Record or can be handled with a code comment.

---

## Decision Tree

Is the deviation from an invariant or a heuristic?
↓
INVARIANT → Does the deviation have explicit architecture lead approval?
    YES → **REQUIRES AER** — formal record with: rule violated, rationale, approver, review date
    NO → **BLOCK** — an invariant cannot be violated without explicit approval
HEURISTIC → Is the reason for deviation self-evident from the code?
    YES → Is the deviation trivial (one line, parameterized, idiomatic)?
        YES → **CODE COMMENT SUFFICIENT** — brief explanation of why the preferred pattern wasn't used
            Example: "// Raw SQL for recursive CTE — not expressible in Query Builder. Parameterized, no injection risk."
        NO → **FORMAL AER RECOMMENDED** — the pattern may be copied by others; formal documentation prevents spread
    NO → Could a future developer mistake this deviation for ignorance of the rule?
        YES → **REQUIRES AER** — documents that the deviation is intentional, not accidental
            Example: A raw SQL query with multiple joins that looks like a beginner's SQL injection mistake
        NO → **AER RECOMMENDED** — institutional memory for future rule audits
    ↓
    Is the deviation expected to be temporary (e.g., waiting on a library feature)?
    YES → **AER WITH REVIEW DATE** — revisit when the library adds support for the preferred pattern
    NO → **AER WITH RATIONALE** — permanent exception, documented for rule audit purposes

---

## Rationale

Undocumented deviations are indistinguishable from ignorance of the rule. Future developers see the violation and either: (a) assume the rule doesn't apply and copy the violation, or (b) "fix" the violation and break the intentional exception. Formal AERs prevent both outcomes and provide data for rule audits.

---

## Recommended Default

**Default:** When in doubt, create an AER. The cost of a few minutes writing a record is far lower than the cost of a propagated pattern that spreads through the codebase undetected.

**Reason:** The primary risk is not the single deviation — it's the pattern that forms when other developers see the deviation and assume it's the new standard. AERs prevent pattern spread by making the exception explicit and documented.

---

## Risks Of Wrong Choice

No AER for a significant deviation: pattern spreads unchecked, half the codebase follows the rule and half doesn't, code reviews waste time debating intentional vs accidental deviations. AER for every trivial exception: bureaucracy fatigue, developers skip the process entirely.

---

## Related Rules

- Rule 5: When Justifying a Rule Violation, Document the Rationale

---

## Related Skills

- Write Calibrated Architecture Guidance
