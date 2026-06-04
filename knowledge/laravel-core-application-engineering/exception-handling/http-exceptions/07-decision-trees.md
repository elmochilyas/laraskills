# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** HTTP Exception Rendering
**Generated:** 2026-06-03

---

# Decision Inventory

* abort() vs Manual Response for HTTP Errors
* Custom Error Page vs renderable() Callback for HTTP Exceptions
* Forbidden (403) vs Not Found (404) for Access Control

---

# Architecture-Level Decision Trees

---

## Decision 1: abort() vs Manual Response for HTTP Errors

---

## Decision Context

Whether to trigger an HTTP error via Laravel's `abort()` helper or return a manual response (`response()->json()`, `response()->view()`) when an HTTP error condition is detected.

---

## Decision Criteria

* Whether the error should go through the centralized exception handler for consistent rendering
* Whether the response needs to vary by request type (HTML vs JSON vs Inertia)
* Whether the error is in a controller (where abort() is concise) vs a service layer (where abort() couples to HTTP)
* Whether the error needs session-flashed data (form input, error message)

---

## Decision Tree

Is the HTTP error detected at the controller or middleware layer (where HTTP context is appropriate)?
↓
YES → Does the error need to be rendered differently based on request type (HTML vs JSON vs Inertia)?
    YES → Use `abort()` or `abort_if()` — the handler manages content negotiation
    NO → Is the error simple (404, 403 with a message)?
        YES → Use `abort()` — concise, one line: `abort(404, 'Post not found.')`
        NO → Use manual response if the error needs complex response logic not supported by abort()
NO → Is the HTTP error detected in a service layer or domain class?
    YES → Throw a custom domain exception — do NOT use abort() from non-HTTP layers
    NO → Use `abort()` — keep it simple for HTTP-layer code

---

## Rationale

`abort()` throws an `HttpException` that the handler converts into the appropriate response for any request type. Manual responses bypass the handler and must handle content negotiation themselves. `abort()` should never be used outside HTTP-aware code (controllers, middleware) because it couples domain logic to the HTTP layer.

---

## Recommended Default

**Default:** Use `abort()` in controllers and middleware for HTTP errors. Throw custom exceptions from service layers. Use `abort_if()` and `abort_unless()` for conditional HTTP errors.
**Reason:** `abort()` ensures consistent rendering through the handler. Custom exceptions preserve layer separation.

---

## Risks Of Wrong Choice

* Manual response: Bypasses handler — response won't vary by request type (API client gets HTML)
* `abort()` from service layer: Couples service to HTTP — can't be used from queue or CLI
* `abort()` for redirect errors: `abort()` terminates the request — use `redirect()->back()->withErrors()`

---

## Related Rules

* Use abort() Instead of Returning Raw Error Responses
* Custom Exception for Business Rule Violations

---

## Related Skills

* Implement Custom HTTP Error Pages

---

---

## Decision 2: Custom Error Page vs renderable() Callback for HTTP Exceptions

---

## Decision Context

Whether to customize a standard HTTP error (404, 403, 500) via a Blade template file or a `renderable()` callback in the exception handler.

---

## Decision Criteria

* Whether the error response is purely presentational (branded HTML, no dynamic logic)
* Whether the error needs dynamic logic (user-specific content, API vs HTML branching)
* Whether the application uses Inertia (which needs component rendering via renderable)
* Whether the error needs non-standard HTTP headers or status codes

---

## Decision Tree

Is the error a standard HTTP status (403, 404, 429, 500, 503) that needs a branded HTML page?
↓
YES → Is the response purely presentational (layout, logo, links, no dynamic data)?
    YES → Use Blade error template `resources/views/errors/{status}.blade.php` — simplest approach
    NO → Does the response need dynamic logic (current user name, personalized suggestions)?
        YES → Use `renderable()` callback — templates can't access services or auth
        NO → Use Blade error template
NO → Is the application using Inertia?
    YES → Use `renderable()` callback to return Inertia error component
    NO → Does the error need a custom response structure (JSON shape, custom headers)?
        YES → Use `renderable()` callback for full control over the response
        NO → Use `renderable()` callback — for anything beyond a static branded page

---

## Rationale

Blade error templates auto-resolve by status code and are the simplest option. `renderable()` callbacks are necessary when the response needs dynamic data, content negotiation, or custom response structure. The choice is presentation vs logic.

---

## Recommended Default

**Default:** Blade error template for static branded error pages. `renderable()` callback for dynamic responses, Inertia rendering, or custom response structure.
**Reason:** Templates are simpler for static content. Callbacks are needed when the response requires logic.

---

## Risks Of Wrong Choice

* Template for dynamic response: Can't access user data, services, or branch by request type
* `renderable()` for static page: More code in handler than needed — template is cleaner
* No Inertia handling: Inertia requests get PHP-rendered HTML instead of SPA error component

---

## Related Rules

* Error Page Template Standardization
* Error Handler Renderable Registration

---

## Related Skills

* Implement Custom HTTP Error Pages

---

---

## Decision 3: Forbidden (403) vs Not Found (404) for Access Control

---

## Decision Context

Whether to return a 403 Forbidden or 404 Not Found when a user accesses a resource they don't have permission to view.

---

## Decision Criteria

* Whether revealing the resource's existence is a security concern (user enumeration, resource discovery)
* Whether the application prioritizes clear user feedback or information hiding
* Whether the resource type is sensitive (admin endpoints, other users' data, unpublished content)
* Whether the application has public vs private resource semantics

---

## Decision Tree

Does revealing the resource's existence create a security or privacy risk?
↓
YES → Return 404 — do not confirm the resource exists (user enumeration, unpublished content)
NO → Is the resource public or intended to be discoverable?
    YES → Return 403 — clear feedback that the resource exists but the user lacks permission
    NO → Is the resource sensitive (admin panel, payment records, other users' private data)?
        ↓
        YES → Return 404 — never confirm the existence of sensitive resources
        NO → Return 403 — the user benefits from knowing the resource exists but access is restricted

---

## Rationale

A 403 reveals "the resource exists but you can't see it." This is useful feedback for most applications but is a security risk for sensitive resources — it confirms the resource's existence to unauthorized parties. A 404 reveals nothing. The choice depends on the resource's sensitivity.

---

## Recommended Default

**Default:** Return 403 for non-sensitive resources (user has read access but not write access). Return 404 for sensitive resources (admin endpoints, other users' private data, unpublished content).
**Reason:** Clear feedback improves UX for normal access control. Information hiding protects sensitive resources from discovery.

---

## Risks Of Wrong Choice

* 403 for sensitive data: Confirms existence of admin endpoints, unpublished content, or other users' data
* 404 for all access control: Users can't distinguish "doesn't exist" from "no permission" — confusing UX
* Inconsistent approach: Users can map resource existence by comparing 403 vs 404 responses across endpoints

---

## Related Rules

* Forbidden vs Not Found for Authorization

---

## Related Skills

* Implement Custom HTTP Error Pages
