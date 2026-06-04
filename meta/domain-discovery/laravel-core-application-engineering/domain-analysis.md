# Domain Overview

Laravel Core Application Engineering is the architectural foundation of every Laravel system. It governs how HTTP requests are translated into business operations and how responses are returned to consumers. This domain encompasses the entire application layer: routing, request handling, business logic organization, validation, response transformation, middleware pipelines, view rendering, and frontend integration strategies.

Unlike infrastructure domains (database, cache, queues) that deal with specific technologies, this domain is about **structuring application code** — how controllers delegate to services and actions, how validation is layered, how data flows between HTTP and business logic, and how the application is organized for maintainability at scale.

---

# Domain Scope

## What belongs in this domain

- Route definition patterns (resourceful, API, implicit binding, grouping)
- Controller architecture and patterns (thin controllers, single-action, resource)
- Business logic organization (Service Layer, Action pattern, Use Case pattern)
- HTTP middleware design, registration, and pipeline composition
- Form Request validation, authorization, and post-validation hooks
- Data Transfer Objects for typed inter-layer communication
- API Resource transformation and response shaping
- Blade templating system, components, view composers, presenters
- Livewire component architecture and data flow
- Inertia integration patterns and server/client data boundaries
- Feature-based and modular application structure strategies
- Exception handling strategy for the HTTP layer
- API versioning and rate limiting at the routing level
- Application bootstrapping, service provider registration, directory conventions
- Controller-level dependency injection and method injection

## What does NOT belong in this domain

- Eloquent ORM internals, relationships, scopes, model events (→ Eloquent & Domain Modeling)
- Database schema design, migrations, indexing strategies (→ Data & Storage Systems)
- Caching strategies, cache drivers, cache invalidation patterns (→ Data & Storage Systems)
- Queue system design, job implementation patterns, worker configuration (→ Async & Distributed Systems)
- Authentication providers, guards, token management (→ Security & Identity Engineering)
- Authorization gates, policies, permission systems (→ Security & Identity Engineering)
- Email, notifications, file storage, broadcasting (→ separate domains as needed)
- Deployment, environment configuration, server management (→ DevOps & Infrastructure)
- Frontend JavaScript frameworks beyond Inertia bridge patterns (→ Frontend domain)
- Package development and distribution (→ Package Development domain)

---

# Major Subdomains

## 1. Application Architecture & Structure
The foundational layer — how a Laravel application is bootstrapped, how the service container is configured, how service providers are organized, and what directory conventions are used. This subdomain establishes the scaffolding within which all other patterns operate.

## 2. Routing System
Route definition patterns, resourceful route registration, route model binding (implicit, explicit, scoped, enum), route groups and prefixes, rate limiter definitions, and API versioning strategies at the routing level.

## 3. Controllers Architecture
Controller design patterns including resource controllers, single-action controllers, thin controller principles, dependency injection (constructor vs method), controller-level middleware assignment, and controller organization strategies.

## 4. Service Layer Pattern
Service class design as multi-method orchestrators organized by entity or domain. Service orchestration of complex workflows. When services compose actions vs when services contain logic directly. Boundary between service layer and controller layer.

## 5. Actions Pattern
Single-responsibility action classes representing discrete business operations. Action naming conventions, composition patterns, transactional actions, queued actions, and the relationship between actions and services. Includes the Use Case variant from Clean Architecture.

## 6. Middleware System
Middleware pipeline architecture — global, route group, and route-level middleware. Custom middleware design, parameterized middleware, terminable middleware, middleware ordering and priority, and middleware groups. Cross-cutting concerns vs business logic boundaries.

## 7. Form Requests & Validation
Validation architecture — Form Request classes for HTTP input validation, authorization via authorize(), custom validation rules, rule objects, after-validation hooks, conditional validation, and the boundary between Form Request validation and domain validation.

## 8. DTOs (Data Transfer Objects)
Immutable data carriers for typed inter-layer communication. Plain readonly DTOs, spatie/laravel-data integration, DTO creation from requests/models/arrays, nesting DTOs, DTO collections, and the boundary between DTOs, Form Requests, and Eloquent models.

