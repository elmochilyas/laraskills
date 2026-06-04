# Skill: Organize Code by Feature Using Vertical Slices

## Purpose
Structure application code by business feature rather than technical layer, colocating all classes for a single capability inside one feature directory with controllers, models, services, events, and routes together.

## When To Use
- Application has multiple distinct business capabilities (5+ features)
- Team ownership maps to features (teams own complete features)
- Application is medium-to-large (10+ features)
- Cross-feature shared code is minimal or well-managed

## When NOT To Use
- Application is primarily CRUD with simple business rules
- Team is small (under 5 engineers)
- Business concepts lack clear boundaries
- Most code is shared infrastructure rather than feature-specific logic
- Feature identification is unclear or changes frequently

## Prerequisites
- Laravel project with default structure or layer-based organization in place
- Clear identification of business feature boundaries
- Understanding of PSR-4 autoloading for custom directory roots
- Agreement on feature naming conventions

## Inputs
- List of identified business features/capabilities
- Current layer-based code scattered across technical directories
- Team-to-feature ownership mapping

## Workflow
1. **Identify feature boundaries.** List each cohesive business capability (Checkout, UserRegistration, InvoiceGeneration). Ensure each feature is independently understandable and team-ownable.

2. **Create feature directory structure.** Create `app/Features/{FeatureName}/` with standard subdirectories: `Controllers/`, `Models/`, `Services/`, `Events/`, `routes.php`. Each feature is a full vertical slice.

3. **Move feature code into feature directories.** Relocate all controllers, models, services, events, and jobs belonging to each feature into its feature directory. Update namespace declarations to match new paths.

4. **Create feature-scoped route files.** Each feature defines its own `routes.php` file. Load routes automatically via glob in RouteServiceProvider: `foreach (glob(app_path('Features/*/routes.php')) as $file) { Route::middleware('web')->group($file); }`.

5. **Establish a shared kernel.** Create `app/Shared/` or `app/Support/` for code genuinely used by multiple features (base controllers, audit logging, utility classes). Never duplicate shared code across features.

6. **Enforce cross-feature communication via events or contracts.** Features must not import classes from other feature directories. Cross-feature communication uses events or contract interfaces.

7. **Limit feature size.** Split features exceeding 30-50 files or encompassing multiple distinct sub-capabilities. Large features lose the discoverability benefit of feature organization.

## Validation Checklist
- [ ] Each feature directory contains all classes needed for that capability
- [ ] No direct imports from other feature directories
- [ ] Feature routes are auto-discovered via glob loading
- [ ] Shared kernel is documented and contains only truly shared code
- [ ] Feature boundaries match team ownership boundaries
- [ ] Architecture tests prevent cross-feature coupling
- [ ] No feature directory exceeds 50 files

## Common Failures
- **Leaky features:** Feature A imports models from Feature B. Extract shared code to shared kernel or use event-based communication.
- **Giant features:** Feature directory contains 50+ files and sub-features. Split into smaller features.
- **Shared code explosion:** Every feature duplicates CRUD boilerplate. Share infrastructure; don't share domain logic.
- **Inconsistent structure across features:** Some features have controllers, others don't. Establish a feature skeleton template.

## Decision Points
- **Feature vs domain-based organization?** Features are coarser — one feature can span multiple domains for a user-facing capability. Domains are finer — one domain serves one bounded context.
- **Route auto-discovery vs manual registration?** Use glob auto-discovery for most features. Use manual registration only when features have unique middleware requirements.

## Performance Considerations
- Route file globbing at boot time is negligible.
- Many small service providers are slightly slower than one large provider due to iteration overhead.
- No significant runtime performance impact.

## Security Considerations
- Feature isolation does not provide security boundaries — authentication still applies globally.
- Ensure feature-specific middleware is applied correctly to feature routes.

## Related Rules
- Rule: Keep Each Feature Fully Self-Contained (COS-05/05-rules.md)
- Rule: Never Import Directly from Another Feature's Internal Code (COS-05/05-rules.md)
- Rule: Use Feature-Scoped Route Files (COS-05/05-rules.md)
- Rule: Automate Feature Discovery via Glob Loading (COS-05/05-rules.md)
- Rule: Establish a Shared Kernel for Cross-Cutting Concerns (COS-05/05-rules.md)
- Rule: Limit Feature Size — Extract Sub-Features (COS-05/05-rules.md)
- Rule: Match Feature Boundaries to Team Ownership (COS-05/05-rules.md)
- Rule: Enforce Feature Boundaries via Architecture Tests (COS-05/05-rules.md)

## Related Skills
- Organize Code by Domain (COS-06/06-skills.md)
- Apply Hybrid Domain-Layer Organization (COS-07/06-skills.md)
- Identify Bounded Contexts for Domain Isolation (DBC-01/06-skills.md)

## Success Criteria
- Each feature is fully understandable within one directory tree.
- Cross-feature communication uses only events or contracts.
- Architecture tests prevent direct imports between features.
- Features match team ownership with minimal cross-team coordination.
