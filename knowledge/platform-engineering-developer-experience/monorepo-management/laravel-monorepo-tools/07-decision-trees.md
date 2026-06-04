# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Monorepo Management
**Knowledge Unit:** Laravel Monorepo Tools
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Monorepo vs separate repos? | Package coupling, atomic commits | Monorepo for closely related packages that change together |
| 2 | Split on tag vs split on commit? | CI cost, release intentionality | Split on tags (intentional releases) |

---

# Architecture-Level Decision Trees

---

## Decision 1: Monorepo vs Separate Repos?

---

## Decision Context

Multiple Laravel packages can be managed in a monorepo (single repo) or separate repositories. The choice affects development workflow, CI complexity, and release management.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Do the packages frequently change together (cross-package refactoring, shared API changes)?
↓
YES → **Monorepo** — atomic commits across packages; single CI; shared tooling
NO → ↓
Do packages have different Laravel/PHP version requirements?
↓
YES → **Separate repos** — monorepo enforces single version policy
NO → ↓
Are the packages consumed by external teams who prefer independent repos?
↓
YES → Separate repos (or monorepo with split testing)
NO → ↓
Is the team comfortable with monorepo tooling and CI?
↓
NO → Separate repos; monorepo complexity isn't justified
YES → **Monorepo** — especially if packages share tooling and CI

---

## Rationale

Monorepos excel when packages are tightly coupled and change together. They fail when packages have incompatible requirements or independent release cadences. The decision hinges on how often cross-package changes occur.

---

## Recommended Default

**Default:** Separate repos for packages with independent cadences; monorepo for tightly coupled packages
**Reason:** Monorepo complexity only pays back when packages frequently change together

---

## Risks Of Wrong Choice

- **Monorepo for unrelated packages:** Slow CI, confusing structure, version coordination overhead
- **Separate repos for coupled packages:** Cross-repo refactoring is painful; no atomic commits

---

## Related Rules

- GP-RULE-010: Path deprecation

---

## Related Skills

- Manage Golden Path Lifecycle and Adoption

---

## Decision 2: Split on Tag vs Split on Commit?

---

## Decision Context

Split operations (extracting package subdirectories to independent repos) can trigger on every commit or only on tagged releases. The choice affects CI cost and release discipline.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

How often are packages released?
↓
Multiple times daily → **Split on commit** (with CI pass gate) — may justify frequency
Weekly or less → **Split on tag** — intentional, infrequent splits
Monthly or less → **Split on tag** — clearly the right choice
Regardless:
- Always validate monorepo CI before splitting
- Use tag convention: `{package-name}/{semver}`
- Each package has independent split validation
- Add post-split verification of package integrity

---

## Rationale

Tag-based splits keep operations intentional and controlled. Commit-based splits generate noise and consume CI resources. The tag convention enables clear mapping between monorepo releases and package versions.

---

## Recommended Default

**Default:** Split on tags only; validate CI before splitting
**Reason:** Intentional releases; controlled CI resource usage; clear version mapping

---

## Risks Of Wrong Choice

- **Split on every commit:** CI cost explosion; split repo noise; frequent timeout failures
- **Rare splits with frequent releases:** Split repos fall behind; consumers can't access latest code

---

## Related Rules

- GP-RULE-011: Test paths in CI
- GP-RULE-012: Document escape hatches thoroughly

---

## Related Skills

- Manage Golden Path Lifecycle and Adoption