## 9. API Resources
Response transformation layer — JsonResource and ResourceCollection patterns, conditional attributes (when, whenLoaded, whenHas), pagination metadata, sparse fieldsets, JSON:API resource support, versioned resources, and resource testing strategies.

## 10. Blade / View Layer
Blade templating system including component architecture (class-based and anonymous), template inheritance, slots and stacks, view composers, service injection, view models/presenters for complex view data preparation, and Blade rendering optimization.

## 11. Livewire / Inertia Basics
Server-driven UI with Livewire (component architecture, data binding, event system, loading states, file uploads). Client-driven UI with Inertia (server props, page components, shared data, type safety with TypeScript). Stack selection guidance and hybrid approaches.

## 12. Feature-based Application Structure
Organizing code by business domain rather than technical layer. Modular monolith patterns, bounded contexts within a single Laravel application, module auto-discovery, inter-module communication via events/contracts, and directory structure strategies that scale.

## 13. Exception Handling
Global exception handling strategy, custom exception classes, HTTP exception rendering, JSON error response standardization, validation error formatting, and error reporting/longging configuration.

---

# Complete Knowledge Inventory

## 1. Application Architecture & Structure

- Laravel Bootstrapping Lifecycle
- Service Container Fundamentals
- Service Provider Registration & Boot Order
- Deferred Service Providers
- Directory Convention Strategies (default vs custom)
- Configuration File Organization
- Environment File Management
- Application Key Concepts (facades, contracts, helpers)
- Maintenance Mode Configuration
- Application Event Listeners (bootstrapped, running)
- Laravel 11+ Slim Application Structure
- Composer Autoload Configuration
- Application Localization Setup

## 2. Routing System

- Route Definition Syntax (closures, controllers, grouped)
- Route File Organization (web, api, console, channels)
- Route Parameters (required, optional, regular expression constraints)
- Named Routes and Route Names
- Resourceful Routing (Route::resource, Route::apiResource)
- Singleton Routes (Route::singleton)
- Nested Resources and Shallow Nesting
- Route Model Binding — Implicit
- Route Model Binding — Explicit (Route::model, Route::bind)
- Custom Route Keys (getRouteKeyName, inline :slug syntax)
- Scoped Bindings (scopeBindings, withoutScopedBindings)
- Soft Delete Model Binding (withTrashed)
- Implicit Enum Binding
- Custom Resolution Logic (resolveRouteBinding, resolveChildRouteBinding)
- Missing Model Behavior Customization
- Route Groups (prefix, middleware, namespace, name, domain)
- Route Caching
- Rate Limiter Definition (RateLimiter::for)
- Rate Limiter Application (throttle middleware)
- Signed Routes
- Route Registration Order and Priority
- API Versioning Strategies (URI, header, query)
- Route and URL Generation (route helper, action helper)
- Redirect Routes

## 3. Controllers Architecture

- Resource Controller Pattern (index, create, store, show, edit, update, destroy)
- API Resource Controllers (except create, edit)
- Single-Action Controllers (__invoke)
- Thin Controller Principles
- Controller Constructor Injection
- Controller Method Injection
- Controller Dependency Organization
- Controller Namespacing Strategies
- Controller Code Organization Limits (lines per method, methods per class)
- Controller Middleware (constructor middleware, route middleware)
- Invokable Controller Pattern
- Controller Response Types (view, redirect, JsonResponse, Resource)
- Controller Form Request Integration
- Controller Action/Service Delegation
- Controller Testing Strategies

## 4. Service Layer Pattern

- Service Class Design (entity-oriented, capability-oriented)
- Naming Conventions (UserService, OrderService)
- Method Granularity in Services
- Service Constructor Injection
- Service Orchestration Patterns
- Service Transaction Management
- Service Caching Integration
- Stateless Service Design
- Service vs Action Decision Framework
- Service Testing Strategies (unit vs integration)
- Service Evolution (growing from simple to complex)
- Domain Service vs Application Service Distinction
- Repository Injection into Services
- Service Interface Binding Strategies

## 5. Actions Pattern

