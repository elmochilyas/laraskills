# Decomposition: phpstorm meta file generation

## Topic Overview

PhpStorm meta file generation uses the `barryvdh/laravel-ide-helper` package's `php artisan ide-helper:meta` command to generate `.phpstorm.meta.php`—a PhpStorm-specific file that provides advanced type inference for: service container resolution (`app()->make()`, `resolve()`), factory methods, collection operations, query builder chains, and route/URL generation. Unlike `_ide_helper.php` (which uses standard PHPDoc `@method` annotations), `.phpstorm.meta.php` uses PhpStorm's proprietary `o...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
phpstorm-meta-file-generation/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### phpstorm meta file generation
- **Purpose:** PhpStorm meta file generation uses the `barryvdh/laravel-ide-helper` package's `php artisan ide-helper:meta` command to generate `.phpstorm.meta.php`—a PhpStorm-specific file that provides advanced type inference for: service container resolution (`app()->make()`, `resolve()`), factory methods, collection operations, query builder chains, and route/URL generation. Unlike `_ide_helper.php` (which uses standard PHPDoc `@method` annotations), `.phpstorm.meta.php` uses PhpStorm's proprietary `o...
- **Difficulty:** Foundation
- **Dependencies:** ide-helper, facade-autocompletion-generation, and model-phpdoc-generation

## Dependency Graph
**Depends on:** ide-helper, facade-autocompletion-generation, and model-phpdoc-generation
**Depended on by:** Knowledge units that leverage or extend phpstorm meta file generation patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for phpstorm meta file generation.
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