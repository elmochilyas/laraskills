# Decision Trees — Provider Sprawl and Governance

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Sprawl and Governance |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Provider Budget Enforcement | Whether to set a hard limit on provider count and enforce it in CI | Architecture governance | High |
| D02 | Deferred-First vs Eager-First Policy | Whether new providers should default to deferred or eager | Provider creation policy | High |
| D03 | Audit Action Determination | What action to take for a given provider during a provider audit | Periodic maintenance | High |
| D04 | Consolidation vs Deferral Tradeoff | Whether to consolidate multiple providers or convert them to deferred for performance | Performance optimization | Medium |

---

## D01: Provider Budget Enforcement

### Decision Context
Provider count is growing and you need to decide whether to implement a formal provider budget with CI enforcement.

### Criteria
1. **Current provider count**: How many total providers (manual + discovered) exist?
2. **Growth trend**: Is the provider count increasing each quarter?
3. **Performance impact**: Is bootstrap time degradation correlated with provider count growth?
4. **Team size**: How many developers/teams are adding providers?

### Decision Tree
```
Considering provider budget enforcement
├── Total providers (manual + discovered) >50?
│   ├── Yes → Implement hard budget with CI enforcement immediately
│   └── No → Is provider count >30 and growing?
│       ├── Yes → Is bootstrap time degradation noticeable?
│       │   ├── Yes → Implement budget with CI enforcement
│       │   └── No → Set soft budget (documented but not CI-enforced) and monitor
│       └── No → Is team size >5 with multiple people adding providers?
│           ├── Yes → Implement soft budget with quarterly audit
│           └── No → No formal budget needed — monitor manually
```

### Rationale
Provider sprawl is a cumulative problem — each individual addition seems reasonable, but the total degrades performance linearly. CI enforcement prevents unchecked growth by requiring consolidation or removal before adding new providers. The threshold depends on the application: 50+ providers is a clear signal for hard enforcement, 30+ with growth warrants soft enforcement, and <30 with stable count may not need formal governance.

### Default
Implement hard CI enforcement at 50 providers. Set soft budget at 30 with quarterly audits.

### Risks
- Budget too low: frequent violations cause alert fatigue, team ignores.
- Budget too high: sprawl becomes entrenched before enforcement kicks in.
- Only counting manual providers, ignoring auto-discovered packages.

### Related Rules/Skills
- Skill: Enforce Provider Budget in CI
- Skill: Perform a Provider Audit

---

## D02: Deferred-First vs Eager-First Policy

### Decision Context
You need to decide the default policy for new providers: default to deferred (lazy load unless proven necessary) or default to eager (load on every request unless proven unnecessary).

### Criteria
1. **Current provider count**: How many providers already exist?
2. **Performance requirements**: Is sub-100ms TTFB a requirement?
3. **Team discipline**: Can the team reliably identify which providers must be eager?
4. **Boot-time registration**: How often do new providers register routes/views/events?

### Decision Tree
```
Choosing default provider policy
├── Is sub-100ms TTFB a requirement?
│   ├── Yes → Deferred-first policy (default all new providers to deferred)
│   └── No → Is current provider count >30?
│       ├── Yes → Deferred-first policy (prevent further cumulative overhead)
│       └── No → Is the team experienced with provider lifecycle?
│           ├── Yes → Eager-first is fine (team makes correct decisions)
│           └── No → Deferred-first (safer default; forces explicit eager justification)
├── Deferred-first implementation:
│   ├── Always implement DeferrableProvider for new providers
│   ├── Require explicit justification to keep a provider eager
│   └── Document why each eager provider cannot be deferred
```

### Rationale
Deferred-first is the safer policy for performance-sensitive applications: it eliminates overhead for every provider that doesn't need to be eager. Eager-first is simpler but accumulates overhead. The choice depends on performance requirements and team maturity. Experienced teams can safely use eager-first and make correct deferral decisions. Less experienced teams benefit from deferred-first which forces explicit thought about eagerness.

### Default
Eager-first for small applications (<30 providers) with experienced teams. Deferred-first for everything else.

