# ECC Anti-Patterns — Service Injection

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Service Injection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Injecting Entity Repositories (Coupling Presentation to Persistence)
2. @inject as Primary Data Delivery (Bypassing Controller)
3. Write/Mutation Operations in @inject Calls
4. Missing Singleton Registration (Multiple Instances)
5. @inject Inside Component Views (Hidden Component Dependencies)

---

## Repository-Wide Anti-Patterns

- Overusing @inject for Quick Fixes (Technical Debt)
- Non-Singleton Services Resolved on Every Render
- Undocumented @inject Dependencies
- Expensive Constructor Resolution in Injected Services
- @inject for Data Shared Across Many Views (Should Use Composers)

---

## Anti-Pattern 1: Injecting Entity Repositories

### Category
Architecture

### Description
Using `@inject('users', 'App\Repositories\UserRepository')` to access entity data directly from the template, coupling the presentation layer to the persistence layer.

### Why It Happens
Convenience — the template needs user data, and `@inject` saves passing it through the controller.

### Warning Signs
- `@inject` with `UserRepository`, `PostRepository`, or `OrderRepository`
- Database queries triggered from the template via injected repository methods
- Templates directly calling `$users->find()`, `$posts->recent()`, etc.
- Controller no longer passes primary data — template resolves it independently

### Preferred Alternative
Pass primary data from the controller. Reserve `@inject` for non-entity services (settings, navigation, analytics, feature flags).

### Related Rules
- Rule: Use `@inject` Only for Non-Entity, Read-Only Services

---

## Anti-Pattern 2: @inject as Primary Data Delivery

### Category
Architecture

### Description
Every template starts with 3+ `@inject` calls for the main page content data, bypassing the controller's data preparation layer entirely.

### Why It Happens
Developers find it "cleaner" to let templates resolve their own dependencies rather than passing data through controllers.

### Warning Signs
- Every view begins with multiple `@inject` calls
- Controllers only return `view('page')` with no data passed
- Data flow is invisible — can't tell what data a page needs without reading the template
- Controller tests pass but pages render with different data than expected
- Renaming or changing a service breaks templates silently

### Preferred Alternative
Pass primary page data from the controller. Use `@inject` only for auxiliary, non-entity services (settings, navigation) that are not the page's main content.

### Related Rules
- Rule: Use `@inject` Only for Non-Entity, Read-Only Services

---

## Anti-Pattern 3: Write/Mutation Operations in @inject Calls

### Category
Security | Reliability

### Description
Calling methods on injected services that perform database writes, send emails, record analytics, or mutate state from within the template.

### Why It Happens
Developers don't realize that templates can render multiple times (component re-renders, caching, partial rendering) and each render triggers the mutation.

### Warning Signs
- `{{ $analytics->recordPageView(request()->path()) }}` in a template
- `{{ $cartService->addItem($productId) }}` — side effect on render
- Double-writes, duplicate emails, or inflated analytics in production
- Template rendering triggers unexpected database changes in debug toolbar

### Preferred Alternative
Only call read-only, idempotent methods from templates. Move write operations to middleware, controllers, or event listeners.

### Related Rules
- Rule: Never Trigger Write Operations from Injected Services

---

## Anti-Pattern 4: Missing Singleton Registration

### Category
Performance

### Description
Using `@inject` with a service that is not registered as a singleton, causing a new instance to be created on every template render — and multiple instances per page if used in multiple templates.

### Why It Happens
Developers assume the container auto-resolves efficiently without understanding that each `app('Class')` call without singleton registration constructs a new instance.

### Warning Signs
- Same `@inject` service used in multiple templates on the same page
- Debug toolbar shows multiple constructor calls for the same service
- Constructor dependencies resolved repeatedly for the same service
- `@inject` in a loop creates N instances

### Preferred Alternative
Register all services used with `@inject` as singletons in a service provider: `$this->app->singleton(ServiceClass::class)`.

### Related Rules
- Rule: Register Injected Services as Singletons

---

## Anti-Pattern 5: @inject Inside Component Views

### Category
Architecture | Maintainability

### Description
Using `@inject('service', 'Class')` directly inside a component's Blade template instead of injecting the service via the component class constructor.

### Why It Happens
Developers add `@inject` to the component template for convenience without considering that component consumers have no visibility into this dependency.

### Warning Signs
- Anonymous component template contains `@inject` calls
- Class-based component view contains `@inject` instead of the class using constructor injection
- Component consumer cannot determine what services the component depends on
- Testing the component requires booting the full container

### Preferred Alternative
Use constructor injection in class-based components. For anonymous components, convert to class-based or pass data as attributes.

### Related Rules
- Rule: Do Not Use `@inject` Inside Component Views
