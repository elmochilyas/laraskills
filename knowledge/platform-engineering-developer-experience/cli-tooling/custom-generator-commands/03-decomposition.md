# Decomposition: custom generator commands

## Topic Overview

Custom generator commands extend Laravel's `make:` command family to scaffold application-specific classes, components, and files. Built on `Illuminate\Console\GeneratorCommand`, these commands generate files from stub templates, replacing placeholder variables with command-provided values. The `GeneratorCommand` base class handles: stub path resolution, file existence checks, namespace detection (based on PSR-4 autoloading configuration), class name formatting, and output messaging. Custom g...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
custom-generator-commands/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### custom generator commands
- **Purpose:** Custom generator commands extend Laravel's `make:` command family to scaffold application-specific classes, components, and files. Built on `Illuminate\Console\GeneratorCommand`, these commands generate files from stub templates, replacing placeholder variables with command-provided values. The `GeneratorCommand` base class handles: stub path resolution, file existence checks, namespace detection (based on PSR-4 autoloading configuration), class name formatting, and output messaging. Custom g...
- **Difficulty:** Foundation
- **Dependencies:** custom-artisan-command-patterns, stub-customization-laravel, and blueprint-code-generation

## Dependency Graph
**Depends on:** custom-artisan-command-patterns, stub-customization-laravel, and blueprint-code-generation
**Depended on by:** Knowledge units that leverage or extend custom generator commands patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for custom generator commands.
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