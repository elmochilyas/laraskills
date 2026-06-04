# Skill: Organize Models by Domain with Matching Namespaces

## Purpose

Structure model files into domain-based subdirectories under `app/Models/` with matching PSR-4 namespaces, improving navigability and domain cohesion as the application grows.

## When To Use

- Application has 20+ models and flat directory navigation is difficult
- Clear domain boundaries exist (Billing, Support, Catalog)
- Team ownership aligns with domain boundaries

## When NOT To Use

- Application has fewer than 20 models (flat structure is simpler)
- Domain boundaries are not yet established
- Team is not ready for the organizational overhead

## Prerequisites

- `app/Models/` directory exists
- PSR-4 autoloading is configured (Laravel default)

## Inputs

- List of all model classes
- Domain boundary mapping (which models belong to which domain)
- Desired directory structure

## Workflow

1. Identify domain boundaries by grouping related models:
   - Billing: Invoice, Payment, Plan, Subscription
   - Support: Ticket, TicketReply, TicketCategory
   - Catalog: Product, Category, Review
2. Create domain subdirectories under `app/Models/`:
   ```
   app/Models/Billing/
   app/Models/Support/
   app/Models/Catalog/
   ```
3. Move model files into their domain directories
4. Update namespaces to match the directory structure:
   ```
   // File: app/Models/Billing/Invoice.php
   namespace App\Models\Billing
   ```
5. Update all references to moved models (imports, relationships, factories)
6. Keep the base model and shared traits outside domain directories in `app/Models/`

## Validation Checklist

- [ ] Namespace exactly matches directory path relative to `app/`
- [ ] One consistent pattern is used (no mixing of flat and subdirectory approaches)
- [ ] Base model and shared traits remain outside domain directories
- [ ] Enums, DTOs, and value objects are not inside `app/Models/`
- [ ] Module-based structure is used only when bounded contexts exist

## Common Failures

- **Mismatched namespace**: File at `app/Models/Billing/Invoice.php` has `namespace App\Models` instead of `namespace App\Models\Billing`. Always match namespace to directory.
- **Mixed patterns**: Some models in flat root, some in subdirectories. Choose one pattern and apply consistently.
- **Enums in Models directory**: `OrderStatus` enum placed alongside `Order` model. Move enums to `app/Enums/`, DTOs to `app/DTOs/`.

## Decision Points

- **Flat vs domain**: Start flat for <20 models. Split by domain when navigation in the flat directory becomes difficult.
- **Domain vs module**: Use domain subdirectories (`app/Models/{Domain}/`) for medium apps. Use module-based (`app/Modules/{Module}/Models/`) only when bounded contexts with independent data ownership exist.

## Performance Considerations

- Directory structure has no runtime performance impact
- Proper PSR-4 namespacing ensures efficient autoloading

## Security Considerations

- Namespace structure has no direct security impact

## Related Rules

- Start Flat, Split by Domain When Navigation Suffers
- Match Namespace Exactly to Directory Structure
- Apply One Organizational Pattern Consistently
- Place Enum and DTO Classes Outside the Models Directory
- Keep Base Model and Traits Outside Domain Subdirectories

## Related Skills

- Model Conventions for Naming Standards
- Base Model Class Configuration
- Trait Decomposition for Cross-Cutting Concerns

## Success Criteria

- Models are organized into clear domain directories
- Namespaces match directory paths exactly
- No model files exist in incorrect or ambiguous locations
- Shared artifacts (base model, traits) reside outside domain directories