- Action Class Structure (single public method, handle/execute)
- Action Naming Conventions ([Verb][Noun]Action)
- Action Dependency Injection
- Action Composition (actions calling other actions)
- Transactional Actions (DB::transaction wrapping)
- Queued Actions (Spatie queueable-action, from job routing)
- Action Return Values (Model, DTO, void)
- Action Exception Handling
- Action Testing Strategies
- Use Case Variant (DTO input, framework-agnostic output)
- Action vs Service Decision Framework
- Action Reusability Across Entry Points (HTTP, CLI, queue)
- Action Organizational Strategies (domain directory, flat directory)
- Action Parameter Strategies (loose array vs typed DTO)

## 6. Middleware System

- Middleware Lifecycle (request in, response out pipeline)
- Global Middleware Registration
- Route Middleware Registration & Aliasing
- Middleware Groups (web, api, custom)
- Custom Middleware Implementation (handle method)
- Pre-Middleware vs Post-Middleware Patterns
- Middleware Parameters
- Middleware Ordering and Priority
- Terminable Middleware (terminate method)
- Middleware and the Service Container
- Middleware Responses (abort, redirect, JSON response)
- Trusted Proxy Middleware
- CORS Middleware Configuration
- Rate Limiting Middleware
- Maintenance Mode Middleware Bypass
- Middleware Exclusion (withoutMiddleware)
- Request Transformation Middleware
- Response Transformation Middleware
- Middleware Testing Strategies
- Cross-Cutting Concern Identification
- Middleware in Laravel 11+ (bootstrap/app.php)
- Middleware in Laravel 10- (app/Http/Kernel.php)

## 7. Form Requests & Validation

- Form Request Fundamentals (rules, authorize, messages)
- Validation Rule Arrays (string syntax vs array syntax)
- Custom Validation Rule Classes
- Custom Validation Rule Objects (invokable)
- Implicit Rules
- Conditional Validation (sometimes, required_if, required_with)
- After-Validation Hooks (withValidator, after)
- Form Request Authorization (authorize method)
- Preparing Input for Validation (prepareForValidation)
- Validation Error Customization (messages, attributes)
- Stopping on First Validation Failure
- Form Request DTO Integration (toDto method)
- Inline Validation in Controllers (when appropriate)
- Manual Validator Creation
- Validation Namespacing and Organization
- Reusable Validation Traits
- Form Request Testing Strategies

## 8. DTOs (Data Transfer Objects)

- DTO Fundamentals (purpose, immutability, type safety)
- Plain PHP readonly DTO Classes
- DTO Construction from Requests (fromRequest, fromArray)
- DTO Construction from Models (fromModel)
- DTO Construction from Arrays (fromArray)
- Nested DTOs (DTOs containing DTO collections)
- spatie/laravel-data Integration
- Data Object Validation (rules method in Data objects)
- Data Object Transformation (toArray, all)
- Data Object Casting and Nesting
- Data Object Pipeline Hooks
- DTO vs Form Request Boundaries
- DTO vs Value Object Boundaries
- DTO vs Eloquent Model Boundaries
- DTO Organizational Strategies (by action, by domain)
- DTO Testing Strategies
- When NOT to use DTOs

## 9. API Resources

- JsonResource Fundamentals (toArray method)
- ResourceCollection Fundamentals
- Conditional Attributes (when, whenHas, whenNotNull)
- Conditional Relationships (whenLoaded)
- Conditional Counts (whenCounted, whenAggregated)
- Relationship Count Aggregates (whenCounted)
- Pagination Wrapping (data, links, meta)
- Pagination Metadata Customization (paginationInformation)
- Top-Level Meta Data (with method)
- Response Customization (response method, withResponse)
- Data Wrapping Configuration (withoutWrapping)
- JSON:API Resource Support (JsonApiResource)
- JSON:API Attributes and Relationships
- Sparse Fieldsets and Includes
- Resource Type and ID
- Preserving Collection Keys
- Resource Naming Strategies (list vs detail resources)
- Versioned API Resources
- Resource Testing Strategies
- Resource vs DTO Decision Framework

## 10. Blade / View Layer

