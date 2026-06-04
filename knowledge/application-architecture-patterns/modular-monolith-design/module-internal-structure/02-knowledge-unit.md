# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module internal structure conventions
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Each module in a modular monolith should have a consistent internal structure that makes its boundaries, entry points, and ownership clear. The common convention follows a miniature layered architecture: each module contains its own Models, Services, Contracts, Events, and (optionally) Http/Controllers, Jobs, and Tests. Consistency of internal structure across modules is critical—developers should be able to open any module and find familiar directory patterns.

---

# Core Concepts

Standard module structure:
```
modules/Billing/
├── src/
│   ├── Contracts/        # Interfaces for inter-module communication
│   │   ├── InvoiceService.php
│   │   └── Events/
│   ├── Models/           # Eloquent models (owned by this module)
│   │   ├── Invoice.php
│   │   └── Payment.php
│   ├── Services/         # Internal business logic
│   │   ├── InvoiceService.php (implementation)
│   │   └── PaymentGatewayService.php
│   ├── Actions/          # Single-operation classes
│   │   ├── CreateInvoice.php
│   │   └── ProcessPayment.php
│   ├── Events/           # Module-domain events
│   │   ├── InvoiceCreated.php
│   │   └── PaymentReceived.php
│   ├── Listeners/        # Event handlers
│   ├── Jobs/             # Async jobs
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Providers/
│   │   └── BillingServiceProvider.php
│   └── routes/
│       ├── api.php
│       └── web.php
├── database/
│   ├── migrations/
│   └── factories/
├── config/
│   └── billing.php
└── tests/
    ├── Feature/
    └── Unit/
```

---

# Mental Models

**The "Micro-Internal Architecture" model:** Each module is a mini-application with its own layered structure. The same rules that apply to the overall application apply within each module.

**The "Consistency Across Modules" model:** Every module follows the same directory conventions. A developer can navigate any module without documentation because the structure is predictable.

**The "Visible Boundary" model:** The module's `Contracts/` directory is the public face. Everything else is internal. Other modules only depend on contracts, never on internal classes.

---

# Internal Mechanics

Module structure is typically enforced by a scaffolding package (nwidart, Modulate) or team conventions. Each module has:
- Own namespace: `Modules\Billing`, `Modules\Catalog`
- Own service provider registered in `config/app.php`
- Own route files loaded by the service provider
- Own migrations in a dedicated migrations directory
- Own config, optionally merged with application config

---

# Patterns

**Contracts-first design:** The module's interface (what other modules can depend on) lives in `Contracts/`. Internal implementation details are not importable by other modules. This is the primary isolation mechanism.

**Internal vs. public classes:** Convention distinguishes public (contracts, events) from internal (services, models, actions). Some teams enforce this with `@internal` docblocks or PHP 8 `internal` attribute.

**Module bootstrapping:** Each module has a service provider that registers routes, bindings, events, and config. The provider is the module's bootstrap entry point.

---

# Architectural Decisions

**Include Http layer in module?** Yes, if the module exposes HTTP endpoints. No, if HTTP is handled centrally and the module is only business logic. HTTP-in-module is more self-contained.

**Include tests in module?** Yes, colocated tests make module extraction cleaner. The test directory moves with the module.

**Include views in module?** Yes for monolith with server-rendered views. Views colocated with domain make self-contained modules. No if using SPA/API-only.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Each module is self-contained | Structure duplication across modules | Every module has the same Controllers/Services/Models dirs |
| Extraction-ready structure | More files than flat structure | 10 modules × 5 directories = 50 dirs |
| Predictable navigation | Module scaffolding overhead | Creating a module requires 5+ directory + file creation |

---

# Performance Considerations

Module internal structure doesn't affect runtime performance. Service provider boot time scales with number of providers, not directory depth.

---

# Production Considerations

Apply internal structure consistently from the start. Retrofitting consistency across 10 existing modules is expensive.

---

# Common Mistakes

**Inconsistent structure:** Some modules have Contracts/, others don't. Some have Actions/, others put logic in Services/. Establish and enforce a module template.

**Missing module boundaries:** Internal classes (Models, Services) imported from other modules. The Contracts/ directory exists but is bypassed.

**Empty contracts:** Contracts/ that mirror every internal class. Contracts should expose only what other modules need, not everything.

---

# Failure Modes

**Module structure abandonment:** After the initial scaffolding, developers add files to existing modules without following the internal convention. Over time, module structure becomes inconsistent.

---

# Ecosystem Usage

The `nwidart/laravel-modules` package scaffolds modules with a standard structure. The `Modulate` package uses a similar convention. Community patterns generally follow the micro-layered approach.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-01 Module vs microservice | MMD-04 Module registration | MMD-05 Module autonomy |
| MMD-02 Boundary identification | MMD-08 Shared kernel | MMD-12 Isolation enforcement |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
