# Anti-Patterns: API Style Guide Documentation

## AP-1: Guide Abandonment (No Steward, No Updates)
**Category**: Maintainability

**Description**: Creating an API style guide and then abandoning it. The guide becomes outdated as conventions evolve, eventually contradicting actual practice. Teams stop referencing it because they know it's inaccurate.

**Warning Signs**:
- Style guide not updated in 12+ months
- Teams have adopted patterns that contradict the style guide
- New team members are told "ignore the guide, it's outdated"
- No changelog or revision history for the guide
- Guide references old API versions or deprecated practices
- No one is responsible for keeping the guide current

**Harms**:
- Guide becomes misleading (worse than no guide)
- Teams develop inconsistent patterns
- New team members learn wrong practices from the guide
- Governance process discredited
- Audit findings for documentation drift

**Real-World Consequence**: A team creates a comprehensive style guide in year 1. By year 3, the API has migrated from offset pagination to cursor-based, added GraphQL support, and changed authentication from API keys to OAuth. The style guide still documents offset pagination, API keys, and REST-only. New hires read the guide and implement patterns that are 2 years out of date.

**Preferred Alternative**: Assign a rotating steward responsible for quarterly style guide reviews and updates. Treat the style guide as a living document that evolves with the API.

**Refactoring Strategy**: Assign a style guide steward with quarterly review responsibility, add style guide maintenance to sprint planning, create a changelog for style guide revisions, schedule annual major review with team input, implement PR workflow for all style guide changes.

