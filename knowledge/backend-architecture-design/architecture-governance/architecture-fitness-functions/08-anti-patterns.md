# ECC Anti-Patterns — Architecture Fitness Functions

## Domain: Backend Architecture & Design | Subdomain: Architectural Governance

### Anti-Pattern Inventory

1. **False Positives Overload** — Too many rules, team ignores CI failures
2. **No Baseline** — Rules applied to legacy code without exceptions, blocking all PRs
3. **Brittle Rules** — Rules tied to exact file paths/names that break on refactoring
4. **Only Negative Rules** — Rules only say what NOT to do, no positive guidance
5. **Hidden Rules** — Fitness functions not documented, team surprised by CI failures
6. **No Governance Feedback** — Rules never reviewed; stale rules block valid patterns

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: False Positives Overload

**Category:** Process

**Description:** Too many rules causing frequent false positives. Teams start ignoring CI output.

**Why It Happens:** Adding rules without false-positive testing. Rules written for edge cases.

**Warning Signs:** CI pipeline has 50+ warnings; "warnings allowed" flags used routinely; team ignores CI architecture output.

**Why Is It Harmful:** Legitimate violations hide among noise. Architecture drift accelerates because nobody trusts the tooling.

**Preferred Alternative:** Start with 3-5 high-value rules. Add rules incrementally with zero false positives.

**Refactoring Strategy:** Audit existing rules. Remove or fix rules with >5% false positive rate. Set maximum warning threshold.

**Related Rules:** Start small, add rules incrementally (05-rules.md)

---

### Anti-Pattern 2: No Baseline

**Category:** Adoption

**Description:** Fitness functions applied to entire codebase including legacy code that violates them.

**Why It Happens:** Rules written for ideal architecture, applied to existing code without grandfathering.

**Warning Signs:** CI pipeline broken for months; PRs blocked for pre-existing violations.

**Why Is It Harmful:** Team becomes desensitized to CI failures. Rules are routinely bypassed. New violations hide in the noise.

**Preferred Alternative:** Create baseline allowing existing violations. Only flag NEW violations.

**Refactoring Strategy:** Run rule against current codebase, generate baseline file. Configure tool to ignore baseline violations. Fix them incrementally.

**Related Rules:** Baseline existing violations before enforcing (05-rules.md)

---

### Anti-Pattern 3: Brittle Rules

**Category:** Maintainability

**Description:** Rules referencing specific file paths or class names that break on refactoring.

**Why It Happens:** Rules written without considering code evolution.

**Warning Signs:** Refactoring breaks CI because file moved; rule patterns use absolute namespaces with hardcoded paths.

**Why Is It Harmful:** Discourages refactoring. Team fears changing structure because it breaks architecture rules. Technical debt accumulates.

**Preferred Alternative:** Use pattern-based rules that match architecture concepts, not file locations.

**Refactoring Strategy:** Replace path-specific rules with namespace/interface-based rules. Test rules against refactoring scenarios.

**Related Rules:** Write architecture-abstract rules, not location-specific (05-rules.md)

---

### Anti-Pattern 4: Only Negative Rules

**Category:** Guidance

**Description:** Fitness functions only forbid patterns without showing correct alternatives.

**Why It Happens:** Easier to write "don't do X" rules than to guide toward "do Y."

**Warning Signs:** CI says "Domain cannot import Infrastructure" but doesn't say how to structure it correctly.

**Why Is It Harmful:** Developers frustrated by "red" CI with no path to green. Learn to bypass rules rather than follow architecture.

**Preferred Alternative:** Pair each negative rule with a positive guideline and example.

**Refactoring Strategy:** Add error messages with examples. Create documentation linking violation → correct pattern. Add positive rules where possible.

**Related Rules:** Provide corrective guidance with each rule (05-rules.md)

---

### Anti-Pattern 5: Hidden Rules

**Category:** Communication

**Description:** Fitness function rules not documented. Team discovers them only when CI fails.

**Why It Happens:** Rules configured in tool config files that most developers don't read.

**Warning Signs:** Developer surprised by "why is this failing?" on PR; no documentation of architecture rules.

**Why Is It Harmful:** Team doesn't understand architecture constraints. Rules seen as hostile gatekeeping rather than helpful guidance.

**Preferred Alternative:** Document all active rules with rationale. Include in onboarding.

**Refactoring Strategy:** Generate rule documentation from config. Add comment explaining each rule in CI config. Include in team wiki.

**Related Rules:** Document all active fitness functions (05-rules.md)

---

### Anti-Pattern 6: No Governance Feedback

**Category:** Evolution

**Description:** Fitness function rules never reviewed or updated.

**Why It Happens:** "Set and forget" mentality. No scheduled rule review.

**Warning Signs:** Rules unchanged for years; rules blocking valid new patterns; exceptions pile up.

**Why Is It Harmful:** Architecture rules become outdated. New patterns (e.g., new framework features) are blocked by old rules. Team works around them.

**Preferred Alternative:** Schedule quarterly rule review. Remove or update rules that no longer serve their purpose.

**Refactoring Strategy:** Create rule review as recurring calendar event. Track exception frequency as signal to adjust rules.

**Related Rules:** Review and update rules regularly (05-rules.md)
