# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Monorepo Management
**Knowledge Unit:** Split Testing for Monorepo Packages
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Split testing vs simple tagging? | Distribution needs, package consumers | Split testing for independently distributable packages |
| 2 | Split on tag vs split on every push? | Release cadence, CI cost | Split on tag (intentional, validated releases) |

---

# Architecture-Level Decision Trees

---

## Decision 1: Split Testing vs Simple Tagging?

---

## Decision Context

Packages in a monorepo can be distributed via split testing (extracting to individual repos) or simple version tagging within the monorepo. The choice depends on how consumers access the packages.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Do consumers need to install packages individually via Composer?
↓
NO → Simple tagging in monorepo is sufficient
YES → ↓
Can consumers access the monorepo directly?
↓
YES → Path repositories or monorepo-root require may suffice
NO → ↓
Do packages need independent versioning and release cycles?
↓
NO → Simple tagging with monorepo-wide versions
YES → **Implement split testing** — develop in monorepo, publish to individual repos

---

## Rationale

Split testing is necessary when packages must be independently versioned and distributed. If all packages share the same version and are consumed together, simple tagging avoids split complexity. The decision hinges on whether consumers need individual packages.

---

## Recommended Default

**Default:** Simple tagging for co-versioned packages; split testing for independently versioned
**Reason:** Split testing adds CI complexity that's only justified by independent distribution needs

---

## Risks Of Wrong Choice

- **Split testing for co-versioned:** Unnecessary complexity; every release triggers 10+ split operations
- **No splitting for independent:** Consumers install entire monorepo; no individual package versioning

---

## Related Rules

- PROV-RULE-001: Idempotent provisioning
- PROV-RULE-002: Cattle, not pets

---

## Related Skills

- Implement Self-Service Environment Provisioning for Laravel
- Set Up Preview Environments for Laravel PR Workflows

---

## Decision 2: Split on Tag vs Split on Every Push?

---

## Decision Context

Split operations can trigger on every commit to main or only on tagged releases. The frequency affects CI cost, split repository stability, and release intentionality.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Is the release cadence more than once per day?
↓
YES → Split on every push (with CI gate) may be warranted
NO → **Split on tag** — intentional, controlled releases
Regardless:
- Always validate monorepo CI passes before splitting
- Use tag convention: `{package-name}/{semver}`
- Each package's split should be independent (one failure doesn't block others)
- Add post-split validation: check files, composer.json validity, autoloading

---

## Rationale

Tag-based splits are intentional release actions. Commit-based splits generate noise and consume CI resources for non-release changes. The tag convention also provides clear mapping between monorepo state and published versions.

---

## Recommended Default

**Default:** Split on tags only; gate on CI pass
**Reason:** Intentional releases; controlled CI usage; clear version traceability

---

## Risks Of Wrong Choice

- **Split on every commit:** CI cost explosion; split repos have noisy, non-release history
- **No split automation:** Manual splits are error-prone; forgotten splits leave packages outdated

---

## Related Rules

- PROV-RULE-003: Implement destroy with create
- PROV-RULE-004: Parity over speed

---

## Related Skills

- Implement Self-Service Environment Provisioning for Laravel