- Blade Template Inheritance (@extends, @section, @yield)
- Blade Components (class-based, anonymous)
- Component Attributes and Slots
- Inline Component Views
- Service Injection in Views
- View Composers (class-based, closure-based)
- View Creators
- View Models / Presenters
- Blade Directives (built-in, custom)
- Blade Conditional Rendering
- Blade Loops and Iteration
- Blade Stacks and Push
- Blade Localization (@lang, __)
- Blade Component Testing
- Blade Rendering Performance
- Layout Strategies (admin vs public layouts)
- Fragments (Laravel 12+ partial re-rendering)
- Blade with Alpine.js Integration

## 11. Livewire / Inertia Basics

- Livewire Component Architecture (class + view)
- Livewire Properties and Data Binding
- Livewire Actions (method calling)
- Livewire Event System (emitting, listening, dispatching)
- Livewire Lifecycle Hooks (mount, hydrate, boot, updated, updating)
- Livewire Loading States (wire:loading, wire:target)
- Livewire Validation
- Livewire File Uploads (withPreview)
- Livewire Nested Components
- Livewire Volatile Properties (v3)
- Livewire Lazy Component Loading
- Livewire Testing Strategies
- Inertia Page Components (server props, shared data)
- Inertia Responses (Inertia::render, redirect)
- Inertia Shared Data (HandleInertiaRequests middleware)
- Inertia Partial Reloads (only, except)
- Inertia Form Handling (useForm, Inertia::post)
- Inertia Lazy Data Evaluation
- Inertia TypeScript Integration (Spatie typescript-transformer)
- Inertia SSR Configuration
- Inertia Testing Strategies
- Livewire vs Inertia Decision Framework
- Hybrid Approaches (Livewire for admin, Inertia for frontend)

## 12. Feature-based Application Structure

- Technical Layering vs Domain Grouping Tradeoffs
- Modular Monolith Fundamentals
- Bounded Contexts in Laravel
- Module Directory Conventions (app/Modules, modules/, src/)
- Module Auto-Discovery and Registration
- Module Service Providers
- Inter-Module Communication (events, contracts, bridges)
- Module Dependency Management
- Module Testing Isolation
- Feature Flags and Module Toggling
- nwidart/laravel-modules Package Pattern
- Domain Layer Separation (Application, Domain, Infrastructure)
- Vertical Slice Architecture
- Feature Folder Pattern (all layers per feature)
- Shared Kernel and Cross-Cutting Concerns
- Team Ownership and Code Boundaries

## 13. Exception Handling

- Exception Handler Configuration (bootstrap/app.php)
- Rendering Exceptions (render method)
- Reporting Exceptions (report method)
- Custom Exception Classes
- HTTP Exception Rendering (abort, abort_if)
- JSON Exception Formatting
- Validation Exception Formatting
- Authorization Exception Handling
- Model Not Found Exception Handling
- Throttle Requests Exception Handling
- Authentication Exception Handling
- Production vs Debug Exception Display
- External Error Tracking Integration (Sentry, Flare)
- Exception Logging Context
- Custom Error Pages (403, 404, 419, 429, 500)
- Exception Handler Extensibility (reportable, renderable callbacks)

---

# Knowledge Classification

## Foundation
- Route Definition Syntax • Route File Organization • Named Routes • Route Parameters
- Resourceful Routing • Singleton Routes • Basic Controller Structure
- Route Model Binding (implicit) • Middleware Lifecycle • Global Middleware Registration
- Form Request Fundamentals • Basic DTO Definition (readonly class)
- JsonResource Fundamentals • ResourceCollection Fundamentals
- Blade Template Inheritance • Blade Components (anonymous)
- Livewire Component Basics • Inertia Page Components
- Exception Handler Configuration

## Intermediate
- Nested Resources • Custom Route Keys • Route Groups
- Scoped Bindings • Soft Delete Binding • Route Caching
- Single-Action Controllers • Controller Method Injection • Controller Middleware
- Service Class Design Patterns • Action Class Structure and Naming
- Middleware Parameters • Middleware Groups • Terminable Middleware
- Conditional Validation • Custom Rule Classes • Form Request Authorization
- spatie/laravel-data Integration • Nested DTOs • Conditional Attributes (when, whenLoaded)
- Pagination Wrapping • View Composers • Service Injection in Views
- Livewire Actions and Events • Livewire Loading States
- Inertia Shared Data • Inertia Form Handling
- Feature Directory Organization • Module Service Providers

