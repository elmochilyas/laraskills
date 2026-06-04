# Decision Trees: Team-to-Context Mapping

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Team-to-context mapping: Conway's Law in practice
- **Knowledge Unit ID:** DBC-09
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Single-owner vs shared context | Architecture | Team organization |
| 2 | CODEOWNERS enforcement vs manual review | Architecture | Ownership enforcement |
| 3 | Cross-team contract review vs unilateral changes | Architecture | Contract governance |

---

## Decision 1: Single-owner vs shared context

### Context
Conway's Law states that systems mirror communication structures. A shared context (two teams responsible for the same code) creates coordination overhead — every change needs cross-team alignment. Each context should have exactly one owning team. If multiple teams must modify a context, either split the context or merge the teams.

### Decision Tree

```
Do multiple teams need to modify the same bounded context?
├── NO → Each context already has one owner — maintain this
│   Document ownership in a team-to-context matrix
├── YES → Two options:
│   ├── Split the context into smaller contexts aligned to each team
│   │   Identify divergent concepts that different teams need
│   │   Create separate contexts for each team's area
│   │   Define contracts between them
│   └── Keep as shared context (NOT recommended)
│       → Is this a temporary situation?
│       ├── YES → Tolerate with explicit coordination process
│       │   Daily sync, shared backlog, CODEOWNERS requiring both teams
│       │   Plan to split within the next quarter
│       └── NO → MUST split
│           Shared contexts without a resolution plan degrade over time
│           No team feels full ownership, quality drops
└── Context has no owner (orphaned)
    → Assign ownership immediately
    Any team can be assigned, but must be explicit
    Orphaned contexts degrade fastest — no accountability
```

### Rationale
Shared contexts are the single biggest source of architectural friction in multi-team organizations. Every decision requires coordination, code quality suffers from split accountability, and deadlines slip because changes block on cross-team review. Splitting the context to match team boundaries is almost always worth the cost. If the context is genuinely shared and splitting is impractical, treat it as a temporary situation with a documented resolution plan.

### Recommended Default
Exactly one owning team per context; split the context if multiple teams need it

### Risks
- Shared context: cross-team coordination for every change, no clear accountability
- Orphaned context: no team feels responsible, quality degrades
- Context split done incorrectly: creates new coupling problems between finer-grained contexts

### Related Rules
- Assign exactly one owning team per bounded context (DBC-09/05-rules.md)
- Do not orphan contexts (DBC-09/05-rules.md)
- Match the number of contexts roughly to the number of teams (DBC-09/05-rules.md)

### Related Skills
- Map Teams to Bounded Contexts for Clear Ownership (DBC-09/06-skills.md)
- Apply Team-Scale Strategies (COS-10/06-skills.md)
- Identify Bounded Contexts (DBC-01/06-skills.md)

---

## Decision 2: CODEOWNERS enforcement vs manual review

### Decision Tree

```
Does the repository have a CODEOWNERS file or equivalent?
├── NO → Add CODEOWNERS immediately
│   Specify which team owns each context directory
│   PRs touching a context require owning team's approval
│   Is there pushback about CODEOWNERS overhead?
│   ├── YES → Explain: the overhead is less than unauthorized changes causing bugs
│   │   CODEOWNERS prevents one team from accidentally modifying another's context
│   └── NO → Proceed with CODEOWNERS implementation
└── YES → Is CODEOWNERS actually enforced in CI (required checks)?
    ├── YES → Good — ownership is enforced at the automation level
    │   Are there exceptions being made (bypassing CODEOWNERS)?
    │   ├── YES → Investigate — exceptions may indicate boundary problems
    │   │   Frequent bypass: context may need splitting
    │   └── NO → CODEOWNERS working correctly
    └── NO → Enable required checks for CODEOWNERS
        Without enforcement, CODEOWNERS is documentation only
        Enable branch protection rules requiring CODEOWNER approval
```

### Rationale
CODEOWNERS is the primary tool for enforcing context ownership at the code level. Without it, context boundaries are purely social contracts that can be violated in any PR. With CODEOWNERS and required checks enabled, changes to a context require approval from the owning team. This prevents accidental modifications (someone fixing "just a typo" in another context) and makes ownership explicit in the developer workflow.

### Recommended Default
CODEOWNERS enforced with required branch protection checks

### Risks
- No CODEOWNERS: context boundaries not enforced, unauthorized changes slip through
- CODEOWNERS without enforcement: documentation only, no actual gate
- Overly restrictive CODEOWNERS: shared kernel or cross-cutting changes blocked by all teams

### Related Rules
- Use CODEOWNERS to enforce context ownership at the code level (DBC-09/05-rules.md)
- Require cross-team contract review for interface changes (DBC-09/05-rules.md)
- Limit one team to owning no more than 3 contexts (DBC-09/05-rules.md)

### Related Skills
- Map Teams to Bounded Contexts for Clear Ownership (DBC-09/06-skills.md)
- Design Code Review Checklists (AEG-04/06-skills.md)
- Run Architecture Tests (AEG-01/06-skills.md)

---

## Decision 3: Cross-team contract review vs unilateral changes

### Decision Tree

```
Does the change modify the context's public contract (interface, event, DTO)?
├── YES → Must have cross-team review
│   Are there consuming teams that depend on this contract?
│   ├── YES → Review required by all consuming teams
│   │   Changes to interface methods, event payloads, or DTO schemas
│   │   Can break downstream consumers silently
│   │   Adding new fields: no review needed (non-breaking)
│   │   Removing/renaming fields or methods: review REQUIRED
│   └── NO (no known consumers)
│       → Still ping affected teams in the PR description
│       Future consumers may be affected
└── NO (internal implementation change only)
    → No cross-team review needed
    Internal refactoring, adding private methods
    The owning team makes decisions within their context
    Does the change affect behavior visible to consumers?
    ├── YES → It's a contract change — needs review
    └── NO → Internal change — no review needed
```

### Rationale
Contract changes are the primary integration risk between teams. A team adding a new field to a DTO is safe. A team removing a field that a downstream consumer depends on will break production. Cross-team contract review ensures that consuming teams know about changes, can adjust their code, and agree to the change. The review doesn't give consuming teams veto power over the owning team's design decisions — it ensures awareness and coordination.

### Recommended Default
Cross-team review required for breaking contract changes; internal changes need no cross-team approval

### Risks
- Unilateral contract change: breaks downstream consumers in production
- Overly restrictive review: every field addition requires all-consuming team approval — slows development
- No contract change notification: consuming team discovers breaking changes only when things fail

### Related Rules
- Require cross-team contract review for interface changes (DBC-09/05-rules.md)
- Use CODEOWNERS to enforce context ownership at the code level (DBC-09/05-rules.md)
- Limit one team to owning no more than 3 contexts (DBC-09/05-rules.md)

### Related Skills
- Map Teams to Bounded Contexts for Clear Ownership (DBC-09/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Design Code Review Checklists (AEG-04/06-skills.md)
