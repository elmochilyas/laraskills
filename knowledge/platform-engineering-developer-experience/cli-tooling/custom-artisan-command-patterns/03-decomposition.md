# Decomposition: custom artisan command patterns

## Topic Overview

Custom Artisan commands are the primary mechanism for extending Laravel's CLI capabilities. Each command extends `Illuminate\Console\Command` and defines a `$signature` (name, arguments, options) and a `handle()` method containing the command logic. Commands are registered in `App\Console\Kernel` (by class name in the `$commands` array or via autodiscovery with `load()`) and can inject dependencies via the `handle()` method's type-hinted parameters. The Laravel command system is built on Symf...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
custom-artisan-command-patterns/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### custom artisan command patterns
- **Purpose:** Custom Artisan commands are the primary mechanism for extending Laravel's CLI capabilities. Each command extends `Illuminate\Console\Command` and defines a `$signature` (name, arguments, options) and a `handle()` method containing the command logic. Commands are registered in `App\Console\Kernel` (by class name in the `$commands` array or via autodiscovery with `load()`) and can inject dependencies via the `handle()` method's type-hinted parameters. The Laravel command system is built on Symf...
- **Difficulty:** Foundation
- **Dependencies:** artisan-command-signatures-arguments, custom-generator-commands, and interactive-commands

## Dependency Graph
**Depends on:** artisan-command-signatures-arguments, custom-generator-commands, and interactive-commands
**Depended on by:** Knowledge units that leverage or extend custom artisan command patterns patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for custom artisan command patterns.
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