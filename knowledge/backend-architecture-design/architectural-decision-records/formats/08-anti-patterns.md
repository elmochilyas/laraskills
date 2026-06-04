# ECC Anti-Patterns — ADR Formats

## Domain: Backend Architecture & Design | Subdomain: Architectural Governance

### Anti-Pattern Inventory

1. **Post-Hoc ADR** — Creating ADRs after decisions are already made (retroactive rationalization)
2. **No Supersession Management** — Old ADRs linger as active, causing confusion about current decisions
3. **ADR Fatigue** — Too many ADRs for trivial decisions; team stops using them
4. **Too Few ADRs** — Significant decisions undocumented, rationale lost
5. **Hidden ADRs** — ADRs in separate system, not visible during development
6. **No Template** — Inconsistent quality, missing sections, hard to compare

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Post-Hoc ADR

**Category:** Process

**Description:** ADRs created after implementation rather than before/during decision-making.

**Why It Happens:** Pressure to ship; "we'll document it later" mindset.

**Warning Signs:** ADR creation dates are after implementation dates; ADR describes decisions without exploring alternatives.

**Why Is It Harmful:** Rationalization replaces genuine tradeoff analysis. Alternatives not considered. Team loses documentation discipline.

**Preferred Alternative:** Write ADR before or during decision process, including rejected alternatives.

**Refactoring Strategy:** Require ADR approval before implementation for significant decisions. Use RFC process for enforcement.

**Related Rules:** Document decisions before implementation (05-rules.md)

---

### Anti-Pattern 2: No Supersession Management

**Category:** Maintenance

**Description:** Old ADRs remain marked as active after being replaced.

**Why It Happens:** No process for updating ADR status when decisions change.

**Warning Signs:** Multiple ADRs with conflicting "Accepted" statuses; no "Superseded by" links between ADRs.

**Why Is It Harmful:** New team members read outdated ADRs and follow wrong decisions. Architectural drift accelerates.

**Preferred Alternative:** Every new ADR that replaces an old one must update the old ADR's status.

**Refactoring Strategy:** Audit existing ADRs. Add supersession links. Implement CI check that prevents conflicting active ADRs.

**Related Rules:** Maintain supersession chain for all ADRs (05-rules.md)

---

### Anti-Pattern 3: ADR Fatigue

**Category:** Process

**Description:** Requiring ADRs for trivial decisions, causing team to abandon the practice.

**Why It Happens:** No threshold for what requires an ADR. Well-intentioned but over-applied.

**Warning Signs:** ADRs for minor config changes; ADR backlog growing; team complains about process overhead.

**Why Is It Harmful:** ADRs become noise. Important decisions drown in trivial ones. Team stops reading any ADRs.

**Preferred Alternative:** Define clear criteria for when ADRs are required (architecture decisions only, not implementation details).

**Refactoring Strategy:** Create a decision threshold guide. Archive existing trivial ADRs. Keep only significant ones active.

**Related Rules:** Define ADR threshold criteria (05-rules.md)

---

### Anti-Pattern 4: Too Few ADRs

**Category:** Process

**Description:** Significant architectural decisions made without any ADR.

**Why It Happens:** Over-correction from ADR fatigue; lack of enforcement.

**Warning Signs:** Architecture drift without documentation; new team members asking "why did we do it this way?" repeatedly.

**Why Is It Harmful:** Tribal knowledge becomes single source of truth. Team members leave = architecture rationale lost.

**Preferred Alternative:** Require ADR for any decision with lasting architectural impact.

**Refactoring Strategy:** Create an ADR checklist for significant changes. Add ADR requirement to pull request template.

**Related Rules:** Document all significant architecture decisions (05-rules.md)

---

### Anti-Pattern 5: Hidden ADRs

**Category:** Accessibility

**Description:** ADRs stored in separate system (wiki, Google Docs) not accessible during development.

**Why It Happens:** Historical practice; documentation "silo" mentality.

**Warning Signs:** Developers can't find ADRs; ADRs linked in PR comments go to external system.

**Why Is It Harmful:** Decisions invisible during coding. Developers make inconsistent choices because they can't reference prior decisions.

**Preferred Alternative:** Store ADRs in version control alongside code (e.g., `docs/adr/`).

**Refactoring Strategy:** Migrate existing ADRs from external system to codebase. Set up auto-generation of ADR index page.

**Related Rules:** Store ADRs in version control (05-rules.md)

---

### Anti-Pattern 6: No Template

**Category:** Quality

**Description:** ADRs written without consistent structure, missing key sections.

**Why It Happens:** No format enforcement; each ADR author uses their own style.

**Warning Signs:** ADRs vary wildly in length and content; missing context, alternatives, or consequences sections.

**Why Is It Harmful:** Hard to compare ADRs. Important information often omitted. New team members can't follow the format.

**Preferred Alternative:** Use a standardized ADR template (Nygard, MADR, or Y-Statement) for all ADRs.

**Refactoring Strategy:** Create an ADR template file. Add to project scaffolding. Enforce via PR review guidelines.

**Related Rules:** Use standardized ADR template (05-rules.md)
