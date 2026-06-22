# Anti-Patterns: Calibrated Architecture Language

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Calibrated Architecture Language |
| Knowledge Unit | Calibrated Language Rules |
| Audience | Architects, Tech Leads, Developers Writing Guidelines, AI Agent Authors |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-CAL-01 | Absolutism as Substitute for Thought | High | High | Medium |
| AP-CAL-02 | Calibrated Language as Substitute for Conviction | Critical | Medium | Low |
| AP-CAL-03 | Inherited Absolutes Without Re-Evaluation | High | High | Medium |
| AP-CAL-04 | Defensive Hedging on Everything | Medium | Medium | Medium |
| AP-CAL-05 | No Distinction Between Invariants and Heuristics in Documentation | High | High | Medium |
| AP-CAL-06 | Calling a Heuristic an Invariant in Anger | Medium | Low | Low |

---

## Repository-Wide Anti-Patterns

- **Absolutism as a substitute for thought**: Using "always" and "never" to avoid explaining the reasoning behind a rule. The rules that actually need absolute language become diluted.
- **Calibrated language as a substitute for conviction**: Using "consider" and "maybe" to avoid taking a position. "Consider using transactions" when the data integrity requirement demands it is cowardly.
- **"This is how we've always written rules"**: Inheriting absolute language from legacy documentation without re-evaluating whether the rule is actually invariant.

---

## 1. Absolutism as Substitute for Thought

### Category
Communication · Architecture

### Description
Using "always" and "never" to avoid having to explain the reasoning behind a rule. The rules that truly need absolute language become diluted among rules that don't. Developers discover valid exceptions to "always" rules, conclude the guidance is unreliable, and ignore all of it — including the actual invariants where violation would cause real harm.

### Why It Happens
Writing "Always use FormRequest for validation" is faster than writing "Prefer FormRequest for HTTP request validation. Inline validation is acceptable for simple contexts (1-2 fields) or non-HTTP entry points." Absolutism feels authoritative and requires less thought about edge cases and exceptions.

### Warning Signs
- Rules document contains many "always" and "never" statements
- Developers routinely ignore certain "always" rules because they "know they're not really always"
- Code reviews spend time debating whether an "always" rule actually applied
- New hires ask "but what about X case?" and the response is "oh, we don't really follow that rule in that case"
- The same rule appears in both "must follow" and "nice to have" mental categories depending on who you ask

### Why Harmful
When a developer finds a valid exception to an "always" rule, they conclude the guidance is unreliable. They stop trusting other rules, including security invariants like "always use parameterized queries." The architecture document becomes wallpaper — present but ignored. Trust erosion is cumulative and difficult to reverse.

### Real-World Consequences
- "Always use FormRequest" ignored for CLIs; developer then also ignores "always use parameterized queries" because "they were probably exaggerated too"
- Team adopts an unofficial "ignore the architecture rules" culture because half of them have known exceptions
- Security review misses a SQL injection because the invariant was buried among over-stated heuristics
- New architecture lead must spend months rebuilding trust before rules are followed again

### Preferred Alternative
Use absolute language only for invariants where violation guarantees failure. Use calibrated language for heuristics. Document the exceptions for every heuristic so practitioners understand when the rule applies and when it doesn't.

### Refactoring Strategy
1. Inventory all "always" and "never" rules in documentation
2. For each, ask: "Is the negative outcome guaranteed on every violation?"
3. Convert false absolutes to calibrated language with documented exceptions
4. Strengthen any actual invariants by adding the specific guaranteed failure justification
5. Communicate the distinction to the team: "these are hard rules, these are strong recommendations"

### Detection Checklist
- [ ] Count the "always" and "never" statements in architecture docs — are there more than 10?
- [ ] Ask three developers if they can name a valid exception to any "always" rule — if yes, it's a false absolute
- [ ] Do code reviews distinguish between "this is a blocking violation" and "this is a style concern"?
- [ ] Are there rules that half the team follows and half ignores?
- [ ] Do security rules stand out visually from style rules, or do they all use the same language?

### Related Rules/Skills/Trees
- Rule 1 (05-rules.md): Use Absolute Language Only for Invariants
- Classify a Rule as Invariant vs Heuristic (07-decision-trees.md)
- Write Calibrated Architecture Guidance (06-skills.md)

---

## 2. Calibrated Language as Substitute for Conviction

### Category
Communication · Security

### Description
Using "consider," "maybe," or "it might be a good idea to" for rules where the correct choice is not negotiable — typically security or data integrity rules. "Consider using parameterized queries" when SQL injection is a guaranteed outcome of string interpolation. "It might be a good idea to use transactions" when multi-step writes without transactions guarantee partial data on failure.

