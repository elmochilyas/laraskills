# Decomposition: translation file loading packages

## Topic Overview

Laravel packages load translation strings through `loadTranslationsFrom()` or Spatie tools' `->hasTranslations()`, registering a namespace-prefixed directory where Laravel looks for language files. Package translations are accessed using the `__('package-name::file.key')` syntax in Blade views and PHP code. The package provides default translations (typically English) in a `resources/lang/` directory with subdirectories for each locale (`en/`, `es/`, `fr/`). Consumers can override translation...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
translation-file-loading-packages/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### translation file loading packages
- **Purpose:** Laravel packages load translation strings through `loadTranslationsFrom()` or Spatie tools' `->hasTranslations()`, registering a namespace-prefixed directory where Laravel looks for language files. Package translations are accessed using the `__('package-name::file.key')` syntax in Blade views and PHP code. The package provides default translations (typically English) in a `resources/lang/` directory with subdirectories for each locale (`en/`, `es/`, `fr/`). Consumers can override translation...
- **Difficulty:** Foundation
- **Dependencies:** package-service-provider-patterns, spatie-laravel-package-tools, and blade-component-namespacing

## Dependency Graph
**Depends on:** package-service-provider-patterns, spatie-laravel-package-tools, and blade-component-namespacing
**Depended on by:** Knowledge units that leverage or extend translation file loading packages patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for translation file loading packages.
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