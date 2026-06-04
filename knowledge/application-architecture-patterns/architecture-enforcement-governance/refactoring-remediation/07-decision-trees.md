# Decision Trees: Refactoring and Remediation Workflows

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** Refactoring and remediation workflows
- **Knowledge Unit ID:** AEG-09
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Fix immediately vs backlog for later | Process | Violation remediation timing |
| 2 | Strangler pattern vs big-bang rewrite | Architecture | Large-scale refactoring approach |
| 3 | Boy scout rule (fix on touch) vs leave alone | Process | Violation handling in existing code |

---

## Decision 1: Fix immediately vs backlog for later

### Context
When a violation is detected, it can be fixed immediately (current sprint) or deferred to a backlog for later. The decision depends on the violation's severity. Fixing immediately prevents the violation from being built upon. Deferring allows continued feature work but risks the violation becoming more entrenched.

### Decision Tree

```
What is the severity of the violation?
├── Critical — broken context isolation, circular dependency, security issue
│   → Fix immediately in the current sprint
│   Every day deferred:
│   ├── More code is built on top of the violation
│   ├── The fix becomes exponentially more expensive
│   └── Remove dependency by extracting/reorganizing
├── High — unauthorized import, missing core contract
│   → Fix immediately or in the next sprint
│   Not as urgent as critical but still high impact
│   └── Is there a workaround that doesn't violate rules?
│       ├── YES → May be scheduled for next sprint
│       └── NO → Fix immediately
├── Medium — incorrect layer usage (Service calling Controller)
│   → Schedule in upcoming sprint
│   └── Can it be fixed as part of an upcoming feature PR?
│       ├── YES → Include with feature work (boy scout rule)
│       └── NO → Backlog for cleanup sprint
└── Low — naming convention, minor style violation
    → Backlog for cleanup sprint
    Group with other low-severity violations
    Fix in bulk every 4-6 weeks
    Individual fixes have disproportionate overhead
```

### Rationale
Time amplifies the cost of architectural violations exponentially. A circular dependency between two classes today involves 2 files. If left for 6 months while 15 more classes are built on both sides, the fix involves 30+ files. Critical violations must be fixed immediately — allocate time from the current sprint. Low-severity violations are cheaper to fix in bulk (one cleanup sprint) than individually (20 separate PRs, reviews, and deployments). The classification system ensures effort is proportional to impact.

### Recommended Default
Critical/High → fix immediately; Medium/Low → backlog for cleanup sprint

### Risks
- Critical deferred: exponential cost growth, more code built on broken foundation
- Low fixed individually: disproportionate overhead per fix
- All violations deferred: architecture degrades, fixes never happen

### Related Rules
- Fix Critical Violations Immediately (AEG-09/05-rules.md)
- Group Low-Severity Violations For Cleanup Sprints (AEG-09/05-rules.md)
- Classify Violations By Severity (AEG-09/05-rules.md)

### Related Skills
- Remediate Architectural Violations Systematically (AEG-09/06-skills.md)
- Track Architecture Drift (AEG-08/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)

---

## Decision 2: Strangler pattern vs big-bang rewrite

### Decision Tree

```
What is the scope of the refactoring?
├── Large — involves multiple contexts, changes dependency structure
│   → Use strangler pattern (incremental replacement)
│   Steps:
│   1. Build the new structure alongside the old
│   2. Route traffic to the new structure
│   3. Monitor for issues
│   4. Remove the old structure
│   Pros: incremental, reversible, low risk, deliveries during refactoring
│   Cons: temporary dual-maintenance cost
│   └── Is the refactoring complex enough to risk failure?
│       ├── YES → Strangler is the only safe approach
│       └── NO → Direct fix may be possible but strangler is still safer
├── Small — single class rename, method extraction, interface extraction
│   → Direct fix in a single PR
│   No strangler needed — the change is small enough to verify immediately
│   └── Does the change involve API consumers?
│       ├── YES → Consider deprecation path, not strangler
│       └── NO → Direct fix is fine
└── Full system rewrite ("let's rewrite everything")
    → Anti-pattern — never do big-bang rewrites
    Takes months, stops feature delivery, high risk of failure
    └── When is a big rewrite acceptable?
        ├── NEVER for architecture refactoring
        └── Only for platform/tech stack migration with clear rollback plan
```