### Why It Happens
Some authors avoid taking strong positions to prevent being "wrong." Defensive hedging feels safe — if you qualify everything, no one can accuse you of being too strict. Alternatively, the author may not fully understand the severity of the risk and therefore understates the recommendation.

### Warning Signs
- Security rules start with "consider" or "maybe"
- Data integrity rules are phrased as suggestions rather than requirements
- The rules document reads like a collection of "tips and tricks" rather than a set of requirements
- Developers choose the unsafe path and justify it with "the docs just said to consider it"
- No rule in the entire document uses absolute language — everything is equally hedged

### Why Harmful
When every rule has the same low weight, no rule has any weight. Developers cannot distinguish between "you must do this or the system breaks" and "this is slightly nicer." Security vulnerabilities are introduced because the guidance was too weak to prevent them.

### Real-World Consequences
- Developer reads "consider using parameterized queries," chooses string interpolation for convenience, introduces SQL injection
- Developer reads "it might be good to hash passwords," stores plaintext, database breach exposes all credentials
- Guidance becomes meaningless — every rule has the same low weight, so no rule is followed
- New team members cannot identify which rules are truly mandatory

### Preferred Alternative
For invariants (security, data integrity, correctness), use absolute language: "Always use parameterized queries. Never interpolate user input into SQL." State the invariant clearly and include the justification for why it's non-negotiable. Reserve calibrated language for situations where exceptions actually exist.

### Refactoring Strategy
1. Search for "consider," "maybe," "might," "could" in architecture documents
2. For each instance, ask: "If someone ignores this, is the outcome guaranteed to be bad?"
3. If yes, replace with absolute language: "Always" or "Never," with justification
4. If no, verify that the calibrated phrase ("consider," "prefer") is the correct strength level
5. Add explicit Invariant/Heuristic labels so hedging is caught at write time

### Detection Checklist
- [ ] Are there "consider" or "maybe" phrases in security-critical sections?
- [ ] Does the document take a clear position on data integrity rules?
- [ ] Can a developer reading the document distinguish mandatory rules from recommendations?
- [ ] Would ignoring every "consider" statement create a system with security vulnerabilities?
- [ ] Do the strongest recommendations use the strongest language?

### Related Rules/Skills/Trees
- Rule 1 (05-rules.md): Use Absolute Language Only for Invariants
- Rule 2 (05-rules.md): Use Calibrated Language for Heuristics
- Choose the Right Calibrated Language Phrase (07-decision-trees.md)
- Write Calibrated Architecture Guidance (06-skills.md)

---

## 3. Inherited Absolutes Without Re-Evaluation

### Category
Process · Maintainability

### Description
Inheriting absolute language from legacy documentation without re-evaluating whether the rule is actually invariant in the current system context. A rule that was invariant in a PHP 5.6 monolith may be a heuristic in a PHP 8.3 microservices architecture. Repeating "always" and "never" from old style guides without questioning whether they still hold.

### Why It Happens
The existing rule has "always" in it and was written by respected engineers. It's been in the document for years. Nobody wants to be the person who weakened a rule and then got blamed when something broke. The safest path is to leave it as-is.

### Warning Signs
- Rules document contains absolute language rules that refer to deprecated libraries or PHP versions
- Rules that were written 3+ years ago and haven't been reviewed
- "Always use X library" — but X is now in maintenance mode and Y is the successor
- Team members privately acknowledge the rule is outdated but nobody updates the document
- Copy-pasted rules across multiple documents without contextual adaptation

### Why Harmful
Outdated invariants create unnecessary friction. A rule that says "always use library X" when X is deprecated forces developers to either violate the rule (losing trust) or use deprecated software (creating security debt). The rule set loses credibility because it hasn't kept pace with reality.

### Real-World Consequences
- "Always use MySQL" rule inherited from 2018 — team wants PostgreSQL for vector search but the rule blocks it
- "Never use microservices" rule from the monolith era blocks a legitimate service extraction
- Deprecated library enforced by absolute rule creates a security vulnerability because updates aren't available
- New hires see outdated absolutes and conclude the entire document is obsolete

### Preferred Alternative
Audit rules quarterly and after major technology changes. For each absolute rule, verify it is still invariant in the current system context. Remove or recalibrate rules that no longer hold. Add a "Last Reviewed" date to every rule so staleness is visible.

### Refactoring Strategy
1. Add "Last Reviewed" and "Valid Until Review" dates to every rule
2. During quarterly audits, review all rules older than 3 months
3. For each absolute rule, verify the justification still holds in the current tech stack
4. Demote outdated invariants to heuristics or remove them entirely
5. Document the reason for any strictness change (e.g., "demoted because PostgreSQL added native support for X")