## Advanced
- Implicit Enum Binding • Rate Limiter Definitions • API Versioning Strategies
- Explicit Route Binding (Route::bind) • Custom Resolution Logic (resolveRouteBinding)
- Missing Model Behavior Customization • Route Registration Order
- Controller Organization Limits • Thin Controller Enforcement
- Service Orchestration Patterns • Action Composition • Transactional Actions
- Middleware Pipeline Architecture • Ordered Middleware • Request Transformation
- DTO vs Form Request Boundaries • DTO Construction from Multiple Sources
- JSON:API Resource Support • Sparse Fieldsets • Top-Level Meta Data
- View Models/Presenters for Complex Views • Custom Blade Directives
- Livewire Lifecycle Hooks • Livewire Lazy Loading
- Inertia Lazy Data Evaluation • Inertia Partial Reloads
- Inter-Module Communication (events, contracts)
- Domain Layer Separation in Modules • Vertical Slice Architecture
- Custom Exception Rendering • JSON Error Standardization

## Expert
- Comprehensive Route Binding Lifecycle Understanding
- Service Interface Binding Strategies (repository pattern in services)
- Queued Actions • Action Reusability Across All Entry Points
- Middleware in Laravel 11+ vs 10- Migration • Cross-Cutting Concern Identification
- Conditional Validation Composition • Complex After-Validation Hooks
- Data Object Pipeline Hooks • DTO Collections and Deep Nesting
- Resource vs DTO Decision Framework • Complex Pagination Metadata
- Livewire Volatile Properties • Inertia SSR Configuration
- Hybrid Livewire/Inertia Strategies • Module Auto-Discovery Internals
- Feature Flags and Module Toggling • Shared Kernel Design

## Enterprise
- Multi-Team Code Boundaries via Modules
- API Versioning Strategies at Scale (controller inheritance, resource versioning)
- Module Dependency Management and Version Constraints
- External Error Tracking Integration Strategy
- Comprehensive Exception Taxonomy Design
- Organization-wide Validation and DTO Standards
- Global API Response Contract Enforcement
- Middleware Performance Budgeting and Optimization
- Long-Term Module Extractability (modular monolith to microservices)

---

# Dependency Map

```
Application Bootstrapping
    ↓
Service Container Fundamentals
    ↓
Route Definition
    ↓
  ├── Resourceful Routing ──→ Route Model Binding ──→ Scoped Bindings
  │                              ↓
  └── Route Groups ──→ Rate Limiting ──→ API Versioning
                            ↓
Controllers Architecture
    ↓
  ├── Controller Injection
  │       ↓
  ├── Form Requests ──→ DTOs
  │       ↓                ↓
  ├── Service Layer ──→ DTOs ──→ Actions ──→ Queued Actions
  │       ↓
  └── API Resources / Blade / Inertia / Livewire
          ↓
Exception Handling
    ↓
Feature-based Structure / Modular Monolith
```

Subdomain dependencies:
- Routing depends on: Application Architecture
- Controllers depend on: Routing
- Service Layer depends on: Controllers, Service Container
- Actions depend on: Service Container (can be independent of Controllers)
- Middleware depends on: Routing, Service Container
- Form Requests depend on: Controllers, Validation system
- DTOs depend on: Service Container (minimal, can be standalone)
- API Resources depend on: Eloquent (lightly), Controllers
- Blade depends on: Controllers, Service Container
- Livewire/Inertia depend on: Controllers (for data provision)
- Feature-based Structure depends on: All of the above
- Exception Handling depends on: All of the above

---

# Missing Knowledge Risk Analysis

The following areas are consistently misunderstood, skipped, or applied incorrectly by Laravel developers:

**1. Service vs Action vs Use Case ambiguity.** Most developers learn one pattern and apply it everywhere. The result is either overgrown service classes (UserService with 40 methods) or excessive action granularity (hundreds of near-empty action files). The decision framework for choosing between them is rarely documented despite being the most common architectural question in Laravel teams.

