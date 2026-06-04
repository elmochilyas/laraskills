# Decomposition: blueprint yaml dsl

## Topic Overview

Blueprint's YAML DSL (Domain-Specific Language) is the declarative specification format used to define Laravel application components for code generation. Written in a `draft.yaml` file, the DSL describes models with columns, data types, modifiers, and relationships; controllers with actions, validation rules, authorization, and response types; and configuration for generation behavior. The DSL supports: column definitions (`name: string`, `email: string:unique`), relationship inference (fore...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
blueprint-yaml-dsl/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### blueprint yaml dsl
- **Purpose:** Blueprint's YAML DSL (Domain-Specific Language) is the declarative specification format used to define Laravel application components for code generation. Written in a `draft.yaml` file, the DSL describes models with columns, data types, modifiers, and relationships; controllers with actions, validation rules, authorization, and response types; and configuration for generation behavior. The DSL supports: column definitions (`name: string`, `email: string:unique`), relationship inference (fore...
- **Difficulty:** Foundation
- **Dependencies:** blueprint-code-generation, stub-customization-laravel, and custom-artisan-make-commands

## Dependency Graph
**Depends on:** blueprint-code-generation, stub-customization-laravel, and custom-artisan-make-commands
**Depended on by:** Knowledge units that leverage or extend blueprint yaml dsl patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for blueprint yaml dsl.
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