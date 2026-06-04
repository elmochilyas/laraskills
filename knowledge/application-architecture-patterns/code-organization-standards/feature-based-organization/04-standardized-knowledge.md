# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Organizing by feature/vertical slice within app/
Knowledge Unit ID: COS-05
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Feature-based organization (vertical slicing) groups code by business feature rather than technical layer. Instead of controllers, services, and models spread across three directories, all Payment-related code lives in `app/Features/Payment/` containing that feature's controller, service, model, events, and jobs. This colocation makes feature boundaries explicit at the cost of duplicating structural conventions across features.

---

# Core Concepts

- **Feature as Directory**: Each cohesive business capability (UserRegistration, Checkout, InvoiceGeneration) gets its own directory with all needed classes.
- **Vertical Slicing**: Each feature is a vertical slice through all technical layers (Controllers, Models, Services).
- **Screaming Architecture**: The directory structure communicates what the application does, not what framework it uses.
- **Colocation over Convention**: Related code lives together even if it violates "all controllers in one place."

Directory structure:
```
app/Features/
├── Checkout/
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   ├── Events/
│   └── routes.php
├── UserRegistration/
└── InvoiceGeneration/
```

---

# When To Use

- Application has multiple distinct business capabilities (5+ features)
- Team ownership maps to features (teams own complete features)
- Application is medium-to-large (10+ features)
- Cross-feature shared code is minimal or well-managed

---

# When NOT To Use

- Application is primarily CRUD with simple business rules
- Team is small (under 5 engineers)
- Business concepts lack clear boundaries
- Most code is shared infrastructure rather than feature-specific logic
- Feature identification is unclear or changes frequently

---

# Best Practices

- **Use feature-scoped route files.** WHY: Prevents `routes/web.php` from becoming unmanageable as features multiply.
- **Automate feature discovery** via glob loading rather than manual listing. WHY: Manual listing creates merge conflicts and forgotten registration.
- **Establish a shared kernel** (`app/Shared/` or `app/Support/`) for code used by multiple features. WHY: Feature isolation should not mean unrestricted duplication.
- **Match feature boundaries to team boundaries.** WHY: Each feature should be ownable by a single team; features requiring cross-team changes are poorly bounded.
- **Limit feature size.** WHY: A feature directory with 50+ files likely contains sub-features that should be split.

---

# Architecture Guidelines

- Features should be self-contained — avoid importing classes from other features' directories.
- Shared infrastructure (auth, logging, base classes) lives outside feature directories.
- Feature registration should be automatic (glob-loaded routes, providers).
- Cross-feature communication should use events or contracts, not direct imports.
- Feature boundaries must be enforced via architecture tests.

---

# Performance Considerations

- Route file globbing at boot time is negligible.
- Many small service providers are slightly slower than one large provider due to iteration overhead.
- No significant runtime performance impact.

---

# Security Considerations

- Feature isolation does not provide security boundaries — authentication still applies globally.
- Ensure feature-specific middleware is applied correctly to feature routes.

---

# Common Mistakes

1. **Leaky features:** Code in Feature A imports models from Feature B. Cause: missing shared kernel or unclear boundaries. Consequence: hidden coupling defeats feature isolation. Better: extract shared code to Shared/ directory or use event-based communication.

2. **Giant features:** Feature directory contains 50+ files and sub-features. Cause: feature boundary too coarse. Consequence: feature becomes unmanageable. Better: split into smaller features.

3. **Shared code explosion:** Every feature duplicates CRUD boilerplate. Cause: over-correction on isolation. Consequence: massive duplication. Better: shared infrastructure is good; shared domain logic is coupling. Find the balance.

4. **Inconsistent structure across features:** Some features have controllers, others don't; some have events, others don't. Cause: no feature template convention. Consequence: unpredictability. Better: establish a feature skeleton template.

---

# Anti-Patterns

- **Circular feature dependency**: Feature A depends on Feature B which depends on Feature A.
- **Orphaned features**: Features no longer developed but remaining in the codebase without clear lifecycle.
- **God feature**: A "Core" or "Shared" feature that accumulates everything not fitting elsewhere.

---

# Examples

Feature-based structure with shared kernel:
```
app/
├── Features/
│   ├── Checkout/
│   │   ├── Controllers/CheckoutController.php
│   │   ├── Models/Order.php
│   │   ├── Services/CheckoutService.php
│   │   └── routes.php
│   └── UserRegistration/
│       ├── Controllers/RegisterController.php
│       ├── Models/User.php
│       ├── Services/RegistrationService.php
│       └── routes.php
├── Shared/
│   ├── Models/Tenant.php
│   └── Services/AuditService.php
└── Providers/
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-01 Default structure | COS-06 Domain-based organization | COS-09 When to deviate |
| COS-02 Layer-based organization | COS-08 Naming conventions | COS-12 File placement decision trees |

---

# AI Agent Notes

- When generating code for a feature-based project, place all new classes inside the appropriate feature directory.
- Suggest feature extraction when a layer-based project shows signs of scattered feature code.
- When creating a new feature, scaffold the full vertical slice (Controllers, Models, Services, routes).

---

# Verification

- [ ] Each feature directory contains all classes needed for that capability
- [ ] No direct imports from other feature directories
- [ ] Feature routes are auto-discovered
- [ ] Shared kernel is documented and contains only truly shared code
- [ ] Feature boundaries match team ownership boundaries
- [ ] Architecture tests prevent cross-feature coupling