### Detection Checklist
- [ ] Do any rules reference deprecated libraries, PHP versions, or frameworks?
- [ ] When was each "always" and "never" rule last reviewed?
- [ ] Are there rules the team privately agrees are outdated but haven't updated?
- [ ] Have there been major technology changes since the rules were written?
- [ ] Are rules copy-pasted across documents without per-context evaluation?

### Related Rules/Skills/Trees
- Rule 4 (05-rules.md): Audit Rules Periodically for Correct Strictness Level
- Determine When to Audit and Recalibrate (07-decision-trees.md)
- Write Calibrated Architecture Guidance (06-skills.md)

---

## 4. Defensive Hedging on Everything

### Category
Communication · Architecture

### Description
Applying weak calibrated language to every rule such that no rule carries more weight than any other. "It might be a good idea to consider perhaps using transactions" when data integrity demands them. "You could maybe think about hashing passwords" when it's a non-negotiable security requirement. The guidance becomes a collection of suggestions with no prioritization.

### Why It Happens
The author wants to avoid being prescriptive. They may have been burned by an "always" rule that turned out to have exceptions, so they over-correct toward complete neutrality. Or they may not have the authority to set rules and compensate by making everything a suggestion.

### Warning Signs
- Every rule uses "consider," "might," "could," or "perhaps"
- No rule uses "prefer," "default to," or any language stronger than "consider"
- The document reads like brainstorming notes rather than architecture guidance
- Developers make up their own rules because the document doesn't provide direction
- In a conflict between two rules, there's no way to determine which takes priority

### Why Harmful
Guidance without prioritization is not guidance — it's a list of ideas. Developers must independently evaluate every rule's importance, leading to inconsistent decisions. The most critical rules (security, data integrity) have the same weight as the least important ones (code style preferences). The document provides no value because it offers no direction.

### Real-World Consequences
- Team of 5 developers makes 5 different decisions about the same architecture question
- Security vulnerability introduced because the security rule had the same weak language as style rules
- New hire cannot determine what is actually required vs optional
- Architecture review meetings spend time re-litigating decisions the document should have settled

### Preferred Alternative
Use the full range of calibrated language. "Prefer" and "default to" are still calibrated — they admit exceptions — but they communicate a clear default direction. Use "always" and "never" for invariants. The vocabulary should span from strongest (invariant) to weakest (consider), with most rules clustering around "prefer" and "default to."

### Refactoring Strategy
1. Map every rule to its position on the strength spectrum
2. For rules currently at "consider" or weaker, ask: "Is the recommended approach actually better in most cases?"
3. If yes, upgrade to "prefer" or "default to"
4. For invariants, upgrade to "always" or "never" with justification
5. Verify the document now has rules at multiple strength levels — if they're all at one level, the calibration is wrong

### Detection Checklist
- [ ] Does the document use words stronger than "consider" anywhere?
- [ ] Are there at least a few rules at "always" or "never" (invariants)?
- [ ] Can a developer tell from the language alone which rules are more important?
- [ ] Would the system be secure if a developer followed only the "always/never" rules?
- [ ] Does the document communicate defaults or just list options?

### Related Rules/Skills/Trees
- Rule 1 (05-rules.md): Use Absolute Language Only for Invariants
- Rule 2 (05-rules.md): Use Calibrated Language for Heuristics
- Choose the Right Calibrated Language Phrase (07-decision-trees.md)
- Write Calibrated Architecture Guidance (06-skills.md)

---

## 5. No Distinction Between Invariants and Heuristics in Documentation

### Category
Documentation · Maintainability

### Description
All rules in a document use the same language ("must," "should," "shall") with no explicit labels distinguishing blocking invariants from advisory heuristics. Readers — both human and AI agents — must infer strictness from context, which is error-prone, especially for non-native speakers and automated tooling.

### Why It Happens
The distinction wasn't considered during document design. The author assumed "must" is strong enough for everything important and "should" is weak enough for everything else. Or the document predates the concept of explicit strictness classification.

### Warning Signs
- Every rule starts with "must" or "should" with no other classification
- No section headers like "Invariants" and "Heuristics" or "Hard Rules" and "Recommendations"
- AI agents cannot determine which rules to block on vs warn on
- Linters and CI checks apply the same severity to all rules
- Different team members interpret the same "must" as blocking or advisory depending on context

### Why Harmful
Without explicit classification, ambiguous strictness leads to inconsistent enforcement. AI agents apply the same severity to all rules — blocking on heuristics (frustrating developers) or warning on invariants (allowing security vulnerabilities). Human readers can't prioritize which rules to follow when they conflict. The document's authority is undermined because no one knows which rules are truly mandatory.

