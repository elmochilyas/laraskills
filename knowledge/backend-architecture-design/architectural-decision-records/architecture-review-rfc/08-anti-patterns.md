# ECC Anti-Patterns — Architecture Review & RFC

## Domain: Backend Architecture & Design | Subdomain: Architectural Governance

### Anti-Pattern Inventory

1. **RFC After Implementation** — RFC created retroactively, defeating its purpose
2. **RFC Overload** — RFCs too long, nobody reads them
3. **Stalled RFCs** — No review period deadline; RFCs languish indefinitely
4. **Decision by Seniority** — Decisions made by title, not argument quality
5. **No Lightweight Option** — Every decision requires full RFC process
6. **No Retrospective** — Same mistakes repeated across decisions

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: RFC After Implementation

**Category:** Process

**Description:** RFC written after code is already shipped.

**Why It Happens:** Pressure to deliver; "we'll write the RFC afterward" rationalization.

**Warning Signs:** RFC dates after implementation dates; RFC describes what was built, not what was considered.

**Why Is It Harmful:** No genuine tradeoff analysis. Alternative solutions never evaluated. RFC becomes documentation, not decision-making.

**Preferred Alternative:** Require RFC approval before implementation of significant changes.

**Refactoring Strategy:** Block significant PRs without approved RFC. Use lightweight RFC for time-sensitive decisions.

**Related Rules:** Require RFC before implementation (05-rules.md)

---

### Anti-Pattern 2: RFC Overload

**Category:** Process

**Description:** RFC documents exceeding 10+ pages, overwhelming reviewers.

**Why It Happens:** Authors try to be comprehensive; no page limit enforced.

**Warning Signs:** Average RFC read time > 30 minutes; reviewers skip reading; PR comments reveal lack of RFC knowledge.

**Why Is It Harmful:** Nobody reads the RFC. Decisions made without proper review. Process exists but produces no value.

**Preferred Alternative:** Enforce RFC length limits (executive summary + key sections). Use appendices for details.

**Refactoring Strategy:** Add RFC template with max section length. Require executive summary. Move details to linked documents.

**Related Rules:** Keep RFCs focused and concise (05-rules.md)

---

### Anti-Pattern 3: Stalled RFCs

**Category:** Process

**Description:** RFC review period has no deadline; decisions never finalized.

**Why It Happens:** No explicit review period; reviewers prioritize other work.

**Warning Signs:** RFCs months old with no decision; blocked work pending RFC resolution.

**Why Is It Harmful:** Teams blocked waiting for decisions. Impatience leads to bypassing the process entirely.

**Preferred Alternative:** Set explicit review period (e.g., 3-7 days). Default: approve if no objections within window.

**Refactoring Strategy:** Add review period to RFC template. Configure auto-reminders. Escalate stalled RFCs to engineering manager.

**Related Rules:** Set review period deadlines (05-rules.md)

---

### Anti-Pattern 4: Decision by Seniority

**Category:** Culture

**Description:** RFC outcome determined by who proposed it, not content quality.

**Why It Happens:** Hierarchical culture; implicit bias toward senior team members.

**Warning Signs:** Senior dev RFCs always approved; junior dev RFCs always questioned; same ideas rejected/accepted based on author.

**Why Is It Harmful:** Best ideas lose to hierarchy. Junior team members disengage from architecture decisions.

**Preferred Alternative:** Evaluate RFCs on technical merit. Use anonymous review for controversial decisions.

**Refactoring Strategy:** Establish decision criteria independent of author. Encourage junior team members to propose RFCs.

**Related Rules:** Evaluate decisions on merit, not seniority (05-rules.md)

---

### Anti-Pattern 5: No Lightweight Option

**Category:** Process

**Description:** Full RFC process required for even minor architectural decisions.

**Why It Happens:** One-size-fits-all process; no tiered decision framework.

**Warning Signs:** Teams bypassing RFC process entirely for simple decisions; RFC queue full of trivial proposals.

**Why Is It Harmful:** Process overhead kills agility. Teams stop using RFC for anything.

**Preferred Alternative:** Tiered process: lightweight decision log for simple changes, full RFC for significant ones.

**Refactoring Strategy:** Create a lightweight decision template (3 sentences). Define criteria for each tier.

**Related Rules:** Implement tiered review process (05-rules.md)

---

### Anti-Pattern 6: No Retrospective

**Category:** Learning

**Description:** RFC decisions never reviewed after implementation.

**Why It Happens:** No scheduled follow-up; next decision already in progress.

**Warning Signs:** Same mistakes repeated in different RFCs; no "we tried this before" references.

**Why Is It Harmful:** Organizational learning blocked. Teams repeat failed patterns because previous outcomes are forgotten.

**Preferred Alternative:** Schedule retrospective 3-6 months after major RFC implementation.

**Refactoring Strategy:** Add retrospective reminder to RFC template. Document outcomes in ADR status updates.

**Related Rules:** Review major decisions post-implementation (05-rules.md)
