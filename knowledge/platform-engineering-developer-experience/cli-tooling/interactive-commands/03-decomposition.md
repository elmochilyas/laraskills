# Decomposition: interactive commands

## Topic Overview

Interactive Artisan commands use prompts to collect user input dynamically during command execution, enabling complex data entry, confirmation dialogs, and multi-step workflows without requiring all input upfront via arguments. Laravel provides `$this->ask()`, `$this->secret()`, `$this->confirm()`, `$this->choice()`, `$this->anticipate()`, and `$this->autocomplete()` methods for gathering input with validation, as well as `$this->output->progressAdvance()` for progress feedback. Interactive c...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
interactive-commands/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### interactive commands
- **Purpose:** Interactive Artisan commands use prompts to collect user input dynamically during command execution, enabling complex data entry, confirmation dialogs, and multi-step workflows without requiring all input upfront via arguments. Laravel provides `$this->ask()`, `$this->secret()`, `$this->confirm()`, `$this->choice()`, `$this->anticipate()`, and `$this->autocomplete()` methods for gathering input with validation, as well as `$this->output->progressAdvance()` for progress feedback. Interactive c...
- **Difficulty:** Foundation
- **Dependencies:** artisan-command-signatures-arguments, console-output-formatting, and custom-artisan-command-patterns

## Dependency Graph
**Depends on:** artisan-command-signatures-arguments, console-output-formatting, and custom-artisan-command-patterns
**Depended on by:** Knowledge units that leverage or extend interactive commands patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for interactive commands.
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