### Real-World Consequences
- CI pipeline blocks a merge because a heuristic violation ("prefer FormRequest") is treated as an error
- CI pipeline passes a merge because a security invariant violation ("parameterized queries missing") is treated as a warning
- Two senior developers disagree on whether a rule is blocking — both cite the same document
- AI agent generates code that violates a security rule because the rule was classified as a warning

### Preferred Alternative
Explicitly label each rule as "Invariant" or "Heuristic." Use a consistent format: a dedicated field in the rule table, a "Strictness:" prefix, or section headers grouping invariants and heuristics. This makes the distinction visible to both human readers and AI agents, enabling differentiated enforcement.

### Refactoring Strategy
1. Add a "Strictness" field to every rule: `Invariant` or `Heuristic`
2. Group invariants in a separate section with a header like "## Invariants (Violation Blocks Merge)"
3. Group heuristics in a section with a header like "## Heuristics (Violation Produces Warning)"
4. Document the classification scheme at the top of the rules file
5. Configure CI and agent enforcement to treat Invariant violations as errors and Heuristic violations as warnings

### Detection Checklist
- [ ] Does every rule have an explicit "Invariant" or "Heuristic" label?
- [ ] Are invariants and heuristics visually separated in the document?
- [ ] Can AI agents parse the strictness classification from the document structure?
- [ ] Do CI checks differentiate between invariant and heuristic violations?
- [ ] Would a new team member know which rules are blocking and which are advisory?

### Related Rules/Skills/Trees
- Rule 3 (05-rules.md): Distinguish Invariants and Heuristics Explicitly in All Rule Documents
- Classify a Rule as Invariant vs Heuristic (07-decision-trees.md)
- Write Calibrated Architecture Guidance (06-skills.md)

---

## 6. Calling a Heuristic an Invariant in Anger

### Category
Process · Communication

### Description
Promoting a heuristic to invariant status reactively — after discovering a problem caused by someone not following the recommendation — without verifying that violation of the rule actually guarantees failure in all contexts. "We said ALWAYS use policies and now we have 47 policies for pivot tables."

### Why It Happens
A production incident or code review frustration triggers an emotional response: "This wouldn't have happened if everyone just followed the rule!" The rule is elevated to invariant as a punishment, not because the evidence supports it.

### Warning Signs
- A rule was recently reclassified from heuristic to invariant
- The justification for the change is "because someone didn't follow it and we had a problem"
- The invariant status doesn't survive the three-question test
- Team members complain the rule is too rigid but are told "it's an invariant now"
- The invariant covers a pattern that has known, documentable exceptions

### Why Harmful
A false invariant that should be a heuristic creates the same trust erosion as the original absolutism problem. Team members find valid exceptions, violate the rule, and lose trust in all invariants. Worse, they may avoid reporting exceptions because the rule is "invariant" — leading to shadow patterns and hidden deviations.

### Real-World Consequences
- Rule escalated to invariant: "Always create a Policy for every Model." Team now maintains 47 policies, 30 of which are `return true` for pivot tables and internal models
- Developer needs to skip a policy for a legitimate reason, but the rule is "invariant" — they do it anyway and feel guilty, or they don't do it and the code is worse
- The rule is quietly ignored, and the architecture document loses credibility

### Preferred Alternative
Admit the misclassification. Rewrite the rule as calibrated: "Default to policies for user-facing models that require authorization. Internal models, pivot tables, and system-only models do not need policies." Document the specific problem that prompted the re-evaluation as a cautionary example within the heuristic.

### Refactoring Strategy
1. Acknowledge the misclassification openly: "This rule was incorrectly classified as an invariant"
2. Re-apply the three-question test to verify it's a heuristic
3. Rewrite the rule with calibrated language and document the specific exceptions
4. Document the incident that prompted the re-evaluation as "why this recommendation exists"
5. Use this as a learning opportunity: review other recently promoted invariants for similar misclassification

### Detection Checklist
- [ ] Have any heuristics been promoted to invariant recently?
- [ ] Does the promotion justification include evidence of guaranteed failure in all contexts?
- [ ] Does the invariant survive the three-question test?
- [ ] Are team members reporting friction with newly promoted invariants?
- [ ] Is the rule being consistently followed or quietly ignored?

### Related Rules/Skills/Trees
- Rule 4 (05-rules.md): Audit Rules Periodically for Correct Strictness Level
- Classify a Rule as Invariant vs Heuristic (07-decision-trees.md)
- Determine When to Audit and Recalibrate (07-decision-trees.md)
- Write Calibrated Architecture Guidance (06-skills.md)
