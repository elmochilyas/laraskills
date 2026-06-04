# Anti-Patterns: Team API Consistency Rules

## AP-1: Rule Bloat Without Removal
**Category**: Governance

**Description**: Accumulating consistency rules without ever removing old ones. The rule set grows past 30, making it impossible for teams to comply with all rules, so they ignore the entire set.

**Warning Signs**:
- Rule count exceeds 30 active rules
- Contradictory rules exist in the rule set
- Teams have stopped referencing the style guide
- New rules are added without removing old ones

**Harms**:
- Rules become aspirational rather than enforceable
- Contradictory rules confuse developers
- Team loses trust in the governance process

**Real-World Consequence**: A team maintains 50+ naming rules including both "use snake_case for fields" and "use camelCase for external-facing fields" — developers stop checking either rule and naming becomes arbitrary across services.

**Preferred Alternative**: Cap active rules at 30 maximum. Remove one existing rule when adding a new one. Track rule effectiveness and prune low-impact rules quarterly.

**Refactoring Strategy**: Audit current rule set, classify by impact (high/medium/low), remove all low-impact rules that duplicate or contradict others, establish rule cap enforcement in CI, schedule quarterly rule review in consistency champion rotation.

**Detection Checklist**:
- `[ ]` Count active rules — is it under 30?
- `[ ]` Review for contradictory rules (snake_case vs camelCase, etc.)
- `[ ]` Check if rules have been added in last 6 months without removals
- `[ ]` Survey team — do they know all active rules?

**Related**: 05-rules.md (Rule 2: Cap Active Rules at 30), 06-skills.md, 07-decision-trees.md

---

## AP-2: No Automated Enforcement
**Category**: Maintainability

**Description**: Documenting consistency rules in human-readable format only, without corresponding Spectral or automated linting rules. Rules become aspirational guidelines that are inconsistently applied.

**Warning Signs**:
- Style guide exists as Markdown only in repository
- Code review comments repeatedly flag the same naming violations
- New services use different conventions than existing ones
- Consistency violations are discovered during audit, not during development

**Harms**:
- Rules are inconsistently enforced across PRs
- Reviewer attention wasted on mechanical violations
- New team members cannot self-check their work
- Consistency degrades over time as team grows

**Real-World Consequence**: A team documents 25 naming conventions in a Markdown style guide but has no Spectral CI step. After 6 months and 3 new hires, only 40% of endpoints follow the conventions — reviewers miss violations in 60% of PRs.

**Preferred Alternative**: Enforce all objectively checkable consistency rules (naming, structure, format) via Spectral rules in CI. Reserve human review for subjective design semantics.

**Refactoring Strategy**: Convert top 10 naming rules to Spectral rules first, add Spectral linting step to CI pipeline, set severity to "warning" for 1 month then "error", track consistency score improvement over time.

**Detection Checklist**:
- `[ ]` Is there a Spectral/automated linting step in CI?
- `[ ]` Are naming violations ever caught during code review (should be automated)?
- `[ ]` Can a developer self-check their API spec before submitting PR?
- `[ ]` Do new services pass all consistency checks without intervention?

**Related**: 04-standardized-knowledge.md, 05-rules.md (Rule 1: Enforce Naming Conventions via Spectral in CI)

---

## AP-3: Immediate Blocking Enforcement for New Rules
**Category**: Governance

**Description**: Introducing new consistency rules with immediate blocking severity — no transition period. Existing APIs fail CI immediately, causing blocked deployments and emergency exemptions that never get resolved.

**Warning Signs**:
- New rule added as "error" (blocking) on day one
- Existing PRs break mid-sprint
- Emergency exemptions requested to unblock deployment
- Exemptions accumulate without expiration

**Harms**:
- Team frustration and resistance to future rules
- Deployments blocked for non-functional changes
- Emergency exemptions create permanent loopholes
- Trust in governance process erodes

**Real-World Consequence**: A team adds a new field naming rule with "error" severity. The API has 30 endpoints violating it. All existing PRs are blocked. The lead grants 30 exemptions that never expire — the rule effectively applies to zero services.

**Preferred Alternative**: Introduce new rules as "recommended" (warning severity) for 1 month, then escalate to "required" (error severity). This gives teams time to adapt APIs and catches unforeseen conflicts.

**Refactoring Strategy**: Change newly added rules to "warn" severity, set a calendar reminder to escalate after 1 month, notify team of upcoming enforcement date, track compliance improvement during warning period.

**Detection Checklist**:
- `[ ]` Were any rules added at "error" severity in the last month?
- `[ ]` Do any services have permanent exemptions from rules?
- `[ ]` Is there a documented transition period for new rules?
- `[ ]` Can teams predict when a new rule will become blocking?

