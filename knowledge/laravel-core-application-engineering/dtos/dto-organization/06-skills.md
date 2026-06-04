# Skill: Select and Apply a DTO Organizational Strategy

## Purpose

Choose a consistent DTO directory organization strategy (centralized, per-domain, per-operation, or hybrid) and apply it across the project, ensuring consistent naming, namespace structure, and discoverability.

## When To Use

- Starting a new project — establish the DTO organization strategy from the beginning
- Growing codebase — current strategy no longer scales (e.g., centralized directory exceeding 20 files)
- Existing project with mixed strategies — consolidate into a single consistent approach
- Onboarding a new team — establish clear conventions

## When NOT To Use

- Solo project with fewer than 5 DTOs — any strategy works; use centralized for simplicity
- Refactoring without CI static analysis — need PHPStan to detect orphaned DTOs after reorganization

## Prerequisites

- Count of total DTOs (current and projected)
- Team size and team structure (single domain team vs multiple domain teams)
- Application architecture (modular monolith vs flat structure)
- Decision on DTO naming suffix (`Dto` or `Data`)

## Inputs

- Current DTO inventory: list of all DTO classes, their locations, and their consumers
- Organizational strategy options: centralized (`app/DTOs/`), per-domain, per-operation, hybrid
- Team preferences and existing conventions

## Workflow

1. Count the total number of DTOs — this drives strategy selection:
   - < 15 DTOs: centralized (`app/DTOs/`)
   - 15-50 DTOs: per-domain or per-operation
   - 50+ DTOs: per-domain with shared DTOs
2. Assess team structure:
   - Single team, small app: centralized
   - Multiple domain teams (modular monolith): per-domain
   - Action-heavy architecture: per-operation
3. Choose one strategy — document the decision and rationale in project README
4. Pick one naming suffix (`Dto` or `Data`) and apply it to all DTOs — no mixing
5. Create directory structure per the chosen strategy:
   - Centralized: `app/DTOs/{Name}Dto.php`
   - Per-domain: `app/Domains/{Domain}/DTOs/{Name}Dto.php`
   - Per-operation: `app/Actions/{Action}/{Name}Dto.php`
   - Hybrid: `app/DTOs/` for shared + `app/Domains/{Domain}/DTOs/` for domain-specific
6. Move existing DTOs to their new locations — update all `use` statements (use IDE refactoring tool)
7. Ensure directory nesting does not exceed 4 levels from `app/`
8. Configure PHPStan level 6+ in CI to detect orphaned DTOs (unused classes)
9. Verify no duplicate DTO class names exist across the project
10. Create a DTO template file that enforces the standard structure (namespace, readonly class, construct, fromArray, toArray)

## Validation Checklist

- [ ] One organizational strategy is applied consistently across the entire project
- [ ] No DTOs exist in HTTP-related directories (`app/Http/Controllers/DTOs/`)
- [ ] Directory nesting does not exceed 4 levels from `app/`
- [ ] All DTOs use the same naming suffix (`Dto` or `Data`)
- [ ] No duplicate DTO class names exist
- [ ] Cross-domain shared DTOs are in a centralized location
- [ ] PHPStan level 6+ is configured to detect orphaned DTOs
- [ ] Team template exists for new DTO files

## Common Failures

- **Mixed strategies**: Some DTOs in `app/DTOs/`, some in `app/Domains/`, some in-line. Consolidate to one strategy.
- **DTOs in HTTP directories**: Placing DTOs in `app/Http/Controllers/DTOs/`. DTOs are not HTTP-specific — keep them outside `app/Http/`.
- **Deep nesting**: `app/Domains/Sales/Order/DTOs/V2/Internal/OrderDto.php`. Flatten to max 4 levels.
- **Duplicate class names**: `Sales\OrderDto` and `Shipping\OrderDto` exist. Disambiguate via namespace or rename.
- **Orphaned DTOs**: Old DTOs accumulate after refactoring. Use PHPStan to detect and remove them.

## Decision Points

- **Centralized vs per-domain**: Centralized for small teams/small apps (< 15 DTOs). Per-domain for modular monoliths (> 15 DTOs with strong domain boundaries).
- **Per-operation vs per-domain**: Per-operation for action-heavy architecture where DTOs are tightly coupled to specific operations. Per-domain for entity-centered data modeling.
- **Dto vs Data naming**: Use `Dto` for plain PHP DTOs. Use `Data` when using spatie/laravel-data. Or pick one and use it everywhere. Document the convention.

## Performance Considerations

- Organizational strategy has zero runtime performance impact
- PSR-4 resolution is O(1) per file regardless of directory depth
- IDE performance: directories with 100+ files may cause slower initial indexing

## Security Considerations

- DTOs in `app/Http/` can create confusion about layer boundaries — keep DTOs separate from HTTP code
- No direct security implications from organizational strategy itself

## Related Rules

- Rule 1: Choose One Organizational Strategy and Apply It Consistently
- Rule 2: Never Place DTOs Inside HTTP-Related Directories
- Rule 3: Limit Directory Nesting to a Maximum of 4 Levels from `app/`
- Rule 4: Use a Consistent Suffix Across All DTO Classes
- Rule 5: Place Shared Cross-Domain DTOs in a Centralized Location
- Rule 6: Add Orphan DTO Detection to CI

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- Readonly Data Objects: Apply Readonly Enforcement to a DTO

## Success Criteria

- Single organizational strategy is documented and applied consistently
- All DTOs are outside `app/Http/` directory
- No DTO file is nested deeper than 4 levels from `app/`
- All DTO classes use the same naming suffix
- PHPStan CI step detects orphaned DTOs
- DTO template file exists for new DTO creation