### Risks
- Deferred-first with inexperienced team: providers incorrectly deferred when they register routes.
- Eager-first with growth: cumulative overhead unnoticed until performance is affected.
- Policy not consistently enforced: some providers deferred, some eager, no pattern.

### Related Rules/Skills
- Rule 1: Defer Rarely-Used Services to Optimize Bootstrap Time
- Skill: Audit and Optimize Eager Provider Overhead
- Skill: Enforce Provider Budget in CI

---

## D03: Audit Action Determination

### Decision Context
During a quarterly provider audit, you are evaluating each provider to determine what action to take.

### Criteria
1. **Usage**: Are the provider's services still used?
2. **Performance cost**: How much bootstrap time does this provider contribute?
3. **Deferral eligibility**: Can this provider be deferred?
4. **Consolidation opportunity**: Is this provider a candidate for merging with another?

### Decision Tree
```
Provider audit — determine action
├── Is the provider's application feature still in use?
│   ├── No → Remove the provider entirely
│   └── Yes → Does the provider's boot() register routes, views, or events?
│       ├── Yes (must be eager) → Is the provider's register() + boot() >0.5ms?
│       │   ├── Yes → Optimize workload — move I/O to deferred or lazy
│       │   └── No → Keep as-is (necessary overhead)
│       └── No (eligible for deferral) → Are services used on <30% of routes?
│           ├── Yes → Convert to deferred
│           └── No → Is bootstrap time a current concern?
│               ├── Yes → Convert to deferred (marginal gain)
│               └── No → Can this provider be consolidated with another?
│                   ├── Yes → Consolidate (reduce provider count)
│                   └── No → Keep as-is
```

### Rationale
Each provider should justify its existence and its current configuration. The audit follows a funnel: remove unused providers first (biggest win), then convert eligible ones to deferred (performance win), then consolidate where appropriate (maintainability win), and finally optimize heavy providers that must remain eager.

### Default
Remove unused → convert to deferred → consolidate → optimize.

### Risks
- Removing a provider that is actually needed in an infrequent code path.
- Converting a provider that registers routes/views/events (silent breakage).
- Poor consolidation creating God providers.

### Related Rules/Skills
- Skill: Perform a Provider Audit

---

## D04: Consolidation vs Deferral Tradeoff

### Decision Context
Multiple providers exist in the same domain. You can either consolidate them into fewer providers (reducing count but not per-request overhead) or convert some to deferred (keeping count but eliminating per-request overhead for unused services).

### Criteria
1. **Provider count vs utilization**: Is overhead coming from many providers or from heavy eager providers?
2. **Deferral eligibility**: Can each provider be deferred individually?
3. **Domain cohesion**: Do the providers share the same domain?
4. **Maintenance cost**: Is the number of files causing navigation difficulty?

### Decision Tree
```
Multiple providers in same domain — consolidation vs deferral
├── Are the providers individually eligible for deferral?
│   ├── Yes → Is the main concern performance or maintainability?
│   │   ├── Performance → Defer each provider individually (zero overhead when unused)
│   │   └── Maintainability → Consolidate into fewer providers (easier to navigate)
│   └── No (some must be eager) → Consolidate the eager ones, defer the deferrable ones
├── Mixed strategy (recommended):
│   ├── Consolidate providers with the same lifecycle (all eager or all deferred)
│   ├── Keep separate providers with different lifecycles (enables selective deferral)
│   └── Target: 10-30 total providers, each clearly titled by domain
```

### Rationale
Consolidation and deferral solve different problems. Consolidation reduces provider count (helping maintainability and reducing iteration overhead). Deferral eliminates per-request bootstrap cost for unused services. They are complementary: consolidate providers with the same lifecycle, but keep providers with different lifecycles separate to enable selective deferral.

### Default
Consolidate same-lifecycle providers. Keep different-lifecycle providers separate. Target 10-30 total providers.

### Risks
- Consolidating eager and deferrable providers = everything becomes eager.
- Deferring instead of consolidating = maintainability still suffers from many files.
- Doing neither = both performance and maintainability degrade.

### Related Rules/Skills
- Rule 2: Prefer Deferred Providers for Services Used on Fewer Than 30% of Routes
- Skill: Audit and Optimize Eager Provider Overhead
- Skill: Perform a Provider Audit
