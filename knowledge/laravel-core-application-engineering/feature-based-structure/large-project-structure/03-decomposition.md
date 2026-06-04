# Decomposition: Large Project Structure

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Large Project Structure
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: Sub-Feature Decomposition
- **Topics:** Breaking a feature into sub-features, nested feature directories, shared child patterns
- **Key Content:** When a feature grows beyond ~20 classes, sub-feature strategy, namespace nesting
- **Learning Objectives:** Decompose large features into nested sub-features with clear boundaries

### Chunk 2: Shared Kernel Design
- **Topics:** `app/Kernel/` or `app/Shared/` directory, shared interfaces, domain events, base classes
- **Key Content:** What lives in the shared kernel, feature registration contract, avoiding shared kernel bloat
- **Learning Objectives:** Design a shared kernel that minimizes coupling between features while enabling cross-cutting concerns

### Chunk 3: Multi-Namespace Package and Monorepo Strategies
- **Topics:** Each feature as a Composer package, monorepo tooling, independent versioning
- **Key Content:** Splitting features into packages, `composer.json` per feature, monorepo management with tools
- **Learning Objectives:** Structure features as independently deployable packages within a monorepo

### Chunk 4: Team Ownership and Code Ownership
- **Topics:** CODEOWNERS per feature, team isolation, reduced merge conflicts
- **Key Content:** Mapping feature directories to teams, PR assignment, autonomy vs consistency tradeoffs
- **Learning Objectives:** Assign feature ownership to teams and enforce code review policies per feature boundary
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization