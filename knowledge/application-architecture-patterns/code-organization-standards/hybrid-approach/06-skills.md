# Skill: Apply Hybrid Domain-Layer Organization Within Default Structure

## Purpose
Organize code by domain subdirectories within Laravel's standard technical layers — e.g., `app/Models/Billing/Invoice.php`, `app/Http/Controllers/Billing/InvoiceController.php` — preserving framework compatibility while adding domain grouping.

## When To Use
- Team is growing (5-15 engineers)
- Application has multiple business domains but not large enough for full domain isolation
- Framework compatibility is important
- Progressive migration from flat defaults

## When NOT To Use
- Team is small (<5) and application is a single domain
- Full domain isolation is already required (team ownership, formal contracts)
- Module extraction to microservices is anticipated
- Team has no intention of enforcing domain grouping conventions

## Prerequisites
- Laravel project with default layer-based structure
- Identification of 3+ business domains/groupings
- Team agreement on domain naming convention

## Inputs
- Current layer-based directory structure
- List of identified business domains
- Existing flat files that could be grouped

## Workflow
1. **Identify domain groupings.** List the business domains (Billing, Catalog, Identity) that appear across technical layers. Use a threshold: "3+ files related to a business concept = create a subdirectory."

2. **Apply domain subdirectories consistently.** Create matching subdirectories in every technical layer. If `app/Http/Controllers/Billing/` exists, create `app/Models/Billing/`, `app/Services/Billing/`, etc. Inconsistency creates confusion.

3. **Keep shared code flat at the technical layer root.** Leave cross-cutting models and services (User, AuditLog, BaseController) at the root of their layer. If `User` goes inside a domain, that domain becomes a mandatory dependency.

4. **Use `artisan make:` with subdirectory paths.** Run `php artisan make:model Billing/Invoice -m` instead of `php artisan make:model Invoice`. Generators accept subdirectory paths and create correct namespaces automatically.

5. **Use route prefix grouping.** Group routes by domain using `Route::prefix('billing')->group(...)` to keep URL structure organized around domains.

6. **Document the hybrid convention.** Write down which directories have domain grouping, what the threshold is, and where shared code goes. Place in CONTRIBUTING.md.

7. **Plan for progressive evolution.** Treat hybrid as an intermediate step between default flat structure and full domain-based organization. Evolve to full domain isolation when team exceeds 10 engineers or requires contract boundaries.

## Validation Checklist
- [ ] All technical layers consistently use domain subdirectories (or none do)
- [ ] Domain subdirectory creation threshold is documented
- [ ] Shared cross-domain code remains flat at technical layer root
- [ ] `artisan make:` commands work with all subdirectory paths
- [ ] New developers can identify where to place new code
- [ ] Hybrid convention is documented
- [ ] No domain subdirectory contains only 1-2 files (below threshold)

## Common Failures
- **Inconsistent application:** Creating domain subdirectories for Controllers but keeping all Models flat. Apply consistently across all layers.
- **Domain subdirectory for every resource:** Creating a subdirectory for every CRUD model rather than grouping related resources. Use the threshold rule.
- **Domain proliferation:** Creating both `app/Services/Payment/` and `app/Services/Payments/` (plural inconsistency). Establish singular domain naming.

## Decision Points
- **Threshold for subdirectory creation?** Use "3+ files sharing a business concept → create subdirectory." Document the threshold explicitly.
- **Hybrid vs full domain isolation?** Hybrid is an intermediate step. Move to full domain isolation when domain enforcement and contract boundaries become necessary.

## Performance Considerations
- No additional performance cost — same as default structure.
- No extra service provider registration or autoloading configuration needed.

## Security Considerations
- Same as default structure. Domain grouping does not add security boundaries.
- Authentication and authorization must still be applied explicitly.

## Related Rules
- Rule: Apply Domain Subdirectories Consistently Across All Technical Layers (COS-07/05-rules.md)
- Rule: Establish a Threshold for Creating Domain Subdirectories (COS-07/05-rules.md)
- Rule: Keep Truly Shared Code Flat at the Technical Layer Root (COS-07/05-rules.md)
- Rule: Use `artisan make:` with Subdirectory Paths (COS-07/05-rules.md)
- Rule: Document the Hybrid Convention Explicitly (COS-07/05-rules.md)
- Rule: Use Route Prefix Grouping Without Restructuring Files (COS-07/05-rules.md)
- Rule: Use Code Review to Catch Misplaced Files (COS-07/05-rules.md)
- Rule: Use Hybrid as an Intermediate Step, Not a Final State (COS-07/05-rules.md)

## Related Skills
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)
- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)
- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)

## Success Criteria
- Domain subdirectories are applied consistently across all technical layers.
- Shared cross-cutting code remains flat and accessible.
- Developers can predict file placement without ambiguity.
- The hybrid structure serves as an intermediate step toward domain isolation.
