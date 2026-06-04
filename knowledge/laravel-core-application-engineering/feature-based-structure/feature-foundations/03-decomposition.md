# Decomposition: Feature Foundations

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Foundations
- **Difficulty Level:** Foundation

## Atomic Chunks

### Chunk 1: Core Concept — Feature-Based vs Layer-Based
- **Topics:** Organizing by business domain instead of technical layer
- **Key Content:** What feature-based structure is, directory layout difference, conceptual shift from defaults
- **Learning Objectives:** Define feature-based structure and contrast it with Laravel's default layer-based layout

### Chunk 2: Feature Directory Anatomy
- **Topics:** Standard subdirectories inside a feature (Controllers, Models, Services, etc.)
- **Key Content:** `app/Features/Billing/` with `Controllers/`, `Models/`, `Requests/`, `Providers/`, `routes.php`
- **Learning Objectives:** Design the internal directory structure of a feature with consistent conventions

### Chunk 3: Autoloading and Namespace Configuration
- **Topics:** Composer PSR-4 autoloading for feature directories, namespace mapping
- **Key Content:** `composer.json` autoload configuration, `App\Features\Billing\` namespace
- **Learning Objectives:** Configure Composer autoloading to support feature-based namespaces

### Chunk 4: Migration from Layer-Based to Feature-Based
- **Topics:** Incremental migration strategy, namespace refactoring, team adoption
- **Key Content:** One-feature-at-a-time approach, shared model handling, git history preservation
- **Learning Objectives:** Plan and execute a gradual migration from layer-based to feature-based structure
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization