# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Three-layer architecture: Presentation, Business, Data
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Three-layer architecture divides application code into Presentation (handles user interaction), Business Logic (encapsulates rules and orchestration), and Data Access (manages persistence). This is the architectural foundation that MVC concretely implements: Controller (Presentation), Model (Business + Data), View (Presentation). In Laravel, the three layers map to Controllers/Requests (Presentation), Services/Actions/Models (Business), and Eloquent/Repositories (Data). Most Laravel applications implicitly follow this pattern, though the layers often leak into each other.

---

# Core Concepts

**Presentation Layer:** Controllers, Form Requests, API Resources, Blade views, route definitions. Owns HTTP concerns: request parsing, validation, response formatting. Should contain zero business logic—only delegation and formatting.

**Business Layer:** Service classes, action classes, domain models, events. Encapsulates business rules, workflows, calculations, and state transitions. Independent of HTTP and database concerns.

**Data Layer:** Eloquent models, repositories, query builders, migrations. Manages persistence and retrieval. Should not contain business rules, only data access logic.

The dependency direction is strictly inward: Presentation → Business → Data. Presentation depends on Business, Business depends on Data. No layer depends outward.

---

# Mental Models

**The "Dependency Direction" model:** Each layer only knows about the layer inside it. Presentation knows Business exists, but Business doesn't know about HTTP. Business knows Data exists, but Data doesn't know about business rules.

**The "Layer of Indirection" model:** Business Layer is the middle layer that insulates Presentation from Data. If the database changes, only Data Layer changes. If the HTTP interface changes, only Presentation changes.

**The "MVC as Three-Layer" model:** The Model in MVC combines Business and Data layers. This simplification works well for small apps but creates coupling at scale—Eloquent models both contain business logic (scopes, accessors) and manage data access.

---

# Internal Mechanics

In Laravel's default structure: Request → Controller → Model. The Controller handles Presentation, the Model handles both Business and Data. This is the default but most teams extend it by:
- Extracting Service classes for business logic
- Extracting Form Requests for validation
- Extracting API Resources for response formatting
- Extracting Repositories for data access (when needed)

---

# Patterns

**Controller → Service → Model:** Controller delegates to Service, Service orchestrates business logic using Model. This is the most common three-layer pattern in Laravel.

**Form Request for validation boundary:** The Presentation layer's validation is fully encapsulated in Form Request classes, keeping Controllers and Services focused.

**Repository for data access boundary:** Repository interface in the Business layer, implementation in the Data layer. This formalizes the Business → Data dependency.

---

# Architectural Decisions

**Use three-layer architecture when:** You need a clear but lightweight separation between HTTP, business logic, and data. Suitable for most Laravel applications (small to medium).

**Add layers when:** The default MVC coupling causes specific pain—fat controllers, duplicated business logic, untestable business rules.

**Layer counts:** Three layers is the minimum useful separation. Adding more layers (four, five, six) increases flexibility but adds complexity. Three layers handle most needs.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear separation of concerns | Additional classes per feature | Each feature needs controller, service, model |
| Business logic is testable | Business layer may become anemic | Without rich domain models, services just wrap data calls |
| Database changes are isolated | Data layer abstractions can be over-engineered | Repository pattern added when Eloquent direct calls would suffice |
| HTTP changes are isolated | Layer boundary enforcement requires discipline | Nothing prevents Controller from calling Model directly |

---

# Performance Considerations

Layer indirection adds negligible performance cost. A Controller → Service → Model call chain is three PHP method calls, invisible at any scale.

---

# Production Considerations

Three-layer architecture is the minimum viable structure for a production Laravel application that expects to grow. Teams that skip the business layer (fat controllers) often need to extract it later, which is more expensive than having it from the start.

---

# Common Mistakes

**Leaky Presentation layer:** Controllers that contain business logic or data access calls. This defeats the purpose of layering.

**Anemic Business layer:** Services that simply wrap model CRUD methods without adding business value. This adds ceremony without benefit (see SLP-18).

**Cross-layer shortcuts:** Calling Model directly from a View or passing Request objects to Service methods. Each layer should honor its boundary.

---

# Failure Modes

**Layer bypass:** Developers under time pressure bypass layers (call Model from Controller) because it's faster. Enforce with architecture tests.

**Data layer dependency inversion:** Business layer code that directly instantiates database connections or runs raw queries instead of using Data layer abstractions.

---

# Ecosystem Usage

Laravel's default structure is a two-layer approximation (Presentation + Model-as-BusinessAndData). Most Laravel packages assume this default. Community-consensus best practices add the Service/Action layer to complete the three-layer separation.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-01 Default structure | LAP-02 Clean Architecture | LAP-12 Incremental migration |
| MVC pattern awareness | LAP-08 Presentation layer | LAP-14 Clean Architecture tradeoffs |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche�most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