**2. DTO integration point confusion.** Developers understand DTOs conceptually but struggle with where to create them (controller? Form Request? service?), how to nest them, and when they add ceremony without benefit. The most common mistake is creating DTOs for everything (including 2-field forms) or using raw arrays everywhere (including complex multi-layer data flows).

**3. Form Request over-authorization.** Developers overload authorize() with business logic that belongs in policies or services. The boundary between "can this user perform this HTTP action?" (Form Request) and "can this user perform this business operation?" (Policy/Service) is consistently blurred.

**4. Middleware as business logic layer.** Middleware is treated as a convenient place to put application logic rather than as a cross-cutting concern filter. Common violations: database queries in middleware, business rule enforcement, tenant resolution that couples to the request lifecycle.

**5. API Resource N+1 queries.** Developers use whenLoaded() in resources but fail to eager-load in controllers, silently triggering N+1 queries. Combined with resource nesting, a single endpoint can generate dozens of unexpected queries.

**6. Action composition without transaction awareness.** Developers compose actions freely without considering transaction boundaries. An action that delegates to three sub-actions may have each one running in its own transaction, leading to partial writes on failure.

**7. Route model binding misuse in multi-tenant apps.** Developers rely on implicit binding without scoping, allowing cross-tenant resource access. Scoped bindings are understood theoretically but underused in practice.

**8. Feature-based structure without clear boundaries.** Teams adopt modular structures without defining bounded contexts, leading to modules that deeply depend on each other. The result is worse than flat structure because the dependencies are hidden behind module boundaries.

**9. Blade view model overuse.** View models/presenters are introduced for every view, even those with trivial data needs, adding ceremony disproportionate to benefit.

**10. Livewire/Inertia selection by hype rather than fit.** Teams pick Inertia because it feels "more modern" for simple CRUD UIs that would be faster and simpler with Livewire, or pick Livewire for complex interactive frontends where a JavaScript framework would serve better.

---

# Research Findings

## Recurring Expert Recommendations

- **Start with the default structure, then organize by domain.** Every expert interviewed or studied emphasized staying close to Laravel's conventions. Custom structures are earned by complexity, not chosen by preference.

- **Controllers must be thin.** This is the most consistent recommendation across all sources. A controller method should validate (via FormRequest), delegate (to service/action), and return (via Resource/view). Nothing more. Target: under 10-15 lines per method.

- **Services group by entity; Actions isolate by operation.** This is the dominant architectural schema in production Laravel applications. Services organize related operations (UserService with register, update, suspend). Actions isolate single complex operations (PlaceOrderAction, RefundCharge).

- **DTOs pay for themselves when data crosses multiple layers.** The threshold is consistent: 2-3 layers is enough to justify a DTO. For simple CRUD with single-layer data flow, arrays suffice.

- **Form Requests and DTOs are complementary, not competing.** Every expert separates validation (Form Request) from data transport (DTO). Mixing them creates confusion about where to look for validation rules.

- **Use whenLoaded() with with() always.** The pair guarantees no N+1 queries in API responses. Forgetting either causes either over-fetching or under-fetching.

- **Middleware order is architecture.** The order of middleware determines the request's security model. Authentication before tenant resolution before authorization is the most cited ordering principle.

- **Prefer explicit over implicit for business logic.** Events and observers cause bugs because they fire invisibly. Explicit action/service calls are grep-able and testable.

- **Interfaces for application code are over-engineering.** Experts consistently recommend against interface-per-class unless polymorphism is needed or the class is a package. Concrete classes with constructor injection are preferred for application code.

## Recurring Architectural Patterns

- **Controller → FormRequest → DTO → Service → Action → Repository → Resource.** This is the canonical data flow pattern that emerges in every production-grade Laravel application studied.

- **Service-Action complement pattern.** Services orchestrate; actions execute. Services are nouns (OrderService); actions are verbs (CreateOrderAction). Services can have multiple methods; actions have exactly one.

- **DTO as layer boundary.** DTOs are created at the HTTP boundary (in controllers or Form Requests) and flow through all subsequent layers. The DTO is the contract between HTTP and business logic.