### Rationale
Big-bang rewrites are the most common and most expensive architectural mistake. "We'll stop everything and rewrite the Checkout context" sounds clean but in practice takes months, stops all feature delivery, and faces unknown risks. The strangler pattern is incremental, reversible, and low-risk. At any point, the system can be rolled back to the old structure. Each increment delivers value independently. The temporary dual-maintenance cost is far lower than the risk of a failed rewrite.

### Recommended Default
Strangler pattern for large refactoring; direct fix for small changes

### Risks
- Big-bang rewrite: high risk, long period without delivery, rollback difficult
- Strangler without traffic routing: both paths active but no way to test the new one
- Direct fix on large change: high risk of breaking changes

### Related Rules
- Use Strangler Pattern For Large-Scale Refactoring (AEG-09/05-rules.md)
- Always Verify Remediation With Architecture Tests (AEG-09/05-rules.md)
- Never Use Big-Bang Approach (AEG-09/05-rules.md)

### Related Skills
- Remediate Architectural Violations Systematically (AEG-09/06-skills.md)
- Extract Module from Monolith (MMD-11/06-skills.md)
- Integrate Legacy Systems (DBC-10/06-skills.md)

---

## Decision 3: Boy scout rule (fix on touch) vs leave alone

### Decision Tree

```
A developer is modifying an existing file that has a pre-existing architectural violation.
├── Fix the violation as part of the current change
│   → Boy scout rule: leave code cleaner than you found it
│   The violation is in the file they're already modifying
│   Fix cost: 2-15 minutes (add to the existing PR)
│   Benefits:
│   ├── 2-minute fix now prevents 2-hour fix later
│   ├── No separate PR overhead
│   └── Gradual improvement of codebase without dedicated refactoring sprints
├── Leave the violation — fix it in a separate PR
│   → NOT recommended for small violations
│   Separate PR cost:
│   ├── Branch, commit, PR, review, CI, merge, deploy
│   ├── 30-60 minutes of overhead for a 2-minute fix
│   └── Developer context-switching to a different task
│   └── Is the developer under extreme time pressure?
│       ├── YES → Leave it (but create a backlog item)
│       └── NO → Fix it now — cheaper in the long run
└── File the violation as a bug — never fix it
    → Anti-pattern — violations only grow worse
    "I didn't create this violation, not my problem"
    Everyone thinks this → no one fixes violations
```

### Rationale
The boy scout rule is the cheapest way to fix architectural violations. When a developer is already modifying a file, fixing a pre-existing violation adds minutes to the existing PR. Leaving it creates a separate task that requires branching, committing, reviewing, and deploying — 30-60 minutes of overhead for each fix. Over a team of 10 developers fixing one small violation per week, the boy scout rule saves 200+ hours of overhead per year. The key is to fix violations in code you touch, not to create separate tasks for them.

### Recommended Default
Fix small violations in code you touch (boy scout rule); create backlog items only for violations outside your current scope

### Risks
- Leaving violations: they accumulate, future fixes are more expensive
- Fixing too aggressively: scope creep on a PR far beyond what was planned
- No backlog for left violations: forgotten violations never get fixed

### Related Rules
- Always Apply The Boy Scout Rule (AEG-09/05-rules.md)
- Fix Critical Violations Immediately (AEG-09/05-rules.md)
- Always Verify Remediation With Architecture Tests (AEG-09/05-rules.md)

### Related Skills
- Remediate Architectural Violations Systematically (AEG-09/06-skills.md)
- Track Architecture Drift (AEG-08/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
