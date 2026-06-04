# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Architectural Decision Records
**Knowledge Unit:** Architecture review and RFC processes
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Full RFC vs ADR-lite for a given decision
* Decision 2: RFC review group composition
* Decision 3: Which decisions merit formal evaluation vs lightweight approval

---

# Architecture-Level Decision Trees

---

## Decision: Full RFC vs ADR-lite for a given decision

---

## Decision Context

Choose the appropriate level of formality for documenting and reviewing an architectural decision.

---

## Decision Criteria

* performance considerations: full RFC ~30 min write, 15 min review; ADR-lite ~5 min write, 2 min review
* architectural considerations: decisions with cross-team impact need thorough evaluation
* security considerations: security-sensitive decisions may require restricted-access full RFC
* maintainability considerations: right level of formality prevents process fatigue

---

## Decision Tree

Does the decision have cross-team or cross-system impact?
↓
YES → Full RFC (multiple options, tradeoff analysis, review period)
NO → Does the decision introduce a new technology or framework?
    YES → Full RFC (significant long-term commitment)
    NO → Is the decision easily reversible (< 1 week to change)?
        YES → Does the decision affect architectural principles or patterns?
            YES → ADR-lite (document the choice, minimal process)
            NO → No documentation needed (trivial)
        NO → Full RFC (hard to reverse → need thorough evaluation)
            ↓
            Is compliance documentation required (SOC2, HIPAA)?
            YES → Full RFC regardless of impact (compliance mandate)

---

## Rationale

Full RFCs are for significant, hard-to-reverse decisions with broad impact. ADR-lite handles medium-impact choices that still need a trace. Trivial decisions need no formal process. Matching formality to impact prevents both process fatigue and missed evaluations.

---

## Recommended Default

**Default:** ADR-lite for most decisions; Full RFC only for cross-team, new technology, or irreversible choices.

**Reason:** Most architectural decisions benefit from some documentation but don't need the full RFC process. Reserve full RFCs for decisions where thorough evaluation of alternatives prevents costly mistakes.

---

## Risks Of Wrong Choice

Full RFC for trivial decisions: process fatigue, RFC abandonment, developer frustration. ADR-lite for major decisions: insufficient evaluation, missed alternatives, regretful long-term commitments. No documentation: lost rationale, repeated debates, onboarding confusion.

---

## Related Rules

- Rule 1: Write the RFC before writing the implementation code for any significant change
- Rule 3: Provide a lightweight option for trivial decisions

---

## Related Skills

- Run an Architecture RFC Review Process
- Write an Architecture Decision Record

---

## Decision: RFC Review Group Composition

---

## Decision Context

Determine who should be included in the review group for an RFC to balance thorough evaluation with decision velocity.

---

## Decision Criteria

* performance considerations: larger groups slow decision-making
* architectural considerations: missing stakeholders leads to misaligned decisions
* security considerations: security-sensitive RFCs need restricted group
* maintainability considerations: right group size prevents both narrow perspective and paralysis

---

## Decision Tree

Does the RFC affect a single team/domain?
↓
YES → Is the decision within the team's existing technical authority?
    YES → Team-internal review (team lead + senior IC)
    NO → Escalate to domain/architecture team
NO → Does the RFC affect multiple teams or the overall system architecture?
    YES → Broader review group (architects + affected team leads)
        ↓
        Does the RFC have security or compliance implications?
        YES → Include security/compliance representatives in review
        NO → Standard cross-team review
    NO → Are external stakeholders (vendors, partners) impacted?
        YES → Include external stakeholder representatives
        NO → Team-internal review

---

## Rationale

The review group should include everyone whose domain is significantly affected but should be as small as possible to maintain velocity. Default to team-internal review and escalate only for cross-team or high-risk decisions.

---

## Recommended Default

**Default:** Two to four reviewers: team lead + 1-2 senior ICs for team-internal; architects + affected leads for cross-team.

**Reason:** 2-4 reviewers provides sufficient perspective diversity without the delays of larger groups. Smaller groups make faster, clearer decisions.

---

## Risks Of Wrong Choice

Too few reviewers: missed perspectives, insufficient challenge to assumptions. Too many reviewers: delayed decisions, diffusion of responsibility, difficulty scheduling.

---

## Related Rules

- Rule 2: Decide by merit of argument, not seniority

---

## Related Skills

- Run an Architecture RFC Review Process
- Write an Architecture Decision Record

---

## Decision: Which Decisions Merit Formal Evaluation vs Lightweight Approval

---

## Decision Context

Categorize decisions by impact and reversibility to determine the appropriate level of evaluation rigor.

---

## Decision Criteria

* performance considerations: formal evaluation time must be proportional to decision impact
* architectural considerations: architectural decisions have compounding effects
* security considerations: security-critical decisions always need formal evaluation
* maintainability considerations: decisions with long-term consequences need more rigor

---

## Decision Tree

Is the decision easily reversible (cost to reverse < 1 week)?
↓
YES → Is the decision purely cosmetic or organizational (renaming, tooling choice)?
    YES → No formal evaluation (commit and move on)
    NO → Is the decision low cost even if wrong?
        YES → Lightweight approval (TL:DR|LGTM)
        NO → ADR-lite (document choice, brief context)
NO → Does the decision affect system architecture or technology selection?
    YES → Does the decision have security, compliance, or cost implications?
        YES → Full RFC with formal review period
        NO → Full RFC (hard to reverse → thorough evaluation)
    NO → Does the decision change development workflow or team process?
        YES → ADR-lite (document for team awareness)
        NO → Full RFC (assume high-impact until proven otherwise)

---

## Rationale

The evaluation rigor should match the decision's impact and reversibility. High-impact, hard-to-reverse decisions (technology adoption, architectural pattern shifts) require full RFCs. Low-impact, easily reversible decisions need minimal process.

---

## Recommended Default

**Default:** Lightweight approval for easily reversible decisions; ADR-lite for medium impact; Full RFC for hard-to-reverse decisions.

**Reason:** Matching process to impact prevents both under-evaluation of important decisions and over-processing of trivial ones.

---

## Risks Of Wrong Choice

No documentation for medium-impact decisions: rationale lost, future confusion about why the choice was made. Full RFC for trivial decisions: wasted time, process fatigue, team frustration with bureaucracy.

---

## Related Rules

- Rule 1: Write the RFC before writing the implementation code for any significant change
- Rule 3: Provide a lightweight option for trivial decisions

---

## Related Skills

- Run an Architecture RFC Review Process
- Write an Architecture Decision Record