**Related**: 05-rules.md (Rule 3: Use Gradual Enforcement), 06-skills.md, 07-decision-trees.md

---

## AP-4: Permanent Exceptions Without Expiration
**Category**: Governance

**Description**: Granting exceptions to consistency rules without expiration dates or justification requirements. Exceptions accumulate until the rule set is effectively unenforced across most services.

**Warning Signs**:
- Exception list grows quarter over quarter
- Exceptions have no expiry dates
- PR descriptions lack justification for exceptions
- Same team repeatedly requests same exception type

**Harms**:
- Rule set becomes selectively unenforced
- New teams mimic existing exceptions rather than following rules
- Governance process becomes ornamental
- Consistency degrades across services

**Real-World Consequence**: A team has 30 active rules but 45 active exceptions — more exceptions than rules. Every service has at least 3 exceptions. New teams joining automatically request the same exceptions because "everyone else has them."

**Preferred Alternative**: Set 3-month expiration on every rule exception. Require a 2-sentence justification in the PR description. Review and renew exceptions only with continued justification.

**Refactoring Strategy**: Audit all existing exceptions, add expiration dates retroactively, notify teams that exceptions will expire, implement automated tracking of exception expiry dates, require justification for renewal.

**Detection Checklist**:
- `[ ]` Do all exceptions have expiration dates?
- `[ ]` Is justification required when creating an exception?
- `[ ]` Are exceptions reviewed when they expire?
- `[ ]` Is there a dashboard showing active exceptions per service?

**Related**: 05-rules.md (Rule 4: Set Exception Expiration Dates), 06-skills.md

---

## AP-5: Consistency Without Champion
**Category**: Process

**Description**: Making consistency "everyone's responsibility" with no designated owner. No one actively reviews new designs for consistency, enforces rules, or maintains the rule set. Consistency degrades across sprints.

**Warning Signs**:
- No one is explicitly responsible for consistency in sprint planning
- Design review happens "if someone has time"
- Rules drift without anyone noticing
- Inconsistencies are discovered during audits, not prevented during design

**Harms**:
- Rule drift accelerates over time
- No one maintains or prunes the rule set
- New team members don't learn consistency standards
- Inconsistency becomes normalized

**Real-World Consequence**: A 15-person team has "everyone responsible for consistency." No design reviews happen for 8 consecutive sprints. A new developer joins and invents different naming conventions in a new service. By the time anyone notices, 6 endpoints use the new convention.

**Preferred Alternative**: Rotate a consistency champion each sprint who is explicitly responsible for design reviews, rule enforcement, and rule set maintenance. Block 2 hours per week for this role.

**Refactoring Strategy**: Add consistency champion rotation to sprint planning process, create a rotation schedule for the next 6 months, establish minimum time allocation (2 hours/week), include consistency review in Definition of Done.

**Detection Checklist**:
- `[ ]` Is a consistency champion assigned for the current sprint?
- `[ ]` Was a design review conducted for each new endpoint this sprint?
- `[ ]` Has the rule set been reviewed in the last 3 months?
- `[ ]` Are consistency violations tracked and trended?

**Related**: 05-rules.md (Rule 6: Rotate Consistency Champion Each Sprint), 04-standardized-knowledge.md

---

## AP-6: Contradictory Sub-Conventions vs Global Conventions
**Category**: Architecture

**Description**: Teams creating sub-conventions that contradict organization-wide global conventions. Consumers who interact with multiple services experience inconsistent design, and enforcement tooling produces conflicting results.

**Warning Signs**:
- Team-level style guide contradicts organization-level guide
- CI tooling produces different results for different services
- Consumers complain about inconsistent API design across services
- Same endpoint pattern uses different naming in different services

**Harms**:
- Consumer confusion and integration friction
- Governance tooling cannot enforce consistently
- Multi-service features require adaptation layers
- Organization lacks unified API identity

**Real-World Consequence**: Global convention requires snake_case fields. An analytics team adopts camelCase for "data science efficiency." A consumer integrating with both services must maintain two serialization configurations. Automated linting passes one service and fails the other for the same violation.

**Preferred Alternative**: Team-level sub-conventions must extend, never contradict, global conventions. If a sub-convention conflicts with a global convention, the global wins.

**Refactoring Strategy**: Audit all team sub-conventions against global conventions, flag contradictions, create migration plan to align sub-conventions with global standards, add CI check that verifies no sub-convention contradicts global.

**Detection Checklist**:
- `[ ]` Are team sub-conventions documented and compared to global conventions?
- `[ ]` Do any team rules contradict global rules?
- `[ ]` Do consumers report inconsistent patterns across services?
- `[ ]` Can automated linting apply the same rules across all services?

**Related**: 05-rules.md (Rule 7: Never Contradict Global Conventions with Sub-Conventions), 04-standardized-knowledge.md
