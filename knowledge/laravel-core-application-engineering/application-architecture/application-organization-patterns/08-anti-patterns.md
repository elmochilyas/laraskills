# ECC Anti-Patterns — Application Organization Patterns

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Application Organization Patterns |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Premature Domain Organization (Choosing Non-Default Pattern Too Early)
2. Mixed Organizational Signals (Inconsistent Pattern Application)
3. Modular Over-Engineering (Modular Pattern for Single-Team Apps)
4. Shared Kernel Bloat (Premature Extraction to Shared Code)

---

## Repository-Wide Anti-Patterns

- Chaos Structure (no consistent pattern; files scattered by individual preference)
- Module Sprawl (10+ modules for 30-model app; overhead exceeds benefit)
- Directory as Ownership Proxy (assuming directories enforce boundaries without CI checks)

---

## Anti-Pattern 1: Premature Domain Organization

### Category
Architecture

### Description
Creating domain directories (`app/Domain/Billing/`, etc.) for a small application with <20 models and a single team.

### Why It Happens
Developers anticipate future growth or read about domain-driven design and assume it is always better.

### Warning Signs
- Project has <20 models but uses `app/Domain/` structure
- Most domain directories contain 1-2 files
- Navigation depth increased without payoff
- Manual file moves required for every `php artisan make:*` command

### Preferred Alternative
Start with technical-layer (Laravel default). Reassess at ~20 models or when navigation friction becomes noticeable.

### Related Rules
- Rule: Start with Technical-Layer, Evolve When Complexity Demands It

---

## Anti-Pattern 2: Mixed Organizational Signals

### Category
Maintainability

### Description
Having both `app/Services/PaymentService.php` and `app/Domain/Payment/Services/PaymentService.php` in the same project.

### Why It Happens
Different developers add files at different times without agreeing on conventions. Legacy code is not migrated.

### Warning Signs
- `app/Services/` and `app/Domain/{Domain}/Services/` both exist
- Files with similar roles are in completely different directory structures
- New developers ask "where should I put this file?"

### Preferred Alternative
Choose one pattern and apply it consistently. Migrate all files to the chosen pattern. Document the convention.

### Related Rules
- Rule: Never Mix Organizational Patterns

---

## Anti-Pattern 3: Modular Over-Engineering

### Category
Architecture

### Description
Using modular organization (`app/Modules/`) for a single-team application with <50 models.

### Why It Happens
Following enterprise patterns without evaluating whether the overhead is justified.

### Warning Signs
- Single team managing all modules
- Every module has a dedicated service provider
- Inter-module contracts are defined but the same developer writes both sides
- Autoloading configuration adds complexity (per-module PSR-4 entries) with no multi-team benefit

### Preferred Alternative
Use domain-driven or hybrid patterns for single-team applications. Reserve modular for multi-team codebases or planned package extraction.

### Related Rules
- Rule: Do Not Use Modular Organization for Single-Team Applications

---

## Anti-Pattern 4: Shared Kernel Bloat

### Category
Maintainability

### Description
Moving every shared utility, helper, or base class to `app/Shared/` indiscriminately.

### Why It Happens
"DRY" principle applied too aggressively. Every piece of code used by more than one domain is moved to shared.

### Warning Signs
- `app/Shared/` contains utilities used by only 1-2 domains
- Removing a shared utility would break many modules
- Shared kernel size approaches the size of individual domains
- Domains are tightly coupled through shared dependencies

### Preferred Alternative
Extract to shared kernel only when code is used by 3+ domains. Prefer duplication over premature sharing.

### Related Rules
- Rule: Keep Shared Kernel Minimal