- **Resource versioning via directory structure.** API Resources are organized by version (app/Http/Resources/V1/, V2/) with V2 controllers inheriting from V1 for unchanged endpoints.

- **Middleware pipeline for cross-cutting concerns.** Authentication, rate limiting, request logging, response headers, and tenant resolution are consistently implemented as middleware rather than service wrappers.

- **Feature modules with technical nesting.** The dominant modular pattern organizes modules by domain (Sales, Inventory, Billing) with technical subdirectories inside (Http/, Services/, Actions/, Models/).

## Recurring Tradeoffs

- **Service vs Action:** Services reduce file count and centralize navigation for related operations. Actions improve test isolation and reduce merge conflicts. The tradeoff is navigability vs granularity.

- **DTO vs Array:** DTOs provide type safety, autocompletion, and immutable contracts. Arrays provide zero ceremony for simple data. The tradeoff is safety vs speed.

- **API Resource vs DTO:** Resources are optimized for HTTP response transformation with built-in conditional loading. DTOs are optimized for internal data transport with full type safety. The tradeoff is HTTP-specific convenience vs layer-agnostic purity.

- **Livewire vs Inertia:** Livewire provides faster MVPs, lower cognitive load for backend teams, and simpler deployment. Inertia provides richer frontend interactions, mature component ecosystems, and TypeScript safety. The tradeoff is development speed vs UI flexibility.

- **Implicit vs Explicit binding:** Implicit binding reduces boilerplate but hides query execution. Explicit binding provides control but adds ceremony. The tradeoff is convenience vs transparency.

- **Middleware vs Service wrapper:** Middleware operates at the HTTP layer and can short-circuit requests. Service wrappers operate in business logic and don't know about HTTP. The tradeoff is cross-cutting capability vs layer purity.

- **Modular vs Flat structure:** Modules provide clear ownership and boundaries but add inter-module communication overhead. Flat structure is simpler but blurs responsibility. The tradeoff is scalability of teams vs simplicity of code.

## Recurring Misconceptions

- **"Actions replace services."** Actions do not replace services; they complement them. Services organize related operations by entity. Actions isolate single operations. Many production codebases use both.

- **"Form Requests are just for validation."** Form Requests also handle authorization (authorize()), input preparation (prepareForValidation()), and after-validation hooks (withValidator()). They are the complete HTTP input boundary.

- **"Repositories are always necessary."** The active record pattern (Eloquent models) is a valid data access strategy. Repositories add value when queries are complex enough to need abstraction, not as a default layer.

- **"API Resources are just formatters."** API Resources are contracts with external consumers. They decouple the database schema from the API response, which has far-reaching implications for API versioning and client compatibility.

- **"Middleware is for business logic."** Middleware handles cross-cutting concerns (auth, logging, headers), not business rules. Business logic belongs in services and actions.

- **"Livewire is for small apps only."** Livewire 3+ with Islands handles complex dashboards and interactive UIs. The performance ceiling has been significantly raised.

- **"Inertia requires an API."** Inertia does not expose a public API. It's a server-driven SPA pattern where routes remain server-side and data flows through controller responses, not API endpoints.

- **"Feature-based structure means no technical organization."** Feature-based structure organizes by domain at the top level but still uses technical layering within each module (Controllers, Services, Models).

---

# Future Expansion Opportunities

## High Value

1. **Laravel 13 Typed Form Requests** — The merged PR #58676 introduces typed form requests with PHP attributes. When released, this will fundamentally change how validation and DTOs interact, warranting significant coverage.

2. **Livewire 4/5 Advanced Islands** — The Islands feature reshapes Livewire performance modeling. As it matures, a dedicated knowledge unit for complex Livewire performance optimization will be valuable.

3. **Inertia 3 Optimistic Updates** — First-class optimistic updates change how Inertia applications handle user experience patterns. Coverage of conflict resolution and rollback strategies will be needed.

4. **Modular Monolith Extractability Patterns** — As more teams adopt modular monoliths, patterns for extracting modules into independent microservices (without rewriting) will become a valuable enterprise topic.

## Medium Value

