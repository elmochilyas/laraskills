# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO Organization
**Generated:** 2026-06-03

---

# Decision Inventory

* Centralized vs Per-Domain vs Per-Operation Organization
* Dto vs Data Suffix Convention
* Hybrid Strategy for Large Applications

---

# Architecture-Level Decision Trees

---

## Decision 1: Centralized vs Per-Domain vs Per-Operation Organization

---

## Decision Context

Where DTO classes live in the project structure — a flat `app/DTOs/` directory, per-domain directories, or per-operation placement.

---

## Decision Criteria

* Number of DTOs (current and projected)
* Team size and structure
* Application architecture (modular monolith vs flat)
* Whether domain boundaries are strong or weak

---

## Decision Tree

How many DTOs does the project have (or project)?
↓
< 15 DTOs → Centralized (`app/DTOs/`) — simplest, all DTOs in one discoverable location
15-50 DTOs → Does the application have strong domain boundaries (modular monolith)?
    YES → Per-domain organization (`app/Domains/{Domain}/DTOs/`) — DTOs co-located with domain logic
    NO → Is the architecture action-heavy (many single-purpose actions)?
        YES → Per-operation (`app/Actions/{Action}/{Name}Dto.php`) — DTOs tied to specific operations
        NO → Per-domain or per-operation — choose based on existing code structure
50+ DTOs → Per-domain with shared DTOs required — centralized becomes unwieldy
NO → Is the architecture already modular (domains, modules, features)?
    YES → Per-domain — aligns with existing module boundaries
    NO → Centralized — simplest starting point, migrate if DTOs grow past 15-20

---

## Rationale

Centralized placement is the simplest starting point — every DTO is in one directory, discoverable by scanning one folder. Per-domain placement scales better for large codebases because DTOs are co-located with their domain logic, reducing cognitive load when working within a domain. Per-operation placement suits action-heavy architectures where DTOs are tightly coupled to specific operations.

---

## Recommended Default

**Default:** Centralized (`app/DTOs/`) for projects with <15 DTOs; per-domain for modular monoliths with 15+ DTOs
**Reason:** Centralized is simplest for small projects. Per-domain scales naturally with domain boundaries. The threshold is driven by DTO count and team structure.

---

## Risks Of Wrong Choice

* Centralized for 50+ DTOs: One directory becomes unwieldy, naming conflicts emerge
* Per-domain for small project: Overly deep directory structure for few DTOs
* Mixed strategies: Some DTOs in `app/DTOs/`, some in domains — import confusion

---

## Related Rules

* Choose One Organizational Strategy and Apply It Consistently (05-rules.md)
* Never Place DTOs Inside HTTP-Related Directories (05-rules.md)
* Limit Directory Nesting to a Maximum of 4 Levels from `app/` (05-rules.md)

---

## Related Skills

* Skill: Select and Apply a DTO Organizational Strategy

---

## Decision 2: Dto vs Data Suffix Convention

---

## Decision Context

Whether to use the `Dto` suffix (`UserDto`), the `Data` suffix (`UserData`), or a mix depending on plain vs spatie DTOs.

---

## Decision Criteria

* Whether the project uses spatie/laravel-data
* Whether plain PHP DTOs also exist alongside spatie Data objects
* Team convention preferences

---

## Decision Tree

Does the project use spatie/laravel-data?
↓
YES → Does the project also use plain PHP DTOs (without the package)?
    YES → Use `Data` suffix for spatie objects, `Dto` suffix for plain DTOs — intentional distinction
    NO → `Data` suffix for everything — consistent with spatie conventions
NO → `Dto` suffix for all plain PHP DTOs — simpler, more explicit
NO → Does the frontend consume generated TypeScript types?
    YES → Use `Data` suffix — spatie's `php artisan data:typescript` generates types from Data classes
    NO → Either suffix — pick one and apply consistently

---

## Rationale

A consistent suffix across the project eliminates confusion about naming conventions. Using `Dto` for plain DTOs and `Data` for spatie/laravel-data objects is a valid deliberate distinction that documents which pattern each class uses. The critical rule is: pick one convention and apply it consistently — mixing suffixes creates confusion.

---

## Recommended Default

**Default:** `Dto` suffix for plain PHP DTOs; `Data` suffix for spatie/laravel-data objects; document the convention
**Reason:** The distinction between `Dto` and `Data` communicates which library pattern the class follows. Consistent suffix means consistent naming, import, and search behavior.

---

## Risks Of Wrong Choice

* Mixed suffixes arbitrarily: Some `Dto`, some `Data` with no pattern — confusion
* Wrong suffix for package: Using `Dto` for spatie Data objects loses the package convention connection
* Inconsistent across team: Different developers use different suffixes — IDE autocomplete pollution

---

## Related Rules

* Use a Consistent Suffix Across All DTO Classes (05-rules.md)

---

## Related Skills

* Skill: Select and Apply a DTO Organizational Strategy

---

## Decision 3: Hybrid Strategy for Large Applications

---

## Decision Context

Whether to use a hybrid strategy combining shared centralized DTOs with domain-specific per-domain DTOs.

---

## Decision Criteria

* Application size (200k+ LOC)
* Whether cross-domain DTOs exist (UserDto used in Billing and Support)
* Whether domain teams own their own DTOs

---

## Decision Tree

Does the application have 200k+ LOC or multiple domain teams?
↓
YES → Are there DTOs used across multiple domains (UserDto, AddressDto)?
    YES → Hybrid strategy: shared DTOs in `app/DTOs/`, domain-specific DTOs in `app/Domains/{Domain}/DTOs/`
    NO → Does each domain team own its DTOs independently?
        YES → Per-domain organization is sufficient — no shared DTOs needed
        NO → Centralized or per-domain — choose based on DTO count
NO → Is the application large enough that some DTOs serve as cross-cutting contracts?
    YES → Hybrid: shared in `app/DTOs/`, domain in domain directories
    NO → Single strategy (centralized or per-domain) — hybrid adds complexity without benefit
NO → Document the strategy — which DTOs go where

---

## Rationale

Hybrid strategy serves large applications where some DTOs are cross-domain contracts (UserDto used by Billing, Support, and Shipping) while others are domain-specific (InvoiceDto used only by Billing). Shared DTOs in a centralized location prevent duplication and cross-domain import coupling. Domain-specific DTOs stay close to their owning domain. The hybrid adds organizational complexity, so it should only be used when the application scale justifies it.

---

## Recommended Default

**Default:** Hybrid strategy only for applications with 200k+ LOC or multiple domain teams with cross-domain DTOs; otherwise use a single strategy
**Reason:** Hybrid provides the benefits of both centralized and per-domain strategies but adds organizational overhead. Use it only when the application scale justifies the complexity.

---

## Risks Of Wrong Choice

* Hybrid for small app: Unnecessary complexity — simple centralized or per-domain is sufficient
* No shared location for cross-domain DTOs: Duplication across domains, divergent copies
* Wrong DTOs in shared location: Domain-specific DTOs pollute the shared space

---

## Related Rules

* Place Shared Cross-Domain DTOs in a Centralized Location (05-rules.md)
* Add Orphan DTO Detection to CI (05-rules.md)

---

## Related Skills

* Skill: Select and Apply a DTO Organizational Strategy