**Detection Checklist**:
- `[ ]` When was the style guide last updated?
- `[ ]` Is there a designated steward?
- `[ ]] Do teams reference the guide during design?
- `[ ]` Does the guide reflect current API practices?

**Related**: 05-rules.md (Rule 6: Assign Rotating Steward for Guide Maintenance), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-2: No Enforcement Linkage
**Category**: Governance

**Description**: The human-readable style guide says one thing while Spectral/lint rules enforce something different. Rules drift apart because they are maintained separately, creating confusion about which version is authoritative.

**Warning Signs**:
- Manual review catches violations that Spectral doesn't
- Spectral rules enforce conventions not in the style guide
- Style guide and Spectral rules contradict each other
- Developers don't know whether to follow the guide or the linter
- CI passes but design review finds style violations

**Harms**:
- Developers uncertain which rules to follow
- Automated CI says "pass" but review says "fail"
- Contradictions cause debates and rework
- Manual review necessary to catch what automation misses
- Trust in both guide and automation erodes

**Real-World Consequence**: The style guide says "field names use snake_case." The Spectral rules enforce camelCase (from an older convention that was never updated). Developers follow Spectral (blocking CI), creating camelCase fields. The design reviewer flags these as style guide violations. Developers are caught between a passing CI and a failing review.

**Preferred Alternative**: Store style guide rules and Spectral enforcement rules together in the repository. Generate or validate Spectral rules against the style guide. Ensure every machine-checkable rule has a corresponding Spectral rule, and vice versa.

**Refactoring Strategy**: Audit current Spectral rules against style guide for contradictions, update both to match, add CI check that verifies style guide and Spectral rule alignment, create automated rule generation where possible, document the mapping between human rules and Spectral rules.

**Detection Checklist**:
- `[ ]` Do Spectral rules match the style guide?
- `[ ]` Are there conventions in the guide not enforced by Spectral?
- `[ ]` Are there Spectral rules not documented in the guide?
- `[ ]` Is there drift between guide and enforcement over time?

**Related**: 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: No Rationale for Rules
**Category**: Maintainability

**Description**: Writing style guide rules without explaining why they exist. Rules without rationale are followed mechanically, challenged in every design review, and abandoned when the original authors leave the team.

**Warning Signs**:
- Style guide rules are imperative statements without explanation
- Design reviews debate why a rule exists
- New team members question established rules
- Rules are inconsistently applied across teams
- "Because the style guide says so" is the only justification

**Harms**:
- Rules challenged in every design review
- Inconsistent application — some teams follow, others don't
- Rules abandoned when original authors leave
- No basis for evaluating exceptions
- Team doesn't understand the principles behind the rules

**Real-World Consequence**: A style guide rule says "MUST use cursor pagination" with no rationale. A new developer joins and challenges the rule in every PR — "offset pagination works fine for our dataset." The team spends 30 minutes per PR debating the same topic. The original architect who chose cursor-based left 6 months ago, so nobody knows the real reasoning.

**Preferred Alternative**: Include a rationale section for every rule explaining why it exists. Link to the ADR that established the rule for full context.

**Refactoring Strategy**: Add rationale to every existing rule, research and document the reasoning for each, link rules to ADRs where available, include rationale in style guide review checklist, require rationale for all new rule proposals.

**Detection Checklist**:
- `[ ]` Does every rule have a rationale?
- `[ ]` Can team members explain why each rule exists?
- `[ ]` Are rules linked to establishing ADRs?
- `[ ]` Are rules debated in design reviews?

**Related**: 05-rules.md (Rule 3: Provide Rationale for Every Rule), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-4: Generic Guide Without Specific Conventions
**Category**: Maintainability

**Description**: Writing a style guide at such a high level that it provides no actionable guidance. Guidelines like "follow REST principles" or "use good naming" are too vague to enforce or follow, making the guide useless.

**Warning Signs**:
- Guide says "follow REST best practices" without specifics
- Rules are aspirational ("use clean code") not concrete
- No positive/negative examples for rules
- Reviewers cannot cite specific guide rules in feedback
- Different team members interpret the same rule differently

**Harms**:
- Guide provides no actionable guidance
- Inconsistent implementation despite following the "guide"
- Reviewers cannot reference specific rules
- New team members get no concrete direction
- Guide exists as checkbox but provides no value

**Real-World Consequence**: A style guide says "endpoints should follow RESTful naming conventions" with no examples. Developer A interprets this as `/getUsers`, Developer B as `/users`, Developer C as `/api/v1/users`. All three believe they are following the guide. The design reviewer cannot cite a specific rule to resolve the disagreement.

**Preferred Alternative**: Be opinionated and specific. State exact conventions with positive and negative examples. Every rule should be precise enough that two developers independently implementing it would produce consistent results.

**Refactoring Strategy**: Review all rules for specificity, add concrete examples (Good and Bad) for every rule, replace vague guidelines with precise statements, include specific patterns and anti-patterns, add "This means" clarifications for ambiguous rules.

**Detection Checklist**:
- `[ ]` Are rules specific and unambiguous?
- `[ ]` Does every rule have positive and negative examples?
- `[ ]` Can two developers independently implement the same rule consistently?
- `[ ]` Are vague guidelines (e.g., "follow REST") replaced with specifics?

**Related**: 05-rules.md (Rule 2: Include Positive and Negative Examples for Every Rule), 04-standardized-knowledge.md, 06-skills.md

---

## AP-5: Rules Without RFC 2119 Classification
**Category**: Governance

**Description**: Writing style guide rules without classifying them as MUST, SHOULD, or MAY. All rules appear equally important, leading to confusion about which are mandatory and which are optional.

**Warning Signs**:
- No MUST/SHOULD/MAY keywords in rule definitions
- All rules treated as equally important/optional
- Teams don't know which rules are blocking vs advisory
- Security rules classified same as style preferences
- Enforcement cannot differentiate between required and recommended

**Harms**:
- MUST rules treated as optional
- SHOULD rules treated as mandatory (unnecessary blocking)
- No distinction between security requirements and style preferences
- Reviewers cannot prioritize feedback
- Governance inconsistency

**Real-World Consequence**: A style guide has 50 unclassified rules. A developer violates a security rule ("MUST include authentication on every endpoint") and a style preference ("SHOULD use 2-space indentation in JSON"). Without classification, both violations are treated equally. The reviewer focuses on indentation while the security violation goes to production.

**Preferred Alternative**: Classify every rule with RFC 2119 keywords: MUST (required, blocking), SHOULD (recommended, exception with justification), MAY (optional, no enforcement).

**Refactoring Strategy**: Review all rules and assign RFC 2119 keywords, update enforcement tooling to differentiate MUST from SHOULD from MAY, document what each keyword means for compliance, add classification in style guide table of contents.

**Detection Checklist**:
- `[ ]` Are all rules classified as MUST, SHOULD, or MAY?
- `[ ]` Is there a clear distinction between required and recommended rules?
- `[ ]` Do security rules have MUST classification?
- `[ ]` Can reviewers prioritize feedback based on classification?

**Related**: 05-rules.md (Rule 1: Use RFC 2119 Keywords for Every Rule), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-6: Silent Rule Replacement Without Deprecation
**Category**: Maintainability

**Description**: Changing a style guide rule without documenting the old convention, the migration path, or the deprecation timeline. Existing APIs continue using the old convention while new APIs use the new one, creating inconsistency.

**Warning Signs**:
- Old rule silently removed from style guide
- New rule added without mention of the change
- Existing APIs still follow old convention
- New APIs follow new convention
- No migration guidance for existing APIs
- No deprecation timeline

**Harms**:
- API surface inconsistency between old and new services
- Consumers confused about which convention applies
- Existing APIs never upgraded to new conventions
- Documentation contradictions
- No audit trail of convention evolution

**Real-World Consequence**: A style guide silently replaces "MUST use offset pagination" with "MUST use cursor pagination" in a quarterly update. All existing APIs continue using offset pagination (not updated). New APIs use cursor-based. Consumers integrating with multiple services must handle both pagination styles. The old rule is no longer in the guide, so new developers don't know why some APIs use offset.

**Preferred Alternative**: Document deprecation path when a style rule changes: mark the old rule as DEPRECATED, state the new rule, provide migration guidance, set a deprecation timeline (e.g., "existing APIs may continue until next major version").

**Refactoring Strategy**: Add DEPRECATED status for old conventions, set migration windows with clear timelines, document migration steps for existing APIs, create automated migration tooling where possible, track migration progress.

**Detection Checklist**:
- `[ ]` Are old conventions marked as DEPRECATED in the guide?
- `[ ]` Are there migration timelines for convention changes?
- `[ ]` Is there documentation for migrating from old to new convention?
- `[ ]` Are existing APIs exempted from new rules during migration?

**Related**: 05-rules.md (Rule 7: Deprecate Old Conventions with Migration Guidance), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md
