# ECC Anti-Patterns — Big Ball of Mud

## Domain: Backend Architecture & Design | Subdomain: Anti-Patterns & Architectural Smells

### Anti-Pattern Inventory

1. **Full Rewrite Attempt** — Trying to rewrite entire system instead of incremental improvement
2. **Big Bang Refactoring** — Too many changes at once, breaks everything
3. **No Boundary Enforcement** — New code continues degrading because no fitness functions
4. **Perfectionism** — 80% improvement abandoned because 100% is too hard
5. **No Metrics** — Cannot measure progress or regression
6. **Leadership Disinvestment** — Architectural debt ignored until crisis

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Full Rewrite Attempt

**Category:** Strategy

**Description:** Deciding to rewrite the entire system from scratch.

**Why It Happens:** Developers overestimate ability to rebuild and underestimate complexity of existing system.

**Warning Signs:** "Let's rewrite in [new framework]" discussions; business value delayed 12+ months.

**Why Is It Harmful:** 90% of rewrites fail or take 2-3x longer than estimated. Business knowledge embedded in existing system is lost. Existing bugs are reintroduced.

**Preferred Alternative:** Incremental strangler fig pattern — replace pieces behind interfaces over time.

**Refactoring Strategy:** Identify seams in existing system. Wrap in interfaces. Replace one module at a time.

**Related Rules:** Never attempt full rewrite (05-rules.md)

---

### Anti-Pattern 2: Big Bang Refactoring

**Category:** Execution

**Description:** Massive refactoring efforts touching many files simultaneously.

**Why It Happens:** Desire to fix everything at once; impatience with incremental approach.

**Warning Signs:** Branch open for months; hundreds of files changed; merge conflicts daily.

**Why Is It Harmful:** High risk of introducing bugs across entire system. Team cannot ship features during refactoring. Business loses patience.

**Preferred Alternative:** Small, incremental refactorings merged frequently (daily).

**Refactoring Strategy:** Break refactoring into week-sized chunks. Each chunk independently mergeable. No branch open > 1 week.

**Related Rules:** Refactor incrementally (05-rules.md)

---

### Anti-Pattern 3: No Boundary Enforcement

**Category:** Governance

**Description:** After refactoring, no automated checks prevent new code from degrading.

**Why It Happens:** Team focuses on fixing current mess, not preventing future mess.

**Warning Signs:** Six months after refactoring, coupling metrics back to original levels.

**Why Is It Harmful:** All effort wasted. System reverts to mud within months.

**Preferred Alternative:** Add architecture fitness functions in CI as part of initial refactoring effort.

**Refactoring Strategy:** Add Deptrac/PHPStan rules as first step. Configure CI to fail on new violations.

**Related Rules:** Enforce boundaries with automated checks (05-rules.md)

---

### Anti-Pattern 4: Perfectionism

**Category:** Psychology

**Description:** Refactoring efforts abandoned because they can't achieve ideal state.

**Why It Happens:** Developers compare to ideal architecture, not to previous state.

**Warning Signs:** "This isn't clean enough" — code left in intermediate state; no improvement released because it's not "done."

**Why Is It Harmful:** Perfect is enemy of better. System remains in mud because incremental improvements never ship.

**Preferred Alternative:** Measure success by direction, not absolute position. 80% improvement shipped is better than 100% never shipped.

**Refactoring Strategy:** Define "good enough" criteria for each refactoring. Ship improvements incrementally.

**Related Rules:** Ship improvements, don't chase perfection (05-rules.md)

---

### Anti-Pattern 5: No Metrics

**Category:** Measurement

**Description:** No objective measures of architecture health before, during, or after refactoring.

**Why It Happens:** "We'll know it's better" intuition replaces measurement.

**Warning Signs:** Cannot answer "is the architecture improving?" with data.

**Why Is It Harmful:** Cannot prove refactoring value. Team effort invisible to stakeholders. Regression undetected.

**Preferred Alternative:** Track coupling metrics (Ca, Ce, cycles) over time with automated reporting.

**Refactoring Strategy:** Generate metrics baseline before refactoring. Track weekly. Share trends with team and stakeholders.

**Related Rules:** Measure architecture health objectively (05-rules.md)

---

### Anti-Pattern 6: Leadership Disinvestment

**Category:** Organizational

**Description:** Leadership refuses to invest time in architectural improvement.

**Why It Happens:** Short-term thinking; features prioritized over architecture.

**Warning Signs:** "No refactoring tickets" in backlog; architecture debt grows for years.

**Why Is It Harmful:** Debt compounds. Feature delivery slows exponentially as mud thickens. Eventually system becomes unmaintainable.

**Preferred Alternative:** Allocate 20% of each sprint to architectural improvement.

**Refactoring Strategy:** Quantify architecture debt in delivery time. Present business case: "fixing this now saves X hours per feature."

**Related Rules:** Invest regularly in architecture improvement (05-rules.md)