5. **Blade Fragments (Laravel 12+)** — Partial re-rendering with Blade fragments for Livewire and Turbo integration.

6. **spatie/laravel-data V4 Updates** — As the package evolves, advanced pipeline hooks, computed properties, and TypeScript generation integration.

7. **Filament + Livewire Integration Patterns** — Filament's component ecosystem and how custom components interact with the Service/Action architecture.

## Lower Priority

8. **HTMX Integration with Laravel** — Partial page rendering and hypermedia-driven UI patterns.

9. **Alpine.js Component Design Patterns** — Beyond basic Livewire pairing, standalone Alpine component architecture for Blade views.

---

# Sources Consulted

## Tier 1 — Framework Truth

- Laravel 12.x & 13.x Documentation: Routing, Controllers, Middleware, Validation, API Resources, Blade, Requests, Responses
- Laravel Framework Source Code: `src/Illuminate/Routing/` (ResourceRegistrar, ImplicitRouteBinding, Router, Route)
- Laravel Framework Source Code: `src/Illuminate/Http/` (Request, JsonResponse)
- Laravel Framework Source Code: `src/Illuminate/Http/Resources/` (JsonResource, ResourceCollection)
- Laravel Framework Source Code: `src/Illuminate/Foundation/` (Application, Http/Kernel, Exceptions/Handler)
- Laravel Release Notes (v10, v11, v12, v13)
- Laravel News — Middleware Configuration Changes, Laravel 11+ Structure Changes
- GitHub PR #58676 — Typed Form Requests for Laravel 13.x

## Tier 2 — Expert Production Usage

- Spatie Blog: "Livewire and Inertia: how we love and use both" (May 2025)
- Beyond Code Blog: Architectural patterns, service containers, action patterns
- Laravel Daily: Service layer patterns, thin controller tutorials
- Tighten Blog: Laravel architecture patterns, testing strategies
- StackConvert: "How I Structure a Scalable Laravel Application (In Production)"
- QadrLabs: "Service Class, Action Class, and Use Case Class" comparison
- Sevalla Blog: "Why your Laravel controllers should be almost empty" (Steve McDougall)
- Jeffrey Davidson: "How I Structure Every Laravel Project"
- Laravel Architects Blog: Production application architecture
- Wendell Adriel: "Laravel Route Binding Behind the Curtains"
- The Laravel Architect blog series

## Tier 3 — Production Repositories

- Laravel Framework (illuminate/routing, illuminate/http, illuminate/validation)
- Laravel Jetstream (Livewire and Inertia stacks)
- Laravel Breeze (Livewire, Inertia, Blade stacks)
- Laravel Horizon (application architecture patterns)
- Spatie Packages (laravel-data, laravel-queueable-action, laravel-typescript-transformer)
- tegos/laravel-action-and-service-guideline (production action/service reference)
- morphling-dev/3d (DDD + Hexagonal architecture framework)
- theaddresstech/laravel-modular-ddd (modular DDD production patterns)
- andrebhas/laravel-brick (modular monolith structure)
- AurnobOnWeb/laravel-ddd-module (DDD modular scaffolding)
- shahmy/laravel-ddd-toolkit (DDD scaffolding commands)
- nwidart/laravel-modules (modular monolith package)
- dhank77/ddd-modular (modular DDD toolkit)

## Tier 4 — Community Intelligence

- Reddit r/laravel: Architecture pattern debates, service vs action discussions
- GitHub Discussions: Laravel framework issues #58676 (Typed Form Requests)
- GitHub Issues: spatie/laravel-data feature requests and bug reports
- Stack Overflow: Route model binding scoping questions, middleware ordering, DTO integration
- Medium Articles (Shah Alam, Adriana Eka Prayudha, Ratheepan Jayakkumar): Production architecture guides
- DEV Community (multiple authors): Architectural pattern comparisons
- dev.to/abdasis: "Understanding Laravel DTO" (Feb 2026)
- dev.to/tegos: "Laravel Actions and Services" (Aug 2025)
- dev.to/abdulsalamamtech: "Best architectural patterns for senior Laravel developers"
- Community consensus on service/action boundaries, DTO usage thresholds, middleware best practices
