# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Exception Rendering Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Renderable Callback vs Custom Exception render() Method
* HTML vs JSON Response Based on Request Type
* Inertia vs Blade Error Rendering

---

# Architecture-Level Decision Trees

---

## Decision 1: Renderable Callback vs Custom Exception render() Method

---

## Decision Context

Whether to put response-rendering logic in the handler's `$this->renderable()` callback or directly in the exception class via the `render()` method.

---

## Decision Criteria

* Whether the rendering logic needs injected dependencies (view factory, URL generator, auth)
* Whether the exception is thrown from multiple contexts (HTTP, queue, CLI)
* Whether the rendering logic needs access to the request instance
* Whether the same rendering pattern applies to multiple exception types

---

## Decision Tree

Does the rendering logic need access to the current request (URL, headers, authentication state)?
↓
YES → Use `$this->renderable()` — the handler has access to the request; the exception doesn't
NO → Does the rendering logic need injected services (not available in exception constructor)?
    YES → Use `$this->renderable()` — handler resolves services from the container
    NO → Is the same rendering pattern reused across 2+ exception types?
        YES → Use `$this->renderable()` with a shared callable — DRY rendering across types
        NO → Use exception `render()` method — self-contained, keeps rendering with the exception

---

## Rationale

The exception's `render()` method is the simplest option — rendering logic lives with the exception. But it has no access to the request or container-resolved services. `renderable()` in the handler has full access to the framework but adds coupling to the handler file.

---

## Recommended Default

**Default:** Use exception `render()` method for self-contained responses that don't need request or service access. Use `$this->renderable()` when request data or injected services are required.
**Reason:** `render()` keeps the concern close to the exception. `renderable()` is the escape hatch for framework-dependent rendering.

---

## Risks Of Wrong Choice

* `render()` needing request data: Can't access current URL, authenticated user, or request headers
* `renderable()` for self-contained response: Unnecessary indirection — rendering logic is farther from the exception
* No rendering strategy defined: Framework returns generic error page — unhelpful for API clients

---

## Related Rules

* Custom Exception render() Method
* Error Handler Renderable Registration

---

## Related Skills

* Custom Exception with Render Method
* Exception Handler Configuration

---

---

## Decision 2: HTML vs JSON Response Based on Request Type

---

## Decision Context

How to determine whether an exception should return an HTML error page or a JSON error response, typically based on the incoming request's content negotiation.

---

## Decision Criteria

* Whether the application has both web and API routes
* Whether the request expects JSON (`$request->expectsJson()` or `Accept: application/json`)
* Whether the application uses Inertia (which sends standard requests but expects JSON)
* Whether the application is API-only (always JSON) or web-only (always HTML)

---

## Decision Tree

Is the application API-only?
↓
YES → Always return JSON — never serve HTML error pages
NO → Is the application web-only (no API routes)?
    YES → Always return HTML — simplify, no content negotiation needed
    NO → Does the request have `Accept: application/json` or `X-Requested-With: XMLHttpRequest`?
        YES → Is the application using Inertia?
            YES → Inertia sends standard `Accept: text/html` but expects error components — use Inertia-specific rendering via renderable()
            NO → Return JSON response — `$request->expectsJson()` handles this
        NO → Is the request from an API route (check route prefix or middleware)?
            YES → Return JSON — API routes should always return JSON errors
            NO → Return HTML error page — standard web request

---

## Rationale

Content negotiation via `$request->expectsJson()` handles 90% of cases correctly. The remaining 10% require explicit checks: Inertia requests (which look like HTML requests but need JSON-style error components) and API routes (which should always respond JSON regardless of Accept header).

---

## Recommended Default

**Default:** Use `$request->expectsJson()` in the handler to decide HTML vs JSON. Add Inertia-specific handling for Inertia requests.
**Reason:** `expectsJson()` is the standard Laravel pattern that correctly handles AJAX, API, and standard web requests.

---

## Risks Of Wrong Choice

* Always HTML: API clients receive HTML when they expect JSON — breaks integrations
* Always JSON: Web users see JSON error blobs instead of branded error pages
* No Inertia handling: Inertia requests get HTML instead of error components — breaks SPA UX
* Ignoring route prefix: Form submissions from web routes with JSON `Accept` header get JSON when they should get redirect

---

## Related Rules

* Error Handler Renderable Registration
* API Error Response Standardization

---

## Related Skills

* JSON Exception Response Formatting
* Implement Custom HTTP Error Pages

---

---

## Decision 3: Inertia vs Blade Error Rendering

---

## Decision Context

Whether to render exceptions using Inertia error components (for SPA-like experiences) or Blade error page templates (for traditional server-rendered apps).

---

## Decision Criteria

* Whether the application uses Inertia as its frontend stack
* Whether the error needs dynamic data from the backend (user info, navigation state)
* Whether the application has a mix of Inertia and non-Inertia routes
* Whether the team has invested in Inertia UI components vs Blade templates

---

## Decision Tree

Does the application use Inertia for frontend rendering?
↓
YES → Is the request an Inertia request (`$request->header('X-Inertia')` exists)?
    YES → Render Inertia error component via `$this->renderable()` — pass status code as component prop
    NO → Fall back to Blade template for non-Inertia requests (API, direct visits)
NO → Does the application use Blade for frontend rendering?
    YES → Use Blade error page templates `resources/views/errors/{status}.blade.php`
    NO → Is the application a hybrid (part Inertia, part Blade)?
        ↓
        YES → Check `X-Inertia` header in `renderable()` — Inertia gets component, others get Blade
        NO → Use framework defaults

---

## Rationale

Inertia error components provide a seamless SPA experience — users see the application shell with an error component instead of a full page load to a Blade template. The rendering decision must happen in the handler based on the `X-Inertia` header, not in the exception class.

---

## Recommended Default

**Default:** Blade error templates for Blade apps. Inertia error components via handler `renderable()` for Inertia apps. Hybrid apps check the `X-Inertia` header in the handler.
**Reason:** The rendering medium is determined by the frontend stack. The handler is the correct place to make this decision because it has access to the request.

---

## Risks Of Wrong Choice

* Inertia app, no Inertia error handling: Full page reload on every error — breaks SPA experience
* Blade rendering for Inertia requests: Shows Laravel default error page instead of app shell with error component
* No fallback for non-Inertia requests: Direct URL visits or API calls to Inertia app get broken responses

---

## Related Rules

* Inertia Error Response Handling
* Error Handler Renderable Registration

---

## Related Skills

* Inertia Error Component Implementation
* Implement Custom HTTP Error Pages
