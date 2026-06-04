# ECC Anti-Patterns — DTO Organization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | DTO Organization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Scattered DTOs (No Organizational Strategy)
2. DTOs in Controllers Directory (HTTP Layer Contamination)
3. Overly Deep Nesting (5+ Directory Levels)
4. The Inline DTO (Multiple DTOs Per File)
5. Duplicate DTO Names Across Domains

---

## Repository-Wide Anti-Patterns

- Mixing Organizational Strategies (Centralized + Per-Domain + Random)
- DTOs in `app/Models/DTOs/` or `app/Helpers/DTOs/`
- No Consistent Suffix (Dto vs Data Mixed Randomly)
- Per-Domain DTOs When Application Has <15 Total DTOs
- Orphaned DTOs (Unused Classes Not Cleaned Up)

---

## Anti-Pattern 1: Scattered DTOs (No Organizational Strategy)

### Category
Code Organization

### Description
DTOs placed arbitrarily across the codebase — some in `app/DTOs/`, some in `app/Models/DTOs/`, some in domain directories, some alongside controllers.

### Why It Happens
No explicit decision is made about DTO organization. Each developer places new DTOs where they think best, leading to inconsistency.

### Warning Signs
- DTOs exist in 3+ different directory locations
- Developers ask "where should I create this DTO?" in every code review
- `use` imports reference wildly different namespaces for DTOs
- Some DTOs are in `app/DTOs/`, others in `app/Services/DTOs/`

### Preferred Alternative
Choose one strategy (centralized for <15 DTOs, per-domain for larger projects) and document it in the project's architecture guide. Apply consistently.

### Related Rules
- Rule: Choose a Single DTO Organization Strategy

---

## Anti-Pattern 2: DTOs in Controllers Directory

### Category
Architecture

### Description
Placing DTO classes inside `app/Http/Controllers/DTOs/` or similar HTTP-specific paths.

### Why It Happens
Developers see DTOs as "request data" and place them near controllers, not realizing DTOs cross the entire application layer.

### Warning Signs
- DTOs are in `app/Http/Controllers/DTOs/` or `app/Http/DTOs/`
- DTOs are mixed with route files or middleware directories
- Importing a DTO from a service file requires crossing from `App\Http\Controllers` to `App\Services`
- DTO cannot be used in CLI commands because it's in the HTTP directory

### Preferred Alternative
Keep DTOs in `app/DTOs/` (centralized) or `app/Domains/{Domain}/DTOs/` (per-domain). DTOs are not HTTP-specific.

### Related Rules
- Rule: Keep DTOs Separate From HTTP Code

---

## Anti-Pattern 3: Overly Deep Nesting (5+ Levels)

### Category
Code Organization | Maintainability

### Description
DTOs placed 5+ directory levels deep from `app/`, such as `app/Domains/Sales/Order/DTOs/V2/Internal/Cached/OrderDto.php`.

### Why It Happens
Teams organize by every possible axis (domain, entity, version, scope) simultaneously.

### Warning Signs
- DTO namespace exceeds 5 segments: `App\Domains\Sales\Order\DTOs\V2\Internal\Cached`
- Import statements wrap across multiple lines
- Navigating to a DTO file requires expanding 6+ directory levels

### Preferred Alternative
Limit nesting to 3-4 levels maximum from `app/`. Flatten version and scope into a single qualifier.

### Related Rules
- Rule: Limit DTO Nesting to 3-4 Levels

---

## Anti-Pattern 4: The Inline DTO

### Category
Code Organization | Maintainability

### Description
Defining a DTO class in the same file as the action or service class (multiple classes per file).

### Why It Happens
Developers want to keep DTO and action together for "locality." The DTO is small, so it "fits" in the action file.

### Warning Signs
- A single PHP file contains both `class CreateUserAction` and `class CreateUserDto`
- The DTO cannot be imported separately — callers must import the action file to access the DTO
- Autoloader cannot find the DTO class independently
- Violates PSR-1 (one class per file)

### Preferred Alternative
Each DTO gets its own file with its own namespace. Use per-action directory (`Actions/CreateUser/CreateUserDto.php`) for action-heavy architectures.

### Related Rules
- Rule: One DTO Class Per File

---

## Anti-Pattern 5: Duplicate DTO Names Across Domains

### Category
Maintainability

### Description
Two different domains having DTOs with the same class name (e.g., `Sales\OrderDto` and `Shipping\OrderDto`), causing import confusion.

### Why It Happens
Each domain naturally has a "primary entity" with the same conceptual name. Without disambiguation, imports clash.

### Warning Signs
- Two `OrderDto` classes exist in different namespaces
- Developers accidentally import the wrong `OrderDto`, causing type errors at runtime
- `use Sales\OrderDto as SalesOrderDto` aliases are scattered across files
- IDE auto-import frequently selects the wrong namespace

### Preferred Alternative
Use distinct class names (`SalesOrderDto`, `ShippingOrderDto`) or consistent `use` aliasing at the project level. For per-domain strategies, include the domain in the class name or rely on explicit imports with documented aliases.

### Related Rules
- Rule: Disambiguate DTO Names Across Domains
