# Decomposition: git hooks captainhook

## Topic Overview

Git hooks are scripts that run automatically at specific points in the Git lifecycle (pre-commit, commit-msg, pre-push). CaptainHook is a PHP-based Git hook manager that allows Laravel teams to define, install, and manage Git hooks using Composer, eliminating the need for shell scripts or external dependencies like Husky (Node.js). Common hooks for Laravel projects include: pre-commit hooks that run Pint --test and PHPStan to catch issues before they're committed, commit-msg hooks that enforc...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
git-hooks-captainhook/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### git hooks captainhook
- **Purpose:** Git hooks are scripts that run automatically at specific points in the Git lifecycle (pre-commit, commit-msg, pre-push). CaptainHook is a PHP-based Git hook manager that allows Laravel teams to define, install, and manage Git hooks using Composer, eliminating the need for shell scripts or external dependencies like Husky (Node.js). Common hooks for Laravel projects include: pre-commit hooks that run Pint --test and PHPStan to catch issues before they're committed, commit-msg hooks that enforc...
- **Difficulty:** Foundation
- **Dependencies:** pint-ci-integration, phpstan-in-ci, and pre-commit-hooks-code-quality

## Dependency Graph
**Depends on:** pint-ci-integration, phpstan-in-ci, and pre-commit-hooks-code-quality
**Depended on by:** Knowledge units that leverage or extend git hooks captainhook patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for git hooks captainhook.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization